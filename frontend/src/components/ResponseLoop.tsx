"use client";

import clsx from "clsx";
import { IconCheck } from "@/components/icons";
import type { ScenarioPhase } from "@/lib/types";

const STEPS = [
  { key: "detect", label: "Detect" },
  { key: "understand", label: "Understand" },
  { key: "recommend", label: "Recommend" },
  { key: "approve", label: "Approve" },
  { key: "act", label: "Act" },
  { key: "verify", label: "Verify" },
] as const;

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
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--line)] pb-3">
      <div className="shrink-0">
        <div className="text-[13px] font-medium text-[var(--ink)]">Response loop</div>
        <div className="label mt-0.5 max-w-xs">One cross-domain judgment — humans stay in command</div>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
        {STEPS.map((step, i) => {
          const isDone = i < done;
          const isCurrent = i === current;
          return (
            <div key={step.key} className="flex items-center gap-1">
              <div
                className={clsx(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors duration-200",
                  isCurrent && "bg-[var(--signal-weak)] text-[var(--signal-ink)]",
                  isDone && !isCurrent && "text-[var(--nominal)]",
                  !isDone && !isCurrent && "text-[var(--ink-3)]",
                )}
              >
                <span
                  className={clsx(
                    "flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-semibold",
                    isCurrent && "bg-[var(--signal)] text-white",
                    isDone && !isCurrent && "bg-[var(--nominal-weak)] text-[var(--nominal)]",
                    !isDone && !isCurrent && "border border-[var(--line)] text-[var(--ink-3)]",
                  )}
                >
                  {isDone && !isCurrent ? <IconCheck className="h-2.5 w-2.5" /> : i + 1}
                </span>
                {step.label}
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={clsx(
                    "hidden h-px w-3 sm:block",
                    i < done ? "bg-[var(--nominal)] opacity-50" : "bg-[var(--line)]",
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
