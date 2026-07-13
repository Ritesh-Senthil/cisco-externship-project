"""Scenario state machine and presenter controls."""

from __future__ import annotations

import uuid
from datetime import datetime

from app.core.config import get_settings
from app.models.schemas import ScenarioPhase
from app.scenario.world import now_et, runtime


def _add_timeline(label: str, detail: str, kind: str = "system") -> None:
    runtime.timeline.insert(
        0,
        {
            "id": f"tl_{uuid.uuid4().hex[:8]}",
            "timestamp": now_et().isoformat(),
            "label": label,
            "detail": detail,
            "kind": kind,
        },
    )
    runtime.timeline = runtime.timeline[:40]


def _set_phase(phase: ScenarioPhase) -> None:
    runtime.phase = phase
    runtime.phase_started_at = now_et()
    runtime.score_history = []
    runtime.status_stable_count = 0
    runtime.last_status = None


def reset_demo() -> dict:
    settings = get_settings()
    runtime.reset(seed=settings.demo_seed)
    _add_timeline("Demo reset", "Scenario restored to idle.", "system")
    return {"ok": True, "phase": runtime.phase.value}


def start_preopening() -> dict:
    runtime.reset(seed=get_settings().demo_seed)
    _set_phase(ScenarioPhase.PRE_OPENING)
    k = runtime.knobs
    k.scanners_online = 17
    k.validation_success = 0.91
    k.screening_lanes_open = 3
    k.staffing_status = "below_plan"
    k.wifi_utilization = 76.0
    k.packet_loss = 2.0
    k.retry_rate = 8.0
    k.backup_path_verified = False
    k.amtrak_eta_min = 28
    k.amtrak_passengers = 310
    k.amtrak_delay_min = 0
    k.shuttle_eta_min = 40
    k.queue_estimate = 110
    k.arrival_rate = 16.0
    _add_timeline(
        "Pre-opening started",
        "T-35 minutes. Gate 1 showing cascading conditional risk.",
        "status",
    )
    return {"ok": True, "phase": runtime.phase.value}


def apply_readiness_fixes() -> dict:
    if runtime.phase not in {ScenarioPhase.PRE_OPENING, ScenarioPhase.FIXES_APPLIED}:
        start_preopening()
    _set_phase(ScenarioPhase.FIXES_APPLIED)
    k = runtime.knobs
    k.scanners_online = 19
    k.backup_path_verified = True
    k.staffing_status = "at_plan"
    k.screening_lanes_open = 4
    k.wifi_utilization = 62.0
    k.packet_loss = 1.4
    k.retry_rate = 5.0
    k.validation_success = 0.98
    k.queue_estimate = 70
    k.arrival_rate = 14.0
    k.amtrak_eta_min = 32
    runtime.applied_action_ids.update(
        {"move_scanners", "verify_backup", "assign_screening_staff"}
    )
    _add_timeline(
        "Readiness fixes applied",
        "Mobile scanners moved, backup verified, screening staff assigned.",
        "action",
    )
    return {"ok": True, "phase": runtime.phase.value}


def mark_ready() -> dict:
    if runtime.phase == ScenarioPhase.PRE_OPENING:
        apply_readiness_fixes()
    _set_phase(ScenarioPhase.READY)
    k = runtime.knobs
    k.scanners_online = 19
    k.backup_path_verified = True
    k.staffing_status = "at_plan"
    k.screening_lanes_open = 4
    k.wifi_utilization = 64.0
    _add_timeline("Ready to open", "Readiness crossed READY threshold.", "status")
    return {"ok": True, "phase": runtime.phase.value}


def advance_to_live_event() -> dict:
    if runtime.phase in {ScenarioPhase.IDLE, ScenarioPhase.PRE_OPENING}:
        apply_readiness_fixes()
        mark_ready()
    _set_phase(ScenarioPhase.LIVE_EVENT)
    runtime.demo_opened_at = now_et()
    k = runtime.knobs
    k.queue_estimate = 180
    k.arrival_rate = 24.0
    k.amtrak_eta_min = 55
    k.amtrak_delay_min = 0
    k.shuttle_eta_min = 50
    k.wifi_utilization = 72.0
    k.scanners_online = 19
    k.screening_lanes_open = 4
    k.staffing_status = "at_plan"
    k.backup_path_verified = True
    k.validation_success = 0.96
    _add_timeline("Live event", "Gates open. Operations nominal.", "status")
    return {"ok": True, "phase": runtime.phase.value}


def trigger_gate1_incident() -> dict:
    if runtime.phase not in {
        ScenarioPhase.LIVE_EVENT,
        ScenarioPhase.INCIDENT,
        ScenarioPhase.RECOVERING,
        ScenarioPhase.RESOLVED,
    }:
        advance_to_live_event()
    _set_phase(ScenarioPhase.INCIDENT)
    runtime.active_incident_id = "inc_gate1_capacity"
    runtime.incident_approved = False
    runtime.incident_rejected = False
    runtime.applied_action_ids.clear()
    k = runtime.knobs
    k.amtrak_delay_min = 25
    k.amtrak_eta_min = 2
    k.amtrak_arrived = True
    k.amtrak_passengers = 320
    k.shuttle_eta_min = 1
    k.shuttle_arrived = True
    k.shuttle_passengers = 48
    k.shuttle_destination = "gate_1"
    k.wifi_utilization = 94.0
    k.packet_loss = 7.2
    k.retry_rate = 29.0
    k.scanners_online = 16
    k.validation_success = 0.76
    k.screening_lanes_open = 3
    k.queue_estimate = 480
    k.arrival_rate = 62.0
    k.recovery_progress = 0.0
    _add_timeline(
        "Gate 1 incident",
        "Synchronized arrivals + capacity degradation at Gate 1.",
        "incident",
    )
    return {"ok": True, "phase": runtime.phase.value, "incident_id": runtime.active_incident_id}


def approve_recovery() -> dict:
    if runtime.phase != ScenarioPhase.INCIDENT:
        trigger_gate1_incident()
    runtime.incident_approved = True
    runtime.incident_rejected = False
    _set_phase(ScenarioPhase.RECOVERING)
    runtime.knobs.recovery_progress = 0.05
    runtime.knobs.incident_room_active = True
    runtime.applied_action_ids.update(
        {
            "switch_backup",
            "prioritize_validation",
            "dispatch_staff",
            "reopen_lane",
            "redirect_shuttle",
            "update_signage",
            "create_webex_room",
        }
    )
    # Immediate partial effects; generators animate the rest.
    k = runtime.knobs
    k.screening_lanes_open = 4
    k.staffing_status = "at_plan"
    k.shuttle_destination = "alternate_east"
    k.signage_message = "Overflow → Alternate East Gate"
    k.signage_status = "updated"
    _add_timeline(
        "Plan approved",
        "Director approved Gate 1 recovery plan. Actions executing.",
        "action",
    )
    return {"ok": True, "phase": runtime.phase.value}


def force_recovery() -> dict:
    approve_recovery()
    k = runtime.knobs
    k.recovery_progress = 1.0
    k.scanners_online = 19
    k.validation_success = 0.98
    k.wifi_utilization = 74.0
    k.packet_loss = 1.8
    k.retry_rate = 6.0
    k.queue_estimate = 255
    k.arrival_rate = 28.0
    k.screening_lanes_open = 4
    _set_phase(ScenarioPhase.RESOLVED)
    _add_timeline("Forced recovery", "Presenter forced full recovery state.", "recovery")
    return {"ok": True, "phase": runtime.phase.value}


def toggle_ai_fallback() -> dict:
    runtime.ai_fallback = not runtime.ai_fallback
    return {"ok": True, "ai_fallback": runtime.ai_fallback}


def pause_streams() -> dict:
    runtime.streams_paused = True
    return {"ok": True, "streams_paused": True}


def resume_streams() -> dict:
    runtime.streams_paused = False
    return {"ok": True, "streams_paused": False}


def reject_plan() -> dict:
    runtime.incident_rejected = True
    runtime.incident_approved = False
    _add_timeline("Plan rejected", "Director rejected the recommended plan.", "action")
    return {"ok": True, "rejected": True}


ADMIN_ACTIONS = {
    "reset": reset_demo,
    "start_preopening": start_preopening,
    "apply_readiness_fixes": apply_readiness_fixes,
    "mark_ready": mark_ready,
    "start_live_event": advance_to_live_event,
    "trigger_gate1_incident": trigger_gate1_incident,
    "approve_recovery": approve_recovery,
    "force_recovery": force_recovery,
    "toggle_ai_fallback": toggle_ai_fallback,
    "pause_streams": pause_streams,
    "resume_streams": resume_streams,
}
