// Achievements: earned once for your whole account (across towns). Many
// unlock a perk you can bring to future towns (perks.ts). Secret ones stay
// hidden until earned.
import type { Achievement, Game } from "$lib/types";
import { options } from "./PlotTypeOptions";

const homes = (z: Game) =>
  z.plots.flat().filter((p) => p.active && options[p.type]?.type === "residential");
const people = (z: Game) => z.people ?? [];
const ageOf = (z: Game, born: number) => (z.environment.day - born) / (z.ageScale ?? 72);
const isRetired = (z: Game, p: { born: number; id: number }) =>
  ageOf(z, p.born) >= 65 && (p.id * 2654435761) % 10 >= 3;

// Building id → career id, mirroring people.ts (kept here to avoid an import cycle).
const CAREER_OF: Record<string, string> = {
  farm: "farmer", livestock_farm: "farmer", adv_farm: "farmer", fishery: "farmer",
  tree_farm: "lumberjack", lumber_mill: "lumberjack",
  quarry: "miner", mine: "miner",
  bakery: "merchant", village_market: "merchant", general_store: "merchant", stockpile: "merchant", adv_stockpile: "merchant",
  pub: "host", vineyard: "host", village_inn: "host", stables: "host",
  park: "caretaker", church: "caretaker",
  Apothecary: "healer", healing_house: "healer",
  water_wheel: "engineer", adv_water_wheel: "engineer", solar_farm: "engineer",
  blacksmith: "smith",
  schoolhouse: "teacher", academy: "teacher", university: "teacher",
  library: "scholar", lab: "scholar",
  city_hall: "clerk", bank: "clerk",
};

export const achievements: Achievement[] = [
  // ---- Growing ----
  { id: "village", icon: "🏘️", title: "A proper village", description: "Reach 100 townspeople.", unlocks: "founders_fund",
    check: (z) => z.townInfo.population_count >= 100 },
  { id: "breadbasket", icon: "🥖", title: "Breadbasket", description: "Keep 300 people well fed.", unlocks: "seed_bank",
    check: (z) => z.townInfo.population_count >= 300 && !!z.wellFed },
  { id: "timber", icon: "🪓", title: "Timber!", description: "Produce 30 wood a week.", unlocks: "lumber_stock",
    check: (z) => z.resource_rate.wood >= 30 },
  { id: "city", icon: "🌆", title: "Big city", description: "Reach 1,000 townspeople.",
    check: (z) => z.townInfo.population_count >= 1000 },
  // ---- The land ----
  { id: "cartographer", icon: "🗺️", title: "Cartographer", description: "Explore nine tenths of your land.", unlocks: "old_maps",
    check: (z) => {
      if (!z.fog) return false;
      const land = z.plots.flat().filter((p) => !p.offMap);
      return land.filter((p) => p.seen).length >= land.length * 0.9;
    } },
  { id: "lay_of_the_land", icon: "🌍", title: "Lay of the land", description: "Make use of four different kinds of special site.", unlocks: "surveyor",
    check: (z) => new Set(z.plots.flat().filter((p) => p.site && p.active).map((p) => p.site)).size >= 4 },
  { id: "clean_air", icon: "🌬️", title: "Clean air", description: "300 people, some industry, and not one home in polluted air.",
    check: (z) =>
      z.townInfo.population_count >= 300 &&
      z.plots.flat().some((p) => p.active && ["quarry", "mine", "blacksmith", "lumber_mill"].includes(p.typeId)) &&
      homes(z).every((h) => (h.pollution ?? 0) < 10) },
  // ---- Homes ----
  { id: "skyline", icon: "🏙️", title: "Skyline", description: "Have 10 homes at level 3.", unlocks: "planned_homes",
    check: (z) => homes(z).filter((h) => (h.level ?? 1) >= 3).length >= 10 },
  // ---- People ----
  { id: "golden_years", icon: "🌅", title: "Golden years", description: "Give each of at least 10 retirees somewhere to spend their days.", unlocks: "wise_elders",
    check: (z) => {
      const retired = people(z).filter((p) => isRetired(z, p));
      if (retired.length < 10) return false;
      const byId = new Map(z.plots.flat().map((q) => [q.id, q]));
      return retired.every((p) => {
        const venue = p.job ? byId.get(p.job) : undefined;
        return !!venue && options[venue.type]?.type === "retirement";
      });
    } },
  { id: "dream_town", icon: "✨", title: "Dream town", description: "With 200 workers, have most of them in their dream job.", unlocks: "dreamers",
    check: (z) => {
      const workers = people(z).filter((p) => p.job && p.job !== "guard");
      if (workers.length < 200) return false;
      const byId = new Map(z.plots.flat().map((q) => [q.id, q]));
      const dreaming = workers.filter((p) => {
        const q = byId.get(p.job!);
        return q && CAREER_OF[options[q.type]?.id] === p.dream;
      });
      return dreaming.length > workers.length / 2;
    } },
  { id: "scholars", icon: "🎓", title: "Town of scholars", description: "With 200 people, raise the average schooling to skilled.", unlocks: "learned_settlers",
    check: (z) => {
      const ps = people(z);
      return ps.length >= 200 && ps.reduce((s, p) => s + p.edu, 0) / ps.length >= 2;
    } },
  { id: "wish_granted", icon: "🎁", title: "Wish granted", description: "Fulfil five townspeople's requests.", unlocks: "generous",
    check: (z) => (z.stats?.requestsDone ?? 0) >= 5 },
  { id: "homegrown", icon: "👶", title: "Homegrown", description: "Welcome 100 babies born in town.",
    check: (z) => (z.lifeStats?.births ?? 0) >= 100 },
  { id: "long_life", icon: "🎂", title: "A long life", description: "Have a townsperson reach 90.",
    check: (z) => people(z).some((p) => ageOf(z, p.born) >= 90) },
  { id: "phoenix", icon: "🔥", title: "Phoenix", description: "Bring a miserable town back to being happy.", unlocks: "resilient",
    check: (z) => !!z.stats?.wasMiserable && z.townInfo.happiness >= 170 },
  // ---- Secret ----
  { id: "stayin_frugal", icon: "🚲", title: "Stayin' frugal", description: "200 people and under 5 gold in the bank.", secret: true,
    check: (z) => z.townInfo.gold <= 5 && z.townInfo.population_count >= 200 },
  { id: "happily_dying", icon: "🙃", title: "Happily dying", description: "Very happy and very sick at the same time.", secret: true,
    check: (z) => z.townInfo.happiness > 250 && z.townInfo.health < 40 },
  { id: "ghost_town", icon: "👻", title: "Ghost town", description: "Ten homes' worth of empty space and nobody wants to move in.", secret: true,
    check: (z) => z.townInfo.population_max - z.townInfo.population_count >= 160 && z.townInfo.happiness < 60 },
];
