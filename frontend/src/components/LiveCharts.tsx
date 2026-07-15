"use client";

import { Area, AreaChart, Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import type { MetricPoint } from "@/hooks/useEventShield";

/** Solid hex — Recharts SVG strokes don't reliably resolve CSS variables */
const CHART_BLUE = "#0066a1";
const CHART_BLUE_FILL = "rgba(4, 159, 217, 0.28)";
const CHART_LINE = "#049fd9";

function Spark({
  data,
  dataKey,
  color,
  domain,
}: {
  data: MetricPoint[];
  dataKey: keyof MetricPoint;
  color: string;
  domain?: [number | "auto", number | "auto"];
}) {
  return (
    <ResponsiveContainer width="100%" height={44}>
      <LineChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <YAxis hide domain={domain ?? ["auto", "auto"]} />
        <Line
          type="monotone"
          dataKey={dataKey as string}
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ScoreTrend({ data }: { data: MetricPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={72}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <YAxis hide domain={[40, 100]} />
        <Area
          type="monotone"
          dataKey="score"
          stroke={CHART_BLUE}
          strokeWidth={2}
          fill={CHART_BLUE_FILL}
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MiniMetric({
  label,
  value,
  unit,
  data,
  dataKey,
  color = CHART_LINE,
  domain,
}: {
  label: string;
  value: string;
  unit?: string;
  data: MetricPoint[];
  dataKey: keyof MetricPoint;
  color?: string;
  domain?: [number | "auto", number | "auto"];
}) {
  return (
    <div className="well px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="label">{label}</span>
        <span className="font-mono tnum text-[15px] font-semibold text-[var(--ink)]">
          {value}
          {unit && <span className="ml-0.5 text-[11px] font-normal text-[var(--ink-2)]">{unit}</span>}
        </span>
      </div>
      <div className="mt-1.5">
        <Spark data={data} dataKey={dataKey} color={color} domain={domain} />
      </div>
    </div>
  );
}
