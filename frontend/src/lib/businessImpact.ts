import type { MetricPoint } from "@/hooks/useEventShield";
import type { ScenarioSnapshot } from "@/lib/types";

/**
 * Illustrative financial model for the demo. All inputs are simulated; the model
 * is transparent so a finance-minded judge can see exactly how each figure is
 * derived. Anchored to the deck's own figures: N.C. State Fair draws ~1M
 * attendees on >$10M annual revenue, and the deck values a lost admission at
 * $10/ticket (a 52k attendance drop → $520k lost revenue).
 */

// $10 per ticket — matches the deck's "Why it Matters" revenue math.
const VALUE_PER_GUEST = 10;
// Share of queued guests who abandon entry when waits become excessive.
const BALK_RATE = 0.12;

export interface ImpactModel {
  phaseLabel: string;
  tone: "healthy" | "watch" | "critical";
  revenueAtRisk: number;
  lossAvoided: number;
  throughputGap: number;
  guestsDelayed: number;
  estAbandoning: number;
  assumptions: { valuePerGuest: number; balkRate: number };
}

export function computeImpact(snapshot: ScenarioSnapshot, history: MetricPoint[]): ImpactModel {
  const f = snapshot.readiness.forecast;
  const phase = snapshot.phase;

  const guestsDelayed = Math.max(0, Math.round(f.queue_estimate));
  const throughputGap = Math.max(0, Math.round(f.arrival_rate - f.processing_rate));
  const estAbandoning = Math.round(guestsDelayed * BALK_RATE);
  const revenueAtRisk = estAbandoning * VALUE_PER_GUEST;

  // Loss avoided = value of guests recovered from the observed peak queue.
  const peakQueue = history.length ? Math.max(...history.map((h) => h.queue), guestsDelayed) : guestsDelayed;
  const lossAvoided = Math.max(0, Math.round((peakQueue - guestsDelayed) * BALK_RATE)) * VALUE_PER_GUEST;

  let phaseLabel = "Nominal operations";
  let tone: ImpactModel["tone"] = "healthy";
  if (phase === "pre_opening") {
    phaseLabel = "Projected exposure at open";
    tone = "watch";
  } else if (phase === "incident") {
    phaseLabel = "Live revenue exposure";
    tone = "critical";
  } else if (phase === "recovering") {
    phaseLabel = "Recovering — loss being avoided";
    tone = "watch";
  } else if (phase === "resolved") {
    phaseLabel = "Stabilized — loss avoided";
    tone = "healthy";
  }

  return {
    phaseLabel,
    tone,
    revenueAtRisk,
    lossAvoided,
    throughputGap,
    guestsDelayed,
    estAbandoning,
    assumptions: { valuePerGuest: VALUE_PER_GUEST, balkRate: BALK_RATE },
  };
}

export function money(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(n)}`;
}
