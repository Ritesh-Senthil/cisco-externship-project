export type OpeningStatus = "READY_TO_OPEN" | "CONDITIONAL_OPEN" | "NOT_READY";

export type ScenarioPhase =
  | "idle"
  | "pre_opening"
  | "fixes_applied"
  | "ready"
  | "live_event"
  | "incident"
  | "recovering"
  | "resolved";

export interface DomainScore {
  domain: string;
  score: number;
  weight: number;
  status: string;
  notes: string[];
}

export interface RiskItem {
  id: string;
  title: string;
  severity: string;
  summary: string;
  location_id: string;
}

export interface GateMetrics {
  scanners_online: number;
  scanners_total: number;
  validation_success: number;
  screening_lanes_open: number;
  screening_lanes_total: number;
  staffing_status: string;
  wifi_utilization: number;
  backup_path_verified: boolean;
  etix_healthy: boolean;
  amtrak_eta_min: number | null;
  amtrak_passengers: number;
  amtrak_delay_min: number;
  shuttle_eta_min: number | null;
  shuttle_passengers: number;
  shuttle_destination: string;
  signage_status: string;
  incident_room_active: boolean;
}

export interface ForecastState {
  queue_estimate: number;
  arrival_rate: number;
  processing_rate: number;
  predicted_wait_min: number;
  confidence: number;
  trend: string;
}

export interface ActionItem {
  id: string;
  title: string;
  owner: string;
  risk: string;
  expected_impact: string;
  completion_seconds: number;
  selected: boolean;
}

export interface ResponsePlan {
  id: string;
  title: string;
  risk: string;
  expected_recovery: string;
  actions: ActionItem[];
  status: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: string;
  state: string;
  summary: string;
  likely_cause: string;
  affected_dependencies: string[];
  confidence: number;
  response_plan: ResponsePlan | null;
  evidence: string[];
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  label: string;
  detail: string;
  kind: string;
}

export interface ReadinessSnapshot {
  status: OpeningStatus;
  score: number;
  confidence: string;
  evaluated_at: string;
  critical_dependencies_at_risk: number;
  domain_scores: DomainScore[];
  top_risks: RiskItem[];
  gate: GateMetrics;
  forecast: ForecastState;
  insight: string;
  suggested_questions: string[];
}

export interface CatalystStatus {
  live: boolean;
  connected: boolean;
  host: string | null;
  device_count: number | null;
  network_health_score: number | null;
  ai_issue_count: number | null;
  top_ai_issue: string | null;
  last_updated: number | null;
  fail_count: number;
  circuit_open: boolean;
  note: string;
}

export interface ScenarioSnapshot {
  phase: ScenarioPhase;
  streams_paused: boolean;
  ai_fallback: boolean;
  demo_clock: string;
  readiness: ReadinessSnapshot;
  active_incident: Incident | null;
  timeline: TimelineEvent[];
  recent_events: unknown[];
  map_zones: Record<string, string>;
  catalyst?: CatalystStatus | null;
  simulated_banner: string;
}
