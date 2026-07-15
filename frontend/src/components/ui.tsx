"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

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

const STATUS: Record<string, { label: string; color: string; weak: string }> = {
  READY_TO_OPEN: { label: "Ready to open", color: "var(--nominal)", weak: "var(--nominal-weak)" },
  CONDITIONAL_OPEN: { label: "Conditional open", color: "var(--signal)", weak: "var(--signal-weak)" },
  NOT_READY: { label: "Not ready", color: "var(--critical)", weak: "var(--critical-weak)" },
};

export function StatusChip({ status, size = "md" }: { status: string; size?: "sm" | "md" | "lg" }) {
  const s = STATUS[status] || {
    label: status.replaceAll("_", " ").toLowerCase(),
    color: "var(--ink-2)",
    weak: "rgba(0,0,0,0.04)",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "lg" && "px-3 py-1 text-[13px]",
        size === "md" && "px-2.5 py-0.5 text-[12px]",
        size === "sm" && "px-2 py-0.5 text-[11px]",
      )}
      style={{ color: s.color, borderColor: s.weak, background: s.weak }}
    >
      <span
        className={clsx("h-1.5 w-1.5 rounded-full bg-current", status === "NOT_READY" && "pulse-critical")}
      />
      {s.label}
    </span>
  );
}

export function statusColor(status: string) {
  if (status === "critical" || status === "CRITICAL" || status === "NOT_READY") return "var(--critical)";
  if (status === "CONDITIONAL_OPEN") return "var(--signal)";
  if (status === "watch" || status === "high" || status === "HIGH") return "var(--caution)";
  if (status === "READY_TO_OPEN" || status === "healthy") return "var(--nominal)";
  return "var(--signal)";
}

export function SeverityDot({ severity }: { severity: string }) {
  const color = statusColor(severity);
  return (
    <span
      className={clsx(
        "inline-block h-[7px] w-[7px] rounded-full",
        (severity === "critical" || severity === "CRITICAL") && "pulse-critical",
      )}
      style={{ background: color }}
    />
  );
}

export function Panel({
  title,
  eyebrow,
  children,
  action,
  className,
  accent,
  bodyClassName,
  flush,
}: {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  accent?: boolean;
  bodyClassName?: string;
  flush?: boolean;
}) {
  return (
    <section className={clsx("card relative", className)}>
      {accent && (
        <span aria-hidden className="absolute bottom-4 left-0 top-4 w-px bg-[var(--signal)]" />
      )}
      {(title || action) && (
        <header className="flex items-baseline justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <div className="min-w-0">
            {eyebrow && <div className="label-caps">{eyebrow}</div>}
            {title && <h2 className="text-[15px] font-semibold text-[var(--ink)]">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      <div className={clsx(flush ? undefined : "p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

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
      ? "var(--nominal)"
      : tone === "watch"
        ? "var(--caution)"
        : tone === "critical"
          ? "var(--critical)"
          : "var(--ink)";
  return (
    <div className="well px-3 py-2.5">
      <div className="label">{label}</div>
      <div className="font-mono tnum mt-1 text-[17px] font-semibold leading-none" style={{ color: toneColor }}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-[var(--ink-2)]">{sub}</div>}
    </div>
  );
}

export function Pill({ children, tone }: { children: React.ReactNode; tone?: "muted" | "accent" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-px text-[11px] font-medium",
        tone === "accent"
          ? "border-[var(--signal-line)] bg-[var(--signal-weak)] text-[var(--signal-ink)]"
          : "border-[var(--line)] text-[var(--ink-2)]",
      )}
    >
      {children}
    </span>
  );
}

export function Btn({
  children,
  variant = "default",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost";
}) {
  return (
    <button
      className={clsx(
        "btn ring-focus",
        variant === "primary" && "btn-primary",
        variant === "ghost" && "btn-ghost",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
