import { Game, UserDatabase } from "$lib/types";

export const default_db: Game = {
  plots: [],
  timeSpent: 0,
  devMode: false,
  lastChangeDay: 0,
  townLog: "",
  currentTutorialStep: 0,
  townInfo: {
    name: "Your town",
    gold: 150,
    population_count: 0,
    population_max: 0,
    employees: 0,
    happiness: 150,
    health: 150,
    community: 150,
    knowledge_points: 0,
    productivity: 100,
  },
  resources: {
    food: 50,
    wood: 300,
    stone: 300,
    metal: 0,
    power: 0,
    bureaucracy: 0,
  },
  resource_rate: {
    food: 0,
    wood: 0,
    stone: 0,
    metal: 0,
    bureaucracy: 0,
    knowledge: 0,
  },
  hasCityHall: false,
  hasBank: false,
  hasHospital: false,
  hasLab: false,
  modifiers: {
    happiness: 1,
    health: 1,
    community: 1,
  },
  economyAndLaws: {
    tax_rate: 0.1,
    max_tax_rate: 1,
    weeklyProfit: 0,
    knowledge_gold_market_rates: [],
  },
  plotCounts: [],
  environment: {
    day: 0,
    year: 1,
  },
  maximums: {
    health: 300,
    happiness: 300,
    community: 300,
  },
  difficulty: 0, // 0 = easy, 1 = medium, 2 = hard
  endGoal: "land",
  endGameDetails: {
    msg: "",
    win: false,
  },
  tick: 0,
  overtime: false,
  last_warning_happiness: 0,
  last_warning_health: 0,
  lab: {
    active_experiment: null,
    past_experiments: [],
    xp: 0,
  },
};

export const default_user_db: UserDatabase = {
  username: "",
  stats: {
    games_played: 0,
    wins: 0,
    losses: 0,
  },
  achievements: [],
};
