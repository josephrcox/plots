<script lang="ts">
	import { onMount } from 'svelte';
	import {
		DATABASE_NAME,
		DB,
		modifyPlotMenuOptions
	} from '../store.js';
	import { options } from '../jsonObjects/PlotTypeOptions.js';

	export let x = 0;
	export let y = 0;
	let PlotTypeOptions = options;
	export let tempMessage = '';

	let mounted = false;
	onMount(() => (mounted = true));

	onMount(() => {
		const plotOptions = document.querySelectorAll('.plotOption');
		if ($DB.plots[x][y].type !== -1 && $DB.plots[x][y].type !== -2) {
			plotOptions[$DB.plots[x][y].type].classList.add('active');
			// scroll to the active plot option
			plotOptions[$DB.plots[x][y].type].scrollIntoView({
				behavior: 'smooth',
				block: 'center',
			});
		}
	});

	export function checkIfPlotCanBeUpgraded(x, y) {
		let plot = {
			x: x,
			y: y,
		};

		// the only exception is plot 0,0, which can be upgraded from the start
		if (plot.x === 0 && plot.y === 0) {
			return true;
		}
		// you can only upgrade a plot if it is adjacent to a plot that already is {active:true}.

		const adjacentPlots = [
			{ x: plot.x - 1, y: plot.y },
			{ x: plot.x + 1, y: plot.y },
			{ x: plot.x, y: plot.y - 1 },
			{ x: plot.x, y: plot.y + 1 },
		];
		return adjacentPlots.some((adjacentPlot) => {
			// check if adjacent plot is outside of the 25x25 grid
			if (
				adjacentPlot.x < 0 ||
				adjacentPlot.x > 24 ||
				adjacentPlot.y < 0 ||
				adjacentPlot.y > 24
			) {
				return false;
			}
			const adjacentPlotData = $DB.plots[adjacentPlot.x][adjacentPlot.y];
			return adjacentPlotData.active;
		});
	}

	function close() {
		$modifyPlotMenuOptions.visible = false;
	}

	function clearPlot() {
		const plotOptions = document.querySelectorAll('.plotOption');
		plotOptions.forEach((plotOption) => {
			plotOption.classList.remove('active');
		});
		reverseClear(x, y);
	}

	function choosePlotOption(e) {
		if (e.currentTarget.classList.contains('plotOption')) {
			const plotOptions = document.querySelectorAll('.plotOption');
			plotOptions.forEach((plotOption) => {
				plotOption.classList.remove('active');
			});
			e.currentTarget.classList.add('active');
			const plotOptionIndex = Array.from(plotOptions).indexOf(e.currentTarget);
			purchasePlot(x, y, plotOptionIndex);
		}
	}

	export function canBulldoze(x, y) {
		if (window.location.href.includes('dev=true')) {
			return true;
		}
		// if the plot has zero or one adjacent neighbors (above, below, left, right), it can be bulldozed.
		// if the plot has two or more adjacent neighbors, it cannot be bulldozed.
		let neighbors = 0;
		if (x > 0) {
			if ($DB.plots[x - 1][y].type !== -1) {
				neighbors++;
			}
		}
		if (x < $DB.plots.length - 1) {
			if ($DB.plots[x + 1][y].type !== -1) {
				neighbors++;
			}
		}
		if (y > 0) {
			if ($DB.plots[x][y - 1].type !== -1) {
				neighbors++;
			}
		}
		if (y < $DB.plots[0].length - 1) {
			if ($DB.plots[x][y + 1].type !== -1) {
				neighbors++;
			}
		}
		if (neighbors < 2) {
			return true;
		} else {
			return false;
		}
	}

	export function purchasePlot(x, y, typeIndex) {
		let z = $DB;
		let plotChosen = options[typeIndex];

		// go over requirements
		let requirementsMet = true;
		if (
			plotChosen.requirements.gold > z.towninfo.gold ||
			plotChosen.requirements.employees >
				z.towninfo.population_count - z.towninfo.employees
		) {
			requirementsMet = false;
		}

		if (plotChosen.requirements.size != null && requirementsMet) {
			// Usually, plots only take up one plot. If they specify a size, then they take up at least a 2x2 square.
			// Check if there is room for the larger plot to be placed, and then set the plots around it in the square to be unusable.
			let size = plotChosen.requirements.size;
			let possibleSquares = [];

			for (let i = 0; i < 4; i++) {
				let square = [[x, y]];

				if (i === 0) {
					square.push([x - (size - 1), y - (size - 1)]);
					square.push([x - (size - 1), y]);
					square.push([x, y - (size - 1)]);
				} else if (i === 1) {
					square.push([x, y - (size - 1)]);
					square.push([x + (size - 1), y - (size - 1)]);
					square.push([x + (size - 1), y]);
				} else if (i === 2) {
					square.push([x - (size - 1), y]);
					square.push([x - (size - 1), y + (size - 1)]);
					square.push([x, y + (size - 1)]);
				} else if (i === 3) {
					square.push([x, y + (size - 1)]);
					square.push([x + (size - 1), y + (size - 1)]);
					square.push([x + (size - 1), y]);
				}
				possibleSquares.push(square);
			}

			// Check if any of the possible squares have entirely active==false plots that are within the bounds of the map.
			possibleSquares = possibleSquares.filter((square) => {
				return square.every((plot) => {
					return (
						plot[0] >= 0 &&
						plot[0] <= 24 &&
						plot[1] >= 0 &&
						plot[1] <= 24 &&
						!z.plots[plot[0]][plot[1]].active &&
						checkIfPlotCanBeUpgraded(plot[0], plot[1]) == true
					);
				});
			});
			if (possibleSquares.length === 0) {
				requirementsMet = false;
			} else if (possibleSquares.length > 0) {
				let chosenSquare = possibleSquares[0];
				chosenSquare.forEach((plot) => {
					z.plots[plot[0]][plot[1]].active = true;
					z.plots[plot[0]][plot[1]].type = -2; // This is marking them as unusable.
				});
			}
		}

		if (requirementsMet === true) {
			// Check if the plot is already set to a type. If so, reverse the effects of that type.
			if (z.plots[x][y].type !== -1) {
				reverseClear(x, y);
			}

			tempMessage = '';
			z.plots[x][y].type = typeIndex;
			z.plots[x][y].active = true;
			z.towninfo.gold -= plotChosen.requirements.gold;
			// Immediate variable changes
			z.towninfo.population_count +=
				plotChosen.immediate_variable_changes.population;
			z.towninfo.population_max +=
				plotChosen.immediate_variable_changes.population;
			z.towninfo.happiness += plotChosen.immediate_variable_changes.happiness;
			z.towninfo.health += plotChosen.immediate_variable_changes.health;
			// Effect modifiers
			z.modifiers.happiness = roundTo(
				z.modifiers.happiness * plotChosen.effect_modifiers.happiness,
				2
			);
			z.modifiers.health = roundTo(
				z.modifiers.health * plotChosen.effect_modifiers.health,
				2
			);
			// Employeer modifications
			z.towninfo.employees += plotChosen.requirements.employees;

			// Plot count
			if (
				z.plotCounts[typeIndex] === undefined ||
				z.plotCounts[typeIndex] === null
			) {
				z.plotCounts[typeIndex] = 0;
			}
			z.plotCounts[typeIndex]++;
			z.lastChangeDay = z.environment.day;

			z.economy_and_laws.balanceSheetHistory = [
				{
					day: z.environment.day,
					plot: `${x},${y}`,
					profits: plotChosen.requirements.gold * -1,
					balance: roundTo(z.towninfo.gold, 2),
				},
				...z.economy_and_laws.balanceSheetHistory,
			];

			DB.set(z);
			localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
		} else {
			tempMessage = 'You do not have enough resources to purchase this plot.';
			const plotOptions = document.querySelectorAll('.plotOption');
			plotOptions.forEach((plotOption) => {
				plotOption.classList.remove('active');
			});
		}
	}

	export function reverseClear(x, y) {
		let z = $DB;
		let oldPlotType = z.plots[x][y].type;
		z.plots[x][y].type = -1;
		z.plots[x][y].active = false;

		if (oldPlotType !== -2) {
			// Immediate variable changes
			z.towninfo.population_count -=
				options[oldPlotType].immediate_variable_changes.population;
			z.towninfo.population_max -=
				options[oldPlotType].immediate_variable_changes.population;
			z.towninfo.happiness -=
				options[oldPlotType].immediate_variable_changes.happiness;
			z.towninfo.health -=
				options[oldPlotType].immediate_variable_changes.health;
			// Effect modifiers
			z.modifiers.happiness = roundTo(
				z.modifiers.happiness / options[oldPlotType].effect_modifiers.happiness,
				2
			);
			z.modifiers.health = roundTo(
				z.modifiers.health / options[oldPlotType].effect_modifiers.health,
				2
			);
			// Employeer modifications
			z.towninfo.employees -= options[oldPlotType].requirements.employees;

			if (
				z.plotCounts[oldPlotType] === undefined ||
				z.plotCounts[oldPlotType] === null
			) {
				z.plotCounts[oldPlotType] = 0;
			}
			z.plotCounts[oldPlotType]--;
		}

		z.lastChangeDay = z.environment.day;
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

	// Function to change 1.2 to 1.20
	function formatNumber(n) {
		return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
	}

	function checkIfAffordable(plotChosen) {
		let z = $DB;
		let requirementsMet = true;
		if (plotChosen.requirements.gold > z.towninfo.gold) {
			requirementsMet = false;
		}
		let availableEmployees = z.towninfo.employees - z.towninfo.population_count;
		if (plotChosen.requirements.employees > availableEmployees) {
			requirementsMet = false;
		}
		if (plotChosen.requirements.knowledge !== undefined) {
			if (plotChosen.requirements.knowledge > z.towninfo.knowledge) {
				requirementsMet = false;
			}
		}
		return requirementsMet;
	}
</script>

<div class="dialog">
	<div class="dialog-content">
		<div class="header">
			<div>
				left side placeholder
			</div>
			<div>
				<span class="heading_m">Modify plot: {y}, {x}</span>
				{#if tempMessage !== ''}
					<div class="message">{tempMessage}</div>
				{/if}
			</div>
			<div>
				{#if $DB.plots[x][y].type !== -1 && canBulldoze(y, x)}
					<button on:click={clearPlot} id="bulldoze">🔥</button>
				{/if}
				<button on:click={close} id="close">Close</button>
			</div>
		</div>
		<div class="scrollable-y">
			<label for="plotType">Plot options</label>
			<br />
			<div class="plotOptions">
				{#each PlotTypeOptions as option (option)}
					<!-- Sort the options to show affordable ones first -->
					{#if true}
						<div
							class="plotOption background-lightgray"
							data-active={option.selected}
							on:click={choosePlotOption}
						>
							<div>
								<span class="heading_m">{option.title}</span>
								<br />
								<span class="subheading_m">{option.subtitle}</span>
								<br />
								<span class="text_s">{option.description}</span>
							</div>

							<div class="bottom">
								{#if option.revenue_per_week > 0}
									<div class="profits">
										<span class="subheading_m">Profits</span>
										<br />
										<span class="text_s gold"
											><span class="strikethrough"
												>{option.revenue_per_week}</span
											>
											{roundTo(
												$DB.economy_and_laws.tax_rate * option.revenue_per_week,
												2
											)} gold (with tax rate)</span
										>
									</div>
								{/if}
								<div class="reqs_and_mods">
									<div>
										<span class="subheading_m">Requirements</span>
										<br />
										{#if option.requirements.gold !== 0}
											{#if $DB.towninfo.gold < option.requirements.gold}
												<span class="red text_s cost_label "
													>{option.requirements.gold} gold</span
												>
											{:else}
												<span class="text_s cost_label"
													>{option.requirements.gold} gold</span
												>
											{/if}
											<br />
										{/if}

										{#if option.requirements.employees !== 0}
											{#if $DB.towninfo.population_count - $DB.towninfo.employees < option.requirements.employees}
												<span class="text_s cost_label red"
													>{option.requirements.employees} employees
												</span>
											{:else}
												<span class="text_s cost_label"
													>{option.requirements.employees} employees
												</span>
											{/if}
											<br />
										{/if}

										{#if option.requirements.knowledge != null && option.requirements.knowledge !== 0}
											{#if $DB.towninfo.knowledge_points < option.requirements.knowledge}
												<span class="text_s cost_label red"
													>{option.requirements.knowledge} knowledge
												</span>
											{:else}
												<span class="text_s cost_label"
													>{option.requirements.knowledge} knowledge
												</span>
											{/if}
											<br />
										{/if}
									</div>
									<div>
										<span class="subheading_m">Effects (multiplier)</span>
										<br />
										<!-- {JSON.stringify(option.effect_modifiers)} -->
										{#if option.effect_modifiers.happiness == 1.0}
											<span class="text_s" data-positive="true"
												>Happiness: no effect</span
											>
										{:else}
											<span
												class="text_s"
												data-positive={option.effect_modifiers.happiness >= 1}
												>Happiness: {formatNumber(
													option.effect_modifiers.happiness
												)}</span
											>
										{/if}
										<br />
										{#if option.effect_modifiers.health == 1.0}
											<span class="text_s" data-positive="true"
												>Health: no effect</span
											>
										{:else}
											<span
												class="text_s"
												data-positive={option.effect_modifiers.health >= 1}
												>Health: {formatNumber(
													option.effect_modifiers.health
												)}</span
											>
										{/if}
									</div>
								</div>
								{#if option.immediate_variable_changes.happiness !== 0 || option.immediate_variable_changes.health !== 0}
									<div class="immediate_changes">
										<span class="subheading_m"
											>Instant changes:
											{#if option.immediate_variable_changes.happiness !== 0}
												Happiness:
												<span class="green"
													>{option.immediate_variable_changes.happiness}</span
												>
											{/if}
											{#if option.immediate_variable_changes.happiness !== 0 && option.immediate_variable_changes.health !== 0}
												,
											{/if}
											{#if option.immediate_variable_changes.health !== 0}
												Health:
												<span class="green"
													>{option.immediate_variable_changes.health}</span
												>
											{/if}
										</span>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.plotOptions {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-gap: 16px;
	}

	.plotOption {
		border: 1px solid rgb(123, 114, 101);
		width: 14em;
		height: 15em;
		min-width: 12em;
		padding: 5px;
		background-color: rgb(31, 34, 35);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.dialog {
		position: fixed;
		bottom: 0;
		right: 0;
		margin: 1em;
		display: flex;
		z-index: 10;
	}

	.header {
		display: flex;
		flex-direction: row;
		padding-bottom: 10px;
		border-bottom: 1px solid #393939;
		margin-bottom: 10px;
		justify-content: space-between;
		flex: 0 0 25em;
	}

	.header > div {
		display: flex;
		flex-direction: column;
		flex: 30% 0 0;
		text-align: center;
	}

	/* last child on header */
	.header > div:last-child {
		text-align: end;
		display: block;
	}

	#close, #bulldoze {
		width: fit-content;
	}

	.immediate_changes,
	.reqs_and_mods,
	.profits {
		border-top: 1px solid rgb(118, 109, 97);
		padding-top: 2px;
		padding-bottom: 2px;
		padding-left: 3px;
		padding-right: 3px;
	}

	.bottom {
		background-color: rgb(43, 47, 49);
	}

	.dialog-content {
		background: rgb(24, 26, 27);
		padding: 1em;
		border-radius: 0.5em;
		box-shadow: 0 0 10px rgba(45, 35, 35, 0.3);
		height: 547px;
	}

	.scrollable-y {
		overflow-y: scroll;
		height: 95%;
	}

	.dialog-content:hover {
		/* Create inner border 1px black */
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.3), inset 0 0 0 1px black;
	}
	.cost_label {
		color: rgb(114, 255, 114);
		font-size: 14px;
	}
	.reqs_and_mods {
		display: flex;
		justify-content: space-between;
	}
	.reqs_and_mods > div:first-child {
		border-right: 1px solid rgb(118, 109, 97);
		padding-right: 5px;
	}
	.reqs_and_mods > div:nth-child(2) {
		padding-left: 5px;
	}
	.reqs_and_mods > div {
		width: 50%;
	}
	/* data-positive */
	[data-positive='true'] {
		color: rgb(114, 255, 114);
	}
	[data-positive='false'] {
		color: #ff5050;
	}
</style>
