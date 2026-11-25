import { relieve, NOVELTY } from "./boredom";
import { get, writable, type Writable } from "svelte/store";
import { initFog, reveal } from "./fog";
import { default_db, default_user_db } from "./objects/defaults/default_DB";
import {
  type Difficulty,
  type EndGoal,
  type Game,
  type UserDatabase,
  type Plot,
  Events,
} from "./types";
import { rollBaseTolerance } from "./tax";
import { options } from "./objects/PlotTypeOptions";
import { analyticsEvent } from "./utils";
import { CustomAlerts } from "./objects/CustomAlerts";
import { generateRandomTownName } from "./objects/townNames";
import { resetMapUi } from "./ui";
import { syncCapacity } from "./housing";
import { placeSites } from "./sites";
import { syncPeople, assignJobs, workforce, migrateAges } from "./people";
import {
  generateTerrain,
  expandTerrain,
  type Cell,
  type Grid,
} from "./terrain";

// The active game DB is for the current game, challenge, or play-through.
//// This can get corrupted, so it is important to keep this separate from the user DB.
export const ACTIVE_GAME_DB_NAME = "plots_active_game_db";
// The user DB keeps track of progress, achievements,
//// challenge history, and such.
export const USER_DB_NAME = "plots_user_db";
// Set by gameShare.js when the page is opened with a ?shareId= link.
export const TEMP_GAME_DB_NAME = "plots_temp_game_db";

/** How long (ms) a disabled-resource warning can be snoozed for, in game days. */
export const SNOOZE_DAYS = 10;
/** Bulldozing within this many days of building undoes its one-time boost. */
const BULLDOZE_REVERSAL_DAYS = 30;
/** Days after "Keep playin'" during which the town can't lose again. */
export const LOSS_GRACE_DAYS = 90;
const SAVE_THROTTLE_MS = 1000;

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

// `?debug=true` wipes all saved data once, then removes itself from the URL so
// the game is playable afterwards.
if (new URLSearchParams(window.location.search).get("debug") === "true") {
  localStorage.clear();
  const url = new URL(window.location.href);
  url.searchParams.delete("debug");
  history.replaceState(null, "", url.toString());
}

/**
 * True when viewing someone else's shared town. In this mode nothing is
 * simulated or saved, so the player's own towns are never overwritten.
 */
export const isReadOnly = localStorage.getItem(TEMP_GAME_DB_NAME) != null;

function roundTo2(n: number) {
  return Math.round(n * 100) / 100;
}

function safeParse<T>(json: string | null): T | null {
  if (json == null || json === "") return null;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error("Failed to parse saved data", error);
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

/** Recursively fills in any keys missing from `target` using `defaults`. */
function fillDefaults<T>(target: any, defaults: T): T {
  if (!isPlainObject(target)) return structuredClone(defaults);
  for (const [key, defaultValue] of Object.entries(defaults as any)) {
    if (target[key] === undefined || target[key] === null) {
      if (defaultValue !== null) target[key] = structuredClone(defaultValue);
      else if (target[key] === undefined) target[key] = null;
    } else if (isPlainObject(defaultValue) && isPlainObject(target[key])) {
      fillDefaults(target[key], defaultValue);
    }
  }
  return target as T;
}

export function createDefaultGame(): Game {
  const game = structuredClone(default_db);
  game.gameId = Math.floor(Math.random() * 10_000_000_000);
  return game;
}

/**
 * Saves from before the ÷10 rescale (Nov 2026) hold 10× the gold and
 * resources the game now uses. Divides them once; returns whether it did.
 */
function migrateAmountScale(raw: any): boolean {
  if (!isPlainObject(raw) || raw.amountScale != null) return false;
  const div = (n: unknown) => (typeof n === "number" ? n / 10 : n);
  if (isPlainObject(raw.townInfo)) {
    raw.townInfo.gold = div(raw.townInfo.gold);
    raw.townInfo.knowledge_points = div(raw.townInfo.knowledge_points);
  }
  for (const group of ["resources", "resource_rate"]) {
    if (!isPlainObject(raw[group])) continue;
    for (const key of Object.keys(raw[group])) {
      raw[group][key] = div(raw[group][key]);
    }
  }
  raw.resource_capacity = div(raw.resource_capacity);
  if (isPlainObject(raw.economyAndLaws)) {
    raw.economyAndLaws.weeklyProfit = div(raw.economyAndLaws.weeklyProfit);
  }
  if (isPlainObject(raw.lab)) raw.lab.xp = div(raw.lab.xp);
  raw.amountScale = 10;
  return true;
}

/**
 * Upgrades a game loaded from storage (or a file) so it matches the current
 * shape of `Game`, and repairs state that can't be valid after a reload.
 */
export function normalizeGame(raw: any): Game | null {
  if (!isPlainObject(raw) || !isPlainObject(raw.townInfo)) return null;
  // Before fillDefaults, which would mark old saves as already converted.
  migrateAmountScale(raw);
  const game = fillDefaults<Game>(raw, default_db);

  for (const row of game.plots) {
    for (const plot of row) {
      // A plot only stays "disabled" while its warning dialog is open; that
      // dialog doesn't survive a reload, so let the next day re-check it.
      plot.disabled = false;
      // Plot `type` is an index into `options`, which can shift between
      // releases. `typeId` is the stable identifier, so re-derive from it.
      if (plot.active) {
        if (plot.typeId) {
          plot.type = options.findIndex((o) => o.id === plot.typeId);
        } else if (plot.type > -1 && options[plot.type]) {
          plot.typeId = options[plot.type].id;
        }
      }
    }
  }
  // The mineral deposit used to be its own flag; it's a special site now.
  for (const row of game.plots ?? []) {
    for (const p of row as any[]) {
      if (p.mineralSource) p.site = "mineral";
      delete p.mineralSource;
    }
  }
  // Towns from before special sites (#63) get them on their empty land.
  if (!game.sitesPlaced) {
    placeSites(game);
    game.sitesPlaced = true;
  }
  // Towns from before fog of war (#62): everything away from the town is unexplored.
  if (game.fog === undefined) initFog(game);
  // Older saves stored job openings here, which could exceed population.
  migrateAges(game);
  syncEmployment(game);
  // Older versions let a town keep playing after a loss with no further
  // loss checks. Treat that as the town's one continue, with a fresh grace
  // period so it isn't lost again immediately.
  if (game.overtime && game.endGameDetails.msg !== "") {
    game.endGameDetails = { msg: "", win: false, still_playing: true };
    game.lossGraceUntil = game.environment.day + LOSS_GRACE_DAYS;
  }
  return game;
}

function normalizeUserDB(raw: any): UserDatabase {
  const udb = fillDefaults<UserDatabase>(raw, default_user_db);
  if (!udb.username) udb.username = "click_to_set_username";
  if (!Array.isArray(udb.games)) udb.games = [];
  if (udb.selectedGame < 0 || udb.selectedGame >= udb.games.length) {
    udb.selectedGame = Math.max(0, udb.games.length - 1);
  }
  // Older versions gave every town made in one session the same gameId; the
  // UI is keyed on it, so make them unique.
  const seen = new Set<number>();
  udb.games = udb.games.map((json) => {
    const game = safeParse<Game>(json);
    if (!game) return json;
    // Town list entries show gold too, so convert them as well.
    const migrated = migrateAmountScale(game);
    if (!seen.has(game.gameId)) {
      seen.add(game.gameId);
      return migrated ? JSON.stringify(game) : json;
    }
    game.gameId = Math.floor(Math.random() * 10_000_000_000);
    seen.add(game.gameId);
    return JSON.stringify(game);
  });
  return udb;
}

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------

export const userDB = writable<UserDatabase>(
  normalizeUserDB(safeParse(localStorage.getItem(USER_DB_NAME))),
);

/**
 * The active town, or null when none is loaded (the start menu is shown).
 * Typed as `Game` because everything except App and this file only runs
 * while a town is loaded; code that can see the null case uses `getGame()`.
 */
function loadInitialGame(): Game | null {
  const shared = localStorage.getItem(TEMP_GAME_DB_NAME);
  if (shared) return normalizeGame(safeParse(shared));
  // No active town means the player is on the start menu.
  const active = localStorage.getItem(ACTIVE_GAME_DB_NAME);
  if (!active) return null;
  // Prefer the town list's copy (its gameId may have been de-duplicated);
  // both are kept in sync by flushSave.
  const udb = get(userDB);
  return normalizeGame(
    safeParse(udb.games[udb.selectedGame] ?? null) ?? safeParse(active),
  );
}

export const DB = writable<Game | null>(loadInitialGame()) as Writable<Game>;

export function getGame(): Game | null {
  return get(DB);
}

function clearGame() {
  (DB as Writable<Game | null>).set(null);
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

userDB.subscribe((udb) => {
  if (udb) localStorage.setItem(USER_DB_NAME, JSON.stringify(udb));
});

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Writes the active game to localStorage right away. */
export function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (isReadOnly) return;
  const game = getGame();
  if (!game) return;

  const serialized = JSON.stringify(game);
  localStorage.setItem(ACTIVE_GAME_DB_NAME, serialized);
  userDB.update((udb) => {
    if (udb.games.length === 0) udb.selectedGame = 0;
    udb.games[udb.selectedGame] = serialized;
    return udb;
  });
}

function cancelPendingSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
}

// The game state changes many times a second; batch writes so we serialize
// it at most once per SAVE_THROTTLE_MS.
DB.subscribe((game) => {
  if (!game || isReadOnly || saveTimer) return;
  saveTimer = setTimeout(flushSave, SAVE_THROTTLE_MS);
});

window.addEventListener("beforeunload", flushSave);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushSave();
});

// ---------------------------------------------------------------------------
// Game lifecycle
// ---------------------------------------------------------------------------

export function createPlot(
  x: number,
  y: number,
  water: boolean,
  site?: string,
  offMap = false,
): Plot {
  const plot: Plot = {
    id: Math.random().toString(36).substring(2, 9),
    active: false,
    x,
    y,
    type: water ? -9 : -1,
    typeId: "",
    water,
    disabled: false,
  };
  if (site) plot.site = site;
  if (offMap) plot.offMap = true;
  return plot;
}

function plotFromCell(x: number, y: number, cell: Cell): Plot {
  return createPlot(x, y, cell === "water", cell === "mineral" ? "mineral" : undefined, cell === "off");
}

function cellOf(plot: Plot): Cell {
  if (plot.offMap) return "off";
  if (plot.water) return "water";
  if (plot.site === "mineral") return "mineral";
  return "land";
}

/**
 * Generates a town's land: an irregular, connected landmass with lakes and a
 * mineral deposit, inside a grid a bit larger than `size` × `size`. The land
 * is roughly as much as a full `size` × `size` square used to give.
 */
export function generatePlots(size: number): Plot[][] {
  const box = Math.round(size * 1.3);
  const land = Math.round(size * size * (0.75 + Math.random() * 0.2));
  const grid = generateTerrain(box, box, land);
  return grid.map((row, i) => row.map((cell, j) => plotFromCell(i, j, cell)));
}

/**
 * Size of a new town's map, the same for every difficulty: about 25 (some
 * 530 tiles of land) with a random ±15% so some starts are roomier than
 * others. Fog of war makes a big first map worth exploring before you ever
 * expand. Difficulty comes from tax tolerance and penalties, not map size.
 */
export const MAP_SIZE = 25;
export function rollMapSize(): number {
  return Math.round(MAP_SIZE * (0.85 + Math.random() * 0.3));
}

export function startGame(
  difficulty: Difficulty,
  endGoal: EndGoal,
  townName: string,
  gameSettings: string[],
) {
  flushSave();
  const udb = get(userDB);

  const json = createDefaultGame();
  if (udb.username === "dev" && !gameSettings.includes("devMode")) {
    gameSettings.push("devMode");
  }
  json.gameSettings = gameSettings;
  json.economyAndLaws.max_tax_rate = rollBaseTolerance(parseInt(difficulty));
  json.endGoal = endGoal;
  // Remove symbols other than numbers and letters.
  townName = townName.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  json.townInfo.name = townName !== "" ? townName : generateRandomTownName();
  json.difficulty = parseInt(difficulty);

  if (gameSettings.includes("devMode")) {
    json.townInfo.gold = 100000000;
    json.townInfo.happiness = 10000000;
    json.townInfo.health = 1000000;
    json.townInfo.knowledge_points = 100000;
    json.modifiers.happiness = 10000;
    json.modifiers.health = 10000;
    json.resources.food = 1000000;
    json.resources.wood = 1000000;
    json.resources.stone = 1000000;
    json.resources.metal = 1000000;
  }

  json.plots = generatePlots(rollMapSize());
  placeSites(json);
  json.sitesPlaced = true;
  initFog(json);

  const serialized = JSON.stringify(json);
  localStorage.setItem(ACTIVE_GAME_DB_NAME, serialized);
  userDB.update((u) => {
    u.games.push(serialized);
    u.selectedGame = u.games.length - 1;
    return u;
  });

  analyticsEvent(json, Events.START_GAME, {
    difficulty: difficulty,
    end_goal: endGoal,
    settings: gameSettings.join(","),
  });

  location.reload();
}

/**
 * Closes per-town UI (build menu, plot warning, liege placement) without
 * acting on it. Called whenever the active town changes.
 */
function resetTownUi() {
  disabledPlotMenu.update((m) => ({ ...m, visible: false }));
  resetMapUi();
  settingLiegeLocation.set(false);
}

/** Leaves the current town (it stays in the town list) and shows the start menu. */
export function leaveToNewTown() {
  flushSave();
  resetTownUi();
  clearGame();
  localStorage.removeItem(ACTIVE_GAME_DB_NAME);
}

/** Replaces the active town with a loaded file. Returns false if invalid. */
export function loadGameFromFile(raw: unknown): boolean {
  const game = normalizeGame(raw);
  if (!game || !Array.isArray(game.plots) || game.plots.length === 0) {
    return false;
  }
  resetTownUi();
  DB.set(game);
  flushSave();
  return true;
}

export function setSelectedGame(index: number) {
  flushSave();
  resetTownUi();
  const udb = get(userDB);
  const game = normalizeGame(safeParse(udb.games[index] ?? null));
  userDB.update((u) => {
    u.selectedGame = index;
    return u;
  });
  if (game) {
    DB.set(game);
    localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(game));
  } else {
    clearGame();
    localStorage.removeItem(ACTIVE_GAME_DB_NAME);
  }
}

/** Deletes a town from the town list and switches to another one (if any). */
export function deleteGame(index: number) {
  // Don't let a pending save write the deleted town back into the list.
  cancelPendingSave();
  resetTownUi();
  userDB.update((u) => {
    u.games.splice(index, 1);
    u.selectedGame = 0;
    return u;
  });
  const udb = get(userDB);
  const next = normalizeGame(safeParse(udb.games[0] ?? null));
  if (next) DB.set(next);
  else clearGame();
  if (next) localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(next));
  else localStorage.removeItem(ACTIVE_GAME_DB_NAME);
}

export function setUserDB(z: UserDatabase) {
  userDB.set(z);
}

// ---------------------------------------------------------------------------
// Grid helpers
// ---------------------------------------------------------------------------


/**
 * Removes whatever is built on a plot and reverses its population and
 * employment effects. Mutates `z` without publishing it.
 */
export function clearPlot(x: number, y: number, z: Game) {
  const plot = z.plots[x][y];
  const oldPlotType = plot.type;
  const builtDay = plot.builtDay;
  const novelty = plot.novelty ?? 0;
  delete plot.novelty;
  plot.type = plot.water ? -9 : -1;
  plot.typeId = "";
  plot.active = false;
  plot.disabled = false;
  delete plot.snoozedUntil;
  delete plot.builtDay;
  delete plot.level;
  delete plot.levelProgress;

  const option = oldPlotType > -1 ? options[oldPlotType] : undefined;
  if (option) {
    // Residents of a demolished home move into any empty space elsewhere;
    // only those who don't fit leave town.
    syncCapacity(z);
    // Bulldozing a fresh building takes back its one-time boost, so
    // build/bulldoze loops can't farm happiness and health. After the boost
    // has had time to wear off, demolition has no side effects.
    if (
      builtDay != null &&
      z.environment.day - builtDay <= BULLDOZE_REVERSAL_DAYS
    ) {
      // ...and the boredom relief it gave.
      z.boredom = Math.min(100, (z.boredom ?? 0) + novelty);
      const info = z.townInfo;
      const change = option.immediate_variable_changes;
      info.happiness = Math.min(
        z.maximums.happiness,
        Math.max(0, info.happiness - change.happiness),
      );
      info.health = Math.min(
        z.maximums.health,
        Math.max(0, info.health - change.health),
      );
      const bought = option.purchase_effect_modifiers;
      for (const key of ["happiness", "health", "community"] as const) {
        z.modifiers[key] = roundTo2(z.modifiers[key] / bought[key]);
      }
    }
    z.plotCounts[oldPlotType] = (z.plotCounts[oldPlotType] ?? 0) - 1;
    syncEmployment(z);
  }

  z.lastChangeDay = z.environment.day;
}

/** Bulldozes a plot and publishes the change. */
export function reverseClear(x: number, y: number, z: Game) {
  clearPlot(x, y, z);
  DB.set(z);
}

export function hasPlotOfType(type: string, z: Game): Plot[] {
  const plotsOfType: Plot[] = [];
  for (const row of z.plots) {
    for (const plot of row) {
      if (plot == null || !plot.active || plot.type == null || plot.type < 0) {
        continue;
      }
      const option = options[plot.type];
      if (option && (option.id === type || option.type === type)) {
        plotsOfType.push(plot);
      }
    }
  }
  return plotsOfType;
}

/** Job openings: the workers every building needs, plus hired Guardians. */
export function countJobs(z: Game): number {
  let jobs = z.townInfo.guardians;
  for (const row of z.plots) {
    for (const plot of row) {
      // Places for retirees have members, not jobs.
      if (plot.active && plot.type > -1 && options[plot.type]?.type !== "retirement") {
        jobs += options[plot.type]?.requirements.employees ?? 0;
      }
    }
  }
  return jobs;
}

/** People in town who don't have a job. */
export function freeWorkers(z: Game): number {
  return Math.max(0, z.townInfo.population_count - countJobs(z));
}

/** People minus jobs: positive = free workers, negative = jobs unfilled. */
export function workerBalance(z: Game): number {
  return z.townInfo.population_count - countJobs(z);
}

export type Staffing = Map<string, { staffed: number; needed: number; output: number }>;

/** Who works where and how much they get done (people.ts). Keyed by plot id. */
export function staffing(z: Game): Staffing {
  return workforce(z);
}

/**
 * How much a building produces relative to being fully staffed by average
 * workers: dream-job workers push it above 1, missing workers below.
 */
export function staffRatio(map: Staffing, plot: Plot): number {
  const s = map.get(plot.id);
  return s && s.needed > 0 ? s.output : 1;
}

/** Keeps townspeople, their homes and jobs in step with the town. */
export function syncEmployment(z: Game) {
  syncPeople(z);
  assignJobs(z);
}

export function isLiegeOnPlot(x: number, y: number, z: Game) {
  return (
    z.liege_location != null &&
    z.liege_location[0] === x &&
    z.liege_location[1] === y
  );
}

export function requiredGuardiansForExpansion(z: Game) {
  return Math.round(Math.pow(1.7, z.kingdom_expansions + 5));
}

/** Adds 5 rows/columns in a direction. Returns an error message on failure. */
export function expandTown(z: Game, direction: string): string | undefined {
  const numRows = z.plots.length;
  const numCols = numRows > 0 ? z.plots[0].length : 0;
  const newCols = direction == "east" ? 5 : 0;
  const newRows = direction == "south" ? 5 : 0;

  const requiredGuardians = requiredGuardiansForExpansion(z);

  if (z.townInfo.guardians < requiredGuardians) {
    return `You need ${requiredGuardians - z.townInfo.guardians} more Guardians to expand the kingdom. See the City mgmt menu.`;
  }

  // Add the new area as off-map cells...
  for (let i = 0; i < numRows; i++) {
    for (let j = numCols; j < numCols + newCols; j++) {
      z.plots[i].push(createPlot(i, j, false, undefined, true));
    }
  }
  for (let i = numRows; i < numRows + newRows; i++) {
    const newRow: Plot[] = [];
    for (let j = 0; j < numCols + newCols; j++) {
      newRow.push(createPlot(i, j, false, undefined, true));
    }
    z.plots.push(newRow);
  }

  // ...then grow a new chunk of land into it from the existing land.
  const grid: Grid = z.plots.map((row) => row.map(cellOf));
  const side = direction === "east" ? numRows : numCols + newCols;
  const count = Math.round(5 * side * (0.55 + Math.random() * 0.2));
  const fresh: Plot[] = [];
  for (const [i, j] of expandTerrain(
    grid,
    direction === "east" ? "east" : "south",
    count,
  )) {
    z.plots[i][j] = plotFromCell(i, j, grid[i][j]);
    fresh.push(z.plots[i][j]);
  }
  // New land brings new special sites, and it's yours: no fog on it.
  placeSites(z, fresh);
  reveal(z, fresh);

  z.kingdom_expansions++;
  relieve(z, NOVELTY.expansion);

  DB.set(z);
}

export function setLiegeLocation(x: number, y: number, z: Game) {
  z.liege_location = [x, y];
  settingLiegeLocation.set(false);
  DB.set(z);
}

// ---------------------------------------------------------------------------
// UI state
// ---------------------------------------------------------------------------

export function toggleShowOnlyAffordable() {
  showOnlyAffordable.update((value) => {
    localStorage.setItem("showOnlyAffordable", String(!value));
    return !value;
  });
}

export const startGameMenu = writable({
  visible: false,
});

export const showTutorialStepConfetti = writable(false);
export const paused = writable(false);
// only when DB.environment.day is 1
export const showWelcome = writable(true);
export const showScoreboard = writable(false);
export const showKnowledgeMenu = writable(false);
export const showAchievementPopup = writable(false);
export const showLabMenu = writable(false);
export const settingLiegeLocation = writable(false);
export const showCityHallMenu = writable(false);

export const customAlertText = writable("");

/** Shows a message in the alert dialog. */
export function showAlert(message: string) {
  customAlertText.set(message);
}

/** Shows a one-time tip; it is never shown again for this player. */
export function showCustomAlert(alert: CustomAlerts | string) {
  const udb = get(userDB);
  if (udb.customAlertsShown.includes(alert as CustomAlerts)) return;
  userDB.update((u) => {
    u.customAlertsShown.push(alert as CustomAlerts);
    return u;
  });
  customAlertText.set(alert);
}

export const showCompletedAchievements = writable(
  localStorage.getItem("showCompletedAchievements") === "true",
);
export const showOnlyAffordable = writable(
  localStorage.getItem("showOnlyAffordable") === "true",
);
export const pauseMenuTab = writable(
  localStorage.getItem("pauseMenuTab") === "game" ? "game" : "achievements",
);
export const headerHeight = writable(250);
export const speed = writable(750);
export const disabledPlotMenu = writable({
  visible: false,
  gameId: 0, // the town the warning belongs to
  plotName: "",
  location: "",
  missingResources: [] as string[],
  plotCost: 0,
  x: 0,
  y: 0,
});

/**
 * Closes the "plot disabled" warning. The player either pays to snooze it, or
 * the plot is bulldozed (this is also what happens if the dialog is dismissed).
 * Safe to call more than once.
 */
export function resolveDisabledPlot(choice: "snooze" | "bulldoze") {
  const menu = get(disabledPlotMenu);
  if (!menu.visible) return;
  disabledPlotMenu.update((m) => ({ ...m, visible: false }));

  const game = getGame();
  const plot = game?.plots[menu.x]?.[menu.y];
  // Never act on a different town than the one that raised the warning.
  if (!game || !plot || game.gameId !== menu.gameId) return;

  if (choice === "snooze" && game.townInfo.gold >= menu.plotCost) {
    game.townInfo.gold -= menu.plotCost;
    plot.snoozedUntil = game.environment.day + SNOOZE_DAYS;
    plot.disabled = false;
  } else {
    clearPlot(menu.x, menu.y, game);
  }
  DB.set(game);
}
