"use client";

import { Btn } from "@/components/ui";

const GROUPS: { heading: string; actions: { id: string; label: string; primary?: boolean }[] }[] = [
  {
    heading: "Scene flow",
    actions: [
      { id: "reset", label: "Reset demo" },
      { id: "start_preopening", label: "Start pre-opening", primary: true },
      { id: "apply_readiness_fixes", label: "Apply readiness fixes" },
      { id: "mark_ready", label: "Mark ready" },
      { id: "start_live_event", label: "Advance to live event", primary: true },
      { id: "trigger_gate1_incident", label: "Trigger Gate 1 incident", primary: true },
      { id: "approve_recovery", label: "Approve recovery" },
    ],
  },
  {
    heading: "Safety / reliability",
    actions: [
      { id: "force_recovery", label: "Force recovery" },
      { id: "toggle_ai_fallback", label: "Toggle AI fallback" },
      { id: "pause_streams", label: "Pause streams" },
      { id: "resume_streams", label: "Resume streams" },
    ],
  },
];

export function ScenarioController({
  open,
  onClose,
  onAction,
  phase,
  aiFallback,
  streamsPaused,
}: {
  open: boolean;
  onClose: () => void;
  onAction: (id: string) => void;
  phase: string;
  aiFallback: boolean;
  streamsPaused: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed bottom-4 left-4 z-50 w-[300px] rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--console-2)] p-3.5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="label-caps text-[var(--signal-ink)]">Presenter controls</div>
          <div className="text-[13px] font-medium capitalize text-[var(--ink)]">Phase: {phase.replaceAll("_", " ")}</div>
        </div>
        <Btn variant="ghost" className="h-7 px-2 text-[11px]" onClick={onClose}>
          Hide
        </Btn>
      </div>

      <div className="mb-3 flex gap-2 text-[11px] text-[var(--ink-2)]">
        <span className="well flex-1 px-2 py-1 text-center">
          AI: <b style={{ color: aiFallback ? "var(--ink-2)" : "var(--nominal)" }}>{aiFallback ? "Curated" : "Live"}</b>
        </span>
        <span className="well flex-1 px-2 py-1 text-center">
          Streams:{" "}
          <b style={{ color: streamsPaused ? "var(--caution)" : "var(--nominal)" }}>
            {streamsPaused ? "Paused" : "Live"}
          </b>
        </span>
      </div>

      <div className="max-h-[52vh] space-y-3 overflow-y-auto">
        {GROUPS.map((g) => (
          <div key={g.heading}>
            <div className="label-caps mb-1.5">{g.heading}</div>
            <div className="grid gap-1">
              {g.actions.map((a) => (
                <Btn
                  key={a.id}
                  variant={a.primary ? "primary" : "default"}
                  className="h-auto w-full justify-start px-3 py-2 text-left"
                  onClick={() => onAction(a.id)}
                >
                  {a.label}
                </Btn>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="label mt-2">⌘⇧E</p>
    </div>
  );
}
