import { Game, UserDatabase } from '$lib/types';

export const default_db: Game = {
	plots: [],
	timeSpent: 0,
	devMode: false,
	lastChangeDay: 0,
	townLog: '',
	townInfo: {
		name: 'Your town',
		gold: 1000,
		gold_from_tourism: 0,
		population_count: 0,
		population_max: 0,
		employees: 0,
		happiness: 150,
		health: 150,
		knowledge_points: 0,
	},
	hasCityHall: false,
	hasBank: false,
	hasHospital: false,
	hasLab: false,
	modifiers: {
		happiness: 1,
		health: 1,
	},
	economyAndLaws: {
		tax_rate: 0,
		max_tax_rate: 1,
		last_month_profit: 0,
		knowledge_gold_market_rates: [],
	},
	plotCounts: [],
	environment: {
		day: 0,
		year: 1,
		climate: -1,
		// -1 = none (needs to be set), 0 = cold, 1 = average, 2 = hot
	},
	maximums: {
		health: 300,
		happiness: 300,
	},
	difficulty: 0, // 0 = easy, 1 = medium, 2 = hard
	endGoal: 'land',
	endGameDetails: {
		msg: '',
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
	stats: {
		games_played: 0,
		wins: 0,
		losses: 0,
	},
	achievements: [],
};
