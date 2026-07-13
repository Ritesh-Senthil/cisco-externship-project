"use client";

import { Panel, SeverityDot } from "@/components/ui";
import type { ScenarioSnapshot } from "@/lib/types";

export function IncidentView({
  snapshot,
  onApprove,
  onReject,
}: {
  snapshot: ScenarioSnapshot;
  onApprove: () => void;
  onReject: () => void;
}) {
  const incident = snapshot.active_incident;
  if (!incident) {
    return (
      <Panel title="Active Incident">
        <p className="text-sm text-[var(--text-muted)]">No active incident. Trigger Gate 1 from the scenario controller when ready.</p>
      </Panel>
    );
  }
  const plan = incident.response_plan;
  const pending = plan?.status === "pending";

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-4">
        <Panel title="Incident summary">
          <div className="flex flex-wrap items-center gap-3">
            <SeverityDot severity={incident.severity} />
            <h3 className="text-xl font-semibold text-[var(--cisco-navy)]">{incident.title}</h3>
            <span className="rounded-md border border-[var(--border)] px-2 py-0.5 text-xs uppercase tracking-wide">
              {incident.state}
            </span>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed">{incident.summary}</p>
          <div className="mt-4 rounded-md bg-[#f7f9fb] p-3 text-sm">
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Likely cause</div>
            <p className="mt-1">{incident.likely_cause}</p>
          </div>
          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              Affected dependencies
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {incident.affected_dependencies.map((d) => (
                <span key={d} className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-medium">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </Panel>
      </div>
      <div className="lg:col-span-2">
        <Panel title="Response plan">
          {plan ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span>Risk: <strong>{plan.risk}</strong></span>
                <span>Expected recovery: <strong>{plan.expected_recovery}</strong></span>
              </div>
              <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm">
                {plan.actions.map((a) => (
                  <li key={a.id}>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-[var(--text-muted)]">{a.owner} · {a.expected_impact}</div>
                  </li>
                ))}
              </ol>
              {pending ? (
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={onReject}
                    className="flex-1 rounded-md border border-[var(--border)] px-3 py-2.5 text-sm font-semibold"
                  >
                    Reject
                  </button>
                  <button
                    onClick={onApprove}
                    className="flex-1 rounded-md bg-[var(--cisco-blue)] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[var(--cisco-blue-deep)]"
                  >
                    Approve Plan
                  </button>
                </div>
              ) : (
                <p className="mt-5 rounded-md border border-[var(--border)] bg-[#f7f9fb] px-3 py-2 text-sm">
                  Plan status: <strong className="capitalize">{plan.status}</strong>
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No plan available.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
