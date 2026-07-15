"use client";

import clsx from "clsx";
import { Panel } from "@/components/ui";
import type { ScenarioSnapshot } from "@/lib/types";

const USE_CASES = [
  {
    id: "readiness",
    tag: "Use case 1",
    title: "Event Readiness",
    desc: "Fuses marginal signals across seven domains into one opening verdict.",
    phases: ["idle", "pre_opening", "fixes_applied", "ready", "live_event"],
  },
  {
    id: "incident",
    tag: "Use case 2",
    title: "Crowd & Operations AI",
    desc: "Correlates crowd surges and operational failures into ranked playbook actions.",
    phases: ["incident", "recovering", "resolved"],
  },
];

export function AiCopilot({
  snapshot,
  onAsk,
  aiLoading,
  aiAnswer,
  onClear,
}: {
  snapshot: ScenarioSnapshot;
  onAsk: (q: string) => void;
  aiLoading: boolean;
  aiAnswer: { question: string; answer: string; source: string } | null;
  onClear: () => void;
}) {
  const questions = snapshot.readiness.suggested_questions;
  return (
    <Panel
      title="AI copilot"
      eyebrow="Two use cases"
      action={
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-medium"
          style={{ color: snapshot.ai_fallback ? "var(--ink-3)" : "var(--nominal)" }}
        >
          <span className={clsx("h-1.5 w-1.5 rounded-full bg-current", !snapshot.ai_fallback && "pulse-dot")} />
          {snapshot.ai_fallback ? "Curated" : "Live model"}
        </span>
      }
    >
      <div className="space-y-2">
        {USE_CASES.map((uc) => {
          const active = uc.phases.includes(snapshot.phase);
          return (
            <div
              key={uc.id}
              className={clsx(
                "rounded-[var(--r-sm)] border px-3 py-2.5 transition-colors",
                active ? "border-[var(--signal-line)] bg-[var(--signal-weak)]" : "border-[var(--line-soft)] opacity-55",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="label-caps" style={{ color: active ? "var(--signal-ink)" : undefined }}>
                  {uc.tag}
                </span>
                {active && <span className="text-[10px] font-medium text-[var(--signal-ink)]">Active</span>}
              </div>
              <div className="mt-0.5 text-[13px] font-medium text-[var(--ink)]">{uc.title}</div>
              <p className="mt-0.5 text-[12px] leading-snug text-[var(--ink-2)]">{uc.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 space-y-1">
        {questions.map((q) => (
          <button
            key={q}
            disabled={aiLoading}
            onClick={() => onAsk(q)}
            className="ring-focus w-full rounded-[var(--r-sm)] border border-[var(--line-soft)] px-3 py-2 text-left text-[13px] text-[var(--ink)] transition-colors hover:border-[var(--line)] hover:bg-[var(--deck-inset)] disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {(aiLoading || aiAnswer) && (
        <div className="mt-3 animate-fade-up border-t border-[var(--line-soft)] pt-3">
          {aiLoading && !aiAnswer ? (
            <div className="flex items-center gap-2 text-[13px] text-[var(--ink-2)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)] pulse-dot" />
              Reasoning over live evidence…
            </div>
          ) : aiAnswer ? (
            <>
              <div className="flex items-center justify-between">
                <span className="label">Answer · {aiAnswer.source}</span>
                <button onClick={onClear} className="text-[11px] text-[var(--ink-3)] hover:text-[var(--ink)]">
                  Clear
                </button>
              </div>
              <div className="mt-1 text-[13px] font-medium text-[var(--ink)]">{aiAnswer.question}</div>
              <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--ink-2)]">
                {aiAnswer.answer}
              </p>
            </>
          ) : null}
        </div>
      )}
    </Panel>
  );
}
