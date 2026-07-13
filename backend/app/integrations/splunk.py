"""Splunk HTTP Event Collector publisher."""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any

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


class SplunkHEC:
    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None
        self._fail_count = 0

    async def start(self) -> None:
        settings = get_settings()
        self._client = httpx.AsyncClient(
            timeout=2.5,
            verify=settings.splunk_hec_verify_ssl,
        )

    async def stop(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    async def publish(self, events: list[dict[str, Any]]) -> None:
        settings = get_settings()
        if not settings.splunk_enabled or not self._client:
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
                settings.splunk_hec_url,
                content=body,
                headers={
                    "Authorization": f"Splunk {settings.splunk_hec_token}",
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
