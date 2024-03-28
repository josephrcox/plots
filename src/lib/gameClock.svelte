<script>
	import { onMount } from 'svelte';
	import {
		DB,
		ACTIVE_GAME_DB_NAME,
		paused,
		speed,
		clearDB,
		hasPlotOfType,
		userDB,
		USER_DB_NAME,
	} from './store.ts';
	import { messages } from './objects/TownLogMessages.js';
	import { options } from './objects/PlotTypeOptions';
	import { winScenarios } from './objects/WinScenarios.js';
	import { plotCountMaximums } from './objects/difficulty.js';
	import { achievements } from './objects/AchievementList.ts';

	let z = $DB;
	const GAME_TICK_SPEED = 30;

	function performWeeklyTasks(db) {
		db = _unemployment(db);
		db = _taxRateEffects(db);
		db = _calculateProfits(db);
		db = _applyModifiers(db);
		db = _healthEffects(db); //////////
		db = _bringModifiersBackToNormal(db);
		db = _checkSpecialPlots(db);
		db = _adjustKnowledgeGoldMarketRates(db);
		db = _warnUser(db);
		return db;
	}

	function performMonthlyTasks(db) {
		db = _calculateKnowledge(db);
		db = _banksEffect(db);
		db = _federalGovEffect(db);

		return db;
	}

	function performQuarterlyTasks(db) {
		db = _boredom(db);
		db = _bringStatsBackToNormal(db);
		db = _movePeopleInMovePeopleOut(db);
		db = _checkPlotCountForEffect(db);
		return db;
	}

	function checkGameStatus(db) {
		db = _fixVariables(db);
		db = _checkExperiment(db);
		if (db.overtime == false) {
			db = _checkGameLost(db);
			db = _checkGameWin(db);
		}
		db = _checkForAchievements(db);
		return db;
	}

	export function mainGameThreadLoop() {
		DB.update((currentDB) => {
			if (currentDB == null) {
				return currentDB;
			}
			currentDB.tick++;
			if (currentDB.tick % GAME_TICK_SPEED !== 0) {
				return currentDB;
			}
			if (
				$paused ||
				!currentDB ||
				(currentDB.endGameDetails.msg !== '' && currentDB.overtime == false) ||
				currentDB.townInfo.population_count <= 0
			) {
				return currentDB;
			}

			try {
				currentDB.environment.day += 1;

				// Weekly, Monthly, Quarterly tasks
				if (currentDB.environment.day % 7 === 0) {
					currentDB = performWeeklyTasks(currentDB);
				}
				if (currentDB.environment.day % 30 === 0) {
					currentDB = performMonthlyTasks(currentDB);
				}
				if (currentDB.environment.day % 90 === 0) {
					currentDB = performQuarterlyTasks(currentDB);
				}
				if (window.location.search.includes('debug=true')) {
					console.log(currentDB);
				}

				currentDB = checkGameStatus(currentDB);
				return currentDB;
			} catch (error) {
				console.error('Error in game loop:', error);
				return currentDB; // Returning the current state in case of an error
			}
		});
	}

	DB.subscribe((currentDB) => {
		if (currentDB) {
			localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(currentDB));
		}
	});
	userDB.subscribe((currentDB) => {
		if (currentDB) {
			localStorage.setItem(USER_DB_NAME, JSON.stringify(currentDB));
		}
	});

	function _checkSpecialPlots(z) {
		// this function checks and updates if the city has a bank, hospital, and city hall
		let hasBank = false;
		let hasHospital = false;
		let hasCityHall = false;
		let hasLab = false;

		for (let i = 0; i < z.plots.length; i++) {
			for (let j = 0; j < z.plots[i].length; j++) {
				if (z.plots[i][j].active == true && z.plots[i][j].type > -1) {
					let plotOptionForPlot = options[z.plots[i][j].type].id;
					if (plotOptionForPlot == 'bank') {
						hasBank = true;
					}
					if (plotOptionForPlot == 'city_hall') {
						hasCityHall = true;
					}
					if (
						plotOptionForPlot == 'small_hospital' ||
						plotOptionForPlot == 'large_hospital'
					) {
						hasHospital = true;
					}
					if (plotOptionForPlot == 'lab') {
						hasLab = true;
					}
				}
			}
		}
		z.hasBank = hasBank;
		z.hasHospital = hasHospital;
		z.hasCityHall = hasCityHall;
		z.hasLab = hasLab;
		return z;
	}

	function _isAllPlotsFilled(z) {
		let result = true;
		for (let i = 0; i < z.plots.length; i++) {
			for (let j = 0; j < z.plots[i].length; j++) {
				if (z.plots[i][j].active == false) {
					result = false;
					break;
				}
			}
		}
		return result;
	}

	function _warnUser(z) {
		if (z.endGameDetails != null) {
			return z;
		}
		// if happiness or health is lower than 25, then warn the user via an alert. change z.last_warning_happiness and for health to the day triggered and only show if it hasn't been shown in 90 days
		if (z.townInfo.happiness < 70) {
			if (z.last_warning_happiness + 365 < z.environment.day) {
				alert(
					'Your citizens are very unhappy. You should do something about it.',
				);
				z.last_warning_happiness = z.environment.day;
			}
		}
		if (z.townInfo.health < 70) {
			if (z.last_warning_health + 365 < z.environment.day) {
				alert(
					'Your citizens are very unhealthy. You should do something about it.',
				);
				z.last_warning_health = z.environment.day;
			}
		}
		return z;
	}

	function _checkGameWin(z) {
		const gameWinScenario = z.endGoal;

		if (gameWinScenario == 'land') {
			let allPlotsFilled = true;
			if (
				z.townInfo.population_max == z.townInfo.population_count &&
				z.townInfo.happiness >=
					winScenarios.land.requirements[z.difficulty].happiness &&
				z.townInfo.health >=
					winScenarios.land.requirements[z.difficulty].health &&
				z.townInfo.employees / z.townInfo.population_count >=
					winScenarios.land.requirements[z.difficulty].employment &&
				z.townInfo.population_count >
					winScenarios.land.requirements[z.difficulty].population_count &&
				z.townInfo.knowledge_points >=
					winScenarios.land.requirements[z.difficulty].knowledge
			) {
				let hasRequiredPlots = true;
				for (
					let i = 0;
					i <
					winScenarios.land.requirements[z.difficulty].required_plots.length;
					i++
				) {
					let plotId =
						winScenarios.land.requirements[z.difficulty].required_plots[i];
					if (hasPlotOfType(plotId, z) == false) {
						hasRequiredPlots = false;
						break;
					}
				}
				const allPlotsFilled = _isAllPlotsFilled(z);

				if (allPlotsFilled && hasRequiredPlots) {
					z.endGameDetails = {
						msg: winScenarios.land.win,
						win: true,
						still_playing: false,
					};
				}
			}
		}

		return z;
	}

	function _checkForAchievements(z) {
		if (z.devMode) {
			return z;
		}
		let user_db = $userDB;
		for (let i = 0; i < achievements.length; i++) {
			if (
				user_db.achievements.find((a) => a[0] == achievements[i].id) == null
			) {
				if (achievements[i].check(z)) {
					user_db.achievements.push([
						achievements[i].id,
						z.environment.day,
						z.townInfo.name,
					]);
					addToTownLog('🎉 NEW Achievement: ' + achievements[i].title, z);
				}
			}
		}

		userDB.update(() => {
			return user_db;
		});
		return z;
	}

	function _checkGameLost(z) {
		// GAME LOSS SCENARIOS
		if (z.townInfo.happiness <= 3) {
			z.townInfo.happiness = 0;
			z.endGameDetails = {
				msg: messages.happiness_zero,
				win: false,
				still_playing: false,
			};
		}
		if (z.townInfo.health <= 3) {
			z.townInfo.health = 3;
			z.endGameDetails = {
				msg: messages.health_zero,
				win: false,
				still_playing: false,
			};
		}
		if (z.townInfo.population_count <= 0 && z.townInfo.population_max > 0) {
			z.townInfo.population_count = 0;
			z.endGameDetails = {
				msg: messages.population_zero,
				win: false,
				still_playing: false,
			};
		}
		return z;
	}

	function _unemployment(z) {
		let unemployed = z.townInfo.population_count - z.townInfo.employees;
		if (unemployed > 0) {
			z.modifiers.happiness -= unemployed * 0.0004;
			z = addToTownLog(unemployed + messages.unemployment_num, z);
		}
		return z;
	}

	function _banksEffect(z) {
		// Check if there are any banks and store the count of banks
		if (z.hasBank === true) {
			// TODO
		}
		return z;
	}

	function _checkPlotCountForEffect(z) {
		let totalPlotsPlaced = z.plotCounts.reduce((a, b) => a + b, 0);
		let negativeEffect = false;
		let plotCausingNegativeEffect = '';

		for (let i = 0; i < z.plotCounts.length; i++) {
			if (z.plotCounts[i] == null || options[i].check_for_variety != true) {
				continue;
			}

			if (
				z.plotCounts[i] / totalPlotsPlaced >=
				plotCountMaximums[z.difficulty]
			) {
				plotCausingNegativeEffect = options[i].title;

				negativeEffect = true;
			}
		}
		if (negativeEffect) {
			z = addToTownLog(messages.notEnoughVariety, z);
			z.modifiers.happiness * 0.95;
		}

		return z;
	}

	function _federalGovEffect(z) {
		if (z.hasCityHall === true) {
			// TODO
		}
		return z;
	}

	function _healthEffects(z) {
		let health = z.townInfo.health;
		let peopleLeaving = 0;

		if (health > 50) return z;

		if (health < Math.random() * 50) {
			if (health < 25) {
				z = addToTownLog(messages.sickAndDying, z);
				z.townInfo.happiness -= 10;
				// 10% of population
				peopleLeaving = Math.round(z.townInfo.population_count * 0.1);
			} else {
				z = addToTownLog(messages.sickAndLeaving, z);
				z.townInfo.happiness -= 5;
				// 5%
				peopleLeaving = Math.round(z.townInfo.population_count * 0.05);
			}
			z.townInfo.population_count -= peopleLeaving;
			z.townInfo.employees -= peopleLeaving;
		}
		return z;
	}

	function _boredom(z) {
		if (
			z.lastChangeDay + (Math.random() * 500 + 180) < z.environment.day &&
			z.townInfo.population_count > 0
		) {
			if (z.townInfo.population_count > 0) {
				z.townInfo.population_count -= 1;
				z.townInfo.employees -= 1;
				z.modifiers.happiness -= 0.01;
			}

			z = addToTownLog(messages.bored, z);
		}
		return z;
	}

	function _adjustKnowledgeGoldMarketRates(z) {
		let currentRate =
			z.economyAndLaws.knowledge_gold_market_rates[
				z.economyAndLaws.knowledge_gold_market_rates.length - 1
			] || 1;
		const lowerLimit = -100;
		const maxJump = 8;
		const maxChange = 3;

		let randomness = Math.random();
		let changeAmount = Math.random() * maxChange; /////////

		if (randomness < 0.4) {
			let jump = Math.random() * maxJump;
			if (Math.random() < 0.5) {
				currentRate += jump;
			} else {
				currentRate -= jump;
			}
		} else {
			if (Math.random() > 0.5) {
				currentRate += changeAmount;
			} else {
				currentRate -= changeAmount;
			}
		}

		if (currentRate < lowerLimit) {
			currentRate += (Math.random() * changeAmount) / 5;
		}
		// round to whole closest whole, either up or down/////
		currentRate = Math.round(currentRate);

		z.economyAndLaws.knowledge_gold_market_rates = [
			...z.economyAndLaws.knowledge_gold_market_rates,
			currentRate,
		];

		return z;
	}

	function _movePeopleInMovePeopleOut(z) {
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
				z = addToTownLog(newPeople + messages.new_people_num, z);
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

			z = addToTownLog(unhappyPeople + messages.leave_town_num, z);
		} else {
			if (z.townInfo.population_count == z.townInfo.population_max) {
				// z = addToTownLog(messages.people_want_to_move_in, z);
			}
		}
		return z;
	}

	function _taxRateEffects(z) {
		const randomness = Math.random();
		if (
			z.economyAndLaws.tax_rate > z.economyAndLaws.max_tax_rate &&
			z.townInfo.population_count > 0
		) {
			const lenientChance = // higher == more lenient
				z.difficulty == 0 ? 0.7 : z.difficulty == 1 ? 0.4 : 0.2;
			if (randomness < lenientChance) {
				if (z.economyAndLaws.tax_rate > z.economyAndLaws.max_tax_rate * 2) {
					z.modifiers.happiness -= 0.03;
					z = addToTownLog(
						messages.very_high_tax_rate +
							'  (' +
							z.economyAndLaws.tax_rate +
							'%)',
						z,
					);
				} else {
					z.modifiers.happiness -= 0.01;
					z = addToTownLog(
						messages.high_tax_rate +
							'  (' +
							z.economyAndLaws.tax_rate * 100 +
							'%)',
						z,
					);
				}
			} else {
				// No leniency applied
				z.modifiers.happiness -= 0.01;
				z = addToTownLog(
					messages.high_tax_rate +
						'  (' +
						z.economyAndLaws.tax_rate * 100 +
						'%)',
					z,
				);
			}
		}
		return z;
	}

	export function _checkExperiment(z) {
		if (z.lab.active_experiment == null) return z;
		let active = z.lab.active_experiment;
		if (active.duration > 0) {
			z.lab.active_experiment.duration -= 1;
		} else {
		}
		return z;
	}

	export function _fixVariables(z) {
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
			if (z.townLog.indexOf(messages.nobody_home) == -1)
				z = addToTownLog(messages.nobody_home, z);
		}
		z.economyAndLaws.last_month_profit = roundTo(
			z.economyAndLaws.last_month_profit,
			2,
		);
		if (z.townInfo.employees > z.townInfo.population_count) {
			z.townInfo.employees = z.townInfo.population_count;
		}

		z.townInfo.gold = roundTo(z.townInfo.gold, 2);
		z.townInfo.population_count = roundTo(z.townInfo.population_count, 0);
		z.townInfo.employees = roundTo(z.townInfo.employees, 0);
		z.townInfo.population_max = roundTo(z.townInfo.population_max, 0);
		z.townInfo.happiness = roundTo(z.townInfo.happiness, 2);
		z.townInfo.health = roundTo(z.townInfo.health, 2);

		if (z.townInfo.happiness > z.maximums.happiness) {
			// Maxed out happiness
			z.townInfo.happiness = z.maximums.happiness;
		}
		if (z.townInfo.health > z.maximums.health) {
			// Maxed out health
			z.townInfo.health = z.maximums.health;
		}
		// If modifiers are below 0.50, set to 0.50
		if (z.modifiers.happiness < 0.5) {
			z.modifiers.happiness = 0.5;
		}
		if (z.modifiers.health < 0.5) {
			z.modifiers.health = 0.5;
		}
		return z;
	}

	export function _bringModifiersBackToNormal(z) {
		if (z.modifiers.happiness > 1.0) {
			// check % above 1.0 that z.modifiers.happiness is, and get it 8% closer to 1.0
			let percentAboveOne = z.modifiers.happiness - 1.0;
			z.modifiers.happiness -= percentAboveOne * 0.08;
			if (z.modifiers.happiness < 1.05) {
				z.modifiers.happiness = 1.0;
			}
		}
		if (z.modifiers.health > 1.0) {
			if (
				hasPlotOfType('small_hospital', z) ||
				hasPlotOfType('large_hospital', z)
			) {
				if (z.townLog.indexOf(messages.hospital_advantage) == -1) {
					return (z = addToTownLog(messages.hospital_advantage, z));
				}
				let percentAboveOne = z.modifiers.health - 1.0;
				z.modifiers.health -=
					percentAboveOne * hasPlotOfType('large_hospital', z) ? 0.04 : 0.06;
				if (z.modifiers.health < 1.03) {
					z.modifiers.health = 1.0;
				}
			} else {
				let percentAboveOne = z.modifiers.health - 1.0;
				z.modifiers.health -= percentAboveOne * 0.08;
				if (z.modifiers.health < 1.05) {
					z.modifiers.health = 1.0;
				}
			}
		}
		return z;
	}

	export function _bringStatsBackToNormal(z) {
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
		return z;
	}

	function _calculateProfits(z) {
		z.economyAndLaws.last_month_profit = 0;
		// Calculate profits by checking plots and doing (plot.revenue_per_week * tax_rate)
		for (let i = 0; i < z.plots.length; i++) {
			for (let j = 0; j < z.plots[i].length; j++) {
				if (z.plots[i][j].active == true && z.plots[i][j].type > -1) {
					// Iterate through all plots and do actions based on their conditions
					let plotOptionForPlot = options[z.plots[i][j].type];
					let profit = getProfit(plotOptionForPlot.revenue_per_week, z);
					z.townInfo.gold += profit;
					z.economyAndLaws.last_month_profit += profit;

					if (plotOptionForPlot.enables_tourism == true) {
						z.townInfo.gold_from_tourism +=
							plotOptionForPlot.tourism_revenue_per_week *
							z.economyAndLaws.tax_rate *
							z.townInfo.population_count;
					}
				}
			}
		}
		return z;
	}

	function _applyModifiers(z) {
		z.townInfo.happiness *= z.modifiers.happiness;
		z.townInfo.health *= z.modifiers.health;
		return z;
	}

	function _calculateKnowledge(z) {
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
		return z;
	}

	function addToTownLog(message, z) {
		z.townLog =
			'Day ' + $DB.environment.day + ' - ' + message + '\n' + z.townLog;

		return z;
	}

	function getProfit(revenue, z) {
		// This takes in revenue, and returns the gold profit.
		// Profit is revenue * tax rate * percentage of population out of the max population
		let profitModifiers = z.townInfo.happiness / 100;
		if (profitModifiers > 2.25) {
			profitModifiers = 2.25;
		} else if (profitModifiers < 0.75) {
			profitModifiers = 0.75;
		}

		let profit =
			revenue *
			z.economyAndLaws.tax_rate *
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

			mainGameThreadLoop();
			await new Promise((r) => setTimeout(r, $speed / GAME_TICK_SPEED));
		}
	});
</script>
