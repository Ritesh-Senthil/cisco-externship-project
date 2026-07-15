"use client";

import { useState } from "react";
import { statusColor } from "@/components/ui";
import type { ScenarioSnapshot } from "@/lib/types";

export function EvidenceDrawer({
  open,
  onClose,
  snapshot,
}: {
  open: boolean;
  onClose: () => void;
  snapshot: ScenarioSnapshot | null;
}) {
  const [showRaw, setShowRaw] = useState(false);
  if (!open || !snapshot) return null;
  const incident = snapshot.active_incident;
  const catalyst = snapshot.catalyst;
  const evidence = incident?.evidence || [
    "No active incident. Domain scores and recent normalized events remain available for inspection.",
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="glass animate-fade-up relative flex w-full max-w-md flex-col border-l border-[var(--border-strong)]">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] grad-text">Inspectable reasoning</div>
            <h2 className="font-display text-lg font-extrabold text-[var(--text)]">Evidence Trace</h2>
            <p className="text-[11px] text-[var(--text-muted)]">How the engine reached its verdict · ⌘⇧D</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            Close
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {catalyst?.live && (
            <section className="grad-border rounded-xl bg-[var(--accent-soft)] p-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-[13px] font-bold text-[var(--text)]">Cisco Catalyst Center</h3>
                <span
                  className={
                    "inline-flex items-center gap-1.5 text-[11px] font-semibold " +
                    (catalyst.connected ? "text-[var(--status-healthy)]" : "text-[var(--status-watch)]")
                  }
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current pulse-dot" />
                  {catalyst.connected ? "Connected" : "Standby"}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                Live control-plane evidence{catalyst.host ? ` · ${catalyst.host}` : ""}
              </p>
              {catalyst.connected ? (
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
                  <dt className="text-[var(--text-muted)]">Backbone health</dt>
                  <dd className="text-right font-semibold text-[var(--text)]">
                    {catalyst.network_health_score != null ? `${catalyst.network_health_score.toFixed(0)}/100` : "—"}
                  </dd>
                  <dt className="text-[var(--text-muted)]">Managed devices</dt>
                  <dd className="text-right font-semibold text-[var(--text)]">{catalyst.device_count ?? "—"}</dd>
                  <dt className="text-[var(--text-muted)]">AI-driven issues</dt>
                  <dd className="text-right font-semibold text-[var(--text)]">{catalyst.ai_issue_count ?? "—"}</dd>
                </dl>
              ) : (
                <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                  Real Cisco signal unavailable ({catalyst.note}) — synthetic scenario unaffected.
                </p>
              )}
            </section>
          )}

          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
              Reasoning steps
            </h3>
            <ol className="mt-2.5 space-y-2">
              {evidence.map((line, i) => (
                <li key={line} className="flex gap-2.5 rounded-lg border border-[var(--border)] bg-white/[0.02] p-2.5">
                  <span className="grad-bg flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-[12.5px] leading-snug text-[var(--text-muted)]">{line}</span>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
              Domain scores
            </h3>
            <ul className="mt-2.5 space-y-2">
              {snapshot.readiness.domain_scores.map((d) => {
                const color = statusColor(d.status);
                return (
                  <li key={d.domain}>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="capitalize text-[var(--text)]">{d.domain}</span>
                      <span className="font-semibold" style={{ color }}>
                        {d.score.toFixed(0)} · {d.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, d.score)}%`, background: color, boxShadow: `0 0 8px ${color}` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
                Normalized events
              </h3>
              <button
                onClick={() => setShowRaw((v) => !v)}
                className="text-[11px] font-medium grad-text hover:underline"
              >
                {showRaw ? "Hide JSON" : "Show JSON"}
              </button>
            </div>
            <ul className="mt-2.5 max-h-72 space-y-2 overflow-y-auto">
              {snapshot.recent_events.slice(0, 12).map((raw, idx) => {
                const e = raw as {
                  eventId?: string;
                  sourceSystem?: string;
                  eventType?: string;
                  severity?: string;
                  metrics?: Record<string, unknown>;
                };
                const color = statusColor(e.severity || "info");
                return (
                  <li key={e.eventId || idx} className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                      <span className="text-[12px] font-semibold text-[var(--text)]">{e.sourceSystem}</span>
                      <span className="ml-auto text-[10px] text-[var(--text-dim)]">{e.eventType}</span>
                    </div>
                    {showRaw ? (
                      <pre className="mt-1.5 overflow-x-auto rounded bg-black/30 p-2 text-[10px] text-[var(--text-muted)]">
                        {JSON.stringify(e.metrics, null, 2)}
                      </pre>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {Object.entries(e.metrics || {})
                          .slice(0, 4)
                          .map(([k, v]) => (
                            <span
                              key={k}
                              className="rounded border border-[var(--border)] bg-white/[0.02] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
                            >
                              {k}: <span className="text-[var(--text)]">{String(v)}</span>
                            </span>
                          ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
