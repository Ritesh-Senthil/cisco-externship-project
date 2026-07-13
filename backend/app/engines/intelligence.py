"""Dependency graph, readiness, forecast, correlation, playbooks."""

from __future__ import annotations

from datetime import datetime

from app.models.schemas import (
    ActionItem,
    DomainScore,
    ForecastState,
    GateMetrics,
    Incident,
    IncidentSeverity,
    IncidentState,
    OpeningStatus,
    ReadinessSnapshot,
    ResponsePlan,
    RiskItem,
    ScenarioPhase,
)
from app.scenario.world import WorldKnobs, now_et, runtime

DOMAIN_WEIGHTS = {
    "admission": 0.30,
    "network": 0.20,
    "transportation": 0.15,
    "security": 0.15,
    "staffing": 0.10,
    "communications": 0.05,
    "weather": 0.05,
}

GATE1_DEPENDENCIES = [
    "Etix Validation",
    "Scanner Fleet",
    "Gate 1 Wireless",
    "Screening Lanes",
    "Gate Staff",
    "Crowd Queue Capacity",
    "Amtrak Arrival Demand",
    "GoRaleigh Arrival Demand",
    "Alternate East Gate",
    "Digital Signage",
]


def effective_processing_rate(k: WorldKnobs) -> float:
    scanner_factor = max(0.35, k.validation_success * (k.scanners_online / max(k.scanners_total, 1)))
    network_factor = max(0.40, 1.0 - max(0.0, (k.wifi_utilization - 70.0) / 100.0) - (k.packet_loss / 40.0))
    staffing_factor = 1.0 if k.staffing_status == "at_plan" else 0.82
    rate = (
        k.base_lane_rate
        * max(k.screening_lanes_open, 0)
        * scanner_factor
        * network_factor
        * staffing_factor
    )
    return max(rate, 4.0)


def forecast_from_knobs(k: WorldKnobs) -> ForecastState:
    proc = effective_processing_rate(k)
    wait = k.queue_estimate / proc
    delta = k.arrival_rate - proc
    if delta > 4:
        trend = "worsening"
    elif delta < -4:
        trend = "improving"
    else:
        trend = "stable"
    confidence = 0.92
    if k.wifi_utilization > 90:
        confidence -= 0.08
    if not k.etix_healthy:
        confidence -= 0.15
    return ForecastState(
        queue_estimate=int(k.queue_estimate),
        arrival_rate=round(k.arrival_rate, 1),
        processing_rate=round(proc, 1),
        predicted_wait_min=round(wait, 1),
        confidence=round(max(0.5, confidence), 2),
        trend=trend,
    )


def _domain_scores(k: WorldKnobs, phase: ScenarioPhase) -> list[DomainScore]:
    # Calibrated so Scene 1 starts ~75–80 CONDITIONAL and clears to ~90+ READY after fixes.
    admission = 35 + (k.scanners_online / k.scanners_total) * 50 + k.validation_success * 15
    if k.scanners_online < 18:
        admission -= 10
    admission = max(15.0, min(100.0, admission))

    network = 100 - max(0.0, k.wifi_utilization - 50) * 1.0 - k.packet_loss * 2.5
    if not k.backup_path_verified:
        network -= 16
    if k.wifi_utilization >= 90:
        network -= 12
    network = max(15.0, min(100.0, network))

    transport_pressure = 0.0
    if phase == ScenarioPhase.PRE_OPENING and k.amtrak_eta_min is not None and k.amtrak_eta_min <= 35:
        transport_pressure += 6
    if k.amtrak_delay_min >= 15 or k.amtrak_arrived:
        transport_pressure += 35
    if k.shuttle_arrived or (k.shuttle_eta_min is not None and k.shuttle_eta_min <= 5):
        transport_pressure += 22
    if k.shuttle_destination == "alternate_east":
        transport_pressure -= 25
    transportation = max(20.0, 97.0 - transport_pressure)

    security = 50 + (k.screening_lanes_open / max(k.screening_lanes_total, 1)) * 48
    if k.screening_lanes_open < k.screening_lanes_total:
        security -= 10

    staffing = 97.0 if k.staffing_status == "at_plan" else 64.0
    communications = 95.0 if k.signage_status in {"healthy", "updated"} else 68.0
    weather = 97.0

    # Incident phase: apply coordinated penalty so no single domain “saves” the score
    if phase == ScenarioPhase.INCIDENT:
        admission = min(admission, 62)
        network = min(network, 48)
        security = min(security, 58)
        transportation = min(transportation, 45)

    raw = {
        "admission": admission,
        "network": network,
        "transportation": transportation,
        "security": security,
        "staffing": staffing,
        "communications": communications,
        "weather": weather,
    }

    out: list[DomainScore] = []
    for domain, weight in DOMAIN_WEIGHTS.items():
        score = round(raw[domain], 1)
        status = "healthy" if score >= 85 else "watch" if score >= 70 else "at_risk"
        notes: list[str] = []
        if domain == "admission" and k.scanners_online < 18:
            notes.append(f"Scanners {k.scanners_online}/{k.scanners_total}")
        if domain == "network" and k.wifi_utilization >= 85:
            notes.append(f"Wi-Fi util {k.wifi_utilization:.0f}%")
        if domain == "network" and not k.backup_path_verified:
            notes.append("Backup path unverified")
        if domain == "security" and k.screening_lanes_open < k.screening_lanes_total:
            notes.append(f"Lanes {k.screening_lanes_open}/{k.screening_lanes_total}")
        if domain == "staffing" and k.staffing_status != "at_plan":
            notes.append("Screening staff below plan")
        if domain == "transportation" and k.amtrak_delay_min:
            notes.append(f"Amtrak delayed {k.amtrak_delay_min} min")
        out.append(DomainScore(domain=domain, score=score, weight=weight, status=status, notes=notes))
    return out


def _opening_status(score: float, hard_stop: bool, advance: bool) -> OpeningStatus:
    if hard_stop:
        return OpeningStatus.NOT_READY
    # Hysteresis via runtime counters
    if score >= 88:
        candidate = OpeningStatus.READY_TO_OPEN
    elif score >= 70:
        candidate = OpeningStatus.CONDITIONAL_OPEN
    else:
        candidate = OpeningStatus.NOT_READY

    # Only the authoritative tick advances hysteresis counters. Read-only callers
    # (REST polling, WS reconnect) must not mutate smoothing state, otherwise the
    # status would depend on how often clients poll rather than on wall-clock ticks.
    stable_count = runtime.status_stable_count
    if advance:
        if runtime.last_status == candidate.value:
            runtime.status_stable_count += 1
        else:
            runtime.status_stable_count = 1
            runtime.last_status = candidate.value
        stable_count = runtime.status_stable_count

    # Require 2 stable evaluations before leaving READY downward, except hard drops
    if (
        runtime.phase in {ScenarioPhase.READY, ScenarioPhase.LIVE_EVENT}
        and candidate != OpeningStatus.READY_TO_OPEN
        and score >= 82
        and stable_count < 2
    ):
        return OpeningStatus.READY_TO_OPEN
    return candidate


def build_gate_metrics(k: WorldKnobs) -> GateMetrics:
    return GateMetrics(
        scanners_online=k.scanners_online,
        scanners_total=k.scanners_total,
        validation_success=round(k.validation_success * 100, 1),
        screening_lanes_open=k.screening_lanes_open,
        screening_lanes_total=k.screening_lanes_total,
        staffing_status=k.staffing_status,
        wifi_utilization=round(k.wifi_utilization, 1),
        backup_path_verified=k.backup_path_verified,
        etix_healthy=k.etix_healthy,
        amtrak_eta_min=k.amtrak_eta_min,
        amtrak_passengers=k.amtrak_passengers,
        amtrak_delay_min=k.amtrak_delay_min,
        shuttle_eta_min=k.shuttle_eta_min,
        shuttle_passengers=k.shuttle_passengers,
        shuttle_destination=k.shuttle_destination,
        signage_status=k.signage_status,
        incident_room_active=k.incident_room_active,
    )


def preopening_plan() -> ResponsePlan:
    return ResponsePlan(
        id="plan_preopen_gate1",
        title="Stabilize Gate 1 before opening",
        risk="Medium",
        expected_recovery="3–8 seconds (simulated)",
        actions=[
            ActionItem(
                id="move_scanners",
                title="Move two mobile scanners to Gate 1",
                owner="Gate Ops",
                risk="Low",
                expected_impact="Scanner coverage 17/20 → 19/20",
                completion_seconds=5,
            ),
            ActionItem(
                id="verify_backup",
                title="Verify backup wireless failover",
                owner="Network Ops",
                risk="Low",
                expected_impact="Backup path Unverified → Verified",
                completion_seconds=4,
            ),
            ActionItem(
                id="assign_screening_staff",
                title="Assign two additional screening staff",
                owner="Security Ops",
                risk="Low",
                expected_impact="Staffing Below plan → At plan",
                completion_seconds=6,
            ),
            ActionItem(
                id="prep_east_gate",
                title="Prepare alternate east gate for overflow",
                owner="Fair Ops",
                risk="Low",
                expected_impact="Overflow path staged",
                completion_seconds=8,
                selected=False,
            ),
        ],
    )


def incident_plan() -> ResponsePlan:
    status = "pending"
    if runtime.incident_approved:
        status = "approved"
    elif runtime.incident_rejected:
        status = "rejected"
    return ResponsePlan(
        id="plan_gate1_incident",
        title="Restore Gate 1 entry capacity",
        risk="Medium",
        expected_recovery="8–12 minutes",
        status=status,
        actions=[
            ActionItem(
                id="switch_backup",
                title="Switch four mobile scanners to backup connectivity",
                owner="Network Ops",
                risk="Low",
                expected_impact="Reduce scanner timeouts",
                completion_seconds=20,
            ),
            ActionItem(
                id="prioritize_validation",
                title="Prioritize ticket-validation traffic",
                owner="Network Ops",
                risk="Low",
                expected_impact="Improve validation success",
                completion_seconds=15,
            ),
            ActionItem(
                id="dispatch_staff",
                title="Dispatch four additional staff",
                owner="Gate Ops",
                risk="Low",
                expected_impact="Restore processing rate",
                completion_seconds=45,
            ),
            ActionItem(
                id="reopen_lane",
                title="Reopen the closed screening lane",
                owner="Security Ops",
                risk="Low",
                expected_impact="Lanes 3/4 → 4/4",
                completion_seconds=30,
            ),
            ActionItem(
                id="redirect_shuttle",
                title="Redirect next shuttle to alternate east gate",
                owner="Transit Liaison",
                risk="Medium",
                expected_impact="Cut Gate 1 arrival pressure",
                completion_seconds=40,
            ),
            ActionItem(
                id="update_signage",
                title="Update directional signage",
                owner="Communications",
                risk="Low",
                expected_impact="Visitor redirect guidance live",
                completion_seconds=20,
            ),
            ActionItem(
                id="create_webex_room",
                title="Create simulated Webex incident room",
                owner="Fair Ops Director",
                risk="Low",
                expected_impact="Cross-team coordination channel",
                completion_seconds=10,
            ),
        ],
    )


def correlate_incident(k: WorldKnobs, forecast: ForecastState) -> Incident | None:
    if runtime.phase not in {
        ScenarioPhase.INCIDENT,
        ScenarioPhase.RECOVERING,
        ScenarioPhase.RESOLVED,
    }:
        return None

    evidence = [
        f"Arrival demand increased to ~{k.arrival_rate:.0f}/min (≈2.3× baseline).",
        f"Screening capacity dropped to {k.screening_lanes_open}/{k.screening_lanes_total} lanes.",
        f"Scanner validation success at {k.validation_success * 100:.0f}% (threshold 80%).",
        "Etix synthetic external test remained healthy — not a systemwide ticketing outage.",
        f"Local wireless utilization {k.wifi_utilization:.0f}% with elevated retries.",
        "Root cause classified as localized Gate 1 capacity degradation.",
    ]

    if runtime.phase == ScenarioPhase.RESOLVED or k.recovery_progress >= 0.95:
        state = IncidentState.RESOLVED
        severity = IncidentSeverity.MEDIUM
        summary = (
            "Gate 1 capacity has been restored. Queue and wireless metrics are returning to plan."
        )
    elif runtime.phase == ScenarioPhase.RECOVERING or runtime.incident_approved:
        state = IncidentState.STABILIZING
        severity = IncidentSeverity.HIGH
        summary = (
            "Recovery actions are in progress. Scanner success, queue length, and wireless "
            "utilization are improving."
        )
    else:
        state = IncidentState.ACTIVE
        severity = IncidentSeverity.CRITICAL
        summary = (
            "Gate 1 is experiencing a localized capacity collapse caused by synchronized "
            "transportation arrivals, reduced screening capacity, and wireless congestion. "
            "Etix cloud services are healthy, so this is not a systemwide ticketing outage."
        )

    ts = now_et()
    return Incident(
        id=runtime.active_incident_id or "inc_gate1_capacity",
        title="Gate 1 localized capacity collapse",
        severity=severity,
        state=state,
        summary=summary,
        likely_cause=(
            "Synchronized Amtrak + shuttle arrivals overlapping with degraded scanner, "
            "wireless, and screening capacity at Gate 1."
        ),
        affected_dependencies=[
            "Scanner Fleet",
            "Gate 1 Wireless",
            "Screening Lanes",
            "Amtrak Arrival Demand",
            "GoRaleigh Arrival Demand",
            "Crowd Queue Capacity",
        ],
        confidence=0.93,
        response_plan=incident_plan(),
        evidence=evidence,
        created_at=ts,
        updated_at=ts,
    )


def evaluate_readiness(advance: bool = False) -> ReadinessSnapshot:
    """Evaluate readiness.

    ``advance=True`` is the authoritative per-tick evaluation and is the only mode
    allowed to mutate the smoothing window and hysteresis counters. All read-only
    callers (REST endpoints, WS reconnect) use ``advance=False`` so that repeated
    polling cannot fast-forward the 5-sample smoothing window or the status
    hysteresis — that was previously non-deterministic w.r.t. client behavior.
    """
    k = runtime.knobs
    phase = runtime.phase
    domains = _domain_scores(k, phase)
    weighted = sum(d.score * d.weight for d in domains)
    if advance:
        runtime.score_history.append(weighted)
        runtime.score_history = runtime.score_history[-5:]
    history = runtime.score_history or [weighted]
    score = sum(history) / len(history)

    hard_stop = (not k.etix_healthy) or k.scanners_online <= 10
    status = _opening_status(score, hard_stop, advance)
    forecast = forecast_from_knobs(k)

    top_risks: list[RiskItem] = []
    if phase == ScenarioPhase.PRE_OPENING:
        top_risks = [
            RiskItem(
                id="risk_gate1_cascade",
                title="Gate 1 cascading capacity risk",
                severity=IncidentSeverity.HIGH,
                summary=(
                    "Scanner capacity, wireless headroom, backup connectivity, screening "
                    "staffing, and inbound transit demand are all marginal together."
                ),
            ),
            RiskItem(
                id="risk_backup",
                title="Backup wireless unverified",
                severity=IncidentSeverity.MEDIUM,
                summary="Failover path for Gate 1 scanners has not been verified.",
            ),
            RiskItem(
                id="risk_amtrak",
                title="Inbound Amtrak wave approaching",
                severity=IncidentSeverity.MEDIUM,
                summary=f"~{k.amtrak_passengers} passengers ETA {k.amtrak_eta_min} min.",
            ),
        ]
        insight = (
            "Gate 1 is likely to fall below required entry throughput because scanner "
            "capacity, wireless headroom, backup connectivity, screening staffing, and "
            "incoming transportation demand are all marginal at the same time."
        )
        questions = [
            "Why are we not ready?",
            "What should we fix first?",
            "What happens if we open now?",
            "Which team owns each blocker?",
        ]
    elif phase in {ScenarioPhase.INCIDENT, ScenarioPhase.RECOVERING}:
        top_risks = [
            RiskItem(
                id="risk_capacity_collapse",
                title="Gate 1 capacity collapse",
                severity=IncidentSeverity.CRITICAL,
                summary="Synchronized arrivals plus local capacity degradation.",
            ),
            RiskItem(
                id="risk_queue",
                title=f"Queue ~{int(k.queue_estimate)} / wait ~{forecast.predicted_wait_min:.0f} min",
                severity=IncidentSeverity.HIGH,
                summary="Entry wait climbing while processing rate is suppressed.",
            ),
            RiskItem(
                id="risk_wifi",
                title="Wireless congestion at Gate 1",
                severity=IncidentSeverity.HIGH,
                summary=f"Utilization {k.wifi_utilization:.0f}% with elevated retries.",
            ),
        ]
        insight = (
            "Gate 1 cannot absorb the incoming arrival wave because scanner throughput, "
            "wireless capacity, and screening capacity are degrading simultaneously."
        )
        questions = [
            "What is causing the Gate 1 delay?",
            "Is Etix down?",
            "What is the fastest safe response?",
            "Why redirect the shuttle?",
            "What happens if we do nothing?",
        ]
    elif phase == ScenarioPhase.RESOLVED:
        top_risks = []
        insight = "Gate 1 has stabilized. Recovery actions verified against live synthetic metrics."
        questions = ["Did the response work?", "What should we watch next?"]
    else:
        top_risks = []
        insight = "Event dependencies are within plan. Continue monitoring Gate 1 transit hub."
        questions = ["Are we ready?", "Which dependencies are closest to threshold?"]

    at_risk = sum(1 for d in domains if d.status == "at_risk")
    conf = "High" if forecast.confidence >= 0.85 else "Medium"

    return ReadinessSnapshot(
        status=status,
        score=round(score, 0),
        confidence=conf,
        evaluated_at=now_et(),
        critical_dependencies_at_risk=at_risk,
        domain_scores=domains,
        top_risks=top_risks[:3],
        gate=build_gate_metrics(k),
        forecast=forecast,
        insight=insight,
        suggested_questions=questions,
    )
