import type { MetricPoint } from "@/hooks/useEventShield";
import type { ScenarioSnapshot } from "@/lib/types";

/**
 * Illustrative financial model for the demo. All inputs are simulated; the model
 * is transparent so a finance-minded judge can see exactly how each figure is
 * derived. Public N.C. State Fair figures (900k+ attendees, ~$16.46M division
 * revenue) anchor the per-guest value assumption.
 */

// $16.46M annual division revenue / ~900k attendees ≈ $18 gate value;
// blended with a conservative ~$14 on-site spend (food, rides) → ~$32/guest.
const VALUE_PER_GUEST = 32;
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
