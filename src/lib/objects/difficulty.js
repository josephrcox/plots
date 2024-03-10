// TODO: Put this in a class with other enums
export const difficulty_options = {
	0: 'Easy',
	1: 'Normal',
	2: 'Hard',
};

export const max_tax_rates_based_on_difficulty = {
	// between 0.3 and 0.5
	0: Math.random() * (0.5 - 0.3) + 0.3,
	1: Math.random() * (0.4 - 0.2) + 0.2,
	2: Math.random() * (0.3 - 0.1) + 0.1,
};

export const plotCountMaximums = {
	0: 0.4,
	1: 0.4,
	2: 0.3,
};
