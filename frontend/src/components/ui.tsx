"use client";

import clsx from "clsx";

export function StatusChip({
  status,
}: {
  status: "READY_TO_OPEN" | "CONDITIONAL_OPEN" | "NOT_READY" | string;
}) {
  const map: Record<string, { label: string; className: string }> = {
    READY_TO_OPEN: {
      label: "Ready to Open",
      className: "bg-[rgba(46,139,87,0.12)] text-[var(--status-healthy)] border-[rgba(46,139,87,0.35)]",
    },
    CONDITIONAL_OPEN: {
      label: "Conditional Open",
      className: "bg-[rgba(196,127,0,0.12)] text-[var(--status-watch)] border-[rgba(196,127,0,0.35)]",
    },
    NOT_READY: {
      label: "Not Ready",
      className: "bg-[rgba(199,54,45,0.12)] text-[var(--status-critical)] border-[rgba(199,54,45,0.35)]",
    },
  };
  const item = map[status] || {
    label: status,
    className: "bg-black/5 text-[var(--text-muted)] border-[var(--border)]",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md border px-3 py-1 text-sm font-semibold tracking-wide",
        item.className,
      )}
    >
      {item.label}
    </span>
  );
}

export function SeverityDot({ severity }: { severity: string }) {
  const color =
    severity === "critical" || severity === "CRITICAL"
      ? "var(--status-critical)"
      : severity === "high" || severity === "HIGH"
        ? "var(--status-watch)"
        : "var(--status-info)";
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />;
}

export function Panel({
  title,
  children,
  action,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[var(--shadow)]",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
