import {
  clampNeed,
  DEFAULT_NEED_VALUE,
  NEED_CONFIGS,
  NEED_NAMES,
  type NeedName,
  type NeedState,
} from "./needs.js";
import { ACTION_CONFIGS, type ActionName } from "./actions.js";
import { computeMoodScore, moodLevel, moodDescription, flaggedNeeds } from "./mood.js";

export interface PetSnapshot {
  name: string;
  needs: Record<NeedName, NeedState>;
  mood: {
    score: number;
    level: string;
    description: string;
  };
  flagged: { critical: NeedName[]; low: NeedName[] };
  lastActionAt: number | null;
}

/**
 * Apply time-based decay to a set of needs.
 * Pure function — returns new state without mutating input.
 */
export function applyDecay(
  needs: Record<NeedName, NeedState>,
  now: number,
): Record<NeedName, NeedState> {
  const updated = { ...needs };

  for (const name of NEED_NAMES) {
    const prev = needs[name];
    const cfg = NEED_CONFIGS[name];
    const elapsedHours = (now - prev.lastUpdated) / (1000 * 60 * 60);
    if (elapsedHours <= 0) {
      updated[name] = { ...prev };
      continue;
    }
    const decayed = prev.value - cfg.decayPerHour * elapsedHours;
    updated[name] = { value: clampNeed(decayed), lastUpdated: now };
  }

  return updated;
}

/**
 * Apply one care action to the needs.
 * Returns the new needs state plus a short response message.
 */
export function applyAction(
  needs: Record<NeedName, NeedState>,
  action: ActionName,
  now: number,
): { needs: Record<NeedName, NeedState>; message: string } {
  const cfg = ACTION_CONFIGS[action];
  const updated = { ...needs };

  for (const effect of cfg.effects) {
    const prev = updated[effect.need];
    updated[effect.need] = {
      value: clampNeed(prev.value + effect.delta),
      lastUpdated: now,
    };
  }

  return { needs: updated, message: `${cfg.label} — done!` };
}

/**
 * Build a full snapshot for the API response.
 */
export function buildSnapshot(
  needs: Record<NeedName, NeedState>,
  lastActionAt: number | null,
): PetSnapshot {
  const score = computeMoodScore(needs);
  return {
    name: "Pip",
    needs,
    mood: {
      score,
      level: moodLevel(score),
      description: moodDescription(score),
    },
    flagged: flaggedNeeds(needs),
    lastActionAt,
  };
}

/**
 * Create a fresh set of needs for a new pet.
 */
export function initialNeeds(now: number): Record<NeedName, NeedState> {
  const needs = {} as Record<NeedName, NeedState>;
  for (const name of NEED_NAMES) {
    needs[name] = { value: DEFAULT_NEED_VALUE, lastUpdated: now };
  }
  return needs;
}
