import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";
import { options } from "./objects/PlotTypeOptions";
import type { Game, PlotOption } from "./types";
import { hexNeighbours } from "./neighbours";
import {
  hasPlotOfType,
  clearPlot,
  countJobs,
  syncEmployment,
  DB,
  createDefaultGame,
  generatePlots,
  flushSave,
} from "./store";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function analyticsEvent(
  z: Game,
  event: string,
  params: Record<string, string | number>,
) {
  let globalParams = {
    townName: z.townInfo.name,
    population: z.townInfo.population_count,
    gold: z.townInfo.gold,
    day: z.environment.day * z.environment.year,
    tick: z.tick,
  };

  const eventParams = params;
  const allParams = { ...globalParams, ...eventParams };

  // `gtag` is defined globally in index.html (and may be blocked).
  const gtag = (window as any).gtag;
  if (typeof gtag === "function") gtag("event", event, allParams);
}

type FlyAndScaleParams = {
  y?: number;
  x?: number;
  start?: number;
  duration?: number;
};

export const flyAndScale = (
  node: Element,
  params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 },
): TransitionConfig => {
  const style = getComputedStyle(node);
  const transform = style.transform === "none" ? "" : style.transform;

  const scaleConversion = (
    valueA: number,
    scaleA: [number, number],
    scaleB: [number, number],
  ) => {
    const [minA, maxA] = scaleA;
    const [minB, maxB] = scaleB;

    const percentage = (valueA - minA) / (maxA - minA);
    const valueB = percentage * (maxB - minB) + minB;

    return valueB;
  };

  const styleToString = (
    style: Record<string, number | string | undefined>,
  ): string => {
    return Object.keys(style).reduce((str, key) => {
      if (style[key] === undefined) return str;
      return str + `${key}:${style[key]};`;
    }, "");
  };

  return {
    duration: params.duration ?? 200,
    delay: 0,
    css: (t) => {
      const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
      const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
      const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

      return styleToString({
        transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        opacity: t,
      });
    },
    easing: cubicOut,
  };
};

export function numberWithCommas(x: string | number) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function roundTo(n: number, digits: number) {
  if (digits === undefined) {
    digits = 0;
  }
  if (n == null || n == undefined) {
    return 0;
  }

  n = parseFloat((n * Math.pow(10, digits)).toFixed(11));
  var test = Math.round(n) / Math.pow(10, digits);

  return +test.toFixed(digits);
}

export function pad(n: number) {
  return n < 10 ? "0" + n : n;
}

// Function to format the duration
export function formatDuration(ms: number) {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;
  let hours = Math.floor(minutes / 60);
  minutes = minutes % 60;

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function getOptionIndex(id: string) {
  return options.findIndex((option) => option.id === id);
}

export function getOptionFromId(id: string | null) {
  return options.find((option) => option.id === id);
}

export function firstEmoji(s: string): string | null {
  const regex = /\p{Emoji}/u;
  const match = regex.exec(s);
  return match ? match[0] : null;
}

/**
 * Formats a resource or gold amount for display: whole numbers get thousands
 * separators; small fractional amounts keep one decimal (1.5 wood, 0.2/wk).
 */
export function formatAmount(n: number) {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs < 100 && Math.abs(n - Math.round(n)) >= 0.05) {
    return (Math.round(n * 10) / 10).toFixed(1);
  }
  return formatNumber(Math.round(n), false);
}

export function formatNumber(n: number, decimal = true) {
  let toReturn = n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
  if (!decimal) {
    toReturn = toReturn.split(".")[0];
  }
  return toReturn;
}

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function formatModifier(modifier: number) {
  let isNegative = modifier < 1;
  let response = roundTo((modifier % 1) * 100, 0);
  if (!isNegative) {
    return `+${response}%`;
  } else {
    return `-${100 - response}%`;
  }
}

export function formatInstantChange(change: number, divide: boolean = true) {
  // We divide by 3 because the number is actually 300 but shown to the user as 100 max
  change = roundTo(change / (divide ? 3 : 1), 2);
  let isNegative = change < 0;
  if (!isNegative) {
    return `+${change}`;
  } else {
    return `${change}`;
  }
}

/**
 * Whether (x, y) touches water. Unless `overrideType` is set, only farms
 * count (water doubles a farm's food and revenue).
 */
export function isAdjacentToWater(
  x: number,
  y: number,
  z: Game,
  overrideType: boolean = false,
) {
  const plot = z.plots[x]?.[y];
  if (!plot) return false;
  if (!hexNeighbours(x, y, z).some((p) => p.water)) return false;
  if (overrideType) return true;
  return plot.active && plot.type >= 0 && options[plot.type].id === "farm";
}

/** Whether (x, y) touches a built plot of every id in `requiredPlots`. */
export function isAdjacentToPlots(
  x: number,
  y: number,
  z: Game,
  requiredPlots: string[],
) {
  if (!z.plots[x]?.[y]) return false;
  const neighbours = hexNeighbours(x, y, z);
  return requiredPlots.every(
    (id) =>
      id === "water" ||
      neighbours.some(
        (p) => p.active && p.type >= 0 && options[p.type].id === id,
      ),
  );
}

// function that takes a number and returns one that is within 15% below or above
export function randomizeNumber(n: number, round: number = 0) {
  let min = n * 0.95;
  let max = n * 1.05;
  return roundTo(Math.random() * (max - min) + min, round);
}

/**
 * Whether something can be built on (x, y): any land tile touching a built
 * one (all six hex neighbours). Before anything is built, any land tile can
 * be the town's first.
 */
export function checkIfPlotCanBeUpgraded(x: number, y: number, z: Game) {
  const plot = z.plots[x]?.[y];
  if (!plot || plot.offMap || plot.water) return false;
  if (!townHasStarted(z)) return true;
  return hexNeighbours(x, y, z).some((p) => p.active);
}

/** Whether anything has been built yet. */
export function townHasStarted(z: Game) {
  return z.plots.some((row) => row.some((p) => p.active));
}

/** A land tile near the middle of the land: where to suggest starting. */
export function suggestedStart(z: Game): [number, number] | null {
  const land = z.plots
    .flat()
    .filter((p) => !p.offMap && !p.water && !p.mineralSource);
  if (!land.length) return null;
  const cx = land.reduce((s, p) => s + p.x, 0) / land.length;
  const cy = land.reduce((s, p) => s + p.y, 0) / land.length;
  const best = land.reduce((a, b) =>
    Math.hypot(a.x - cx, a.y - cy) <= Math.hypot(b.x - cx, b.y - cy) ? a : b,
  );
  return [best.x, best.y];
}

// Check if player has enough gold for the plot
export function hasEnoughGold(plotChosen: PlotOption, z: Game): boolean {
  return plotChosen.requirements.gold <= z.townInfo.gold;
}

// Check if player has enough knowledge points
export function hasEnoughKnowledge(plotChosen: PlotOption, z: Game): boolean {
  if (!plotChosen.requirements.knowledge) return true;
  return plotChosen.requirements.knowledge <= z.townInfo.knowledge_points;
}

// Check if player has enough resources
export function hasEnoughResources(plotChosen: PlotOption, z: Game): boolean {
  if (!plotChosen.requirements.resources) return true;

  return Object.entries(plotChosen.requirements.resources).every(
    ([resource, amount]) => {
      const resourceKey = resource as keyof typeof z.resources;
      const required: number = z.resources[resourceKey];
      return amount === 0 || required >= amount;
    },
  );
}

// Check if player has enough employees
export function hasEnoughEmployees(
  plotChosen: PlotOption,
  z: Game,
  x: number,
  y: number,
): boolean {
  if (
    !plotChosen.requirements.employees ||
    plotChosen.requirements.employees <= 0
  )
    return true;

  // Jobs may never outnumber people. Replacing a building frees its jobs.
  const existing = z.plots[x][y];
  const freedJobs =
    existing.active && existing.type > -1
      ? (options[existing.type]?.requirements.employees ?? 0)
      : 0;
  return (
    countJobs(z) - freedJobs + plotChosen.requirements.employees <=
    z.townInfo.population_count
  );
}

// Check if player has enough resources for active costs
export function canSupportActiveCosts(
  plotChosen: PlotOption,
  z: Game,
): boolean {
  if (!plotChosen.active_costs) return true;

  return Object.entries(plotChosen.active_costs).every(([resource, amount]) => {
    if (resource === "gold") return true; // Skip gold check
    const resourceKey = resource as keyof typeof plotChosen.active_costs;
    if (resourceKey === "gold") return true;
    return !amount || z.resources[resourceKey] >= amount;
  });
}

// Check if plot meets adjacent plot requirements
export function meetsAdjacentRequirements(
  plotChosen: PlotOption,
  x: number,
  y: number,
  z: Game,
): boolean {
  if (!plotChosen.requirements.adjacent_plots.length) return true;

  for (const plot of plotChosen.requirements.adjacent_plots) {
    if (plot === "water") {
      if (!isAdjacentToWater(x, y, z, true)) return false;
    } else if (!isAdjacentToPlots(x, y, z, [plot])) {
      return false;
    }
  }
  return true;
}

// Check if required plots are built
export function hasRequiredPlots(plotChosen: PlotOption, z: Game): boolean {
  if (!plotChosen.requirements.plots.length) return true;

  return plotChosen.requirements.plots.every(
    (plot) => hasPlotOfType(plot, z).length > 0,
  );
}

// Main function that combines all checks
export function checkIfAffordable(
  plotChosen: PlotOption,
  z: Game,
  x: number,
  y: number,
): {
  affordable: boolean;
  gold: boolean;
  knowledge: boolean;
  resources: boolean;
  employees: boolean;
  activeCosts: boolean;
  adjacent: boolean;
  requiredPlots: boolean;
} {
  const goldCheck = hasEnoughGold(plotChosen, z);
  const knowledgeCheck = hasEnoughKnowledge(plotChosen, z);
  const resourcesCheck = hasEnoughResources(plotChosen, z);
  const employeesCheck = hasEnoughEmployees(plotChosen, z, x, y);
  const activeCostsCheck = canSupportActiveCosts(plotChosen, z);
  const adjacentCheck = meetsAdjacentRequirements(plotChosen, x, y, z);
  const requiredPlotsCheck = hasRequiredPlots(plotChosen, z);

  return {
    affordable: [
      goldCheck,
      knowledgeCheck,
      resourcesCheck,
      employeesCheck,
      activeCostsCheck,
      adjacentCheck,
      requiredPlotsCheck,
    ].every((check) => check === true),
    gold: goldCheck,
    knowledge: knowledgeCheck,
    resources: resourcesCheck,
    employees: employeesCheck,
    activeCosts: activeCostsCheck,
    adjacent: adjacentCheck,
    requiredPlots: requiredPlotsCheck,
  };
}

/**
 * Builds `plotOptionID` on plot (x, y), replacing whatever is there.
 * Returns false (and changes nothing) if the player can't afford it, unless
 * `force` is set. Mutates `z` without publishing it.
 */
export function placePlot(
  z: Game,
  x: number,
  y: number,
  plotOptionID: string,
  force = false,
): boolean {
  const typeIndex = getOptionIndex(plotOptionID);
  const plotChosen = options[typeIndex];
  if (!plotChosen) return false;
  if (!force && !checkIfAffordable(plotChosen, z, x, y).affordable) {
    return false;
  }

  if (z.plots[x][y].type > -1) {
    clearPlot(x, y, z);
  }

  const plot = z.plots[x][y];
  plot.type = typeIndex;
  plot.active = true;
  plot.typeId = plotChosen.id;
  plot.builtDay = z.environment.day;
  z.townInfo.gold = roundTo(z.townInfo.gold - plotChosen.requirements.gold, 2);
  // Knowledge is spent, like gold.
  z.townInfo.knowledge_points -= plotChosen.requirements.knowledge || 0;
  // Immediate variable changes
  z.townInfo.population_count +=
    plotChosen.immediate_variable_changes.population;
  z.townInfo.population_max += plotChosen.immediate_variable_changes.population;
  z.townInfo.happiness = Math.min(
    z.maximums.happiness,
    z.townInfo.happiness + plotChosen.immediate_variable_changes.happiness,
  );
  z.townInfo.health = Math.min(
    z.maximums.health,
    z.townInfo.health + plotChosen.immediate_variable_changes.health,
  );
  // Effect modifiers
  z.modifiers.happiness = roundTo(
    z.modifiers.happiness * plotChosen.purchase_effect_modifiers.happiness,
    2,
  );
  z.modifiers.health = roundTo(
    z.modifiers.health * plotChosen.purchase_effect_modifiers.health,
    2,
  );
  z.modifiers.community = roundTo(
    z.modifiers.community * plotChosen.purchase_effect_modifiers.community,
    2,
  );
  syncEmployment(z);

  z.plotCounts[typeIndex] = (z.plotCounts[typeIndex] ?? 0) + 1;
  z.lastChangeDay = z.environment.day;

  const resourcesForPlot = plotChosen.requirements.resources;
  if (resourcesForPlot) {
    z.resources.food -= resourcesForPlot.food;
    z.resources.wood -= resourcesForPlot.wood;
    z.resources.stone -= resourcesForPlot.stone;
    z.resources.metal -= resourcesForPlot.metal;
  }

  if (plotChosen.id === "city_hall") z.hasCityHall = true;
  if (plotChosen.id === "bank") z.hasBank = true;

  return true;
}

export function findClosestPlot(startX: number, startY: number, z: Game) {
  // Early return if no valid plots possible
  if (!z || !z.plots || !z.plots.length) return null;

  const maxX = z.plots.length;
  const maxY = z.plots[0].length;

  // Search in expanding squares from the start position
  for (let dist = 1; dist < maxX + maxY; dist++) {
    // Check plots at current distance
    for (let dx = -dist; dx <= dist; dx++) {
      for (let dy = -dist; dy <= dist; dy++) {
        // Only check plots at exactly distance 'dist'
        if (Math.abs(dx) + Math.abs(dy) !== dist) continue;

        const i = startX + dx;
        const j = startY + dy;

        // Skip if out of bounds
        if (i < 0 || i >= maxX || j < 0 || j >= maxY) continue;

        if (
          !z.plots[i][j].active &&
          !z.plots[i][j].mineralSource &&
          !z.plots[i][j].water &&
          !z.plots[i][j].disabled &&
          checkIfPlotCanBeUpgraded(i, j, z)
        ) {
          return [i, j]; // Return first valid plot at this distance
        }
      }
    }
  }

  return null;
}

/** Dev tool: replaces the current town with a randomly built one. */
export function createAMockTown() {
  const json = createDefaultGame();
  json.difficulty = 1;
  json.endGoal = "land";
  json.gameSettings = ["devMode"];
  json.townInfo.name = "Mock Town";
  json.townInfo.gold = Math.random() * 5000 + 2000;
  json.townInfo.happiness = 300;
  json.townInfo.health = 300;
  json.townInfo.knowledge_points = Math.random() * 100 + 10;
  json.modifiers.happiness = 10000;
  json.modifiers.health = 10000;
  json.resources.food = Math.random() * 1000 + 100;
  json.resources.wood = Math.random() * 1000 + 100;
  json.resources.stone = Math.random() * 1000 + 100;
  json.resources.metal = Math.random() * 1000 + 100;
  json.plots = generatePlots(25);

  // Always place a small home first, then place 3 farms and a tree_farm.
  const [sx, sy] = suggestedStart(json) ?? [0, 0];
  placePlot(json, sx, sy, "small_homes", true);
  for (const id of ["farm", "farm", "farm", "tree_farm"]) {
    const next = findClosestPlot(sx, sy, json);
    if (next) placePlot(json, next[0], next[1], id, true);
  }

  // Then keep building random plots next to the town until nothing fits.
  for (let attempts = 0; attempts < 2000; attempts++) {
    const next = findClosestPlot(sx, sy, json);
    if (!next) break;
    const option = options[Math.floor(Math.random() * options.length)];
    if (option.id === "mine") continue;
    placePlot(json, next[0], next[1], option.id);
  }

  DB.set(json);
  flushSave();
  location.reload();
}
