<script lang="ts">
	import { onMount, tick } from 'svelte';
	// @ts-ignore
	import {
		ACTIVE_GAME_DB_NAME,
		DB,
		modifyPlotMenuOptions,
		showOnlyAffordable,
		toggleShowOnlyAffordable,
	} from '../store.js';
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
		if ($showOnlyAffordable) {
			reactiveOptions = reactiveOptions.filter((option) => option.affordable);
		}
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

<Dialog.Root bind:open>
	<Dialog.Content
		class="border-gray-500 border-r-2 overflow-y-scroll max-w-[90vw] max-h-[90vh]
		"
	>
		<Dialog.Header>
			<Dialog.Title class="text-2xl font-bold">
				<span class="text-2xl font-bold"></span>Set Plot: {y + 1}-{x + 1}
				<span class="text-sm"> (press esc to close)</span></Dialog.Title
			>
			{#if tooltip !== ''}
				<Dialog.Description class="text-sm">{tooltip}</Dialog.Description>
			{/if}
		</Dialog.Header>
		<div class="flex">
			<Input
				type="text"
				id="search-bar"
				placeholder="Search Plot Options..."
				value={searchQuery}
				on:input={handleInput}
				bind:this={searchInput}
				class="border rounded w-auto"
			/>
			<!-- toggle to only show affordable ones -->
			<div class="flex items-center ml-6">
				<input
					type="checkbox"
					id="toggle-affordable"
					class="rounded"
					on:change={() => {
						toggleShowOnlyAffordable();
					}}
					checked={totalAffordableOptionsCount === reactiveOptions.length}
				/>
				<!-- no select -->
				<label
					for="toggle-affordable"
					class="ml-2
					no-select cursor-pointer
				
				">Show only affordable</label
				>
			</div>
			<div class="flex justify-end ml-6">
				{#if $DB.plots[x][y].type !== -1 && canBulldoze(x, y)}
					<button
						on:click={clearPlot}
						id="bulldoze"
						class="px-2 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300 ease-in-out"
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
		<Separator class="" />
		<div class="scrollable-y">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
			<table
				class="text-left table-auto text-xs w-full border-collapse border-gray-500 rounded-lgshadow-lg"
				on:click={handlePlotOptionClick}
			>
				<thead
					class="
					sticky top-0 z-10 bg-slate-900 position-sticky text-white text-left
				"
				>
					<tr class="text-xs text-left">
						<th class="px-2 py-2">Title</th>
						<th class="px-2 pr-36 py-2">Desc</th>
						<th class="px-2 py-2">Profit (wk)</th>
						<th class="px-2 py-2">Employees</th>
						<th class="px-2 py-2">Required Gold</th>
						<th class="px-2 py-2">Required Knowledge</th>
						<th class="px-2 py-2">Happiness multiplier</th>
						<th class="px-2 py-2">Health multiplier</th>
						<th class="px-2 py-2">Instant Happiness change</th>
						<th class="px-2 py-2">Instant Health change</th>
					</tr>
				</thead>
				<tbody class="overflow-hidden text-xs">
					{#each reactiveOptions as option (option.id)}
						<tr
							class="plotOption border-b border-black {option.affordable
								? 'cursor-pointer'
								: 'unaffordable cursor-not-allowed bg-gray-200'}
								{option.selected
								? 'italic font-semibold border-green-500 border-4 border-b-4 cursor-not-allowed border-dashed'
								: ''}
								
								"
							data-plotoptionid={option.id}
							style={option.styling}
						>
							<td class="px-2 py-2">
								{option.selected ? '➡️' : ''}

								{option.title}</td
							>
							<td class="px-2 py-2 w-max">{option.description}</td>
							<td class="px-2 py-2">
								{#if option.revenue_per_week > 0}
									<div>
										<span class="line-through"
											>${roundTo(option.revenue_per_week, 2)}</span
										>

										<span
											>${roundTo(
												$DB.economyAndLaws.tax_rate * option.revenue_per_week,
												2,
											)}</span
										>
									</div>
								{:else}
									<!-- whole lotta nothin' -->
								{/if}
							</td>
							<td class="px-2 py-2">{option.requirements.employees || ''}</td>
							<td class="px-2 py-2"
								>${option.requirements.gold}
								<span class="text-xs opacity-50">(${$DB.townInfo.gold})</span>
							</td>
							<td class="px-2 py-2">{option.requirements.knowledge || ''}</td>
							<td class="px-2 py-2"
								>{option.effect_modifiers.happiness == 1.0
									? ''
									: formatNumber(option.effect_modifiers.happiness)}
								{option.effect_modifiers.happiness > 1
									? '🟢'
									: option.effect_modifiers.happiness < 1
										? '🔴'
										: ''}
							</td>
							<td class="px-2 py-2"
								>{option.effect_modifiers.health == 1.0
									? ''
									: formatNumber(option.effect_modifiers.health)}
								{option.effect_modifiers.health > 1
									? '🟢'
									: option.effect_modifiers.health < 1
										? '🔴'
										: ''}
							</td>
							<td class="px-2 py-2"
								>{option.immediate_variable_changes.happiness || ''}
								{option.immediate_variable_changes.happiness > 0
									? '🟢'
									: option.immediate_variable_changes.happiness < 0
										? '🔴'
										: ''}
							</td>
							<td class="px-2 py-2"
								>{option.immediate_variable_changes.health || ''}
								{option.immediate_variable_changes.health > 0
									? '🟢'
									: option.immediate_variable_changes.health < 0
										? '🔴'
										: ''}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	.unaffordable {
		opacity: 0.3;
	}
</style>
