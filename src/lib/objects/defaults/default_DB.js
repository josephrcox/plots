export const default_db = {
	plots: [],
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
	modifiers: {
		happiness: 1,
		health: 1,
	},
	economyAndLaws: {
		tax_rate: 0,
		max_tax_rate: 1,
		balance_sheet_history: [],
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
	difficulty: 0, // 0 = easy, 1 = medium, 2 = hard
	endGoal: 'land',
	endGameDetails: null,
	tick: 0,
	overtime: false,
};
