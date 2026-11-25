// Headless runner for Plots: builds a seeded town, steps the real simulation,
// and lets a policy choose builds. Used by sim/run.ts.
import { get } from "svelte/store";
import { DB, createDefaultGame, generatePlots, disabledPlotMenu, clearPlot, userDB } from "../src/lib/store";
import { simulateDay } from "../src/lib/simulation";
import { rollBaseTolerance } from "../src/lib/tax";
import { placePlot, isAdjacentToWater } from "../src/lib/utils";
import { availability, placementCheck } from "../src/lib/ui";
import { options } from "../src/lib/objects/PlotTypeOptions";
import { hexNeighbours } from "../src/lib/neighbours";
import { rings, landValue, POLLUTERS, AMENITIES } from "../src/lib/land";
import { SERVICES, tilesWithin } from "../src/lib/needs";
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
  g.economyAndLaws.max_tax_rate = rollBaseTolerance(difficulty);
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
  const [d1, d2] = rings(p.x, p.y, g);
  const idOf = (q: Plot) => (q.active && q.type > -1 ? options[q.type].id : "");
  const homesNear = (ring: Plot[]) => ring.filter((q) => options[q.type]?.type === "residential" && q.active).length;
  let s = 0.2 * nb.length; // compact towns keep options open
  if (opt.revenue_per_week > 0 && isAdjacentToWater(p.x, p.y, g)) s += 3;
  if (opt.type === "residential") {
    s += (landValue(p.x, p.y, g).value - 50) / 5;
    // Industry already nearby will keep polluting this spot.
    s -= 3 * d1.filter((q) => POLLUTERS[idOf(q)]).length + 1.5 * d2.filter((q) => POLLUTERS[idOf(q)]).length;
  }
  if (POLLUTERS[id]) s -= 3 * homesNear(d1) + 1.5 * homesNear(d2);
  const am = AMENITIES[id];
  if (am) s += Math.sign(am[0]) * (homesNear(d1) + 0.5 * homesNear(d2));
  if (id === "livestock_farm" || id === "bakery") s += ids.some((i) => i === "farm" || i === "adv_farm") ? 2 : 0;
  if (id === "tree_farm" && ids.includes("lumber_mill")) s += 2;
  if (id === "lumber_mill") s += ids.filter((i) => i === "tree_farm").length;
  if (id === "blacksmith" && ids.some((i) => i === "mine" || i === "quarry")) s += 2;
  if (id === "village_market" || id === "general_store") s += Math.min(3, homesNear(d1));
  // Service buildings: reach as many homes as possible.
  for (const svc of SERVICES) {
    const r = svc.providers[id];
    if (r != null) s += 0.7 * tilesWithin(p.x, p.y, r, g).filter((q) => q.active && options[q.type]?.type === "residential").length;
  }
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
  const v = i.population_count + 0.005 * Math.max(0, i.gold) + 0.05 * Math.min(i.happiness, 300) + 0.05 * Math.min(i.health, 300);
  return alive(g) ? v : v - 1000;
}
