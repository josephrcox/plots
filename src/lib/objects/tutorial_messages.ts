import { DB, hasPlotOfType } from "$lib/store";
import { Game } from "$lib/types";

/*
    Message
    completed if
*/

// 'My liege, we need places to live! Build the first homes.'

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
    goldReward: 500,
  },
  {
    message:
      "My liege, the village is going to run out of resources. Put us to work to make more! ",
    isComplete: (z: Game) => {
      return z.townInfo.employees > 0;
    },
    goldReward: 500,
  },
];
