"use client";

import { CommandCenter } from "@/components/CommandCenter";
import { EvidenceDrawer } from "@/components/EvidenceDrawer";
import { GateDetail } from "@/components/GateDetail";
import { IncidentView } from "@/components/IncidentView";
import { ScenarioController } from "@/components/ScenarioController";
import { TimelineView } from "@/components/TimelineView";
import { useEventShield } from "@/hooks/useEventShield";
import clsx from "clsx";

const NAV = [
  { id: "command", label: "Command Center" },
  { id: "gate", label: "Gate 1 Detail" },
  { id: "incident", label: "Active Incident" },
  { id: "timeline", label: "Timeline" },
] as const;

export default function HomePage() {
  const es = useEventShield();
  const snap = es.snapshot;

  return (
    <div className="min-h-screen">
      <div className="border-b border-[rgba(4,159,217,0.35)] bg-[rgba(4,159,217,0.1)] px-4 py-1.5 text-center text-xs font-medium text-[var(--cisco-navy)]">
        Simulated data for demonstration purposes.
      </div>

      <header className="border-b border-[var(--border)] bg-[var(--cisco-navy)] text-white">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--cisco-blue)] text-sm font-bold">
              ES
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">EventShield</div>
              <div className="text-xs text-white/65">N.C. State Fair · Operations Command</div>
            </div>
          </div>
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => es.setView(item.id)}
                className={clsx(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  es.view === item.id ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className={clsx("inline-flex items-center gap-1.5", es.connected ? "text-emerald-300" : "text-amber-300")}>
              <span className="h-2 w-2 rounded-full bg-current" />
              {es.connected ? "Live" : "Reconnecting"}
            </span>
            <button
              onClick={() => es.setEvidenceOpen(true)}
              className="rounded-md border border-white/20 px-2 py-1 hover:bg-white/10"
              title="Evidence drawer (⌘⇧D)"
            >
              Evidence
            </button>
            <button
              onClick={() => es.setControllerOpen(true)}
              className="h-8 w-8 rounded-full border border-white/15 text-white/40 hover:border-white/40 hover:text-white"
              title="Scenario controller (⌘⇧E)"
              aria-label="Open scenario controller"
            >
              ·
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-4">
        {!snap ? (
          <div className="rounded-lg border border-[var(--border)] bg-white p-8 text-center text-[var(--text-muted)]">
            Connecting to EventShield backend…
          </div>
        ) : (
          <>
            {es.view === "command" && (
              <CommandCenter
                snapshot={snap}
                preopeningPlan={es.preopeningPlan}
                onGate={() => es.setView("gate")}
                onIncident={() => es.setView("incident")}
                onAsk={es.ask}
                onApprovePreopening={es.approvePreopening}
                onRejectPreopening={es.rejectPreopening}
                aiLoading={es.aiLoading}
              />
            )}
            {es.view === "gate" && <GateDetail snapshot={snap} />}
            {es.view === "incident" && (
              <IncidentView
                snapshot={snap}
                onApprove={es.approveIncident}
                onReject={es.rejectIncident}
              />
            )}
            {es.view === "timeline" && <TimelineView snapshot={snap} />}

            {es.aiAnswer && (
              <div className="mt-4 rounded-lg border border-[var(--border)] bg-white p-4 shadow-[var(--shadow)]">
                <div className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  AI explanation · {es.aiAnswer.source}
                </div>
                <div className="mt-1 font-semibold text-[var(--cisco-navy)]">{es.aiAnswer.question}</div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{es.aiAnswer.answer}</p>
              </div>
            )}
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
