// Headless runner for Plots: builds a seeded town, steps the real simulation,
// and lets a policy choose builds. Used by sim/run.ts.
import { get } from "svelte/store";
import { DB, createDefaultGame, generatePlots, disabledPlotMenu, clearPlot, userDB } from "../src/lib/store";
import { simulateDay } from "../src/lib/simulation";
import { placePlot, isAdjacentToWater } from "../src/lib/utils";
import { availability, placementCheck } from "../src/lib/ui";
import { options } from "../src/lib/objects/PlotTypeOptions";
import { hexNeighbours, homeNeighbourhood } from "../src/lib/neighbours";
import type { Game, Plot } from "../src/lib/types";

declare const __seed: (n: number) => void;
declare const __timers: (() => void)[];

export const seed = (n: number) => __seed(n);
export { options };

export function newTown(mapSeed: number, difficulty = 1): Game {
  seed(mapSeed);
  const g = createDefaultGame();
  g.difficulty = difficulty;
  g.endGoal = "free_play" as any;
  g.gameSettings = [];
  g.townInfo.name = "Sim";
  // Same range as difficulty.js, but drawn per map.
  g.economyAndLaws.max_tax_rate = 0.2 + Math.random() * 0.2;
  g.plots = generatePlots({ 0: 8, 1: 12, 2: 16, 3: 16 }[difficulty] ?? 12);
  return g;
}

export const clone = (g: Game): Game => structuredClone(g);
export const alive = (g: Game) => g.endGameDetails.msg === "";

/** One day, with the player's dialog choices made automatically. */
export function step(g: Game) {
  DB.set(g);
  simulateDay(g);
  const menu = get(disabledPlotMenu);
  if (menu.visible) {
    disabledPlotMenu.set({ ...menu, visible: false });
    const plot = g.plots[menu.x]?.[menu.y];
    if (plot) {
      if (g.townInfo.gold >= menu.plotCost * 3) {
        g.townInfo.gold -= menu.plotCost;
        plot.snoozedUntil = g.environment.day + 10;
        plot.disabled = false;
      } else clearPlot(menu.x, menu.y, g);
    }
  }
  while (__timers.length) __timers.shift()!();
  // Achievements accumulate in the shared user DB; keep it small.
  const u = get(userDB);
  if (u.achievements.length > 200) u.achievements.length = 0;
}

export function stepDays(g: Game, n: number) {
  for (let i = 0; i < n && alive(g); i++) step(g);
}

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

const NUIS = new Set(["mine", "quarry", "lumber_mill", "blacksmith", "pub"]);
const AMEN = new Set(["park", "stables", "church", "library", "Apothecary", "healing_house"]);

function legalTiles(g: Game, id: string): Plot[] {
  const opt = options.find((o) => o.id === id)!;
  const out: Plot[] = [];
  for (const row of g.plots) for (const p of row) {
    if (p.active || p.water || p.offMap) continue;
    if (placementCheck(opt, p.x, p.y, g).ok) out.push(p);
  }
  return out;
}

/** A thoughtful player's tile score for building `id` at p. */
function tileScore(g: Game, id: string, p: Plot): number {
  const opt = options.find((o) => o.id === id)!;
  const nb = hexNeighbours(p.x, p.y, g).filter((n) => n.active && n.type > -1);
  const ids = nb.map((n) => options[n.type].id);
  const homes = nb.filter((n) => options[n.type].type === "residential").length;
  let s = 0.2 * nb.length; // compact towns keep options open
  if (opt.revenue_per_week > 0 && isAdjacentToWater(p.x, p.y, g)) s += 3;
  if (opt.type === "residential") {
    s -= 2 * ids.filter((i) => NUIS.has(i)).length;
    s += Math.min(2, ids.filter((i) => AMEN.has(i)).length);
  }
  if (NUIS.has(id)) s -= 2 * homes;
  if (AMEN.has(id)) s += homes;
  if (id === "livestock_farm" || id === "bakery") s += ids.some((i) => i === "farm" || i === "adv_farm") ? 2 : 0;
  if (id === "tree_farm" && ids.includes("lumber_mill")) s += 2;
  if (id === "lumber_mill") s += ids.filter((i) => i === "tree_farm").length;
  if (id === "blacksmith" && ids.some((i) => i === "mine" || i === "quarry")) s += 2;
  if (id === "village_market" || id === "general_store") s += Math.min(3, homes);
  return s;
}

/** true/"smart" = best tile, false/"random" = any legal tile, "bad" = worst tile. */
export type TileMode = boolean | "smart" | "random" | "bad";
export function pickTile(g: Game, id: string, mode: TileMode): Plot | null {
  const tiles = legalTiles(g, id);
  if (!tiles.length) return null;
  if (mode === false || mode === "random") return tiles[Math.floor(Math.random() * tiles.length)];
  const sign = mode === "bad" ? -1 : 1;
  let best = tiles[0], bs = -Infinity;
  for (const t of tiles) {
    const s = sign * tileScore(g, id, t) + Math.random() * 0.01;
    if (s > bs) { bs = s; best = t; }
  }
  return best;
}

/** Options that can be built somewhere right now. */
export function buildable(g: Game): string[] {
  const ids: string[] = [];
  for (const o of options) {
    if (!availability(o, g).ok) continue;
    if (legalTiles(g, o.id).length) ids.push(o.id);
  }
  return ids;
}

export function build(g: Game, id: string, smart: TileMode = true): boolean {
  const t = pickTile(g, id, smart);
  if (!t) return false;
  return placePlot(g, t.x, t.y, id);
}

/** Score used for comparing outcomes. Dead towns score far below living ones. */
export function value(g: Game): number {
  const i = g.townInfo;
  const v = i.population_count + 0.02 * Math.max(0, i.gold) + 0.05 * Math.min(i.happiness, 300) + 0.05 * Math.min(i.health, 300);
  return alive(g) ? v : v - 1000;
}
