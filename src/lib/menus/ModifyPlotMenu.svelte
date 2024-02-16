<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { DATABASE_NAME, DB, modifyPlotMenuOptions } from '../store.js';
	import { options } from '../objects/PlotTypeOptions.js';
	import gameClock from '../gameClock.svelte';

	export let x = 0;
	export let y = 0;
	let searchQuery = '';
	let PlotTypeOptions = options;
	export let tooltip = '';
	// let filteredOptions = PlotTypeOptions;

	let searchInput;
	let totalAffordableOptionsCount;

	onMount(async () => {
		await tick(); // Ensures that DOM has been updated
		if (searchInput) {
			searchInput.focus();
		}
	});

	let reactiveOptions = [];

	$: if ($DB) {
		reactiveOptions = PlotTypeOptions.map((option) => ({
			...option,
			affordable: checkIfAffordable(option, $DB),
		}));
	}

	$: reactiveOptions = searchQuery
		? reactiveOptions.filter((option) =>
				option.title.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: reactiveOptions;
	$: totalAffordableOptionsCount = reactiveOptions.filter(
		(option) => option.affordable == true,
	).length;

	function handleInput(event) {
		searchQuery = event.target.value;
		event.stopPropagation(); // This will stop the event from propagating further
	}

	onMount(() => {
		const plotOptions = document.querySelectorAll('.plotOption');
		if ($DB.plots[x][y].type !== -1 && $DB.plots[x][y].type > -1) {
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
			if (
				adjacentPlot.x < 0 ||
				adjacentPlot.x > $DB.plots.length - 1 ||
				adjacentPlot.y < 0 ||
				adjacentPlot.y > $DB.plots.length - 1
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

	function choosePlotOption(id) {
		// make all other options remove class active
		// add active class
		// use purchasePlot
		const plotOptions = document.querySelectorAll('.plotOption');
		plotOptions.forEach((plotOption) => {
			plotOption.classList.remove('active');
		});

		const plotOption = document.querySelector(`[data-plotoptionid="${id}"]`);
		plotOption.classList.add('active');
		purchasePlot(x, y, id);
	}

	export function canBulldoze(x, y) {
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
		if (neighbors <= 4) {
			return true;
		} else {
			return false;
		}
	}

	export function purchasePlot(x, y, typeID) {
		let z = $DB;
		// get the index from the typeID
		const typeIndex = options.findIndex((option) => option.id === typeID);

		let plotChosen = options[typeIndex];

		// go over requirements
		let requirementsMet = true;
		if (
			plotChosen.requirements.gold > z.townInfo.gold ||
			plotChosen.requirements.employees >
				z.townInfo.population_count - z.townInfo.employees
		) {
			requirementsMet = false;
		}

		if (plotChosen.requirements.size != null && requirementsMet) {
			// Usually, plots only take up one plot. If they specify a size, then they take up at least a 2x2 square.
			// Check if there is room for the larger plot to be placed, and then set the plots around it in the square to be unusable.
			let size = plotChosen.requirements.size;
			let possibleSquares = [];
			let isSchool =
				PlotTypeOptions[typeIndex].title.toLowerCase().indexOf('school') != -1;

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
						plot[0] <= z.plots.length - 1 &&
						plot[1] >= 0 &&
						plot[1] <= z.plots.length - 1 &&
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
					z.plots[plot[0]][plot[1]].type = isSchool ? -3 : -2; // This is marking them as unusable.
					z.plots[plot[0]][plot[1]].referencePlot = [x, y];
				});
			}
		}

		if (requirementsMet === true) {
			// Check if the plot is already set to a type. If so, reverse the effects of that type.
			if (z.plots[x][y].type !== -1) {
				reverseClear(x, y);
			}

			tooltip = '';
			z.plots[x][y].type = typeIndex;
			z.plots[x][y].active = true;
			z.plots[x][y].referencePlot = [];
			z.townInfo.gold -= plotChosen.requirements.gold;
			z.townInfo.gold = roundTo(z.townInfo.gold, 2);
			// Immediate variable changes
			z.townInfo.population_count +=
				plotChosen.immediate_variable_changes.population;
			z.townInfo.population_max +=
				plotChosen.immediate_variable_changes.population;
			z.townInfo.happiness += plotChosen.immediate_variable_changes.happiness;
			z.townInfo.health += plotChosen.immediate_variable_changes.health;
			// Effect modifiers
			z.modifiers.happiness = roundTo(
				z.modifiers.happiness * plotChosen.effect_modifiers.happiness,
				2,
			);
			z.modifiers.health = roundTo(
				z.modifiers.health * plotChosen.effect_modifiers.health,
				2,
			);
			// Employeer modifications
			z.townInfo.employees += plotChosen.requirements.employees;

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
					balance: roundTo(z.townInfo.gold, 2),
				},
				...z.economy_and_laws.balanceSheetHistory,
			];

			switch (plotChosen.id) {
				case 'city-hall':
					z.hasCityHall = true;
					break;
				case 'bank':
					z.hasBank = true;
					break;
				default:
					break;
			}

			DB.set(z);
			localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
			// close modal
			$modifyPlotMenuOptions.visible = false;
		} else {
			tooltip = 'You do not have enough resources to purchase this plot.';
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

		if (oldPlotType > -1) {
			// Immediate variable changes
			z.townInfo.population_count -=
				options[oldPlotType].immediate_variable_changes.population;
			z.townInfo.population_max -=
				options[oldPlotType].immediate_variable_changes.population;
			z.townInfo.happiness -=
				options[oldPlotType].immediate_variable_changes.happiness;
			z.townInfo.health -=
				options[oldPlotType].immediate_variable_changes.health;
			// Effect modifiers
			z.modifiers.happiness = roundTo(
				z.modifiers.happiness / options[oldPlotType].effect_modifiers.happiness,
				2,
			);
			z.modifiers.health = roundTo(
				z.modifiers.health / options[oldPlotType].effect_modifiers.health,
				2,
			);
			// Employeer modifications
			z.townInfo.employees -= options[oldPlotType].requirements.employees;

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

	function checkIfAffordable(plotChosen, z) {
		let requirementsMet = true;

		if (plotChosen.requirements.gold > z.townInfo.gold) {
			requirementsMet = false;
		}
		let availableEmployees = z.townInfo.population_count - z.townInfo.employees;
		if (
			plotChosen.requirements.employees !== undefined &&
			plotChosen.requirements.employees > 0
		) {
			if (plotChosen.requirements.employees > availableEmployees) {
				requirementsMet = false;
			}
		}
		if (plotChosen.requirements.knowledge !== undefined) {
			if (plotChosen.requirements.knowledge > z.townInfo.knowledge_points) {
				requirementsMet = false;
			}
		}
		return requirementsMet;
	}

	function hasABank() {
		// returns if there is a bank
		return $DB.hasBank;
	}

	function handlePlotOptionClick(event) {
		const plotOption = event.target.closest('.plotOption');
		if (plotOption) {
			const plotOptionID = plotOption.dataset.plotoptionid;
			choosePlotOption(plotOptionID);
		}
	}
</script>

<div class="dialog">
	<div class="dialog-content">
		<div class="header">
			<div>
				<span class="heading_l">Modify Plot: {y + 1}-{x + 1}</span>
				{#if tooltip !== ''}
					<div class="message">{tooltip}</div>
				{/if}
			</div>
			<input
				type="text"
				id="search-bar"
				placeholder="Search Plot Options..."
				value={searchQuery}
				on:input={handleInput}
				bind:this={searchInput}
			/>

			<div>
				{#if $DB.plots[x][y].type !== -1 && canBulldoze(y, x)}
					<button on:click={clearPlot} id="bulldoze">🔥</button>
				{/if}
				<button on:click={close} id="close">Close</button>
			</div>
		</div>
		<div class="scrollable-y">
			<label for="plotType"
				>options
				{#if totalAffordableOptionsCount > 0}
					<span class="text_s">({totalAffordableOptionsCount})</span>
				{/if}
				<!-- show plot options that are affordable -->
				{#if reactiveOptions.length == 0}
					<span class="text_s">(0)</span>
				{/if}
			</label>
			<br />
			<br />
			<div class="plotOptions" on:click={handlePlotOptionClick}>
				{#each reactiveOptions as option (option.id)}
					<!-- Sort the options to show affordable ones first -->
					<div
						class="plotOption background-lightgray {option.affordable
							? ''
							: 'unaffordable'}"
						data-active={option.selected}
						data-affordable={option.affordable}
						data-plotOptionID={option.id}
					>
						<div>
							<span class="heading_m">{option.title}</span>
							<br />
							<span class="subheading_m">{option.subtitle}</span>
							<br />
							<span class="text_s">{option.description}</span>
						</div>

						<div class="bottom">
							{#if option.revenue_per_week > 0 || option.tourism_revenue_per_week > 0}
								<div class="profits">
									<span class="subheading_m">Profits</span>
									<br />
									{#if option.revenue_per_week > 0}
										<span class="text_s gold"
											><span class="strikethrough"
												>{option.revenue_per_week}</span
											>
											{roundTo(
												$DB.economy_and_laws.tax_rate * option.revenue_per_week,
												2,
											)} gold (with tax rate)</span
										>
										<br />
									{/if}
									{#if option.tourism_revenue_per_week > 0}
										<span class="text_s gold"
											><span class="strikethrough"
												>{option.tourism_revenue_per_week}</span
											>
											{roundTo(
												$DB.economy_and_laws.tax_rate *
													option.tourism_revenue_per_week *
													$DB.townInfo.population_count,
												2,
											)} tourism gold (
											{#if $DB.hasABank !== true}
												get a bank to cash out
											{/if}

											)</span
										>
									{/if}
								</div>
							{/if}
							<div class="reqs_and_mods">
								<div>
									<span class="subheading_m">Requirements</span>
									<br />
									{#if option.requirements.gold !== 0}
										{#if $DB.townInfo.gold < option.requirements.gold}
											<span class="red text_s cost_label"
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
										{#if $DB.townInfo.population_count - $DB.townInfo.employees < option.requirements.employees}
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
										{#if $DB.townInfo.knowledge_points < option.requirements.knowledge}
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
									<span class="subheading_m">Multiplier</span>
									<br />
									<!-- {JSON.stringify(option.effect_modifiers)} -->
									{#if option.effect_modifiers.happiness == 1.0}
										<span class="text_s" data-positive="true">😁 No effect</span
										>
									{:else}
										<span
											class="text_s"
											data-positive={option.effect_modifiers.happiness >= 1}
											>😁 {formatNumber(
												option.effect_modifiers.happiness,
											)}</span
										>
									{/if}
									<br />
									{#if option.effect_modifiers.health == 1.0}
										<span class="text_s" data-positive="true">🏥 No effect</span
										>
									{:else}
										<span
											class="text_s"
											data-positive={option.effect_modifiers.health >= 1}
											>🏥 {formatNumber(option.effect_modifiers.health)}</span
										>
									{/if}
								</div>
							</div>
							{#if option.immediate_variable_changes.happiness !== 0 || option.immediate_variable_changes.health !== 0}
								<div class="immediate_changes">
									<span class="subheading_m"
										>Instant changes:
										{#if option.immediate_variable_changes.happiness !== 0}
											😁
											<span class="green"
												>{option.immediate_variable_changes.happiness}</span
											>
										{/if}
										{#if option.immediate_variable_changes.happiness !== 0 && option.immediate_variable_changes.health !== 0}
											,
										{/if}
										{#if option.immediate_variable_changes.health !== 0}
											🏥
											<span class="green"
												>{option.immediate_variable_changes.health}</span
											>
										{/if}
									</span>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	#search-bar {
		width: 100%;
		padding: 0.5em;
		margin-bottom: 1em;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
	.plotOptions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		justify-content: center;
		padding-bottom: 100px;
	}

	.plotOption {
		border: 1px solid rgb(123, 114, 101);
		width: 12em;
		height: 15em;
		min-width: 12em;
		padding: 5px;
		background-color: rgb(0, 0, 0);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
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

	#close,
	#bulldoze {
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

	.dialog {
		position: fixed;
		bottom: 0;
		right: 0;
		margin-right: 10px;
		display: flex;
		z-index: 10;
		max-width: 70%;
		width: 70%;
	}

	.dialog-content {
		background: rgb(56 72 108);
		padding: 1em;
		border-top-right-radius: 0.5em;
		box-shadow: 0 0 100px rgba(45, 35, 35, 1);
		height: 70vh;
		min-width: 95%;
		width: 95%;
	}

	.scrollable-y {
		overflow-y: scroll;
		height: 95%;
		/* no scrollbar */
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}

	.cost_label {
		color: rgb(114, 255, 114);
		font-size: 12px;
	}
	.reqs_and_mods {
		display: flex;
		justify-content: space-between;
		margin-bottom: 7px;
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
	.unaffordable {
		opacity: 0.3;
	}
	[data-positive='false'] {
		color: #ff5050;
	}
</style>
