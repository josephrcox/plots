// Invariant tests for townspeople (#64). Usage: node sim/dist/tests.mjs [maps] [years]
// Plays towns with the rule player (bulldozing now and then) and checks every
// week that people, homes and jobs stay consistent.
import { newTown, alive, stepDays, seed, options } from "./harness";
import { STYLES, ruleWeek } from "./policies";
import { reverseClear } from "../src/lib/store";
import { homeCapacity } from "../src/lib/housing";
import { GUARD, plotById, worksDream, wishes, moodSummary, ageMix, canWork, REQUIRED_EDU, currentRequest, isRetired, isMember } from "../src/lib/people";
import type { Game } from "../src/lib/types";
import { siteOf, SITES } from "../src/lib/sites";

const MAPS = +(process.argv[2] ?? 5);
const YEARS = +(process.argv[3] ?? 3);
let failures = 0;
let checks = 0;

function check(ok: boolean, msg: string) {
  checks++;
  if (!ok) {
    failures++;
    if (failures <= 20) console.log("FAIL", msg);
  }
}

function invariants(z: Game, where: string) {
  const people = z.people ?? [];
  check(people.length === z.townInfo.population_count, `${where}: people ${people.length} ≠ population ${z.townInfo.population_count}`);
  check(new Set(people.map((p) => p.id)).size === people.length, `${where}: duplicate person ids`);
  const inHome = new Map<string, number>();
  const inJob = new Map<string, number>();
  let guards = 0;
  for (const p of people) {
    const home = p.home ? plotById(z, p.home) : undefined;
    check(!!home && homeCapacity(home) > 0, `${where}: ${p.name} has no valid home (${p.home})`);
    if (p.home) inHome.set(p.home, (inHome.get(p.home) ?? 0) + 1);
    if (p.job === GUARD) guards++;
    else if (p.job) {
      const job = plotById(z, p.job);
      check(!!job && job.active && (options[job.type]?.requirements.employees ?? 0) > 0, `${where}: ${p.name} works at a missing workplace`);
      inJob.set(p.job, (inJob.get(p.job) ?? 0) + 1);
    }
  }
  for (const [id, n] of inHome) {
    const cap = homeCapacity(plotById(z, id)!);
    check(n <= cap, `${where}: home ${id} has ${n} people, room for ${cap}`);
  }
  for (const [id, n] of inJob) {
    const need = options[plotById(z, id)!.type].requirements.employees;
    check(n <= need, `${where}: workplace ${id} has ${n} workers, needs ${need}`);
  }
  check(guards <= z.townInfo.guardians, `${where}: ${guards} guards > ${z.townInfo.guardians} guardians`);
  check(z.townInfo.population_count <= z.townInfo.population_max, `${where}: population over capacity`);
  const employed = people.filter((p) => p.job && !isMember(p, z)).length;
  check(z.townInfo.employees === employed, `${where}: employees ${z.townInfo.employees} ≠ employed ${employed}`);
  check(people.every((p) => p.edu >= 0 && p.edu <= 3 && Number.isFinite(p.mood)), `${where}: bad edu or mood`);
  check(Number.isFinite(z.townInfo.happiness), `${where}: happiness not finite`);
  for (const pl of z.plots.flat()) {
    const site = siteOf(pl);
    if (site && pl.active && pl.type > -1) check(site.allows.includes(options[pl.type].id), `${where}: ${options[pl.type].id} built on ${site.id}`);
  }
  for (const p of people) {
    if (!p.job || p.job === GUARD) continue;
    const jp = plotById(z, p.job);
    if (jp && options[jp.type]?.type === "retirement") {
      check(isRetired(p, z), `${where}: ${p.name} is a venue member but not retired`);
      continue;
    }
    check(canWork(p, z), `${where}: ${p.name} works but can't (child or retired)`);
    const job = plotById(z, p.job);
    const need = job ? REQUIRED_EDU[options[job.type].id] ?? 0 : 0;
    check(Math.floor(p.edu) >= need, `${where}: ${p.name} lacks the education for their job`);
  }
}

for (let m = 1; m <= MAPS; m++) {
  const g = newTown(m);
  for (let w = 0; w < YEARS * 52 && alive(g); w++) {
    seed(m * 1000 + w);
    ruleWeek(g, STYLES[0]);
    // Now and then, bulldoze a random building (homes included).
    if (w > 30 && w % 9 === 4) {
      const built = g.plots.flat().filter((p) => p.active && p.type > -1);
      const victim = built[Math.floor(Math.random() * built.length)];
      if (victim) {
        reverseClear(victim.x, victim.y, g);
        invariants(g, `map ${m} wk ${w} after bulldozing ${options[victim.type]?.id ?? "?"}`);
      }
    }
    seed(100_000 + w);
    stepDays(g, 7);
    invariants(g, `map ${m} wk ${w}`);
  }
  const z = g;
  const p = z.people ?? [];
  console.log(`map ${m}: day ${z.environment.day} alive ${alive(z)} pop ${p.length} happy ${z.townInfo.happiness.toFixed(0)} (base ${z.moodBase?.toFixed(0)} + avg mood ${z.moodAverage?.toFixed(1)}) employed ${p.filter((x) => x.job).length}, dream jobs ${p.filter((x) => worksDream(x, z)).length}, edu avg ${(p.reduce((s, x) => s + x.edu, 0) / Math.max(1, p.length)).toFixed(2)}`);
  console.log(`   moods: ${moodSummary(z).map((x) => `${x.text} ${x.amount.toFixed(1)}`).join("; ")}`);
  console.log(`   wishes: ${wishes(z).map((x) => x.text).join("; ")}`);
  const mix = ageMix(z);
  const req = currentRequest(z);
  const members = p.filter((x) => isMember(x, z)).length;
  const retired = p.filter((x) => isRetired(x, z)).length;
  console.log(`   retirees ${retired}, at venues ${members}; venues built: ${z.plots.flat().filter((q) => q.active && options[q.type]?.type === "retirement").map((q) => options[q.type].id).join(", ") || "none"}`);
  const sites = z.plots.flat().filter((q) => q.site);
  console.log(`   sites: ${sites.map((q) => `${SITES.find((s) => s.id === q.site)?.emoji}${q.active ? "✓" : ""}`).join(" ")}`);
  console.log(`   ages: ${mix.child} children, ${mix.adult} adults, ${mix.elder} elders; births ${z.lifeStats?.births ?? 0}, deaths ${z.lifeStats?.deaths ?? 0}; request: ${req ? `${req.person.name} ${req.text}` : "none"}`);
}
console.log(`${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
