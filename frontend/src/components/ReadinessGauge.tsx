"use client";

import { useCountUp } from "@/components/ui";

const THRESHOLDS = [
  { value: 70, label: "70" },
  { value: 80, label: "80" },
  { value: 90, label: "90" },
];

function toneFor(status: string) {
  if (status === "READY_TO_OPEN") return { color: "var(--nominal)", label: "Operational" };
  if (status === "CONDITIONAL_OPEN") return { color: "var(--signal)", label: "Conditional" };
  return { color: "var(--critical)", label: "At risk" };
}

/** Signature element: horizontal threshold meter — fair safety-inspection metaphor */
export function ReadinessGauge({
  score,
  status,
  confidence,
}: {
  score: number;
  status: string;
  confidence: string;
}) {
  const animated = useCountUp(score, 700);
  const { color, label } = toneFor(status);
  const pct = Math.max(0, Math.min(100, animated));

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div
            className="font-mono tnum text-[52px] font-semibold leading-none tracking-tight"
            style={{ color }}
          >
            {Math.round(animated)}
          </div>
          <div className="mt-1 text-[13px] font-medium text-[var(--ink)]">Readiness score</div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-medium" style={{ color }}>
            {label}
          </div>
          <div className="label mt-0.5">{confidence} confidence</div>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="relative h-2 overflow-hidden rounded-full bg-[var(--deck-inset)]">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${pct}%`,
              background: color,
              transition: "width 0.7s cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          />
          {THRESHOLDS.map((t) => (
            <span
              key={t.value}
              className="absolute top-0 bottom-0 w-px bg-[var(--line-strong)]"
              style={{ left: `${t.value}%` }}
            />
          ))}
        </div>
        <div className="relative mt-1.5 h-4">
          {THRESHOLDS.map((t) => (
            <span
              key={t.value}
              className="font-mono tnum absolute -translate-x-1/2 text-[10px] text-[var(--ink-3)]"
              style={{ left: `${t.value}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
