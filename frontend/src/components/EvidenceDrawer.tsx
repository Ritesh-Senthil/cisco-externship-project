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
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="animate-fade-up relative flex w-full max-w-md flex-col border-l border-[var(--line-strong)] bg-[var(--console-2)]">
        <header className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <div className="label-caps text-[var(--signal-ink)]">Inspectable reasoning</div>
            <h2 className="text-[16px] font-semibold text-[var(--ink)]">Evidence trace</h2>
            <p className="label">How the engine reached its verdict · ⌘⇧D</p>
          </div>
          <button onClick={onClose} className="btn ring-focus">
            Close
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {catalyst?.live && (
            <section className="relative overflow-hidden rounded-[var(--r-sm)] border border-[var(--signal-line)] bg-[var(--signal-weak)] p-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-medium text-[var(--ink)]">Cisco Catalyst Center</h3>
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
                  style={{ color: catalyst.connected ? "var(--nominal)" : "var(--caution)" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current pulse-dot" />
                  {catalyst.connected ? "Connected" : "Standby"}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-[var(--ink-2)]">
                Live control-plane evidence{catalyst.host ? ` · ${catalyst.host}` : ""}
              </p>
              {catalyst.connected ? (
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
                  <dt className="text-[var(--ink-2)]">Backbone health</dt>
                  <dd className="tnum text-right font-semibold text-[var(--ink)]">
                    {catalyst.network_health_score != null ? `${catalyst.network_health_score.toFixed(0)}/100` : "—"}
                  </dd>
                  <dt className="text-[var(--ink-2)]">Managed devices</dt>
                  <dd className="tnum text-right font-semibold text-[var(--ink)]">{catalyst.device_count ?? "—"}</dd>
                  <dt className="text-[var(--ink-2)]">AI-driven issues</dt>
                  <dd className="tnum text-right font-semibold text-[var(--ink)]">{catalyst.ai_issue_count ?? "—"}</dd>
                </dl>
              ) : (
                <p className="mt-2 text-[11px] text-[var(--ink-2)]">
                  Real Cisco signal unavailable ({catalyst.note}) — synthetic scenario unaffected.
                </p>
              )}
            </section>
          )}

          <section>
            <h3 className="label-caps">Reasoning steps</h3>
            <ol className="mt-2.5 space-y-2">
              {evidence.map((line, i) => (
                <li key={line} className="well flex gap-2.5 p-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--signal)] text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-[12.5px] leading-snug text-[var(--ink-2)]">{line}</span>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="label-caps">Domain scores</h3>
            <ul className="mt-2.5 space-y-2">
              {snapshot.readiness.domain_scores.map((d) => {
                const color = statusColor(d.status);
                return (
                  <li key={d.domain}>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="capitalize text-[var(--ink)]">{d.domain}</span>
                      <span className="tnum font-semibold" style={{ color }}>
                        {d.score.toFixed(0)} · {d.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--deck-inset)]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, d.score)}%`, background: color }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="label-caps">Normalized events</h3>
              <button
                onClick={() => setShowRaw((v) => !v)}
                className="ring-focus rounded-[var(--r-xs)] text-[11px] font-medium text-[var(--signal-ink)] transition-colors hover:text-[var(--ink)]"
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
                  <li key={e.eventId || idx} className="well p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                      <span className="text-[12px] font-semibold text-[var(--ink)]">{e.sourceSystem}</span>
                      <span className="ml-auto text-[10px] text-[var(--ink-3)]">{e.eventType}</span>
                    </div>
                    {showRaw ? (
                      <pre className="tnum mt-1.5 overflow-x-auto rounded bg-[var(--deck-inset)] p-2 text-[10px] text-[var(--ink-2)]">
                        {JSON.stringify(e.metrics, null, 2)}
                      </pre>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {Object.entries(e.metrics || {})
                          .slice(0, 4)
                          .map(([k, v]) => (
                            <span
                              key={k}
                              className="tnum rounded border border-[var(--line)] bg-[var(--deck)] px-1.5 py-0.5 text-[10px] text-[var(--ink-2)]"
                            >
                              {k}: <span className="text-[var(--ink)]">{String(v)}</span>
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
