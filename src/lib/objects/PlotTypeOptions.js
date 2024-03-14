export const options = [
	{
		id: 'res_small',
		title: '🏠 Residential (small)',
		subtitle: 'for living',
		type: 'residential',
		description: 'A few basic homes (+16 people)',
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
	},
	{
		id: 'res_medium',
		title: '🏘️ Residential (medium)',
		subtitle: 'for living',
		type: 'residential',
		description: 'Some apartments (+64 people)',
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
	},
	{
		id: 'res_large',
		title: '🏢 Residential (large)',
		subtitle: 'for living',
		type: 'residential',
		description: 'Many apartments (+256 people)',
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
	},
	{
		id: 'carrot_farm',
		title: '🥕 Carrot farm',
		subtitle: 'for farming',
		type: 'farm',
		description: 'Farm for making carrots, makes money by selling them.',
		revenue_per_week: 6,
		requirements: {
			gold: 50,
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
		check_for_variety: true,
	},
	{
		id: 'apple_orchard', // 'apple_orchard
		title: '🍎 Apple orchard',
		subtitle: 'for farming',
		type: 'farm',
		description: 'A bunch of apple trees. Sells apple products.',
		revenue_per_week: 8,
		requirements: {
			gold: 75,
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
		check_for_variety: true,
	},
	{
		id: 'potato_farm',
		title: '🥔 Potato farm',
		subtitle: 'for farming',
		type: 'farm',
		description: 'Easy to farm, sells to local grocery stores and restaurants.',
		revenue_per_week: 9,
		requirements: {
			gold: 75,
			plots: [],
			employees: 2,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.1,
			health: 1.1,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 5,
			population: 0,
		},
		check_for_variety: true,
	},
	{
		id: 'wheat_farm',
		title: '🌾 Wheat farm',
		subtitle: 'for farming',
		type: 'farm',
		description: 'Easy to farm crop',
		revenue_per_week: 6,
		requirements: {
			gold: 140,
			plots: [],
			employees: 4,
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
			population: 0,
		},
		check_for_variety: true,
	},
	{
		id: 'dairy_farm',
		title: '🐮 Dairy farm',
		subtitle: 'for farming',
		type: 'farm',
		description: 'A few cows that produce milk, cheese, and butter.',
		revenue_per_week: 16,
		requirements: {
			gold: 300,
			plots: [],
			employees: 4,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.2,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 5,
			population: 0,
		},
		check_for_variety: true,
	},
	{
		id: 'coffee_bean_farm',
		title: '🫘 Coffee bean farm',
		subtitle: 'for farming',
		type: 'farm',
		description: 'A few coffee plants. Makes money by selling coffee.',
		revenue_per_week: 3,
		requirements: {
			gold: 300,
			plots: [],
			employees: 1,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.2,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 5,
			population: 0,
		},
		check_for_variety: true,
	},
	{
		id: 'cafe',
		title: '☕️ Small café',
		subtitle: 'for recreation & food',
		type: 'food',
		description: 'Great for eating & relaxing, not great for long-term health.',
		revenue_per_week: 48,
		requirements: {
			gold: 300,
			plots: ['coffee_bean_farm', 'bakery', 'dairy_farm'],
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
		check_for_variety: true,
	},
	{
		id: 'bakery',
		title: '🥖 Bakery',
		subtitle: 'for baking',
		type: 'farm',
		description: 'Makes money by selling bread.',
		revenue_per_week: 14,
		requirements: {
			gold: 300,
			plots: ['wheat_farm'],
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
		check_for_variety: true,
	},
	{
		id: 'grocery',
		title: '🏪 Grocery store',
		subtitle: 'for living',
		type: 'food',
		description: 'People get hungry. This is where they go to get food.',
		revenue_per_week: 80,
		requirements: {
			gold: 620,
			plots: ['fishery'],
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
	},
	{
		id: 'fishery',
		title: '🐠 Fishery',
		subtitle: 'for fishing',
		type: 'food',
		description:
			'Carve out some land, pour some water, and fish for fun & food.',
		revenue_per_week: 40,
		requirements: {
			gold: 600,
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
			health: 8,
			population: 0,
		},
		check_for_variety: true,
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
			plots: ['church'],
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
		check_for_variety: true,
	},
	{
		id: 'church',
		title: '⛪️ Church',
		subtitle: 'for worship & community',
		type: 'recreation',
		description: "This can make some people happy, but doesn't make money.",
		revenue_per_week: 0,
		requirements: {
			gold: 500,
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
	},
	{
		id: 'stables',
		title: '🐴 Stables',
		subtitle: 'for friends',
		type: 'recreation',
		description:
			'People love horses. This makes them happy, and can generate some money through lessons.',
		revenue_per_week: 25,
		requirements: {
			gold: 220,
			plots: [],
			employees: 2,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.05,
			health: 1.02,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 0,
			population: 0,
		},
	},
	{
		id: 'blacksmith',
		title: '⚔️ Blacksmith',
		subtitle: 'for making shiny things',
		type: 'shop',
		description:
			'Enables exporting of weapons and armor, and makes money by selling them.',
		revenue_per_week: 150,
		requirements: {
			gold: 2300,
			plots: [],
			employees: 15,
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
			population: 0,
		},
	},
	{
		id: 'vineyard',
		title: '🍇 Vineyard',
		subtitle: '',
		type: 'farm',
		description:
			'Grapes are grown and made into wine. Makes money by selling wine.',
		revenue_per_week: 50,
		requirements: {
			gold: 800,
			plots: [],
			employees: 6,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.5,
			health: 1,
		},
		immediate_variable_changes: {
			happiness: 0,
			health: -10,
			population: 0,
		},
	},
	{
		id: 'inn',
		title: '🛌 Village Inn',
		subtitle: 'for a night out',
		type: 'tourism',
		description: 'Generates tourism gold that can be used if you have a bank.',
		revenue_per_week: 0,
		enables_tourism: true,
		tourism_revenue_per_week: 1, // this is per citizen!
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
			health: 1.07,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 0,
			population: 0,
		},
	},
	{
		id: 'park_medium',
		title: '🛝 Medium park',
		subtitle: 'for bringing your dog, or eating a sandwich',
		type: 'recreation',
		description: 'Benches, grass, and a couple of swing-sets.',
		revenue_per_week: 0,
		requirements: {
			gold: 450,
			plots: [],
			employees: 2,
			climate: null,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.02,
			health: 1.35,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 10,
			population: 0,
		},
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
			gold: 900,
			plots: [],
			employees: 4,
			climate: null,
			size: 2,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.1,
			health: 1.7,
		},
		immediate_variable_changes: {
			happiness: 15,
			health: 15,
			population: 0,
		},
	},
	{
		id: 'community_center',
		title: '🫶 Community Center',
		subtitle: 'for community',
		type: 'recreation',
		description:
			'A place for meeting people, growing community, and hosting events. Required for City Hall.',
		revenue_per_week: 0,
		requirements: {
			gold: 15000,
			plots: ['park_medium', 'inn'],
			employees: 12,
			climate: null,
			size: 1,
			knowledge: 0,
		},
		effect_modifiers: {
			happiness: 1.09,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 50,
			health: 15,
			population: 0,
		},
	},
	{
		id: 'small_school',
		title: '📚 Small school',
		subtitle: 'for learning',
		type: 'education',
		description:
			'A place where children can learn and grow, and where adults can learn new skills. Produces knowledge.',
		revenue_per_week: 0,
		knowledge_points_per_month: 8,
		requirements: {
			gold: 1500,
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
	},
	{
		id: 'large_school',
		title: '🚌 Large school',
		subtitle: 'for learning',
		type: 'education',
		description: 'A larger school. Produces knowledge',
		revenue_per_week: 0,
		knowledge_points_per_month: 26,
		requirements: {
			gold: 15000,
			plots: [],
			employees: 40,
			climate: null,
			size: 2,
			knowledge: 50,
		},
		effect_modifiers: {
			happiness: 1.2,
			health: 1.0,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 3,
			population: 0,
		},
	},
	{
		id: 'university',
		title: '🏫 Large University',
		subtitle: 'for learning',
		type: 'education',
		description: 'The supreme learning institution. Produces knowledge.',
		revenue_per_week: 0,
		knowledge_points_per_month: 300,
		requirements: {
			gold: 80000,
			plots: [],
			employees: 101,
			climate: null,
			size: 2,
			knowledge: 100,
		},
		effect_modifiers: {
			happiness: 1.25,
			health: 0.9,
		},
		immediate_variable_changes: {
			happiness: 25,
			health: 25,
			population: 0,
		},
	},
	{
		id: 'small_hospital',
		title: '😷 Small hospital',
		subtitle: 'for healing',
		type: 'medical',
		description: 'A great place to get fixed up from minor injuries.',
		revenue_per_week: 0,
		knowledge_points_per_month: 0,
		requirements: {
			gold: 10000,
			plots: [],
			employees: 18,
			climate: null,
			size: 1,
			knowledge: 100,
		},
		effect_modifiers: {
			happiness: 1.25,
			health: 1.5,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 75,
			population: 0,
		},
	},
	{
		id: 'large_hospital',
		title: '🏥 Large hospital',
		subtitle: 'for healing',
		type: 'medical',
		description:
			'Heals people and teaches medical students. Produces knowledge.',
		revenue_per_week: 0,
		knowledge_points_per_month: 80,
		requirements: {
			gold: 45000,
			plots: [],
			employees: 90,
			climate: null,
			size: 1,
			knowledge: 250,
		},
		effect_modifiers: {
			happiness: 1.25,
			health: 2.5,
		},
		immediate_variable_changes: {
			happiness: 5,
			health: 150,
			population: 0,
		},
	},
	{
		id: 'bank',
		title: '🏦 Bank',
		subtitle: 'for storing and accessing funds',
		type: 'bank',
		description: `Rich get richer.
			<ul>
				<li>Enables converting tourism gold to gold</li>
				<li>Enables converting knowledge to gold (TODO)</li>
			</ul>`,
		revenue_per_week: 0,
		knowledge_points_per_month: 0,
		requirements: {
			gold: 20000,
			plots: ['blacksmith', 'vineyard'],
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
	},
	{
		id: 'city_hall',
		title: '🗳️ City Hall',
		subtitle: 'for bureaucracy',
		type: 'federal',
		description:
			'Enables the control of citizens through laws, taxes, and wealthy men.',
		revenue_per_week: 0,
		knowledge_points_per_month: 0,
		requirements: {
			gold: 50000,
			plots: ['community_center', 'small_school'],
			employees: 48,
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
	},
	{
		id: 'lab',
		title: '🧑‍🔬 Laboratory',
		subtitle: '',
		type: 'science',
		description:
			'Design things that can help your city grow. Experiments can cause unexpected situations. Possibly can generate revenue or knowledge.',
		revenue_per_week: 0,
		knowledge_points_per_month: 0,
		requirements: {
			gold: 100000,
			plots: ['community_center', 'university'],
			employees: 24,
			climate: null,
			size: 1,
			knowledge: 500,
		},
		effect_modifiers: {
			happiness: 0.95,
			health: 0.95,
		},
		immediate_variable_changes: {
			happiness: 0,
			health: 0,
			population: 0,
		},
	},
];

export const typeColors = {
	// dark blue
	empty_unusable: 'rgb(21 28 41);',
	empty_buildable: 'rgb(126, 158, 255)',
	residential: '#e15f00',
	farm: '#519c1f',
	food: '#b55959',
	recreation: '#4070ff',
	shop: '#ff00ff',
	tourism: '#ff00ff',
	education: 'rgba(42, 62, 250, 0.9)',
	medical: '#ff0000',
	bank: '#7b68ee',
	federal: '#7b68ee',
	science: 'rgba(42, 62, 250, 0.9)',
};

export function getColor(typeIndex, canBeUpgraded = false) {
	if (typeIndex < 0) {
		if (typeIndex == -1) {
			if (canBeUpgraded) {
				return typeColors['empty_buildable'];
			}
			return typeColors['empty'];
		} else if (typeIndex == -2) {
			return typeColors['recreation'];
		} else {
			console.log(typeIndex);
			return typeColors['empty'];
		}
	}
	const plotOption = options[typeIndex];
	return typeColors[plotOption.type];
}
