"""Mutable synthetic world state driven by the scenario controller."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from app.models.schemas import ScenarioPhase


ET = timezone(timedelta(hours=-4))


def now_et() -> datetime:
    return datetime.now(tz=ET)


@dataclass
class WorldKnobs:
    """Authoritative knobs for generators and engines."""

    scanners_online: int = 17
    scanners_total: int = 20
    validation_success: float = 0.92
    screening_lanes_open: int = 3
    screening_lanes_total: int = 4
    staffing_status: str = "below_plan"  # below_plan | at_plan
    wifi_utilization: float = 78.0
    packet_loss: float = 2.1
    retry_rate: float = 8.0
    backup_path_verified: bool = False
    etix_healthy: bool = True
    etix_latency_ms: float = 120.0

    amtrak_eta_min: int | None = 28
    amtrak_passengers: int = 310
    amtrak_delay_min: int = 0
    amtrak_arrived: bool = False

    shuttle_eta_min: int | None = 35
    shuttle_passengers: int = 42
    shuttle_destination: str = "gate_1"
    shuttle_arrived: bool = False

    queue_estimate: int = 95
    arrival_rate: float = 18.0  # people / min
    base_lane_rate: float = 22.0  # people / min / lane

    signage_status: str = "healthy"
    signage_message: str = "All gates open"
    incident_room_active: bool = False
    mobile_scanners_available: int = 6
    alternate_east_ready: bool = True

    # Recovery animation progress 0..1 after approval
    recovery_progress: float = 0.0


@dataclass
class RuntimeState:
    phase: ScenarioPhase = ScenarioPhase.IDLE
    streams_paused: bool = False
    ai_fallback: bool = True
    seed: int = 42
    tick: int = 0
    demo_opened_at: datetime | None = None
    phase_started_at: datetime = field(default_factory=now_et)
    knobs: WorldKnobs = field(default_factory=WorldKnobs)
    active_incident_id: str | None = None
    incident_approved: bool = False
    incident_rejected: bool = False
    timeline: list[dict[str, Any]] = field(default_factory=list)
    recent_events: list[dict[str, Any]] = field(default_factory=list)
    score_history: list[float] = field(default_factory=list)
    status_stable_count: int = 0
    last_status: str | None = None
    pending_actions: list[str] = field(default_factory=list)
    applied_action_ids: set[str] = field(default_factory=set)

    def reset(self, seed: int = 42) -> None:
        self.phase = ScenarioPhase.IDLE
        self.streams_paused = False
        self.ai_fallback = True
        self.seed = seed
        self.tick = 0
        self.demo_opened_at = None
        self.phase_started_at = now_et()
        self.knobs = WorldKnobs()
        self.active_incident_id = None
        self.incident_approved = False
        self.incident_rejected = False
        self.timeline = []
        self.recent_events = []
        self.score_history = []
        self.status_stable_count = 0
        self.last_status = None
        self.pending_actions = []
        self.applied_action_ids = set()

    def clone_knobs(self) -> WorldKnobs:
        return deepcopy(self.knobs)


# Process-wide singleton for the live demo.
runtime = RuntimeState()
