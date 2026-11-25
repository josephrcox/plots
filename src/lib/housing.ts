// Home levels (#60). Homes grow when their surroundings are good and shrink
// when they aren't, so where you put homes, parks and industry decides how
// many people the same land can hold.
//
// Each week a home moves toward its next level if it is full, its land is
// good enough and the town is happy enough (and, from #48, the town's needs
// are met). After UP_WEEKS in a row it levels up. If its land falls below
// what its level needs, or the air is polluted, it slides back toward the
// level below and drops after DOWN_WEEKS. People over capacity move out.

import { options } from "./objects/PlotTypeOptions";
import { landValue, pollutionAt } from "./land";
import { needsAllowLevel, coverage, type ServiceId } from "./needs";
import type { Game, Plot, PlotOption } from "./types";

export const MAX_LEVEL = 3;
/** Capacity multiplier by level. */
const CAPACITY = [1, 1.5, 2];
/** Land value and town happiness needed to reach each level. */
const UP: Record<number, { value: number; happiness: number }> = {
  2: { value: 60, happiness: 110 },
  3: { value: 75, happiness: 130 },
};
/** Land value a home must keep to hold its level. */
const KEEP: Record<number, number> = { 2: 48, 3: 62 };
/** Polluted air pushes any upgraded home back down. */
const MAX_POLLUTION_TO_KEEP = 30;
const UP_WEEKS = { normal: 8, casual: 5 };
const DOWN_WEEKS = { normal: 6, casual: 12 };

export function isHomeOption(option: PlotOption | undefined | null): boolean {
  return option?.type === "residential";
}

export function homeLevel(plot: Plot): number {
  return plot.level ?? 1;
}

/** People a home holds at its current level. */
export function homeCapacity(plot: Plot): number {
  const option = plot.type > -1 ? options[plot.type] : undefined;
  if (!plot.active || !isHomeOption(option)) return 0;
  return Math.round(option!.immediate_variable_changes.population * CAPACITY[homeLevel(plot) - 1]);
}

/** Recomputes the town's housing capacity from its homes. */
export function syncCapacity(z: Game) {
  let total = 0;
  for (const row of z.plots) for (const p of row) total += homeCapacity(p);
  z.townInfo.population_max = total;
  if (z.townInfo.population_count > total) z.townInfo.population_count = total;
}

export type LevelStatus = {
  level: number;
  capacity: number;
  /** What's missing for the next level (empty when it's on its way or maxed). */
  missing: string[];
  /** Why it's slipping (empty when it's holding). */
  slipping: string[];
  trend: "up" | "down" | "steady";
  /** Weeks done toward the change, and weeks needed. */
  progress: number;
  weeks: number;
};

function weeks(z: Game, dir: "up" | "down") {
  const casual = z.gameSettings.includes("casual");
  return (dir === "up" ? UP_WEEKS : DOWN_WEEKS)[casual ? "casual" : "normal"];
}

/** Where a home stands: what it needs to grow, or why it is shrinking. */
export function levelStatus(
  plot: Plot,
  z: Game,
  full = true,
  cov?: Map<ServiceId, Set<string>>,
): LevelStatus {
  const level = homeLevel(plot);
  const { value } = landValue(plot.x, plot.y, z);
  const pollution = pollutionAt(z, plot.x, plot.y);
  const slipping: string[] = [];
  if (level > 1) {
    if (value < KEEP[level]) slipping.push(`Land value ${value} is below ${KEEP[level]}`);
    if (pollution >= MAX_POLLUTION_TO_KEEP) slipping.push(`Polluted air (${Math.round(pollution)})`);
  }
  const missing: string[] = [];
  const next = UP[level + 1];
  if (next) {
    if (value < next.value) missing.push(`land value ${next.value} (now ${value})`);
    if (z.townInfo.happiness < next.happiness) missing.push(`town happiness ${next.happiness} (now ${Math.round(z.townInfo.happiness)})`);
    if (pollution >= MAX_POLLUTION_TO_KEEP) missing.push("cleaner air");
    const needs = needsAllowLevel(z, plot, level + 1, cov);
    if (!needs.ok) missing.push(needs.reason);
    if (!full) missing.push("to be full");
  }
  const progress = plot.levelProgress ?? 0;
  const trend = slipping.length ? "down" : next && missing.length === 0 ? "up" : "steady";
  return {
    level,
    capacity: homeCapacity(plot),
    missing,
    slipping,
    trend,
    progress: Math.abs(progress),
    weeks: weeks(z, trend === "down" ? "down" : "up"),
  };
}

export type LevelChange = { plot: Plot; from: number; to: number };

/** Weekly: homes move toward their next level or slide back. */
export function updateHomeLevels(z: Game, fullHomes: Set<string>): LevelChange[] {
  const changes: LevelChange[] = [];
  const cov = coverage(z);
  for (const row of z.plots) {
    for (const plot of row) {
      if (!plot.active || plot.disabled || !isHomeOption(options[plot.type])) continue;
      const s = levelStatus(plot, z, fullHomes.has(plot.id), cov);
      let p = plot.levelProgress ?? 0;
      if (s.trend === "up") p = Math.max(0, p) + 1;
      else if (s.trend === "down") p = Math.min(0, p) - 1;
      else p = p > 0 ? p - 1 : p < 0 ? p + 1 : 0; // drift back to neutral
      if (p >= weeks(z, "up") && s.level < MAX_LEVEL) {
        plot.level = s.level + 1;
        p = 0;
        changes.push({ plot, from: s.level, to: plot.level });
      } else if (p <= -weeks(z, "down") && s.level > 1) {
        plot.level = s.level - 1;
        p = 0;
        changes.push({ plot, from: s.level, to: plot.level });
      }
      if (p) plot.levelProgress = p;
      else delete plot.levelProgress;
      if (plot.level === 1) delete plot.level;
    }
  }
  if (changes.length) syncCapacity(z);
  return changes;
}
