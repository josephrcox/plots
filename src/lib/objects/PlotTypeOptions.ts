import { PlotOption } from "$lib/types";

export const options: PlotOption[] = [
  // Level 1 Plots
  {
    id: "small_homes",
    title: "🏠 Small homes",
    type: "residential",
    description: "+16 people",
    revenue_per_week: 0,
    requirements: {
      gold: 150,
      plots: [],
      employees: 0,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 25,
        stone: 10,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.0,
      health: 1.0,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 16,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 1,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 2,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "grain_farm",
    title: "🌾 Grain farm",
    type: "farm",
    description: "Similar to potato farm",
    revenue_per_week: 6,
    requirements: {
      gold: 150,
      plots: [],
      employees: 2,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 10,
        stone: 15,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.03,
      health: 1.03,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    generated_resources: {
      food: 8,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 1,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
    check_for_variety: false,
  },
  {
    id: "vegetable_farm",
    title: "🥕 Vegetable farm",
    type: "farm",
    description: "Produces food",
    revenue_per_week: 6,
    requirements: {
      gold: 100,
      plots: [],
      employees: 4,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 10,
        stone: 10,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.03,
      health: 1.03,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    generated_resources: {
      food: 5,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 1,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
    check_for_variety: false,
  },
  {
    id: "potato_farm",
    title: "🥔 Potato farm",
    type: "farm",
    description: "Produces more food than vegetable farm",
    requirements: {
      gold: 150,
      plots: [],
      employees: 4,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 20,
        stone: 15,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.03,
      health: 1.03,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    generated_resources: {
      food: 8,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 1,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
    check_for_variety: false,
    revenue_per_week: 8,
  },
  {
    id: "small_park",
    title: "🌲 Small park",
    type: "recreation",
    description: "Makes people happy, costs a small amount",
    revenue_per_week: 0,
    requirements: {
      gold: 190,
      plots: [],
      employees: 1,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 20,
        stone: 3,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.05,
      health: 1.1,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 15,
      health: 15,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 1,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "orchard",
    title: "🍏 Orchard",
    type: "farm",
    description: "Produces food and sugar",
    revenue_per_week: 5,
    requirements: {
      gold: 600,
      plots: [],
      employees: 4,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 50,
        stone: 50,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.1,
      health: 1.2,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 10,
      health: 10,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: true,
    generated_resources: {
      food: 10,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,
      bureaucracy: 0,
    },
    level: 1,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "quarry",
    title: "⛏️ Quarry",
    type: "quarry",
    description: "Produces stone, small amounts of metal",
    revenue_per_week: 0,
    requirements: {
      gold: 420,
      plots: [],
      employees: 6,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 50,
        stone: 0,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.0,
      health: 0.98,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 8,
      metal: 0.2,
      power: 0,

      bureaucracy: 0,
    },
    level: 1,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "tree_farm",
    title: "🌲 Tree Farm",
    type: "farm",
    description: "Produces some wood",
    revenue_per_week: 8,
    requirements: {
      gold: 300,
      plots: [],
      employees: 4,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 0,
        stone: 0,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.0,
      health: 1.0,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    check_for_variety: true,
    tourism_revenue_per_week: 0,
    styling: "",
    affordable: null,
    selected: null,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    generated_resources: {
      food: 0,
      wood: 5,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 1,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "dairy_farm",
    title: "🐄 Dairy farm",
    type: "farm",
    description: "Produces the most revenue but not as much food",
    revenue_per_week: 12,
    requirements: {
      gold: 300,
      plots: [],
      employees: 5,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 20,
        stone: 20,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.1,
      health: 1.05,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    generated_resources: {
      food: 2,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 1,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
    check_for_variety: false,
  },
  {
    id: "bakery",
    title: "🥖 Bakery",
    type: "business",
    description: "Requires sugars, increases happiness",
    revenue_per_week: 23,
    requirements: {
      gold: 300,
      plots: [],
      employees: 3,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 10,
        stone: 10,

        metal: 0,
        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.11,
      health: 0.95,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 25,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    check_for_variety: true,
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 2,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "stables",
    title: "🐴 Stables",
    type: "business",
    description: "Makes money and people happy",
    revenue_per_week: 14,
    requirements: {
      gold: 400,
      plots: [],
      employees: 2,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 120,
        stone: 0,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.05,
      health: 1.02,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 5,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 2,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "church",
    title: "⛪️ Church",
    type: "recreation",
    description: "Just makes people happy",
    revenue_per_week: 0,
    requirements: {
      gold: 500,
      plots: [],
      employees: 0,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 350,
        stone: 0,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.1,
      health: 1.0,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 5,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 2,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      bureaucracy: 0,
    },
  },
  {
    id: "pub",
    title: "🍻 Pub",
    type: "recreation",
    description: "Increases knowledge, happiness, community",
    revenue_per_week: 40,
    knowledge_points_per_month: 1,
    requirements: {
      gold: 500,
      plots: [],
      employees: 12,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 175,
        stone: 50,

        metal: 0,
        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.2,
      health: 0.8,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 10,
      health: -15,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    check_for_variety: true,
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    styling: "",
    affordable: null,
    selected: null,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,
      bureaucracy: 0,
    },
    level: 2,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      bureaucracy: 0,
    },
  },
  {
    id: "village_market",
    title: "🛒 Village Market",
    type: "business",
    description: "Requires wood and stone, makes revenue",
    revenue_per_week: 30,
    requirements: {
      gold: 500,
      plots: [],
      employees: 10,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 50,
        stone: 50,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.05,
      health: 1.0,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 2,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "fishery",
    title: "🐠 Fishery",
    type: "business",
    description: "Produces food, must be on outer edge, requires metal",
    revenue_per_week: 35,
    requirements: {
      gold: 600,
      plots: [],
      employees: 9,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 100,
        stone: 0,

        metal: 10,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.05,
      health: 1.0,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 15,
      health: 8,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    check_for_variety: true,
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    generated_resources: {
      food: 40,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 2,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "neighborhood",
    title: "🏘️ Neighborhood",
    type: "residential",
    description: "+64 people",
    revenue_per_week: 0,
    requirements: {
      gold: 750,
      plots: [],
      employees: 0,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 250,
        stone: 250,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.1,
      health: 1.0,
      community: 1.1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 64,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 2,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "vineyard",
    title: "🍇 Vineyard",
    type: "farm",
    description: "Produces sugars, makes money but hurts health mod",
    revenue_per_week: 40,
    requirements: {
      gold: 800,
      plots: [],
      employees: 6,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 0,
        stone: 0,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.5,
      health: 0.9,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: -10,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,
      bureaucracy: 0,
    },
    level: 3,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "water_wheel",
    title: "💧 Water Wheel",
    type: "industrial",
    description: "Produces small amount of power",
    revenue_per_week: 0,
    requirements: {
      gold: 800,
      plots: [],
      employees: 12,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 200,
        stone: 50,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.0,
      health: 1.0,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 50,

      bureaucracy: 0,
    },
    level: 3,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "park",
    title: "🎪 Park",
    type: "recreation",
    description: "Makes people happier",
    revenue_per_week: 0,
    requirements: {
      gold: 900,
      plots: [],
      employees: 4,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 100,
        stone: 100,

        metal: 20,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.2,
      health: 1.2,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 25,
      health: 20,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 3,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "village_inn",
    title: "🛌 Village Inn",
    type: "tourism",
    description: "Requires wood and stone, makes money",
    revenue_per_week: 23,
    requirements: {
      gold: 1000,
      plots: [],
      employees: 16,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 150,
        stone: 100,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.0,
      health: 1.0,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 10,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 1,
    enables_tourism: true,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 3,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "schoolhouse",
    title: "🏫 Schoolhouse",
    type: "education",
    description: "Produces knowledge, costs money",
    revenue_per_week: 0,
    knowledge_points_per_month: 25,
    requirements: {
      gold: 2000,
      plots: [],
      employees: 20,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 500,
        stone: 100,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.05,
      health: 1.1,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 15,
      health: 3,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 3,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "blacksmith",
    title: "⚒️ Blacksmith",
    type: "business",
    description: "Converts metal to goods, makes money",
    revenue_per_week: 100,
    requirements: {
      gold: 3500,
      plots: [],
      employees: 10,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 250,
        stone: 250,
        metal: 500,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.0,
      health: 1.0,
      community: 0.95,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 3,
    active_costs: {
      gold: 50,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "library",
    title: "📕 Library",
    type: "recreation",
    description: "Produces knowledge and happiness",
    revenue_per_week: 0,
    knowledge_points_per_month: 5,
    requirements: {
      gold: 3500,
      plots: [],
      employees: 6,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 225,
        stone: 100,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.3,
      health: 1.0,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 15,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 3,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "lumber_mill",
    title: "🏭 Lumber Mill",
    type: "industrial",
    description: "Increases wood production by 25%",
    revenue_per_week: 0,
    requirements: {
      gold: 4000,
      plots: [],
      employees: 12,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 300,
        stone: 100,

        metal: 0,

        power: 5,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.0,
      health: 1.0,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 4,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "general_store",
    title: "🛒 General Store",
    type: "business",
    description: "Makes the most money, requires power",
    revenue_per_week: 80,
    requirements: {
      gold: 5000,
      plots: [],
      employees: 24,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 300,
        stone: 200,

        metal: 0,

        power: 5,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.05,
      health: 1.0,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 20,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    check_for_variety: false,
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 4,
    active_costs: {
      gold: 0,
      power: 10,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "healing_house",
    title: "🏥 Healing House",
    type: "medical",
    description: "Raises health, requires wood, stone, metals",
    revenue_per_week: 0,
    knowledge_points_per_month: 0,
    requirements: {
      gold: 10000,
      plots: [],
      employees: 18,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 300,
        stone: 1000,
        metal: 2000,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.25,
      health: 1.5,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 5,
      health: 75,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 3,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "community_center",
    title: "🫶 Community Center",
    type: "recreation",
    description: "Improves community, makes people happier, costs money",
    revenue_per_week: 0,
    requirements: {
      gold: 19000,
      plots: [],
      employees: 12,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 1000,
        stone: 200,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.09,
      health: 1.0,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 50,
      health: 15,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 4,
    active_costs: {
      gold: 0,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "town_hall",
    title: "🗳️ Town Hall",
    type: "federal",
    description:
      "Governing, generates Bureaucracy, costs a lot of money to run",
    revenue_per_week: 0,
    knowledge_points_per_month: 0,
    requirements: {
      gold: 25000,
      plots: [],
      employees: 18,
      knowledge: 500,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 450,
        stone: 450,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 0.92,
      health: 1.0,
      community: 1.1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 10,
    },
    level: 4,
    active_costs: {
      gold: 1000,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "mine",
    title: "⛏️ Mine",
    type: "mine",
    description: "Produces metal and gold, requires power",
    revenue_per_week: 0,
    requirements: {
      gold: 30000,
      plots: [],
      employees: 64,
      knowledge: 0,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 0,
        stone: 1000,

        metal: 50,

        power: 15,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.0,
      health: 1.0,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 16,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    enables_tourism: false,
    knowledge_points_per_month: 0,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 125,
      metal: 10,
      power: 0,

      bureaucracy: 0,
    },
    level: 4,
    active_costs: {
      gold: 0,
      power: 20,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "academy",
    title: "🏫 Academy",
    type: "education",
    description: "Produces a lot of knowledge, requires high population",
    revenue_per_week: 0,
    knowledge_points_per_month: 90,
    requirements: {
      gold: 30000,
      plots: [],
      employees: 32,
      knowledge: 1000,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 1000,
        stone: 1000,

        metal: 0,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 1.0,
      health: 1.0,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 4,
    active_costs: {
      gold: 500,
      power: 0,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "bank",
    title: "🏦 Bank",
    type: "bank",
    description:
      "Rich get richer. Converts tourism gold to gold, knowledge to gold.",
    revenue_per_week: 0,
    knowledge_points_per_month: 0,
    requirements: {
      gold: 75000,
      plots: [],
      employees: 32,
      knowledge: 1000,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 1000,
        stone: 10000,

        metal: 5000,

        power: 0,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 0.8,
      health: 1.0,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 4,
    active_costs: {
      gold: 0,
      power: 75,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
  {
    id: "lab",
    title: "🧪 Laboratory",
    type: "science",
    description: "Designs things to help the city grow",
    revenue_per_week: 0,
    knowledge_points_per_month: 25,
    requirements: {
      gold: 100000,
      plots: [],
      employees: 24,
      knowledge: 10000,
      size: 1,
      xp: 0,
      resources: {
        food: 0,
        wood: 0,
        stone: 1000,

        metal: 3000,

        power: 15,
        bureaucracy: 0,
      },
    },
    effect_modifiers: {
      happiness: 0.98,
      health: 0.99,
      community: 1,
    },
    immediate_variable_changes: {
      happiness: 0,
      health: 0,
      population: 0,
      community: 0,
      bureaucracy: 0,
    },
    tourism_revenue_per_week: 0,
    enables_tourism: false,
    styling: "",
    affordable: null,
    selected: null,
    check_for_variety: false,
    generated_resources: {
      food: 0,
      wood: 0,
      stone: 0,

      metal: 0,
      power: 0,

      bureaucracy: 0,
    },
    level: 4,
    active_costs: {
      gold: 1250,
      power: 75,
      wood: 0,
      stone: 0,

      metal: 0,

      bureaucracy: 0,
    },
  },
];

export const typeColors: any = {
  empty_unusable: "rgba(21, 40, 20, 0.70)",
  empty_buildable: "#CBB827",
  residential: "#de7633",
  farm: "#6b8f49",
  business: "#9273a5",
  recreation: "#5277b1",
  shop: "#d896d8",
  tourism: "#d896d8",
  education: "#BFBEEB",
  medical: "#4a5ba3",
  bank: "#8477be",
  federal: "#8477be",
  science: "#4a5ba3",
  mine: "#d9874a",
  quarry: "#868685",
  industrial: "#868615",
};
export function getColor(typeIndex: number, canBeUpgraded = false) {
  if (typeIndex < 0) {
    if (typeIndex == -1) {
      if (canBeUpgraded) {
        return typeColors["empty_buildable"];
      }
      return typeColors["empty_unusable"];
    } else if (typeIndex == -2) {
      return typeColors["recreation"];
    } else {
      return typeColors["empty_unusable"];
    }
  }
  const plotOption = options[typeIndex];
  return typeColors[plotOption.type];
}
export const plotTypeMaximums: any = {
  lab: 1,
  city_hall: 1,
  bank: 1,
  community_center: 1,
  inn: 1,
};
