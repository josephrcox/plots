import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";
import { options } from "./objects/PlotTypeOptions";
import { Game } from "./types";

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
    if (requiredPlots[i] == "water") {
      if (isAdjacentToWater(x, y, z, true)) {
        found = true;
        break;
      }
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
        options[z.plots[adjX][adjY].type].id == requiredPlots[i]
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
