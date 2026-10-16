import { NEED_CONFIGS, type NeedName, type NeedState } from "./needs.js";

export type MoodLevel = "great" | "good" | "okay" | "low" | "critical";

const MOOD_WEIGHTS: Record<NeedName, number> = {
  hunger: 1.2,
  energy: 1.0,
  happiness: 1.3,
  hygiene: 0.7,
  curiosity: 0.9,
  affection: 1.1,
};

const totalWeight = Object.values(MOOD_WEIGHTS).reduce((a, b) => a + b, 0);

/**
 * Compute a 0–100 overall mood score as a weighted average of all needs.
 */
export function computeMoodScore(
  needs: Record<NeedName, NeedState>,
): number {
  let weighted = 0;
  for (const [name, state] of Object.entries(needs) as [NeedName, NeedState][]) {
    weighted += state.value * (MOOD_WEIGHTS[name] ?? 1);
  }
  return Math.round((weighted / totalWeight) * 100) / 100;
}

export function moodLevel(score: number): MoodLevel {
  if (score >= 75) return "great";
  if (score >= 55) return "good";
  if (score >= 35) return "okay";
  if (score >= 18) return "low";
  return "critical";
}

/**
 * Return a short flavour sentence based on mood, suitable for future
 * chat context injection.
 */
export function moodDescription(score: number): string {
  const level = moodLevel(score);
  switch (level) {
    case "great":
      return "Pip is bouncing with joy — everything feels wonderful!";
    case "good":
      return "Pip is cheerful and humming softly.";
    case "okay":
      return "Pip is doing alright, but could use a little attention.";
    case "low":
      return "Pip seems droopy and is looking at you hopefully.";
    case "critical":
      return "Pip is curled up quietly and really needs some care.";
  }
}

/**
 * Identify which needs are below their low/critical thresholds.
 */
export function flaggedNeeds(
  needs: Record<NeedName, NeedState>,
): { critical: NeedName[]; low: NeedName[] } {
  const critical: NeedName[] = [];
  const low: NeedName[] = [];

  for (const [name, state] of Object.entries(needs) as [NeedName, NeedState][]) {
    const cfg = NEED_CONFIGS[name];
    if (state.value <= cfg.criticalThreshold) critical.push(name);
    else if (state.value <= cfg.lowThreshold) low.push(name);
  }

  return { critical, low };
}
