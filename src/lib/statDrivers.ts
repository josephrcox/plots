// Explains the town's stats: what is pushing each one up or down right now,
// what the stat does for the town, and which needs want attention. Mirrors
// the rules in simulation.ts so the panel can say *why*, not just *what*.

import type { Game } from "./types";
import { boredomEffect } from "./boredom";
import { moodSummary } from "./people";
import { strength, STEPS } from "./strength";
import { taxMood } from "./tax";
import { needStatus, needEffect } from "./needs";
import { hasPlotOfType } from "./store";
import { townHomeEffect } from "./land";
import { FOOD_PER_PERSON, WELL_FED_WEEKS } from "./simulation";

export type Line = { text: string; good: boolean; strength?: number; exact?: string };
export type StatKey = "happiness" | "health" | "community";

const MIDPOINT = 150;
/** A word for how the stat is doing, for the status panel. */
export function statWord(key: StatKey, v: number): string {
  const scale: Record<StatKey, [number, string][]> = {
    happiness: [
      [50, "Miserable"],
      [100, "Unhappy"],
      [140, "Restless"],
      [165, "Content"],
      [225, "Happy"],
      [Infinity, "Joyful"],
    ],
    health: [
      [25, "Dying"],
      [50, "Sick"],
      [100, "Unwell"],
      [140, "Fair"],
      [165, "Healthy"],
      [225, "Thriving"],
      [Infinity, "Vigorous"],
    ],
    community: [
      [100, "Divided"],
      [140, "Distant"],
      [165, "Neighbourly"],
      [225, "Close-knit"],
      [Infinity, "Tight-knit"],
    ],
  };
  return scale[key].find(([limit]) => v < limit)![1];
}

function pct(multiplier: number) {
  const p = Math.round((multiplier - 1) * 100);
  return `${p >= 0 ? "+" : "−"}${Math.abs(p)}%`;
}

/** Causes currently moving each stat, strongest-looking first. */
export function statDrivers(z: Game): Record<StatKey, Line[]> {
  const info = z.townInfo;
  const neighbourhood = townHomeEffect(z);
  const foodShort = z.resources.food < info.population_count * FOOD_PER_PERSON;

  const happiness: Line[] = [];
  const tax = taxMood(z);
  if (tax.level === "high" || tax.level === "bad") {
    happiness.push({ text: `Taxes: ${tax.word.toLowerCase()}`, good: false });
  } else if (tax.level === "low") {
    happiness.push({ text: "Low taxes", good: true });
  }
  if (foodShort) happiness.push({ text: "Not enough food", good: false });
  if (z.resources.power < 0) {
    happiness.push({ text: "Power shortage (blackouts)", good: false });
  }
  const needs = needStatus(z);
  const effect = needEffect(z, needs);
  // Townspeople's own situations (homes, favourite places, jobs, missing services).
  for (const part of moodSummary(z, 3)) {
    happiness.push({ text: part.text, good: part.amount > 0, strength: strength(part.amount, STEPS.mood), exact: `${part.amount > 0 ? "+" : ""}${part.amount.toFixed(1)} average mood` });
  }
  if (needs.length && needs.every((n) => n.met)) {
    happiness.push({ text: "The town's needs are met", good: true });
  }
  if (info.productivity > 100) {
    happiness.push({ text: "Overworked (high productivity)", good: false });
  } else if (info.productivity < 100) {
    happiness.push({ text: "Relaxed work pace", good: true });
  }
  if (info.health < 50) {
    happiness.push({ text: "Sickness is spreading", good: false });
  }
  if (boredomEffect(z) < -0.2) {
    happiness.push({ text: "The town feels stale: try something new", good: false });
  }
  if (z.wellFed) {
    happiness.push({ text: `Well fed (${WELL_FED_WEEKS}+ weeks of food)`, good: true });
  }
  pushModifier(happiness, z.modifiers.happiness);

  const health: Line[] = [];
  if (foodShort) health.push({ text: "Not enough food", good: false });
  if (effect.health < 0) {
    health.push({ text: "Not enough health care ⚕️", good: false });
  }
  if (neighbourhood.health <= -0.1) {
    health.push({
      text: `Polluted air around ${neighbourhood.pollutedHomes || "some"} home${neighbourhood.pollutedHomes === 1 ? "" : "s"}`,
      good: false,
    });
  }
  if (z.wellFed) {
    health.push({ text: `Well fed (${WELL_FED_WEEKS}+ weeks of food)`, good: true });
  }
  pushModifier(health, z.modifiers.health);

  const community: Line[] = [];
  pushModifier(community, z.modifiers.community);

  // Bad news first.
  const order = (a: Line, b: Line) => Number(a.good) - Number(b.good);
  return {
    happiness: happiness.sort(order),
    health: health.sort(order),
    community: community.sort(order),
  };
}

function pushModifier(lines: Line[], modifier: number) {
  if (modifier > 1.01) {
    lines.push({ text: "Boost from recent buildings (fading)", good: true });
  } else if (modifier < 0.99) {
    lines.push({ text: "Recovering from recent hardship", good: false });
  }
}

/** What the stat does for the town at its current value. */
export function statEffect(z: Game, key: StatKey): Line {
  const v = z.townInfo[key];
  if (key === "happiness") {
    const income = Math.min(2, Math.max(0.75, v / 100));
    if (v <= 50) {
      return { text: "Too unhappy: nobody moves in, people leave", good: false };
    }
    return {
      text: income >= 1 ? `Boosts tax income${v >= 200 ? " (the most it gets)" : ""}` : "Lowers tax income",
      good: income >= 1,
      strength: strength(income - 1, STEPS.boost),
      exact: `Tax income ${pct(income)}`,
    };
  }
  if (key === "health") {
    if (v < 25) return { text: "People are dying and leaving", good: false };
    if (v < 50) return { text: "Sick people may leave", good: false };
    return { text: "Healthy: nobody leaves from sickness", good: true };
  }
  if (v > MIDPOINT) {
    return { text: "Boosts income and production", good: true, strength: 2, exact: "Income +10%, production +20%" };
  }
  if (v < 100) return { text: "Lowers income and production", good: false, strength: 2, exact: "Income −20%, production −15%" };
  return { text: "No effect on income or production yet", good: true };
}

/** Needs worth flagging right now (empty when everything is fine). */
export function townNeeds(z: Game): Line[] {
  const needs: Line[] = [];
  const foodRate = z.resource_rate.food;
  if (foodRate < 0 && z.resources.food > 0) {
    const weeks = Math.floor(z.resources.food / -foodRate);
    if (weeks < 12) {
      needs.push({
        text: `🥕 Food runs out in ${weeks} week${weeks === 1 ? "" : "s"}`,
        good: false,
      });
    }
  } else if (z.resources.food <= 0 && z.townInfo.population_count > 0) {
    needs.push({ text: "🥕 Out of food", good: false });
  }
  if (z.resources.power < 0) {
    needs.push({
      text: "🔋 Power is short: blackouts",
      good: false,
      exact: `Short by ${Math.round(-z.resources.power * 10) / 10}`,
    });
  }
  return needs;
}
