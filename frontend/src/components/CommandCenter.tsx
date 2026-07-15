"use client";

import { Btn, Panel, SeverityDot, StatusChip, useCountUp } from "@/components/ui";
import { IconAlert, IconChevron } from "@/components/icons";
import { FairgroundsMap } from "@/components/FairgroundsMap";
import { ReadinessGauge } from "@/components/ReadinessGauge";
import { MiniMetric, ScoreTrend } from "@/components/LiveCharts";
import { AiCopilot } from "@/components/AiCopilot";
import { CiscoTechPanel } from "@/components/CiscoTechPanel";
import { BusinessImpact } from "@/components/BusinessImpact";
import type { MetricPoint } from "@/hooks/useEventShield";
import type { ResponsePlan, ScenarioSnapshot } from "@/lib/types";

export function CommandCenter({
  snapshot,
  preopeningPlan,
  history,
  onGate,
  onIncident,
  onAsk,
  onApprovePreopening,
  onRejectPreopening,
  aiLoading,
  aiAnswer,
  onClearAi,
}: {
  snapshot: ScenarioSnapshot;
  preopeningPlan: ResponsePlan | null;
  history: MetricPoint[];
  onGate: () => void;
  onIncident: () => void;
  onAsk: (q: string) => void;
  onApprovePreopening: () => void;
  onRejectPreopening: () => void;
  aiLoading: boolean;
  aiAnswer: { question: string; answer: string; source: string } | null;
  onClearAi: () => void;
}) {
  const r = snapshot.readiness;
  const f = r.forecast;
  const showPrePlan = snapshot.phase === "pre_opening" && preopeningPlan && !snapshot.active_incident;
  const depsAtRisk = useCountUp(r.critical_dependencies_at_risk, 500);

  return (
    <div className="space-y-5">
      {/* Hero — asymmetric: readiness dominates left, trend fills center */}
      <section className="card overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(280px,340px)_1fr]">
          <div className="border-b border-[var(--line)] p-5 lg:border-b-0 lg:border-r">
            <div className="label-caps mb-4">{snapshot.demo_clock} · Event readiness</div>
            <ReadinessGauge score={r.score} status={r.status} confidence={r.confidence} />
            <div className="mt-4 flex items-center justify-between gap-3">
              <StatusChip status={r.status} />
              <div className="text-right">
                <div className="label">Dependencies at risk</div>
                <div
                  className="font-mono tnum text-[15px] font-semibold"
                  style={{ color: r.critical_dependencies_at_risk > 0 ? "var(--caution)" : "var(--nominal)" }}
                >
                  {Math.round(depsAtRisk)}
                </div>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-[var(--ink-2)]">{r.insight}</p>
          </div>

          <div className="flex flex-col p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <div className="text-[13px] font-medium text-[var(--ink)]">Live operations</div>
                <div className="label">Streaming · 1–2s</div>
              </div>
              <div className="text-right">
                <div className="label">Trend</div>
                <div className="text-[13px] font-medium capitalize text-[var(--ink)]">{f.trend}</div>
              </div>
            </div>
            <ScoreTrend data={history} />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniMetric label="Queue" value={String(f.queue_estimate)} data={history} dataKey="queue" />
              <MiniMetric label="Pred. wait" value={String(f.predicted_wait_min)} unit="m" data={history} dataKey="wait" />
              <MiniMetric
                label="Validation"
                value={String(r.gate.validation_success)}
                unit="%"
                data={history}
                dataKey="validation"
                domain={[60, 100]}
              />
            </div>
          </div>
        </div>
      </section>

      <BusinessImpact snapshot={snapshot} history={history} />

      {/* Alerts */}
      {snapshot.active_incident ? (
        <button
          onClick={onIncident}
          className="ring-focus card animate-fade-up flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:border-[var(--line-strong)]"
          style={{ borderColor: "var(--critical-weak)", background: "var(--critical-weak)" }}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--critical)]" style={{ background: "rgba(201,74,68,0.12)" }}>
            <IconAlert />
          </span>
          <div className="min-w-0 flex-1">
            <div className="label-caps" style={{ color: "var(--critical)" }}>
              Active incident · {snapshot.active_incident.state}
            </div>
            <div className="text-[15px] font-semibold text-[var(--ink)]">{snapshot.active_incident.title}</div>
            <p className="truncate text-[12px] text-[var(--ink-2)]">{snapshot.active_incident.summary}</p>
          </div>
          <span className="flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-[var(--signal-ink)]">
            Open response <IconChevron />
          </span>
        </button>
      ) : showPrePlan ? (
        <div className="card animate-fade-up p-4" style={{ background: "var(--signal-weak)" }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="label-caps text-[var(--signal-ink)]">Recommended response</div>
              <div className="text-[16px] font-semibold text-[var(--ink)]">{preopeningPlan.title}</div>
              <div className="label mt-0.5">
                Risk {preopeningPlan.risk} · {preopeningPlan.expected_recovery} · human approval required
              </div>
            </div>
            <div className="flex gap-2">
              <Btn onClick={onRejectPreopening}>Reject</Btn>
              <Btn variant="primary" onClick={onApprovePreopening}>
                Approve plan
              </Btn>
            </div>
          </div>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {preopeningPlan.actions
              .filter((a) => a.selected)
              .map((a, i) => (
                <li key={a.id} className="well flex gap-2.5 px-3 py-2">
                  <span className="font-mono tnum text-[13px] font-semibold text-[var(--signal-ink)]">{i + 1}</span>
                  <div>
                    <div className="text-[13px] font-medium text-[var(--ink)]">{a.title}</div>
                    <div className="label">{a.owner}</div>
                  </div>
                </li>
              ))}
          </ol>
        </div>
      ) : null}

      {/* Lower band — map gets width, AI + Cisco stack on right */}
      <div className="grid gap-4 xl:grid-cols-12">
        <Panel
          title="Fairgrounds map"
          eyebrow="Event topology"
          className="xl:col-span-5"
          action={
            <button onClick={onGate} className="btn btn-ghost ring-focus h-auto px-2 py-1 text-[12px] text-[var(--signal-ink)]">
              Gate 1 detail <IconChevron className="opacity-70" />
            </button>
          }
        >
          <FairgroundsMap snapshot={snapshot} onSelectGate={onGate} />
        </Panel>

        <div className="space-y-4 xl:col-span-4">
          <Panel title="Critical blockers" eyebrow="Top risks">
            {r.top_risks.length === 0 ? (
              <p className="py-6 text-[13px] text-[var(--ink-2)]">No cross-domain blockers detected.</p>
            ) : (
              <ul className="divide-y divide-[var(--line-soft)]">
                {r.top_risks.map((risk) => (
                  <li key={risk.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <SeverityDot severity={risk.severity} />
                    <div>
                      <div className="text-[13px] font-medium text-[var(--ink)]">{risk.title}</div>
                      <p className="mt-0.5 text-[12px] leading-snug text-[var(--ink-2)]">{risk.summary}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <AiCopilot
            snapshot={snapshot}
            onAsk={onAsk}
            aiLoading={aiLoading}
            aiAnswer={aiAnswer}
            onClear={onClearAi}
          />
        </div>

        <div className="xl:col-span-3">
          <CiscoTechPanel domainScores={r.domain_scores} />
        </div>
      </div>
    </div>
  );
}
