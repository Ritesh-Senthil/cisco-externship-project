"use client";

import type { ScenarioSnapshot } from "@/lib/types";

export function EvidenceDrawer({
  open,
  onClose,
  snapshot,
}: {
  open: boolean;
  onClose: () => void;
  snapshot: ScenarioSnapshot | null;
}) {
  if (!open || !snapshot) return null;
  const incident = snapshot.active_incident;
  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-[var(--border)] bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div>
          <h2 className="font-semibold text-[var(--cisco-navy)]">Dependency trace</h2>
          <p className="text-xs text-[var(--text-muted)]">Inspectable reasoning · ⌘⇧D</p>
        </div>
        <button onClick={onClose} className="rounded-md border border-[var(--border)] px-2 py-1 text-sm">
          Close
        </button>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Reasoning summary
          </h3>
          <ol className="mt-2 list-decimal space-y-2 pl-4">
            {(incident?.evidence || [
              "No active incident evidence. Domain scores and recent events still available.",
            ]).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Domain scores
          </h3>
          <ul className="mt-2 space-y-1">
            {snapshot.readiness.domain_scores.map((d) => (
              <li key={d.domain} className="flex justify-between border-b border-[var(--border)] py-1">
                <span className="capitalize">{d.domain}</span>
                <span>
                  {d.score.toFixed(0)} · {d.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Recent normalized events
          </h3>
          <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto">
            {snapshot.recent_events.slice(0, 12).map((raw, idx) => {
              const e = raw as {
                eventId?: string;
                sourceSystem?: string;
                eventType?: string;
                metrics?: Record<string, unknown>;
              };
              return (
                <li key={e.eventId || idx} className="rounded-md border border-[var(--border)] p-2 text-xs">
                  <div className="font-semibold">
                    {e.sourceSystem} · {e.eventType}
                  </div>
                  <pre className="mt-1 overflow-x-auto text-[10px] text-[var(--text-muted)]">
                    {JSON.stringify(e.metrics, null, 0)}
                  </pre>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
