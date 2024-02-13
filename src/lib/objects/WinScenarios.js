export const winScenarios = {
	land: {
		short_title: 'Fill the grid',
		description_title:
			'You win by filling up all possible plots in the grid, and by meeting some requirements.',
		win: 'You have filled the grid with buildings. You win!',
		requirements: {
			0: {
				population_count: 200,
				happiness: 100,
				health: 100,
				employment: 1,
			},
			1: {
				population_count: 500,
				happiness: 100,
				health: 100,
				employment: 1,
			},
			2: {
				population_count: 1000,
				happiness: 100,
				health: 100,
				employment: 1,
			},
		},
	},
};
