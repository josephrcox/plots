import { DB, hasPlotOfType } from "$lib/store";
import { Game } from "$lib/types";

type TutorialStep = {
  message: string;
  isComplete: (z: Game) => boolean;
  goldReward: number;
};

export const tutorialMessages: TutorialStep[] = [
  {
    message: "My liege, we need places to live! Build the first homes.",
    isComplete: (z: Game) => {
      return z.townInfo.population_max > 0;
    },
    goldReward: 250,
  },
  {
    message:
      "My liege, the village is going to run out of food soon. Build some farms. ",
    isComplete: (z: Game) => {
      return z.townInfo.employees > 0;
    },
    goldReward: 500,
  },
  {
    message:
      "My liege, lumber is needed for most buildings. Build a tree farm. ",
    isComplete: (z: Game) => {
      return hasPlotOfType("tree_farm", z).length > 0;
    },
    goldReward: 500,
  },
  {
    message:
      "My liege, for the village to be successful, everyone needs a job. ",
    isComplete: (z: Game) => {
      return z.townInfo.employees >= z.townInfo.population_count;
    },
    goldReward: 250,
  },
  {
    message:
      "My liege, the village will need stone and metals to expand. Build a quarry. ",
    isComplete: (z: Game) => {
      return hasPlotOfType("quarry", z).length > 0;
    },
    goldReward: 1000,
  },
  {
    message:
      "My liege, after working hard, the townspeople need a place to relax. Build a pub or a church. ",
    isComplete: (z: Game) => {
      return (
        hasPlotOfType("pub", z).length > 0 ||
        hasPlotOfType("church", z).length > 0
      );
    },
    goldReward: 500,
  },
  {
    message:
      "My liege, things are picking up but we will need far more money. Get weekly revenue to >=75 gold. ",
    isComplete: (z: Game) => {
      return z.economyAndLaws.weeklyProfit >= 75;
    },
    goldReward: 1000,
  },
  {
    message:
      "My liege, many of the townspeople have kids that need an education. Build a schoolhouse.",
    isComplete: (z: Game) => {
      return hasPlotOfType("schoolhouse", z).length > 0;
    },
    goldReward: 850,
  },
  {
    message:
      "My liege, the village is growing - woohoo! But we need to have more workers. Get the population to 100.",
    isComplete: (z: Game) => {
      return z.townInfo.population_count >= 100;
    },
    goldReward: 1500,
  },
  {
    message:
      "My liege, some advanced buildings require power. Start generating power with a waterwheel.",
    isComplete: (z: Game) => {
      return z.resources.power > 0;
    },
    goldReward: 500,
  },
  {
    message:
      "My liege, we found a great area that would be perfect for a vineyard. Build a vineyard.",
    isComplete: (z: Game) => {
      return hasPlotOfType("vineyard", z).length > 0;
    },
    goldReward: 500,
  },
  {
    message:
      "My liege, to continue investing in knowledge & growth, we need a library. Build a library. ",
    isComplete: (z: Game) => {
      return hasPlotOfType("library", z).length > 0;
    },
    goldReward: 1000,
  },
  {
    message:
      "My liege, we need more metals. Find a good spot for a mine and build it. ",
    isComplete: (z: Game) => {
      return hasPlotOfType("mine", z).length > 0;
    },
    goldReward: 2000,
  },
];
