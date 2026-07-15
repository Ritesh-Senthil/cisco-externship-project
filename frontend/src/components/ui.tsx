"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

/* ---------------- Count-up animated number ---------------- */
export function useCountUp(value: number, duration = 650) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, duration]);

  return display;
}

/* ---------------- Status chip ---------------- */
const STATUS: Record<string, { label: string; text: string; ring: string; bg: string }> = {
  READY_TO_OPEN: {
    label: "Ready to Open",
    text: "text-[var(--status-healthy)]",
    ring: "border-[rgba(52,211,153,0.4)]",
    bg: "bg-[rgba(52,211,153,0.12)]",
  },
  CONDITIONAL_OPEN: {
    label: "Conditional Open",
    text: "text-[var(--status-watch)]",
    ring: "border-[rgba(251,191,36,0.4)]",
    bg: "bg-[rgba(251,191,36,0.12)]",
  },
  NOT_READY: {
    label: "Not Ready",
    text: "text-[var(--status-critical)]",
    ring: "border-[rgba(251,90,104,0.45)]",
    bg: "bg-[rgba(251,90,104,0.14)]",
  },
};

export function StatusChip({ status, size = "md" }: { status: string; size?: "sm" | "md" | "lg" }) {
  const s = STATUS[status] || {
    label: status.replaceAll("_", " "),
    text: "text-[var(--text-muted)]",
    ring: "border-[var(--border)]",
    bg: "bg-white/5",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border font-semibold uppercase tracking-[0.08em]",
        s.text,
        s.ring,
        s.bg,
        size === "lg" && "px-4 py-1.5 text-sm",
        size === "md" && "px-3 py-1 text-xs",
        size === "sm" && "px-2.5 py-0.5 text-[11px]",
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full bg-current", status === "NOT_READY" && "pulse-dot")} />
      {s.label}
    </span>
  );
}

export function statusColor(status: string) {
  if (status === "critical" || status === "CRITICAL" || status === "NOT_READY") return "var(--status-critical)";
  if (status === "watch" || status === "high" || status === "HIGH" || status === "CONDITIONAL_OPEN")
    return "var(--status-watch)";
  if (status === "READY_TO_OPEN" || status === "healthy") return "var(--status-healthy)";
  return "var(--status-info)";
}

export function SeverityDot({ severity }: { severity: string }) {
  const color = statusColor(severity);
  const critical = severity === "critical" || severity === "CRITICAL";
  return (
    <span
      className={clsx("inline-block h-2.5 w-2.5 rounded-full", critical && "pulse-dot")}
      style={{ background: color, boxShadow: `0 0 10px ${color}` }}
    />
  );
}

/* ---------------- Panel / card ---------------- */
export function Panel({
  title,
  eyebrow,
  children,
  action,
  className,
  accent,
}: {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <section className={clsx("glass rounded-2xl", accent && "grad-border", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-3.5">
          <div>
            {eyebrow && (
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                {eyebrow}
              </div>
            )}
            <h2 className="font-display text-[15px] font-bold tracking-tight text-[var(--text)]">{title}</h2>
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/* ---------------- Stat tile ---------------- */
export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "healthy" | "watch" | "critical";
}) {
  const toneColor =
    tone === "healthy"
      ? "var(--status-healthy)"
      : tone === "watch"
        ? "var(--status-watch)"
        : tone === "critical"
          ? "var(--status-critical)"
          : "var(--text)";
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] px-3.5 py-3 transition hover:border-[var(--border-strong)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">{label}</div>
      <div className="mt-1 text-lg font-bold" style={{ color: toneColor }}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">{sub}</div>}
    </div>
  );
}

export function Pill({ children, tone }: { children: React.ReactNode; tone?: "muted" | "accent" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tone === "accent"
          ? "border-[rgba(79,123,255,0.4)] bg-[var(--accent-soft)] text-[#a9c0ff]"
          : "border-[var(--border)] bg-white/[0.03] text-[var(--text-muted)]",
      )}
    >
      {children}
    </span>
  );
}
