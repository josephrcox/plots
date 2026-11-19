// Explains the town's stats: what is pushing each one up or down right now,
// what the stat does for the town, and which needs want attention. Mirrors
// the rules in simulation.ts so the panel can say *why*, not just *what*.

import type { Game } from "./types";
import { hasPlotOfType } from "./store";
import { townNeighbourhoodDelta } from "./neighbours";
import { FOOD_PER_PERSON } from "./simulation";

export type Line = { text: string; good: boolean };
export type StatKey = "happiness" | "health" | "community";

const MIDPOINT = 150;
const RECREATION_SHARE = 0.2;
const RECREATION_FROM = 40; // buildings before recreation is demanded

function builtCounts(z: Game) {
  let total = 0;
  let recreation = 0;
  for (const row of z.plots) {
    for (const p of row) {
      if (!p.active || p.type < 0) continue;
      total++;
    }
  }
  recreation = z.townInfo.recreation;
  return { total, recreation };
}

function fmt(n: number) {
  const r = Math.round(n * 10) / 10;
  return `${r > 0 ? "+" : ""}${r}`;
}

/** Causes currently moving each stat, strongest-looking first. */
export function statDrivers(z: Game): Record<StatKey, Line[]> {
  const info = z.townInfo;
  const neighbourhood = townNeighbourhoodDelta(z);
  const foodShort = z.resources.food < info.population_count * FOOD_PER_PERSON;
  const { total, recreation } = builtCounts(z);

  const happiness: Line[] = [];
  if (z.economyAndLaws.tax_rate > z.economyAndLaws.max_tax_rate) {
    happiness.push({ text: "Taxes are higher than people accept", good: false });
  }
  if (foodShort) happiness.push({ text: "Not enough food", good: false });
  if (z.resources.power < 0) {
    happiness.push({ text: "Power shortage (blackouts)", good: false });
  }
  if (total > RECREATION_FROM && recreation / total < RECREATION_SHARE) {
    happiness.push({ text: "Wants more recreation 🛝", good: false });
  } else if (total > RECREATION_FROM) {
    happiness.push({ text: "Enough recreation 🛝", good: true });
  }
  if (info.productivity > 100) {
    happiness.push({
      text: `Overworked (productivity ${Math.round(info.productivity)}%)`,
      good: false,
    });
  } else if (info.productivity < 100) {
    happiness.push({ text: "Relaxed work pace", good: true });
  }
  if (info.health < 50) {
    happiness.push({ text: "Sickness is spreading", good: false });
  }
  if (Math.abs(neighbourhood.happiness) >= 0.1) {
    happiness.push({
      text: `Neighbours ${fmt(neighbourhood.happiness)}/wk`,
      good: neighbourhood.happiness > 0,
    });
  }
  pushModifier(happiness, z.modifiers.happiness);

  const health: Line[] = [];
  if (foodShort) health.push({ text: "Not enough food", good: false });
  if (
    hasPlotOfType("mine", z).length > 0 &&
    hasPlotOfType("healing_house", z).length === 0
  ) {
    health.push({ text: "Mine dust (a Healing House helps)", good: false });
  }
  if (Math.abs(neighbourhood.health) >= 0.1) {
    health.push({
      text: `Neighbours ${fmt(neighbourhood.health)}/wk`,
      good: neighbourhood.health > 0,
    });
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
      return { text: "Too unhappy: nobody new moves in", good: false };
    }
    return {
      text: `Income ×${income.toFixed(2)}${v >= 200 ? " (max at 200)" : ""}`,
      good: income >= 1,
    };
  }
  if (key === "health") {
    if (v < 25) return { text: "People are dying and leaving", good: false };
    if (v < 50) return { text: "Sick people may leave", good: false };
    return { text: "Healthy: nobody leaves from sickness", good: true };
  }
  if (v > MIDPOINT) {
    return { text: "Income ×1.1, production ×1.2", good: true };
  }
  if (v < 100) return { text: "Income ×0.8, production ×0.85", good: false };
  return { text: "No effect between 100 and 150", good: true };
}

/** Needs worth flagging right now (empty when everything is fine). */
export function townNeeds(z: Game): Line[] {
  const needs: Line[] = [];
  const { total, recreation } = builtCounts(z);
  if (total > RECREATION_FROM * 0.75) {
    const wanted = Math.ceil(total * RECREATION_SHARE);
    needs.push({
      text: `🛝 Recreation ${recreation} of ${wanted} wanted${total <= RECREATION_FROM ? " (soon)" : ""}`,
      good: recreation >= wanted,
    });
  }
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
      text: `🔋 Power short by ${Math.round(-z.resources.power * 10) / 10}`,
      good: false,
    });
  }
  return needs;
}
