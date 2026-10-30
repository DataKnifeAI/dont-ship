/** House edge applied as flat subtract from fair odds (1/p). */
export const HOUSE_EDGE = 0.05;

/** payout ≈ (1 / displayedProb) − house edge; clamped so low probs still pay. */
export function payoutForProb(displayedProb) {
  const p = Math.max(0.01, Math.min(0.99, displayedProb));
  const fair = 1 / p;
  return Math.max(1.01, +(fair - HOUSE_EDGE).toFixed(2));
}

export function formatProb(p) {
  return `${Math.round(p * 100)}%`;
}

export function formatPayout(mult) {
  return `${mult.toFixed(2)}×`;
}

/**
 * Brier score: mean((forecast − outcome)²). Lower = better calibrated.
 * outcome: 1 = completed run, 0 = death / forfeit.
 */
export function brierScore(forecasts, outcomes) {
  if (!forecasts.length) return null;
  let sum = 0;
  for (let i = 0; i < forecasts.length; i++) {
    const d = forecasts[i] - outcomes[i];
    sum += d * d;
  }
  return sum / forecasts.length;
}

/** Display helper: Brier as 0–1 skill-ish "O.D.D.S." (1 − √Brier). */
export function oddsDisplay(brier) {
  if (brier == null) return "—";
  const skill = Math.max(0, 1 - Math.sqrt(brier));
  return `${Math.round(skill * 100)}%`;
}
