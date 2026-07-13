"""Splunk HTTP Event Collector publisher.

Supports env defaults plus a runtime attach override so a laptop running local
Docker Splunk can tunnel HEC to a cloud-hosted backend without redeploying.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.config import get_settings

logger = logging.getLogger("eventshield.splunk")

SOURCE_INDEX = {
    "cisco_wireless": "eventshield_network",
    "etix": "eventshield_ticketing",
    "amtrak": "eventshield_transport",
    "goraleigh": "eventshield_transport",
    "gate_ops": "eventshield_gate_ops",
    "crowd_analytics": "eventshield_crowd",
    "communications": "eventshield_workflow",
}


def _to_epoch(ts: Any) -> float | None:
    if ts is None:
        return None
    if isinstance(ts, (int, float)):
        return float(ts)
    if isinstance(ts, str):
        try:
            return datetime.fromisoformat(ts).timestamp()
        except ValueError:
            return None
    return None


def _hec_host(url: str) -> str:
    try:
        return urlparse(url).netloc or "(none)"
    except Exception:  # noqa: BLE001
        return "(invalid)"


class SplunkHEC:
    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None
        self._fail_count = 0
        # Runtime override set by /api/admin/splunk/attach (tunnel from a laptop).
        self._override: dict[str, Any] | None = None

    async def start(self) -> None:
        settings = get_settings()
        await self._rebuild_client(settings.splunk_hec_verify_ssl)

    async def stop(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    async def _rebuild_client(self, verify_ssl: bool) -> None:
        if self._client:
            await self._client.aclose()
        self._client = httpx.AsyncClient(timeout=2.5, verify=verify_ssl)

    def _effective(self) -> tuple[bool, str, str, bool]:
        """Return (enabled, hec_url, hec_token, verify_ssl)."""
        settings = get_settings()
        if self._override is not None:
            return (
                bool(self._override.get("enabled", True)),
                str(self._override["hec_url"]),
                str(self._override["hec_token"]),
                bool(self._override.get("verify_ssl", False)),
            )
        return (
            settings.splunk_enabled,
            settings.splunk_hec_url,
            settings.splunk_hec_token,
            settings.splunk_hec_verify_ssl,
        )

    async def attach(
        self,
        *,
        hec_url: str,
        hec_token: str,
        verify_ssl: bool = False,
    ) -> dict[str, Any]:
        url = hec_url.strip().rstrip("/")
        if not url.endswith("/services/collector"):
            # Accept base HEC URL or full collector path.
            if url.endswith("/services/collector/event"):
                url = url[: -len("/event")]
            else:
                url = f"{url}/services/collector"
        token = hec_token.strip() or get_settings().splunk_hec_token
        self._override = {
            "enabled": True,
            "hec_url": url,
            "hec_token": token,
            "verify_ssl": verify_ssl,
            "attached": True,
        }
        await self._rebuild_client(verify_ssl)
        self.reset_circuit()
        logger.info("Splunk HEC attached → %s", _hec_host(url))
        return self.status()

    async def detach(self) -> dict[str, Any]:
        self._override = None
        settings = get_settings()
        await self._rebuild_client(settings.splunk_hec_verify_ssl)
        self.reset_circuit()
        logger.info("Splunk HEC detached; using env defaults (enabled=%s)", settings.splunk_enabled)
        return self.status()

    def status(self) -> dict[str, Any]:
        enabled, hec_url, _token, verify_ssl = self._effective()
        return {
            "splunk_enabled": enabled,
            "splunk_attached": self._override is not None,
            "splunk_hec_host": _hec_host(hec_url) if enabled or self._override else None,
            "splunk_hec_verify_ssl": verify_ssl,
            "splunk_fail_count": self._fail_count,
            "splunk_circuit_open": self._fail_count >= 8,
        }

    async def publish(self, events: list[dict[str, Any]]) -> None:
        enabled, hec_url, hec_token, _verify = self._effective()
        if not enabled or not self._client or not events:
            return
        if self._fail_count >= 8:
            return

        payloads = []
        for event in events:
            index = SOURCE_INDEX.get(event.get("sourceSystem", ""), "eventshield_incidents")
            item: dict[str, Any] = {
                "sourcetype": "eventshield:synthetic",
                "source": event.get("sourceSystem"),
                "index": index,
                "event": event,
            }
            epoch = _to_epoch(event.get("timestamp"))
            if epoch is not None:
                item["time"] = epoch
            payloads.append(item)

        try:
            body = "\n".join(json.dumps(p) for p in payloads)
            resp = await self._client.post(
                hec_url,
                content=body,
                headers={
                    "Authorization": f"Splunk {hec_token}",
                    "Content-Type": "application/json",
                },
            )
            if resp.status_code >= 400:
                self._fail_count += 1
                logger.warning("Splunk HEC error %s: %s", resp.status_code, resp.text[:300])
            else:
                self._fail_count = 0
        except Exception as exc:  # noqa: BLE001 — must never break demo loop
            self._fail_count += 1
            logger.warning("Splunk HEC publish failed: %s", exc)

    def reset_circuit(self) -> None:
        self._fail_count = 0


splunk = SplunkHEC()
