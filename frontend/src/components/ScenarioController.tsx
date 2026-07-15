"use client";

const GROUPS: { heading: string; actions: { id: string; label: string; primary?: boolean }[] }[] = [
  {
    heading: "Scene flow",
    actions: [
      { id: "reset", label: "Reset Demo" },
      { id: "start_preopening", label: "Start Pre-Opening", primary: true },
      { id: "apply_readiness_fixes", label: "Apply Readiness Fixes" },
      { id: "mark_ready", label: "Mark Ready" },
      { id: "start_live_event", label: "Advance to Live Event", primary: true },
      { id: "trigger_gate1_incident", label: "Trigger Gate 1 Incident", primary: true },
      { id: "approve_recovery", label: "Approve Recovery" },
    ],
  },
  {
    heading: "Safety / reliability",
    actions: [
      { id: "force_recovery", label: "Force Recovery" },
      { id: "toggle_ai_fallback", label: "Toggle AI Fallback" },
      { id: "pause_streams", label: "Pause Streams" },
      { id: "resume_streams", label: "Resume Streams" },
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
    <div className="glass fixed bottom-4 left-4 z-50 w-[320px] rounded-2xl border-[var(--border-strong)] p-4 text-[var(--text)] shadow-2xl">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] grad-text">Presenter controls</div>
          <div className="font-display text-sm font-bold capitalize">Phase: {phase.replaceAll("_", " ")}</div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border border-[var(--border-strong)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          Hide
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        <span className="flex-1 rounded-lg border border-[var(--border)] bg-white/[0.02] px-2 py-1 text-center text-[10px]">
          AI: <b className={aiFallback ? "text-[var(--text-muted)]" : "text-[var(--status-healthy)]"}>{aiFallback ? "Curated" : "Live"}</b>
        </span>
        <span className="flex-1 rounded-lg border border-[var(--border)] bg-white/[0.02] px-2 py-1 text-center text-[10px]">
          Streams: <b className={streamsPaused ? "text-[var(--status-watch)]" : "text-[var(--status-healthy)]"}>{streamsPaused ? "Paused" : "Live"}</b>
        </span>
      </div>

      <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-0.5">
        {GROUPS.map((g) => (
          <div key={g.heading}>
            <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
              {g.heading}
            </div>
            <div className="grid gap-1.5">
              {g.actions.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onAction(a.id)}
                  className={
                    "rounded-lg px-3 py-2 text-left text-[13px] font-semibold transition " +
                    (a.primary
                      ? "grad-bg text-white hover:brightness-110"
                      : "border border-[var(--border)] bg-white/[0.03] text-[var(--text)] hover:border-[rgba(79,123,255,0.5)] hover:bg-[var(--accent-soft)]")
                  }
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[10px] text-[var(--text-dim)]">Shortcut: ⌘⇧E · TV-safe large targets</p>
    </div>
  );
}
