export const default_db = {
	plots: [],
	lastChangeDay: 0,
	towninfo: {
		name: 'Your town',
		gold: 1000,
		population_count: 0,
		population_max: 0,
		employees: 0,
		happiness: 100,
		health: 100,
		total_visitors: 0,
	},
	modifiers: {
		happiness: 1,
		health: 1,
		visitors: 1,
	},
	economy_and_laws: {
		tax_rate: 0,
	},
	plotCounts: [], 
	environment: {
		day: 0,
		year: 1,
		climate: -1,
		// -1 = none (needs to be set), 0 = cold, 1 = average, 2 = hot
	},
	townLog: ""
};
