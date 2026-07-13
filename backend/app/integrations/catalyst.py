"""Cisco Catalyst Center "control plane" evidence.

Read-only, best-effort integration with the Cisco DevNet Always-On Catalyst Center
sandbox. It provides a *real* Cisco signal (network backbone health + device inventory
+ AI-driven assurance issues) that sits underneath the synthetic Gate 1 scenario.

Design (see docs/IMPROVEMENTS.md → "Cisco Catalyst Center integration (dual-plane)"):
- The sandbox reads ~healthy, which reinforces the narrative that the failure is
  *localized* to Gate 1 rather than a systemic backbone problem.
- This module NEVER raises into the demo loop. Every failure degrades to a cached
  last-good value and, ultimately, to "standby". It is polled on its own cadence and
  its state is read cheaply from `status()` / `context_facts()`.
- Enabled by the CATALYST_LIVE env flag. Off by default so offline/local demos never
  reach out to the internet.
"""

from __future__ import annotations

import logging
import time
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.config import get_settings

logger = logging.getLogger("eventshield.catalyst")

# Re-auth a little before the documented 1-hour token TTL.
_TOKEN_TTL_SECONDS = 50 * 60
# fail_count at/above this marks the circuit "open" in status (informational).
_CIRCUIT_THRESHOLD = 5


def _host(url: str) -> str:
    try:
        return urlparse(url).netloc or "(none)"
    except Exception:  # noqa: BLE001
        return "(invalid)"


def _extract_health_score(payload: dict[str, Any]) -> float | None:
    """Best-effort parse of /network-health across schema variants."""
    response = payload.get("response")
    if not isinstance(response, list) or not response:
        return None
    latest = response[0]
    if not isinstance(latest, dict):
        return None
    # Newer form: healthScore is a list of category dicts; prefer TOTAL.
    scores = latest.get("healthScore")
    if isinstance(scores, list) and scores:
        total = next(
            (s for s in scores if str(s.get("category", "")).upper() in {"TOTAL", "OVERALL"}),
            None,
        )
        picked = total or scores[0]
        val = picked.get("score")
        if isinstance(val, (int, float)):
            return float(val)
    # Older/flat form: a numeric score directly on the entry.
    for key in ("healthScore", "score", "overallHealth"):
        val = latest.get(key)
        if isinstance(val, (int, float)):
            return float(val)
    return None


class CatalystCenter:
    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None
        self._token: str | None = None
        self._token_at: float = 0.0
        self._fail_count = 0
        self._connected = False
        self._last_updated: float | None = None
        self._device_count: int | None = None
        self._health_score: float | None = None
        self._ai_issue_count: int | None = None
        self._top_ai_issue: str | None = None
        self._note: str = "standby"
        # Runtime override set via /api/admin/catalyst/enable|disable so the hosted
        # demo can flip Catalyst live without a redeploy. None = follow env flag.
        self._live_override: bool | None = None

    def is_live(self) -> bool:
        if self._live_override is not None:
            return self._live_override
        return get_settings().catalyst_live

    async def _ensure_client(self) -> None:
        if self._client is not None:
            return
        settings = get_settings()
        self._client = httpx.AsyncClient(
            base_url=settings.catalyst_base_url.rstrip("/"),
            timeout=settings.catalyst_timeout_seconds,
            verify=settings.catalyst_verify_ssl,
        )

    async def start(self) -> None:
        if not self.is_live():
            self._note = "disabled (CATALYST_LIVE=false)"
            return
        await self._ensure_client()
        self._note = "starting"

    async def stop(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    async def enable(self) -> dict[str, Any]:
        """Turn Catalyst live at runtime (admin-guarded). Primes an immediate poll."""
        self._live_override = True
        self._token = None
        self.reset_circuit()
        await self._ensure_client()
        self._note = "starting"
        await self.refresh()
        logger.info("Catalyst Center enabled at runtime (connected=%s)", self._connected)
        return self.status()

    async def disable(self) -> dict[str, Any]:
        self._live_override = False
        self._connected = False
        self._note = "disabled (runtime)"
        await self.stop()
        logger.info("Catalyst Center disabled at runtime")
        return self.status()

    def reset_circuit(self) -> None:
        self._fail_count = 0

    @property
    def live(self) -> bool:
        return self.is_live()

    async def _auth(self) -> str | None:
        settings = get_settings()
        if not self._client:
            return None
        now = time.monotonic()
        if self._token and (now - self._token_at) < _TOKEN_TTL_SECONDS:
            return self._token
        resp = await self._client.post(
            "/dna/system/api/v1/auth/token",
            auth=(settings.catalyst_username, settings.catalyst_password),
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()
        token = resp.json().get("Token")
        if not token:
            raise RuntimeError("auth response missing Token")
        self._token = token
        self._token_at = now
        return token

    async def _get(self, path: str) -> dict[str, Any] | None:
        """Authenticated GET with one automatic re-auth on 401."""
        if not self._client:
            return None
        token = await self._auth()
        if not token:
            return None
        resp = await self._client.get(path, headers={"X-Auth-Token": token})
        if resp.status_code == 401:
            # Token likely rotated by another sandbox user; re-auth once.
            self._token = None
            token = await self._auth()
            if not token:
                return None
            resp = await self._client.get(path, headers={"X-Auth-Token": token})
        resp.raise_for_status()
        return resp.json()

    async def refresh(self) -> None:
        """Poll the sandbox once. Never raises; updates cached state + circuit."""
        if not self.is_live():
            return
        await self._ensure_client()
        if not self._client:
            return
        try:
            health = await self._get("/dna/intent/api/v1/network-health")
            count = await self._get("/dna/intent/api/v1/network-device/count")
            issues = await self._get("/dna/intent/api/v1/issues?aiDriven=YES")

            if health is not None:
                self._health_score = _extract_health_score(health)
            if isinstance(count, dict) and isinstance(count.get("response"), int):
                self._device_count = count["response"]
            if isinstance(issues, dict):
                arr = issues.get("response")
                if isinstance(arr, list):
                    self._ai_issue_count = len(arr)
                    self._top_ai_issue = None
                    if arr and isinstance(arr[0], dict):
                        name = arr[0].get("name") or arr[0].get("issueId")
                        prio = arr[0].get("priority")
                        if name:
                            self._top_ai_issue = f"{name} ({prio})" if prio else str(name)

            self._connected = True
            self._fail_count = 0
            self._last_updated = time.time()
            self._note = "connected"
        except Exception as exc:  # noqa: BLE001 — must never break the demo
            self._fail_count += 1
            self._connected = False
            self._note = f"unreachable ({type(exc).__name__})"
            logger.warning("Catalyst Center poll failed (%s): %s", self._fail_count, exc)

    def status(self) -> dict[str, Any]:
        """Cheap, cached status for the snapshot / Evidence drawer badge."""
        settings = get_settings()
        live = self.is_live()
        return {
            "live": live,
            "connected": self._connected,
            "host": _host(settings.catalyst_base_url) if live else None,
            "device_count": self._device_count,
            "network_health_score": self._health_score,
            "ai_issue_count": self._ai_issue_count,
            "top_ai_issue": self._top_ai_issue,
            "last_updated": self._last_updated,
            "fail_count": self._fail_count,
            "circuit_open": self._fail_count >= _CIRCUIT_THRESHOLD,
            "note": self._note,
        }

    def context_facts(self) -> list[str]:
        """Real Catalyst facts for the LLM prompt (only when live + connected)."""
        if not self.live or not self._connected:
            return []
        facts: list[str] = []
        if self._health_score is not None:
            dev = f" across {self._device_count} managed devices" if self._device_count else ""
            facts.append(
                f"Cisco Catalyst Center (live): venue backbone network health "
                f"{self._health_score:.0f}/100{dev}. Backbone is not the localized problem."
            )
        if self._ai_issue_count is not None:
            if self._ai_issue_count == 0:
                facts.append(
                    "Cisco Catalyst Center reports 0 AI-driven backbone issues — the "
                    "degradation is isolated to the Gate 1 access point, not the network core."
                )
            else:
                top = f" (top: {self._top_ai_issue})" if self._top_ai_issue else ""
                facts.append(
                    f"Cisco Catalyst Center reports {self._ai_issue_count} AI-driven "
                    f"backbone issue(s){top}."
                )
        return facts


catalyst = CatalystCenter()
