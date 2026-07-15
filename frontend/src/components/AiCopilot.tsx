"use client";

import clsx from "clsx";
import { Panel } from "@/components/ui";
import type { ScenarioSnapshot } from "@/lib/types";

const USE_CASES = [
  {
    id: "readiness",
    tag: "Use Case 1",
    title: "Readiness Intelligence",
    desc: "Forecasts whether the event can open by fusing marginal signals across seven domains into one verdict.",
    phases: ["idle", "pre_opening", "fixes_applied", "ready", "live_event"],
  },
  {
    id: "incident",
    tag: "Use Case 2",
    title: "Incident Copilot",
    desc: "Correlates simultaneous failures, isolates root cause, and ranks an approved-playbook response.",
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
      title="AI Copilot"
      eyebrow="Two AI use cases"
      action={
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            snapshot.ai_fallback
              ? "border-[var(--border)] text-[var(--text-muted)]"
              : "border-[rgba(52,211,153,0.4)] text-[var(--status-healthy)]",
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {snapshot.ai_fallback ? "Curated" : "Live model"}
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {USE_CASES.map((uc) => {
          const active = uc.phases.includes(snapshot.phase);
          return (
            <div
              key={uc.id}
              className={clsx(
                "rounded-xl border p-3 transition-all duration-500",
                active ? "grad-border bg-[var(--accent-soft)]" : "border-[var(--border)] bg-white/[0.02] opacity-70",
              )}
            >
              <div className="text-[9px] font-bold uppercase tracking-[0.14em] grad-text">{uc.tag}</div>
              <div className="mt-0.5 font-display text-[13px] font-bold text-[var(--text)]">{uc.title}</div>
              <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">{uc.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {questions.map((q) => (
          <button
            key={q}
            disabled={aiLoading}
            onClick={() => onAsk(q)}
            className="group flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white/[0.02] px-3 py-2 text-left text-[13px] font-medium text-[var(--text)] transition hover:border-[rgba(79,123,255,0.5)] hover:bg-[var(--accent-soft)] disabled:opacity-50"
          >
            <span className="grad-text text-sm font-bold">›</span>
            {q}
          </button>
        ))}
      </div>

      {(aiLoading || aiAnswer) && (
        <div className="mt-3 animate-fade-up rounded-xl border border-[rgba(79,123,255,0.35)] bg-[var(--accent-soft)] p-3.5">
          {aiLoading && !aiAnswer ? (
            <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
              <span className="h-2 w-2 animate-ping rounded-full bg-[var(--accent)]" />
              Reasoning over live evidence…
            </div>
          ) : aiAnswer ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] grad-text">
                  Answer · {aiAnswer.source}
                </span>
                <button onClick={onClear} className="text-[11px] text-[var(--text-dim)] hover:text-[var(--text)]">
                  Clear
                </button>
              </div>
              <div className="mt-1 text-[13px] font-semibold text-[var(--text)]">{aiAnswer.question}</div>
              <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text-muted)]">
                {aiAnswer.answer}
              </p>
            </>
          ) : null}
        </div>
      )}
    </Panel>
  );
}
