/** A single measurable need. Values are clamped to [0, 100]. */
export interface NeedState {
  value: number;
  lastUpdated: number; // Unix timestamp (ms)
}

/** Static configuration for one need. */
export interface NeedConfig {
  label: string;
  /** Points lost per real-world hour when ignored. */
  decayPerHour: number;
  /** Descriptive thresholds for display / mood calculation. */
  lowThreshold: number;
  criticalThreshold: number;
}

export type NeedName =
  | "hunger"
  | "energy"
  | "happiness"
  | "hygiene"
  | "curiosity"
  | "affection";

export const NEED_CONFIGS: Record<NeedName, NeedConfig> = {
  hunger: {
    label: "Hunger (satiety)",
    decayPerHour: 3,
    lowThreshold: 35,
    criticalThreshold: 15,
  },
  energy: {
    label: "Energy",
    decayPerHour: 2,
    lowThreshold: 30,
    criticalThreshold: 10,
  },
  happiness: {
    label: "Happiness",
    decayPerHour: 2.5,
    lowThreshold: 30,
    criticalThreshold: 12,
  },
  hygiene: {
    label: "Hygiene",
    decayPerHour: 1,
    lowThreshold: 25,
    criticalThreshold: 10,
  },
  curiosity: {
    label: "Curiosity",
    decayPerHour: 2,
    lowThreshold: 30,
    criticalThreshold: 12,
  },
  affection: {
    label: "Affection",
    decayPerHour: 3,
    lowThreshold: 35,
    criticalThreshold: 15,
  },
} as const;

export const NEED_NAMES = Object.keys(NEED_CONFIGS) as NeedName[];

export const DEFAULT_NEED_VALUE = 80;

export function clampNeed(v: number): number {
  return Math.max(0, Math.min(100, v));
}
