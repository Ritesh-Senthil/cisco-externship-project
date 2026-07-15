"use client";

import clsx from "clsx";
import { Panel, Pill, SeverityDot, useCountUp } from "@/components/ui";
import { MiniMetric } from "@/components/LiveCharts";
import type { MetricPoint } from "@/hooks/useEventShield";
import type { ScenarioSnapshot } from "@/lib/types";

const STATE_STYLE: Record<string, string> = {
  ACTIVE: "text-[var(--status-critical)] border-[rgba(251,90,104,0.4)] bg-[rgba(251,90,104,0.12)]",
  STABILIZING: "text-[var(--status-watch)] border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.12)]",
  RESOLVED: "text-[var(--status-healthy)] border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.12)]",
};

export function IncidentView({
  snapshot,
  history,
  onApprove,
  onReject,
}: {
  snapshot: ScenarioSnapshot;
  history: MetricPoint[];
  onApprove: () => void;
  onReject: () => void;
}) {
  const incident = snapshot.active_incident;
  const confidence = useCountUp(incident ? Math.round(incident.confidence * 100) : 0, 600);

  if (!incident) {
    return (
      <Panel title="Active Incident">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-strong)] text-xl text-[var(--status-healthy)]">
            ✓
          </div>
          <div className="font-display text-lg font-bold text-[var(--text)]">No active incident</div>
          <p className="mt-1 max-w-sm text-[13px] text-[var(--text-muted)]">
            Operations nominal. Trigger the Gate 1 scenario from the presenter controls (⌘⇧E) to see the
            Incident Copilot correlate a live disruption.
          </p>
        </div>
      </Panel>
    );
  }

  const plan = incident.response_plan;
  const pending = plan?.status === "pending";
  const stateKey = incident.state.toUpperCase();
  const resolved = stateKey === "RESOLVED";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Panel title="Incident Summary" eyebrow="Use Case 2 · Incident Copilot" accent>
            <div className="flex flex-wrap items-center gap-3">
              <SeverityDot severity={incident.severity} />
              <h3 className="font-display text-xl font-extrabold tracking-tight text-[var(--text)]">
                {incident.title}
              </h3>
              <span
                className={clsx(
                  "ml-auto rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em]",
                  STATE_STYLE[stateKey] || "border-[var(--border)] text-[var(--text-muted)]",
                )}
              >
                {incident.state}
              </span>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--text)]">{incident.summary}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">
                  Likely cause
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-muted)]">{incident.likely_cause}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">
                  Correlation confidence
                </div>
                <div className="mt-1 font-display text-3xl font-extrabold grad-text">{confidence}%</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">
                Affected dependencies
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {incident.affected_dependencies.map((d) => (
                  <Pill key={d}>{d}</Pill>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Live Recovery" eyebrow="Verify">
            <div className="grid grid-cols-3 gap-2.5">
              <MiniMetric label="Queue" value={String(snapshot.readiness.forecast.queue_estimate)} data={history} dataKey="queue" color="#8b5cf6" />
              <MiniMetric label="Pred. wait" value={String(snapshot.readiness.forecast.predicted_wait_min)} unit="m" data={history} dataKey="wait" color="#22a7f0" />
              <MiniMetric label="Validation" value={String(snapshot.readiness.gate.validation_success)} unit="%" data={history} dataKey="validation" color="#34d399" domain={[60, 100]} />
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel title="Response Plan" eyebrow="Approved playbook">
            {plan ? (
              <>
                <div className="flex items-center gap-2">
                  <Pill tone="accent">Risk {plan.risk}</Pill>
                  <Pill>{plan.expected_recovery}</Pill>
                </div>
                <ol className="mt-4 space-y-2">
                  {plan.actions.map((a, i) => (
                    <li key={a.id} className="flex gap-2.5 rounded-xl border border-[var(--border)] bg-white/[0.02] p-3">
                      <span className="grad-text font-display text-sm font-bold">{i + 1}</span>
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--text)]">{a.title}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {a.owner} · {a.expected_impact}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 rounded-xl border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.06)] p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-watch)]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--status-watch)]">
                      Excluded by design · human-only
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">
                    CaroSHIELD never recommends gate closure, evacuation, police dispatch, emergency announcements, or
                    ride shutdown. Safety-critical decisions stay with human commanders.
                  </p>
                </div>
                {pending ? (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={onReject}
                      className="flex-1 rounded-lg border border-[var(--border-strong)] px-3 py-2.5 text-[13px] font-semibold text-[var(--text-muted)] transition hover:text-[var(--text)]"
                    >
                      Reject
                    </button>
                    <button
                      onClick={onApprove}
                      className="grad-bg flex-1 rounded-lg px-3 py-2.5 text-[13px] font-bold text-white shadow-[var(--glow)] transition hover:brightness-110"
                    >
                      Approve Plan
                    </button>
                  </div>
                ) : (
                  <div
                    className={clsx(
                      "mt-5 rounded-xl border px-3 py-2.5 text-[13px] font-semibold",
                      resolved
                        ? "border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.1)] text-[var(--status-healthy)]"
                        : "border-[var(--border)] bg-white/[0.02] text-[var(--text-muted)]",
                    )}
                  >
                    Plan status: <span className="capitalize">{plan.status}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[13px] text-[var(--text-muted)]">No plan available.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
