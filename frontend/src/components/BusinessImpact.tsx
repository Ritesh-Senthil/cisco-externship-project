"use client";

import { computeImpact, money } from "@/lib/businessImpact";
import { useCountUp } from "@/components/ui";
import type { MetricPoint } from "@/hooks/useEventShield";
import type { ScenarioSnapshot } from "@/lib/types";

export function BusinessImpact({ snapshot, history }: { snapshot: ScenarioSnapshot; history: MetricPoint[] }) {
  const m = computeImpact(snapshot, history);
  const risk = useCountUp(m.revenueAtRisk, 600);
  const avoided = useCountUp(m.lossAvoided, 600);
  const toneColor =
    m.tone === "critical" ? "var(--critical)" : m.tone === "watch" ? "var(--caution)" : "var(--nominal)";

  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-y border-[var(--line)] py-3">
      <div className="flex items-center gap-2">
        <span className="label">Business impact</span>
        <span
          className="rounded-full border px-2 py-px text-[10px] font-semibold"
          style={{ color: toneColor, borderColor: `${toneColor}33`, background: `${toneColor}12` }}
        >
          {m.phaseLabel}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <Metric label="Revenue at risk" value={money(risk)} tone={m.tone === "healthy" ? undefined : "critical"} />
        <Metric label="Loss avoided" value={money(avoided)} tone={m.lossAvoided > 0 ? "healthy" : undefined} />
        <Metric label="Throughput gap" value={`${m.throughputGap}/min`} tone={m.throughputGap > 0 ? "watch" : undefined} />
        <Metric label="Guests delayed" value={m.guestsDelayed.toLocaleString()} />
      </div>

      <p className="w-full text-[10px] text-[var(--ink-4)]">
        Illustrative · ${m.assumptions.valuePerGuest}/ticket · {Math.round(m.assumptions.balkRate * 100)}% abandonment at excessive waits
      </p>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "healthy" | "watch" | "critical" }) {
  const color =
    tone === "critical"
      ? "var(--critical)"
      : tone === "watch"
        ? "var(--caution)"
        : tone === "healthy"
          ? "var(--nominal)"
          : "var(--ink)";
  return (
    <div>
      <div className="label">{label}</div>
      <div className="font-mono tnum text-[16px] font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
