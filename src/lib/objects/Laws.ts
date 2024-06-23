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
  {
    id: "tax_free",
    description:
      "Tax-Free Month. For 1 month, the town loses all revenue from taxes, but happiness and health increase quite a lot. Automatically ends after 4 weeks.",
    cost: 250,
    weekly_effect: (game: Game) => {
      if (localStorage.getItem("tax_free") === null) {
        localStorage.setItem("tax_free", "0");
        game.economyAndLaws.weeklyProfit =
          -1 * game.economyAndLaws.weeklyProfit;
      } else {
        localStorage.setItem(
          "tax_free",
          (parseInt(localStorage.getItem("tax_free") as string) + 1).toString(),
        );
      }
      if (parseInt(localStorage.getItem("tax_free") as string) >= 4) {
        game.modifiers.happiness *= 1;
        game.modifiers.health *= 1;
        localStorage.removeItem("tax_free");
        game.economyAndLaws.enacted = game.economyAndLaws.enacted.filter(
          (law) => law !== "tax_free",
        );
      } else {
        game.modifiers.happiness *= 1.25;
        game.modifiers.health *= 1.25;
      }

      return game;
    },
  },
];
