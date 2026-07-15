"use client";

import { CommandCenter } from "@/components/CommandCenter";
import { DemoArchitecture } from "@/components/DemoArchitecture";
import { EvidenceDrawer } from "@/components/EvidenceDrawer";
import { GateDetail } from "@/components/GateDetail";
import { IncidentView } from "@/components/IncidentView";
import { ProductionArchitecture } from "@/components/ProductionArchitecture";
import { ResponseLoop } from "@/components/ResponseLoop";
import { ScenarioController } from "@/components/ScenarioController";
import { TimelineView } from "@/components/TimelineView";
import { useEventShield } from "@/hooks/useEventShield";
import clsx from "clsx";

const NAV = [
  { id: "command", label: "Command Center", group: "ops" },
  { id: "gate", label: "Gate 1 Detail", group: "ops" },
  { id: "incident", label: "Active Incident", group: "ops" },
  { id: "timeline", label: "Timeline", group: "ops" },
  { id: "arch_prod", label: "Production Arch", group: "arch" },
  { id: "arch_demo", label: "Demo Arch", group: "arch" },
] as const;

export default function HomePage() {
  const es = useEventShield();
  const snap = es.snapshot;

  return (
    <div className="min-h-screen">
      {/* Simulated data banner */}
      <div className="border-b border-[rgba(79,123,255,0.2)] bg-[rgba(79,123,255,0.08)] px-4 py-1 text-center text-[11px] font-medium tracking-wide text-[#a9c0ff]">
        Simulated data for demonstration purposes.
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[rgba(7,11,22,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1640px] items-center gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="grad-bg flex h-10 w-10 items-center justify-center rounded-xl text-base font-black text-white shadow-[var(--glow)]">
              CS
            </div>
            <div>
              <div className="font-display text-xl font-extrabold tracking-tight text-[var(--text)]">
                Caro<span className="grad-text">SHIELD</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">N.C. State Fair · Operations Command</div>
            </div>
          </div>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV.map((item, i) => {
              const active = es.view === item.id;
              const isIncident = item.id === "incident" && !!snap?.active_incident;
              const startsArch = item.group === "arch" && NAV[i - 1]?.group !== "arch";
              return (
                <div key={item.id} className="flex items-center gap-1">
                  {startsArch && <span className="mx-1 h-5 w-px bg-[var(--border)]" />}
                  <button
                    onClick={() => es.setView(item.id)}
                    className={clsx(
                      "relative rounded-lg px-3 py-2 text-[13px] font-semibold transition",
                      active
                        ? "bg-[var(--accent-soft)] text-[var(--text)]"
                        : "text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text)]",
                    )}
                  >
                    {item.label}
                    {isIncident && (
                      <span className="pulse-dot absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--status-critical)]" />
                    )}
                  </button>
                </div>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2.5 text-[12px]">
            <span
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold",
                es.connected
                  ? "border-[rgba(52,211,153,0.35)] text-[var(--status-healthy)]"
                  : "border-[rgba(251,191,36,0.35)] text-[var(--status-watch)]",
              )}
            >
              <span className={clsx("h-1.5 w-1.5 rounded-full bg-current", es.connected && "pulse-dot")} />
              {es.connected ? "Live" : "Reconnecting"}
            </span>
            <button
              onClick={() => es.setEvidenceOpen(true)}
              className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 font-semibold text-[var(--text-muted)] transition hover:text-[var(--text)]"
              title="Evidence drawer (⌘⇧D)"
            >
              Evidence
            </button>
            <button
              onClick={() => es.setControllerOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-strong)] text-[var(--text-dim)] transition hover:border-[rgba(79,123,255,0.5)] hover:text-[var(--text)]"
              title="Scenario controller (⌘⇧E)"
              aria-label="Open scenario controller"
            >
              ⋯
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1640px] space-y-4 px-5 py-4">
        {!snap ? (
          <div className="glass flex min-h-[60vh] flex-col items-center justify-center rounded-2xl text-center">
            <div className="grad-bg mb-4 h-10 w-10 animate-pulse rounded-xl" />
            <div className="font-display text-lg font-bold text-[var(--text)]">Connecting to CaroSHIELD…</div>
            <p className="mt-1 text-[13px] text-[var(--text-muted)]">Establishing live telemetry stream.</p>
          </div>
        ) : (
          <>
            {/* Persistent response-loop stepper (operational views only) */}
            {es.view !== "arch_prod" && es.view !== "arch_demo" && <ResponseLoop phase={snap.phase} />}

            {es.view === "command" && (
              <CommandCenter
                snapshot={snap}
                preopeningPlan={es.preopeningPlan}
                history={es.history}
                onGate={() => es.setView("gate")}
                onIncident={() => es.setView("incident")}
                onAsk={es.ask}
                onApprovePreopening={es.approvePreopening}
                onRejectPreopening={es.rejectPreopening}
                aiLoading={es.aiLoading}
                aiAnswer={es.aiAnswer}
                onClearAi={es.clearAiAnswer}
              />
            )}
            {es.view === "gate" && <GateDetail snapshot={snap} history={es.history} />}
            {es.view === "incident" && (
              <IncidentView
                snapshot={snap}
                history={es.history}
                onApprove={es.approveIncident}
                onReject={es.rejectIncident}
              />
            )}
            {es.view === "timeline" && <TimelineView snapshot={snap} />}
            {es.view === "arch_prod" && <ProductionArchitecture />}
            {es.view === "arch_demo" && <DemoArchitecture snapshot={snap} />}
          </>
        )}
      </main>

      <EvidenceDrawer open={es.evidenceOpen} onClose={() => es.setEvidenceOpen(false)} snapshot={snap} />
      <ScenarioController
        open={es.controllerOpen}
        onClose={() => es.setControllerOpen(false)}
        onAction={es.runAdmin}
        phase={snap?.phase || "idle"}
        aiFallback={snap?.ai_fallback ?? true}
        streamsPaused={snap?.streams_paused ?? false}
      />
    </div>
  );
}
