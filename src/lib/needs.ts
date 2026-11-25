// Town needs that grow with the town (#48).
//
// Service buildings cover the homes within a few tiles of them. As the town
// grows it wants more kinds of service, and a bigger share of its homes
// covered. Unmet needs slowly cost happiness, health and newcomers, so a
// town left alone for months can decline; checking in now and then keeps it
// fine. Homes also need services nearby to grow (housing.ts), which ties
// needs to layout. Meeting every need of a tier for the first time pays a
// one-time reward.

import { options } from "./objects/PlotTypeOptions";
import { hexNeighbourCoords } from "./neighbours";
import type { Game, Plot } from "./types";

export type ServiceId = "recreation" | "health" | "shops" | "faith" | "school";

export type Service = {
  id: ServiceId;
  emoji: string;
  title: string;
  /** One-word name for compact UI. */
  short: string;
  /** Building id → how many tiles away it reaches. */
  providers: Record<string, number>;
  /** Which stat suffers when the need goes unmet. */
  hurts: "happiness" | "health";
};

export const SERVICES: Service[] = [
  {
    id: "recreation",
    short: "Recreation",
    emoji: "🛝",
    title: "Recreation",
    providers: { park: 2, stables: 2, pub: 2, vineyard: 2, village_inn: 3, social_club: 2 },
    hurts: "happiness",
  },
  {
    id: "health",
    short: "Health",
    emoji: "⚕️",
    title: "Health care",
    providers: { Apothecary: 2, healing_house: 4 },
    hurts: "health",
  },
  {
    id: "shops",
    short: "Shops",
    emoji: "🛒",
    title: "Shops",
    providers: { bakery: 2, village_market: 3, general_store: 4 },
    hurts: "happiness",
  },
  {
    id: "faith",
    short: "Faith",
    emoji: "⛪",
    title: "Faith & culture",
    providers: { church: 3, library: 3, museum: 3 },
    hurts: "happiness",
  },
  {
    id: "school",
    short: "School",
    emoji: "🎓",
    title: "Schooling",
    providers: { schoolhouse: 3, academy: 4, university: 5 },
    hurts: "happiness",
  },
];

export type Tier = {
  name: string;
  population: number;
  /** Share of people whose home must be covered, per service. */
  wants: Partial<Record<ServiceId, number>>;
  reward: number;
};

/** Each tier lists everything the town wants at that size. */
export const TIERS: Tier[] = [
  { name: "Village", population: 100, wants: { recreation: 0.4 }, reward: 150 },
  { name: "Hamlet", population: 200, wants: { recreation: 0.5, health: 0.4 }, reward: 300 },
  { name: "Small town", population: 350, wants: { recreation: 0.6, health: 0.5, shops: 0.4 }, reward: 600 },
  { name: "Town", population: 500, wants: { recreation: 0.6, health: 0.6, shops: 0.5, faith: 0.4 }, reward: 1200 },
  { name: "City", population: 800, wants: { recreation: 0.7, health: 0.7, shops: 0.6, faith: 0.5, school: 0.4 }, reward: 2500 },
];

/** Weekly stat loss per 10 points of coverage below target. */
const PENALTY_PER_10 = 0.8;
/** Newcomers drop by this much per 10 points of total shortfall. */
const MOVE_IN_PER_10 = 0.05;
const CASUAL_TARGET = 0.7;
const CASUAL_PENALTY = 0.5;

// ---------------------------------------------------------------------------
// Coverage
// ---------------------------------------------------------------------------

/** Tiles within `r` steps of (x, y), including itself. */
export function tilesWithin(x: number, y: number, r: number, z: Game): Plot[] {
  const key = (i: number, j: number) => i * 10000 + j;
  const seen = new Set([key(x, y)]);
  let frontier: [number, number][] = [[x, y]];
  const out: Plot[] = [];
  const self = z.plots[x]?.[y];
  if (self) out.push(self);
  for (let d = 0; d < r; d++) {
    const next: [number, number][] = [];
    for (const [i, j] of frontier) {
      for (const [a, b] of hexNeighbourCoords(i, j)) {
        if (seen.has(key(a, b))) continue;
        seen.add(key(a, b));
        const p = z.plots[a]?.[b];
        if (!p || p.offMap) continue;
        out.push(p);
        next.push([a, b]);
      }
    }
    frontier = next;
  }
  return out;
}

function builtId(p: Plot): string | null {
  if (!p.active || p.type < 0 || p.disabled) return null;
  return options[p.type]?.id ?? null;
}

function isHome(p: Plot) {
  return builtId(p) != null && options[p.type].type === "residential";
}

// Coverage only changes when buildings do; cache it per game per day.
const coverageCache = new WeakMap<Game, { key: string; cov: Map<ServiceId, Set<string>> }>();

/** For each service, the ids of homes it covers. */
export function coverage(z: Game): Map<ServiceId, Set<string>> {
  const key = `${z.tick}:${z.lastChangeDay}:${z.plotCounts.join(",")}`;
  const hit = coverageCache.get(z);
  if (hit && hit.key === key) return hit.cov;
  const cov = computeCoverage(z);
  coverageCache.set(z, { key, cov });
  return cov;
}

function computeCoverage(z: Game): Map<ServiceId, Set<string>> {
  const result = new Map<ServiceId, Set<string>>(SERVICES.map((s) => [s.id, new Set()]));
  const providerOf = new Map<string, [ServiceId, number][]>();
  for (const s of SERVICES) {
    for (const [id, r] of Object.entries(s.providers)) {
      if (!providerOf.has(id)) providerOf.set(id, []);
      providerOf.get(id)!.push([s.id, r]);
    }
  }
  for (const row of z.plots) {
    for (const p of row) {
      const id = builtId(p);
      const provides = id ? providerOf.get(id) : undefined;
      if (!provides) continue;
      for (const [service, r] of provides) {
        for (const q of tilesWithin(p.x, p.y, r, z)) {
          if (isHome(q)) result.get(service)!.add(q.id);
        }
      }
    }
  }
  return result;
}

/** Services covering one home. */
export function servicesAt(plot: Plot, cov: Map<ServiceId, Set<string>>): ServiceId[] {
  return SERVICES.filter((s) => cov.get(s.id)!.has(plot.id)).map((s) => s.id);
}

// ---------------------------------------------------------------------------
// Needs
// ---------------------------------------------------------------------------

/** The highest tier the town's population has reached (-1 before the first). */
export function currentTier(z: Game): number {
  const pop = z.townInfo.population_count;
  let t = -1;
  TIERS.forEach((tier, i) => {
    if (pop >= tier.population) t = i;
  });
  // Once reached, a tier's needs stay unless the town shrinks well below it,
  // so a dip of a few people doesn't flip the needs on and off.
  const held = z.needsTier ?? -1;
  if (held > t && pop >= TIERS[held].population * 0.9) return held;
  return t;
}

/** Weekly: apply unmet-need penalties, remember the tier, pay first-time rewards. */
export function updateNeeds(z: Game): { effect: NeedEffect; status: NeedStatus[]; rewarded: Tier | null } {
  const tier = currentTier(z);
  z.needsTier = tier;
  const status = needStatus(z);
  const effect = needEffect(z, status);
  z.townInfo.happiness += effect.happiness;
  z.townInfo.health += effect.health;
  let rewarded: Tier | null = null;
  if (tier >= 0 && status.every((n) => n.met) && tier > (z.needsRewarded ?? -1)) {
    z.needsRewarded = tier;
    rewarded = TIERS[tier];
    z.townInfo.gold += rewarded.reward;
  }
  return { effect, status, rewarded };
}

export type NeedStatus = {
  service: Service;
  target: number; // share of people
  covered: number; // share of people
  met: boolean;
};

/** Each need of the current tier with how well it's covered. */
export function needStatus(z: Game, cov = coverage(z)): NeedStatus[] {
  const tier = TIERS[currentTier(z)];
  if (!tier) return [];
  const casual = z.gameSettings.includes("casual");
  let people = 0;
  const peopleIn = new Map<string, number>();
  for (const row of z.plots) {
    for (const p of row) {
      if (!isHome(p)) continue;
      const cap = options[p.type].immediate_variable_changes.population * [1, 1.5, 2][(p.level ?? 1) - 1];
      peopleIn.set(p.id, cap);
      people += cap;
    }
  }
  return SERVICES.filter((s) => tier.wants[s.id] != null).map((s) => {
    const target = tier.wants[s.id]! * (casual ? CASUAL_TARGET : 1);
    let covered = 0;
    for (const id of cov.get(s.id)!) covered += peopleIn.get(id) ?? 0;
    const share = people ? covered / people : 0;
    return { service: s, target, covered: share, met: share >= target };
  });
}

export type NeedEffect = { happiness: number; health: number; moveIn: number };

/** Weekly penalty from unmet needs. */
export function needEffect(z: Game, status = needStatus(z)): NeedEffect {
  const soften = z.gameSettings.includes("casual") ? CASUAL_PENALTY : 1;
  const effect = { happiness: 0, health: 0, moveIn: 1 };
  let shortfall = 0;
  for (const n of status) {
    const gap = Math.max(0, n.target - n.covered);
    shortfall += gap;
    // Unmet happiness needs show up in each person's mood (people.ts).
    if (n.service.hurts === "health") effect.health -= (gap / 0.1) * PENALTY_PER_10 * soften;
  }
  effect.moveIn = Math.max(0.3, 1 - (shortfall / 0.1) * MOVE_IN_PER_10 * soften);
  return effect;
}

/**
 * Whether a home's own services let it reach `level` (housing.ts): level 2
 * needs at least one service nearby, level 3 at least two kinds. Before the
 * town reaches its first tier there's no requirement.
 */
export function needsAllowLevel(
  z: Game,
  plot: Plot,
  level: number,
  cov?: Map<ServiceId, Set<string>>,
): { ok: boolean; reason: string } {
  if (currentTier(z) < 0) return { ok: true, reason: "" };
  const want = level >= 3 ? 2 : 1;
  const have = servicesAt(plot, cov ?? coverage(z)).length;
  if (have >= want) return { ok: true, reason: "" };
  return {
    ok: false,
    reason: want === 1 ? "a service nearby (🛝⚕️🛒⛪🎓)" : `${want} kinds of service nearby (has ${have})`,
  };
}

/** What a service building at (x, y) would cover, for the placement preview. */
export function serviceImpact(
  id: string,
  x: number,
  y: number,
  z: Game,
): { text: string; good: boolean; neutral?: boolean }[] {
  const lines: { text: string; good: boolean; neutral?: boolean }[] = [];
  for (const s of SERVICES) {
    const r = s.providers[id];
    if (r == null) continue;
    const homes = tilesWithin(x, y, r, z).filter(isHome).length;
    lines.push({
      text: `${s.emoji} ${s.title} for homes within ${r} tiles${homes ? ` (${homes} now)` : ""}`,
      good: true,
      neutral: homes === 0,
    });
  }
  return lines;
}
