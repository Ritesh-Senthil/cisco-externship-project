"use client";

import clsx from "clsx";
import { Btn, Panel, Pill, SeverityDot, useCountUp } from "@/components/ui";
import { IconCheck } from "@/components/icons";
import { MiniMetric } from "@/components/LiveCharts";
import type { MetricPoint } from "@/hooks/useEventShield";
import type { ScenarioSnapshot } from "@/lib/types";

const STATE_STYLE: Record<string, string> = {
  ACTIVE: "text-[var(--critical)] border-[var(--critical-weak)] bg-[var(--critical-weak)]",
  STABILIZING: "text-[var(--caution)] border-[var(--caution-weak)] bg-[var(--caution-weak)]",
  RESOLVED: "text-[var(--nominal)] border-[var(--nominal-weak)] bg-[var(--nominal-weak)]",
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
      <Panel title="Active incident">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--nominal-weak)] text-[var(--nominal)]">
            <IconCheck />
          </span>
          <div className="text-[15px] font-semibold text-[var(--ink)]">No active incident</div>
          <p className="mt-1 max-w-sm text-[13px] text-[var(--ink-2)]">
            Operations nominal. Trigger the Gate 1 scenario from presenter controls (⌘⇧E).
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
          <Panel title={incident.title} eyebrow="Use case 2 · Crowd & Operations AI" accent>
            <div className="flex flex-wrap items-center gap-3">
              <SeverityDot severity={incident.severity} />
              <span
                className={clsx(
                  "ml-auto rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  STATE_STYLE[stateKey] || "border-[var(--line)] text-[var(--ink-2)]",
                )}
              >
                {incident.state}
              </span>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--ink)]">{incident.summary}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="well p-3">
                <div className="label">Likely cause</div>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-2)]">{incident.likely_cause}</p>
              </div>
              <div className="well p-3">
                <div className="label">Correlation confidence</div>
                <div className="font-mono tnum mt-1 text-[28px] font-semibold text-[var(--signal-ink)]">
                  {confidence}%
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="label">Affected dependencies</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {incident.affected_dependencies.map((d) => (
                  <Pill key={d}>{d}</Pill>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Live recovery" eyebrow="Verify">
            <div className="grid grid-cols-3 gap-2">
              <MiniMetric label="Queue" value={String(snapshot.readiness.forecast.queue_estimate)} data={history} dataKey="queue" />
              <MiniMetric label="Pred. wait" value={String(snapshot.readiness.forecast.predicted_wait_min)} unit="m" data={history} dataKey="wait" />
              <MiniMetric label="Validation" value={String(snapshot.readiness.gate.validation_success)} unit="%" data={history} dataKey="validation" domain={[60, 100]} />
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel title="Response plan" eyebrow="Approved playbook">
            {plan ? (
              <>
                <div className="flex items-center gap-2">
                  <Pill tone="accent">Risk {plan.risk}</Pill>
                  <Pill>{plan.expected_recovery}</Pill>
                </div>
                <ol className="mt-3 divide-y divide-[var(--line-soft)]">
                  {plan.actions.map((a, i) => (
                    <li key={a.id} className="flex gap-2.5 py-2.5 first:pt-0 last:pb-0">
                      <span className="font-mono tnum text-[13px] font-semibold text-[var(--signal-ink)]">{i + 1}</span>
                      <div>
                        <div className="text-[13px] font-medium text-[var(--ink)]">{a.title}</div>
                        <div className="label">
                          {a.owner} · {a.expected_impact}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 rounded-[var(--r-sm)] border border-[var(--caution-weak)] bg-[var(--caution-weak)] p-3">
                  <div className="text-[11px] font-semibold text-[var(--caution)]">Excluded by design · human-only</div>
                  <p className="mt-1 text-[11px] leading-snug text-[var(--ink-2)]">
                    CaroSHIELD never recommends gate closure, evacuation, police dispatch, emergency announcements, or
                    ride shutdown.
                  </p>
                </div>
                {pending ? (
                  <div className="mt-4 flex gap-2">
                    <Btn className="flex-1" onClick={onReject}>
                      Reject
                    </Btn>
                    <Btn className="flex-1" variant="primary" onClick={onApprove}>
                      Approve plan
                    </Btn>
                  </div>
                ) : (
                  <div
                    className={clsx(
                      "mt-4 rounded-[var(--r-sm)] border px-3 py-2 text-[13px] font-medium",
                      resolved
                        ? "border-[var(--nominal-weak)] bg-[var(--nominal-weak)] text-[var(--nominal)]"
                        : "border-[var(--line)] text-[var(--ink-2)]",
                    )}
                  >
                    Plan status: <span className="capitalize">{plan.status}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[13px] text-[var(--ink-2)]">No plan available.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
