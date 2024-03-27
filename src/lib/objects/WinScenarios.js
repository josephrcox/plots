export const winScenarios = {
	land: {
		short_title: 'Fill the grid',
		description_title:
			'You win by filling up all possible plots in the grid, and by meeting some requirements.',
		win: 'You have filled the grid with buildings and met the requirements. Your citizens are happy, fulfilled, hard-working, and healthy. ',
		requirements: {
			0: {
				population_count: 200,
				happiness: 100,
				health: 100,
				employment: 1,
				knowledge: 50,
				required_plots: ['pub', 'small_school', 'community_center'],
			},
			1: {
				population_count: 1000,
				happiness: 120,
				health: 120,
				employment: 1,
				knowledge: 100,
				required_plots: ['bank'],
			},
			2: {
				population_count: 1000,
				happiness: 200,
				health: 200,
				employment: 1,
				knowledge: 1000,
				required_plots: ['bank', 'city_hall'],
			},
		},
	},
	free_play: {
		short_title: 'Free Play',
		description_title:
			'Play for as long as you can and build the best city you can.',
	},
};
