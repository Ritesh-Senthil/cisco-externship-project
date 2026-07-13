"""Shared Pydantic models for EventShield."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ScenarioPhase(str, Enum):
    IDLE = "idle"
    PRE_OPENING = "pre_opening"
    FIXES_APPLIED = "fixes_applied"
    READY = "ready"
    LIVE_EVENT = "live_event"
    INCIDENT = "incident"
    RECOVERING = "recovering"
    RESOLVED = "resolved"


class OpeningStatus(str, Enum):
    READY_TO_OPEN = "READY_TO_OPEN"
    CONDITIONAL_OPEN = "CONDITIONAL_OPEN"
    NOT_READY = "NOT_READY"


class IncidentSeverity(str, Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentState(str, Enum):
    ACTIVE = "active"
    STABILIZING = "stabilizing"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class DomainEvent(BaseModel):
    event_id: str = Field(alias="eventId")
    timestamp: datetime
    scenario_id: str = Field(alias="scenarioId")
    source_system: str = Field(alias="sourceSystem")
    source_type: str = Field(alias="sourceType")
    asset_id: str = Field(alias="assetId")
    asset_type: str = Field(alias="assetType")
    location_id: str = Field(alias="locationId")
    domain: str
    event_type: str = Field(alias="eventType")
    severity: str
    status: str
    confidence: float
    metrics: dict[str, Any] = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)
    synthetic: bool = True

    model_config = {"populate_by_name": True}


class DomainScore(BaseModel):
    domain: str
    score: float
    weight: float
    status: str
    notes: list[str] = Field(default_factory=list)


class RiskItem(BaseModel):
    id: str
    title: str
    severity: IncidentSeverity
    summary: str
    location_id: str = "gate_1"


class ActionItem(BaseModel):
    id: str
    title: str
    owner: str
    risk: str
    expected_impact: str
    completion_seconds: int
    selected: bool = True


class ResponsePlan(BaseModel):
    id: str
    title: str
    risk: str
    expected_recovery: str
    actions: list[ActionItem]
    status: str = "pending"  # pending | approved | rejected


class Incident(BaseModel):
    id: str
    title: str
    severity: IncidentSeverity
    state: IncidentState
    summary: str
    likely_cause: str
    affected_dependencies: list[str]
    confidence: float
    response_plan: ResponsePlan | None = None
    evidence: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ForecastState(BaseModel):
    queue_estimate: int
    arrival_rate: float
    processing_rate: float
    predicted_wait_min: float
    confidence: float
    trend: str


class GateMetrics(BaseModel):
    scanners_online: int
    scanners_total: int
    validation_success: float
    screening_lanes_open: int
    screening_lanes_total: int
    staffing_status: str
    wifi_utilization: float
    backup_path_verified: bool
    etix_healthy: bool
    amtrak_eta_min: int | None
    amtrak_passengers: int
    amtrak_delay_min: int
    shuttle_eta_min: int | None
    shuttle_passengers: int
    shuttle_destination: str
    signage_status: str
    incident_room_active: bool


class ReadinessSnapshot(BaseModel):
    status: OpeningStatus
    score: float
    confidence: str
    evaluated_at: datetime
    critical_dependencies_at_risk: int
    domain_scores: list[DomainScore]
    top_risks: list[RiskItem]
    gate: GateMetrics
    forecast: ForecastState
    insight: str
    suggested_questions: list[str]


class TimelineEvent(BaseModel):
    id: str
    timestamp: datetime
    label: str
    detail: str
    kind: str  # status | incident | action | recovery | system


class CatalystStatus(BaseModel):
    """Real Cisco Catalyst Center control-plane evidence (best-effort)."""

    live: bool = False
    connected: bool = False
    host: str | None = None
    device_count: int | None = None
    network_health_score: float | None = None
    ai_issue_count: int | None = None
    top_ai_issue: str | None = None
    last_updated: float | None = None
    fail_count: int = 0
    circuit_open: bool = False
    note: str = "standby"


class ScenarioSnapshot(BaseModel):
    phase: ScenarioPhase
    streams_paused: bool
    ai_fallback: bool
    demo_clock: str
    readiness: ReadinessSnapshot
    active_incident: Incident | None
    timeline: list[TimelineEvent]
    recent_events: list[DomainEvent]
    map_zones: dict[str, str]
    catalyst: CatalystStatus | None = None
    simulated_banner: str = "Simulated data for demonstration purposes."


class AiQuestionRequest(BaseModel):
    question: str
    incident_id: str | None = None


class AiQuestionResponse(BaseModel):
    answer: str
    source: str  # "llm" | "fallback"
    evidence_refs: list[str] = Field(default_factory=list)
    confidence: str = "high"
