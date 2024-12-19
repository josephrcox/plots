import { DB, hasPlotOfType } from "$lib/store";
import { Game } from "$lib/types";

type TutorialStep = {
  message: string;
  isComplete: (z: Game) => boolean;
  goldReward: number;
};

export const tutorialMessages: TutorialStep[] = [
  {
    message: "Build homes to start growing our village",
    isComplete: (z: Game) => {
      return z.townInfo.population_max > 0;
    },
    goldReward: 750,
  },
  {
    message: "Start producing food and wood to keep the town running",
    isComplete: (z: Game) => {
      return (
        hasPlotOfType("farm", z).length >= 1 &&
        hasPlotOfType("tree_farm", z).length >= 1
      );
    },
    goldReward: 500,
  },
  {
    message: "We need stone and metals. Build a quarry",
    isComplete: (z: Game) => {
      return hasPlotOfType("quarry", z).length > 0;
    },
    goldReward: 700,
  },
  {
    message: "Weekly revenue >= 200 gold",
    isComplete: (z: Game) => {
      return z.economyAndLaws.weeklyProfit >= 200;
    },
    goldReward: 3000,
  },
  {
    message: "Grow our population to 100.",
    isComplete: (z: Game) => {
      return z.townInfo.population_count >= 100;
    },
    goldReward: 8000,
  },
  {
    message: "Start generating power. Build a water wheel or solar farm",
    isComplete: (z: Game) => {
      return z.resources.power > 0;
    },
    goldReward: 10000,
  },
  {
    message: "Knowledge >= 250",
    isComplete: (z: Game) => {
      return z.townInfo.knowledge_points >= 250;
    },
    goldReward: 5000,
  },
  {
    message: "Population >= 200",
    isComplete: (z: Game) => {
      return z.townInfo.population_count >= 200;
    },
    goldReward: 20000,
  },
  {
    message: "Build a mine to boost our metal supply",
    isComplete: (z: Game) => {
      return hasPlotOfType("mine", z).length > 0;
    },
    goldReward: 20000,
  },
  {
    message: "Establish a City Hall to advance our town",
    isComplete: (z: Game) => {
      return hasPlotOfType("city_hall", z).length > 0;
    },
    goldReward: 50000,
  },
];
