"""Build the coalesced snapshot published to the UI."""

from __future__ import annotations

from app.engines.intelligence import correlate_incident, evaluate_readiness, preopening_plan
from app.models.schemas import (
    DomainEvent,
    ScenarioPhase,
    ScenarioSnapshot,
    TimelineEvent,
)
from app.scenario.world import runtime


def map_zone_statuses() -> dict[str, str]:
    phase = runtime.phase
    k = runtime.knobs
    healthy = "healthy"
    watch = "watch"
    critical = "critical"

    gate1 = healthy
    if phase == ScenarioPhase.PRE_OPENING:
        gate1 = watch
    elif phase in {ScenarioPhase.INCIDENT, ScenarioPhase.RECOVERING}:
        gate1 = critical if phase == ScenarioPhase.INCIDENT else watch
    elif phase == ScenarioPhase.RESOLVED:
        gate1 = healthy

    return {
        "north_parking": healthy,
        "alternate_east": healthy if k.alternate_east_ready else watch,
        "midway": healthy,
        "livestock": healthy,
        "central_fair": healthy,
        "gate_1": gate1,
        "food_zone": healthy,
        "transit_hub": gate1,
    }


def build_snapshot(advance: bool = False) -> ScenarioSnapshot:
    readiness = evaluate_readiness(advance=advance)
    incident = correlate_incident(runtime.knobs, readiness.forecast)

    # Attach pre-opening plan onto a synthetic "blocker" incident-like card via readiness only.
    # Active incident carries the live response plan.
    timeline = [
        TimelineEvent.model_validate(
            {
                "id": t["id"],
                "timestamp": t["timestamp"],
                "label": t["label"],
                "detail": t["detail"],
                "kind": t["kind"],
            }
        )
        for t in runtime.timeline
    ]

    recent = []
    for e in runtime.recent_events[:20]:
        try:
            recent.append(DomainEvent.model_validate(e))
        except Exception:  # noqa: BLE001
            continue

    demo_clock = {
        ScenarioPhase.IDLE: "Demo idle",
        ScenarioPhase.PRE_OPENING: "T-35 min to opening",
        ScenarioPhase.FIXES_APPLIED: "T-30 min · fixes applied",
        ScenarioPhase.READY: "T-25 min · ready to open",
        ScenarioPhase.LIVE_EVENT: "T+60 min · live operations",
        ScenarioPhase.INCIDENT: "T+60 min · Gate 1 incident",
        ScenarioPhase.RECOVERING: "T+60 min · recovering",
        ScenarioPhase.RESOLVED: "T+70 min · stabilized",
    }.get(runtime.phase, runtime.phase.value)

    # Expose preopening recommended actions via readiness risks; plan available on demand in API
    _ = preopening_plan

    return ScenarioSnapshot(
        phase=runtime.phase,
        streams_paused=runtime.streams_paused,
        ai_fallback=runtime.ai_fallback,
        demo_clock=demo_clock,
        readiness=readiness,
        active_incident=incident,
        timeline=timeline,
        recent_events=recent,
        map_zones=map_zone_statuses(),
    )
