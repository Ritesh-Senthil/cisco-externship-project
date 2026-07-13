"use client";

const ACTIONS: { id: string; label: string }[] = [
  { id: "reset", label: "Reset Demo" },
  { id: "start_preopening", label: "Start Pre-Opening" },
  { id: "apply_readiness_fixes", label: "Apply Readiness Fixes" },
  { id: "mark_ready", label: "Mark Ready" },
  { id: "start_live_event", label: "Advance to Live Event" },
  { id: "trigger_gate1_incident", label: "Trigger Gate 1 Incident" },
  { id: "approve_recovery", label: "Approve Recovery" },
  { id: "force_recovery", label: "Force Recovery" },
  { id: "toggle_ai_fallback", label: "Toggle AI Fallback" },
  { id: "pause_streams", label: "Pause Streams" },
  { id: "resume_streams", label: "Resume Streams" },
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
    <div className="fixed bottom-4 left-4 z-50 w-[320px] rounded-lg border border-[var(--cisco-chrome)] bg-[var(--cisco-slate)] p-3 text-white shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/60">Presenter controls</div>
          <div className="text-sm font-semibold">Phase: {phase}</div>
        </div>
        <button onClick={onClose} className="rounded border border-white/20 px-2 py-0.5 text-xs">
          Hide
        </button>
      </div>
      <div className="mb-2 flex gap-2 text-[11px] text-white/70">
        <span>AI fallback: {aiFallback ? "ON" : "OFF"}</span>
        <span>·</span>
        <span>Streams: {streamsPaused ? "PAUSED" : "LIVE"}</span>
      </div>
      <div className="grid max-h-[50vh] grid-cols-1 gap-1.5 overflow-y-auto">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => onAction(a.id)}
            className="rounded-md bg-white/10 px-3 py-2 text-left text-sm font-medium hover:bg-[var(--cisco-blue)]"
          >
            {a.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-white/50">Shortcut: ⌘⇧E · TV-safe large targets</p>
    </div>
  );
}
