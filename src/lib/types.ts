export type Difficulty = '0' | '1' | '2' | '3';
export type EndGoal = 'land';
export type Plot = {
	id: string;
	active: boolean;
	x: number;
	y: number;
	type: number;
};

export type Game = {
	plots: Plot[][]; // 2d array of plot-like objects that mark what is in each plot.
	timeSpent: number; // in seconds
	devMode: boolean;
	lastChangeDay: number; // when the last change in the town was made.
	townLog: string;
	townInfo: {
		name: string;
		gold: number; // you start with 1000, and generally profits go up slowly.
		gold_from_tourism: number; // you start with 0, and this goes up with a village inn or with general other tourism plots.
		population_count: number;
		population_max: number;
		employees: number;
		happiness: number; // can only go up to maximums.happiness, as it goes down people pay less taxes and leave.
		health: number; // can only go up to maximums.happiness, as it goes down people die or leave.
		knowledge_points: number; // goes up with education plots and with some experiments.
	};
	hasCityHall: boolean;
	hasBank: boolean;
	hasHospital: boolean;
	hasLab: boolean;
	modifiers: {
		// May be lower than 1.0 if the town is trending unhappy.
		happiness: number; // default here is 1.0 as every week happiness is multiplied by this. Max here should be <20 but always trends back to 1.0.
		health: number; // default here is 1.0 as every week happiness is multiplied by this. Max here should be <20 but always trends back to 1.0.
	};
	maximums: {
		health: number; // defaults to 300 but can go up or down with experiments.
		happiness: number; // defaults to 300 but can go up or down with experiments.
	};
	economyAndLaws: {
		tax_rate: number; // current tax rate set by user.
		max_tax_rate: number; // the max the town is willing to pay, random each game between 0.2 and 0.6.
		last_month_profit: number;
		knowledge_gold_market_rates: number[];
	};
	plotCounts: [][];
	environment: {
		// TODO: make this do anything meaningful, currently only using day and year.
		day: number;
		year: number;
		climate: number;
	};
	difficulty: number;
	endGoal: EndGoal;
	endGameDetails: {
		msg: string;
		win: boolean;
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
};

export type Experiment = {
	id: string;
	title: string;
	description: string;
	cost: number;
	duration: number; // days
	effect: boolean; // whether it has an effect or not
};

export type PlotOption = {
	id: string;
	title: string;
	type: string;
	description: string;
	revenue_per_week: number;
	tourism_revenue_per_week: number;
	requirements: {
		gold: number;
		plots: any[];
		employees: number;
		climate: number | null;
		knowledge: number;
	};
	effect_modifiers: {
		happiness: number;
		health: number;
	};
	immediate_variable_changes: {
		happiness: number;
		health: number;
		population: number;
	};
	styling: string;
	affordable: boolean | null;
	selected: boolean | null;
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
