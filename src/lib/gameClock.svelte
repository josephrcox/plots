<script>
	import { onMount } from 'svelte';
	import { DB, DATABASE_NAME, paused, speed, clearDB } from './store.js';
	import { messages } from './objects/TownLogMessages.js';
	import { options } from './objects/PlotTypeOptions.js';
	import Plot from './Plot.svelte';
	import { winScenarios } from './objects/WinScenarios.js';

	let z = $DB;

	export function mainGameThreadLoop() {
		if ($paused == false && z.endGameDetails == null && DB != null) {
			z.environment.day += 1;

			// Every 7 days
			if (z.environment.day % 7 == 0) {
				_unemployment();
				_taxRateEffects();
				_calculateProfits();
				_applyModifiers();
				_healthEffects();
				_bringModifiersBackToNormal();
			}
			// Every 30 days
			if (z.environment.day % 30 === 0) {
				_calculateKnowledge();
				_movePeopleInMovePeopleOut();
				_banksEffect();
				_federalGovEffect();
			}
			// Every 90 days
			if (z.environment.day % 90 == 0) {
				_boredom();
				_bringStatsBackToNormal();
			}
			_fixVariables();
			_checkGameLost();
			_checkGameWin();

			DB.set(z);
			localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
		}
	}

	function _checkGameWin() {
		const gameWinScenario = z.endGoal;

		if (gameWinScenario == 'land') {
			// Goal for the user is to fill up every plot, and to have happiness >= 100, health >= 100, and to have a full population.
			if (
				z.townInfo.population_max == z.townInfo.population_count &&
				z.townInfo.happiness >=
					winScenarios.land.requirements[z.difficulty].happiness &&
				z.townInfo.health >=
					winScenarios.land.requirements[z.difficulty].health &&
				z.townInfo.employees / z.townInfo.population_count >=
					winScenarios.land.requirements[z.difficulty].employment
			) {
				// iterate over the plots and see if every single one is filled.
				let allPlotsFilled = true;
				for (let i = 0; i < z.plots.length; i++) {
					for (let j = 0; j < z.plots[i].length; j++) {
						if (z.plots[i][j].active == false) {
							allPlotsFilled = false;
							break;
						}
					}
				}
				if (allPlotsFilled) {
					z.endGameDetails = {
						msg: winScenarios.land.win,
						win: true,
					};
				}
			}
		}
	}

	function _checkGameLost() {
		// GAME LOSS SCENARIOS
		if (z.townInfo.happiness <= 0) {
			z.townInfo.happiness = 0;
			z.endGameDetails = {
				msg: messages.happiness_zero,
				win: false,
			};
		}
		if (z.townInfo.health <= 0) {
			z.townInfo.health = 0;
			z.endGameDetails = {
				msg: messages.health_zero,
				win: false,
			};
		}
		if (z.townInfo.population_count <= 0 && z.townInfo.population_max > 0) {
			z.townInfo.population_count = 0;
			z.endGameDetails = {
				msg: messages.population_zero,
				win: false,
			};
		}
	}

	function _unemployment() {
		let unemployed = z.townInfo.population_count - z.townInfo.employees;
		if (unemployed > 0) {
			z.modifiers.happiness -= unemployed * 0.0009;
			addToTownLog(unemployed + messages.unemployment_num);
		}
	}

	function _banksEffect() {
		let z = $DB;

		// Check if there are any banks and store the count of banks
		if (z.hasBank === true) {
			// TODO
		}
	}

	function _federalGovEffect() {
		let z = $DB;

		if (z.hasCityHall === true) {
			// TODO
		}
	}

	function _healthEffects() {
		let health = z.townInfo.health;
		let peopleLeaving = 0;

		if (health > 50) return;

		if (health < Math.random() * 50) {
			if (health < 25) {
				addToTownLog(messages.sickAndDying);
				z.townInfo.happiness -= 10;
				// 10% of population
				peopleLeaving = Math.round(z.townInfo.population_count * 0.1);
			} else {
				addToTownLog(messages.sickAndLeaving);
				z.townInfo.happiness -= 5;
				// 5%
				peopleLeaving = Math.round(z.townInfo.population_count * 0.05);
			}
			z.townInfo.population_count -= peopleLeaving;
			z.townInfo.employees -= peopleLeaving;
		}
	}

	function _boredom() {
		if (z.lastChangeDay + (Math.random() * 160 + 50) < z.environment.day) {
			if (z.townInfo.population_count > 0) {
				z.townInfo.population_count -= 1;
				z.townInfo.employees -= 1;
				z.modifiers.happiness -= 0.01;
			}

			addToTownLog(messages.bored);
		}
	}

	function _movePeopleInMovePeopleOut() {
		if (z.townInfo.population_count < z.townInfo.population_max) {
			if (z.townInfo.happiness > 50) {
				let availableSpots =
					z.townInfo.population_max - z.townInfo.population_count;
				// add a number of people relative to the happiness where 100 is max happiness
				let newPeople = Math.round(
					(z.townInfo.happiness / 100) * availableSpots,
				);
				z.townInfo.population_count += newPeople;
				if (z.townInfo.population_count > z.townInfo.population_max) {
					z.townInfo.population_count = z.townInfo.population_max;
				}
				// When people arrive, so does employment
				z.townInfo.employees += newPeople;
				if (z.townInfo.employees > z.townInfo.population_count) {
					z.townInfo.employees = z.townInfo.population_count;
				}
				addToTownLog(newPeople + messages.new_people_num);
			}
		}
		if (z.townInfo.happiness < 50 && z.townInfo.population_count > 0) {
			// When the happiness is low, some people should leave
			let unhappyPeople = Math.round((100 - z.townInfo.happiness) / 5);
			z.townInfo.population_count -= unhappyPeople;
			// When people leave, so does employmenet
			if (z.townInfo.employees > 0) {
				z.townInfo.employees -= unhappyPeople;
			}

			addToTownLog(unhappyPeople + messages.leave_town_num);
		} else {
			if (z.townInfo.population_count == z.townInfo.population_max) {
				addToTownLog(messages.people_want_to_move_in);
			}
		}
	}

	function _taxRateEffects() {
		const randomness = Math.random();
		if (z.economy_and_laws.tax_rate > z.economy_and_laws.max_tax_rate) {
			const lenientChance = // higher == more lenient
				z.difficulty == 0 ? 0.7 : z.difficulty == 1 ? 0.4 : 0.2;
			if (randomness < lenientChance) {
				if (z.economy_and_laws.tax_rate > z.economy_and_laws.max_tax_rate * 2) {
					z.modifiers.happiness -= 0.03;
					addToTownLog(
						messages.very_high_tax_rate +
							'  (' +
							z.economy_and_laws.tax_rate +
							'%)',
					);
				} else {
					z.modifiers.happiness -= 0.01;
					addToTownLog(
						messages.high_tax_rate +
							'  (' +
							z.economy_and_laws.tax_rate * 100 +
							'%)',
					);
				}
			} else {
				// No leniency applied
				z.modifiers.happiness -= 0.01;
				addToTownLog(
					messages.high_tax_rate +
						'  (' +
						z.economy_and_laws.tax_rate * 100 +
						'%)',
				);
			}
		}
	}

	export function _fixVariables() {
		if (z.townInfo.happiness < 0) {
			z.townInfo.happiness = 0;
		}
		if (z.townInfo.health < 0) {
			z.townInfo.health = 0;
		}
		if (z.townInfo.gold < 0) {
			z.townInfo.gold = 0;
		}
		if (z.townInfo.employees < 0) {
			z.townInfo.employees = 0;
		}
		if (z.townInfo.knowledge_points < 0) {
			z.townInfo.knowledge_points = 0;
		}
		if (z.townInfo.population_count < 0) {
			z.townInfo.population_count = 0;
		}
		// Recommend building more buildings
		if (z.townInfo.population_max == 0) {
			addToTownLog(messages.nobody_home);
		}
		z.economy_and_laws.lastMonthProfit = roundTo(
			z.economy_and_laws.lastMonthProfit,
			2,
		);

		z.townInfo.gold = roundTo(z.townInfo.gold, 2);
		z.townInfo.population_count = roundTo(z.townInfo.population_count, 0);
		z.townInfo.employees = roundTo(z.townInfo.employees, 0);
		z.townInfo.population_max = roundTo(z.townInfo.population_max, 0);
		z.townInfo.happiness = roundTo(z.townInfo.happiness, 2);
		z.townInfo.health = roundTo(z.townInfo.health, 2);

		if (z.townInfo.happiness > 300) {
			// Maxed out happiness
			z.townInfo.happiness = 300;
		}
		if (z.townInfo.health > 300) {
			// Maxed out health
			z.townInfo.health = 300;
		}
		// If modifiers are below 0.50, set to 0.50
		if (z.modifiers.happiness < 0.5) {
			z.modifiers.happiness = 0.5;
		}
		if (z.modifiers.health < 0.5) {
			z.modifiers.health = 0.5;
		}
	}

	export function _bringModifiersBackToNormal() {
		if (z.modifiers.happiness > 1.0) {
			// check % above 1.0 that z.modifiers.happiness is, and get it 8% closer to 1.0
			let percentAboveOne = z.modifiers.happiness - 1.0;
			z.modifiers.happiness -= percentAboveOne * 0.08;
			if (z.modifiers.happiness < 1.05) {
				z.modifiers.happiness = 1.0;
			}
		}
		if (z.modifiers.health > 1.0) {
			// check % above 1.0 that z.modifiers.health is, and get it 8% closer to 1.0
			let percentAboveOne = z.modifiers.health - 1.0;
			z.modifiers.health -= percentAboveOne * 0.08;
			if (z.modifiers.health < 1.05) {
				z.modifiers.health = 1.0;
			}
		}
	}

	export function _bringStatsBackToNormal() {
		const midpoint = 150;
		if (z.townInfo.happiness > midpoint) {
			// check % above 1.0 that z.modifiers.happiness is, and get it 8% closer to 1.0
			let percentAboveOne = z.townInfo.happiness - midpoint;
			z.townInfo.happiness -= percentAboveOne * 0.08;
			if (z.townInfo.happiness < midpoint) {
				z.townInfo.happiness = midpoint;
			}
		}
		if (z.townInfo.health > midpoint) {
			// check % above 1.0 that z.modifiers.happiness is, and get it 8% closer to 1.0
			let percentAboveOne = z.townInfo.health - midpoint;
			z.townInfo.health -= percentAboveOne * 0.08;
			if (z.townInfo.health < midpoint) {
				z.townInfo.health = midpoint;
			}
		}
	}

	function _calculateProfits() {
		z.economy_and_laws.lastMonthProfit = 0;
		// Calculate profits by checking plots and doing (plot.revenue_per_week * tax_rate)
		for (let i = 0; i < z.plots.length; i++) {
			for (let j = 0; j < z.plots[i].length; j++) {
				if (z.plots[i][j].active == true && z.plots[i][j].type > -1) {
					// Iterate through all plots and do actions based on their conditions
					let plotOptionForPlot = options[z.plots[i][j].type];
					let profit = getProfit(plotOptionForPlot.revenue_per_week);
					z.townInfo.gold += profit;
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

					if (plotOptionForPlot.enables_tourism == true) {
						z.townInfo.gold_from_tourism +=
							plotOptionForPlot.tourism_revenue_per_week *
							z.economy_and_laws.tax_rate *
							z.townInfo.population_count;
					}
				}
			}
		}
	}

	function _applyModifiers() {
		z.townInfo.happiness *= z.modifiers.happiness;
		z.townInfo.health *= z.modifiers.health;
	}

	function _calculateKnowledge() {
		for (let i = 0; i < z.plots.length; i++) {
			for (let j = 0; j < z.plots[i].length; j++) {
				if (z.plots[i][j].active == true && z.plots[i][j].type > -1) {
					let plotOptionForPlot = options[z.plots[i][j].type];
					if (plotOptionForPlot.knowledge_points_per_month != null) {
						z.townInfo.knowledge_points +=
							plotOptionForPlot.knowledge_points_per_month;
					}
				}
			}
		}
	}

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
		let profitModifiers = z.townInfo.happiness / 100;
		if (profitModifiers > 1.25) {
			profitModifiers = 1.25;
		} else if (profitModifiers < 0.75) {
			profitModifiers = 0.75;
		}

		let profit =
			revenue *
			z.economy_and_laws.tax_rate *
			(z.townInfo.population_count / z.townInfo.population_max) *
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
			if (localStorage.reset == 'true') {
				clearDB();
				localStorage.setItem('reset', 'false');
			}
			// call mainGameThreadLoop ever $speed ms
			mainGameThreadLoop();
			await new Promise((r) => setTimeout(r, $speed));
		}
	});
</script>
