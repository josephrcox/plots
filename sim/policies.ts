// A rule-following player: fixes the most urgent need, otherwise builds what
// its style values most per gold. Used on its own and as the rollout policy
// for the adaptive (lookahead) bot.
import { buildable, build, options } from "./harness";
import { countJobs } from "../src/lib/store";
import { levelStatus } from "../src/lib/housing";
import { needStatus } from "../src/lib/needs";
import type { Game } from "../src/lib/types";

export type Style = { name: string; w: Record<string, number>; homesAt: number; taxRate: number };

const FOOD = ["farm", "livestock_farm", "adv_farm", "fishery"];
const AMEN_HAPPY = ["park", "church", "stables", "library", "vineyard"];
const AMEN_HEALTH = ["Apothecary", "park", "healing_house"];
const opt = (id: string) => options.find((o) => o.id === id)!;

export const STYLES: Style[] = [
  { name: "balanced", w: {}, homesAt: 0.85, taxRate: 0.2 },
  { name: "commerce", w: { business: 2, shop: 2.5, tourism: 2 }, homesAt: 0.8, taxRate: 0.3 },
  { name: "industry", w: { industrial: 2, quarry: 2, mine: 2, lumber: 1.5, stockpile: 1.5 }, homesAt: 0.9, taxRate: 0.2 },
  { name: "growth", w: { residential: 2, farm: 1.5 }, homesAt: 0.6, taxRate: 0.15 },
  { name: "wellbeing", w: { recreation: 2.5, medical: 2.5, education: 1.5 }, homesAt: 0.85, taxRate: 0.1 },
];

function cheapest(g: Game, ids: string[], can: string[]): string | null {
  const ok = ids.filter((i) => can.includes(i));
  ok.sort((a, b) => opt(a).requirements.gold - opt(b).requirements.gold);
  return ok[0] ?? null;
}

/** Value-for-money of an option, for the style. */
function worth(id: string, s: Style): number {
  const o = opt(id);
  const gen = o.generated_resources;
  const v = o.revenue_per_week * 1.0 + gen.food * 1.5 + gen.wood * 0.8 + gen.stone * 0.8 + gen.metal * 2 + gen.power * 0.5 + o.knowledge_points_per_month * 0.5 + o.immediate_variable_changes.population * 0.3 + 2;
  return (v * (s.w[o.type] ?? 1)) / (o.requirements.gold + 20);
}

export function decide(g: Game, s: Style): string | null {
  const can = buildable(g);
  if (!can.length) return null;
  const i = g.townInfo;
  const pop = i.population_count;
  if (pop === 0) return can.includes("small_homes") ? "small_homes" : null;
  const need = pop * 0.1;
  const jobs = countJobs(g);
  const full = pop >= i.population_max * s.homesAt;
  // No spare workers: new buildings would sit unstaffed, so house people first.
  if (jobs >= pop && full) {
    if (can.includes("large_homes") && g.townInfo.gold > 400) return "large_homes";
    if (can.includes("small_homes")) return "small_homes";
    return null; // save up for homes
  }
  // Food spoils, so the rate hovers near zero; judge by weeks of food in store.
  if (g.resources.food < need * 4) {
    const f = can.filter((c) => FOOD.includes(c)).sort((a, b) => worth(b, s) - worth(a, s))[0];
    if (f) return f;
  }
  if (!g.plots.some((r) => r.some((p) => p.typeId === "tree_farm")) || (g.resource_rate.wood < 1 && g.resources.wood < g.resource_capacity * 0.8) || g.resources.wood < 40) {
    if (can.includes("tree_farm")) return "tree_farm";
  }
  // Unmet town needs: build the cheapest provider of the worst one.
  const unmet = needStatus(g).filter((n) => !n.met).sort((a, b) => (b.target - b.covered) - (a.target - a.covered));
  for (const n of unmet) {
    const a = cheapest(g, Object.keys(n.service.providers), can);
    if (a) return a;
  }
  // Homes stuck below the land value they need to grow: add an amenity
  // (the tile picker puts it next to the most homes).
  const stuck = g.plots.flat().filter((p) => {
    if (!p.active || options[p.type]?.type !== "residential") return false;
    const s2 = levelStatus(p, g);
    return s2.level < 3 && s2.missing.some((m) => m.startsWith("land value"));
  }).length;
  if (stuck >= 3) {
    const a = cheapest(g, ["park", "church", "Apothecary", "stables", "library", "healing_house"], can);
    if (a) return a;
  }
  if (i.happiness < 120) { const a = cheapest(g, AMEN_HAPPY, can); if (a) return a; }
  if (i.health < 120) { const a = cheapest(g, AMEN_HEALTH, can); if (a) return a; }
  if (g.resources.power < 0 && can.includes("water_wheel")) return "water_wheel";
  if (full && jobs >= pop * 0.8) {
    if (can.includes("large_homes") && g.townInfo.gold > 400) return "large_homes";
    if (can.includes("small_homes")) return "small_homes";
  }
  const quarries = g.plots.flat().filter((p) => p.typeId === "quarry" || p.typeId === "mine").length;
  if (g.resources.stone < 20 && quarries === 0) {
    // Homes need stone and only a quarry makes it: save up for one.
    return can.includes("quarry") ? "quarry" : null;
  }
  // Stone keeps running short as the town grows: add quarries.
  if (g.resources.stone < 40 && quarries < 1 + Math.floor(pop / 150) && can.includes("quarry")) return "quarry";
  // Enough food in store: don't keep adding farms.
  const fed = g.resources.food >= Math.min(need * 6, g.resource_capacity * 0.8);
  const best = can.filter((c) => c !== "small_homes" && c !== "large_homes" && !(fed && FOOD.includes(c))).sort((a, b) => worth(b, s) - worth(a, s))[0];
  // Keep a little gold back unless it's a strong buy.
  return best ?? null;
}

/** One week of the rule player's building. */
export function ruleWeek(g: Game, s: Style) {
  g.economyAndLaws.tax_rate = s.taxRate;
  const id = decide(g, s);
  if (id) build(g, id);
}
