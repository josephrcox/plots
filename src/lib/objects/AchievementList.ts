import { Achievement, Game } from "$lib/types";
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
    prize: 15000,
  },
  {
    id: "10k",
    title: "💰 10,000",
    description: "",
    requirements: "10,000 gold in the bank in one of your towns",
    icon: "💸",
    check: (z: Game) => z.townInfo.gold >= 10000,
    prize: 2500,
  },
  {
    id: "50k",
    title: "💰 50,000",
    description: "",
    requirements: "50,000 gold in the bank in one of your towns",
    icon: "💸",
    check: (z: Game) => z.townInfo.gold >= 50000,
    prize: 10000,
  },
  {
    id: "250k",
    title: "💰 250,000",
    description: "",
    requirements: "250,000 gold in the bank in one of your towns",
    icon: "💸",
    check: (z: Game) => z.townInfo.gold >= 250000,
    prize: 50000,
  },
  // same as above but with a million

  {
    id: "1m",
    title: "💰 1,000,000",
    description: "",
    requirements: "1,000,000 gold in the bank in one of your towns",
    icon: "💸",
    check: (z: Game) => z.townInfo.gold >= 1000000,
    prize: 150000,
  },
  {
    id: "10m",
    title: "💰 10,000,000",
    description: "",
    requirements: "10,000,000 gold in the bank in one of your towns",
    icon: "💸",
    check: (z: Game) => z.townInfo.gold >= 10000000,
    prize: 500000,
  },
  {
    id: "stayin_frugal",
    title: "Stayin' Frugal!",
    description: "",
    requirements: "Gold under 50 with >=200 population in one of your towns",
    icon: "🚲",
    check: (z: Game) => {
      return z.townInfo.gold <= 50 && z.townInfo.population_count >= 200;
    },
    prize: 10000,
  },
  {
    id: "profits_to_the_moon",
    title: "Profits to the moon!",
    description: "Now you're making dough!",
    requirements: "Reach a monthly profit of $10,000",
    icon: "🌛",
    check: (z: Game) => {
      return z.economyAndLaws.weeklyProfit * 4 >= 10000;
    },
    prize: 15000,
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
    prize: 10000,
  },
  {
    id: "tax_man",
    title: "Tax man",
    description:
      "Set the tax rate to the absolute max that the town will tolerate.",
    requirements: "",
    icon: "🙃",
    check: (z: Game) => {
      // cleanMax is taking the max tax rate and
      // rounding down to the nearest 0.05 multiple.
      let cleanMax = Math.floor(z.economyAndLaws.max_tax_rate * 20) / 20;
      return z.economyAndLaws.tax_rate === cleanMax;
    },
    prize: 750,
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
    prize: 10000,
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
    prize: 30000,
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
    prize: 15000,
  },

  {
    id: "pub_knowledge",
    title: "Street smartz",
    description: "You get 250 knowledge without building a school or library.",
    requirements: "Knowledge >= 250 without building a school or library",
    icon: "🤓",
    check: (z: Game) => {
      return (
        hasPlotOfType("small_school", z).length === 0 &&
        hasPlotOfType("large_school", z).length === 0 &&
        hasPlotOfType("library", z).length === 0 &&
        z.townInfo.knowledge_points >= 250
      );
    },
    prize: 50000,
  },
];
