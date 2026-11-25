// Tax as a trade-off (#49). Each town tolerates some tax rate; how much moves
// with how well it is doing. Going a little over is a fair trade for more
// gold; going far over slowly sours the town. Taxing well under tolerance
// draws newcomers. The player sees the mood in words, not the number.

import type { Game } from "./types";
import { hasPlotOfType } from "./store";

/** Base tolerance range per difficulty; each town draws a value from it. */
export const BASE_TOLERANCE: Record<number, [number, number]> = {
  0: [0.3, 0.4],
  1: [0.2, 0.3],
  2: [0.15, 0.25],
  3: [0.15, 0.25],
};

export function rollBaseTolerance(difficulty: number): number {
  const [lo, hi] = BASE_TOLERANCE[difficulty] ?? BASE_TOLERANCE[1];
  return lo + Math.random() * (hi - lo);
}

/** The rate this town accepts right now. */
export function taxTolerance(z: Game): number {
  let t = z.economyAndLaws.max_tax_rate;
  // A contented town accepts more; an unhappy one less.
  t += Math.max(-0.05, Math.min(0.08, (z.townInfo.happiness - 150) / 1250));
  // Places to spend money and civic institutions make taxes feel worthwhile.
  if (hasPlotOfType("village_market", z).length || hasPlotOfType("general_store", z).length) t += 0.03;
  if (hasPlotOfType("church", z).length) t += 0.02;
  if (z.hasCityHall) t += 0.03;
  if (z.hasBank) t += 0.05;
  return Math.min(0.48, t);
}

export type TaxMood = {
  /** Weekly change to town happiness from taxes. */
  happiness: number;
  /** Multiplier on how many people move in. */
  moveIn: number;
  word: string;
  hint: string;
  level: "low" | "ok" | "high" | "bad";
};

/** How the town feels about the current tax rate. */
export function taxMood(z: Game): TaxMood {
  const rate = z.economyAndLaws.enacted.includes("tax_free") ? 0 : z.economyAndLaws.tax_rate;
  const over = rate - taxTolerance(z);
  const casual = z.gameSettings.includes("casual") ? 0.5 : 1;
  if (over > 0) {
    // Grows faster than linearly: a little over is cheap, a lot is not.
    const happiness = -1.2 * Math.pow(over / 0.05, 1.5) * casual;
    const moveIn = Math.max(0.2, 1 - over * 4 * casual);
    if (over <= 0.05) return { happiness, moveIn, word: "Grumbling", hint: "Some complain, but they pay", level: "high" };
    if (over <= 0.12) return { happiness, moveIn, word: "Angry", hint: "Taxes are souring the town", level: "bad" };
    return { happiness, moveIn, word: "Furious", hint: "People are thinking of leaving", level: "bad" };
  }
  const under = -over;
  const moveIn = 1 + Math.min(0.5, under * 2.5);
  if (under >= 0.1) return { happiness: 0.5, moveIn, word: "Happy to pay", hint: "Low taxes draw newcomers", level: "low" };
  return { happiness: 0, moveIn, word: "Accepted", hint: "People accept this rate", level: "ok" };
}
