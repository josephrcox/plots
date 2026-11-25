// Idle and delayed-consequence tests. Usage: node sim/dist/consequences.mjs [maps]
//
// Idle: the rule player builds for Y years, then stops building (and leaves
// tax alone) for a year. Does the town hold, drift or collapse?
//
// Delayed consequences: every town gets the same build order (the balanced
// rule player's order on that map), placed in different ways:
//   smart       – good tiles all game
//   random      – any legal tile
//   bad         – worst tiles (industry next to homes, no amenities near homes)
//   badYear1    – worst tiles in year 1, smart afterwards (an early mistake)
//   smartNoise  – smart, but different random events (the luck baseline)
// The gap to "smart" at years 1, 2 and 3 shows whether placement matters,
// and whether an early mistake lingers or is quickly forgiven.
import { newTown, alive, stepDays, buildable, build, seed, options, value, type TileMode } from "./harness";
import { STYLES, ruleWeek } from "./policies";
import type { Game } from "../src/lib/types";
import { writeFileSync } from "node:fs";

const MAPS = +(process.argv[2] ?? 30);
const W = 52;
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
type Snap = { pop: number; happy: number; health: number; gold: number; alive: boolean; score: number };
const snap = (g: Game): Snap => ({ pop: g.townInfo.population_count, happy: g.townInfo.happiness, health: g.townInfo.health, gold: g.townInfo.gold, alive: alive(g), score: value(g) });

// ---------------------------------------------------------------- idle
function idle(map: number, activeYears: number) {
  const g = newTown(map);
  const out: Record<string, Snap> = {};
  for (let w = 0; w < activeYears * W + W && alive(g); w++) {
    if (w < activeYears * W) { seed(map * 1000 + w); ruleWeek(g, STYLES[0]); }
    seed(100_000 + w);
    stepDays(g, 7);
    const since = w + 1 - activeYears * W;
    if (since === 0) out.start = snap(g);
    if ([13, 26, 52].includes(since)) out[`+${since}w`] = snap(g);
  }
  if (!alive(g)) out.diedWeek = { pop: g.environment.day / 7 - activeYears * W } as any;
  return out;
}

// ---------------------------------------------------------- consequences
const ORDER_STYLE = STYLES.find((s) => s.name === (process.env.STYLE ?? "balanced"))!;
function ruleOrder(map: number): { week: number; id: string }[] {
  const g = newTown(map);
  const order: { week: number; id: string }[] = [];
  for (let w = 0; w < 3 * W && alive(g); w++) {
    seed(map * 1000 + w);
    const before = g.plotCounts.slice();
    ruleWeek(g, ORDER_STYLE);
    const i = g.plotCounts.findIndex((c, k) => (c ?? 0) > (before[k] ?? 0));
    if (i >= 0) order.push({ week: w, id: options[i].id });
    seed(100_000 + w);
    stepDays(g, 7);
  }
  return order;
}

function replay(map: number, order: { week: number; id: string }[], mode: (week: number) => TileMode, noise = 0) {
  const g = newTown(map);
  const queue = order.slice();
  const snaps: Snap[] = [];
  let stuck = 0;
  for (let w = 0; w < 3 * W; w++) {
    g.economyAndLaws.tax_rate = STYLES[0].taxRate;
    // Build what the order says once its week has come and it can be built.
    while (alive(g) && queue.length && queue[0].week <= w) {
      seed(map * 1000 + w);
      if (buildable(g).includes(queue[0].id) && build(g, queue[0].id, mode(w))) { queue.shift(); stuck = 0; }
      else { if (++stuck > 8) { queue.shift(); stuck = 0; } break; }
    }
    seed(100_000 + noise * 7919 + w);
    stepDays(g, 7);
    if ((w + 1) % W === 0) snaps.push(snap(g));
  }
  return snaps;
}

const maps = Array.from({ length: MAPS }, (_, i) => i + 1);
const idle1 = maps.map((m) => idle(m, 1));
const idle2 = maps.map((m) => idle(m, 2));

const variants: Record<string, (w: number) => TileMode> = {
  smart: () => "smart",
  random: () => "random",
  bad: () => "bad",
  badYear1: (w) => (w < W ? "bad" : "smart"),
  smartNoise: () => "smart",
};
const C: Record<string, Snap[][]> = {};
for (const [k, mode] of Object.entries(variants)) C[k] = [];
for (const m of maps) {
  const order = ruleOrder(m);
  for (const [k, mode] of Object.entries(variants)) C[k].push(replay(m, order, mode, k === "smartNoise" ? 1 : 0));
}

const pct = (a: number, b: number) => Math.round(((a - b) / Math.abs(b || 1)) * 1000) / 10;
function idleSummary(runs: Record<string, Snap>[]) {
  const keys = ["start", "+13w", "+26w", "+52w"];
  return Object.fromEntries(keys.map((k) => {
    const s = runs.map((r) => r[k]).filter(Boolean);
    return [k, { alive: mean(runs.map((r) => +!!r[k]?.alive)), pop: Math.round(mean(s.map((x) => x.pop))), happy: Math.round(mean(s.map((x) => x.happy))), health: Math.round(mean(s.map((x) => x.health))), gold: Math.round(mean(s.map((x) => x.gold))) }];
  }));
}
const consequences = Object.fromEntries(Object.entries(C).map(([k, runs]) => [k, [0, 1, 2].map((y) => {
  const s = runs.map((r) => r[y]).filter(Boolean);
  const base = C.smart.map((r) => r[y]).filter(Boolean);
  return {
    year: y + 1, alive: mean(runs.map((r) => +!!r[y]?.alive)), pop: Math.round(mean(s.map((x) => x.pop))),
    health: Math.round(mean(s.map((x) => x.health))), happy: Math.round(mean(s.map((x) => x.happy))),
    popVsSmart: pct(mean(s.map((x) => x.pop)), mean(base.map((x) => x.pop))),
    scoreVsSmart: pct(mean(s.map((x) => x.score)), mean(base.map((x) => x.score))),
    // Share of maps where this variant ends behind smart on population.
    mapsBehind: mean(runs.map((r, j) => +((r[y]?.pop ?? 0) < (C.smart[j][y]?.pop ?? 0)))),
  };
})]));
const summary = { maps: MAPS, idleAfter1Year: idleSummary(idle1), idleAfter2Years: idleSummary(idle2), consequences };
writeFileSync(new URL("./last-consequences.json", import.meta.url), JSON.stringify(summary, null, 1));
console.log(JSON.stringify(summary, null, 1));
