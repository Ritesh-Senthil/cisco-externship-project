"use client";

import { useCountUp } from "@/components/ui";

function toneFor(status: string) {
  if (status === "READY_TO_OPEN") return { color: "#34d399", label: "OPERATIONAL" };
  if (status === "CONDITIONAL_OPEN") return { color: "#fbbf24", label: "CAUTION" };
  return { color: "#fb5a68", label: "AT RISK" };
}

export function ReadinessGauge({
  score,
  status,
  confidence,
}: {
  score: number;
  status: string;
  confidence: string;
}) {
  const animated = useCountUp(score, 800);
  const { color, label } = toneFor(status);
  const size = 208;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, animated)) / 100;
  // 270-degree arc gauge
  const arc = 0.75;
  const dash = c * arc;
  const offset = dash * (1 - pct);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[135deg]">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(148,170,220,0.12)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)", filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-6xl font-extrabold leading-none tracking-tight" style={{ color }}>
          {Math.round(animated)}
        </div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-dim)]">
          Readiness
        </div>
        <div
          className="mt-2 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color, borderColor: `${color}55`, background: `${color}18` }}
        >
          {label}
        </div>
        <div className="mt-1.5 text-[10px] text-[var(--text-muted)]">{confidence} confidence</div>
      </div>
    </div>
  );
}
