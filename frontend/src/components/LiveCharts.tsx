"use client";

import { Area, AreaChart, Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import type { MetricPoint } from "@/hooks/useEventShield";

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
  const id = `grad-${String(dataKey)}`;
  return (
    <ResponsiveContainer width="100%" height={54}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={domain ?? ["auto", "auto"]} />
        <Area
          type="monotone"
          dataKey={dataKey as string}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${id})`}
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ScoreTrend({ data }: { data: MetricPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={64}>
      <LineChart data={data} margin={{ top: 6, right: 4, bottom: 2, left: 4 }}>
        <YAxis hide domain={[40, 100]} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#4f7bff"
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MiniMetric({
  label,
  value,
  unit,
  data,
  dataKey,
  color,
  domain,
}: {
  label: string;
  value: string;
  unit?: string;
  data: MetricPoint[];
  dataKey: keyof MetricPoint;
  color: string;
  domain?: [number | "auto", number | "auto"];
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">{label}</span>
        <span className="font-display text-base font-bold text-[var(--text)]">
          {value}
          {unit && <span className="ml-0.5 text-[11px] font-medium text-[var(--text-muted)]">{unit}</span>}
        </span>
      </div>
      <div className="mt-1">
        <Spark data={data} dataKey={dataKey} color={color} domain={domain} />
      </div>
    </div>
  );
}
