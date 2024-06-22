import { Law, Game } from "$lib/types";
import { hasPlotOfType, DB } from "$lib/store";
import { options } from "./PlotTypeOptions";

export const laws: Law[] = [
  {
    id: "organic_farming",
    description:
      "Organic Farming. Make townspeople healthier and happier, while decreasing overall food production.",
    cost: 100,
    weekly_effect: (game: Game) => {
      game.modifiers.happiness *= 1.02;
      game.modifiers.health *= 1.02;
      game.resources.food -= 2 * hasPlotOfType("farm", game).length;
      return game;
    },
  },
];
