"use client";

import { Panel } from "@/components/ui";
import type { ScenarioSnapshot } from "@/lib/types";

const KIND_COLOR: Record<string, string> = {
  phase: "#22a7f0",
  approval: "#8b5cf6",
  incident: "#fb5a68",
  recovery: "#34d399",
};

export function TimelineView({ snapshot }: { snapshot: ScenarioSnapshot }) {
  return (
    <Panel title="Operational Timeline" eyebrow="Detect → Understand → Recommend → Approve → Act → Verify">
      {snapshot.timeline.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-[var(--text-muted)]">
          Timeline will populate as the scenario advances.
        </p>
      ) : (
        <ol className="relative space-y-5 border-l border-[var(--border)] pl-6">
          {snapshot.timeline.map((t, i) => {
            const color = KIND_COLOR[t.kind] || "#93a1bd";
            return (
              <li key={t.id} className="relative animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <span
                  className="absolute -left-[1.72rem] top-1 h-3 w-3 rounded-full ring-4 ring-[var(--bg)]"
                  style={{ background: color, boxShadow: `0 0 10px ${color}` }}
                />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-[var(--text-dim)]">
                    {new Date(t.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                    style={{ color, borderColor: `${color}55`, background: `${color}14` }}
                  >
                    {t.kind}
                  </span>
                </div>
                <div className="mt-1 font-display text-[14px] font-bold text-[var(--text)]">{t.label}</div>
                <p className="text-[12px] text-[var(--text-muted)]">{t.detail}</p>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
