// Reads a saved town and reports how it's doing. Usage: node sim/dist/judge.mjs <save.json>
import { readFileSync } from "node:fs";
import { options } from "./harness";
import { normalizeGame, countJobs, staffing, staffRatio } from "../src/lib/store";
import { landValue, pollutionAt, homeEffect, townHomeEffect } from "../src/lib/land";
import { levelStatus, homeCapacity } from "../src/lib/housing";
import { needStatus, coverage, servicesAt, currentTier } from "../src/lib/needs";
import { taxMood, taxTolerance } from "../src/lib/tax";
import { homeOccupancy, attraction, weeklyArrivals } from "../src/lib/migration";
import { availability } from "../src/lib/ui";
import { synergyAt } from "../src/lib/neighbours";
import { isAdjacentToWater } from "../src/lib/utils";

const z = normalizeGame(JSON.parse(readFileSync(process.argv[2], "utf8")))!;
const t = z.townInfo, r = z.resources, rr = z.resource_rate;
const built = z.plots.flat().filter((p) => p.active && p.type > -1);
const land = z.plots.flat().filter((p) => !p.offMap && !p.water && !p.site);
const counts: Record<string, number> = {};
for (const p of built) counts[options[p.type].id] = (counts[options[p.type].id] ?? 0) + 1;
console.log(`day ${z.environment.day} (year ${(z.environment.day / 360).toFixed(1)}), difficulty ${z.difficulty}, settings [${z.gameSettings}], tutorial step ${z.currentTutorialStep}, ended: ${z.endGameDetails.msg || "no"}`);
console.log(`pop ${t.population_count}/${t.population_max} jobs ${countJobs(z)} happy ${t.happiness.toFixed(0)} health ${t.health.toFixed(0)} community ${t.community.toFixed(0)} gold ${t.gold.toFixed(0)} (+${z.economyAndLaws.weeklyProfit.toFixed(1)}/wk) knowledge ${t.knowledge_points.toFixed(0)} productivity ${t.productivity}`);
console.log(`tax ${z.economyAndLaws.tax_rate} tolerance ${taxTolerance(z).toFixed(2)} mood ${taxMood(z).word}; laws [${z.economyAndLaws.enacted}]`);
console.log(`resources food ${r.food.toFixed(0)} (${rr.food}) wood ${r.wood.toFixed(0)} (${rr.wood}) stone ${r.stone.toFixed(0)} (${rr.stone}) metal ${r.metal.toFixed(1)} (${rr.metal}) power ${r.power} cap ${z.resource_capacity} kn/wk ${rr.knowledge}`);
console.log(`land used ${built.length}/${land.length} tiles; buildings ${JSON.stringify(counts)}`);
const att = attraction(z);
console.log(`move-in factor ${att.factor.toFixed(2)} arrivals ${weeklyArrivals(z)}/wk: ${att.reasons.map((x) => x.text).join("; ")}`);
const cov = coverage(z);
console.log(`needs tier ${currentTier(z)}: ${needStatus(z, cov).map((n) => `${n.service.short} ${Math.round(n.covered * 100)}%/${Math.round(n.target * 100)}%`).join(", ")}`);
const occ = homeOccupancy(z);
const homes = built.filter((p) => homeCapacity(p) > 0);
let lvls = [0, 0, 0];
const rows: string[] = [];
for (const h of homes) {
  const o = occ.get(h.id)!;
  const s = levelStatus(h, z, o.people >= o.capacity, cov);
  lvls[s.level - 1]++;
  const e = homeEffect(h.x, h.y, z);
  rows.push(`  ${options[h.type].id === "large_homes" ? "L" : "S"}(${h.x},${h.y}) lvl${s.level} ${o.people}/${o.capacity} LV ${e.value} pol ${Math.round(e.pollution)} svc[${servicesAt(h, cov).join(",")}] ${s.trend}${s.missing.length ? " needs: " + s.missing.join("; ") : ""}${s.slipping.length ? " SLIPPING: " + s.slipping.join("; ") : ""}`);
}
const he = townHomeEffect(z);
console.log(`homes ${homes.length}, levels ${lvls.join("/")}; town home effect happy ${he.happiness.toFixed(2)}/wk health ${he.health.toFixed(2)}/wk, polluted homes ${he.pollutedHomes}`);
console.log(rows.join("\n"));
const staff = staffing(z);
const under = built.filter((p) => staffRatio(staff, p) < 1).map((p) => `${options[p.type].id}@${p.x},${p.y} ${Math.round(staffRatio(staff, p) * 100)}%`);
console.log(`understaffed: ${under.join(", ") || "none"}`);
const water = built.filter((p) => options[p.type].revenue_per_week > 0 || options[p.type].generated_resources.food > 0);
console.log(`revenue/food buildings next to water: ${water.filter((p) => isAdjacentToWater(p.x, p.y, z)).length}/${water.length}`);
const syn = built.filter((p) => ["livestock_farm", "bakery", "tree_farm", "blacksmith", "village_market", "general_store"].includes(options[p.type].id));
console.log(`synergy buildings with bonus: ${syn.filter((p) => synergyAt(p.x, p.y, z).reason).length}/${syn.length}`);
const why: Record<string, string[]> = {};
for (const o of options) { const a = availability(o, z); (why[a.ok ? "OK" : a.reason] ??= []).push(o.id); }
for (const [k, v] of Object.entries(why)) console.log(`  ${k}: ${v.join(", ")}`);
console.log("log:", z.townLog.slice(0, 8).map((l) => `d${l.day} ${l.message.slice(0, 110)}`).join("\n     "));
// ASCII map: row by row
const sym: Record<string, string> = { small_homes: "h", large_homes: "H", farm: "f", livestock_farm: "l", tree_farm: "t", quarry: "Q", park: "p", church: "c", Apothecary: "a", stables: "s", bakery: "b", village_market: "m", pub: "u", vineyard: "v", stockpile: "k", water_wheel: "w", library: "y", mine: "M", lumber_mill: "L", blacksmith: "B", schoolhouse: "S", healing_house: "+" };
console.log("\nmap (h home, H large, f farm, l livestock, t tree, Q quarry, p park, c church, a apothecary, s stables, b bakery, m market, ~ water, * mineral, . land):");
for (const row of z.plots) {
  const line = row.map((p) => (p.offMap ? " " : p.water ? "~" : p.active && p.type > -1 ? (sym[options[p.type].id] ?? "?")   : p.site === "mineral" ? "*" : ".")).join(" ");
  if (line.trim()) console.log((row[0].x % 2 ? " " : "") + line);
}
