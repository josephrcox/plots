// The game simulation. `simulateDay` advances a town by one day, running the
// daily / weekly / monthly / quarterly tasks in a fixed order.
//
// Each task takes the game, mutates it, and returns it. UI side effects
// (dialogs, confetti, achievements) go through the stores in ./store.

import { get } from "svelte/store";
import {
  DB,
  getGame,
  hasPlotOfType,
  userDB,
  paused,
  showAchievementPopup,
  showTutorialStepConfetti,
  showAlert,
  isLiegeOnPlot,
  disabledPlotMenu,
  showCityHallMenu,
  isReadOnly,
  syncEmployment,
  staffing,
  staffRatio,
} from "./store";
// @ts-ignore
import { messages } from "./objects/TownLogMessages.js";
import { options } from "./objects/PlotTypeOptions";
import { achievements } from "./objects/AchievementList";
import { tutorialMessages } from "./objects/tutorial_messages";
import { isAdjacentToWater, randomizeNumber, roundTo } from "./utils";
import { synergyAt } from "./neighbours";
import { townHomeEffect, updatePollution } from "./land";
import { updateNeeds } from "./needs";
import { weeklyArrivals, homeOccupancy } from "./migration";
import { updateHomeLevels, syncCapacity } from "./housing";
import { laws } from "./objects/Laws";
import { taxMood, taxTolerance } from "./tax";
import { type Game, type Plot, type PlotOption, Vibe } from "./types";
import { townPeopleNames, townPeopleJobsHobbies } from "./objects/townPeople";

type StoredResource = "food" | "wood" | "stone" | "metal" | "bureaucracy";
type ResourceSnapshot = Record<StoredResource | "power", number>;

const MIDPOINT = 150;
/** Food each townsperson eats per week. */
export const FOOD_PER_PERSON = 0.1;
/** Share of stored food that spoils each week. */
export const FOOD_SPOILAGE = 0.05;
/** Weeks of food in store that make the town "well fed". */
export const WELL_FED_WEEKS = 4;
/** Weekly happiness and health boost while well fed. */
const WELL_FED_BONUS = 0.5;
// Boosts to positive income and to resource production. Casual is the
// forgiving mode; normal games get a smaller boost so early growth isn't a
// slog.
const PROFIT_BOOST = { casual: 3, normal: 1.25 };
const VILLAGE_INN_SHOP_BOOST = 1.2;
/** Weekly household tax per resident at a 100% rate (scaled by tax rate). */
const HOUSEHOLD_TAX_BASE = 0.5;
const RESOURCE_BOOST = { casual: 1.5, normal: 1.1 };
const POWER_SHORTAGE_MSG =
  "🔋 POWER SHORTAGE. HAPPINESS DROPPING THROUGH BLACKOUTS.";
const NOT_ENOUGH_FOOD_MSG = "There isn't enough food for everyone!";

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

/** Whether the clock should advance today, given the game and UI state. */
export function canAdvanceDay(game: Game | null): game is Game {
  if (!game || isReadOnly) return false;
  if (get(paused) || get(disabledPlotMenu).visible || get(showCityHallMenu)) {
    return false;
  }
  if (game.endGameDetails.msg !== "") return false;
  // The town doesn't start until the first homes are built.
  if (game.townInfo.population_count <= 0) return false;
  return true;
}

export function simulateDay(db: Game): Game {
  db.tick++;
  db.environment.day += 1;

  if (db.environment.day % 7 === 0) db = performWeeklyTasks(db);
  if (db.environment.day % 30 === 0) db = performMonthlyTasks(db);
  if (db.environment.day % 90 === 0) db = performQuarterlyTasks(db);

  return performDailyTasks(db);
}

function performWeeklyTasks(db: Game) {
  db = taxRateEffects(db);
  db = healthEffects(db);
  db = checkSpecialPlots(db);
  db = adjustKnowledgeGoldMarketRates(db);
  db = bringModifiersBackToNormal(db);
  db = warnUser(db);
  const startResources = snapshotResources(db);
  db = generateResources(db);
  db = lawEffects(db);
  db = calculatePower(db);
  db = calculateKnowledge(db);
  db = bringStatsBackToNormal(db);
  db = neighbourEffects(db);
  db = townNeedsEffects(db);
  db = feedCitizens(db);
  db = moveIn(db);
  db = levelHomes(db);
  const endResources = snapshotResources(db);
  if (db.environment.day % 14 === 0) {
    // Biweekly tasks
    db = applyModifiers(db);
  }
  return calculateResourceRates(db, startResources, endResources);
}

function performMonthlyTasks(db: Game) {
  db = reactToProductivity(db);
  db = listenToTownspeople(db);
  return db;
}

function performQuarterlyTasks(db: Game) {
  return movePeopleInMovePeopleOut(db);
}

function performDailyTasks(db: Game) {
  db = handleActiveCosts(db);
  db = calculateProfits(db);
  db = fixVariables(db);
  db = checkExperiment(db);
  db = countRecreation(db);
  db = adjustForStockpile(db);
  db = cleanUpTownLog(db);
  db = fixEmployment(db);

  db = checkGameLost(db);
  db = setTutorialStep(db);
  db = checkForAchievements(db);
  return db;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Calls `fn` for every built plot with its option. */
function forEachBuiltPlot(
  z: Game,
  fn: (plot: Plot, option: PlotOption, x: number, y: number) => void,
) {
  for (let i = 0; i < z.plots.length; i++) {
    for (let j = 0; j < z.plots[i].length; j++) {
      const plot = z.plots[i][j];
      if (!plot.active || plot.type < 0) continue;
      const option = options[plot.type];
      if (option) fn(plot, option, i, j);
    }
  }
}

function snapshotResources(z: Game): ResourceSnapshot {
  const { food, wood, stone, metal, bureaucracy, power } = z.resources;
  return { food, wood, stone, metal, bureaucracy, power };
}

function addToTownLog(message: string, z: Game, vibe: Vibe) {
  z.townLog = z.townLog || [];
  // If the message is already in the log, don't add it again.
  if (z.townLog.some((log) => log.message === message)) return z;
  z.townLog.unshift({ message, day: z.environment.day, vibe });
  return z;
}

function removeFromTownLog(z: Game, includes: string) {
  z.townLog = z.townLog.filter((log) => !log.message.includes(includes));
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function finiteOr(n: number, fallback: number) {
  return Number.isFinite(n) ? n : fallback;
}

/** Slider productivity → resource generation multiplier. */
export function productivityResourceMultiplier(productivity: number) {
  if (productivity < 50) return 0.5;
  if (productivity < 100) return 0.75;
  if (productivity === 100) return 1;
  if (productivity <= 125) return 1.25;
  if (productivity <= 150) return 1.75;
  if (productivity <= 175) return 3;
  return 5;
}

/** Slider productivity → monthly happiness multiplier. */
export function productivityHappinessMultiplier(productivity: number) {
  if (productivity < 50) return 1.3;
  if (productivity < 100) return 1.05; // Happy citizens
  if (productivity === 100) return 1;
  if (productivity <= 125) return 0.95;
  if (productivity <= 150) return 0.9;
  if (productivity <= 175) return 0.85;
  return 0.75; // Extremely upset
}

// ---------------------------------------------------------------------------
// Daily tasks
// ---------------------------------------------------------------------------

function handleActiveCosts(z: Game) {
  // Only one plot can be flagged per day; the game pauses while the player
  // decides, and any other struggling plots are re-checked the next day.
  let flaggedPlot = false;

  forEachBuiltPlot(z, (plot, option, i, j) => {
    // TODO: residential costs are more complex because businesses can't
    // operate without the people living there.
    if (option.type === "residential" || plot.disabled) return;

    const isSnoozed =
      plot.snoozedUntil != null && z.environment.day <= plot.snoozedUntil;

    const missingResources: string[] = [];
    const dailyCosts: [StoredResource, number][] = [];
    for (const [resource, weeklyCost] of Object.entries(option.active_costs)) {
      if (resource === "power" || !weeklyCost) continue;
      const required = weeklyCost / 7;
      if (resource === "gold") {
        // Gold upkeep is taken out of the plot's revenue in getProfit.
        if (z.townInfo.gold < required) {
          missingResources.push(
            `💰${roundTo(required - z.townInfo.gold, 2)} gold`,
          );
        }
        continue;
      }
      const key = resource as StoredResource;
      if (z.resources[key] < required) {
        missingResources.push(
          `${roundTo(required - z.resources[key], 2)} ${resource}`,
        );
      } else {
        dailyCosts.push([key, required]);
      }
    }

    if (missingResources.length === 0) {
      if (!isSnoozed) {
        for (const [key, amount] of dailyCosts) z.resources[key] -= amount;
      }
      return;
    }

    if (isSnoozed || flaggedPlot) return;
    flaggedPlot = true;
    plot.disabled = true;
    disabledPlotMenu.set({
      visible: true,
      gameId: z.gameId,
      plotName: option.title,
      location: `at (${j}, ${i})`,
      missingResources,
      plotCost: option.requirements.gold,
      x: i,
      y: j,
    });
  });
  return z;
}

function getProfit(
  z: Game,
  option: PlotOption,
  x: number,
  y: number,
  villageInnCount: number,
  staffed = 1,
) {
  // Profit is revenue * tax rate * percentage of population out of the max population
  let profitModifiers = clamp(z.townInfo.happiness / 100, 0.75, 2.0);

  if (z.townInfo.community > 150) {
    profitModifiers *= 1.1;
  } else if (z.townInfo.community < 100) {
    profitModifiers *= 0.8;
  }

  if (option.type === "shop" && villageInnCount > 0) {
    // Each inn adds 20%, compounding: 1 → ×1.2, 2 → ×1.44, 5 → ×2.49.
    profitModifiers *= Math.pow(VILLAGE_INN_SHOP_BOOST, villageInnCount);
  }

  if (isLiegeOnPlot(x, y, z)) {
    profitModifiers *= 1.5;
  }

  profitModifiers *= synergyAt(x, y, z).income;

  const occupancy =
    z.townInfo.population_max > 0
      ? z.townInfo.population_count / z.townInfo.population_max
      : 0;
  // The Tax-Free Month law suspends all tax revenue.
  const taxRate = z.economyAndLaws.enacted.includes("tax_free")
    ? 0
    : z.economyAndLaws.tax_rate;

  // Understaffed buildings earn their staffed share; upkeep is paid in full.
  return (
    option.revenue_per_week * staffed * taxRate * occupancy * profitModifiers -
    option.active_costs.gold
  );
}

/** Weekly household tax paid by the town's residents. */
export function residentTax(z: Game): number {
  if (z.economyAndLaws.enacted.includes("tax_free")) return 0;
  const boost = z.gameSettings.includes("casual") ? PROFIT_BOOST.casual : PROFIT_BOOST.normal;
  return z.townInfo.population_count * HOUSEHOLD_TAX_BASE * z.economyAndLaws.tax_rate * boost;
}

function calculateProfits(z: Game) {
  z.economyAndLaws.weeklyProfit = 0;
  const villageInnCount = hasPlotOfType("village_inn", z).length;
  const profitBoost = z.gameSettings.includes("casual")
    ? PROFIT_BOOST.casual
    : PROFIT_BOOST.normal;

  const staff = staffing(z);
  forEachBuiltPlot(z, (plot, option, i, j) => {
    // Productivity doesn't scale gold directly: pushing it up yields more
    // resources but unhappier townspeople, who pay less (see getProfit).
    let profit =
      getProfit(z, option, i, j, villageInnCount, staffRatio(staff, plot)) / 7;
    if (profit > 0) profit *= profitBoost;
    if (isAdjacentToWater(i, j, z)) profit *= 2;
    z.townInfo.gold += profit;
    z.economyAndLaws.weeklyProfit += profit * 7;
  });
  // Residents pay household tax.
  const residents = residentTax(z) / 7;
  z.townInfo.gold += residents;
  z.economyAndLaws.weeklyProfit += residents * 7;
  return z;
}

export function fixVariables(z: Game) {
  const info = z.townInfo;
  // Guard against NaN/Infinity creeping into the save.
  for (const key of Object.keys(info) as (keyof typeof info)[]) {
    if (typeof info[key] === "number") {
      (info as any)[key] = finiteOr(info[key] as number, 0);
    }
  }
  for (const key of Object.keys(z.resources) as (keyof Game["resources"])[]) {
    // Daily upkeep is weekly cost / 7, so round away float noise. Laws can
    // subtract more than is stored; stock can't go below zero (power is a
    // net balance and can).
    const value = roundTo(finiteOr(z.resources[key], 0), 3);
    z.resources[key] = key === "power" ? value : Math.max(0, value);
  }

  info.happiness = Math.max(0, info.happiness);
  info.health = Math.max(0, info.health);
  info.community = Math.max(0, info.community);
  info.gold = Math.max(0, info.gold);
  info.employees = Math.max(0, info.employees);
  info.knowledge_points = Math.max(0, info.knowledge_points);
  info.population_count = Math.max(0, info.population_count);

  z.economyAndLaws.weeklyProfit = roundTo(z.economyAndLaws.weeklyProfit, 2);
  if (info.employees > info.population_count) {
    info.employees = info.population_count;
  }

  // Amounts are small (a farm earns well under 1 gold a day), so keep
  // fractions; the UI rounds for display.
  info.gold = roundTo(info.gold, 3);
  info.population_count = roundTo(info.population_count, 0);
  info.employees = roundTo(info.employees, 0);
  info.population_max = roundTo(info.population_max, 0);
  info.happiness = roundTo(info.happiness, 2);
  info.health = roundTo(info.health, 2);
  info.knowledge_points = roundTo(info.knowledge_points, 3);

  info.happiness = Math.min(info.happiness, z.maximums.happiness);
  info.health = Math.min(info.health, z.maximums.health);
  info.community = Math.min(info.community, 300);

  z.modifiers.happiness = clamp(finiteOr(z.modifiers.happiness, 1), 0.5, 2);
  z.modifiers.health = clamp(finiteOr(z.modifiers.health, 1), 0.5, 2);
  z.modifiers.community = clamp(finiteOr(z.modifiers.community, 1), 0.5, 2);

  for (const row of z.plots) {
    for (const plot of row) {
      if (!plot.active && plot.disabled) plot.disabled = false;
    }
  }
  return z;
}

function checkExperiment(z: Game) {
  const active = z.lab.active_experiment;
  if (active && active.duration > 0) active.duration -= 1;
  return z;
}

function countRecreationPlots(z: Game) {
  let recreation = 0;
  let total = 0;
  forEachBuiltPlot(z, (_plot, option) => {
    total++;
    if (option.type === "recreation" || option.type === "shop") recreation++;
  });
  return { recreation, total };
}

function countRecreation(z: Game) {
  z.townInfo.recreation = countRecreationPlots(z).recreation;
  return z;
}

function adjustForStockpile(z: Game) {
  if (z.gameSettings.includes("bagOfHolding")) {
    z.resource_capacity = 972024000;
    return z;
  }
  const stockpiles = hasPlotOfType("stockpile", z).length;
  const advStockpiles = hasPlotOfType("adv_stockpile", z).length;
  const capacity = 200 + stockpiles * 300 + advStockpiles * 1200;
  z.resource_capacity = capacity;

  for (const key of Object.keys(z.resources) as (keyof Game["resources"])[]) {
    if (z.resources[key] > capacity) z.resources[key] = capacity;
  }
  return z;
}

function cleanUpTownLog(z: Game) {
  // Unemployment no longer has a penalty or a notice; clear old notices
  // from saves made before that change.
  removeFromTownLog(z, "people can't find jobs");
  return z;
}

function fixEmployment(z: Game) {
  syncEmployment(z);
  return z;
}

function checkGameLost(z: Game) {
  const info = z.townInfo;
  // After "Keep playin'", the town gets a grace period to recover.
  if (z.lossGraceUntil != null && z.environment.day <= z.lossGraceUntil) {
    return z;
  }
  if (
    z.gameSettings.includes("tomPetty") &&
    !z.tomPettyUsed &&
    (info.happiness <= 3 || info.health <= 3)
  ) {
    z.tomPettyUsed = true;
    info.happiness = 300;
    z.modifiers.happiness = 1;
    info.health = 300;
    z.modifiers.health = 1;
    info.gold = roundTo(info.gold * 0.5, 2);
    showAlert(
      "Since you are playing in Tom Petty mode, you have been given another chance. All it took was 50% of your gold. This only works once, so good luck!",
    );
    return z;
  }

  if (info.happiness <= 3) {
    info.happiness = 0;
    z.endGameDetails = {
      msg: messages.happiness_zero,
      win: false,
      still_playing: false,
    };
  }
  if (info.health <= 3) {
    info.health = 3;
    z.endGameDetails = {
      msg: messages.health_zero,
      win: false,
      still_playing: false,
    };
  }
  if (info.population_count <= 0 && info.population_max > 0) {
    info.population_count = 0;
    z.endGameDetails = {
      msg: messages.population_zero,
      win: false,
      still_playing: false,
    };
  }
  return z;
}

let tutorialRewardPending = false;

function setTutorialStep(z: Game) {
  const stepIndex = z.currentTutorialStep;
  const step = tutorialMessages[stepIndex];
  if (tutorialRewardPending || !step || !step.isComplete(z)) return z;

  // Award now, then advance after the confetti has played on this milestone.
  tutorialRewardPending = true;
  z.townInfo.gold += step.goldReward;
  showTutorialStepConfetti.set(true);
  const gameId = z.gameId;
  setTimeout(() => {
    showTutorialStepConfetti.set(false);
    tutorialRewardPending = false;
    if (!getGame()) return;
    DB.update((game) => {
      if (game.gameId === gameId && game.currentTutorialStep === stepIndex) {
        game.currentTutorialStep++;
      }
      return game;
    });
  }, 2000);
  return z;
}

function checkForAchievements(z: Game) {
  if (z.gameSettings.includes("devMode")) return z;

  const earned = new Set(get(userDB).achievements.map((a) => a[0]));
  const newlyEarned = achievements.filter(
    (a) => !earned.has(a.id) && a.check(z),
  );
  if (newlyEarned.length === 0) return z;

  userDB.update((udb) => {
    for (const a of newlyEarned) {
      udb.achievements.push([a.id, z.environment.day, z.townInfo.name]);
    }
    return udb;
  });
  paused.set(true);
  showAchievementPopup.set(true);
  return z;
}

// ---------------------------------------------------------------------------
// Weekly tasks
// ---------------------------------------------------------------------------

function taxRateEffects(z: Game) {
  if (z.townInfo.population_count <= 0) return z;
  const mood = taxMood(z);
  z.townInfo.happiness += mood.happiness;
  removeFromTownLog(z, "TAXES:");
  if (mood.level === "bad") {
    z = addToTownLog(`TAXES: ${mood.word}. ${mood.hint}.`, z, Vibe.BAD);
  }
  return z;
}

function healthEffects(z: Game) {
  const health = z.townInfo.health;
  if (health > 50 || health >= Math.random() * 50) return z;

  let peopleLeaving: number;
  if (health < 25) {
    z = addToTownLog(messages.sickAndDying, z, Vibe.BAD);
    z.townInfo.happiness -= 10;
    peopleLeaving = Math.round(z.townInfo.population_count * 0.1);
  } else {
    z = addToTownLog(messages.sickAndLeaving, z, Vibe.BAD);
    z.townInfo.happiness -= 5;
    peopleLeaving = Math.round(z.townInfo.population_count * 0.05);
  }
  z.townInfo.population_count -= peopleLeaving;
  syncEmployment(z);
  return z;
}

function checkSpecialPlots(z: Game) {
  z.hasBank = hasPlotOfType("bank", z).length > 0;
  z.hasCityHall = hasPlotOfType("city_hall", z).length > 0;
  z.hasHospital =
    hasPlotOfType("small_hospital", z).length > 0 ||
    hasPlotOfType("large_hospital", z).length > 0;
  z.hasLab = hasPlotOfType("lab", z).length > 0;
  return z;
}

function adjustKnowledgeGoldMarketRates(z: Game) {
  const rates = z.economyAndLaws.knowledge_gold_market_rates;
  let currentRate = rates[rates.length - 1] || 1;
  const lowerLimit = -100;
  const maxJump = 8;
  const maxChange = 3;

  const changeAmount = Math.random() * maxChange;
  const delta = Math.random() < 0.4 ? Math.random() * maxJump : changeAmount;
  currentRate += Math.random() < 0.5 ? delta : -delta;

  if (currentRate < lowerLimit) {
    currentRate += (Math.random() * changeAmount) / 5;
  }

  z.economyAndLaws.knowledge_gold_market_rates = [
    ...rates,
    Math.round(currentRate),
  ];
  return z;
}

function bringModifiersBackToNormal(z: Game) {
  // Weekly, modifiers drift back toward 1.0. Boosts wear off at `decay`;
  // penalties (famine, high taxes, blackouts) recover more slowly, so they
  // still hurt but don't stay forever once the cause is fixed.
  const decay = 0.3;
  const recovery = 0.15;
  const settle = (value: number, rate: number) => {
    const next = value + (1.0 - value) * rate;
    // Snap small leftover boosts to 1.0. Penalties aren't snapped, so a
    // steady small one (e.g. over-taxing) still holds the modifier down.
    if (value > 1.0 && next < 1.02) return 1.0;
    return next;
  };
  const rateFor = (value: number) => (value > 1.0 ? decay : recovery);

  z.modifiers.happiness = settle(
    z.modifiers.happiness,
    rateFor(z.modifiers.happiness),
  );
  z.modifiers.community = settle(
    z.modifiers.community,
    rateFor(z.modifiers.community),
  );

  z.modifiers.health = settle(z.modifiers.health, rateFor(z.modifiers.health));
  return z;
}

function warnUser(z: Game) {
  if (z.endGameDetails.msg !== "") return z;
  // Warn at most once a year about very low happiness or health.
  if (
    z.townInfo.happiness < 70 &&
    z.last_warning_happiness + 365 < z.environment.day
  ) {
    showAlert(
      "Your citizens are very unhappy. You should do something about it.",
    );
    z.last_warning_happiness = z.environment.day;
  }
  if (
    z.townInfo.health < 70 &&
    z.last_warning_health + 365 < z.environment.day
  ) {
    showAlert(
      "Your citizens are very unhealthy. You should do something about it.",
    );
    z.last_warning_health = z.environment.day;
  }
  return z;
}

function generateResources(z: Game) {
  let multiplier = productivityResourceMultiplier(z.townInfo.productivity);
  multiplier *= z.gameSettings.includes("casual")
    ? RESOURCE_BOOST.casual
    : RESOURCE_BOOST.normal;
  multiplier = randomizeNumber(multiplier, 2);
  multiplier *=
    z.townInfo.community > 150 ? 1.2 : z.townInfo.community < 100 ? 0.85 : 1;

  const staff = staffing(z);
  forEachBuiltPlot(z, (plot, option, i, j) => {
    const generated = option.generated_resources;
    if (plot.disabled || generated == null) return;
    const nearWater = isAdjacentToWater(i, j, z);
    const liegeBonus = isLiegeOnPlot(i, j, z) ? 2 : 1;
    // Neighbour synergies (livestock by farms, tree farms by a lumber mill),
    // times the share of the building's jobs that are filled.
    const synergy = synergyAt(i, j, z).resource * staffRatio(staff, plot);

    // No per-building rounding: outputs are small (a farm makes ~1 food).
    z.resources.food +=
      generated.food * multiplier * synergy * (nearWater ? 2 : 1) * liegeBonus;
    z.resources.wood += generated.wood * multiplier * synergy * liegeBonus;
    z.resources.stone += generated.stone * multiplier * synergy * liegeBonus;
    z.resources.metal += generated.metal * multiplier * synergy * liegeBonus;
    z.resources.bureaucracy +=
      generated.bureaucracy * multiplier * synergy * liegeBonus;
  });

  for (const key of ["food", "wood", "stone", "metal", "bureaucracy"] as const) {
    z.resources[key] = roundTo(z.resources[key], 3);
  }
  return z;
}

function lawEffects(z: Game) {
  for (const lawId of [...z.economyAndLaws.enacted]) {
    const law = laws.find((l) => l.id === lawId);
    if (law?.weekly_effect) z = law.weekly_effect(z);
  }
  return z;
}

function calculatePower(z: Game) {
  let power = 0;
  const staff = staffing(z);
  forEachBuiltPlot(z, (plot, option) => {
    power +=
      option.generated_resources.power * staffRatio(staff, plot) -
      option.active_costs.power;
  });
  z.resources.power = power;

  if (power < 0) {
    z.modifiers.happiness *= 0.98;
    z.townInfo.happiness -= 5;
    z = addToTownLog(POWER_SHORTAGE_MSG, z, Vibe.BAD);
  } else {
    removeFromTownLog(z, POWER_SHORTAGE_MSG);
  }
  return z;
}

function calculateKnowledge(z: Game) {
  let weekly = 0;
  const staff = staffing(z);
  forEachBuiltPlot(z, (plot, option, i, j) => {
    if (option.knowledge_points_per_month == null) return;
    const liegeBonus = isLiegeOnPlot(i, j, z) ? 0.75 : 1;
    const gained =
      (option.knowledge_points_per_month * liegeBonus * staffRatio(staff, plot)) /
      4;
    z.townInfo.knowledge_points += gained;
    weekly += gained;
  });
  z.resource_rate.knowledge = roundTo(weekly, 2);
  return z;
}

function bringStatsBackToNormal(z: Game) {
  const rate = 0.09;
  const info = z.townInfo;
  for (const key of ["happiness", "health", "community"] as const) {
    if (info[key] > MIDPOINT) {
      // Drift down toward the midpoint...
      info[key] = Math.max(MIDPOINT, info[key] - (info[key] - MIDPOINT) * rate);
    } else if (info[key] < MIDPOINT) {
      // ...or recover toward it, a bit more slowly.
      info[key] += (MIDPOINT - info[key]) * (rate * 0.5);
    }
  }
  return z;
}

function feedCitizens(z: Game) {
  // Each citizen eats FOOD_PER_PERSON per week. If there isn't enough,
  // everyone gets a bit less happy and healthy.
  const foodNeeded = z.townInfo.population_count * FOOD_PER_PERSON;
  let eaten = foodNeeded;
  if (z.resources.food < foodNeeded) {
    eaten = z.resources.food;
    z.modifiers.happiness *= 0.95;
    z.modifiers.health *= 0.95;
    z = addToTownLog(NOT_ENOUGH_FOOD_MSG, z, Vibe.BAD);
    z.resources.food = 0;
  } else {
    removeFromTownLog(z, NOT_ENOUGH_FOOD_MSG);
    z.resources.food -= foodNeeded;
  }
  // Some stored food spoils, so surplus levels off instead of piling up.
  const spoiled = z.resources.food * FOOD_SPOILAGE;
  z.resources.food = roundTo(z.resources.food - spoiled, 3);
  z.foodSpoiled = roundTo(spoiled, 2);
  z.foodEaten = roundTo(eaten, 2);
  // A town with weeks of food in store is well fed: a small steady boost.
  z.wellFed =
    foodNeeded > 0 && z.resources.food >= foodNeeded * WELL_FED_WEEKS;
  if (z.wellFed) {
    z.townInfo.happiness += WELL_FED_BONUS;
    z.townInfo.health += WELL_FED_BONUS;
  }
  return z;
}

/** Homes feel their neighbours: industry hurts, amenities help (#46). */
function neighbourEffects(z: Game) {
  // Industry pollutes the land around it; homes feel their land (#59).
  updatePollution(z);
  const delta = townHomeEffect(z);
  z.townInfo.happiness += delta.happiness;
  z.townInfo.health += delta.health;
  if (delta.pollutedHomes > 0 && !z.pollutionLogged) {
    z.pollutionLogged = true;
    z = addToTownLog(
      "Smoke and dust from industry are drifting over homes. Pollution builds up over months within 2 tiles of mines, quarries, smithies and mills, and makes residents sick. Parks and tree farms help clean it up.",
      z,
      Vibe.BAD,
    );
  }
  return z;
}

function applyModifiers(z: Game) {
  forEachBuiltPlot(z, (_plot, option) => {
    z.townInfo.happiness *= option.weekly_effect_modifiers.happiness;
    z.townInfo.health *= option.weekly_effect_modifiers.health;
    z.townInfo.community *= option.weekly_effect_modifiers.community;
  });
  z.townInfo.happiness *= z.modifiers.happiness;
  z.townInfo.health *= z.modifiers.health;
  z.townInfo.community *= z.modifiers.community;
  return z;
}

function calculateResourceRates(
  z: Game,
  start: ResourceSnapshot,
  end: ResourceSnapshot,
) {
  for (const key of [
    "food",
    "wood",
    "stone",
    "metal",
    "bureaucracy",
  ] as const) {
    z.resource_rate[key] = roundTo(end[key] - start[key], 2);
  }
  return z;
}

// ---------------------------------------------------------------------------
// Monthly tasks
// ---------------------------------------------------------------------------

function reactToProductivity(z: Game) {
  const multiplier = productivityHappinessMultiplier(z.townInfo.productivity);
  if (multiplier === 1) return z;

  const percentChange = Math.round(Math.abs(multiplier - 1) * 100);
  z.townInfo.happiness *= multiplier;
  if (multiplier > 1) {
    z = addToTownLog(
      `Happiness has gone up by ${percentChange}% due to productivity.`,
      z,
      Vibe.GOOD,
    );
  } else {
    z = addToTownLog(
      `Happiness has gone down by ${percentChange}% due to productivity.`,
      z,
      Vibe.BAD,
    );
  }
  return z;
}


function getRandomTip(z: Game) {
  const info = z.townInfo;
  const tax_rate = z.economyAndLaws.tax_rate;
  const max_tax_rate = taxTolerance(z);
  const tips = [
    () =>
      info.happiness < 100
        ? `I heard that the town is unhappy. We miss our churches and parks...`
        : "",
    () =>
      info.health < 100
        ? `My kids keep getting sick, probably not enough farms around here!`
        : "",
    () =>
      info.happiness < 50
        ? `I'm thinking of moving out if things don't improve soon!`
        : "",
    () =>
      info.employees < info.population_count
        ? `I am unemployed and I hate it here`
        : "",
    () => (info.knowledge_points < 10 ? `I wish we had more schools!` : ""),
    () =>
      tax_rate > max_tax_rate
        ? `I wish the taxes were lower, I could use a break!`
        : "",
    () =>
      info.productivity > 100
        ? `I think we should take a day or two to just be chill, we've been working hard!`
        : "",
    () =>
      tax_rate < max_tax_rate
        ? `We would probably be ok chipping in more gold for village improvements.`
        : "",
  ];
  return tips[Math.floor(Math.random() * tips.length)]();
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function listenToTownspeople(z: Game) {
  // If the liege is on a residential plot, they hear tips from the residents.
  const location = z.liege_location;
  if (!location) return z;
  const plot = z.plots[location[0]]?.[location[1]];
  if (!plot?.active || plot.type < 0) return z;
  if (options[plot.type]?.type !== "residential") return z;
  if (Math.random() >= 0.99) return z;

  const tip = getRandomTip(z);
  if (tip !== "") {
    const speaker = `👑🏠 ${pick(townPeopleNames)} the ${pick(townPeopleJobsHobbies)}: `;
    z = addToTownLog(speaker + tip, z, Vibe.NORMAL);
  }
  return z;
}

/** The town's needs grow with it (#48). */
function townNeedsEffects(z: Game) {
  const { status, rewarded } = updateNeeds(z);
  removeFromTownLog(z, "NEEDS:");
  const unmet = status.filter((n) => !n.met);
  if (unmet.length) {
    z = addToTownLog(
      `NEEDS: ${unmet.map((n) => `${n.service.emoji} ${n.service.title} reaches ${Math.round(n.covered * 100)}% of homes, wants ${Math.round(n.target * 100)}%`).join("; ")}. Build services near homes.`,
      z,
      Vibe.BAD,
    );
  }
  if (rewarded) {
    z = addToTownLog(
      `🎉 Every need of a ${rewarded.name.toLowerCase()} is met! The townspeople chipped in 💰${rewarded.reward}.`,
      z,
      Vibe.GOOD,
    );
  }
  return z;
}

// ---------------------------------------------------------------------------
// Quarterly tasks
// ---------------------------------------------------------------------------

/** Newcomers fill empty homes each week, faster in an attractive town. */
function moveIn(z: Game) {
  const arrivals = weeklyArrivals(z);
  z.townInfo.population_count += arrivals;
  z.lastArrivals = arrivals;
  if (arrivals > 0) syncEmployment(z);
  return z;
}

/** Homes grow or shrink with their surroundings (#60). */
function levelHomes(z: Game) {
  const full = new Set<string>();
  for (const [id, o] of homeOccupancy(z)) if (o.people >= o.capacity) full.add(id);
  const changes = updateHomeLevels(z, full);
  const ups = changes.filter((c) => c.to > c.from).length;
  const downs = changes.length - ups;
  if (ups && !z.homeLevelLogged) {
    z.homeLevelLogged = true;
    z = addToTownLog(
      "🏠⭐ A home has grown to level 2 and holds more people. Full homes on good land (parks, churches, water nearby, clean air) grow over time while the town is happy. Homes on poor or polluted land shrink back.",
      z,
      Vibe.GOOD,
    );
  }
  if (downs) {
    z = addToTownLog(
      `🏚️ ${downs} home${downs > 1 ? "s" : ""} lost a level: the land around ${downs > 1 ? "them" : "it"} got worse. Some residents moved out.`,
      z,
      Vibe.BAD,
    );
  }
  if (changes.length) syncEmployment(z);
  return z;
}

function movePeopleInMovePeopleOut(z: Game) {
  const info = z.townInfo;
  // Moving in happens weekly (moveIn); this only handles people leaving.
  if (info.happiness < 50 && info.population_count > 0) {
    // When happiness is low, some people leave.
    const unhappyPeople = Math.round((150 - info.happiness) / 5);
    info.population_count -= unhappyPeople;
  }
  // Newcomers fill open jobs; leavers vacate theirs.
  syncEmployment(z);
  return z;
}
