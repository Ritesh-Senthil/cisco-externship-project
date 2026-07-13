"use client";

import { Panel } from "@/components/ui";
import type { ScenarioSnapshot } from "@/lib/types";

export function TimelineView({ snapshot }: { snapshot: ScenarioSnapshot }) {
  return (
    <Panel title="Incident evidence timeline">
      {snapshot.timeline.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Timeline will populate as the scenario advances.</p>
      ) : (
        <ol className="relative space-y-4 border-l border-[var(--border)] pl-5">
          {snapshot.timeline.map((t) => (
            <li key={t.id} className="relative">
              <span className="absolute -left-[1.41rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--cisco-blue)]" />
              <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                {new Date(t.timestamp).toLocaleTimeString()} · {t.kind}
              </div>
              <div className="font-semibold text-[var(--cisco-navy)]">{t.label}</div>
              <p className="text-sm text-[var(--text-muted)]">{t.detail}</p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
