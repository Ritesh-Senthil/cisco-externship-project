"use client";

import { Panel } from "@/components/ui";
import type { ScenarioSnapshot } from "@/lib/types";

const KIND_COLOR: Record<string, string> = {
  phase: "var(--ink-3)",
  approval: "var(--signal)",
  incident: "var(--critical)",
  recovery: "var(--nominal)",
};

export function TimelineView({ snapshot }: { snapshot: ScenarioSnapshot }) {
  return (
    <Panel title="Operational timeline" eyebrow="Detect → verify">
      {snapshot.timeline.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-[var(--ink-2)]">
          Timeline will populate as the scenario advances.
        </p>
      ) : (
        <ol className="relative space-y-4 border-l border-[var(--line)] pl-5">
          {snapshot.timeline.map((t, i) => {
            const color = KIND_COLOR[t.kind] || "var(--ink-3)";
            return (
              <li key={t.id} className="relative animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <span
                  className="absolute -left-[1.35rem] top-1.5 h-2 w-2 rounded-full ring-2 ring-[var(--console)]"
                  style={{ background: color }}
                />
                <div className="flex items-center gap-2">
                  <span className="font-mono tnum text-[11px] text-[var(--ink-3)]">
                    {new Date(t.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className="rounded-full border px-2 py-px text-[10px] font-medium"
                    style={{
                      color,
                      borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                    }}
                  >
                    {t.kind}
                  </span>
                </div>
                <div className="mt-0.5 text-[14px] font-medium text-[var(--ink)]">{t.label}</div>
                <p className="text-[12px] text-[var(--ink-2)]">{t.detail}</p>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
