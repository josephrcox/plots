// Fog of war (#62). Land more than 2 tiles from anything you've built is
// unexplored: you can't see its terrain or special sites, and can't build on
// it. Building reveals the land around it, for good. The start is always in
// view, and land gained by expanding is revealed straight away.

import { tilesWithin } from "./needs";
import { siteOf } from "./sites";
import { suggestedStart } from "./utils";
import { Vibe, type Game, type Plot } from "./types";

/** Tiles revealed around a new building. */
export const REVEAL_RADIUS = 2;
/** Tiles revealed around the suggested start of a new town. */
export const START_RADIUS = 2;

export function isFogged(z: Game, plot: Plot | undefined): boolean {
  return !!z.fog && !!plot && !plot.offMap && !plot.seen;
}

/**
 * Whether a cell is drawn as fog: any unexplored cell, including spaces
 * beyond the land, so the fog hides the map's shape too.
 */
export function showsFog(z: Game, plot: Plot | undefined): boolean {
  return !!z.fog && !!plot && !plot.seen;
}

/** Reveals land around (x, y); logs any special sites found. */
export function revealAround(z: Game, x: number, y: number, radius = REVEAL_RADIUS) {
  if (!z.fog) return;
  reveal(z, tilesWithin(x, y, radius, z, true));
}

/** Reveals these plots; logs any special sites found among them. */
export function reveal(z: Game, plots: Plot[]) {
  const found: string[] = [];
  for (const p of plots) {
    if (p.seen) continue;
    p.seen = true; // off-map cells too: revealing shows where the land ends
    if (p.offMap) continue;
    const site = siteOf(p);
    if (site && z.fogReady) found.push(`${site.emoji} ${site.title.toLowerCase()}`);
  }
  if (found.length) {
    const message = `🔭 Surveyors found ${found.length > 1 ? `${found.slice(0, -1).join(", ")} and ${found[found.length - 1]}` : found[0]} nearby.`;
    z.townLog = z.townLog ?? [];
    z.townLog.unshift({ message, day: z.environment.day, vibe: Vibe.GOOD });
  }
}

/**
 * Turns fog on for a town: the start (or everything already built) is in
 * view, the rest is unexplored. Used for new towns and, once, older saves.
 */
export function initFog(z: Game) {
  z.fog = true;
  const built = z.plots.flat().filter((p) => p.active);
  if (built.length) {
    for (const b of built) reveal(z, tilesWithin(b.x, b.y, REVEAL_RADIUS, z, true));
  } else {
    const start = suggestedStart(z);
    if (start) reveal(z, tilesWithin(start[0], start[1], START_RADIUS, z, true));
  }
  z.fogReady = true;
}
