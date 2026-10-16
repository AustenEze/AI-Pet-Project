import type { NeedName } from "./needs.js";

export type ActionName = "feed" | "play" | "rest" | "clean" | "explore" | "pet";

export interface ActionEffect {
  need: NeedName;
  delta: number;
}

export interface ActionConfig {
  label: string;
  effects: ActionEffect[];
  /** Minimum seconds between uses (simple cooldown). */
  cooldownSeconds: number;
}

/**
 * Each action has a primary effect and may carry small secondary effects
 * to reward varied care.
 */
export const ACTION_CONFIGS: Record<ActionName, ActionConfig> = {
  feed: {
    label: "Feed Pip",
    effects: [
      { need: "hunger", delta: 25 },
      { need: "happiness", delta: 5 },
    ],
    cooldownSeconds: 60,
  },
  play: {
    label: "Play with Pip",
    effects: [
      { need: "happiness", delta: 20 },
      { need: "curiosity", delta: 10 },
      { need: "energy", delta: -5 },
    ],
    cooldownSeconds: 60,
  },
  rest: {
    label: "Put Pip to sleep",
    effects: [
      { need: "energy", delta: 30 },
      { need: "happiness", delta: 5 },
    ],
    cooldownSeconds: 120,
  },
  clean: {
    label: "Bathe Pip",
    effects: [
      { need: "hygiene", delta: 30 },
      { need: "happiness", delta: 8 },
    ],
    cooldownSeconds: 90,
  },
  explore: {
    label: "Take Pip exploring",
    effects: [
      { need: "curiosity", delta: 25 },
      { need: "happiness", delta: 8 },
      { need: "energy", delta: -8 },
    ],
    cooldownSeconds: 90,
  },
  pet: {
    label: "Cuddle Pip",
    effects: [
      { need: "affection", delta: 25 },
      { need: "happiness", delta: 10 },
    ],
    cooldownSeconds: 30,
  },
} as const;

export const ACTION_NAMES = Object.keys(ACTION_CONFIGS) as ActionName[];
