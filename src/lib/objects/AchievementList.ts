import type { Achievement, Game } from "$lib/types";
import { taxTolerance } from "../tax";
import { hasPlotOfType } from "$lib/store";

export const achievements: Achievement[] = [
  {
    id: "happy_town",
    title: "Happy & Healthy Town",
    description: "",
    requirements: "Happiness and Health at the max in one of your towns",
    icon: "😀",
    check: (z: Game) => {
      return z.townInfo.happiness >= 300 && z.townInfo.health >= 300;
    },
    prize: 1500,
  },
  {
    id: "10k",
    title: "💰 1,000",
    description: "",
    requirements: "1,000 gold in the bank in one of your towns",
    icon: "💸",
    check: (z: Game) => z.townInfo.gold >= 1000,
    prize: 250,
  },
  {
    id: "50k",
    title: "💰 5,000",
    description: "",
    requirements: "5,000 gold in the bank in one of your towns",
    icon: "💸",
    check: (z: Game) => z.townInfo.gold >= 5000,
    prize: 1000,
  },
  {
    id: "250k",
    title: "💰 25,000",
    description: "",
    requirements: "25,000 gold in the bank in one of your towns",
    icon: "💸",
    check: (z: Game) => z.townInfo.gold >= 25000,
    prize: 5000,
  },
  // same as above but with a million

  {
    id: "1m",
    title: "💰 100,000",
    description: "",
    requirements: "100,000 gold in the bank in one of your towns",
    icon: "💸",
    check: (z: Game) => z.townInfo.gold >= 100000,
    prize: 15000,
  },
  {
    id: "10m",
    title: "💰 1,000,000",
    description: "",
    requirements: "1,000,000 gold in the bank in one of your towns",
    icon: "💸",
    check: (z: Game) => z.townInfo.gold >= 1000000,
    prize: 50000,
  },
  {
    id: "stayin_frugal",
    title: "Stayin' Frugal!",
    description: "",
    requirements: "Gold under 5 with >=200 population in one of your towns",
    icon: "🚲",
    check: (z: Game) => {
      return z.townInfo.gold <= 5 && z.townInfo.population_count >= 200;
    },
    prize: 1000,
  },
  {
    id: "profits_to_the_moon",
    title: "Profits to the moon!",
    description: "Now you're making dough!",
    requirements: "Reach a monthly profit of $1,000",
    icon: "🌛",
    check: (z: Game) => {
      return z.economyAndLaws.weeklyProfit * 4 >= 1000;
    },
    prize: 1500,
  },
  {
    id: "happily_dying",
    title: "Happily Dying!",
    description: "Not something to be proud of...",
    requirements: "Happiness > 275, health < 25",
    icon: "🌛",
    check: (z: Game) => {
      return z.townInfo.happiness > 275 && z.townInfo.health < 25;
    },
    prize: 1000,
  },
  {
    id: "tax_man",
    title: "Tax man",
    description:
      "Set the tax rate to the absolute max that the town will tolerate.",
    requirements: "",
    icon: "🙃",
    check: (z: Game) => {
      // The highest 5% step the town currently accepts.
      const cleanMax = Math.floor(taxTolerance(z) * 20) / 20;
      return z.economyAndLaws.tax_rate === cleanMax;
    },
    prize: 75,
  },
  {
    id: "good_job",
    title: "Beat 'Fill the grid' game mode",
    description: "while not in casual mode",
    requirements: "",
    icon: "👍",
    check: (z: Game) => {
      return (
        z.endGameDetails.win === true &&
        z.endGoal === "land" &&
        !z.gameSettings.includes("casual")
      );
    },
    prize: 1000,
  },
  {
    id: "great_job",
    title: "Beat 'Fill the grid' game mode (faster)",
    description: "in under 5 years, while not in casual mode",
    requirements: "",
    icon: "👏",
    check: (z: Game) => {
      return (
        z.endGameDetails.win === true &&
        z.environment.day <= 1825 &&
        z.endGoal === "land" &&
        !z.gameSettings.includes("casual")
      );
    },
    prize: 3000,
  },
  {
    id: "superb_job",
    title: "Beat 'Fill the grid' game mode",
    description: "while in casual mode",
    requirements: "",
    icon: "👌",
    check: (z: Game) => {
      return (
        z.endGameDetails.win === true &&
        z.endGoal === "land" &&
        z.gameSettings.includes("casual")
      );
    },
    prize: 1500,
  },

  {
    id: "pub_knowledge",
    title: "Street smartz",
    description: "You get 25 knowledge without building a school or library.",
    requirements: "Knowledge >= 25 without building a school or library",
    icon: "🤓",
    check: (z: Game) => {
      return (
        hasPlotOfType("small_school", z).length === 0 &&
        hasPlotOfType("large_school", z).length === 0 &&
        hasPlotOfType("library", z).length === 0 &&
        z.townInfo.knowledge_points >= 25
      );
    },
    prize: 5000,
  },
];
