import { Law, Game } from "$lib/types";
import { hasPlotOfType, DB } from "$lib/store";
import { options } from "./PlotTypeOptions";

let casualModifier = function (game: Game) {
  return game.gameSettings.includes("casual") ? 3 : 1;
};

export const laws: Law[] = [
  {
    id: "organic_farming",
    description:
      "Organic Farming. Make townspeople healthier and happier, while decreasing overall food production.",
    cost: 150,
    weekly_effect: (game: Game) => {
      game.modifiers.happiness *= 1.01;
      game.modifiers.health *= 1.01;
      game.resources.food -=
        2 * casualModifier(game) * hasPlotOfType("farm", game).length;

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
        game.modifiers.happiness *= 1.02;
        game.modifiers.health *= 1.01;
      }

      return game;
    },
  },
  {
    id: "healthy_mining",
    description:
      "Healthy mining. Miners must mine with proper ventilation, but they move like molasses.",
    cost: 250,
    weekly_effect: (game: Game) => {
      const option = options.find((option) => option.id === "mine");
      game.modifiers.health *= 1.1;
      game.resources.stone -=
        5 * casualModifier(game) * hasPlotOfType("quarry", game).length;
      game.resources.stone -=
        7 * casualModifier(game) * hasPlotOfType("mine", game).length;
      game.resources.metal -=
        15 * casualModifier(game) * hasPlotOfType("mine", game).length;
      return game;
    },
  },
  {
    id: "complicated_tax_forms",
    description:
      "Complicated Tax Forms. You sneak in a clause to charge 5% more in taxes. Now, if you adjust your tax rate 5% higher, they won't be upset. This can be enacted multiple times to stack.",
    cost: 500,
    weekly_effect: (game: Game) => {
      game.economyAndLaws.max_tax_rate += 0.05;
      game.economyAndLaws.enacted = game.economyAndLaws.enacted.filter(
        (law) => law !== "complicated_tax_forms",
      );
      return game;
    },
  },
  {
    id: "legalize_it",
    description:
      "Legalize it. You legalize a substance that makes people happy, but it also gives them 'the munchies'. Food consumption and happiness go up.",
    cost: 350,
    weekly_effect: (game: Game) => {
      game.resources.food -= Math.round(
        0.2 * casualModifier(game) * game.townInfo.population_count,
      );
      game.modifiers.happiness *= 1.1;
      return game;
    },
  },
  {
    id: "park_upgrade",
    description:
      "Park upgrade. You hold a community forum and add the top 5 things that the people want in their parks. This increases happiness for each park.",
    cost: 350,
    weekly_effect: (game: Game) => {
      game.townInfo.happiness += 2 * hasPlotOfType("park", game).length;
      return game;
    },
  },
  {
    id: "career_politician",
    description:
      "Career Politician. You hire a career politician to help you with your town. They cost the town $100 per week, but they earn bureaucracy points faster.",
    cost: 200,
    weekly_effect: (game: Game) => {
      game.townInfo.gold -= 100;
      game.resources.bureaucracy += 25;
      return game;
    },
  },
  {
    id: "the_big_wood_deal",
    description:
      "The Big Wood Deal. This law allows you to sell all of the wood in your town for $5/wood at once. This won't make the town happy, but may be necessary in a pinch. Can be enacted multiple times to sell to other buyers.",
    cost: 500,
    weekly_effect: (game: Game) => {
      game.townInfo.gold += 5 * game.resources.wood;
      game.resources.wood = 0;
      game.resource_rate.wood = 0;
      game.townInfo.happiness *= 0.95;
      game.economyAndLaws.enacted = game.economyAndLaws.enacted.filter(
        (law) => law !== "the_big_wood_deal",
      );
      return game;
    },
  },
  {
    id: "picky_eating_liege",
    description:
      "Picky Eater Liege. There is some food that the town makes that you just really hate. By passing this law, you insist that they sell off that gross food for $1/food every week. You won't make as much food, but you won't have to eat it either.",
    cost: 200,
    weekly_effect: (game: Game) => {
      const farmFoodCount = hasPlotOfType("farm", game).length * 2; // 2 food per farm is the max
      // Between 5% and 15% of all food produced
      const randomFood = Math.floor(
        Math.random() * (0.15 * farmFoodCount - 0.05 * farmFoodCount) +
          0.05 * farmFoodCount,
      );
      game.resources.food -= randomFood;
      game.townInfo.gold += randomFood;
      game.townInfo.happiness = 0.95 * game.townInfo.happiness;
      return game;
    },
  },
  {
    id: "stone_statue",
    description:
      "Stone Statue. You insist that we use ALL of our stone to build a massive statue. We lose all of our stone, but for some reason, the town has perfect health for a while, I guess.",
    cost: 1000,
    weekly_effect: (game: Game) => {
      game.resources.stone = 0;
      game.modifiers.health = 5; // out of 1, so this is crazy high.
      return game;
    },
  },
  {
    id: "out_of_town",
    description:
      "TODO: Out of town. Everyone needs a vacation, right? When this is enacted, EVERYONE must leave the town for 10 days. During this time, no resources are produced, no taxes are collected, and you must take a break from the game.",
    cost: 1000,
    weekly_effect: (game: Game) => {
      // TODO
      return game;
    },
  },
];
