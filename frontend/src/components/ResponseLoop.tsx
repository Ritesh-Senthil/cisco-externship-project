"use client";

import clsx from "clsx";
import type { ScenarioPhase } from "@/lib/types";

const STEPS = [
  { key: "detect", label: "Detect", desc: "Ingest cross-domain signals" },
  { key: "understand", label: "Understand", desc: "Correlate & find root cause" },
  { key: "recommend", label: "Recommend", desc: "Rank playbook actions" },
  { key: "approve", label: "Approve", desc: "Human in command" },
  { key: "act", label: "Act", desc: "Execute approved actions" },
  { key: "verify", label: "Verify", desc: "Confirm recovery" },
] as const;

// current = index in progress (-1 = none). done = number of fully completed steps.
function stateFor(phase: ScenarioPhase): { current: number; done: number } {
  switch (phase) {
    case "pre_opening":
      return { current: 2, done: 2 };
    case "fixes_applied":
      return { current: 5, done: 5 };
    case "ready":
      return { current: -1, done: 6 };
    case "live_event":
      return { current: 0, done: 0 };
    case "incident":
      return { current: 1, done: 1 };
    case "recovering":
      return { current: 4, done: 4 };
    case "resolved":
      return { current: -1, done: 6 };
    default:
      return { current: -1, done: 0 };
  }
}

export function ResponseLoop({ phase }: { phase: ScenarioPhase }) {
  const { current, done } = stateFor(phase);
  return (
    <div className="glass rounded-2xl px-4 py-3">
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
            Autonomous Response Loop
          </div>
          <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            One cross-domain judgment: <span className="text-[var(--text)]">is the event ready</span>, what&apos;s
            failing, and what to do — humans stay in command.
          </div>
        </div>
        <div className="shrink-0 rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
          Human-in-command
        </div>
      </div>
      <div className="flex items-stretch gap-1.5">
        {STEPS.map((step, i) => {
          const isDone = i < done;
          const isCurrent = i === current;
          return (
            <div key={step.key} className="flex flex-1 items-center gap-1.5">
              <div
                className={clsx(
                  "flex-1 rounded-xl border px-2.5 py-2 transition-all duration-500",
                  isCurrent && "grad-border bg-[var(--accent-soft)]",
                  isDone && !isCurrent && "border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.08)]",
                  !isDone && !isCurrent && "border-[var(--border)] bg-white/[0.02]",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={clsx(
                      "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                      isCurrent && "grad-bg text-white pulse-dot",
                      isDone && !isCurrent && "bg-[var(--status-healthy)] text-[#04140c]",
                      !isDone && !isCurrent && "border border-[var(--border-strong)] text-[var(--text-dim)]",
                    )}
                  >
                    {isDone && !isCurrent ? "✓" : i + 1}
                  </span>
                  <span
                    className={clsx(
                      "font-display text-[12px] font-bold tracking-tight",
                      isCurrent ? "text-[var(--text)]" : isDone ? "text-[var(--text)]" : "text-[var(--text-dim)]",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                <div className="mt-0.5 hidden text-[10px] leading-tight text-[var(--text-muted)] lg:block">
                  {step.desc}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={clsx(
                    "hidden h-px w-2 shrink-0 sm:block",
                    i < done ? "bg-[var(--status-healthy)]" : "bg-[var(--border)]",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
