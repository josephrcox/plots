import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";
import { options } from "./objects/PlotTypeOptions";
import type { Game, PlotOption } from "./types";
import {
  hasPlotOfType,
  reverseClear,
  ACTIVE_GAME_DB_NAME,
  isWater,
  DB,
} from "./store";
import { default_db } from "./objects/defaults/default_DB";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function analyticsEvent(
  z: Game,
  event: string,
  params: Record<string, string>,
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

  console.log("event", event, allParams);

  // This works, even though it says it won't. It rolls up to index.html.
  // @ts-ignore
  gtag("event", event, allParams);
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

export function isAdjacentToWater(
  x: number,
  y: number,
  z: Game,
  overrideType: boolean = false,
) {
  // Checks if a farm is adjacent to water.
  // Not a general check – will only return true for farms.
  if (x < 0 || x >= z.plots.length || y < 0 || y >= z.plots[0].length) {
    return false; // Ensure x and y are within valid bounds of the grid
  }

  let adjacent = [
    [x - 1, y], // left
    [x + 1, y], // right
    [x, y - 1], // up
    [x, y + 1], // down
    [x - 1, y - 1], // top-left diagonal
    [x - 1, y + 1], // bottom-left diagonal
    [x + 1, y - 1], // top-right diagonal
    [x + 1, y + 1], // bottom-right diagonal
  ];

  for (let i = 0; i < adjacent.length; i++) {
    let adjX = adjacent[i][0];
    let adjY = adjacent[i][1];

    if (
      adjX >= 0 &&
      adjX < z.plots.length &&
      adjY >= 0 &&
      adjY < z.plots[0].length &&
      z.plots[adjX][adjY].water
    ) {
      if (overrideType) {
        return true;
      }

      if (
        z.plots[x][y].active == true &&
        z.plots[x][y].type > 0 &&
        options[z.plots[x][y].type].id == "farm"
      )
        return true;
    }
  }
  return false;
}

// function that takes x, y, the game state, and required plots (ids by string) and returns true if the plot is adjacent to all of the required plots.
export function isAdjacentToPlots(
  x: number,
  y: number,
  z: Game,
  requiredPlots: string[],
) {
  if (x < 0 || x >= z.plots.length || y < 0 || y >= z.plots[0].length) {
    return false; // Ensure x and y are within valid bounds of the grid
  }

  let adjacent = [
    [x - 1, y], // left
    [x + 1, y], // right
    [x, y - 1], // up
    [x, y + 1], // down
    [x - 1, y - 1], // top-left diagonal
    [x - 1, y + 1], // bottom-left diagonal
    [x + 1, y - 1], // top-right diagonal
    [x + 1, y + 1], // bottom-right diagonal
  ];

  let allAreAdjacent = true;
  for (let i = 0; i < requiredPlots.length; i++) {
    let found = false;
    let currentPlot = requiredPlots[i];

    // Skip this iteration if it's a water check
    if (currentPlot === "water") {
      continue;
    }

    for (let j = 0; j < adjacent.length; j++) {
      let adjX = adjacent[j][0];
      let adjY = adjacent[j][1];

      if (
        adjX >= 0 &&
        adjX < z.plots.length &&
        adjY >= 0 &&
        adjY < z.plots[0].length &&
        z.plots[adjX][adjY].active == true &&
        z.plots[adjX][adjY].type > 0 &&
        options[z.plots[adjX][adjY].type].id == currentPlot
      ) {
        found = true;
        break;
      }
    }
    if (!found) {
      allAreAdjacent = false;
      break;
    }
  }
  return allAreAdjacent;
}

// function that takes a number and returns one that is within 15% below or above
export function randomizeNumber(n: number, round: number = 0) {
  let min = n * 0.95;
  let max = n * 1.05;
  return roundTo(Math.random() * (max - min) + min, round);
}

export function checkIfPlotCanBeUpgraded(x: number, y: number, z: Game) {
  let plot = {
    x: x,
    y: y,
  };

  // the only exception is plot 0,0, which can be upgraded from the start
  if (plot.x === 0 && plot.y === 0) {
    return true;
  }
  // you can only upgrade a plot if it is adjacent to a plot that already is {active:true}.

  const adjacentPlots = [
    { x: plot.x - 1, y: plot.y },
    { x: plot.x + 1, y: plot.y },
    { x: plot.x, y: plot.y - 1 },
    { x: plot.x, y: plot.y + 1 },
  ];
  return adjacentPlots.some((adjacentPlot) => {
    // check if adjacent plot is outside of the 25x25 grid
    if (
      adjacentPlot.x < 0 ||
      adjacentPlot.x >= z.plots.length || // Changed from '>' to '>='
      adjacentPlot.y < 0 ||
      adjacentPlot.y >= z.plots[adjacentPlot.x].length // Assuming a square grid
    ) {
      return false;
    }
    const adjacentPlotData = z.plots[adjacentPlot.x][adjacentPlot.y];
    return adjacentPlotData.active;
  });
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

  const availableEmployees = z.townInfo.population_count - z.townInfo.employees;
  const existingPlot = z.plots[x][y];

  if (existingPlot.type !== -1) {
    const existingPlotType = options[existingPlot.type];
    const existingEmployees = existingPlotType.requirements.employees || 0;
    return (
      plotChosen.requirements.employees <=
      availableEmployees + existingEmployees
    );
  }

  return plotChosen.requirements.employees <= availableEmployees;
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

function getTypeIndex(typeId: string): number {
  return options.findIndex((option) => option.id === typeId);
}

function choosePlotOption(
  plotOptionID: string,
  x: number,
  y: number,
  z: Game,
  resourceOverride: boolean = false,
) {
  const typeIndex = getTypeIndex(plotOptionID);
  const plotChosen = options[typeIndex];

  if (resourceOverride || checkIfAffordable(plotChosen, z, x, y).affordable) {
    if (z.plots[x][y].type !== -1) {
      reverseClear(x, y, z);
    }

    z.plots[x][y].type = typeIndex;
    z.plots[x][y].active = true;
    z.plots[x][y].typeId = plotChosen.id;
    z.townInfo.gold -= plotChosen.requirements.gold;
    z.townInfo.gold = roundTo(z.townInfo.gold, 2);
    // Immediate variable changes
    z.townInfo.population_count +=
      plotChosen.immediate_variable_changes.population;
    z.townInfo.population_max +=
      plotChosen.immediate_variable_changes.population;
    z.townInfo.happiness += plotChosen.immediate_variable_changes.happiness;
    z.townInfo.health += plotChosen.immediate_variable_changes.health;
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
    // Employer modifications
    z.townInfo.employees += plotChosen.requirements.employees;

    // Plot count
    if (
      z.plotCounts[typeIndex] === undefined ||
      z.plotCounts[typeIndex] === null
    ) {
      z.plotCounts[typeIndex] = 0;
    }
    z.plotCounts[typeIndex]++;
    z.lastChangeDay = z.environment.day;

    if (plotChosen.requirements.resources !== undefined) {
      const resourcesForPlot = plotChosen.requirements.resources;
      z.resources.food -= resourcesForPlot.food;
      z.resources.wood -= resourcesForPlot.wood;
      z.resources.stone -= resourcesForPlot.stone;
      z.resources.metal -= resourcesForPlot.metal;
    }

    switch (plotChosen.id) {
      case "city_hall":
        z.hasCityHall = true;
        break;
      case "bank":
        z.hasBank = true;
        break;
      default:
        break;
    }

    return z;
  }
  return z;
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

export function createAMockTown(z: Game) {
  let json = { ...default_db };
  json.difficulty = 1;
  json.endGoal = "land";
  json.townInfo.name = "Mock Town";
  json.townInfo.gold = Math.random() * 50000 + 20000;
  json.townInfo.happiness = 300;
  json.townInfo.health = 300;
  json.townInfo.knowledge_points = Math.random() * 1000 + 100;
  json.modifiers.happiness = 10000;
  json.modifiers.health = 10000;
  json.resources.food = Math.random() * 10000 + 1000;
  json.resources.wood = Math.random() * 10000 + 1000;
  json.resources.stone = Math.random() * 10000 + 1000;
  json.resources.metal = Math.random() * 10000 + 1000;

  let default_plots = [] as any[][];

  const randomSize = 25;
  const mineX = Math.floor((Math.random() * randomSize) / 2) + 1;
  const mineY = Math.floor((Math.random() * randomSize) / 2) + 1;

  for (let i = 0; i < randomSize; i++) {
    default_plots.push([]);
    for (let j = 0; j < randomSize; j++) {
      const water =
        i == mineX && j == mineY ? false : isWater(i, j, randomSize);

      default_plots[i][j] = {
        id: Math.random().toString(36).substring(2, 9),
        active: false,
        x: i,
        y: j,
        type: water ? -9 : -1,
        typeId: "",
        mineralSource: water
          ? false
          : mineX === i && mineY === j
            ? true
            : false,
        water: mineX === i && mineY === j ? false : water,
      };
    }
  }

  json.plots = default_plots;
  DB.set(json);
  localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(json));
  localStorage.reset = false;

  // Always place a small home first, then place 3 farms and a tree_farm.
  json = choosePlotOption("small_homes", 0, 0, json, true);
  json = choosePlotOption("farm", 1, 0, json, true);
  json = choosePlotOption("farm", 2, 0, json, true);
  json = choosePlotOption("farm", 3, 0, json, true);
  json = choosePlotOption("tree_farm", 4, 0, json, true);

  // Then, randomly pick plots from options to place until you run out of gold.
  for (let i = 1; i < (z.plots.length * z.plots[0].length) / 2; i++) {
    for (let j = 0; j < options.length / 2; j++) {
      let randomPlotOption =
        options[Math.floor(Math.random() * options.length)];
      z = choosePlotOption(randomPlotOption.id, i, j, json, false);
    }
  }

  // Sync to DB
  DB.set(json);
  localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(json));
  localStorage.reset = false;

  location.reload();
}
