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
    goldReward: 1000,
  },
  {
    message: "My liege, you need to start making food and wood.",
    isComplete: (z: Game) => {
      return (
        hasPlotOfType("farm", z).length >= 1 &&
        hasPlotOfType("tree_farm", z).length >= 1
      );
    },
    goldReward: 300,
  },
  {
    message:
      "My liege, the village will need stone and metals to expand. Build a quarry. ",
    isComplete: (z: Game) => {
      return hasPlotOfType("quarry", z).length > 0;
    },
    goldReward: 500,
  },
  {
    message:
      "My liege, things are picking up but we will need far more money. Get weekly revenue to >=200 gold. ",
    isComplete: (z: Game) => {
      return z.economyAndLaws.weeklyProfit >= 200;
    },
    goldReward: 2000,
  },
  {
    message:
      "My liege, as the town develops we will need the smartest and brightest. Build plots to get our Knowledge to 250.",
    isComplete: (z: Game) => {
      return z.townInfo.knowledge_points >= 250;
    },
    goldReward: 2000,
  },
  {
    message:
      "My liege, the village is growing - yay! But we need to have more workers. Get the population to 100.",
    isComplete: (z: Game) => {
      return z.townInfo.population_count >= 100;
    },
    goldReward: 1500,
  },
  {
    message:
      "My liege, some advanced buildings require power. Start generating power with a water wheel or a solar farm.",
    isComplete: (z: Game) => {
      return z.resources.power > 0;
    },
    goldReward: 2000,
  },
  {
    message:
      "My liege, we need more metals. Find a good spot for a mine and build it. ",
    isComplete: (z: Game) => {
      return hasPlotOfType("mine", z).length > 0;
    },
    goldReward: 10000,
  },
  {
    message:
      "My liege, mining resources has taken a toll on the towns health. Build a Healing House to lower the chance of sickness.",
    isComplete: (z: Game) => {
      return hasPlotOfType("healing_house", z).length > 0;
    },
    goldReward: 15000,
  },
  {
    message:
      "My liege, now that we have metals, power, and people, your next goal is a big one. Build your town a City Hall.",
    isComplete: (z: Game) => {
      return hasPlotOfType("city_hall", z).length > 0;
    },
    goldReward: 10000,
  },
];
