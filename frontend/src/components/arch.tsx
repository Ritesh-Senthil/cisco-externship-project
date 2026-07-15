"use client";

export type NodeKind = "cisco" | "data" | "engine" | "human" | "action" | "store";

const KIND: Record<NodeKind, { color: string; label: string }> = {
  cisco: { color: "var(--signal)", label: "Cisco" },
  data: { color: "var(--ink-3)", label: "Data feed" },
  engine: { color: "var(--signal)", label: "CaroSHIELD" },
  human: { color: "var(--caution)", label: "Human" },
  action: { color: "var(--nominal)", label: "Action" },
  store: { color: "var(--ink-3)", label: "Store" },
};

function tint(color: string, borderPct = 28, bgPct = 6): React.CSSProperties {
  return {
    borderColor: `color-mix(in srgb, ${color} ${borderPct}%, transparent)`,
    background: `color-mix(in srgb, ${color} ${bgPct}%, transparent)`,
  };
}

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
    <div className="relative rounded-[var(--r-sm)] border px-3 py-2" style={tint(k.color)}>
      {badge && (
        <span className="absolute -top-2 right-2 rounded-full border border-[var(--line)] bg-[var(--console-2)] px-1.5 py-px text-[9px] font-medium text-[var(--ink-3)]">
          {badge}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: k.color }} />
        <span className="text-[12px] font-medium text-[var(--ink)]">{title}</span>
      </div>
      {sub && <div className="mt-0.5 pl-3 text-[11px] leading-snug text-[var(--ink-2)]">{sub}</div>}
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
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="font-mono flex h-5 w-5 items-center justify-center rounded-[var(--r-xs)] text-[10px] font-semibold text-white"
          style={{ background: tone || "var(--signal)" }}
        >
          {index}
        </span>
        <div>
          <div className="text-[14px] font-semibold text-[var(--ink)]">{title}</div>
          {desc && <div className="label">{desc}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-0.5">
      <span className="text-[var(--ink-4)]">↓</span>
      {label && <span className="label-caps">{label}</span>}
    </div>
  );
}

export function Legend({ items }: { items: { dot: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5 text-[11px] text-[var(--ink-2)]">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: it.dot }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export function Callout({ title, children, tone = "engine" }: { title: string; children: React.ReactNode; tone?: NodeKind }) {
  const k = KIND[tone];
  return (
    <div className="rounded-[var(--r-sm)] border px-3.5 py-2.5" style={tint(k.color)}>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: k.color }} />
        <span className="text-[12px] font-semibold text-[var(--ink)]">{title}</span>
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-2)]">{children}</p>
    </div>
  );
}
