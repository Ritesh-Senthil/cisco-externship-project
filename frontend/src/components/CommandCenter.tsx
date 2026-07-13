"use client";

import { Panel, SeverityDot, StatusChip } from "@/components/ui";
import { FairgroundsMap } from "@/components/FairgroundsMap";
import type { ResponsePlan, ScenarioSnapshot } from "@/lib/types";

export function CommandCenter({
  snapshot,
  preopeningPlan,
  onGate,
  onIncident,
  onAsk,
  onApprovePreopening,
  onRejectPreopening,
  aiLoading,
}: {
  snapshot: ScenarioSnapshot;
  preopeningPlan: ResponsePlan | null;
  onGate: () => void;
  onIncident: () => void;
  onAsk: (q: string) => void;
  onApprovePreopening: () => void;
  onRejectPreopening: () => void;
  aiLoading: boolean;
}) {
  const r = snapshot.readiness;
  const showPrePlan =
    snapshot.phase === "pre_opening" &&
    preopeningPlan &&
    !snapshot.active_incident;

  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <div className="xl:col-span-4 space-y-4">
        <Panel title="Event Readiness">
          <div className="flex items-start justify-between gap-3">
            <div>
              <StatusChip status={r.status} />
              <p className="mt-3 text-sm text-[var(--text-muted)]">{snapshot.demo_clock}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-semibold tracking-tight text-[var(--cisco-navy)]">
                {Math.round(r.score)}
              </div>
              <div className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                Health score · {r.confidence} confidence
              </div>
            </div>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--text)]">{r.insight}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Metric label="Deps at risk" value={String(r.critical_dependencies_at_risk)} />
            <Metric label="Queue" value={`${r.forecast.queue_estimate}`} />
            <Metric label="Pred. wait" value={`${r.forecast.predicted_wait_min} min`} />
            <Metric label="Trend" value={r.forecast.trend} />
          </div>
        </Panel>

        <Panel title="Critical Blockers">
          {r.top_risks.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No critical blockers.</p>
          ) : (
            <ul className="space-y-3">
              {r.top_risks.map((risk) => (
                <li key={risk.id} className="rounded-md border border-[var(--border)] p-3">
                  <div className="flex items-center gap-2">
                    <SeverityDot severity={risk.severity} />
                    <span className="font-semibold text-[var(--cisco-navy)]">{risk.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{risk.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="xl:col-span-5 space-y-4">
        <Panel
          title="Fairground Zones"
          action={
            <button
              onClick={onGate}
              className="text-sm font-semibold text-[var(--cisco-blue-deep)] hover:underline"
            >
              Open Gate 1 detail
            </button>
          }
        >
          <FairgroundsMap snapshot={snapshot} onSelectGate={onGate} />
        </Panel>

        {snapshot.active_incident && (
          <Panel
            title="Active Incident"
            action={
              <button
                onClick={onIncident}
                className="text-sm font-semibold text-[var(--cisco-blue-deep)] hover:underline"
              >
                Open response
              </button>
            }
          >
            <div className="flex items-center gap-2">
              <SeverityDot severity={snapshot.active_incident.severity} />
              <h3 className="font-semibold text-[var(--cisco-navy)]">
                {snapshot.active_incident.title}
              </h3>
              <span className="ml-auto text-xs uppercase tracking-wide text-[var(--text-muted)]">
                {snapshot.active_incident.state}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{snapshot.active_incident.summary}</p>
          </Panel>
        )}
      </div>

      <div className="xl:col-span-3 space-y-4">
        <Panel title="Suggested questions">
          <div className="flex flex-col gap-2">
            {r.suggested_questions.map((q) => (
              <button
                key={q}
                disabled={aiLoading}
                onClick={() => onAsk(q)}
                className="rounded-md border border-[var(--border)] bg-[#f7f9fb] px-3 py-2 text-left text-sm font-medium text-[var(--cisco-navy)] transition hover:border-[var(--cisco-blue)] hover:bg-white disabled:opacity-60"
              >
                {q}
              </button>
            ))}
          </div>
        </Panel>

        {showPrePlan && (
          <Panel title="Recommended response">
            <p className="text-sm text-[var(--text-muted)]">
              Risk {preopeningPlan.risk} · {preopeningPlan.expected_recovery}
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm">
              {preopeningPlan.actions
                .filter((a) => a.selected)
                .map((a) => (
                  <li key={a.id}>
                    <span className="font-medium">{a.title}</span>
                    <span className="block text-[var(--text-muted)]">{a.owner}</span>
                  </li>
                ))}
            </ol>
            <div className="mt-4 flex gap-2">
              <button
                onClick={onRejectPreopening}
                className="flex-1 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-semibold"
              >
                Reject
              </button>
              <button
                onClick={onApprovePreopening}
                className="flex-1 rounded-md bg-[var(--cisco-blue)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--cisco-blue-deep)]"
              >
                Approve Plan
              </button>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[#f7f9fb] px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
      <div className="text-lg font-semibold text-[var(--cisco-navy)]">{value}</div>
    </div>
  );
}
