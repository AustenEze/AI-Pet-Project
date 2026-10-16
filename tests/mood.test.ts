import { describe, it, expect } from "vitest";
import { computeMoodScore, moodLevel, moodDescription, flaggedNeeds } from "../src/pet/mood.js";
import { NEED_NAMES, type NeedName, type NeedState } from "../src/pet/needs.js";

function makeNeeds(value: number): Record<NeedName, NeedState> {
  const needs = {} as Record<NeedName, NeedState>;
  for (const name of NEED_NAMES) {
    needs[name] = { value, lastUpdated: Date.now() };
  }
  return needs;
}

describe("computeMoodScore", () => {
  it("returns 100 when all needs are maxed", () => {
    expect(computeMoodScore(makeNeeds(100))).toBeCloseTo(100, 0);
  });

  it("returns 0 when all needs are zero", () => {
    expect(computeMoodScore(makeNeeds(0))).toBe(0);
  });

  it("returns roughly the value when all needs are equal", () => {
    expect(computeMoodScore(makeNeeds(60))).toBeCloseTo(60, 0);
  });
});

describe("moodLevel", () => {
  it("maps scores to correct levels", () => {
    expect(moodLevel(90)).toBe("great");
    expect(moodLevel(75)).toBe("great");
    expect(moodLevel(60)).toBe("good");
    expect(moodLevel(40)).toBe("okay");
    expect(moodLevel(20)).toBe("low");
    expect(moodLevel(10)).toBe("critical");
    expect(moodLevel(0)).toBe("critical");
  });
});

describe("moodDescription", () => {
  it("returns a string for every level", () => {
    for (const score of [90, 60, 40, 20, 5]) {
      expect(typeof moodDescription(score)).toBe("string");
      expect(moodDescription(score).length).toBeGreaterThan(0);
    }
  });
});

describe("flaggedNeeds", () => {
  it("returns empty arrays when all needs are high", () => {
    const { critical, low } = flaggedNeeds(makeNeeds(80));
    expect(critical).toHaveLength(0);
    expect(low).toHaveLength(0);
  });

  it("flags all needs as critical when values are very low", () => {
    const { critical } = flaggedNeeds(makeNeeds(5));
    expect(critical).toHaveLength(6);
  });

  it("separates low from critical correctly", () => {
    const needs = makeNeeds(80);
    needs.hunger = { value: 30, lastUpdated: Date.now() }; // below low (35)
    needs.energy = { value: 5, lastUpdated: Date.now() };  // below critical (10)

    const { critical, low } = flaggedNeeds(needs);
    expect(critical).toContain("energy");
    expect(low).toContain("hunger");
    expect(critical).not.toContain("hunger");
  });
});
