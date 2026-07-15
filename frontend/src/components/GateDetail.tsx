"use client";

import { Panel, Stat, StatusChip } from "@/components/ui";
import { MiniMetric } from "@/components/LiveCharts";
import type { MetricPoint } from "@/hooks/useEventShield";
import type { ScenarioSnapshot } from "@/lib/types";

export function GateDetail({ snapshot, history }: { snapshot: ScenarioSnapshot; history: MetricPoint[] }) {
  const g = snapshot.readiness.gate;
  const f = snapshot.readiness.forecast;
  const scannerTone = g.scanners_online >= 19 ? "healthy" : g.scanners_online >= 17 ? "watch" : "critical";
  const wifiTone = g.wifi_utilization >= 90 ? "critical" : g.wifi_utilization >= 82 ? "watch" : "healthy";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-dim)]">
            Device 360 · {snapshot.demo_clock}
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--text)]">
            Gate 1 · Transit Hub
          </h1>
        </div>
        <StatusChip status={snapshot.readiness.status} size="lg" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Entry Systems" eyebrow="Ticketing & network">
          <div className="grid grid-cols-2 gap-2.5">
            <Stat label="Scanners online" value={`${g.scanners_online}/${g.scanners_total}`} tone={scannerTone} />
            <Stat label="Validation success" value={`${g.validation_success}%`} tone={g.validation_success >= 90 ? "healthy" : "critical"} />
            <Stat label="Screening lanes" value={`${g.screening_lanes_open}/${g.screening_lanes_total}`} tone={g.screening_lanes_open >= g.screening_lanes_total ? "healthy" : "watch"} />
            <Stat label="Staffing" value={g.staffing_status.replaceAll("_", " ")} tone={g.staffing_status === "at_plan" ? "healthy" : "watch"} />
            <Stat label="Wi-Fi utilization" value={`${g.wifi_utilization}%`} tone={wifiTone} />
            <Stat label="Backup path" value={g.backup_path_verified ? "Verified" : "Unverified"} tone={g.backup_path_verified ? "healthy" : "watch"} />
            <Stat label="Etix health" value={g.etix_healthy ? "Healthy" : "Degraded"} tone={g.etix_healthy ? "healthy" : "critical"} />
            <Stat label="Signage" value={g.signage_status} />
          </div>
        </Panel>

        <Panel title="Queue & Arrivals" eyebrow="Forecast engine">
          <div className="grid grid-cols-2 gap-2.5">
            <MiniMetric label="Queue" value={String(f.queue_estimate)} data={history} dataKey="queue" color="#8b5cf6" />
            <MiniMetric label="Pred. wait" value={String(f.predicted_wait_min)} unit="m" data={history} dataKey="wait" color="#22a7f0" />
            <MiniMetric label="Arrival rate" value={String(f.arrival_rate)} unit="/m" data={history} dataKey="arrival" color="#fbbf24" />
            <MiniMetric label="Processing" value={String(f.processing_rate)} unit="/m" data={history} dataKey="processing" color="#34d399" />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2.5">
            <Stat
              label="Amtrak"
              value={g.amtrak_delay_min ? `Delayed ${g.amtrak_delay_min}m` : `ETA ${g.amtrak_eta_min ?? "—"}m`}
              sub={`${g.amtrak_passengers} passengers inbound`}
              tone={g.amtrak_delay_min ? "watch" : undefined}
            />
            <Stat
              label="GoRaleigh shuttle"
              value={`ETA ${g.shuttle_eta_min ?? "—"}m`}
              sub={`→ ${g.shuttle_destination.replaceAll("_", " ")} · ${g.shuttle_passengers} pax`}
            />
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-[var(--text-muted)]">
            Forecast uses arrival rate minus effective processing rate (lanes × scanner success × network ×
            staffing). When arrivals outrun processing, predicted wait climbs before the queue does.
          </p>
        </Panel>
      </div>
    </div>
  );
}
