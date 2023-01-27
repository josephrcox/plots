<script>
	import { onMount } from 'svelte';
	import { DB, DATABASE_NAME, paused, speed } from './store.js';
	import { messages } from './jsonObjects/TownLogMessages.js';
	import { options } from './jsonObjects/PlotTypeOptions.js';

	export function mainGameThreadLoop() {
		if ($paused == false) {
			let z = $DB;
			z.environment.day += 1;

			// check if day is divisible by 30
			if (z.environment.day % 7 == 0) {
				// Adjust happiness based on unemployment rate
				let unemployed = z.towninfo.population_count - z.towninfo.employees;
				if (unemployed > 0) {
					z.modifiers.happiness -= unemployed * 0.0005;
					addToTownLog(unemployed + messages.unemployment_num);
				}

				// If nothing has happened for a while, lower the happiness modifier due to boredom
				if (z.lastChangeDay + (Math.random() * 365 + 150) < z.environment.day) {
					z.modifiers.happiness = z.modifiers.happiness * 0.9999;
					addToTownLog(messages.bored);
				}

				// Keep happiness a positive number
				if (z.towninfo.happiness < 0) {
					z.towninfo.happiness = 0;
				}
				// Keep health a positive number
				if (z.towninfo.health < 0) {
					z.towninfo.health = 0;
				}

				// Recommend building more buildings
				if (z.towninfo.population_max == 0) {
					addToTownLog(messages.nobody_home);
				}

				// See if we can add new people
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

				// See how many people want to leave the town due to unhappiness.
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

				// Adjust happiness based on tax rate. Lower than 10% is good, 10-20% is neutral, 20-30% is bad, 30%+ is very bad
				if (z.economy_and_laws.tax_rate < 0.1) {
					// do nothing
				} else if (z.economy_and_laws.tax_rate < 0.3) {
					// do nothing
				} else if (z.economy_and_laws.tax_rate < 0.4) {
					z.towninfo.happiness = Math.floor(
						(z.towninfo.happiness -= Math.random() * 2)
					);
					addToTownLog(messages.high_tax_rate);
				} else {
					z.towninfo.happiness = Math.floor(
						(z.towninfo.happiness -= Math.random() * 10)
					);
					addToTownLog(messages.very_high_tax_rate);
				}

				// Calculate profits by checking plots and doing (plot.revenue_per_week * tax_rate)
				for (let i = 0; i < z.plots.length; i++) {
					for (let j = 0; j < z.plots[i].length; j++) {
						if (z.plots[i][j].active == true) {
							let profitModifiers = z.towninfo.happiness / 100;
							if (profitModifiers > 1.25) {
								profitModifiers = 1.25;
							} else if (profitModifiers < 0.75) {
								profitModifiers = 0.75;
							}
							let profitsFromThisPlot =
								(options[z.plots[i][j].type].revenue_per_week *
								z.economy_and_laws.tax_rate) * profitModifiers;

							z.towninfo.gold += roundTo(profitsFromThisPlot, 2);

							// push object to the start of the balance sheet history array instead of the end
							if (profitsFromThisPlot > 0) {
								z.balanceSheetHistory = [
									{
										day: z.environment.day,
										plot: `${i},${j}`,
										profits: roundTo(profitsFromThisPlot, 2),
										balance: Math.round(z.towninfo.gold),
									},
									...z.balanceSheetHistory,
								];
							}
						}
					}
				}

				z.towninfo.gold = Math.round(z.towninfo.gold);
			} else if (z.environment.day % 60 == 0) {
				z.towninfo.happiness = roundTo(
					z.towninfo.happiness * z.modifiers.happiness,
					2
				);
				z.towninfo.health = roundTo(z.towninfo.health * z.modifiers.health, 2);
			}

			DB.set(z);
			localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
		}
	}

	function addToTownLog(message) {
		let z = $DB;
		z.townLog =
			'Day ' + $DB.environment.day + ' - ' + message + '\n' + z.townLog;

		DB.set(z);
		localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
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
