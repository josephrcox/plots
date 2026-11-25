// Special sites (#63): a few tiles per map that only fit a few kinds of
// building and make those buildings better. Which sites a map has, and where,
// shapes its plan: a map with fertile soil by the river plays differently
// from one with a stone outcrop and a hot spring. All are natural features.
// The mineral deposit is one too: the only site a mine can go on.

import { options } from "./objects/PlotTypeOptions";
import type { Game, Plot } from "./types";
import { hexNeighbourCoords } from "./neighbours";

export type SiteId = "mineral" | "fertile" | "outcrop" | "old_forest" | "hilltop" | "spring";

export type Site = {
  id: SiteId;
  emoji: string;
  title: string;
  /** Buildings that fit here. */
  allows: string[];
  /** One line on what the site does, for tooltips. */
  bonus: string;
  /** How often it appears, relative to the others. */
  weight: number;
  resource?: number; // multiplier on resources made here
  income?: number; // multiplier on income made here
  land?: number; // multiplier on the land value a building here gives
  reach?: number; // extra tiles of service reach
  cleans?: number; // extra pollution cleanup around it
};

export const SITES: Site[] = [
  // One per map, placed by terrain generation (weight 0: never placed at random).
  { id: "mineral", emoji: "🧲", title: "Mineral deposit", allows: ["mine"], bonus: "The only place a mine can dig", weight: 0 },
  { id: "fertile", emoji: "🌾", title: "Fertile soil", allows: ["farm", "livestock_farm", "vineyard", "adv_farm"], bonus: "Farms here grow much more", weight: 2, resource: 1.6, income: 1.3 },
  { id: "outcrop", emoji: "🪨", title: "Stone outcrop", allows: ["quarry"], bonus: "A quarry here digs far more stone", weight: 1.2, resource: 1.8 },
  { id: "old_forest", emoji: "🌳", title: "Old forest", allows: ["tree_farm", "lumber_mill", "park"], bonus: "More wood, and it cleans the air around it", weight: 1.5, resource: 1.5, cleans: 0.2 },
  { id: "hilltop", emoji: "⛰️", title: "Scenic hilltop", allows: ["park", "church", "library", "museum", "community_garden"], bonus: "Twice the land value boost for homes around it", weight: 1, land: 2 },
  { id: "spring", emoji: "♨️", title: "Hot spring", allows: ["Apothecary", "healing_house"], bonus: "Health care here reaches two tiles further", weight: 0.8, reach: 2 },
];

export function siteOf(plot: Plot | undefined): Site | undefined {
  return plot?.site ? SITES.find((s) => s.id === plot.site) : undefined;
}

/** Buildings that can only be built on a particular site. */
export const REQUIRES_SITE: Record<string, SiteId> = { mine: "mineral" };

export function isMineral(plot: Plot | undefined): boolean {
  return plot?.site === "mineral";
}

/** The site's effect on the building standing on it (if it fits). */
export function siteFor(plot: Plot): Site | undefined {
  const site = siteOf(plot);
  if (!site || !plot.active || plot.type < 0) return undefined;
  return site.allows.includes(options[plot.type]?.id) ? site : undefined;
}

export function siteResource(plot: Plot): number {
  return siteFor(plot)?.resource ?? 1;
}
export function siteIncome(plot: Plot): number {
  return siteFor(plot)?.income ?? 1;
}

/** Names of what fits on a site, for messages. */
export function allowedTitles(site: Site): string {
  const names = site.allows.map((id) => options.find((o) => o.id === id)?.title ?? id);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}` : names[0];
}

function pickWeighted<T>(items: T[], weight: (t: T) => number): T {
  const total = items.reduce((s, t) => s + weight(t), 0);
  let r = Math.random() * total;
  for (const t of items) {
    r -= weight(t);
    if (r <= 0) return t;
  }
  return items[items.length - 1];
}

/** Roughly one site per this many land tiles. */
const LAND_PER_SITE = 22;
const MIN_GAP = 3;

/**
 * Places sites on empty land among `candidates` (all land if omitted),
 * spaced apart, at most two of each kind. Used when a town is made, when it
 * expands, and once for older saves.
 */
export function placeSites(z: Game, candidates?: Plot[]) {
  const pool = (candidates ?? z.plots.flat()).filter(
    (p) => !p.offMap && !p.water && !p.site && !p.active,
  );
  if (!pool.length) return;
  const count = Math.max(1, Math.round(pool.length / LAND_PER_SITE));
  const existing = z.plots.flat().filter((p) => p.site);
  const used = new Map<SiteId, number>();
  for (const p of z.plots.flat()) if (p.site) used.set(p.site as SiteId, (used.get(p.site as SiteId) ?? 0) + 1);
  const far = (p: Plot) =>
    existing.every((q) => Math.abs(q.x - p.x) + Math.abs(q.y - p.y) >= MIN_GAP);
  for (let n = 0; n < count; n++) {
    const spots = pool.filter((p) => !p.site && far(p));
    if (!spots.length) break;
    const spot = spots[Math.floor(Math.random() * spots.length)];
    const placeable = SITES.filter((s) => s.weight > 0);
    const kinds = placeable.filter((s) => (used.get(s.id) ?? 0) < 2);
    // Some sites like a setting: farms and forests near water, springs inland.
    const nearWater = hexNeighbourCoords(spot.x, spot.y).some(([i, j]) => z.plots[i]?.[j]?.water);
    const site = pickWeighted(kinds.length ? kinds : placeable, (s) =>
      s.weight * (nearWater && (s.id === "fertile" || s.id === "old_forest") ? 1.5 : 1),
    );
    spot.site = site.id;
    used.set(site.id, (used.get(site.id) ?? 0) + 1);
    existing.push(spot);
  }
}
