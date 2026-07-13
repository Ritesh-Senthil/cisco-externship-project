"""Best-effort Postgres persistence + Redis snapshot fanout.

Design intent (see docs/IMPROVEMENTS.md #1 and design spec §17):
- Persist the important decisions (events, readiness snapshots, incidents,
  actions/approvals, AI responses, scenario state) to PostgreSQL.
- Use Redis to cache and publish the current snapshot for live fanout.

Reliability first: this layer is *best-effort and non-blocking*, mirroring the
Splunk HEC publisher. It NEVER raises into the demo loop or API handlers. If the
databases are unreachable it silently degrades and the in-memory demo keeps
running. A circuit breaker stops hammering a dead backend.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger("eventshield.store")

SNAPSHOT_KEY = "eventshield:snapshot:latest"
SNAPSHOT_CHANNEL = "eventshield:snapshot"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS events (
    id            BIGSERIAL PRIMARY KEY,
    event_id      TEXT,
    ts            TIMESTAMPTZ DEFAULT now(),
    source_system TEXT,
    domain        TEXT,
    event_type    TEXT,
    severity      TEXT,
    payload       JSONB
);
CREATE TABLE IF NOT EXISTS readiness_snapshots (
    id         BIGSERIAL PRIMARY KEY,
    ts         TIMESTAMPTZ DEFAULT now(),
    phase      TEXT,
    score      DOUBLE PRECISION,
    status     TEXT,
    confidence TEXT,
    payload    JSONB
);
CREATE TABLE IF NOT EXISTS incidents (
    incident_id TEXT PRIMARY KEY,
    ts          TIMESTAMPTZ DEFAULT now(),
    state       TEXT,
    severity    TEXT,
    summary     TEXT,
    payload     JSONB
);
CREATE TABLE IF NOT EXISTS actions (
    id        BIGSERIAL PRIMARY KEY,
    ts        TIMESTAMPTZ DEFAULT now(),
    phase     TEXT,
    plan_id   TEXT,
    decision  TEXT,
    detail    TEXT
);
CREATE TABLE IF NOT EXISTS ai_responses (
    id         BIGSERIAL PRIMARY KEY,
    ts         TIMESTAMPTZ DEFAULT now(),
    question   TEXT,
    source     TEXT,
    confidence TEXT,
    answer     TEXT
);
CREATE TABLE IF NOT EXISTS scenario_state (
    id         INT PRIMARY KEY DEFAULT 1,
    phase      TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    knobs      JSONB
);
"""


class Store:
    def __init__(self) -> None:
        self._pool: Any = None
        self._redis: Any = None
        self.pg_enabled = False
        self.redis_enabled = False
        self._pg_fail = 0
        self._redis_fail = 0

    async def start(self) -> None:
        settings = get_settings()
        if not settings.persistence_enabled:
            logger.info("Persistence disabled (PERSISTENCE_ENABLED=false).")
            return
        await self._start_pg(settings)
        await self._start_redis(settings)

    async def _start_pg(self, settings: Any) -> None:
        try:
            import asyncpg  # local import so the app runs without the driver

            dsn = settings.postgres_dsn
            self._pool = await asyncio.wait_for(
                asyncpg.create_pool(dsn, min_size=1, max_size=4, command_timeout=2.0),
                timeout=5.0,
            )
            async with self._pool.acquire() as conn:
                await conn.execute(_SCHEMA)
            self.pg_enabled = True
            logger.info("Postgres persistence connected.")
        except Exception as exc:  # noqa: BLE001 — degrade gracefully
            self.pg_enabled = False
            self._pool = None
            logger.warning("Postgres unavailable, persistence off: %s", exc)

    async def _start_redis(self, settings: Any) -> None:
        try:
            import redis.asyncio as redis  # local import

            # Upstash and other TLS Redis use rediss:// — from_url handles SSL.
            self._redis = redis.from_url(
                settings.redis_url,
                socket_timeout=2.0,
                socket_connect_timeout=3.0,
                decode_responses=False,
            )
            await asyncio.wait_for(self._redis.ping(), timeout=3.0)
            self.redis_enabled = True
            logger.info("Redis fanout connected.")
        except Exception as exc:  # noqa: BLE001
            self.redis_enabled = False
            self._redis = None
            logger.warning("Redis unavailable, fanout off: %s", exc)

    async def stop(self) -> None:
        if self._pool is not None:
            try:
                await self._pool.close()
            except Exception:  # noqa: BLE001
                pass
            self._pool = None
        if self._redis is not None:
            try:
                await self._redis.aclose()
            except Exception:  # noqa: BLE001
                pass
            self._redis = None

    # --- write paths (all best-effort) --------------------------------------

    async def persist_tick(self, events: list[dict[str, Any]], snapshot: dict[str, Any]) -> None:
        """Persist a tick's events + readiness snapshot and fan out via Redis."""
        await self._persist_events(events)
        await self._persist_snapshot(snapshot)
        await self.publish_snapshot(snapshot)

    async def _persist_events(self, events: list[dict[str, Any]]) -> None:
        if not self.pg_enabled or not self._pool or self._pg_fail >= 8:
            return
        rows = [
            (
                e.get("eventId"),
                e.get("sourceSystem"),
                e.get("domain"),
                e.get("eventType"),
                e.get("severity"),
                json.dumps(e),
            )
            for e in events
        ]
        try:
            async with self._pool.acquire() as conn:
                await conn.executemany(
                    "INSERT INTO events (event_id, source_system, domain, event_type, severity, payload)"
                    " VALUES ($1,$2,$3,$4,$5,$6::jsonb)",
                    rows,
                )
            self._pg_fail = 0
        except Exception as exc:  # noqa: BLE001
            self._pg_fail += 1
            logger.warning("event persist failed: %s", exc)

    async def _persist_snapshot(self, snapshot: dict[str, Any]) -> None:
        if not self.pg_enabled or not self._pool or self._pg_fail >= 8:
            return
        r = snapshot.get("readiness", {})
        incident = snapshot.get("active_incident")
        try:
            async with self._pool.acquire() as conn:
                await conn.execute(
                    "INSERT INTO readiness_snapshots (phase, score, status, confidence, payload)"
                    " VALUES ($1,$2,$3,$4,$5::jsonb)",
                    snapshot.get("phase"),
                    float(r.get("score", 0) or 0),
                    r.get("status"),
                    r.get("confidence"),
                    json.dumps(r),
                )
                await conn.execute(
                    "INSERT INTO scenario_state (id, phase, updated_at, knobs)"
                    " VALUES (1,$1, now(), $2::jsonb)"
                    " ON CONFLICT (id) DO UPDATE SET phase=EXCLUDED.phase,"
                    " updated_at=now(), knobs=EXCLUDED.knobs",
                    snapshot.get("phase"),
                    json.dumps(r.get("gate", {})),
                )
                if incident:
                    await conn.execute(
                        "INSERT INTO incidents (incident_id, state, severity, summary, payload)"
                        " VALUES ($1,$2,$3,$4,$5::jsonb)"
                        " ON CONFLICT (incident_id) DO UPDATE SET state=EXCLUDED.state,"
                        " severity=EXCLUDED.severity, summary=EXCLUDED.summary,"
                        " payload=EXCLUDED.payload, ts=now()",
                        incident.get("id"),
                        incident.get("state"),
                        incident.get("severity"),
                        incident.get("summary"),
                        json.dumps(incident),
                    )
            self._pg_fail = 0
        except Exception as exc:  # noqa: BLE001
            self._pg_fail += 1
            logger.warning("snapshot persist failed: %s", exc)

    async def publish_snapshot(self, snapshot: dict[str, Any]) -> None:
        if not self.redis_enabled or not self._redis or self._redis_fail >= 8:
            return
        try:
            data = json.dumps(snapshot)
            await self._redis.set(SNAPSHOT_KEY, data)
            await self._redis.publish(SNAPSHOT_CHANNEL, data)
            self._redis_fail = 0
        except Exception as exc:  # noqa: BLE001
            self._redis_fail += 1
            logger.warning("redis publish failed: %s", exc)

    async def log_action(self, phase: str, plan_id: str, decision: str, detail: str = "") -> None:
        if not self.pg_enabled or not self._pool or self._pg_fail >= 8:
            return
        try:
            async with self._pool.acquire() as conn:
                await conn.execute(
                    "INSERT INTO actions (phase, plan_id, decision, detail) VALUES ($1,$2,$3,$4)",
                    phase,
                    plan_id,
                    decision,
                    detail,
                )
            self._pg_fail = 0
        except Exception as exc:  # noqa: BLE001
            self._pg_fail += 1
            logger.warning("action log failed: %s", exc)

    async def log_ai(self, question: str, source: str, confidence: str, answer: str) -> None:
        if not self.pg_enabled or not self._pool or self._pg_fail >= 8:
            return
        try:
            async with self._pool.acquire() as conn:
                await conn.execute(
                    "INSERT INTO ai_responses (question, source, confidence, answer)"
                    " VALUES ($1,$2,$3,$4)",
                    question,
                    source,
                    confidence,
                    answer,
                )
            self._pg_fail = 0
        except Exception as exc:  # noqa: BLE001
            self._pg_fail += 1
            logger.warning("ai log failed: %s", exc)

    async def health(self) -> dict[str, Any]:
        counts: dict[str, Any] = {}
        if self.pg_enabled and self._pool:
            try:
                async with self._pool.acquire() as conn:
                    for tbl in ("events", "readiness_snapshots", "incidents", "actions", "ai_responses"):
                        counts[tbl] = await conn.fetchval(f"SELECT count(*) FROM {tbl}")
            except Exception as exc:  # noqa: BLE001
                counts["error"] = str(exc)
        from app.integrations.splunk import splunk

        return {
            "postgres_enabled": self.pg_enabled,
            "redis_enabled": self.redis_enabled,
            "pg_fail_count": self._pg_fail,
            "redis_fail_count": self._redis_fail,
            "row_counts": counts,
            **splunk.status(),
        }


store = Store()
