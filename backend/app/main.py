"""EventShield FastAPI application."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.ai.orchestrator import warmup
from app.api.routes import hub, router
from app.core.config import get_settings
from app.engines.snapshot import build_snapshot
from app.generators.synthetic import advance_world, generate_events
from app.integrations.splunk import splunk
from app.integrations.store import store
from app.scenario.world import runtime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eventshield")


async def demo_loop() -> None:
    """Advance synthetic world, publish events, broadcast UI snapshots."""
    while True:
        try:
            if not runtime.streams_paused and runtime.phase.value != "idle":
                advance_world()
                events = generate_events()
                await splunk.publish(events)
                # advance=True: this is the single authoritative readiness tick.
                snap = build_snapshot(advance=True)
                snap_json = snap.model_dump(mode="json")
                await hub.broadcast({"type": "snapshot", "data": snap_json})
                await store.persist_tick(events, snap_json)
            await asyncio.sleep(1.5)
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001
            logger.exception("demo_loop error")
            await asyncio.sleep(1.5)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    runtime.ai_fallback = settings.ai_fallback_default
    await splunk.start()
    await store.start()
    # Best-effort: warm the local LLM so the first live answer isn't a cold-start timeout.
    asyncio.create_task(warmup())
    task = asyncio.create_task(demo_loop())
    logger.info(
        "EventShield backend started (AI fallback=%s, pg=%s, redis=%s)",
        runtime.ai_fallback,
        store.pg_enabled,
        store.redis_enabled,
    )
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    await splunk.stop()
    await store.stop()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="EventShield", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router, prefix="/api")
    return app


app = create_app()
