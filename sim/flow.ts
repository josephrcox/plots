// Diagnostic: plays the balanced rule player and every half year prints the
// economy and why each building can't be built. Usage: node sim/dist/flow.mjs [map] [years]
import { newTown, alive, stepDays, seed, options } from "./harness";
import { STYLES, ruleWeek } from "./policies";
import { availability } from "../src/lib/ui";
import { countJobs } from "../src/lib/store";
import { landValue } from "../src/lib/land";
const map = +(process.argv[2] ?? 1), years = +(process.argv[3] ?? 3);
const g = newTown(map);
const built: Record<string, number> = {};
for (let w = 0; w < years * 52 && alive(g); w++) {
  seed(map * 1000 + w);
  const before = g.plotCounts.slice();
  ruleWeek(g, STYLES[+(process.env.STYLE ?? 0)]);
  const i = g.plotCounts.findIndex((c, k) => (c ?? 0) > (before[k] ?? 0));
  if (i >= 0) built[options[i].id] = (built[options[i].id] ?? 0) + 1;
  seed(100000 + w); stepDays(g, 7);
  if ((w + 1) % 26 === 0) {
    const t = g.townInfo, r = g.resources, rr = g.resource_rate;
    console.log(`\n== week ${w + 1}: pop ${t.population_count}/${t.population_max} jobs ${countJobs(g)} gold ${t.gold.toFixed(0)} (+${g.economyAndLaws.weeklyProfit.toFixed(1)}/wk) happy ${t.happiness.toFixed(0)} health ${t.health.toFixed(0)} kn ${t.knowledge_points.toFixed(0)}`);
    console.log(`   food ${r.food.toFixed(0)} (${rr.food}) wood ${r.wood.toFixed(0)} (${rr.wood}) stone ${r.stone.toFixed(0)} (${rr.stone}) metal ${r.metal.toFixed(1)} (${rr.metal}) power ${r.power} cap ${g.resource_capacity}`);
    const homes = g.plots.flat().filter((p) => p.active && options[p.type]?.type === "residential");
    const lv = homes.map((p) => landValue(p.x, p.y, g).value);
    const lvl = [1, 2, 3].map((l) => homes.filter((p) => (p.level ?? 1) === l).length);
    console.log(`   homes ${homes.length} levels ${lvl.join("/")} landValue avg ${(lv.reduce((a, b) => a + b, 0) / Math.max(1, lv.length)).toFixed(0)} max ${Math.max(0, ...lv)}`);
    const why: Record<string, string[]> = {};
    for (const o of options) { const a = availability(o, g); (why[a.ok ? "OK" : a.reason] ??= []).push(o.id); }
    for (const [k, v] of Object.entries(why)) console.log(`   ${k}: ${v.join(", ")}`);
  }
}
console.log("\nbuilt", JSON.stringify(built));
