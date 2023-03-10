<script>
	import { onMount } from 'svelte';
	import { DB, DATABASE_NAME, paused, speed } from './store.js';
	import { messages } from './jsonObjects/TownLogMessages.js';
	import { options } from './jsonObjects/PlotTypeOptions.js';
	import Plot from './Plot.svelte';

	let z = $DB;

	export function mainGameThreadLoop() {
		if ($paused == false) {
			z.environment.day += 1;

			// Every 7 days
			if (z.environment.day % 7 == 0) {
				_unemployment();
				_movePeopleInMovePeopleOut();
				_taxRateEffects();
				_calculateProfits();
			}
			// Every 30 days
			if (z.environment.day % 30 === 0) {
				_applyModifiers();
				_calculateKnowledge();
			}
			// Every 90 days
			if (z.environment.day % 90 == 0) {
				_boredom();
			}
		}
		_fixVariables();

		DB.set(z);
		localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
	}

	function _unemployment() {
		let unemployed = z.towninfo.population_count - z.towninfo.employees;
		if (unemployed > 0) {
			z.modifiers.happiness -= unemployed * 0.0009;
			addToTownLog(unemployed + messages.unemployment_num);
		}
	}

	function _boredom() {
		if (z.lastChangeDay + (Math.random() * 365 + 365) < z.environment.day) {
			if (z.towninfo.population_count > 0) {
				z.towninfo.population_count -= 1;
				z.towninfo.employees -= 1;
			}

			addToTownLog(messages.bored);
		}
	}

	function _movePeopleInMovePeopleOut() {
		if (z.towninfo.population_count < z.towninfo.population_max) {
			if (z.towninfo.happiness > 50) {
				let availableSpots =
					z.towninfo.population_max - z.towninfo.population_count;
				// add a number of people relative to the happiness where 100 is max happiness
				let newPeople = Math.round(
					(z.towninfo.happiness / 100) * availableSpots
				);
				z.towninfo.population_count += newPeople;
				if (z.towninfo.population_count > z.towninfo.population_max) {
					z.towninfo.population_count = z.towninfo.population_max;
				}
				// When people arrive, so does employment
				z.towninfo.employees += newPeople;
				if (z.towninfo.employees > z.towninfo.population_count) {
					z.towninfo.employees = z.towninfo.population_count;
				}
				addToTownLog(newPeople + messages.new_people_num);
			}
		}
		if (z.towninfo.happiness < 50 && z.towninfo.population_count > 0) {
			// When the happiness is low, some people should leave
			let unhappyPeople = Math.round((100 - z.towninfo.happiness) / 5);
			z.towninfo.population_count -= unhappyPeople;
			// When people leave, so does employmenet
			if (z.towninfo.employees > 0) {
				z.towninfo.employees -= unhappyPeople;
			}

			addToTownLog(unhappyPeople + messages.leave_town_num);
		} else {
			if (z.towninfo.population_count == z.towninfo.population_max) {
				// addToTownLog(messages.people_want_to_move_in);
			}
		}
	}

	function _taxRateEffects() {
		if (z.economy_and_laws.tax_rate > z.economy_and_laws.max_tax_rate) {
			if (z.economy_and_laws.tax_rate > z.economy_and_laws.max_tax_rate * 2) {
				z.modifiers.happiness -= 0.03;
				addToTownLog(
					messages.very_high_tax_rate +
						'  (' +
						z.economy_and_laws.tax_rate +
						'%)'
				);
			} else {
				z.modifiers.happiness -= 0.01;
				addToTownLog(
					messages.high_tax_rate + '  (' + z.economy_and_laws.tax_rate + '%)'
				);
			}
		}
	}

	function _fixVariables() {
		if (z.towninfo.happiness < 0) {
			z.towninfo.happiness = 0;
		}
		if (z.towninfo.health < 0) {
			z.towninfo.health = 0;
		}
		if (z.towninfo.gold < 0) {
			z.towninfo.gold = 0;
		}
		if (z.towninfo.employees < 0) {
			z.towninfo.employees = 0;
		}
		if (z.towninfo.knowledge_points < 0) {
			z.towninfo.knowledge_points = 0;
		}
		if (z.towninfo.population_count < 0) {
			z.towninfo.population_count = 0;
		}
		// Recommend building more buildings
		if (z.towninfo.population_max == 0) {
			addToTownLog(messages.nobody_home);
		}
		z.economy_and_laws.lastMonthProfit = roundTo(
			z.economy_and_laws.lastMonthProfit,
			2
		);

		z.towninfo.gold = roundTo(z.towninfo.gold, 2);
		z.towninfo.population_count = roundTo(z.towninfo.population_count, 0);
		z.towninfo.employees = roundTo(z.towninfo.employees, 0);
		z.towninfo.population_max = roundTo(z.towninfo.population_max, 0);
		z.towninfo.happiness = roundTo(z.towninfo.happiness, 2);
		z.towninfo.health = roundTo(z.towninfo.health, 2);

		if (z.modifiers.happiness > 1.0) {
			z.modifiers.happiness -= 0.05;
			if (z.modifiers.happiness < 1.0) {
				z.modifiers.happiness = 1.0;
			}
		}
		if (z.modifiers.health > 1.0) {
			z.modifiers.health -= 0.05;
			if (z.modifiers.health < 1.0) {
				z.modifiers.health = 1.0;
			}
		}
		if (z.towninfo.happiness > 300) {
			z.towninfo.happiness = 300;
		}
		if (z.towninfo.health > 300) {
			z.towninfo.health = 300;
		}
		// If modifiers are below 0.50, set to 0.50
		if (z.modifiers.happiness < 0.5) {
			z.modifiers.happiness = 0.5;
		}
		if (z.modifiers.health < 0.5) {
			z.modifiers.health = 0.5;
		}
	}

	function _calculateProfits() {
		z.economy_and_laws.lastMonthProfit = 0;
		// Calculate profits by checking plots and doing (plot.revenue_per_week * tax_rate)
		for (let i = 0; i < z.plots.length; i++) {
			for (let j = 0; j < z.plots[i].length; j++) {
				if (z.plots[i][j].active == true && z.plots[i][j].type !== -2) {
					// Iterate through all plots and do actions based on their conditions
					let plotOptionForPlot = options[z.plots[i][j].type];
					let profit = getProfit(plotOptionForPlot.revenue_per_week);
					z.towninfo.gold += profit;
					z.economy_and_laws.lastMonthProfit += profit;

					// push object to the start of the balance sheet history array instead of the end
					if (profit > 0) {
						z.economy_and_laws.balanceSheetHistory = [
							{
								day: z.environment.day,
								plot: `${i},${j}`,
								profits: profit,
								taxRate: z.economy_and_laws.tax_rate,
							},
							...z.economy_and_laws.balanceSheetHistory,
						];
						// If balanceSheetHistory has over 250 items, set to only latest 250 entries
						if (z.economy_and_laws.balanceSheetHistory.length > 250) {
							z.economy_and_laws.balanceSheetHistory =
								z.economy_and_laws.balanceSheetHistory.slice(0, 250);
						}
					}
				}
			}
		}
	}

	function _applyModifiers() {
		z.towninfo.happiness *= z.modifiers.happiness;
		z.towninfo.health *= z.modifiers.health;
	}

	function _calculateKnowledge() {
		for (let i = 0; i < z.plots.length; i++) {
			for (let j = 0; j < z.plots[i].length; j++) {
				if (z.plots[i][j].active == true && z.plots[i][j].type !== -2) {
					let plotOptionForPlot = options[z.plots[i][j].type];
					if (plotOptionForPlot.knowledge_points_per_month != null) {
						z.towninfo.knowledge_points +=
							plotOptionForPlot.knowledge_points_per_month;
					}
				}
			}
		}
	}

	//
	//
	//

	function addToTownLog(message) {
		let z = $DB;
		z.townLog =
			'Day ' + $DB.environment.day + ' - ' + message + '\n' + z.townLog;

		DB.set(z);
		localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
	}

	function getProfit(revenue) {
		// This takes in revenue, and returns the gold profit.
		// Profit is revenue * tax rate * percentage of population out of the max population
		let z = $DB;
		let profitModifiers = z.towninfo.happiness / 100;
		if (profitModifiers > 1.25) {
			profitModifiers = 1.25;
		} else if (profitModifiers < 0.75) {
			profitModifiers = 0.75;
		}

		let profit =
			revenue *
			z.economy_and_laws.tax_rate *
			(z.towninfo.population_count / z.towninfo.population_max) *
			profitModifiers;
		return roundTo(profit, 2);
	}

	function roundTo(n, digits) {
		if (digits === undefined) {
			digits = 0;
		}

		var multiplicator = Math.pow(10, digits);
		n = parseFloat((n * multiplicator).toFixed(11));
		var test = Math.round(n) / multiplicator;
		return +test.toFixed(digits);
	}

	onMount(async () => {
		while (true) {
			// call mainGameThreadLoop ever $speed ms
			mainGameThreadLoop();
			await new Promise((r) => setTimeout(r, $speed));
		}
	});
</script>

<style>
</style>
