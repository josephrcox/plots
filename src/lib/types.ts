import { CustomAlerts } from "./objects/CustomAlerts";

export type Difficulty = "0" | "1" | "2" | "3";
export type EndGoal = "land" | "free_play";
export type Plot = {
  id: string;
  active: boolean;
  x: number;
  y: number;
  type: number;
  disabled: boolean;
  typeId: string;
  mineralSource: boolean;
  water: boolean;
  snoozedUntil?: number;
};

export type Law = {
  id: string;
  description: string;
  cost: number;
  // returns game
  weekly_effect: (game: Game) => Game;
};

// enum for good, bad, normal
export enum Vibe {
  GOOD,
  BAD,
  NORMAL,
}

export enum Events {
  START_GAME = "start_game",
  BUILD_PLOT = "build_plot",
}

export type TownLog = {
  message: string;
  vibe: Vibe | Vibe.NORMAL;
  day: number;
};

export type Game = {
  gameId: number;
  plots: Plot[][]; // 2d array of plot-like objects that mark what is in each plot.
  timeSpent: number; // in seconds
  currentTutorialStep: number; // Index
  lastChangeDay: number; // when the last change in the town was made.
  townLog: TownLog[];
  gameSettings: string[];
  resource_capacity: number; // for each resource, the maximum amount that can be stored.
  townInfo: {
    name: string;
    gold: number; // you start with 1000, and generally profits go up slowly.
    population_count: number;
    population_max: number;
    employees: number;
    guardians: number;
    happiness: number; // can only go up to maximums.happiness, as it goes down people pay less taxes and leave.
    health: number; // can only go up to maximums.health, as it goes down people die or leave.
    recreation: number;
    community: number; // can go up to maximums.community, as it goes down, the community can have problems.
    knowledge_points: number; // goes up with education plots and with some experiments.
    productivity: number; // from 0 -> 200, def 100, this can be set by the user, and it affects revenue gains and happiness. default 100.
  };
  kingdom_expansions: number;
  resources: {
    food: number;
    wood: number;
    stone: number;
    metal: number;
    power: number;
    bureaucracy: number;
  };
  resource_rate: {
    food: number;
    wood: number;
    stone: number;
    metal: number;
    bureaucracy: number;
    knowledge: number;
  };
  hasCityHall: boolean;
  hasBank: boolean;
  hasHospital: boolean;
  hasLab: boolean;
  modifiers: {
    // May be lower than 1.0 if the town is trending unhappy.
    happiness: number; // default here is 1.0 as every week happiness is multiplied by this. Max here should be <20 but always trends back to 1.0.
    health: number; // default here is 1.0 as every week happiness is multiplied by this. Max here should be <20 but always trends back to 1.0.
    community: number;
  };
  maximums: {
    health: number; // defaults to 300 but can go up or down with experiments.
    happiness: number; // defaults to 300 but can go up or down with experiments.
    community: number;
  };
  economyAndLaws: {
    tax_rate: number; // current tax rate set by user.
    max_tax_rate: number; // the max the town is willing to pay, random each game between 0.2 and 0.6.
    weeklyProfit: number;
    knowledge_gold_market_rates: number[];
    enacted: string[];
  };
  plotCounts: number[];
  environment: {
    // TODO: make this do anything meaningful, currently only using day and year.
    day: number;
    year: number;
  };
  difficulty: number;
  endGoal: EndGoal;
  endGameDetails: {
    msg: string;
    win: boolean;
    still_playing: boolean;
  };
  tick: number;
  overtime: boolean;
  last_warning_happiness: number;
  last_warning_health: number;
  lab: {
    active_experiment: Experiment | null;
    past_experiments: Experiment[];
    xp: number;
  };
  liege_location: [number, number] | null;
};

export type UserDatabase = {
  username: string;
  stats: {
    games_played: number;
    wins: number;
    losses: number;
  };
  // id, day, town name, prize collected.
  achievements: [string, number, string, boolean][];
  selectedGame: number;
  games: string[];
  customAlertsShown: CustomAlerts[];
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  requirements: string;
  icon: string;
  prize: number;
  check: (game: Game) => boolean;
};

export type Experiment = {
  id: string;
  title: string;
  description: string;
  cost: number;
  duration: number; // days
  effect: (game: Game) => Game;
};

export type PlotOption = {
  level: number;
  id: string;
  emoji: string;
  title: string;
  type: string;
  description: string;
  revenue_per_week: number;
  liege_on_plot_hint: null | string;
  requirements: {
    gold: number;
    plots: any[]; // TODO REMOVE THIS, IT'S NOT USED AT ALL.
    employees: number;
    knowledge: number;
    size: number;
    xp: number;
    resources: {
      food: number;
      wood: number;
      stone: number;
      metal: number;
      power: number;
      bureaucracy: number;
    };
    adjacent_plots: string[];
  };
  active_costs: {
    food: number;
    gold: number;
    wood: number;
    stone: number;
    metal: number;
    power: number;
    bureaucracy: number;
  };
  generated_resources: {
    food: number;
    wood: number;
    stone: number;
    metal: number;
    power: number;
    bureaucracy: number;
  };
  knowledge_points_per_month: number;
  purchase_effect_modifiers: {
    happiness: number;
    health: number;
    community: number;
  };
  weekly_effect_modifiers: {
    happiness: number;
    health: number;
    community: number;
  };
  immediate_variable_changes: {
    happiness: number;
    health: number;
    population: number;
    community: number;
    bureaucracy: number;
  };
  styling: string;
  affordable: boolean | null;
  selected: boolean | null;
  check_for_variety: boolean;
};

export type WinScenario = {
  short_title: string;
  description_title: string;
  win: string;
  requirements: {
    [key: string]: {
      population_count: number;
      happiness: number;
      health: number;
      employment: number;
    };
  };
};
