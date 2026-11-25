// Pollution and land value (#59): the slow, lasting side effects of layout.
//
// Pollution is stored per tile. Industry adds to it every week, up to two
// tiles away; it fades slowly (half-life ~3 months), so a bad spot stays bad
// for a while after you fix it. Parks and tree farms soak some up.
//
// Land value is worked out on the fly from what's nearby: amenities, water
// and shops raise it; pollution and noise lower it.
//
// Each home's weekly happiness follows its land value and its health follows
// its pollution. The town feels the population-weighted average.

import { options } from "./objects/PlotTypeOptions";
import { hexNeighbourCoords } from "./neighbours";
import type { Game, Plot, PlotOption } from "./types";
import { strength, STEPS } from "./strength";

/** Pollution added per week on the source tile (less further out). */
export const POLLUTERS: Record<string, number> = {
  mine: 6,
  quarry: 4,
  blacksmith: 4,
  lumber_mill: 3,
  adv_farm: 1,
};
/** Share of a source's output that reaches distance 0, 1, 2. */
const SPREAD = [1, 0.6, 0.25];
/** Share of pollution that stays each week. */
const PERSIST = 0.94;
/** Extra cleanup on tiles next to these. */
const ABSORBERS: Record<string, number> = { park: 0.3, tree_farm: 0.12, community_garden: 0.2 };
export const MAX_POLLUTION = 100;

/** Land value added at distance 1 and 2 (noise is negative). */
export const AMENITIES: Record<string, [number, number]> = {
  park: [12, 6],
  church: [8, 4],
  library: [8, 4],
  healing_house: [10, 5],
  Apothecary: [6, 3],
  stables: [6, 3],
  vineyard: [4, 2],
  schoolhouse: [8, 4],
  village_market: [5, 3],
  general_store: [6, 3],
  bakery: [3, 1],
  village_inn: [4, 2],
  community_garden: [8, 4],
  museum: [6, 3],
  social_club: [4, 2],
  storyteller: [3, 1],
  craft_guild: [2, 1],
  pub: [-6, -2],
  water_wheel: [-3, -1],
  farm: [-1, 0],
  livestock_farm: [-3, -1],
};
const AMENITY_CAP = 35;
const WATER_VALUE = 8;
const POLLUTION_VALUE = 0.5; // land value lost per point of pollution
export const BASE_LAND_VALUE = 50;
/** Land this close to the base value is ordinary: no effect on residents. */
export const NEUTRAL_BAND = 8;

/** Per home per week, before scaling to the town. */
const HAPPY_PER_VALUE = 1 / 15; // (value − 50) / 15
const HEALTH_PER_POLLUTION = 1 / 25;
/** Town-wide weekly change = average home effect × this. */
export const TOWN_EFFECT_SCALE = 1.5;
/** Casual games feel the downsides at this strength. */
export const CASUAL_FACTOR = 0.5;

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

/** Tiles at hex distance 1 and 2 from (x, y). */
export function rings(x: number, y: number, z: Game): [Plot[], Plot[]] {
  const key = (i: number, j: number) => `${i},${j}`;
  const seen = new Set([key(x, y)]);
  const d1: Plot[] = [];
  const d2: Plot[] = [];
  for (const [i, j] of hexNeighbourCoords(x, y)) {
    seen.add(key(i, j));
    const p = z.plots[i]?.[j];
    if (p && !p.offMap) d1.push(p);
  }
  for (const [i, j] of hexNeighbourCoords(x, y)) {
    for (const [a, b] of hexNeighbourCoords(i, j)) {
      if (seen.has(key(a, b))) continue;
      seen.add(key(a, b));
      const p = z.plots[a]?.[b];
      if (p && !p.offMap) d2.push(p);
    }
  }
  return [d1, d2];
}

function builtId(p: Plot): string | null {
  if (!p.active || p.type < 0 || p.disabled) return null;
  return options[p.type]?.id ?? null;
}

export function isHome(option: PlotOption | undefined | null) {
  return option?.type === "residential";
}

function casual(z: Game) {
  return z.gameSettings.includes("casual") ? CASUAL_FACTOR : 1;
}

// ---------------------------------------------------------------------------
// Pollution
// ---------------------------------------------------------------------------

export function pollutionAt(z: Game, x: number, y: number): number {
  return z.plots[x]?.[y]?.pollution ?? 0;
}

/** Weekly: old pollution fades, industry adds more. */
export function updatePollution(z: Game) {
  const add = new Map<Plot, number>();
  const clean = new Map<Plot, number>();
  for (const row of z.plots) {
    for (const p of row) {
      const id = builtId(p);
      if (!id) continue;
      const out = POLLUTERS[id];
      const absorb = ABSORBERS[id];
      if (!out && !absorb) continue;
      const [d1, d2] = rings(p.x, p.y, z);
      if (out) {
        add.set(p, (add.get(p) ?? 0) + out * SPREAD[0]);
        for (const q of d1) add.set(q, (add.get(q) ?? 0) + out * SPREAD[1]);
        for (const q of d2) add.set(q, (add.get(q) ?? 0) + out * SPREAD[2]);
      }
      if (absorb) {
        for (const q of [p, ...d1]) clean.set(q, Math.max(clean.get(q) ?? 0, absorb));
      }
    }
  }
  for (const row of z.plots) {
    for (const p of row) {
      const keep = PERSIST * (1 - (clean.get(p) ?? 0));
      const next = (p.pollution ?? 0) * keep + (add.get(p) ?? 0);
      const value = Math.min(MAX_POLLUTION, Math.round(next * 10) / 10);
      if (value > 0.05) p.pollution = value;
      else delete p.pollution;
    }
  }
}

/** Pollution a source at (x, y) would add per week to the tile (i, j). */
function emissionTo(id: string, x: number, y: number, i: number, j: number, z: Game) {
  const out = POLLUTERS[id];
  if (!out) return 0;
  if (x === i && y === j) return out * SPREAD[0];
  const [d1, d2] = rings(x, y, z);
  if (d1.some((p) => p.x === i && p.y === j)) return out * SPREAD[1];
  if (d2.some((p) => p.x === i && p.y === j)) return out * SPREAD[2];
  return 0;
}

/** Long-run pollution a steady weekly addition settles at. */
export function settledPollution(weekly: number) {
  return Math.min(MAX_POLLUTION, weekly / (1 - PERSIST));
}

// ---------------------------------------------------------------------------
// Land value
// ---------------------------------------------------------------------------

export type ValuePart = { text: string; amount: number };

export function landValue(x: number, y: number, z: Game): { value: number; parts: ValuePart[] } {
  const parts: ValuePart[] = [];
  const [d1, d2] = rings(x, y, z);
  const bonus = new Map<string, number>();
  for (const [ring, k] of [[d1, 0], [d2, 1]] as const) {
    for (const p of ring) {
      const id = builtId(p);
      const v = id ? AMENITIES[id] : undefined;
      if (!v) continue;
      // The best of each kind counts; a second park next door adds nothing.
      const key = id!;
      const amount = v[k];
      const prev = bonus.get(key);
      if (prev === undefined || Math.abs(amount) > Math.abs(prev)) bonus.set(key, amount);
    }
  }
  let amenities = 0;
  for (const [id, amount] of bonus) {
    if (amount > 0) amenities += amount;
    else if (amount < 0) parts.push({ text: `${options.find((o) => o.id === id)?.title ?? id} nearby`, amount });
  }
  const capped = Math.min(AMENITY_CAP, amenities);
  if (capped > 0) {
    const names = [...bonus.entries()].filter(([, a]) => a > 0).map(([id]) => options.find((o) => o.id === id)?.emoji ?? "");
    parts.push({ text: `Amenities nearby ${names.join("")}`, amount: capped });
  }
  if (d1.some((p) => p.water)) parts.push({ text: "Near water", amount: WATER_VALUE });
  const pol = pollutionAt(z, x, y);
  if (pol >= 1) parts.push({ text: "Pollution", amount: -Math.round(pol * POLLUTION_VALUE) });
  const value = BASE_LAND_VALUE + parts.reduce((s, p) => s + p.amount, 0);
  return { value: Math.max(0, Math.min(100, Math.round(value))), parts };
}

export function landValueWord(v: number) {
  if (v >= 80) return "Prime";
  if (v > BASE_LAND_VALUE + NEUTRAL_BAND) return "Desirable";
  if (v >= BASE_LAND_VALUE - NEUTRAL_BAND) return "Ordinary";
  if (v >= 30) return "Run-down";
  return "Blighted";
}

/** "good" / "neutral" / "bad", for colouring land value in the UI. */
export function landValueTone(v: number): "good" | "neutral" | "bad" {
  if (v > BASE_LAND_VALUE + NEUTRAL_BAND) return "good";
  if (v < BASE_LAND_VALUE - NEUTRAL_BAND) return "bad";
  return "neutral";
}

export function pollutionWord(p: number) {
  if (p < 5) return "Clean";
  if (p < 20) return "Hazy";
  if (p < 45) return "Polluted";
  return "Toxic";
}

// ---------------------------------------------------------------------------
// Homes
// ---------------------------------------------------------------------------

export type HomeEffect = { happiness: number; health: number; value: number; pollution: number };

/** Weekly effect of a home's surroundings on the people living there. */
export function homeEffect(x: number, y: number, z: Game): HomeEffect {
  const { value } = landValue(x, y, z);
  const pollution = pollutionAt(z, x, y);
  const soften = casual(z);
  // Ordinary land (within NEUTRAL_BAND of the base) has no effect either way.
  const off = value - BASE_LAND_VALUE;
  const beyond = Math.sign(off) * Math.max(0, Math.abs(off) - NEUTRAL_BAND);
  let happiness = beyond * HAPPY_PER_VALUE;
  if (happiness < 0) happiness *= soften;
  const health = -pollution * HEALTH_PER_POLLUTION * soften;
  return { happiness, health, value, pollution };
}

/** Population-weighted average of every home's effect, scaled for the town. */
export function townHomeEffect(z: Game): { happiness: number; health: number; pollutedHomes: number; homes: number } {
  let weight = 0, happiness = 0, health = 0, pollutedHomes = 0, homes = 0;
  for (const row of z.plots) {
    for (const p of row) {
      const id = builtId(p);
      const option = id ? options[p.type] : null;
      if (!isHome(option)) continue;
      homes++;
      const w = Math.max(1, option!.immediate_variable_changes.population);
      const e = homeEffect(p.x, p.y, z);
      happiness += e.happiness * w;
      health += e.health * w;
      if (e.pollution >= 20) pollutedHomes++;
      weight += w;
    }
  }
  if (!weight) return { happiness: 0, health: 0, pollutedHomes: 0, homes: 0 };
  return {
    happiness: (happiness / weight) * TOWN_EFFECT_SCALE,
    health: (health / weight) * TOWN_EFFECT_SCALE,
    pollutedHomes,
    homes,
  };
}

// ---------------------------------------------------------------------------
// Placement preview
// ---------------------------------------------------------------------------

export type ImpactLine = { text: string; good: boolean; neutral?: boolean; strength?: number; exact?: string };

/** What building `id` at (x, y) would do to land and homes around it. */
export function placementImpact(id: string, x: number, y: number, z: Game): ImpactLine[] {
  const lines: ImpactLine[] = [];
  const option = options.find((o) => o.id === id);
  if (!option) return lines;
  const [d1, d2] = rings(x, y, z);
  const homesIn = (ring: Plot[]) => ring.filter((p) => isHome(builtId(p) ? options[p.type] : null));
  if (isHome(option)) {
    const { value } = landValue(x, y, z);
    const pol = pollutionAt(z, x, y);
    const t = landValueTone(value);
    const off = Math.max(0, Math.abs(value - BASE_LAND_VALUE) - NEUTRAL_BAND);
    lines.push({
      text: `${landValueWord(value)} land here`,
      good: t !== "bad",
      neutral: t === "neutral",
      strength: t === "neutral" ? 0 : strength(off, [1, 10, 20]),
      exact: `Land value ${value}`,
    });
    if (pol >= 5) lines.push({ text: `${pollutionWord(pol)} air: residents' health suffers`, good: false, strength: strength(pol, STEPS.pollution), exact: `Pollution ${Math.round(pol)}` });
  }
  if (POLLUTERS[id]) {
    const near = [...homesIn([...d1, ...d2])];
    if (near.length) {
      const worst = Math.max(...near.map((h) => settledPollution(emissionTo(id, x, y, h.x, h.y, z))));
      lines.push({
        text: `Pollutes ${near.length} home${near.length > 1 ? "s" : ""} within 2 tiles, building up over months`,
        good: false,
        strength: strength(worst, STEPS.pollution),
        exact: `Builds up to ${Math.round(worst)} pollution`,
      });
    } else {
      lines.push({ text: "Pollutes land within 2 tiles; keep homes away", good: true, neutral: true });
    }
  }
  const amenity = AMENITIES[id];
  if (amenity) {
    const near = homesIn([...d1, ...d2]).length;
    if (near) {
      lines.push({
        text: `${amenity[0] > 0 ? "Raises" : "Lowers"} land value for ${near} home${near > 1 ? "s" : ""} nearby`,
        good: amenity[0] > 0,
        strength: strength(amenity[0], STEPS.land),
        exact: `${amenity[0] > 0 ? "+" : ""}${amenity[0]} next door, ${amenity[1] > 0 ? "+" : ""}${amenity[1]} two tiles away`,
      });
    }
  }
  if (ABSORBERS[id]) {
    const dirty = [{ x, y }, ...d1].some((p) => pollutionAt(z, p.x, p.y) >= 5);
    if (dirty) lines.push({ text: "Soaks up pollution next to it", good: true });
  }
  return lines;
}
