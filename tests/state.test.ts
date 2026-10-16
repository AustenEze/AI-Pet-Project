import { describe, it, expect } from "vitest";
import { applyDecay, applyAction, initialNeeds, buildSnapshot } from "../src/pet/state.js";
import { NEED_NAMES, type NeedName, type NeedState } from "../src/pet/needs.js";
import type { ActionName } from "../src/pet/actions.js";

const BASE_TIME = 1_700_000_000_000; // fixed reference point

function makeNeeds(value: number, at: number): Record<NeedName, NeedState> {
  const needs = {} as Record<NeedName, NeedState>;
  for (const name of NEED_NAMES) {
    needs[name] = { value, lastUpdated: at };
  }
  return needs;
}

describe("applyDecay", () => {
  it("does not change needs when no time has passed", () => {
    const needs = initialNeeds(BASE_TIME);
    const after = applyDecay(needs, BASE_TIME);
    for (const name of NEED_NAMES) {
      expect(after[name].value).toBe(needs[name].value);
    }
  });

  it("reduces needs after one hour", () => {
    const needs = initialNeeds(BASE_TIME);
    const oneHourLater = BASE_TIME + 60 * 60 * 1000;
    const after = applyDecay(needs, oneHourLater);

    for (const name of NEED_NAMES) {
      expect(after[name].value).toBeLessThan(needs[name].value);
      expect(after[name].lastUpdated).toBe(oneHourLater);
    }
  });

  it("never drops below zero", () => {
    const needs = makeNeeds(1, BASE_TIME);
    const farFuture = BASE_TIME + 100 * 60 * 60 * 1000; // 100 hours
    const after = applyDecay(needs, farFuture);

    for (const name of NEED_NAMES) {
      expect(after[name].value).toBe(0);
    }
  });

  it("does not mutate the input object", () => {
    const needs = initialNeeds(BASE_TIME);
    const original = JSON.parse(JSON.stringify(needs));
    applyDecay(needs, BASE_TIME + 3_600_000);
    expect(needs).toEqual(original);
  });

  it("applies correct per-need decay rates", () => {
    const needs = makeNeeds(100, BASE_TIME);
    const oneHourLater = BASE_TIME + 3_600_000;
    const after = applyDecay(needs, oneHourLater);

    // hunger decays at 3/hr → 100 - 3 = 97
    expect(after.hunger.value).toBeCloseTo(97, 1);
    // hygiene decays at 1/hr → 100 - 1 = 99
    expect(after.hygiene.value).toBeCloseTo(99, 1);
  });
});

describe("applyAction", () => {
  it("increases the target need", () => {
    const needs = makeNeeds(50, BASE_TIME);
    const { needs: after } = applyAction(needs, "feed", BASE_TIME);
    expect(after.hunger.value).toBeGreaterThan(50);
  });

  it("caps needs at 100", () => {
    const needs = makeNeeds(95, BASE_TIME);
    const { needs: after } = applyAction(needs, "feed", BASE_TIME);
    expect(after.hunger.value).toBe(100);
  });

  it("play reduces energy (secondary effect)", () => {
    const needs = makeNeeds(50, BASE_TIME);
    const { needs: after } = applyAction(needs, "play", BASE_TIME);
    expect(after.happiness.value).toBeGreaterThan(50);
    expect(after.energy.value).toBeLessThan(50);
  });

  it("returns a non-empty message", () => {
    const needs = makeNeeds(50, BASE_TIME);
    const { message } = applyAction(needs, "pet", BASE_TIME);
    expect(message.length).toBeGreaterThan(0);
  });
});

describe("buildSnapshot", () => {
  it("includes name, needs, mood, and flagged fields", () => {
    const needs = initialNeeds(BASE_TIME);
    const snap = buildSnapshot(needs, null);

    expect(snap.name).toBe("Pip");
    expect(snap.mood.score).toBeGreaterThan(0);
    expect(snap.mood.level).toBeDefined();
    expect(snap.mood.description).toBeDefined();
    expect(snap.flagged).toBeDefined();
    expect(snap.lastActionAt).toBeNull();
  });

  it("flags critical needs correctly", () => {
    const needs = makeNeeds(5, BASE_TIME);
    const snap = buildSnapshot(needs, null);
    expect(snap.flagged.critical.length).toBe(6);
  });
});
