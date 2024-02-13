export const options = [
	{
		id: 'res_small',
		title: '🏠 Residential (small)',
		subtitle: 'for living',
		type: 'residential',
		description: 'A few basic homes that can hold 16 people.',
		revenue_per_week: 0,
		requirements: {
			gold: 150,
			plots: [],
			employees: 0,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.0,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 0,
			health: 0,
			population: 16,
		},
		styling: 'background-color: #e15f00', // residential
	},
	{
		id: 'res_medium',
		title: '🏘️ Residential (medium)',
		subtitle: 'for living',
		type: 'residential',
		description: 'A few high-density buildings that can hold 64 people.',
		revenue_per_week: 0,
		requirements: {
			gold: 500,
			plots: [],
			employees: 0,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.0,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 0,
			health: 0,
			population: 64,
		},
		styling: 'background-color: #e15f00', // residential
	},
	{
		id: 'res_large',
		title: '🏢 Residential (large)',
		subtitle: 'for living',
		type: 'residential',
		description: 'Many high-density buildings that can hold 256 people.',
		revenue_per_week: 0,
		requirements: {
			gold: 1500,
			plots: [],
			employees: 0,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.0,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 0,
			health: 0,
			population: 256,
		},
		styling: 'background-color: #e15f00', // residential
	},
	{
		id: 'cafe',
		title: '☕️ Small café',
		subtitle: 'for recreation & food',
		type: 'food',
		description: 'Great for eating & relaxing, not great for long-term health.',
		revenue_per_week: 12,
		requirements: {
			gold: 100,
			plots: [],
			employees: 16,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.05,
			health: 0.95,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #d24646;', // food
	},
	{
		id: 'carrot_farm',
		title: '🥕 Carrot farm',
		subtitle: 'for farming',
		type: 'farm',
		description: 'Farm for making carrots, makes money by selling them.',
		revenue_per_week: 6,
		requirements: {
			gold: 25,
			plots: [],
			employees: 2,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.05,
			health: 1.1,
		},
		immediate_variable_changes: {
			happiness: 0,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #008000;', // farm
	},
	{
		id: 'apple_orchard', // 'apple_orchard
		title: '🍎 Apple orchard',
		subtitle: 'for farming',
		type: 'farm',
		description:
			'A bunch of trees that make apples, makes money by selling them and by selling apple-related products.',
		revenue_per_week: 8,
		requirements: {
			gold: 50,
			plots: [],
			employees: 4,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.05,
			health: 1.1,
		},
		immediate_variable_changes: {
			happiness: 0,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #008000;', // farm
	},
	{
		id: 'bakery',
		title: '🥖 Bakery',
		subtitle: 'for baking',
		type: 'farm',
		description: 'Makes money by selling bread.',
		revenue_per_week: 12,
		requirements: {
			gold: 100,
			plots: [],
			employees: 3,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.11,
			health: 0.92,
		},
		immediate_variable_changes: {
			happiness: 25,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #008000;', // farm
	},
	{
		id: 'grocery',
		title: '🏪 Grocery store',
		subtitle: 'for living',
		type: 'food',
		description: 'People get hungry. This is where they go to get food.',
		revenue_per_week: 40,
		requirements: {
			gold: 320,
			plots: [],
			employees: 24,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.05,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 15,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #d24646;', // food
	},
	{
		id: 'fishery',
		title: '🐠 Fishery',
		subtitle: 'for fishing',
		type: 'food',
		description:
			'Carve out some land, pour some water, and fish for fun & food.',
		revenue_per_week: 25,
		requirements: {
			gold: 400,
			plots: [],
			employees: 9,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.05,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 15,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #d24646;', // food
	},
	{
		id: 'library',
		title: '📕 Library',
		subtitle: 'for reading',
		type: 'recreation',
		description: "Reading makes people very happy, but doesn't make money.",
		revenue_per_week: 0,
		knowledge_points_per_month: 1,
		requirements: {
			gold: 500,
			plots: [],
			employees: 6,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.2,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 10,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #4169e1;', // recreation
	},
	{
		id: 'pub',
		title: '🍻 Pub',
		subtitle: 'for hanging',
		type: 'recreation',
		description: 'Makes money, and somehow generates communal knowledge.',
		revenue_per_week: 50,
		knowledge_points_per_month: 1,
		requirements: {
			gold: 500,
			plots: [],
			employees: 6,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.2,
			health: 0.7,
		},
		immediate_variable_changes: {
			happiness: 10,
			health: -25,
			population: 0,
		},
		styling: 'background-color: #4169e1;', // recreation
	},
	{
		id: 'church',
		title: '⛪️ Church',
		subtitle: 'for worship & community',
		type: 'recreation',
		description: "This can make some people happy, but doesn't make money.",
		revenue_per_week: 0,
		requirements: {
			gold: 100,
			plots: [],
			employees: 0,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.1,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #4169e1;', // recreation
	},
	{
		id: 'stables',
		title: '🐴 Stables',
		subtitle: 'for friends',
		type: 'recreation',
		description:
			'People love horses. This makes them happy, and can generate some money through lessons.',
		revenue_per_week: 10,
		requirements: {
			gold: 220,
			plots: [],
			employees: 2,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.1,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #4169e1;', // recreation
	},
	{
		id: 'blacksmith',
		title: '⚔️ Blacksmith',
		subtitle: 'for making shiny things',
		type: 'shop',
		description:
			'Sometimes problems can only be dealt with by a hunk of metal. Makes money by selling weapons, tools, & armor.',
		revenue_per_week: 50,
		requirements: {
			gold: 1300,
			plots: [],
			employees: 13,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 0.9,
			health: 1.5,
		},
		immediate_variable_changes: {
			happiness: 0,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #ff00ff;', // shop
	},
	{
		id: 'inn',
		title: '🛌 Village Inn',
		subtitle: 'for a night out',
		type: 'tourism',
		description: 'Generates tourism gold that can be used if you have a bank.',
		revenue_per_week: 0,
		enables_tourism: true,
		tourism_revenue_per_week: 15, // this is per citizen!
		requirements: {
			gold: 1500,
			plots: [],
			employees: 14,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 0.9,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 0,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #ff00ff;', // tourism
	},
	{
		id: 'park_small',
		title: '🌲 Small park',
		subtitle: 'for bringing your dog, or eating a sandwich',
		type: 'recreation',
		description: 'A few benches and a small grassy area.',
		revenue_per_week: 0,
		requirements: {
			gold: 80,
			plots: [],
			employees: 1,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.01,
			health: 1.05,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #ffff00;', // recreation
	},
	{
		id: 'park_medium',
		title: '🛝 Medium park',
		subtitle: 'for bringing your dog, or eating a sandwich',
		type: 'recreation',
		description: 'Benches, grass, and a couple of swingsets.',
		revenue_per_week: 0,
		requirements: {
			gold: 150,
			plots: [],
			employees: 2,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.02,
			health: 1.08,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #ffff00;', // recreation
	},
	{
		id: 'park_large',
		title: '🎪 Large park',
		subtitle: 'for bringing your dog, or eating a sandwich',
		type: 'recreation',
		description:
			'Same as the medium park, with a nice fountain in the middle and occasional events run by the employees.',
		revenue_per_week: 0,
		requirements: {
			gold: 300,
			plots: [],
			employees: 4,
			climate: null,
			size: 2,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.09,
			health: 1.1,
		},
		immediate_variable_changes: {
			happiness: 15,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #ffff00;', // recreation
	},
	{
		id: 'school_small',
		title: '📚 Small school',
		subtitle: 'for learning',
		type: 'education',
		description:
			'A place where children can learn and grow, and where adults can learn new skills. Produces knowledge.',
		revenue_per_week: 0,
		knowledge_points_per_month: 2,
		requirements: {
			gold: 850,
			plots: [],
			employees: 20,
			climate: null,
			size: 1,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.05,
			health: 1.1,
		},
		immediate_variable_changes: {
			happiness: 15,
			health: 3,
			population: 0,
		},
		styling: 'background-color: #4caf50;', // education
	},
	{
		id: 'school_large',
		title: '🚌 Large school',
		subtitle: 'for learning',
		type: 'education',
		description: 'A larger school. Produces knowledge',
		revenue_per_week: 0,
		knowledge_points_per_month: 8,
		requirements: {
			gold: 1300,
			plots: [],
			employees: 40,
			climate: null,
			size: 2,
			knowledge: 10,
		},
		effect_modifiers: {
			happiness: 1.05,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 3,
			population: 0,
		},
		styling: 'background-color: #4caf50;', // education
	},
	{
		id: 'university',
		title: '🏫 University',
		subtitle: 'for learning',
		type: 'education',
		description: 'The supreme learning institution. Produces knowledge.',
		revenue_per_week: 0,
		knowledge_points_per_month: 25,
		requirements: {
			gold: 3500,
			plots: [],
			employees: 64,
			climate: null,
			size: 2,
			knowledge: 100,
		},
		effect_modifiers: {
			happiness: 1.25,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 25,
			health: 25,
			population: 0,
		},
		styling: 'background-color: #4caf50;', // education
	},
	{
		id: 'small_hospital',
		title: '🚑 Small hospital',
		subtitle: 'for healing',
		type: 'medical',
		description: 'A great place to get fixed up from minor injuries.',
		revenue_per_week: 0,
		knowledge_points_per_month: 0,
		requirements: {
			gold: 800,
			plots: [],
			employees: 8,
			climate: null,
			size: 1,
			knowledge: 50,
		},
		effect_modifiers: {
			happiness: 1.25,
			health: 1.5,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 50,
			population: 0,
		},
		styling: 'background-color: #ff0000;', // medical
	},
	{
		id: 'large_hospital',
		title: '🏥 Large hospital',
		subtitle: 'for healing',
		type: 'medical',
		description: 'A great place to get fixed up from all injuries.',
		revenue_per_week: 0,
		knowledge_points_per_month: 0,
		requirements: {
			gold: 4000,
			plots: [],
			employees: 64,
			climate: null,
			size: 1,
			knowledge: 200,
		},
		effect_modifiers: {
			happiness: 1.25,
			health: 2.5,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 75,
			population: 0,
		},
		styling: 'background-color: #ff0000;', // medical
	},
	{
		id: 'bank',
		title: '🏦 Bank',
		subtitle: 'for storing and accessing funds',
		type: 'bank',
		description: 'Rich get richer.',
		revenue_per_week: 0,
		knowledge_points_per_month: 0,
		requirements: {
			gold: 30000,
			plots: [],
			employees: 64,
			climate: null,
			size: 1,
			knowledge: 300,
		},
		effect_modifiers: {
			happiness: 0.8,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 0,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #7b68ee;', // bank
	},
	{
		id: 'city-hall',
		title: '🗳️ City Hall',
		subtitle: 'for bureaucracy',
		type: 'federal',
		description: 'For running the government.',
		revenue_per_week: 0,
		knowledge_points_per_month: 0,
		requirements: {
			gold: 30000,
			plots: [],
			employees: 24,
			climate: null,
			size: 1,
			knowledge: 500,
		},
		effect_modifiers: {
			happiness: 0.8,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 0,
			health: 0,
			population: 0,
		},
		styling: 'background-color: #7b68ee;', // federal
	},
];
