import { Achievement, Game } from '$lib/types';
import { hasPlotOfType } from '$lib/store';

export const achievements: Achievement[] = [
	{
		id: 'happiness_at_300',
		title: 'Happy Town',
		description: 'One of your towns wins Happiest Town Award!',
		requirements: 'Happiness reaches 300',
		icon: '😍',
		check: (z: Game) => z.townInfo.happiness >= 300,
		prize: 1000,
	},
	{
		id: 'get_educated',
		title: 'Get Educated',
		description: 'The kids are finally able to learn!',
		requirements: 'Build a school or library',
		icon: '📌',
		check: (z: Game) => {
			return (
				hasPlotOfType('small_school', z).length !== 0 ||
				hasPlotOfType('large_school', z).length !== 0 ||
				hasPlotOfType('library', z).length !== 0
			);
		},
		prize: 1850,
	},
	{
		id: '10k',
		title: '$10,000',
		description: '',
		requirements: 'Gold reaches $10,000',
		icon: '﹩',
		check: (z: Game) => z.townInfo.gold >= 10000,
		prize: 2500,
	},
	{
		id: '25k',
		title: '$25,000',
		description: '',
		requirements: 'Gold reaches $25,000',
		icon: '💵',
		check: (z: Game) => z.townInfo.gold >= 25000,
		prize: 7500,
	},
	{
		id: 'stayin_frugal',
		title: "Stayin' Frugal!",
		description: '',
		requirements: 'Gold under $50 with >=300 population',
		icon: '🚲',
		check: (z: Game) => {
			return z.townInfo.gold <= 50 && z.townInfo.population_count >= 300;
		},
		prize: 10000,
	},
	{
		id: 'profits_to_the_moon',
		title: 'Profits to the moon!',
		description: "Now you're making dough!",
		requirements: 'Last month profit is over $10,000',
		icon: '🌛',
		check: (z: Game) => {
			return z.economyAndLaws.last_month_profit >= 10000;
		},
		prize: 15000,
	},
	{
		id: 'happily_dying',
		title: 'Happily Dying!',
		description: 'Not something to be proud of...',
		requirements: 'Happiness > 275, health < 25',
		icon: '🌛',
		check: (z: Game) => {
			return z.townInfo.happiness > 275 && z.townInfo.health < 25;
		},
		prize: 20000,
	},
	{
		id: 'long_game',
		title: 'The Long Game',
		description: 'So are you gonna win anytime soon?',
		requirements: 'Still playing after 10,000 days, without winning. ',
		icon: '🐌',
		check: (z: Game) => {
			return (
				z.endGameDetails.win === false &&
				z.environment.day > 10000 &&
				z.endGameDetails.msg === ''
			);
		},
		prize: 25000,
	},
	{
		id: 'tax_man',
		title: 'Tax man',
		description:
			'Set the tax rate to the absolute max that the town will tolerate.',
		requirements: '',
		icon: '🙃',
		check: (z: Game) => {
			// cleanMax is taking the max tax rate and
			// rounding down to the nearest 0.05 multiple.
			let cleanMax = Math.floor(z.economyAndLaws.max_tax_rate * 20) / 20;
			return z.economyAndLaws.tax_rate === cleanMax;
		},
		prize: 1500,
	},
	{
		id: 'good_job',
		title: 'Good job',
		description:
			"Beat 'Fill the grid' with Normal difficulty in under 3,000 days.",
		requirements: '',
		icon: '👍',
		check: (z: Game) => {
			return (
				z.endGameDetails.win === true &&
				z.environment.day <= 3000 &&
				z.difficulty === 1 &&
				z.endGoal === 'land'
			);
		},
		prize: 10000,
	},
	{
		id: 'great_job',
		title: 'Great job',
		description:
			"Beat 'Fill the grid' with Normal difficulty in under 2,000 days.",
		requirements: '',
		icon: '👏',
		check: (z: Game) => {
			return (
				z.endGameDetails.win === true &&
				z.environment.day <= 2000 &&
				z.difficulty === 1 &&
				z.endGoal === 'land'
			);
		},
		prize: 45000,
	},
	{
		id: 'superb_job',
		title: 'SUPERB job',
		description:
			"Beat 'Fill the grid' with Normal difficulty in under 500 days.",
		requirements: '',
		icon: '👌',
		check: (z: Game) => {
			return (
				z.endGameDetails.win === true &&
				z.environment.day <= 500 &&
				z.difficulty === 1 &&
				z.endGoal === 'land'
			);
		},
		prize: 100000,
	},
	{
		id: '250k',
		title: '$250,000',
		description: '',
		requirements: 'Gold reaches $250,000',
		icon: '💸',
		check: (z: Game) => z.townInfo.gold >= 250000,
		prize: 50000,
	},
	{
		id: 'banker',
		title: 'Banker',
		description: '',
		requirements: 'Build your first bank. ',
		icon: '🏦',
		check: (z: Game) => {
			return hasPlotOfType('bank', z).length !== 0;
		},
		prize: 5000,
	},
	{
		id: 'community',
		title: 'Community Center',
		description: '',
		requirements: 'Build your first community center. ',
		icon: '❤️',
		check: (z: Game) => {
			return hasPlotOfType('community_center', z).length !== 0;
		},
		prize: 10000,
	},
	{
		id: 'tourist_town',
		title: 'Tourist Town',
		description: 'Reach $50,000 in tourism gold without converting to gold.',
		requirements: '',
		icon: '🏝️',
		check: (z: Game) => {
			return z.townInfo.gold_from_tourism >= 50000;
		},
		prize: 50000,
	},
	{
		id: '1m',
		title: 'MILLIONAIRE!',
		description: '',
		requirements: 'Gold reaches $1,000,000',
		icon: '💰',
		check: (z: Game) => z.townInfo.gold >= 1000000,
		prize: 150000,
	},
];
