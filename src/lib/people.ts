// Townspeople (#64). Population is a list of real people with a few small
// differences: a dream career, a favourite place, how hard they work and how
// much they eat, and how educated they are. Each has a mood; the town's
// happiness is the average of everyone's mood.
//
// The data model stays small: each person stores a handful of fields, and
// everything else (age, mood, wishes) is worked out from them. The rest of
// the game still changes `townInfo.population_count`; `syncPeople` keeps the
// list in step (adding newcomers, or removing the unhappiest first).

import { options } from "./objects/PlotTypeOptions";
import { townPeopleNames } from "./objects/townPeople";
import { landValue, BASE_LAND_VALUE, NEUTRAL_BAND, POLLUTERS } from "./land";
import { coverage, needStatus, type ServiceId } from "./needs";
import type { Game, Person, Plot } from "./types";
import { isVenue, VENUE, RETIREE_MOOD, MEMBER_DEATH_FACTOR } from "./retirement";

// ---------------------------------------------------------------------------
// Careers and favourite places
// ---------------------------------------------------------------------------

export type Career = { id: string; title: string; emoji: string; buildings: string[]; weight: number };

export const CAREERS: Career[] = [
  { id: "farmer", title: "Farmer", emoji: "🧑‍🌾", buildings: ["farm", "livestock_farm", "adv_farm", "fishery"], weight: 3 },
  { id: "lumberjack", title: "Lumberjack", emoji: "🪓", buildings: ["tree_farm", "lumber_mill"], weight: 2 },
  { id: "miner", title: "Miner", emoji: "⛏️", buildings: ["quarry", "mine"], weight: 2 },
  { id: "merchant", title: "Merchant", emoji: "🛒", buildings: ["bakery", "village_market", "general_store", "stockpile", "adv_stockpile"], weight: 2 },
  { id: "host", title: "Innkeeper", emoji: "🍺", buildings: ["pub", "vineyard", "village_inn", "stables"], weight: 1.5 },
  { id: "caretaker", title: "Caretaker", emoji: "🌷", buildings: ["park", "church"], weight: 1 },
  { id: "healer", title: "Healer", emoji: "🩺", buildings: ["Apothecary", "healing_house"], weight: 1 },
  { id: "engineer", title: "Engineer", emoji: "⚙️", buildings: ["water_wheel", "adv_water_wheel", "solar_farm"], weight: 1 },
  { id: "smith", title: "Smith", emoji: "🔨", buildings: ["blacksmith"], weight: 1 },
  { id: "teacher", title: "Teacher", emoji: "📚", buildings: ["schoolhouse", "academy", "university"], weight: 1 },
  { id: "scholar", title: "Scholar", emoji: "🔬", buildings: ["library", "lab"], weight: 1 },
  { id: "clerk", title: "Clerk", emoji: "🗂️", buildings: ["city_hall", "bank"], weight: 0.7 },
];
export const GUARD = "guard"; // job id for guardians (City Hall)

const careerOfBuilding = new Map<string, string>();
for (const c of CAREERS) for (const b of c.buildings) careerOfBuilding.set(b, c.id);
export function careerOf(buildingId: string): Career | undefined {
  const id = careerOfBuilding.get(buildingId);
  return CAREERS.find((c) => c.id === id);
}

/** Why someone loves a kind of building, for their card. */
export const FAVOURITES: Record<string, { weight: number; reason: string }> = {
  park: { weight: 4, reason: "loves an afternoon in the park" },
  church: { weight: 3, reason: "never misses a Sunday at church" },
  library: { weight: 2.5, reason: "reads everything at the library" },
  stables: { weight: 2, reason: "rides the horses at the stables" },
  pub: { weight: 3, reason: "has a regular stool at the pub" },
  bakery: { weight: 3, reason: "can't walk past the bakery" },
  village_market: { weight: 2.5, reason: "knows every stall at the market" },
  vineyard: { weight: 1.5, reason: "helps with the grape harvest" },
  schoolhouse: { weight: 1.5, reason: "volunteers at the schoolhouse" },
  Apothecary: { weight: 1, reason: "collects herbs for the apothecary" },
  farm: { weight: 1.5, reason: "likes the smell of fresh hay" },
  livestock_farm: { weight: 1.5, reason: "names every cow at the farm" },
  fishery: { weight: 1, reason: "fishes off the pier" },
  tree_farm: { weight: 1, reason: "walks among the young trees" },
  water_wheel: { weight: 1, reason: "watches the water wheel turn" },
  village_inn: { weight: 1, reason: "swaps stories with travellers at the inn" },
  quarry: { weight: 0.7, reason: "watches the quarry blasts from far away" },
  mine: { weight: 0.5, reason: "watches the mine carts from the hill" },
  blacksmith: { weight: 0.7, reason: "likes the ring of the smithy" },
  general_store: { weight: 0.7, reason: "browses the general store" },
  healing_house: { weight: 0.5, reason: "visits the sick at the healing house" },
};

const SURNAMES = [
  "Ashby", "Barlow", "Bramble", "Carver", "Cotton", "Dale", "Ellery", "Fairweather", "Fenwick", "Fletcher",
  "Garnet", "Hale", "Hargrove", "Holloway", "Ives", "Kettle", "Larkin", "Marsh", "Mercer", "Moss",
  "Nettle", "Oakes", "Pebble", "Penrose", "Quill", "Reed", "Rowan", "Sable", "Shaw", "Thatcher",
  "Thorne", "Tinker", "Underhill", "Vale", "Wren", "Whitlock", "Winslow", "Yardley", "Birch", "Copper",
];

function pickWeighted<T>(items: T[], weight: (t: T) => number): T {
  const total = items.reduce((s, t) => s + weight(t), 0);
  let r = Math.random() * total;
  for (const t of items) {
    r -= weight(t);
    if (r <= 0) return t;
  }
  return items[items.length - 1];
}

const ADULT_MIN = 18;
const ADULT_MAX = 45;
export const ELDER_AGE = 65;
/** Game days in a year of the calendar (for roots). */
export const GAME_YEAR = 360;
/**
 * Game days per year of a person's age. Lives are compressed (#65): a game
 * year ages people five years, so a normal game sees generations.
 */
export const DAYS_PER_AGE_YEAR = 72;

/** Age for someone in an established town: some children, mostly adults, some elders. */
function settledAge(): number {
  const r = Math.random();
  if (r < 0.2) return Math.floor(Math.random() * ADULT_MIN);
  if (r < 0.85) return ADULT_MIN + Math.floor(Math.random() * (ELDER_AGE - ADULT_MIN));
  return ELDER_AGE + Math.floor(Math.random() * 15);
}

/** Education newcomers arrive with: mostly none or basic, a few skilled. */
function arrivingEducation(): number {
  const r = Math.random();
  return r < 0.45 ? 0 : r < 0.8 ? 1 : r < 0.95 ? 2 : 3;
}

/** A newcomer with random traits (or a newborn, given a parent). */
export function newPerson(z: Game, parent?: Person, spreadAges = false): Person {
  const age = parent
    ? 0
    : spreadAges
      ? settledAge()
      : ADULT_MIN + Math.floor(Math.random() * (ADULT_MAX - ADULT_MIN));
  const fav = pickWeighted(Object.keys(FAVOURITES), (id) => FAVOURITES[id].weight);
  z.nextPersonId = (z.nextPersonId ?? 0) + 1;
  const surname = parent ? parent.name.split(" ").slice(1).join(" ") : SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  return {
    id: z.nextPersonId,
    name: `${townPeopleNames[Math.floor(Math.random() * townPeopleNames.length)]} ${surname}`,
    born: z.environment.day - age * DAYS_PER_AGE_YEAR - (parent ? 0 : Math.floor(Math.random() * DAYS_PER_AGE_YEAR)),
    arrived: z.environment.day,
    home: parent?.home ?? null,
    job: null,
    edu: parent ? 0 : arrivingEducation(),
    restless: Math.random() < 0.1 || undefined,
    dream: pickWeighted(CAREERS, (c) => c.weight).id,
    fav,
    work: round2(0.8 + Math.random() * 0.4),
    appetite: round2(0.8 + Math.random() * 0.4),
    mood: 0,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function ageOf(p: Person, z: Game): number {
  return Math.floor((z.environment.day - p.born) / DAYS_PER_AGE_YEAR);
}

export type Stage = "child" | "adult" | "elder";
export function stageOf(p: Person, z: Game): Stage {
  const age = ageOf(p, z);
  return age < ADULT_MIN ? "child" : age >= ELDER_AGE ? "elder" : "adult";
}

/** About 3 in 10 elders keep working (decided once, by who they are). */
export function keepsWorking(p: Person): boolean {
  return (p.id * 2654435761) % 10 < 3;
}

/** Elders who have stopped working (they may join a place for retirees). */
export function isRetired(p: Person, z: Game): boolean {
  return stageOf(p, z) === "elder" && !keepsWorking(p);
}

/** Whether someone is a member of a place for retirees. */
export function isMember(p: Person, z: Game): boolean {
  return !!p.job && p.job !== GUARD && isVenue(plotById(z, p.job));
}

/** Whether someone is of working age (adults, and elders who keep working). */
export function canWork(p: Person, z: Game): boolean {
  const s = stageOf(p, z);
  return s === "adult" || (s === "elder" && keepsWorking(p));
}

/** Education level a building's workers need (#65). 1 basic, 2 skilled, 3 scholar. */
export const REQUIRED_EDU: Record<string, number> = {
  library: 1,
  healing_house: 1,
  city_hall: 1,
  blacksmith: 2,
  schoolhouse: 2,
  academy: 2,
  bank: 2,
  university: 3,
  lab: 3,
};

function qualified(p: Person, buildingId: string): boolean {
  return Math.floor(p.edu) >= (REQUIRED_EDU[buildingId] ?? 0);
}

/** Saves from before compressed lives (#65) stored births on a 360-day year. */
export function migrateAges(z: Game) {
  if (z.ageScale === DAYS_PER_AGE_YEAR) return;
  const day = z.environment.day;
  for (const p of z.people ?? []) p.born = day - Math.round(((day - p.born) * DAYS_PER_AGE_YEAR) / GAME_YEAR);
  z.ageScale = DAYS_PER_AGE_YEAR;
}

// ---------------------------------------------------------------------------
// Bookkeeping: homes
// ---------------------------------------------------------------------------

function builtId(p: Plot): string | null {
  if (!p.active || p.type < 0 || p.disabled) return null;
  return options[p.type]?.id ?? null;
}

/** Room per home at its level (mirrors housing.ts, without importing it). */
function capacityOf(p: Plot): number {
  if (!p.active || p.type < 0) return 0;
  const o = options[p.type];
  if (o?.type !== "residential") return 0;
  return Math.round(o.immediate_variable_changes.population * [1, 1.5, 2][(p.level ?? 1) - 1]);
}

function homesInOrder(z: Game): Plot[] {
  const homes: Plot[] = [];
  for (const row of z.plots) for (const p of row) if (capacityOf(p) > 0) homes.push(p);
  homes.sort((a, b) => (a.builtDay ?? 0) - (b.builtDay ?? 0) || a.x - b.x || a.y - b.y);
  return homes;
}

/**
 * Brings the people list in line with `population_count` and the homes:
 * people whose home is gone or over capacity move to free space (or leave),
 * newcomers are created, and if the count dropped the unhappiest leave first.
 * Returns who arrived and who left, for the town log.
 */
export function syncPeople(z: Game): { arrived: Person[]; left: Person[] } {
  if (!z.people) z.ageScale ??= DAYS_PER_AGE_YEAR; // a town's first people
  const people = (z.people ??= []);
  const homes = homesInOrder(z);
  const cap = new Map(homes.map((h) => [h.id, capacityOf(h)]));
  const used = new Map<string, number>();
  const left: Person[] = [];

  // Keep everyone whose home still has room; the rest need a new home.
  const homeless: Person[] = [];
  for (const p of people) {
    const c = p.home ? cap.get(p.home) : undefined;
    const u = p.home ? used.get(p.home) ?? 0 : 0;
    if (c != null && u < c) used.set(p.home!, u + 1);
    else homeless.push(p);
  }
  let free = homes.filter((h) => (used.get(h.id) ?? 0) < cap.get(h.id)!);
  const place = (p: Person) => {
    const h = free[0];
    if (!h) return false;
    p.home = h.id;
    used.set(h.id, (used.get(h.id) ?? 0) + 1);
    if (used.get(h.id)! >= cap.get(h.id)!) free.shift();
    return true;
  };
  for (const p of homeless) if (!place(p)) left.push(p);
  if (left.length) {
    const gone = new Set(left);
    z.people = people.filter((p) => !gone.has(p));
  }

  // Match the count the rest of the game expects.
  const target = Math.max(0, Math.round(z.townInfo.population_count));
  const arrived: Person[] = [];
  // A whole town appearing at once (an older save) gets a realistic age mix.
  const bulk = target - z.people.length > 30;
  while (z.people.length < target) {
    const p = newPerson(z, undefined, bulk);
    if (!place(p)) break;
    z.people.push(p);
    arrived.push(p);
  }
  if (z.people.length > target) {
    // The unhappiest (then newest) leave first.
    const order = [...z.people].sort((a, b) => a.mood - b.mood || b.arrived - a.arrived);
    const gone = new Set(order.slice(0, z.people.length - target));
    left.push(...gone);
    z.people = z.people.filter((p) => !gone.has(p));
  }
  z.townInfo.population_count = z.people.length;
  if (arrived.length || left.length) assignJobs(z);
  return { arrived, left };
}

/** People living in each home. */
export function residents(z: Game): Map<string, Person[]> {
  const m = new Map<string, Person[]>();
  for (const p of z.people ?? []) {
    if (!p.home) continue;
    if (!m.has(p.home)) m.set(p.home, []);
    m.get(p.home)!.push(p);
  }
  return m;
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

/** Productivity bonus for working your dream job, and the drag otherwise. */
export const DREAM_BOOST = 1.3;
export const OTHER_JOB = 0.9;
/** Elders who keep working get less done. */
export const ELDER_WORK = 0.7;

function workplaces(z: Game): Plot[] {
  const list: Plot[] = [];
  for (const row of z.plots) {
    for (const p of row) {
      if (!p.active || p.type < 0) continue;
      if ((options[p.type]?.requirements.employees ?? 0) > 0) list.push(p);
    }
  }
  list.sort((a, b) => (a.builtDay ?? 0) - (b.builtDay ?? 0) || a.x - b.x || a.y - b.y);
  return list;
}

export function worksDream(p: Person, z: Game): boolean {
  if (!p.job || p.job === GUARD) return false;
  const plot = plotById(z, p.job);
  return !!plot && careerOf(options[plot.type]?.id ?? "")?.id === p.dream;
}

const plotIndex = new WeakMap<Game, { key: string; map: Map<string, Plot> }>();
export function plotById(z: Game, id: string): Plot | undefined {
  const key = `${z.tick}:${z.lastChangeDay}:${z.plotCounts.join(",")}`;
  let hit = plotIndex.get(z);
  if (!hit || hit.key !== key) {
    const map = new Map<string, Plot>();
    for (const row of z.plots) for (const p of row) map.set(p.id, p);
    hit = { key, map };
    plotIndex.set(z, hit);
  }
  return hit.map.get(id);
}

/** 0 = power, 1 = food, 2 = everything else. */
function essential(pl: Plot): number {
  const o = options[pl.type];
  if (!o) return 2;
  if (o.generated_resources.power > 0) return 0;
  if (o.generated_resources.food > 0) return 1;
  return 2;
}

/**
 * Fills jobs: everyone keeps a valid job, people move to an opening in their
 * dream career when there is one, then the jobless take any opening (oldest
 * buildings first, so the newest go short). Guardians are filled first.
 */
export function assignJobs(z: Game) {
  const people = z.people ?? [];
  const all = workplaces(z);
  const places = all.filter((pl) => !isVenue(pl));
  const needed = new Map(places.map((p) => [p.id, options[p.type].requirements.employees]));
  const filled = new Map<string, number>();
  let guards = 0;
  const wantGuards = Math.min(z.townInfo.guardians, people.length);

  // Children and retired elders don't work (retirees may keep a venue membership).
  for (const p of people) if (!canWork(p, z) && !(isRetired(p, z) && isMember(p, z))) p.job = null;
  for (const p of people) if (canWork(p, z) && isMember(p, z)) p.job = null;
  const idOf = new Map(places.map((pl) => [pl.id, options[pl.type].id]));
  // Keep valid jobs.
  for (const p of people) {
    if (!canWork(p, z)) continue;
    if (p.job === GUARD && guards < wantGuards) { guards++; continue; }
    if (p.job && p.job !== GUARD && !qualified(p, idOf.get(p.job) ?? "")) p.job = null;
    const n = p.job ? needed.get(p.job) : undefined;
    if (n != null && (filled.get(p.job!) ?? 0) < n) filled.set(p.job!, (filled.get(p.job!) ?? 0) + 1);
    else p.job = null;
  }
  const opening = (id: string) => (filled.get(id) ?? 0) < needed.get(id)!;
  const leave = (p: Person) => {
    if (p.job && p.job !== GUARD) filled.set(p.job, filled.get(p.job)! - 1);
    p.job = null;
  };
  const take = (p: Person, id: string) => {
    leave(p);
    p.job = id;
    filled.set(id, (filled.get(id) ?? 0) + 1);
  };
  // Guardians come from the jobless first, then anyone.
  for (const pass of [0, 1]) {
    for (const p of people) {
      if (guards >= wantGuards) break;
      if (!canWork(p, z) || stageOf(p, z) !== "adult" || p.job === GUARD || (pass === 0 && p.job)) continue;
      leave(p);
      p.job = GUARD;
      guards++;
    }
  }
  // Dream jobs.
  const byCareer = new Map<string, Plot[]>();
  for (const pl of places) {
    const c = careerOf(options[pl.type].id)?.id;
    if (!c) continue;
    if (!byCareer.has(c)) byCareer.set(c, []);
    byCareer.get(c)!.push(pl);
  }
  for (const p of people) {
    if (!canWork(p, z) || p.job === GUARD || worksDream(p, z)) continue;
    const spot = byCareer.get(p.dream)?.find((pl) => opening(pl.id) && qualified(p, idOf.get(pl.id)!));
    if (spot) take(p, spot.id);
  }
  // Everyone else who's jobless takes any opening.
  // Essentials (power, then food) are staffed first when workers run short.
  const byPriority = [...places].sort((a, b) => essential(a) - essential(b));
  for (const p of people) {
    if (p.job || !canWork(p, z)) continue;
    const spot = byPriority.find((pl) => opening(pl.id) && qualified(p, idOf.get(pl.id)!));
    if (!spot) continue;
    take(p, spot.id);
  }
  // Still short on essentials: move people from other jobs (not dream jobs).
  for (const pl of byPriority) {
    if (essential(pl) === 2) break;
    while (opening(pl.id)) {
      const mover = people.find((p) => p.job && p.job !== GUARD && !worksDream(p, z) && essential(plotById(z, p.job)!) === 2 && qualified(p, idOf.get(pl.id)!));
      if (!mover) break;
      take(mover, pl.id);
    }
  }
  assignVenues(z, all.filter(isVenue));
  z.townInfo.employees = people.filter((p) => p.job && p.job !== GUARD && !isMember(p, z)).length + guards;
}

/**
 * Retirees join places for retirees: their favourite kind first, skilled
 * retirees to a craft guild, otherwise the nearest one with room.
 */
function assignVenues(z: Game, venues: Plot[]) {
  const slots = new Map(venues.map((v) => [v.id, options[v.type].requirements.employees]));
  const used = new Map<string, number>();
  const retirees = (z.people ?? []).filter((p) => isRetired(p, z));
  for (const p of retirees) {
    if (!p.job) continue;
    const n = used.get(p.job) ?? 0;
    if (slots.has(p.job) && n < slots.get(p.job)!) used.set(p.job, n + 1);
    else p.job = null;
  }
  const room = (v: Plot) => (used.get(v.id) ?? 0) < slots.get(v.id)!;
  for (const p of retirees) {
    if (p.job) continue;
    const home = p.home ? plotById(z, p.home) : undefined;
    const open = venues.filter(room);
    if (!open.length) break;
    const dist = (v: Plot) => (home ? hexDistance(home.x, home.y, v.x, v.y) : 0);
    const pick =
      open.find((v) => options[v.type].id === p.fav) ??
      (p.edu >= 2 ? open.find((v) => options[v.type].id === "craft_guild") : undefined) ??
      [...open].sort((a, b) => dist(a) - dist(b))[0];
    p.job = pick.id;
    used.set(pick.id, (used.get(pick.id) ?? 0) + 1);
  }
}

/** Workers per building and their combined output (1 = fully staffed by average workers). */
export function workforce(z: Game): Map<string, { staffed: number; needed: number; output: number }> {
  const m = new Map<string, { staffed: number; needed: number; output: number }>();
  for (const pl of workplaces(z)) m.set(pl.id, { staffed: 0, needed: options[pl.type].requirements.employees, output: 0 });
  for (const p of z.people ?? []) {
    if (!p.job || p.job === GUARD) continue;
    const w = m.get(p.job);
    if (!w) continue;
    w.staffed++;
    if (isVenue(plotById(z, p.job))) continue;
    const elder = stageOf(p, z) === "elder" ? ELDER_WORK : 1;
    w.output += p.work * elder * (worksDream(p, z) ? DREAM_BOOST : OTHER_JOB);
  }
  for (const [id, w] of m) {
    const pl = plotById(z, id);
    // Venue members aren't workers: a venue's "output" is just how full it is.
    w.output = !w.needed ? 1 : isVenue(pl) ? w.staffed / w.needed : w.output / w.needed;
  }
  // Craft guilds: workshops next door get a little more done.
  const guilds = workplaces(z).filter((pl) => options[pl.type].id === "craft_guild");
  for (const g of guilds) {
    const fill = m.get(g.id)?.output ?? 0;
    if (!fill) continue;
    for (const [id, w] of m) {
      const pl = plotById(z, id);
      if (!pl || isVenue(pl)) continue;
      if (hexDistance(g.x, g.y, pl.x, pl.y) <= VENUE.craft_guild.workshopReach) w.output *= 1 + VENUE.craft_guild.workshopBoost * fill;
    }
  }
  return m;
}

// ---------------------------------------------------------------------------
// Mood
// ---------------------------------------------------------------------------

/** Offsets (happiness points) a person's own situation adds to the town baseline. */
const MOOD = {
  landPerPoint: 0.5, // per land value point beyond "ordinary"
  missingService: -8, // per needed service not reaching their home
  favNear: 10, // favourite place within 2 tiles
  favClose: 5, // within 4
  favInTown: 2, // anywhere in town
  favFar: 8, // polluters: enjoyed from 3–6 tiles away
  dreamJob: 6,
  jobless: -6,
  rootsPerYear: 1,
  rootsMax: 5,
};

/** Mood residents get from their home's land value (0 on ordinary land). */
export function landMood(value: number): number {
  const off = value - BASE_LAND_VALUE;
  return Math.sign(off) * Math.max(0, Math.abs(off) - NEUTRAL_BAND) * MOOD.landPerPoint;
}

/** Hex distance between two tiles (odd rows are shifted right). */
export function hexDistance(ax: number, ay: number, bx: number, by: number): number {
  const q1 = ay - (ax - (ax & 1)) / 2;
  const q2 = by - (bx - (bx & 1)) / 2;
  const dq = q1 - q2;
  const dr = ax - bx;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
}

export type MoodPart = { text: string; amount: number };

type MoodContext = {
  cov: Map<ServiceId, Set<string>>;
  needed: { id: ServiceId; title: string; emoji: string }[];
  where: Map<string, Plot[]>; // building id → plots
  land: Map<string, number>; // home id → land value
  fill: Map<string, number>; // venue id → how full (0–1)
};

function moodContext(z: Game): MoodContext {
  const cov = coverage(z);
  const needed = needStatus(z, cov)
    .filter((n) => n.service.hurts === "happiness")
    .map((n) => ({ id: n.service.id, title: n.service.title, emoji: n.service.emoji }));
  const where = new Map<string, Plot[]>();
  for (const row of z.plots) {
    for (const p of row) {
      const id = builtId(p);
      if (!id) continue;
      if (!where.has(id)) where.set(id, []);
      where.get(id)!.push(p);
    }
  }
  const fill = new Map<string, number>();
  for (const [id, w] of workforce(z)) if (isVenue(plotById(z, id))) fill.set(id, w.output);
  return { cov, needed, where, land: new Map(), fill };
}

/** Why a person's mood differs from the town's baseline. */
export function moodParts(p: Person, z: Game, ctx = moodContext(z)): MoodPart[] {
  const parts: MoodPart[] = [];
  const home = p.home ? plotById(z, p.home) : undefined;
  if (home) {
    let lv = ctx.land.get(home.id);
    if (lv == null) {
      lv = landValue(home.x, home.y, z).value;
      ctx.land.set(home.id, lv);
    }
    const land = landMood(lv);
    if (land) parts.push({ text: land > 0 ? "Lives on good land" : "Lives on poor land", amount: land });
    for (const s of ctx.needed) {
      if (!ctx.cov.get(s.id)!.has(home.id)) parts.push({ text: `No ${s.title.toLowerCase()} nearby ${s.emoji}`, amount: MOOD.missingService });
    }
    const spots = ctx.where.get(p.fav) ?? [];
    if (spots.length) {
      const d = Math.min(...spots.map((s) => hexDistance(home.x, home.y, s.x, s.y)));
      const title = options.find((o) => o.id === p.fav)?.title.toLowerCase() ?? p.fav;
      if (POLLUTERS[p.fav]) {
        parts.push(d >= 3 && d <= 6 ? { text: `Can watch the ${title} from home`, amount: MOOD.favFar } : { text: `Has a ${title} in town`, amount: MOOD.favInTown });
      } else if (d <= 2) parts.push({ text: `Their favourite ${title} is next door`, amount: MOOD.favNear });
      else if (d <= 4) parts.push({ text: `Their favourite ${title} is close by`, amount: MOOD.favClose });
      else parts.push({ text: `Has a ${title} in town`, amount: MOOD.favInTown });
    }
  }
  if (isRetired(p, z)) {
    const venue = p.job ? plotById(z, p.job) : undefined;
    if (venue && isVenue(venue)) parts.push({ text: `Spends their days at the ${options[venue.type].title.toLowerCase()}`, amount: RETIREE_MOOD.member });
    else parts.push({ text: "Bored in retirement", amount: RETIREE_MOOD.idle });
  }
  if (home) {
    const clubs = ctx.where.get("social_club") ?? [];
    const near = clubs.find((c) => hexDistance(home.x, home.y, c.x, c.y) <= VENUE.social_club.reach);
    if (near) {
      const fill = ctx.fill.get(near.id) ?? 0;
      if (fill > 0) parts.push({ text: "A lively social club nearby", amount: VENUE.social_club.mood * fill });
    }
  }
  if (p.job === null && canWork(p, z)) parts.push({ text: "Out of work", amount: MOOD.jobless });
  else if (worksDream(p, z)) parts.push({ text: "Works their dream job", amount: MOOD.dreamJob });
  const years = Math.floor((z.environment.day - p.arrived) / GAME_YEAR);
  if (years > 0) parts.push({ text: `Has roots here (${years} yr)`, amount: Math.min(MOOD.rootsMax, years * MOOD.rootsPerYear) });
  return parts;
}

/**
 * Weekly: works out everyone's mood offset and sets town happiness to the
 * baseline plus the average offset (option B in #64).
 */
export function updateMoods(z: Game): void {
  const people = z.people ?? [];
  const ctx = moodContext(z);
  let sum = 0;
  for (const p of people) {
    p.mood = Math.round(moodParts(p, z, ctx).reduce((s, m) => s + m.amount, 0) * 10) / 10;
    sum += p.mood;
  }
  const avg = people.length ? sum / people.length : 0;
  z.moodAverage = avg;
}

/** A person's mood in happiness points (town baseline + their offset). */
export function personMood(p: Person, z: Game): number {
  return (z.moodBase ?? z.townInfo.happiness) + p.mood;
}

export function moodFace(m: number): string {
  if (m >= 180) return "😄";
  if (m >= 140) return "🙂";
  if (m >= 100) return "😐";
  if (m >= 60) return "🙁";
  return "😠";
}

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

export const EDU_LEVELS = ["No schooling", "Basic", "Skilled", "Scholar"];
const EDU_SCHOOL_WEEKLY = 0.02; // ~1 level a year with a school nearby
const EDU_LIBRARY_WEEKLY = 0.005;

/** Weekly: people near a school (or a library) learn. */
export function updateEducation(z: Game) {
  const cov = coverage(z);
  const school = cov.get("school")!;
  const libraries = (z.plots.flat().filter((p) => builtId(p) === "library"));
  const venues = z.plots.flat().filter((p) => builtId(p) && isVenue(p));
  const staff = workforce(z);
  for (const p of z.people ?? []) {
    if (!p.home || p.edu >= 3) continue;
    let gain = 0;
    // Children learn fastest.
    if (school.has(p.home)) gain += EDU_SCHOOL_WEEKLY * (stageOf(p, z) === "child" ? 2.5 : 1);
    const home = plotById(z, p.home);
    if (home && libraries.some((l) => hexDistance(home.x, home.y, l.x, l.y) <= 3)) gain += EDU_LIBRARY_WEEKLY;
    // Retirees teaching: storytellers for children, the craft guild for adults.
    if (home) {
      const stage = stageOf(p, z);
      for (const v of venues) {
        const id = options[v.type].id;
        const fill = staff.get(v.id)?.output ?? 0;
        if (!fill) continue;
        const d = hexDistance(home.x, home.y, v.x, v.y);
        if (id === "storyteller" && stage === "child" && d <= VENUE.storyteller.reach) gain += VENUE.storyteller.childLearning * fill;
        if (id === "craft_guild" && stage === "adult" && d <= VENUE.craft_guild.reach && p.edu < VENUE.craft_guild.maxEdu) gain += VENUE.craft_guild.adultLearning * fill;
      }
    }
    p.edu = Math.min(3, Math.round((p.edu + gain) * 1000) / 1000);
  }
}

/** Knowledge multiplier from the town's average education (1 = nobody schooled). */
export function educationBoost(z: Game): number {
  const people = z.people ?? [];
  if (!people.length) return 1;
  return 1 + 0.25 * (people.reduce((s, p) => s + p.edu, 0) / people.length);
}

// ---------------------------------------------------------------------------
// Wishes
// ---------------------------------------------------------------------------

export type Wish = { text: string; count: number };

/** What the town's people want most: dream jobs with no openings, favourite places that aren't near. */
export function wishes(z: Game, limit = 3): Wish[] {
  const people = z.people ?? [];
  const dreams = new Map<string, number>();
  for (const p of people) if (!worksDream(p, z)) dreams.set(p.dream, (dreams.get(p.dream) ?? 0) + 1);
  const favs = new Map<string, number>();
  const ctx = moodContext(z);
  for (const p of people) {
    const home = p.home ? plotById(z, p.home) : undefined;
    if (!home || POLLUTERS[p.fav]) continue;
    const spots = ctx.where.get(p.fav) ?? [];
    const d = spots.length ? Math.min(...spots.map((s) => hexDistance(home.x, home.y, s.x, s.y))) : 99;
    if (d > 4) favs.set(p.fav, (favs.get(p.fav) ?? 0) + 1);
  }
  const list: Wish[] = [];
  for (const [id, n] of dreams) {
    const c = CAREERS.find((c) => c.id === id)!;
    const t = c.title.toLowerCase();
    list.push({ text: `${c.emoji} ${n} dream of being ${/^[aeiou]/.test(t) ? "an" : "a"} ${t}`, count: n });
  }
  for (const [id, n] of favs) {
    const o = options.find((o) => o.id === id)!;
    list.push({ text: `${o.emoji} ${n} wish a ${o.title.toLowerCase()} was near home`, count: n });
  }
  return list.sort((a, b) => b.count - a.count).slice(0, limit);
}

const CHILD_APPETITE = 0.6;
/** Sum of everyone's appetite (1 per average person). */
export function townAppetite(z: Game): number {
  if (!z.people) return z.townInfo.population_count;
  return z.people.reduce((s, p) => s + p.appetite * (stageOf(p, z) === "child" ? CHILD_APPETITE : 1), 0);
}

/** The biggest reasons the town's moods differ from the baseline, added up. */
export function moodSummary(z: Game, limit = 4): MoodPart[] {
  const people = z.people ?? [];
  if (!people.length) return [];
  const ctx = moodContext(z);
  const totals = new Map<string, number>();
  for (const p of people) {
    for (const part of moodParts(p, z, ctx)) {
      const key = part.text.startsWith("Their favourite") || part.text.startsWith("Has a") || part.text.startsWith("Can watch")
        ? "Favourite places nearby"
        : part.text.startsWith("Has roots") ? "Long-time residents" : part.text;
      totals.set(key, (totals.get(key) ?? 0) + part.amount);
    }
  }
  return [...totals.entries()]
    .map(([text, sum]) => ({ text, amount: sum / people.length }))
    .filter((p) => Math.abs(p.amount) >= 0.5)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Life: births and deaths (#65)
// ---------------------------------------------------------------------------

/** Weekly chance an adult aged 20–45 has a child, when their home has room. */
const BIRTH_CHANCE = 0.006;
/** Yearly chance of dying at 65; it rises steeply with age. */
const DEATH_AT_65 = 0.01;
const WEEKS_PER_AGE_YEAR = DAYS_PER_AGE_YEAR / 7;

/** Weekly: babies are born into homes with room; the old pass away. */
export function lifeEvents(z: Game): { born: Person[]; died: Person[] } {
  const people = z.people ?? [];
  const born: Person[] = [];
  const died: Person[] = [];
  const cap = new Map<string, number>();
  for (const row of z.plots) for (const pl of row) { const c = capacityOf(pl); if (c) cap.set(pl.id, c); }
  const used = new Map<string, number>();
  for (const p of people) if (p.home) used.set(p.home, (used.get(p.home) ?? 0) + 1);
  const cov = coverage(z);
  const health = z.townInfo.health;
  const healthFactor = health < 100 ? 1.5 : health > 200 ? 0.75 : 1;
  for (const p of people) {
    const age = ageOf(p, z);
    if (age >= ELDER_AGE) {
      let yearly = DEATH_AT_65 * Math.exp((age - ELDER_AGE) / 6);
      yearly *= healthFactor * (p.home && cov.get("health")!.has(p.home) ? 0.8 : 1);
      if (isMember(p, z)) yearly *= MEMBER_DEATH_FACTOR;
      if (Math.random() < yearly / WEEKS_PER_AGE_YEAR) died.push(p);
    } else if (age >= 20 && age <= 45 && p.home && Math.random() < BIRTH_CHANCE) {
      // The baby lives with the family, or with relatives if there's no room.
      let home: string | undefined = (used.get(p.home) ?? 0) < (cap.get(p.home) ?? 0) ? p.home : undefined;
      if (!home) for (const [id, c] of cap) if ((used.get(id) ?? 0) < c) { home = id; break; }
      if (home) {
        const baby = newPerson(z, p);
        baby.home = home;
        born.push(baby);
        used.set(home, (used.get(home) ?? 0) + 1);
      }
    }
  }
  if (died.length) {
    const gone = new Set(died);
    z.people = people.filter((p) => !gone.has(p));
  }
  z.people!.push(...born);
  z.townInfo.population_count = z.people!.length;
  z.lifeStats = {
    births: (z.lifeStats?.births ?? 0) + born.length,
    deaths: (z.lifeStats?.deaths ?? 0) + died.length,
  };
  if (born.length || died.length) assignJobs(z);
  return { born, died };
}

/** Children, adults and elders in town. */
export function ageMix(z: Game): Record<Stage, number> {
  const mix: Record<Stage, number> = { child: 0, adult: 0, elder: 0 };
  for (const p of z.people ?? []) mix[stageOf(p, z)]++;
  return mix;
}

/** Share of restless people (they make the town bore faster). */
export function restlessShare(z: Game): number {
  const people = z.people ?? [];
  return people.length ? people.filter((p) => p.restless).length / people.length : 0;
}

// ---------------------------------------------------------------------------
// Requests (#65): one named townsperson at a time asks for something.
// ---------------------------------------------------------------------------

const REQUEST_WEEKS = 26;
const REQUEST_NEAR = 3; // tiles

export type RequestView = { person: Person; text: string; weeksLeft: number; reward: number };

function requestMet(z: Game, p: Person): boolean {
  const r = z.request!;
  if (r.kind === "job") return worksDream(p, z);
  const home = p.home ? plotById(z, p.home) : undefined;
  if (!home) return false;
  return z.plots.some((row) => row.some((pl) => builtId(pl) === r.target && hexDistance(home.x, home.y, pl.x, pl.y) <= REQUEST_NEAR));
}

/** Weekly: settle the open request, or make a new one now and then. */
export function updateRequest(z: Game): { done?: string; expired?: string; reward?: number } {
  const people = z.people ?? [];
  const r = z.request;
  if (r) {
    const p = people.find((x) => x.id === r.personId);
    if (!p) {
      delete z.request;
      return {};
    }
    if (requestMet(z, p)) {
      delete z.request;
      z.townInfo.gold += r.reward;
      return { done: `🎁 ${p.name} is delighted: ${describe(r)} at last!`, reward: r.reward };
    }
    if (z.environment.day - r.since > REQUEST_WEEKS * 7) {
      delete z.request;
      return { expired: `😞 ${p.name} gave up waiting for ${describe(r)}.` };
    }
    return {};
  }
  if (people.length < 30 || (z.environment.day / 7) % 4 !== 0) return {};
  // Someone whose favourite place isn't near, or whose dream career has no opening.
  const ctx = moodContext(z);
  const candidates = people.filter((p) => {
    if (stageOf(p, z) === "child") return false;
    const home = p.home ? plotById(z, p.home) : undefined;
    if (!home || POLLUTERS[p.fav]) return false;
    const spots = ctx.where.get(p.fav) ?? [];
    return !spots.some((s) => hexDistance(home.x, home.y, s.x, s.y) <= REQUEST_NEAR);
  });
  const p = candidates[Math.floor(Math.random() * candidates.length)];
  if (p) {
    z.request = { personId: p.id, kind: "near", target: p.fav, since: z.environment.day, reward: 60 + 40 * Math.max(0, z.needsTier ?? 0) };
  }
  return {};
}

function describe(r: NonNullable<Game["request"]>): string {
  if (r.kind === "job") return `work as a ${CAREERS.find((c) => c.id === r.target)?.title.toLowerCase() ?? r.target}`;
  const o = options.find((o) => o.id === r.target);
  return `a ${o?.title.toLowerCase() ?? r.target} near home`;
}

export function currentRequest(z: Game): RequestView | null {
  const r = z.request;
  if (!r) return null;
  const person = (z.people ?? []).find((p) => p.id === r.personId);
  if (!person) return null;
  const o = options.find((o) => o.id === r.target);
  return {
    person,
    text: r.kind === "near" ? `wants a ${o?.emoji ?? ""} ${o?.title.toLowerCase()} within ${REQUEST_NEAR} tiles of home` : describe(r),
    weeksLeft: Math.max(0, REQUEST_WEEKS - Math.floor((z.environment.day - r.since) / 7)),
    reward: r.reward,
  };
}
