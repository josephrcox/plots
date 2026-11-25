// Boredom: a hidden stat for a stale town. If the mayor stops changing the
// town in meaningful ways (new kinds of buildings, recreation, homes growing,
// new laws, expansion), townspeople slowly get bored and less happy, even if
// the town is "good" on paper. It's gentle: on its own it settles a town a
// bit lower rather than ending it, so the game can still be left idle.
//
// Not shown as a number. Its effect shows up as a happiness driver ("the
// town feels stale") and in what townspeople say.

import { options } from "./objects/PlotTypeOptions";
import type { Game, PlotOption } from "./types";

/** Boredom added per week at the first needs tier; more as the town grows. */
const WEEKLY_GROWTH = 1.0;
const GROWTH_PER_TIER = 0.25;
/** Below this, boredom has no effect. */
const THRESHOLD = 15;
/** Happiness lost per week per point of boredom above the threshold. */
const HAPPINESS_PER_POINT = 3 / (100 - THRESHOLD);
const CASUAL_FACTOR = 0.5;
/** Builds of the same kind within this many days count as repeats. */
const REPEAT_WINDOW_DAYS = 60;
const RECENT_LIMIT = 30;

/** Relief for each kind of meaningful change. */
export const NOVELTY = {
  build: 4,
  firstOfKind: 3, // multiplier for a building the town has never had
  amenity: 1.5, // multiplier for recreation, services and amenities
  homeLevelUp: 1, // homes grow on their own, so it counts for little
  tier: 20,
  law: 8,
  expansion: 30,
};

const AMENITY_TYPES = new Set(["recreation", "medical", "education", "shop", "tourism"]);

export function boredom(z: Game): number {
  return z.boredom ?? 0;
}

/** Lowers boredom after a meaningful change. */
export function relieve(z: Game, amount: number) {
  z.boredom = Math.max(0, boredom(z) - amount);
}

/** Relief for building `option` now: less for repeats, more for something new. */
export function noveltyOf(z: Game, option: PlotOption): number {
  const index = options.indexOf(option);
  const owned = (z.plotCounts[index] ?? 0) > 0;
  const day = z.environment.day;
  const repeats = (z.recentBuilds ?? []).filter(
    (b) => b.id === option.id && day - b.day <= REPEAT_WINDOW_DAYS,
  ).length;
  let n = NOVELTY.build;
  if (!owned) n *= NOVELTY.firstOfKind;
  if (AMENITY_TYPES.has(option.type)) n *= NOVELTY.amenity;
  return n / (1 + repeats);
}

/**
 * Call when a building is placed (before plotCounts is updated). Returns the
 * relief given, so bulldozing it soon after can take it back.
 */
export function recordBuild(z: Game, option: PlotOption): number {
  const n = noveltyOf(z, option);
  relieve(z, n);
  const recent = z.recentBuilds ?? [];
  recent.push({ id: option.id, day: z.environment.day });
  z.recentBuilds = recent.slice(-RECENT_LIMIT);
  return n;
}

/** Whether boredom has started (the town has reached its first needs tier). */
function started(z: Game) {
  return (z.needsTier ?? -1) >= 0;
}

/** Weekly: boredom creeps up; returns the happiness change it causes. */
export function updateBoredom(z: Game): number {
  if (!started(z)) return 0;
  const casual = z.gameSettings.includes("casual") ? CASUAL_FACTOR : 1;
  const growth = WEEKLY_GROWTH * (1 + GROWTH_PER_TIER * (z.needsTier ?? 0)) * casual;
  z.boredom = Math.min(100, boredom(z) + growth);
  const effect = boredomEffect(z);
  z.townInfo.happiness += effect;
  return effect;
}

/** Weekly happiness change from boredom right now (≤ 0). */
export function boredomEffect(z: Game): number {
  const over = boredom(z) - THRESHOLD;
  if (over <= 0) return 0;
  const casual = z.gameSettings.includes("casual") ? CASUAL_FACTOR : 1;
  return -over * HAPPINESS_PER_POINT * casual;
}
