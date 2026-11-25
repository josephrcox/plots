// Replayability experiment. Usage: node sim/dist/run.mjs [maps] [years]
//
// Bots:
//   adaptive  – each week, tries every buildable option (and waiting, and tax
//               changes monthly) on a copy of the town, looks H weeks ahead,
//               takes the best. Repeats until waiting wins (max 3 builds/wk).
//   script    – replays another map's adaptive build order blindly, with
//               smart tile placement. This is "the memorised strategy".
//   random    – random buildable option each week, random tile.
//
// Outputs JSON + a printed summary of the predictability metrics.
import { newTown, clone, alive, stepDays, buildable, build, value, seed, options } from "./harness";
import type { Game } from "../src/lib/types";
import { STYLES, ruleWeek, type Style } from "./policies";
import { writeFileSync } from "node:fs";
import { Worker, isMainThread, parentPort } from "node:worker_threads";
import { availableParallelism } from "node:os";

const MAPS = +(process.argv[2] ?? 30);
const YEARS = +(process.argv[3] ?? 3);
const WEEKS = Math.round((YEARS * 360) / 7);
const H = +(process.env.H ?? 12); // lookahead weeks
const TAXES = [0.1, 0.2, 0.3, 0.4, 0.5];
const NEAR = 0.03; // "near-best" = within 3% of the best option's value

type Action = { week: number; kind: "build" | "tax"; id: string };
type Result = { map: number; score: number; pop: number; gold: number; alive: boolean; diedDay: number | null; actions: Action[]; choices?: number[]; options?: number[] };

const BASE = STYLES[0];
/** Plays `weeks` more weeks with the rule player, then scores the town. */
function rollout(g: Game, week: number, weeks: number) {
  for (let k = 0; k < weeks && alive(g); k++) {
    seed(777_000 + week * 100 + k);
    const tax = g.economyAndLaws.tax_rate;
    ruleWeek(g, BASE);
    g.economyAndLaws.tax_rate = tax;
    stepDays(g, 7);
  }
  return value(g);
}

function rules(map: number, s: Style): Result {
  const g = newTown(map);
  const actions: Action[] = [];
  for (let w = 0; w < WEEKS && alive(g); w++) {
    seed(map * 1000 + w);
    const before = g.plotCounts.slice();
    ruleWeek(g, s);
    const i = g.plotCounts.findIndex((c, k) => (c ?? 0) > (before[k] ?? 0));
    if (i >= 0) actions.push({ week: w, kind: "build", id: options[i].id });
    seed(100_000 + w);
    stepDays(g, 7);
  }
  return finish(map, g, actions);
}

function finish(map: number, g: Game, actions: Action[], extra: Partial<Result> = {}): Result {
  return {
    map, score: value(g), pop: g.townInfo.population_count, gold: Math.round(g.townInfo.gold),
    alive: alive(g), diedDay: alive(g) ? null : g.environment.day, actions, ...extra,
  };
}

function adaptive(map: number, noise = 1): Result {
  const g = newTown(map);
  const actions: Action[] = [];
  const choices: number[] = []; // # of near-best options per real decision
  const opts: number[] = []; // # of buildable options per decision
  build(g, "small_homes"); actions.push({ week: 0, kind: "build", id: "small_homes" });
  for (let w = 0; w < WEEKS && alive(g); w++) {
    if (w % 4 === 0) {
      let best = g.economyAndLaws.tax_rate, bv = -Infinity;
      for (const t of TAXES) {
        const c = clone(g); c.economyAndLaws.tax_rate = t;
        const v = rollout(c, w, H);
        if (v > bv) { bv = v; best = t; }
      }
      if (best !== g.economyAndLaws.tax_rate) actions.push({ week: w, kind: "tax", id: String(best) });
      g.economyAndLaws.tax_rate = best;
    }
    for (let k = 0; k < 2; k++) {
      const ids = buildable(g);
      if (!ids.length) break;
      const vals: [string, number][] = [["wait", rollout(clone(g), w, H)]];
      for (const id of ids) {
        const c = clone(g);
        seed(map * 1000 + w);
        if (!build(c, id)) continue;
        vals.push([id, rollout(c, w, H)]);
      }
      vals.sort((a, b) => b[1] - a[1]);
      const top = vals[0][1];
      const tol = Math.max(1, Math.abs(top) * NEAR);
      choices.push(vals.filter((v) => top - v[1] <= tol).length);
      opts.push(vals.length);
      if (vals[0][0] === "wait") break;
      seed(map * 1000 + w);
      build(g, vals[0][0]);
      actions.push({ week: w, kind: "build", id: vals[0][0] });
    }
    seed(noise * 100_000 + w);
    stepDays(g, 7);
  }
  return finish(map, g, actions, { choices, options: opts });
}

/** Replays a build order (and tax changes) in sequence, waiting until each fits. */
function script(map: number, source: Action[], smartTiles = true): Result {
  const g = newTown(map);
  const queue = source.slice();
  const actions: Action[] = [];
  let stuck = 0;
  for (let w = 0; w < WEEKS && alive(g); w++) {
    for (let k = 0; k < 3 && queue.length; k++) {
      const a = queue[0];
      if (a.kind === "tax") { g.economyAndLaws.tax_rate = +a.id; queue.shift(); k--; continue; }
      seed(map * 1000 + w);
      if (buildable(g).includes(a.id) && build(g, a.id, smartTiles)) {
        actions.push({ week: w, kind: "build", id: a.id }); queue.shift(); stuck = 0;
      } else {
        if (++stuck > 12) { queue.shift(); stuck = 0; } // give up on it
        break;
      }
    }
    seed(100_000 + w);
    stepDays(g, 7);
  }
  return finish(map, g, actions);
}

function random(map: number): Result {
  const g = newTown(map);
  const actions: Action[] = [];
  build(g, "small_homes");
  for (let w = 0; w < WEEKS && alive(g); w++) {
    seed(map * 1000 + w);
    const ids = buildable(g);
    if (ids.length && Math.random() < 0.6) {
      const id = ids[Math.floor(Math.random() * ids.length)];
      if (build(g, id, false)) actions.push({ week: w, kind: "build", id });
    }
    seed(100_000 + w);
    stepDays(g, 7);
  }
  return finish(map, g, actions);
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
const builds = (r: Result) => r.actions.filter((a) => a.kind === "build").map((a) => a.id);

function lev(a: string[], b: string[]) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length] / Math.max(1, a.length, b.length);
}
function composition(r: Result) {
  const v = options.map(() => 0);
  for (const id of builds(r)) v[options.findIndex((o) => o.id === id)]++;
  return v;
}
function cosine(a: number[], b: number[]) {
  let ab = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) { ab += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2; }
  return ab / Math.sqrt(aa * bb || 1);
}
function pairs<T>(xs: T[], f: (a: T, b: T) => number) {
  const out: number[] = [];
  for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) out.push(f(xs[i], xs[j]));
  return mean(out);
}

// ---------------------------------------------------------------------------
// Parallel runs: each worker thread has its own copy of the game modules.
// ---------------------------------------------------------------------------
type Task = { kind: "adaptive" | "random" | "rules" | "script"; map: number; style?: number; actions?: Action[]; smart?: boolean };
function runTask(t: Task): Result {
  if (t.kind === "adaptive") return adaptive(t.map);
  if (t.kind === "random") return random(t.map);
  if (t.kind === "rules") return rules(t.map, STYLES[t.style!]);
  return script(t.map, t.actions!, t.smart);
}
let workers: Worker[] = [];
function pool(tasks: Task[]): Promise<any[]> {
  if (!workers.length) {
    const n = Math.max(1, availableParallelism() - 1);
    workers = Array.from({ length: n }, () => new Worker(new URL(import.meta.url)));
  }
  const out: any[] = new Array(tasks.length);
  let next = 0, done = 0;
  return new Promise((resolve) => {
    if (!tasks.length) return resolve(out);
    const feed = (w: Worker) => {
      if (next >= tasks.length) return;
      const i = next++;
      w.once("message", (r) => { out[i] = r; if (++done === tasks.length) resolve(out); else feed(w); });
      w.postMessage(tasks[i]);
    };
    workers.forEach(feed);
  });
}

if (!isMainThread) {
  parentPort!.on("message", (t: Task) => parentPort!.postMessage(runTask(t)));
} else {
  const t0 = Date.now();
  const maps = Array.from({ length: MAPS }, (_, i) => i + 1);
  const A: Result[] = await pool(maps.map((m) => ({ kind: "adaptive", map: m })));
  console.error(`adaptive done ${(Date.now() - t0) / 1000}s`);
  const R: Result[] = await pool(maps.map((m) => ({ kind: "random", map: m })));
  const RSflat: Result[] = await pool(STYLES.flatMap((_, k) => maps.map((m) => ({ kind: "rules", map: m, style: k }))));
  const RS = STYLES.map((_, k) => RSflat.slice(k * MAPS, (k + 1) * MAPS));
  // Which play style does best on each map?
  const winners = maps.map((_, j) => { const sc = RS.map((r) => r[j].score); return sc.indexOf(Math.max(...sc)); });
  const winCounts = STYLES.map((_, k) => winners.filter((w) => w === k).length);
  const entropy = -winCounts.filter((c) => c).reduce((s, c) => s + (c / MAPS) * Math.log2(c / MAPS), 0) / Math.log2(STYLES.length);

  // Cross-play: every adaptive order replayed on every map.
  const crossFlat: Result[] = await pool(A.flatMap((src) => maps.map((m) => ({ kind: "script", map: m, actions: src.actions, smart: true }))));
  const cross: number[][] = A.map((_, i) => crossFlat.slice(i * MAPS, (i + 1) * MAPS).map((r) => r.score));
  const donorAvg = cross.map((row) => mean(row));
  const bestDonor = donorAvg.indexOf(Math.max(...donorAvg));
  const S = maps.map((m, j) => cross[bestDonor][j]);
  const randTiles = (await pool(maps.map((m, j) => ({ kind: "script", map: m, actions: A[j].actions, smart: false })))).map((r: Result) => r.score);
  console.error(`all done ${(Date.now() - t0) / 1000}s`);

  const aS = A.map((r) => r.score);
  const diag = maps.map((_, j) => cross[j][j]);
  const offDiag = cross.flatMap((row, i) => row.filter((_, j) => j !== i));
  const firstN = (n: number) => A.map((r) => builds(r).slice(0, n));
  const opening = (n: number) => {
    const seqs = firstN(n).map((s) => s.join(","));
    const counts = new Map<string, number>();
    for (const s of seqs) counts.set(s, (counts.get(s) ?? 0) + 1);
    return Math.max(...counts.values()) / seqs.length;
  };

  const summary = {
    maps: MAPS, years: YEARS,
    survival: { adaptive: mean(A.map((r) => +r.alive)), bestScript: mean(maps.map((m, j) => +(cross[bestDonor][j] > -500))), random: mean(R.map((r) => +r.alive)) },
    score: { adaptive: mean(aS), bestScript: mean(S), randomTiles: mean(randTiles), random: mean(R.map((r) => r.score)) },
    pop: { adaptive: mean(A.map((r) => r.pop)), random: mean(R.map((r) => r.pop)) },
    adaptiveCV: sd(aS) / mean(aS),
    adaptationPremium: (mean(aS) - mean(S)) / Math.abs(mean(aS)),
    scriptWinsOrTies: mean(maps.map((_, j) => +(S[j] >= aS[j] * 0.97))),
    ownOrderVsOthers: (mean(diag) - mean(offDiag)) / Math.abs(mean(diag)),
    placementPremium: (mean(aS) - mean(randTiles)) / Math.abs(mean(aS)),
    skillCeiling: (mean(aS) - mean(R.map((r) => r.score))) / Math.abs(mean(aS)),
    openingIdentical: { first5: opening(5), first10: opening(10), first20: opening(20) },
    orderDistance: { first10: pairs(firstN(10), lev), first30: pairs(firstN(30), lev) },
    compositionSimilarity: pairs(A.map(composition), cosine),
    choices: { optionsPerDecision: mean(A.flatMap((r) => r.options!)), nearBestPerDecision: mean(A.flatMap((r) => r.choices!)), shareWithRealChoice: mean(A.flatMap((r) => r.choices!.map((c) => +(c >= 2)))) },
    betweenMapSD: sd(aS),
    styles: Object.fromEntries(STYLES.map((st, k) => [st.name, { score: Math.round(mean(RS[k].map((r) => r.score))), pop: Math.round(mean(RS[k].map((r) => r.pop))), survival: mean(RS[k].map((r) => +r.alive)), mapsWon: winCounts[k] }])),
    styleWinnerEntropy: entropy,
    modalOpening: firstN(12)[0],
    typesUsed: options.filter((_, i) => A.some((r) => composition(r)[i] > 0)).length + "/" + options.length,
  };
  writeFileSync(new URL("./last-run.json", import.meta.url), JSON.stringify({ summary, adaptive: A.map(({ choices, options, ...r }) => r), random: R, rules: RS, cross }, null, 1));
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}
