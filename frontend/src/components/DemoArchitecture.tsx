"use client";

import { ArchLayer, ArchNode, Callout, FlowArrow, Legend } from "@/components/arch";
import { Panel } from "@/components/ui";
import type { ScenarioSnapshot } from "@/lib/types";

const REAL_VS_SIM: { item: string; state: "real" | "sim"; note: string }[] = [
  { item: "Web app, API & WebSocket streaming", state: "real", note: "Next.js + FastAPI, live every 1–2s" },
  { item: "Readiness scoring engine", state: "real", note: "Deterministic weighted logic + hard stops" },
  { item: "AI reasoning / Q&A", state: "real", note: "Groq (hosted) or Ollama (local) inference" },
  { item: "Splunk HEC ingestion", state: "real", note: "7 indexes, dual-published, circuit-broken" },
  { item: "Postgres + Redis persistence", state: "real", note: "Best-effort snapshot + fanout" },
  { item: "Cisco Catalyst Center probe", state: "real", note: "Optional live read-only control-plane signal" },
  { item: "Device / network telemetry values", state: "sim", note: "Seeded synthetic generators" },
  { item: "Etix, Amtrak, GoRaleigh feeds", state: "sim", note: "Modeled, clearly labeled" },
  { item: "Executed actions", state: "sim", note: "No real devices are controlled" },
  { item: "The fair disruption scenario", state: "sim", note: "Scripted, deterministic for repeatability" },
];

export function DemoArchitecture({ snapshot }: { snapshot: ScenarioSnapshot }) {
  const aiMode = snapshot.ai_fallback ? "Curated fallback (safe)" : "Live model";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="label-caps text-[var(--signal-ink)]">What is running right now</div>
          <h1 className="text-[22px] font-semibold tracking-tight text-[var(--ink)]">Demo architecture</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--ink-2)]">
            Everything on stage is running live — the scoring engine, AI, streaming, and Splunk are real. Only the
            fair&apos;s telemetry and the disruption are simulated, and always labeled.
          </p>
        </div>
        <Legend
          items={[
            { dot: "var(--nominal)", label: "Real integration" },
            { dot: "var(--caution)", label: "Simulated (labeled)" },
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-1.5 lg:col-span-3">
          <ArchLayer index={1} title="Synthetic Generators" desc="Python · seeded RNG" tone="var(--caution)">
            <ArchNode kind="data" title="Domain event generators" sub="Wireless, ticketing, transit, crowd, screening → normalized event schema" badge="simulated" />
          </ArchLayer>
          <FlowArrow label="tick loop" />
          <ArchLayer index={2} title="FastAPI Scenario Engine" desc="Stateful world + controller">
            <div className="grid gap-2 sm:grid-cols-2">
              <ArchNode kind="engine" title="Scenario World" sub="Phase state, bounded noise" />
              <ArchNode kind="engine" title="Presenter Controller" sub="Reset / trigger / recover" />
            </div>
          </ArchLayer>
          <FlowArrow label="evaluate" />
          <ArchLayer index={3} title="Intelligence Layer" desc="Deterministic + generative">
            <div className="grid gap-2 sm:grid-cols-2">
              <ArchNode kind="engine" title="Readiness Engine" sub="Weighted scoring, forecast, correlation" badge="real logic" />
              <ArchNode kind="engine" title="LLM" sub={`Groq / Ollama · ${aiMode}`} badge="real" />
            </div>
          </ArchLayer>
          <FlowArrow label="publish snapshot" />
          <ArchLayer index={4} title="Delivery & Persistence" desc="Live fanout + best-effort stores">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <ArchNode kind="engine" title="WebSocket + REST" sub="Live snapshot" badge="real" />
              <ArchNode kind="store" title="Postgres" sub="Snapshots" badge="real" />
              <ArchNode kind="store" title="Redis" sub="Fanout cache" badge="real" />
              <ArchNode kind="cisco" title="Splunk HEC" sub="7 indexes" badge="real" />
            </div>
          </ArchLayer>
          <FlowArrow label="render" />
          <ArchLayer index={5} title="Frontend" desc="This interface" tone="var(--nominal)">
            <ArchNode kind="action" title="Next.js 15 · React 19 · Tailwind · Recharts" sub="Command center, gauges, live charts, evidence trace" badge="real" />
          </ArchLayer>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Panel title="Real vs. Simulated" eyebrow="The honest boundary">
            <ul className="space-y-1.5">
              {REAL_VS_SIM.map((r) => (
                <li key={r.item} className="well flex items-start gap-2.5 px-3 py-2">
                  <span
                    className="mt-0.5 rounded-[var(--r-xs)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                    style={
                      r.state === "real"
                        ? { color: "var(--nominal)", background: "var(--nominal-weak)" }
                        : { color: "var(--caution)", background: "var(--caution-weak)" }
                    }
                  >
                    {r.state === "real" ? "Real" : "Sim"}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-[var(--ink)]">{r.item}</div>
                    <div className="text-[11px] text-[var(--ink-2)]">{r.note}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Callout title="Why deterministic?" tone="engine">
            A seeded RNG with bounded, story-preserving noise means the demo runs the same way every time — numbers
            jitter realistically, but the causal narrative never breaks. That is what makes it safe to present live.
          </Callout>
        </div>
      </div>
    </div>
  );
}
