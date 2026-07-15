"use client";

import { Panel, SeverityDot, StatusChip, useCountUp } from "@/components/ui";
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
    <div className="space-y-4">
      {/* Row A — hero */}
      <div className="grid gap-4 xl:grid-cols-12">
        <Panel title="Event Readiness" eyebrow={snapshot.demo_clock} className="xl:col-span-4" accent>
          <div className="flex flex-col items-center">
            <ReadinessGauge score={r.score} status={r.status} confidence={r.confidence} />
            <div className="mt-3">
              <StatusChip status={r.status} size="lg" />
            </div>
            <p className="mt-4 text-center text-[13px] leading-relaxed text-[var(--text-muted)]">{r.insight}</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniStat label="Deps at risk" value={Math.round(depsAtRisk)} tone={r.critical_dependencies_at_risk > 0 ? "watch" : "healthy"} />
            <MiniStat label="Trend" value={f.trend} />
            <MiniStat label="Confidence" value={`${Math.round(f.confidence * 100)}%`} />
          </div>
        </Panel>

        <Panel title="Live Operations" eyebrow="Streaming · 1–2s" className="xl:col-span-5">
          <div className="mb-3 rounded-xl border border-[var(--border)] bg-white/[0.02] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">
                Readiness score trend
              </span>
              <span className="font-display text-sm font-bold grad-text">{Math.round(r.score)}</span>
            </div>
            <ScoreTrend data={history} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MiniMetric
              label="Queue"
              value={String(f.queue_estimate)}
              data={history}
              dataKey="queue"
              color="#8b5cf6"
            />
            <MiniMetric
              label="Pred. wait"
              value={String(f.predicted_wait_min)}
              unit="m"
              data={history}
              dataKey="wait"
              color="#22a7f0"
            />
            <MiniMetric
              label="Validation"
              value={String(r.gate.validation_success)}
              unit="%"
              data={history}
              dataKey="validation"
              color="#34d399"
              domain={[60, 100]}
            />
          </div>
        </Panel>

        <Panel title="Critical Blockers" eyebrow="Top risks" className="xl:col-span-3">
          {r.top_risks.length === 0 ? (
            <div className="flex h-full min-h-28 flex-col items-center justify-center text-center">
              <div className="grad-text font-display text-2xl font-extrabold">All clear</div>
              <p className="mt-1 text-[12px] text-[var(--text-muted)]">No cross-domain blockers detected.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {r.top_risks.map((risk) => (
                <li
                  key={risk.id}
                  className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3 transition hover:border-[var(--border-strong)]"
                >
                  <div className="flex items-center gap-2">
                    <SeverityDot severity={risk.severity} />
                    <span className="font-display text-[13px] font-bold text-[var(--text)]">{risk.title}</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-snug text-[var(--text-muted)]">{risk.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Business / financial impact */}
      <BusinessImpact snapshot={snapshot} history={history} />

      {/* Action banner */}
      {snapshot.active_incident ? (
        <button
          onClick={onIncident}
          className="grad-border animate-fade-up flex w-full items-center gap-4 rounded-2xl bg-[rgba(251,90,104,0.08)] px-5 py-4 text-left transition hover:bg-[rgba(251,90,104,0.14)]"
        >
          <span className="pulse-critical flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(251,90,104,0.2)] text-xl">
            ⚠
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--status-critical)]">
                Active Incident · {snapshot.active_incident.state}
              </span>
            </div>
            <div className="font-display text-base font-bold text-[var(--text)]">{snapshot.active_incident.title}</div>
            <p className="truncate text-[12px] text-[var(--text-muted)]">{snapshot.active_incident.summary}</p>
          </div>
          <span className="grad-text shrink-0 font-display text-sm font-bold">Open response →</span>
        </button>
      ) : showPrePlan ? (
        <div className="grad-border animate-fade-up rounded-2xl bg-[var(--accent-soft)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] grad-text">Recommended Response</div>
              <div className="font-display text-lg font-bold text-[var(--text)]">{preopeningPlan.title}</div>
              <div className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                Risk {preopeningPlan.risk} · {preopeningPlan.expected_recovery} · human approval required
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onRejectPreopening}
                className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-[13px] font-semibold text-[var(--text-muted)] transition hover:text-[var(--text)]"
              >
                Reject
              </button>
              <button
                onClick={onApprovePreopening}
                className="grad-bg rounded-lg px-5 py-2 text-[13px] font-bold text-white shadow-[var(--glow)] transition hover:brightness-110"
              >
                Approve Plan
              </button>
            </div>
          </div>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {preopeningPlan.actions
              .filter((a) => a.selected)
              .map((a, i) => (
                <li key={a.id} className="flex gap-2 rounded-lg border border-[var(--border)] bg-white/[0.02] px-3 py-2">
                  <span className="grad-text font-display text-sm font-bold">{i + 1}</span>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--text)]">{a.title}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{a.owner}</div>
                  </div>
                </li>
              ))}
          </ol>
        </div>
      ) : null}

      {/* Row B */}
      <div className="grid gap-4 xl:grid-cols-12">
        <Panel
          title="Fairgrounds Dependency Map"
          eyebrow="Event topology"
          className="xl:col-span-5"
          action={
            <button onClick={onGate} className="grad-text text-[13px] font-bold hover:underline">
              Gate 1 detail →
            </button>
          }
        >
          <FairgroundsMap snapshot={snapshot} onSelectGate={onGate} />
        </Panel>

        <div className="xl:col-span-4">
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

function MiniStat({ label, value, tone }: { label: string; value: string | number; tone?: "healthy" | "watch" }) {
  const color = tone === "watch" ? "var(--status-watch)" : tone === "healthy" ? "var(--status-healthy)" : "var(--text)";
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] px-3 py-2 text-center">
      <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">{label}</div>
      <div className="mt-0.5 font-display text-base font-bold capitalize" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
