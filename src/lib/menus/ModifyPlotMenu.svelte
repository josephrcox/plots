<script lang="ts">
	import { onMount, tick } from 'svelte';
	// @ts-ignore
	import { ACTIVE_GAME_DB_NAME, DB, modifyPlotMenuOptions } from '../store.ts';
	import { options } from '../objects/PlotTypeOptions.js';
	import gameClock from '../gameClock.svelte';
	import { Game, PlotOption } from '../types.js';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { fly, slide } from 'svelte/transition';
	import { flyAndScale } from '$lib/utils.js';

	export let x = 0;
	export let y = 0;
	export let open = false;
	let searchQuery = '';
	let PlotTypeOptions = options;
	export let tooltip = '';

	let searchInput: any;
	let totalAffordableOptionsCount: number;

	let reactiveOptions: PlotOption[] = PlotTypeOptions.map(
		(option: PlotOption | any) => ({
			...option,
			affordable: checkIfAffordable(option, $DB),
			selected: isSelected(option),
		}),
	);

	function firstEmoji(s: string): string | null {
		const regex = /\p{Emoji}/u;
		const match = regex.exec(s);
		return match ? match[0] : null;
	}

	$: if ($DB) {
		reactiveOptions = PlotTypeOptions.map((option: PlotOption | any) => ({
			...option,
			affordable: checkIfAffordable(option, $DB),
			selected: isSelected(option),
		}));
	}

	$: reactiveOptions = reactiveOptions.filter((option) =>
		option.title.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	$: totalAffordableOptionsCount = reactiveOptions.filter(
		(option: any) => option.affordable,
	).length;

	function handleInput(event: any) {
		searchQuery = (event.target.value as string) || '';
	}

	function isSelected(option: PlotOption) {
		return $DB.plots[x][y].type > -1
			? PlotTypeOptions[$DB.plots[x][y].type].id === option.id
			: false;
		return false;
	}

	export function checkIfPlotCanBeUpgraded(x: number, y: number) {
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

	function choosePlotOption(id: string) {
		// make all other options remove class active
		// add active class
		// use purchasePlot
		const plotOptions = document.querySelectorAll('.plotOption');
		plotOptions.forEach((plotOption) => {
			plotOption.classList.remove('active');
		});

		const plotOption = document.querySelector(`[data-plotoptionid="${id}"]`);
		if (plotOption) {
			plotOption.classList.add('active');
			purchasePlot(x, y, id);
		}
	}

	export function canBulldoze(x: number, y: number) {
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

	export function purchasePlot(x: number, y: number, typeID: string) {
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

			z.economyAndLaws.balance_sheet_history = [
				{
					day: z.environment.day,
					plot: `${x},${y}`,
					profits: plotChosen.requirements.gold * -1,
					balance: roundTo(z.townInfo.gold, 2),
				},
				...z.economyAndLaws.balance_sheet_history,
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
			localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
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

	export function reverseClear(x: number, y: number) {
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
		localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
	}

	function roundTo(n: number, digits: number) {
		if (digits === undefined) {
			digits = 0;
		}

		var multiplicator = Math.pow(10, digits);
		n = parseFloat((n * multiplicator).toFixed(11));
		var test = Math.round(n) / multiplicator;
		return +test.toFixed(digits);
	}

	// Function to change 1.2 to 1.20
	function formatNumber(n: number) {
		return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
	}

	function checkIfAffordable(plotChosen: PlotOption, z: Game) {
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

	function handlePlotOptionClick(event: any) {
		const plotOption = event.target.closest('.plotOption');
		if (plotOption) {
			const plotOptionID = plotOption.dataset.plotoptionid;
			choosePlotOption(plotOptionID);
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger />
	<Sheet.Content
		class="overflow-scroll h-4/6 w-12/12 border-gray-500 border-r-2 fixed
		"
		side="bottom"
	>
		<Sheet.Header>
			<Sheet.Title class="text-2xl font-bold">
				<span class="text-2xl font-bold"></span>Set Plot: {y + 1}-{x + 1}
				<span class="text-sm"> (press esc to close)</span></Sheet.Title
			>
			{#if tooltip !== ''}
				<Sheet.Description class="text-sm">{tooltip}</Sheet.Description>
			{/if}
		</Sheet.Header>
		<div class="flex mt-4">
			<Input
				type="text"
				id="search-bar"
				placeholder="Search Plot Options..."
				value={searchQuery}
				on:input={handleInput}
				bind:this={searchInput}
				class="border rounded w-auto"
			/>
			<div class="flex justify-end ml-6">
				{#if $DB.plots[x][y].type !== -1 && canBulldoze(x, y)}
					<button
						on:click={clearPlot}
						id="bulldoze"
						class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300 ease-in-out"
						>🔥 Bulldoze</button
					>
				{/if}
			</div>
			<label for="plotType" class="text-xs ml-4 gap-2">
				<span class="mb-10">Quick scroll</span>
				<div>
					{#if reactiveOptions.length > 0}
						{#each reactiveOptions as option}
							{#if option.affordable}
								<!-- svelte-ignore a11y-click-events-have-key-events -->
								<!-- svelte-ignore a11y-no-static-element-interactions -->
								<span
									class="text-xl cursor-pointer hover:bg-slate-300 rounded-lg p-1"
									on:click={() => {
										const op = document.querySelector(
											`[data-plotoptionid="${option.id}"]`,
										);
										if (op) {
											op.scrollIntoView({
												behavior: 'smooth',
												block: 'center',
											});
										}
									}}>{firstEmoji(option.title)}</span
								>
							{/if}
						{/each}
					{:else}
						No options
					{/if}
				</div>
			</label>
		</div>
		<Separator class="my-4" />
		<div class="scrollable-y">
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				class="plotOptions grid grid-flow-row grid-cols-2
					<!-- on big width, use 3 columns -->
					lg:grid-cols-3
				flex-auto flex-grid gap-6 mt-4
				"
				on:click={handlePlotOptionClick}
			>
				{#each reactiveOptions as option (option.id)}
					<div
						class="plotOption min-w-min overflow-x-auto
						{!option.affordable ? 'unaffordable cursor-not-allowed' : 'cursor-pointer'}
					border rounded-md p-4 mb-4
						{option.selected ? 'bg-teal-900' : ''}
					"
						data-plotoptionid={option.id}
					>
						<div>
							<h2 class="text-md font-semibold">
								{option.title}
								<span class="text-xs font-light italic opacity-50"
									>{option.subtitle}</span
								>
							</h2>

							<p class="text-xs opacity-75">{option.description}</p>
						</div>
						<div class="mt-4">
							{#if option.revenue_per_week > 0 || option.tourism_revenue_per_week > 0}
								<div class="profits">
									<span class="text-sm font-semibold">Profits</span>
									{#if option.revenue_per_week > 0}
										<p class="text-sm">
											Profit with Tax Rate:
											<!-- strikethrough -->
											<span class="line-through text-xs">
												{roundTo(option.revenue_per_week * 1, 2)}
											</span>
											<span class=" text-xs">
												({roundTo(
													$DB.economyAndLaws.tax_rate * option.revenue_per_week,
													2,
												)} gold)
											</span>
										</p>
									{/if}
									{#if option.tourism_revenue_per_week > 0}
										<p class="text-xs">
											Tourism Revenue: {option.tourism_revenue_per_week}
										</p>
										<p class="text-xs">
											Taxed Tourism Revenue: {roundTo(
												$DB.economyAndLaws.tax_rate *
													option.tourism_revenue_per_week *
													$DB.townInfo.population_count,
												2,
											)} gold
										</p>
									{/if}
								</div>
							{/if}
							<div
								class="reqs_and_mods mt-4 flex flex-row justify-between gap-2"
							>
								<div>
									<span class="text-sm font-semibold">Requirements</span>
									{#if option.requirements.gold !== 0}
										<p class="text-xs">
											{option.requirements.gold} gold
											<span class="text-xs"
												>({roundTo($DB.townInfo.gold, 0)})</span
											>
										</p>
									{/if}
									{#if option.requirements.employees !== 0}
										<p class="text-xs">
											{option.requirements.employees} employees
											<span class="text-xs"
												>({roundTo(
													$DB.townInfo.population_count -
														$DB.townInfo.employees,
													0,
												)})</span
											>
										</p>
									{/if}
									{#if option.requirements.knowledge != null && option.requirements.knowledge !== 0}
										<p class="text-xs">
											{option.requirements.knowledge} knowledge
										</p>
									{/if}
								</div>
								<div>
									<span class="text-sm font-semibold">Multiplier</span>
									<p class="text-xs">
										Happiness: {option.effect_modifiers.happiness == 1.0
											? 'No effect'
											: formatNumber(option.effect_modifiers.happiness)}
									</p>
									<p class="text-xs">
										Health: {option.effect_modifiers.health == 1.0
											? 'No effect'
											: formatNumber(option.effect_modifiers.health)}
									</p>
								</div>
							</div>
							{#if option.immediate_variable_changes.happiness !== 0 || option.immediate_variable_changes.health !== 0}
								<div class="immediate_changes mt-4">
									<span class="text-sm font-semibold">Instant changes</span>
									{#if option.immediate_variable_changes.happiness !== 0}
										<p class="text-xs">
											Happiness: {option.immediate_variable_changes.happiness}
										</p>
									{/if}
									{#if option.immediate_variable_changes.health !== 0}
										<p class="text-xs">
											Health: {option.immediate_variable_changes.health}
										</p>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<style>
	.unaffordable {
		opacity: 0.3;
	}
</style>
