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
  { name: "Catalyst Center", role: "Network backbone", domain: "network" },
  { name: "Meraki Wireless", role: "Gate 1 Wi-Fi", domain: "network" },
  { name: "SD-WAN", role: "Backup connectivity", domain: "network" },
  { name: "ThousandEyes", role: "Etix ticketing probe", domain: "admission" },
  { name: "Splunk", role: "Telemetry correlation", fixed: "streaming" },
  { name: "Cisco ISE", role: "Screening access", domain: "security" },
  { name: "Duo MFA", role: "Staff authentication", domain: "staffing" },
  { name: "Webex", role: "Incident coordination", domain: "communications" },
  { name: "Cisco XDR", role: "Threat detection", domain: "security" },
  { name: "AI Defense", role: "AI guardrails", fixed: "active" },
];

const STYLE: Record<ProductState, { dot: string; label: string }> = {
  streaming: { dot: "var(--signal)", label: "Streaming" },
  healthy: { dot: "var(--nominal)", label: "Nominal" },
  watch: { dot: "var(--caution)", label: "Watch" },
  at_risk: { dot: "var(--critical)", label: "Degraded" },
  active: { dot: "var(--signal)", label: "Active" },
};

export function CiscoTechPanel({ domainScores }: { domainScores: DomainScore[] }) {
  const byDomain = new Map(domainScores.map((d) => [d.domain, d.status]));
  return (
    <Panel title="Cisco fabric" eyebrow="Live integration">
      <ul className="divide-y divide-[var(--line-soft)]">
        {MAP.map((p) => {
          const state: ProductState = p.fixed ?? ((byDomain.get(p.domain!) as ProductState) ?? "healthy");
          const norm: ProductState =
            state === "healthy" || state === "watch" || state === "at_risk" || state === "streaming" || state === "active"
              ? state
              : "healthy";
          const s = STYLE[norm];
          return (
            <li key={p.name} className="flex items-start gap-2.5 py-2 first:pt-0 last:pb-0">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: s.dot }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[12px] font-medium text-[var(--ink)]">{p.name}</span>
                  <span className="shrink-0 text-[10px] font-medium" style={{ color: s.dot }}>
                    {s.label}
                  </span>
                </div>
                <div className="truncate text-[11px] text-[var(--ink-3)]">{p.role}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
