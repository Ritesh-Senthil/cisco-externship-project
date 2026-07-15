"use client";

import clsx from "clsx";

export type NodeKind = "cisco" | "data" | "engine" | "human" | "action" | "store";

const KIND: Record<NodeKind, { border: string; bg: string; dot: string; label: string }> = {
  cisco: { border: "border-[rgba(79,123,255,0.45)]", bg: "bg-[rgba(79,123,255,0.08)]", dot: "#4f7bff", label: "Cisco" },
  data: { border: "border-[rgba(34,167,240,0.4)]", bg: "bg-[rgba(34,167,240,0.06)]", dot: "#22a7f0", label: "Data feed" },
  engine: { border: "border-[rgba(139,92,246,0.5)]", bg: "bg-[rgba(139,92,246,0.08)]", dot: "#8b5cf6", label: "CaroSHIELD" },
  human: { border: "border-[rgba(251,191,36,0.5)]", bg: "bg-[rgba(251,191,36,0.08)]", dot: "#fbbf24", label: "Human" },
  action: { border: "border-[rgba(52,211,153,0.45)]", bg: "bg-[rgba(52,211,153,0.08)]", dot: "#34d399", label: "Action" },
  store: { border: "border-[var(--border-strong)]", bg: "bg-white/[0.03]", dot: "#93a1bd", label: "Store" },
};

export function ArchNode({
  title,
  sub,
  kind,
  badge,
}: {
  title: string;
  sub?: string;
  kind: NodeKind;
  badge?: string;
}) {
  const k = KIND[kind];
  return (
    <div className={clsx("relative rounded-xl border px-3 py-2.5", k.border, k.bg)}>
      {badge && (
        <span className="absolute -top-2 right-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-2)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {badge}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: k.dot, boxShadow: `0 0 6px ${k.dot}` }} />
        <span className="font-display text-[12.5px] font-bold text-[var(--text)]">{title}</span>
      </div>
      {sub && <div className="mt-0.5 pl-3 text-[11px] leading-snug text-[var(--text-muted)]">{sub}</div>}
    </div>
  );
}

export function ArchLayer({
  index,
  title,
  desc,
  children,
  tone,
}: {
  index: number | string;
  title: string;
  desc?: string;
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-bold text-white"
          style={{ background: tone || "linear-gradient(92deg,#22a7f0,#8b5cf6)" }}
        >
          {index}
        </span>
        <div>
          <div className="font-display text-[14px] font-bold tracking-tight text-[var(--text)]">{title}</div>
          {desc && <div className="text-[11px] text-[var(--text-muted)]">{desc}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1">
      <span className="text-[var(--text-dim)]">↓</span>
      {label && <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-dim)]">{label}</span>}
    </div>
  );
}

export function Legend({ items }: { items: { dot: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          <span className="h-2 w-2 rounded-full" style={{ background: it.dot }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export function Callout({ title, children, tone = "engine" }: { title: string; children: React.ReactNode; tone?: NodeKind }) {
  const k = KIND[tone];
  return (
    <div className={clsx("rounded-xl border px-4 py-3", k.border, k.bg)}>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: k.dot }} />
        <span className="font-display text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--text)]">{title}</span>
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">{children}</p>
    </div>
  );
}
