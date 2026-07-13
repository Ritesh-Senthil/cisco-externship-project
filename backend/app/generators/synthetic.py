"""Synthetic generators + tick loop that advances recovery and emits events."""

from __future__ import annotations

import hashlib
import random
import uuid
from typing import Any

from app.models.schemas import ScenarioPhase
from app.scenario.world import now_et, runtime


def _rng() -> random.Random:
    material = f"{runtime.seed}:{runtime.tick}:{runtime.phase.value}".encode()
    digest = hashlib.sha256(material).hexdigest()
    return random.Random(int(digest[:16], 16))


def _evt(
    *,
    source_system: str,
    source_type: str,
    asset_id: str,
    asset_type: str,
    domain: str,
    event_type: str,
    severity: str,
    metrics: dict[str, Any],
    tags: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "eventId": f"evt_{uuid.uuid4().hex[:8]}",
        "timestamp": now_et().isoformat(),
        "scenarioId": runtime.phase.value,
        "sourceSystem": source_system,
        "sourceType": source_type,
        "assetId": asset_id,
        "assetType": asset_type,
        "locationId": "gate_1",
        "domain": domain,
        "eventType": event_type,
        "severity": severity,
        "status": "active",
        "confidence": 0.98,
        "metrics": metrics,
        "tags": tags or ["gate1"],
        "synthetic": True,
    }


def _jitter(rng: random.Random, value: float, spread: float) -> float:
    return value + rng.uniform(-spread, spread)


def advance_world() -> None:
    """Advance knobs one tick. Causal story stays fixed; noise stays bounded."""
    if runtime.streams_paused:
        return

    runtime.tick += 1
    rng = _rng()
    k = runtime.knobs
    phase = runtime.phase

    if phase == ScenarioPhase.RECOVERING:
        k.recovery_progress = min(1.0, k.recovery_progress + 0.08)
        p = k.recovery_progress
        k.validation_success = 0.76 + (0.98 - 0.76) * p
        k.scanners_online = int(round(16 + (19 - 16) * p))
        k.wifi_utilization = 94.0 - (94.0 - 74.0) * p
        k.packet_loss = 7.2 - (7.2 - 1.8) * p
        k.retry_rate = 29.0 - (29.0 - 6.0) * p
        k.queue_estimate = 480 - (480 - 255) * p
        k.arrival_rate = 62.0 - (62.0 - 28.0) * p
        k.screening_lanes_open = 4
        k.staffing_status = "at_plan"
        if k.recovery_progress >= 0.95:
            from app.scenario.controller import _add_timeline, _set_phase

            _set_phase(ScenarioPhase.RESOLVED)
            _add_timeline(
                "Incident resolved",
                "Recovery verified: success↑ queue↓ wireless↓",
                "recovery",
            )

    # Bounded noise that cannot invert the story
    if phase == ScenarioPhase.PRE_OPENING:
        k.wifi_utilization = max(70.0, min(84.0, _jitter(rng, 78.0, 2.5)))
        k.validation_success = max(0.88, min(0.93, _jitter(rng, 0.91, 0.01)))
        k.queue_estimate = max(80, min(140, int(_jitter(rng, 110, 8))))
    elif phase in {ScenarioPhase.READY, ScenarioPhase.LIVE_EVENT, ScenarioPhase.FIXES_APPLIED}:
        k.wifi_utilization = max(58.0, min(78.0, _jitter(rng, k.wifi_utilization, 1.8)))
        k.validation_success = max(0.94, min(0.99, _jitter(rng, k.validation_success, 0.008)))
        k.queue_estimate = max(40, int(_jitter(rng, k.queue_estimate, 6)))
    elif phase == ScenarioPhase.INCIDENT:
        k.wifi_utilization = max(90.0, min(96.0, _jitter(rng, 94.0, 1.2)))
        k.validation_success = max(0.72, min(0.80, _jitter(rng, 0.76, 0.015)))
        k.queue_estimate = max(420, min(520, int(_jitter(rng, 480, 12))))
        k.arrival_rate = max(55.0, min(68.0, _jitter(rng, 62.0, 2.0)))
        # 2-4 scanners timing out relative to healthy 19
        k.scanners_online = rng.choice([16, 17, 16, 15])
    elif phase == ScenarioPhase.RESOLVED:
        k.wifi_utilization = max(70.0, min(78.0, _jitter(rng, 74.0, 1.5)))
        k.validation_success = max(0.96, min(0.99, _jitter(rng, 0.98, 0.005)))
        k.queue_estimate = max(200, min(280, int(_jitter(rng, 255, 10))))


def generate_events() -> list[dict[str, Any]]:
    k = runtime.knobs
    events = [
        _evt(
            source_system="cisco_wireless",
            source_type="network",
            asset_id="AP-GATE1-04",
            asset_type="wireless_access_point",
            domain="network",
            event_type="capacity.degraded" if k.wifi_utilization >= 85 else "capacity.nominal",
            severity="high" if k.wifi_utilization >= 90 else "info",
            metrics={
                "channelUtilization": round(k.wifi_utilization, 1),
                "retryRate": round(k.retry_rate, 1),
                "packetLoss": round(k.packet_loss, 1),
                "backupPathVerified": k.backup_path_verified,
            },
            tags=["gate1", "ticketing", "entry"],
        ),
        _evt(
            source_system="etix",
            source_type="ticketing",
            asset_id="SCAN-GATE1-FLEET",
            asset_type="scanner_fleet",
            domain="admission",
            event_type="validation.metrics",
            severity="high" if k.validation_success < 0.8 else "info",
            metrics={
                "scannersOnline": k.scanners_online,
                "scannersTotal": k.scanners_total,
                "validationSuccess": round(k.validation_success * 100, 1),
                "validationLatencyMs": round(k.etix_latency_ms, 0),
                "externalHealth": "healthy" if k.etix_healthy else "degraded",
            },
            tags=["gate1", "ticketing"],
        ),
        _evt(
            source_system="amtrak",
            source_type="transport",
            asset_id="AMTRAK-RGH",
            asset_type="rail_arrival",
            domain="transportation",
            event_type="arrival.update",
            severity="medium" if k.amtrak_delay_min else "info",
            metrics={
                "etaMin": k.amtrak_eta_min,
                "delayMin": k.amtrak_delay_min,
                "passengers": k.amtrak_passengers,
                "arrived": k.amtrak_arrived,
            },
            tags=["gate1", "transit"],
        ),
        _evt(
            source_system="goraleigh",
            source_type="transport",
            asset_id="SHUTTLE-FAIR-01",
            asset_type="shuttle",
            domain="transportation",
            event_type="shuttle.update",
            severity="info",
            metrics={
                "etaMin": k.shuttle_eta_min,
                "passengers": k.shuttle_passengers,
                "destination": k.shuttle_destination,
                "arrived": k.shuttle_arrived,
            },
            tags=["gate1", "transit"],
        ),
        _evt(
            source_system="gate_ops",
            source_type="operations",
            asset_id="GATE1-OPS",
            asset_type="gate",
            domain="security",
            event_type="screening.metrics",
            severity="medium" if k.screening_lanes_open < k.screening_lanes_total else "info",
            metrics={
                "lanesOpen": k.screening_lanes_open,
                "lanesTotal": k.screening_lanes_total,
                "staffing": k.staffing_status,
                "mobileScannersAvailable": k.mobile_scanners_available,
                "alternateEastReady": k.alternate_east_ready,
            },
            tags=["gate1", "screening"],
        ),
        _evt(
            source_system="crowd_analytics",
            source_type="crowd",
            asset_id="GATE1-QUEUE",
            asset_type="queue_sensor",
            domain="crowd",
            event_type="queue.metrics",
            severity="high" if k.queue_estimate > 350 else "info",
            metrics={
                "queueEstimate": int(k.queue_estimate),
                "arrivalRate": round(k.arrival_rate, 1),
                "density": round(min(1.0, k.queue_estimate / 500.0), 2),
            },
            tags=["gate1", "crowd"],
        ),
        _evt(
            source_system="communications",
            source_type="workflow",
            asset_id="SIGNAGE-HUB",
            asset_type="signage",
            domain="communications",
            event_type="comms.status",
            severity="info",
            metrics={
                "signageStatus": k.signage_status,
                "message": k.signage_message,
                "incidentRoomActive": k.incident_room_active,
            },
            tags=["gate1", "comms"],
        ),
    ]
    runtime.recent_events = (events + runtime.recent_events)[:60]
    return events
