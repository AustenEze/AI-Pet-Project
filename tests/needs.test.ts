import { describe, it, expect } from "vitest";
import { clampNeed, NEED_CONFIGS, NEED_NAMES, DEFAULT_NEED_VALUE } from "../src/pet/needs.js";

describe("clampNeed", () => {
  it("returns value unchanged when within bounds", () => {
    expect(clampNeed(50)).toBe(50);
  });

  it("clamps to 0 when negative", () => {
    expect(clampNeed(-10)).toBe(0);
  });

  it("clamps to 100 when over max", () => {
    expect(clampNeed(120)).toBe(100);
  });

  it("handles boundary values", () => {
    expect(clampNeed(0)).toBe(0);
    expect(clampNeed(100)).toBe(100);
  });
});

describe("NEED_CONFIGS", () => {
  it("defines exactly six needs", () => {
    expect(NEED_NAMES).toHaveLength(6);
  });

  it("every need has positive decay", () => {
    for (const name of NEED_NAMES) {
      expect(NEED_CONFIGS[name].decayPerHour).toBeGreaterThan(0);
    }
  });

  it("critical threshold is below low threshold for every need", () => {
    for (const name of NEED_NAMES) {
      const cfg = NEED_CONFIGS[name];
      expect(cfg.criticalThreshold).toBeLessThan(cfg.lowThreshold);
    }
  });

  it("default value is above all low thresholds", () => {
    for (const name of NEED_NAMES) {
      expect(DEFAULT_NEED_VALUE).toBeGreaterThan(NEED_CONFIGS[name].lowThreshold);
    }
  });
});
