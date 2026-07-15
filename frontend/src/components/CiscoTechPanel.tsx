"use client";

import { Panel } from "@/components/ui";
import type { DomainScore } from "@/lib/types";

type ProductState = "streaming" | "healthy" | "watch" | "at_risk" | "active";

const MAP: {
  name: string;
  role: string;
  domain?: string;
  fixed?: ProductState;
}[] = [
  { name: "Catalyst Center", role: "Network backbone & assurance", domain: "network" },
  { name: "Meraki Wireless", role: "Gate 1 Wi-Fi / AP telemetry", domain: "network" },
  { name: "SD-WAN", role: "Backup connectivity failover", domain: "network" },
  { name: "ThousandEyes", role: "Etix external ticketing probe", domain: "admission" },
  { name: "Splunk", role: "Telemetry & event correlation", fixed: "streaming" },
  { name: "Cisco ISE", role: "Screening access & identity", domain: "security" },
  { name: "Duo MFA", role: "Staff authentication", domain: "staffing" },
  { name: "Webex", role: "Incident coordination room", domain: "communications" },
  { name: "Cisco XDR", role: "Cross-domain threat detection", domain: "security" },
  { name: "AI Defense", role: "AI guardrails & safety", fixed: "active" },
];

const STYLE: Record<ProductState, { dot: string; label: string; text: string }> = {
  streaming: { dot: "#22a7f0", label: "Streaming", text: "text-[#7fc7f5]" },
  healthy: { dot: "#34d399", label: "Nominal", text: "text-[#6ee7b7]" },
  watch: { dot: "#fbbf24", label: "Watch", text: "text-[#fcd34d]" },
  at_risk: { dot: "#fb5a68", label: "Degraded", text: "text-[#fda4a4]" },
  active: { dot: "#8b5cf6", label: "Active", text: "text-[#c4b5fd]" },
};

export function CiscoTechPanel({ domainScores }: { domainScores: DomainScore[] }) {
  const byDomain = new Map(domainScores.map((d) => [d.domain, d.status]));
  return (
    <Panel title="Cisco Tech Fabric" eyebrow="Live integration">
      <p className="mb-3 text-[12px] leading-relaxed text-[var(--text-muted)]">
        Every signal CaroSHIELD reasons over is carried by the Cisco stack — from device telemetry to
        secure coordination.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {MAP.map((p) => {
          const state: ProductState = p.fixed ?? ((byDomain.get(p.domain!) as ProductState) ?? "healthy");
          const norm: ProductState =
            state === "healthy" || state === "watch" || state === "at_risk" || state === "streaming" || state === "active"
              ? state
              : "healthy";
          const s = STYLE[norm];
          return (
            <div
              key={p.name}
              className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-white/[0.02] px-3 py-2.5"
            >
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full pulse-dot"
                style={{ background: s.dot, boxShadow: `0 0 8px ${s.dot}` }}
              />
              <div className="min-w-0">
                <div className="truncate font-display text-[12px] font-bold text-[var(--text)]">{p.name}</div>
                <div className="truncate text-[10px] text-[var(--text-muted)]">{p.role}</div>
                <div className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.text}`}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
