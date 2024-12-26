import { DB, hasPlotOfType } from "$lib/store";
import { Game } from "$lib/types";

type TutorialStep = {
  message: string;
  isComplete: (z: Game) => boolean;
  goldReward: number;
};

export const tutorialMessages: TutorialStep[] = [
  {
    message:
      "Welcome the first settlers to our village by building a set of homes",
    isComplete: (z: Game) => {
      return z.townInfo.population_max > 0;
    },
    goldReward: 600,
  },
  {
    message: "Start producing food for the villagers",
    isComplete: (z: Game) => {
      return hasPlotOfType("farm", z).length >= 1;
    },
    goldReward: 400,
  },
  {
    message:
      "Build a tree farm to start producing wood, which is essential for building",
    isComplete: (z: Game) => {
      return hasPlotOfType("tree_farm", z).length >= 1;
    },
    goldReward: 400,
  },
  {
    message: "Build a quarry to start mining stone and metals",
    isComplete: (z: Game) => {
      return hasPlotOfType("quarry", z).length > 0;
    },
    goldReward: 800,
  },
  {
    message: "Settlement: Grow population to 50",
    isComplete: (z: Game) => {
      return z.townInfo.population_count >= 50;
    },
    goldReward: 1600,
  },
  {
    message: "Build a Market or Bakery to sell excess food",
    isComplete: (z: Game) => {
      return (
        hasPlotOfType("market", z).length > 0 ||
        hasPlotOfType("bakery", z).length > 0
      );
    },
    goldReward: 1600,
  },
  {
    message: "Complete Year 1",
    isComplete: (z: Game) => {
      return z.environment.day >= 365;
    },
    goldReward: 4000,
  },
  {
    message: "Village: Grow population to 100",
    isComplete: (z: Game) => {
      return z.townInfo.population_count >= 100;
    },
    goldReward: 6400,
  },
  {
    message: "Increase our weekly revenue to 200 gold",
    isComplete: (z: Game) => {
      return z.economyAndLaws.weeklyProfit >= 200;
    },
    goldReward: 6400,
  },
  {
    message: "Complete Year 2",
    isComplete: (z: Game) => {
      return z.environment.day >= 365 * 2;
    },
    goldReward: 4000,
  },
  {
    message: "Hamlet: Grow population to 200",
    isComplete: (z: Game) => {
      return z.townInfo.population_count >= 200;
    },
    goldReward: 16000,
  },
  {
    message: "Start generating power. Build a Water Wheel or Solar Farm",
    isComplete: (z: Game) => {
      return z.resources.power > 0;
    },
    goldReward: 8000,
  },
  {
    message: "Small Town: Grow population to 300",
    isComplete: (z: Game) => {
      return z.townInfo.population_count >= 300;
    },
    goldReward: 20000,
  },
  {
    message:
      "Generate 300 Knowledge 🧠 from libraries, schools, pubs, and vineyards",
    isComplete: (z: Game) => {
      return z.townInfo.knowledge_points >= 300;
    },
    goldReward: 4000,
  },
  {
    message:
      "Build a Mine to boost our metal supply (see the black plot on the map)",
    isComplete: (z: Game) => {
      return hasPlotOfType("mine", z).length > 0;
    },
    goldReward: 16000,
  },
  {
    message: "Town: Grow our population to 500",
    isComplete: (z: Game) => {
      return z.townInfo.population_count >= 500;
    },
    goldReward: 20000,
  },
  {
    message: "City: Grow our population to 1000",
    isComplete: (z: Game) => {
      return z.townInfo.population_count >= 1000;
    },
    goldReward: 40000,
  },
  {
    message: "Establish a City Hall to advance our town",
    isComplete: (z: Game) => {
      return hasPlotOfType("city_hall", z).length > 0;
    },
    goldReward: 40000,
  },
];
