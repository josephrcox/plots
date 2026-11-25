// People moving in. Homes are built empty (except the founding home) and fill
// over time: each week a share of the empty spaces is taken, faster when the
// town is attractive. Shared by the simulation and the UI.

import type { Game, Plot } from "./types";
import { options } from "./objects/PlotTypeOptions";
import { taxMood } from "./tax";

/** Share of empty spaces filled per week at normal attractiveness. */
export const BASE_MOVE_IN_RATE = 0.2;
const CASUAL_MOVE_IN_BOOST = 1.5;

export type Reason = { text: string; good: boolean };

/**
 * How attractive the town is to newcomers (0 = nobody comes, 1 = normal),
 * and why. Happiness matters most; open jobs and plenty of food help.
 */
export function attraction(z: Game): { factor: number; reasons: Reason[] } {
  const info = z.townInfo;
  const reasons: Reason[] = [];
  const happy = Math.min(1.5, Math.max(0, (info.happiness - 50) / 100));
  if (happy === 0) {
    return {
      factor: 0,
      reasons: [{ text: "Too unhappy: nobody wants to move in", good: false }],
    };
  }
  if (happy >= 1.2) reasons.push({ text: "A happy town draws people", good: true });
  else if (happy < 0.8) reasons.push({ text: "Low happiness puts people off", good: false });

  let factor = happy;
  let jobs = 0;
  for (const row of z.plots) {
    for (const p of row) {
      if (p.active && p.type > -1) jobs += options[p.type]?.requirements.employees ?? 0;
    }
  }
  jobs += info.guardians;
  const openJobs = jobs - info.population_count;
  if (openJobs > 0) {
    factor *= 1.25;
    reasons.push({ text: "Open jobs are waiting", good: true });
  } else if (-openJobs > info.population_count * 0.2) {
    factor *= 0.8;
    reasons.push({ text: "Few jobs for newcomers", good: false });
  }
  const tax = taxMood(z);
  if (tax.moveIn > 1.05) reasons.push({ text: "Low taxes", good: true });
  else if (tax.moveIn < 0.95) reasons.push({ text: "High taxes put people off", good: false });
  factor *= tax.moveIn;
  if (z.wellFed) {
    factor *= 1.1;
    reasons.push({ text: "Plenty of food", good: true });
  }
  if (z.gameSettings.includes("casual")) factor *= CASUAL_MOVE_IN_BOOST;
  return { factor, reasons };
}

/** People expected to move in this week. */
export function weeklyArrivals(z: Game): number {
  const open = z.townInfo.population_max - z.townInfo.population_count;
  if (open <= 0) return 0;
  const { factor } = attraction(z);
  if (factor <= 0) return 0;
  // A share of the empty space, plus a steady trickle so the last few
  // spaces don't take forever.
  const arrivals = Math.round(open * BASE_MOVE_IN_RATE * factor) + 1;
  return Math.min(open, arrivals);
}

export type Occupancy = Map<string, { people: number; capacity: number }>;

/** Who lives where: the town's people fill homes oldest first. */
export function homeOccupancy(z: Game): Occupancy {
  const homes: Plot[] = [];
  for (const row of z.plots) {
    for (const p of row) {
      if (!p.active || p.type < 0) continue;
      if ((options[p.type]?.immediate_variable_changes.population ?? 0) > 0) {
        homes.push(p);
      }
    }
  }
  homes.sort(
    (a, b) => (a.builtDay ?? 0) - (b.builtDay ?? 0) || a.x - b.x || a.y - b.y,
  );
  let left = z.townInfo.population_count;
  const result: Occupancy = new Map();
  for (const home of homes) {
    const capacity = options[home.type].immediate_variable_changes.population;
    const people = Math.max(0, Math.min(capacity, left));
    left -= people;
    result.set(home.id, { people, capacity });
  }
  return result;
}
