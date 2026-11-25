// UI state for the map: the active tool, the targeted / inspected tile, and
// the placement rules the build bar and map share.

import { writable } from "svelte/store";
import { isFogged } from "./fog";
import { siteOf, allowedTitles, REQUIRES_SITE, SITES } from "./sites";
import { options, plotTypeMaximums } from "./objects/PlotTypeOptions";
import type { Game, PlotOption } from "./types";
import { hasPlotOfType } from "./store";
import {
  checkIfAffordable,
  checkIfPlotCanBeUpgraded,
  getOptionFromId,
} from "./utils";

export type Tool =
  | { kind: "none" }
  | { kind: "build"; id: string }
  | { kind: "bulldoze" };

export type TilePos = { x: number; y: number };

/** The active map tool. Build tools stay active until cancelled. */
export const tool = writable<Tool>({ kind: "none" });
/** A tile chosen first (click an empty tile, or Replace in the inspector);
 *  the next building picked in the build bar goes here. */
export const targetTile = writable<TilePos | null>(null);
/** The built tile whose inspector panel is open. */
export const inspected = writable<TilePos | null>(null);
/** The tile under the cursor. */
export const hovered = writable<TilePos | null>(null);
/** Map overlay (#59): tint tiles by land value or pollution. */
export type Overlay = "none" | "land" | "pollution";
export const overlay = writable<Overlay>("none");

/** Which build bar category is open. */
export const buildCategory = writable<string>("housing");

function persisted(key: string, fallback: boolean) {
  let initial = fallback;
  try {
    const saved = localStorage.getItem(key);
    if (saved != null) initial = saved === "true";
  } catch {}
  const store = writable(initial);
  store.subscribe((v) => {
    try {
      localStorage.setItem(key, String(v));
    } catch {}
  });
  return store;
}

// Side panels start open on wide screens.
const wide = typeof window !== "undefined" && window.innerWidth >= 1100;
export const leftPanelOpen = persisted("plots.leftPanelOpen", wide);
export const rightPanelOpen = persisted("plots.rightPanelOpen", wide);

/** Screen space the HUD covers, so the camera can keep the town visible. */
export const HUD = { top: 56, bottom: 150, panel: 250 };

/** Closes every map interaction (tools, targets, inspector). */
export function resetMapUi() {
  tool.set({ kind: "none" });
  targetTile.set(null);
  inspected.set(null);
}

// ---------------------------------------------------------------------------
// Placement rules
// ---------------------------------------------------------------------------

// Until the town has a tree farm, only these can be built.
const STARTER_PLOTS = ["small_homes", "farm", "tree_farm"];

export type Check = { ok: boolean; reason: string };
const OK: Check = { ok: true, reason: "" };

/** Whether `option` can be built anywhere right now (ignores the tile). */
export function availability(option: PlotOption, z: Game): Check {
  if (
    hasPlotOfType("tree_farm", z).length === 0 &&
    !STARTER_PLOTS.includes(option.id)
  ) {
    return { ok: false, reason: "Build a Tree Farm first" };
  }
  const max = plotTypeMaximums[option.id];
  if (typeof max === "number" && hasPlotOfType(option.id, z).length >= max) {
    return { ok: false, reason: `Limit of ${max} reached` };
  }
  const missingPlots = option.requirements.plots.filter(
    (id) => hasPlotOfType(id, z).length === 0,
  );
  if (missingPlots.length) {
    const names = missingPlots.map((id) => getOptionFromId(id)?.title ?? id);
    return { ok: false, reason: `Needs a ${names.join(" and ")}` };
  }
  if (z.townInfo.gold < option.requirements.gold) {
    return { ok: false, reason: "Not enough gold" };
  }
  if (z.townInfo.knowledge_points < (option.requirements.knowledge || 0)) {
    return { ok: false, reason: "Not enough knowledge" };
  }
  const res = option.requirements.resources;
  for (const key of ["food", "wood", "stone", "metal"] as const) {
    if ((res?.[key] ?? 0) > z.resources[key]) {
      return { ok: false, reason: `Not enough ${key}` };
    }
  }
  for (const [key, amount] of Object.entries(option.active_costs)) {
    if (key === "gold" || !amount) continue;
    if (z.resources[key as keyof Game["resources"]] < amount) {
      return { ok: false, reason: `Not enough ${key} to run it` };
    }
  }
  return OK;
}

/**
 * Whether `option` can go on tile (x, y). `replacing` allows building over an
 * existing building (Replace in the inspector); tools only use empty tiles.
 */
export function placementCheck(
  option: PlotOption,
  x: number,
  y: number,
  z: Game,
  replacing = false,
): Check {
  const plot = z.plots[x]?.[y];
  if (!plot || plot.offMap) return { ok: false, reason: "" };
  if (isFogged(z, plot)) return { ok: false, reason: "Unexplored land: build closer to explore it" };
  if (plot.water) return { ok: false, reason: "Can't build on water" };
  const site = siteOf(plot);
  if (site && !site.allows.includes(option.id)) {
    return { ok: false, reason: `Only ${allowedTitles(site)} fit on ${site.title.toLowerCase()}` };
  }
  const needs = REQUIRES_SITE[option.id];
  if (needs && plot.site !== needs) {
    const s = SITES.find((x) => x.id === needs)!;
    return { ok: false, reason: `Only goes on a ${s.title.toLowerCase()} ${s.emoji}` };
  }
  if (plot.active && !replacing) {
    return { ok: false, reason: "Occupied" };
  }
  if (plot.active && plot.typeId === option.id) {
    return { ok: false, reason: "Already built here" };
  }
  if (!checkIfPlotCanBeUpgraded(x, y, z)) {
    return { ok: false, reason: "Must touch your town" };
  }
  const global = availability(option, z);
  if (!global.ok) return global;
  const tile = checkIfAffordable(option, z, x, y);
  if (!tile.adjacent) {
    const names = option.requirements.adjacent_plots.map((id) =>
      id === "water" ? "water" : (getOptionFromId(id)?.title ?? id),
    );
    return { ok: false, reason: `Must be next to ${names.join(" and ")}` };
  }
  if (!tile.affordable) return { ok: false, reason: global.reason || "Can't afford" };
  return OK;
}

export function optionById(id: string): PlotOption | undefined {
  return options.find((o) => o.id === id);
}
