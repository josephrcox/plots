// Neighbours on the hex grid, and production synergies: some buildings make
// more when they sit next to the right neighbours (livestock by farms, tree
// farms by a lumber mill, ...). How layout affects homes (pollution and land
// value) lives in land.ts.

import { options } from "./objects/PlotTypeOptions";
import type { Game, Plot, PlotOption } from "./types";
import {
  homeEffect,
  landValueWord,
  pollutionWord,
  placementImpact,
  rings,
  POLLUTERS,
} from "./land";

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
export function hexNeighbourCoords(x: number, y: number): [number, number][] {
  const shift = x % 2 === 0 ? -1 : 0;
  return [
    [x, y - 1],
    [x, y + 1],
    [x - 1, y + shift],
    [x - 1, y + shift + 1],
    [x + 1, y + shift],
    [x + 1, y + shift + 1],
  ];
}

export function hexNeighbours(x: number, y: number, z: Game): Plot[] {
  const result: Plot[] = [];
  for (const [i, j] of hexNeighbourCoords(x, y)) {
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

/** Effects on a built tile, for the inspector. */
export function activeEffects(x: number, y: number, z: Game): EffectLine[] {
  const plot = z.plots[x]?.[y];
  const option = plot && builtOption(plot);
  if (!option) return [];
  const lines: EffectLine[] = [];
  if (isHome(option)) {
    const e = homeEffect(x, y, z);
    lines.push({
      text: `🏡 Land: ${landValueWord(e.value)} (${e.value}) · ${e.happiness >= 0 ? "+" : ""}${round1(e.happiness)} 😊/wk`,
      good: e.happiness >= 0,
    });
    if (e.pollution >= 1) {
      lines.push({
        text: `🏭 ${pollutionWord(e.pollution)} air (${Math.round(e.pollution)}) · ${round1(e.health)} ❤️/wk`,
        good: false,
      });
    }
  }
  const synergy = synergyFor(option.id, x, y, z);
  if (synergy.reason) lines.push({ text: synergy.reason, good: true });
  const [d1, d2] = rings(x, y, z);
  const homes = [...d1, ...d2].filter((p) => isHome(builtOption(p))).length;
  if (homes > 0 && POLLUTERS[option.id]) {
    lines.push({ text: `Polluting ${homes} home${homes > 1 ? "s" : ""} within 2 tiles`, good: false });
  }
  return lines;
}

/** What building `optionId` on (x, y) would do, shown while placing it. */
export function previewPlacement(
  optionId: string,
  x: number,
  y: number,
  z: Game,
): EffectLine[] {
  const lines: EffectLine[] = [...placementImpact(optionId, x, y, z)];
  const plot = z.plots[x]?.[y];
  if (!plot) return lines;
  // Synergies need the building in place to check its neighbours.
  const typeIndex = options.findIndex((o) => o.id === optionId);
  const saved = { type: plot.type, active: plot.active, typeId: plot.typeId, disabled: plot.disabled };
  plot.type = typeIndex;
  plot.active = true;
  plot.typeId = optionId;
  plot.disabled = false;
  try {
    const own = synergyFor(optionId, x, y, z);
    if (own.reason) lines.push({ text: own.reason, good: true });
  } finally {
    Object.assign(plot, saved);
  }
  return lines;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
