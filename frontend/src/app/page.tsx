"use client";

import { EvidenceDrawer } from "@/components/EvidenceDrawer";
import { ScenarioController } from "@/components/ScenarioController";
import { CommandCenter } from "@/components/CommandCenter";
import { DemoArchitecture } from "@/components/DemoArchitecture";
import { GateDetail } from "@/components/GateDetail";
import { IncidentView } from "@/components/IncidentView";
import { ProductionArchitecture } from "@/components/ProductionArchitecture";
import { ResponseLoop } from "@/components/ResponseLoop";
import { TimelineView } from "@/components/TimelineView";
import { IconMenu } from "@/components/icons";
import { useEventShield } from "@/hooks/useEventShield";
import clsx from "clsx";

const NAV = [
  { id: "command", label: "Command", group: "ops" },
  { id: "gate", label: "Gate 1", group: "ops" },
  { id: "incident", label: "Incident", group: "ops" },
  { id: "timeline", label: "Timeline", group: "ops" },
  { id: "arch_prod", label: "Production", group: "arch" },
  { id: "arch_demo", label: "Demo stack", group: "arch" },
] as const;

export default function HomePage() {
  const es = useEventShield();
  const snap = es.snapshot;

  return (
    <div className="min-h-screen">
      <div className="border-b border-[var(--line)] bg-[var(--console-2)] px-4 py-1 text-center text-[11px] text-[var(--ink-3)]">
        Simulated data · demonstration environment
      </div>

      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--console)]">
        <div className="mx-auto flex max-w-[1520px] items-center gap-6 px-5 py-2.5">
          <div className="shrink-0">
            <div className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">CaroSHIELD</div>
            <div className="text-[11px] text-[var(--ink-3)]">N.C. State Fair</div>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center gap-1 lg:flex">
            {NAV.map((item, i) => {
              const active = es.view === item.id;
              const isIncident = item.id === "incident" && !!snap?.active_incident;
              const startsArch = item.group === "arch" && NAV[i - 1]?.group !== "arch";
              return (
                <div key={item.id} className="flex items-center">
                  {startsArch && <span className="mx-2 h-3.5 w-px bg-[var(--line)]" />}
                  <button
                    onClick={() => es.setView(item.id)}
                    className={clsx(
                      "ring-focus relative px-3 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "text-[var(--ink)] after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-[var(--signal)]"
                        : "text-[var(--ink-2)] hover:text-[var(--ink)]",
                    )}
                  >
                    {item.label}
                    {isIncident && (
                      <span className="pulse-critical absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--critical)]" />
                    )}
                  </button>
                </div>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 text-[12px] font-medium"
              style={{ color: es.connected ? "var(--nominal)" : "var(--signal-ink)" }}
            >
              <span className={clsx("h-1.5 w-1.5 rounded-full bg-current", es.connected && "pulse-dot")} />
              {es.connected ? "Live" : "Reconnecting"}
            </span>
            <button
              onClick={() => es.setEvidenceOpen(true)}
              className="btn ring-focus hidden sm:inline-flex"
            >
              Evidence
            </button>
            <button
              onClick={() => es.setControllerOpen(true)}
              className="btn btn-icon ring-focus"
              title="Scenario controller (⌘⇧E)"
              aria-label="Open scenario controller"
            >
              <IconMenu />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1520px] px-5 py-5">
        {!snap ? (
          <div className="card flex min-h-[55vh] flex-col items-center justify-center text-center">
            <span className="mb-3 h-1.5 w-1.5 rounded-full bg-[var(--signal)] pulse-dot" />
            <div className="text-[15px] font-semibold text-[var(--ink)]">Connecting</div>
            <p className="mt-1 text-[13px] text-[var(--ink-2)]">Establishing telemetry stream</p>
          </div>
        ) : (
          <div className="space-y-5">
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
          </div>
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
