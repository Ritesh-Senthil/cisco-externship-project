"use client";

import { Panel, StatusChip } from "@/components/ui";
import type { ScenarioSnapshot } from "@/lib/types";

export function GateDetail({ snapshot }: { snapshot: ScenarioSnapshot }) {
  const g = snapshot.readiness.gate;
  const f = snapshot.readiness.forecast;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Gate 1 readiness">
        <StatusChip status={snapshot.readiness.status} />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Scanners online" value={`${g.scanners_online}/${g.scanners_total}`} />
          <Stat label="Validation success" value={`${g.validation_success}%`} />
          <Stat label="Screening lanes" value={`${g.screening_lanes_open}/${g.screening_lanes_total}`} />
          <Stat label="Staffing" value={g.staffing_status.replace("_", " ")} />
          <Stat label="Wi-Fi utilization" value={`${g.wifi_utilization}%`} />
          <Stat label="Backup path" value={g.backup_path_verified ? "Verified" : "Unverified"} />
          <Stat label="Etix health" value={g.etix_healthy ? "Healthy" : "Degraded"} />
          <Stat label="Signage" value={g.signage_status} />
        </div>
      </Panel>
      <Panel title="Queue & arrivals">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Queue estimate" value={`${f.queue_estimate}`} />
          <Stat label="Predicted wait" value={`${f.predicted_wait_min} min`} />
          <Stat label="Arrival rate" value={`${f.arrival_rate}/min`} />
          <Stat label="Processing rate" value={`${f.processing_rate}/min`} />
          <Stat
            label="Amtrak"
            value={
              g.amtrak_delay_min
                ? `Delay ${g.amtrak_delay_min}m · ${g.amtrak_passengers} pax`
                : `ETA ${g.amtrak_eta_min ?? "—"}m · ${g.amtrak_passengers} pax`
            }
          />
          <Stat
            label="GoRaleigh shuttle"
            value={`ETA ${g.shuttle_eta_min ?? "—"}m → ${g.shuttle_destination.replace("_", " ")}`}
          />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
          Device 360-style drill-down for the Gate 1 transit hub. Forecast uses arrival rate minus
          effective processing rate (lanes × scanner success × network × staffing).
        </p>
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-base font-semibold capitalize text-[var(--cisco-navy)]">{value}</div>
    </div>
  );
}
