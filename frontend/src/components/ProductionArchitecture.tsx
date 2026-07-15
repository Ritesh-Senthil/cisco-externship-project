"use client";

import { ArchLayer, ArchNode, Callout, FlowArrow, Legend } from "@/components/arch";
import { Panel } from "@/components/ui";

export function ProductionArchitecture() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] grad-text">How it deploys</div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--text)]">
            Production Architecture
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--text-muted)]">
            In production, CaroSHIELD rides entirely on the Cisco stack — turning device, network, identity, and
            transport telemetry into one readiness verdict, then executing only human-approved, non-safety-critical
            actions.
          </p>
        </div>
        <Legend
          items={[
            { dot: "#4f7bff", label: "Cisco product" },
            { dot: "#22a7f0", label: "Operational feed" },
            { dot: "#8b5cf6", label: "CaroSHIELD engine" },
            { dot: "#fbbf24", label: "Human-in-command" },
            { dot: "#34d399", label: "Approved action" },
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <div className="space-y-1.5 xl:col-span-3">
          <ArchLayer index={1} title="Event Data Plane" desc="Cross-domain sources, streamed continuously">
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              <ArchNode kind="cisco" title="Catalyst Center" sub="Network assurance & health" />
              <ArchNode kind="cisco" title="Meraki Wireless" sub="Gate AP telemetry" />
              <ArchNode kind="cisco" title="SD-WAN" sub="Backup connectivity" />
              <ArchNode kind="cisco" title="ThousandEyes" sub="Etix external probe" />
              <ArchNode kind="cisco" title="ISE + Duo" sub="Identity & access" />
              <ArchNode kind="data" title="Etix Ticketing" sub="Scanner / validation" />
              <ArchNode kind="data" title="Amtrak / GoRaleigh" sub="Inbound transit" />
              <ArchNode kind="data" title="Crowd Analytics" sub="Queue & density" />
              <ArchNode kind="data" title="Gate / Screening Ops" sub="Lanes & staffing" />
              <ArchNode kind="data" title="Weather / Comms" sub="Conditions & signage" />
            </div>
          </ArchLayer>

          <FlowArrow label="normalize & correlate" />

          <ArchLayer index={2} title="Secure Telemetry & Streaming" desc="Cisco-secured ingestion">
            <div className="grid gap-2 sm:grid-cols-2">
              <ArchNode kind="cisco" title="Splunk" sub="SIEM, telemetry index & search across all domains" />
              <ArchNode kind="engine" title="Event Bus" sub="Normalized event schema, enterprise streaming fanout" />
            </div>
          </ArchLayer>

          <FlowArrow label="one cross-domain judgment" />

          <ArchLayer index={3} title="CaroSHIELD Intelligence" desc="Deterministic engine + constrained AI">
            <div className="grid gap-2 sm:grid-cols-2">
              <ArchNode
                kind="engine"
                title="Readiness Engine"
                sub="Weighted domain scoring + hard stops + forecast → the authoritative score"
                badge="deterministic"
              />
              <ArchNode
                kind="engine"
                title="AI Correlation & Reasoning"
                sub="Root-cause isolation, ranks approved-playbook actions, explains evidence"
                badge="explains only"
              />
            </div>
          </ArchLayer>

          <FlowArrow label="recommend → require approval" />

          <ArchLayer index={4} title="Human-in-Command" desc="No action executes without sign-off" tone="#fbbf24">
            <ArchNode kind="human" title="Ops Director Approval Gate" sub="Approve / reject every recommended plan; full audit trail" />
          </ArchLayer>

          <FlowArrow label="execute approved actions only" />

          <ArchLayer index={5} title="Action & Coordination" desc="Approved connectors — operational, never safety-critical" tone="#34d399">
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              <ArchNode kind="action" title="Webex" sub="Incident room" />
              <ArchNode kind="action" title="Digital Signage" sub="Visitor redirect" />
              <ArchNode kind="action" title="Staff Dispatch" sub="Reassign lanes" />
              <ArchNode kind="action" title="SD-WAN Failover" sub="Reroute traffic" />
              <ArchNode kind="action" title="Scanner Reconfig" sub="Backup path" />
            </div>
          </ArchLayer>
        </div>

        <div className="space-y-4">
          <Panel title="Security & Identity" eyebrow="Cross-cutting">
            <div className="space-y-2">
              <ArchNode kind="cisco" title="Cisco ISE" sub="Network access control" />
              <ArchNode kind="cisco" title="Duo MFA" sub="Operator authentication" />
              <ArchNode kind="cisco" title="Cisco XDR" sub="Threat detection & correlation" />
            </div>
          </Panel>

          <Panel title="AI Governance" eyebrow="Guardrails">
            <div className="space-y-2">
              <ArchNode kind="cisco" title="Cisco AI Defense" sub="Prompt/response guardrails, safety policy" />
              <ArchNode kind="store" title="Audit & RBAC" sub="Every recommendation & approval logged" />
            </div>
          </Panel>

          <Callout title="AI stays in its lane" tone="human">
            The AI never computes the authoritative readiness score, sets thresholds, or makes safety-critical
            decisions (gate closure, evacuation, dispatch). It explains evidence and ranks pre-approved playbook
            actions — a human commands.
          </Callout>
        </div>
      </div>
    </div>
  );
}
