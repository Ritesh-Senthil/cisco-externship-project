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
    m.tone === "critical" ? "var(--status-critical)" : m.tone === "watch" ? "var(--status-watch)" : "var(--status-healthy)";

  return (
    <div className="glass rounded-2xl px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 pr-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-dim)]">
            Business Impact
          </span>
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ color: toneColor, borderColor: `${toneColor}55`, background: `${toneColor}18` }}
          >
            {m.phaseLabel}
          </span>
        </div>

        <div className="flex flex-1 flex-wrap gap-2">
          <Kpi label="Revenue at risk" value={money(risk)} tone={m.tone === "healthy" ? undefined : "critical"} />
          <Kpi label="Loss avoided" value={money(avoided)} tone={m.lossAvoided > 0 ? "healthy" : undefined} />
          <Kpi label="Throughput gap" value={`${m.throughputGap}/min`} tone={m.throughputGap > 0 ? "watch" : undefined} />
          <Kpi label="Guests delayed" value={m.guestsDelayed.toLocaleString()} />
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-snug text-[var(--text-dim)]">
        Illustrative model on simulated data · assumes ${m.assumptions.valuePerGuest}/guest blended value (NCSF
        $16.46M ÷ 900k + on-site spend) and a {Math.round(m.assumptions.balkRate * 100)}% abandonment rate at
        excessive waits.
      </p>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "healthy" | "watch" | "critical" }) {
  const color =
    tone === "critical"
      ? "var(--status-critical)"
      : tone === "watch"
        ? "var(--status-watch)"
        : tone === "healthy"
          ? "var(--status-healthy)"
          : "var(--text)";
  return (
    <div className="min-w-[7.5rem] flex-1 rounded-xl border border-[var(--border)] bg-white/[0.02] px-3 py-2">
      <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">{label}</div>
      <div className="font-display text-lg font-extrabold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
