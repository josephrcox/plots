// Prints the replayability scorecard from the last runs of run.ts and
// consequences.ts. Each row: value now, target band, and whether it's in it.
import { readFileSync } from "node:fs";

const dir = new URL("./dist/", import.meta.url);
const load = (f) => JSON.parse(readFileSync(new URL(f, dir), "utf8"));
const run = load("last-run.json");
const con = load("last-consequences.json");
const s = run.summary;

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const M = run.adaptive.length;
// Best memorised script: the donor order with the best average across maps,
// compared with the best result anything found on each map.
const donorAvg = run.cross.map((r) => mean(r));
const best = donorAvg.indexOf(Math.max(...donorAvg));
const bestKnown = [...Array(M).keys()].map((j) =>
  Math.max(run.adaptive[j].score, ...run.rules.map((r) => r[j].score), ...run.cross.map((r) => r[j])),
);
const ratio = [...Array(M).keys()].map((j) => run.cross[best][j] / bestKnown[j]);
const styleWins = Math.max(...Object.values(s.styles).map((x) => x.mapsWon));
const topStyle = Object.entries(s.styles).sort((a, b) => b[1].mapsWon - a[1].mapsWon)[0][0];
const c = con.consequences;
const y3 = (k) => c[k][2].popVsSmart;
const mistake = c.badYear1.map((y) => y.popVsSmart);
const idle = con.idleAfter2Years;
const tax = run.adaptive[best].actions.find((a) => a.kind === "tax");

const pct = (x) => `${Math.round(x * 100)}%`;
const rows = [
  ["Best memorised script vs best per map", `${pct(mean(ratio))} (worst ${pct(Math.min(...ratio))})`, "75–90%", mean(ratio) >= 0.75 && mean(ratio) <= 0.9],
  ["Script's opening tax", tax ? `${Math.round(+tax.id * 100)}%` : "unchanged", "not the maximum", !tax || +tax.id < 0.5],
  ["Maps won by top play style", `${styleWins}/${M} (${topStyle})`, `≤ ${Math.round(M / 2)}/${M}`, styleWins <= M / 2],
  ["Building types used by year 3", s.typesUsed, "≥ 20", parseInt(s.typesUsed) >= 20],
  ["Skill gap: lookahead bot vs random (pop)", `${Math.round(s.pop.adaptive)} vs ${Math.round(s.pop.random)}`, "≥ 2×", s.pop.adaptive >= 2 * Math.max(1, s.pop.random)],
  ["Worst layout vs smart, year 3", `${y3("bad")}%`, "≤ −20%", y3("bad") <= -20],
  ["Random tiles vs smart, year 3", `${y3("random")}%`, "≤ −10%", y3("random") <= -10],
  ["Year-1 mistake gap, years 1/2/3", mistake.map((x) => `${x}%`).join(" / "), "lasts (yr 3 < yr 1)", mistake[2] < mistake[0]],
  ["Decisions with 2+ near-best options", pct(s.choices.shareWithRealChoice), "40–70%", s.choices.shareWithRealChoice >= 0.4 && s.choices.shareWithRealChoice <= 0.7],
  ["First 20 builds identical across maps", pct(s.openingIdentical.first20), "< 20%", s.openingIdentical.first20 < 0.2],
  ["Finished-town similarity", s.compositionSimilarity.toFixed(2), "0.70–0.90", s.compositionSimilarity >= 0.7 && s.compositionSimilarity <= 0.9],
  ["Idle a year after 2 years: alive", pct(idle["+52w"].alive), "100%", idle["+52w"].alive === 1],
  ["Idle a year: happiness drift", `${idle.start.happy} → ${idle["+52w"].happy}`, "falls, stays > 50", idle["+52w"].happy < idle.start.happy && idle["+52w"].happy > 50],
];
const w = [42, 26, 18];
console.log(`\nReplayability scorecard (${s.maps} maps × ${s.years} years)\n`);
console.log("   " + ["Metric", "Now", "Target"].map((h, i) => h.padEnd(w[i])).join(""));
for (const [name, now, target, ok] of rows) {
  console.log(`${ok ? "✅" : "❌"} ${name.padEnd(w[0])}${String(now).padEnd(w[1])}${target}`);
}
console.log(`\nStyles: ${Object.entries(s.styles).map(([k, v]) => `${k} ${v.pop}pop/${v.mapsWon}won`).join(", ")}`);
