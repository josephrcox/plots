// Neighbour effects (issue #46): buildings affect the tiles they touch.
//
// - Nuisances (industry, pubs) hurt the health / happiness of adjacent homes.
// - Amenities (parks, churches, healers...) help adjacent homes; each home
//   counts at most MAX_AMENITIES of them.
// - Synergies boost a building's own output when it sits next to the right
//   neighbours (livestock by farms, tree farms by a lumber mill, ...).
//
// Home effects are per home, per week. The town's happiness and health are
// single numbers, so the weekly change applied to the town is the
// population-weighted average of every home's neighbourhood (see
// townNeighbourhoodDelta). That keeps one badly placed home in a big town
// from sinking it, while a town full of homes next to mines suffers.

import { options } from "./objects/PlotTypeOptions";
import type { Game, Plot, PlotOption } from "./types";

type StatEffect = { happiness: number; health: number };

const NUISANCES: Record<string, StatEffect> = {
  mine: { happiness: 0, health: -2 },
  quarry: { happiness: 0, health: -2 },
  lumber_mill: { happiness: -1, health: -1 },
  blacksmith: { happiness: -1, health: -1 },
  pub: { happiness: 0, health: -1 },
};

const AMENITIES: Record<string, StatEffect> = {
  park: { happiness: 1, health: 1 },
  stables: { happiness: 1, health: 1 },
  church: { happiness: 1, health: 0 },
  library: { happiness: 1, health: 0 },
  Apothecary: { happiness: 0, health: 1 },
  healing_house: { happiness: 0, health: 1 },
};

export const MAX_AMENITIES = 2;
/** Town-wide weekly change = average home effect × this. */
export const TOWN_EFFECT_SCALE = 2;
/** Casual games feel nuisances at this strength. */
export const CASUAL_NUISANCE_FACTOR = 0.5;

const LIVESTOCK_NEAR_FARM = 1.25;
const TREE_FARM_NEAR_MILL = 1.5;
const BAKERY_NEAR_FARM = 1.25;
const BLACKSMITH_NEAR_DIGS = 1.25;
const SHOP_PER_HOME = 0.1;
const SHOP_MAX_HOMES = 3;

const FARM_IDS = ["farm", "adv_farm"];
const DIG_IDS = ["mine", "quarry"];
const SHOP_IDS = ["village_market", "general_store"];

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

/**
 * The six tiles touching (x, y). `x` is the row; odd rows are drawn shifted
 * half a tile to the right (see PlotController), so the rows above and below
 * touch columns (y-1, y) on even rows and (y, y+1) on odd rows.
 */
export function hexNeighbours(x: number, y: number, z: Game): Plot[] {
  const shift = x % 2 === 0 ? -1 : 0;
  const coords = [
    [x, y - 1],
    [x, y + 1],
    [x - 1, y + shift],
    [x - 1, y + shift + 1],
    [x + 1, y + shift],
    [x + 1, y + shift + 1],
  ];
  const result: Plot[] = [];
  for (const [i, j] of coords) {
    const plot = z.plots[i]?.[j];
    if (plot) result.push(plot);
  }
  return result;
}

function builtOption(plot: Plot): PlotOption | undefined {
  if (!plot.active || plot.type < 0 || plot.disabled) return undefined;
  return options[plot.type];
}

function builtNeighbourIds(x: number, y: number, z: Game): string[] {
  const ids: string[] = [];
  for (const plot of hexNeighbours(x, y, z)) {
    const option = builtOption(plot);
    if (option) ids.push(option.id);
  }
  return ids;
}

function isHome(option: PlotOption | undefined) {
  return option?.type === "residential";
}

function nuisanceFactor(z: Game) {
  return z.gameSettings.includes("casual") ? CASUAL_NUISANCE_FACTOR : 1;
}

// ---------------------------------------------------------------------------
// Homes
// ---------------------------------------------------------------------------

export type HomeNeighbourhood = StatEffect & {
  nuisances: string[]; // neighbour ids
  amenities: string[]; // counted amenity ids (at most MAX_AMENITIES)
};

/** Weekly effect of a home's neighbours on that home. */
export function homeNeighbourhood(
  x: number,
  y: number,
  z: Game,
): HomeNeighbourhood {
  const result: HomeNeighbourhood = {
    happiness: 0,
    health: 0,
    nuisances: [],
    amenities: [],
  };
  const factor = nuisanceFactor(z);
  const amenities: string[] = [];
  for (const id of builtNeighbourIds(x, y, z)) {
    const nuisance = NUISANCES[id];
    if (nuisance) {
      result.happiness += nuisance.happiness * factor;
      result.health += nuisance.health * factor;
      result.nuisances.push(id);
    }
    if (AMENITIES[id]) amenities.push(id);
  }
  // Count only the strongest few amenities.
  const strength = (id: string) =>
    AMENITIES[id].happiness + AMENITIES[id].health;
  amenities.sort((a, b) => strength(b) - strength(a));
  for (const id of amenities.slice(0, MAX_AMENITIES)) {
    result.happiness += AMENITIES[id].happiness;
    result.health += AMENITIES[id].health;
    result.amenities.push(id);
  }
  return result;
}

/** Population-weighted average of every home's neighbourhood, scaled. */
export function townNeighbourhoodDelta(z: Game): StatEffect & {
  nuisancePairs: number;
} {
  let weight = 0;
  let happiness = 0;
  let health = 0;
  let nuisancePairs = 0;
  for (const row of z.plots) {
    for (const plot of row) {
      const option = builtOption(plot);
      if (!isHome(option)) continue;
      const w = Math.max(1, option!.immediate_variable_changes.population);
      const home = homeNeighbourhood(plot.x, plot.y, z);
      happiness += home.happiness * w;
      health += home.health * w;
      nuisancePairs += home.nuisances.length;
      weight += w;
    }
  }
  if (weight === 0) return { happiness: 0, health: 0, nuisancePairs: 0 };
  return {
    happiness: (happiness / weight) * TOWN_EFFECT_SCALE,
    health: (health / weight) * TOWN_EFFECT_SCALE,
    nuisancePairs,
  };
}

// ---------------------------------------------------------------------------
// Synergies
// ---------------------------------------------------------------------------

export type Synergy = {
  resource: number; // multiplier on generated resources
  income: number; // multiplier on revenue
  reason: string; // empty when there is no bonus
};

const NO_SYNERGY: Synergy = { resource: 1, income: 1, reason: "" };

/** Output bonus for the building at (x, y) from its neighbours. */
export function synergyAt(x: number, y: number, z: Game): Synergy {
  const plot = z.plots[x]?.[y];
  const option = plot && builtOption(plot);
  if (!option) return NO_SYNERGY;
  return synergyFor(option.id, x, y, z);
}

function synergyFor(id: string, x: number, y: number, z: Game): Synergy {
  const near = builtNeighbourIds(x, y, z);
  const nearAny = (ids: string[]) => near.some((n) => ids.includes(n));
  switch (id) {
    case "livestock_farm":
      return nearAny(FARM_IDS)
        ? { resource: LIVESTOCK_NEAR_FARM, income: 1, reason: "+25% food (next to a farm)" }
        : NO_SYNERGY;
    case "tree_farm":
      return near.includes("lumber_mill")
        ? { resource: TREE_FARM_NEAR_MILL, income: 1, reason: "+50% wood (next to a lumber mill)" }
        : NO_SYNERGY;
    case "bakery":
      return nearAny(FARM_IDS)
        ? { resource: 1, income: BAKERY_NEAR_FARM, reason: "+25% income (next to a farm)" }
        : NO_SYNERGY;
    case "blacksmith":
      return nearAny(DIG_IDS)
        ? { resource: 1, income: BLACKSMITH_NEAR_DIGS, reason: "+25% income (next to a mine or quarry)" }
        : NO_SYNERGY;
  }
  if (SHOP_IDS.includes(id)) {
    const homes = Math.min(
      SHOP_MAX_HOMES,
      hexNeighbours(x, y, z).filter((p) => isHome(builtOption(p))).length,
    );
    if (homes === 0) return NO_SYNERGY;
    const pct = Math.round(homes * SHOP_PER_HOME * 100);
    return {
      resource: 1,
      income: 1 + homes * SHOP_PER_HOME,
      reason: `+${pct}% income (${homes} home${homes > 1 ? "s" : ""} next door)`,
    };
  }
  return NO_SYNERGY;
}

// ---------------------------------------------------------------------------
// UI descriptions
// ---------------------------------------------------------------------------

export type EffectLine = { text: string; good: boolean };

function statText(e: StatEffect) {
  const parts: string[] = [];
  const fmt = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n * 10) / 10}`;
  if (e.happiness) parts.push(`${fmt(e.happiness)} 😊`);
  if (e.health) parts.push(`${fmt(e.health)} ❤️`);
  return parts.join(", ");
}

/** Effects currently active on a built tile, for its hover tooltip. */
export function activeEffects(x: number, y: number, z: Game): EffectLine[] {
  const plot = z.plots[x]?.[y];
  const option = plot && builtOption(plot);
  if (!option) return [];
  const lines: EffectLine[] = [];
  if (isHome(option)) {
    const home = homeNeighbourhood(x, y, z);
    if (home.nuisances.length || home.amenities.length) {
      lines.push({
        text: `Neighbours: ${statText(home) || "no net effect"} per week`,
        good: home.happiness + home.health >= 0,
      });
    }
  }
  const synergy = synergyFor(option.id, x, y, z);
  if (synergy.reason) lines.push({ text: synergy.reason, good: true });
  const nuisance = NUISANCES[option.id];
  const amenity = AMENITIES[option.id];
  const homes = hexNeighbours(x, y, z).filter((p) =>
    isHome(builtOption(p)),
  ).length;
  if (homes > 0 && nuisance) {
    lines.push({
      text: `Bothers ${homes} nearby home${homes > 1 ? "s" : ""}`,
      good: false,
    });
  } else if (homes > 0 && amenity) {
    lines.push({
      text: `Serves ${homes} nearby home${homes > 1 ? "s" : ""}`,
      good: true,
    });
  }
  return lines;
}

/**
 * What building `optionId` on (x, y) would change: its own bonus, and the
 * net weekly change to adjacent homes and to neighbours' output. Computed by
 * placing it temporarily and comparing.
 */
export function previewPlacement(
  optionId: string,
  x: number,
  y: number,
  z: Game,
): EffectLine[] {
  const plot = z.plots[x]?.[y];
  if (!plot) return [];
  const typeIndex = options.findIndex((o) => o.id === optionId);
  if (typeIndex < 0) return [];

  const neighbours = hexNeighbours(x, y, z);
  const homeSum = (homes: Plot[]) => {
    const total = { happiness: 0, health: 0 };
    for (const h of homes) {
      const e = homeNeighbourhood(h.x, h.y, z);
      total.happiness += e.happiness;
      total.health += e.health;
    }
    return total;
  };
  const boosted = () =>
    neighbours.filter((p) => builtOption(p) && synergyAt(p.x, p.y, z).reason)
      .map((p) => p.id);
  const nearbyHomes = neighbours.filter((p) => isHome(builtOption(p)));

  const before = { homes: homeSum(nearbyHomes), boosted: boosted() };

  const saved = { type: plot.type, active: plot.active, typeId: plot.typeId, disabled: plot.disabled };
  plot.type = typeIndex;
  plot.active = true;
  plot.typeId = optionId;
  plot.disabled = false;
  let lines: EffectLine[] = [];
  try {
    const option = options[typeIndex];
    if (isHome(option)) {
      const own = homeNeighbourhood(x, y, z);
      const text = statText(own);
      if (text) {
        lines.push({
          text: `This home: ${text}/wk from neighbours`,
          good: own.happiness + own.health >= 0,
        });
      }
    }
    const own = synergyFor(optionId, x, y, z);
    if (own.reason) lines.push({ text: own.reason, good: true });

    const after = homeSum(nearbyHomes);
    const delta = {
      happiness: after.happiness - before.homes.happiness,
      health: after.health - before.homes.health,
    };
    const deltaText = statText(delta);
    if (deltaText) {
      lines.push({
        text: `Nearby homes: ${deltaText}/wk`,
        good: delta.happiness + delta.health >= 0,
      });
    }
    const newlyBoosted = boosted().filter((id) => !before.boosted.includes(id));
    if (newlyBoosted.length) {
      lines.push({
        text: `Boosts ${newlyBoosted.length} neighbour${newlyBoosted.length > 1 ? "s" : ""}`,
        good: true,
      });
    }
  } finally {
    Object.assign(plot, saved);
  }
  return lines;
}
