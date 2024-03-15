<script lang="ts">
	// @ts-ignore
	import {
		ACTIVE_GAME_DB_NAME,
		DB,
		hasPlotOfType,
		modifyPlotMenuOptions,
		showOnlyAffordable,
		toggleShowOnlyAffordable,
	} from '../store.js';
	import { getColor, options } from '../objects/PlotTypeOptions.js';
	import { Game, PlotOption } from '../types.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Separator } from '$lib/components/ui/separator';
	import { Input } from '$lib/components/ui/input';
	import { numberWithCommas } from '../utils.js';
	import Stats from '../Stats.svelte';

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

	function getOptionIndex(id: string) {
		return options.findIndex((option) => option.id === id);
	}

	function formatModifier(modifier: number) {
		let isNegative = modifier < 1;
		let response = roundTo((modifier % 1) * 100, 0);
		if (!isNegative) {
			return `+${response}%`;
		} else {
			return `-${100 - response}%`;
		}
	}

	function formatInstantChange(change: number) {
		// We divide by 3 because the number is actually 300 but shown to the user as 100 max
		change = roundTo(change / 3, 0);
		let isNegative = change < 0;
		if (!isNegative) {
			return `+${change}`;
		} else {
			return `-${change}`;
		}
	}

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

		if (checkIfAffordable(plotChosen, $DB) == false) {
			console.log(plotChosen.requirements);
			return alert(`${JSON.stringify(plotChosen.requirements)}`);
		}

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
				case 'city_hall':
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
			tooltip =
				"You do not have enough resources to purchase this plot. If it's a 'Large' plot, make sure you have a 2x2 area available. ";
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
			let size = options[oldPlotType].requirements.size ?? 1;
			if (size > 1) {
				for (let a = 0; a < z.plots.length; a++) {
					for (let b = 0; b < z.plots[x].length; b++) {
						if (
							z.plots[a][b].referencePlot != undefined &&
							z.plots[a][b].referencePlot[0] === x &&
							z.plots[a][b].referencePlot[1] === y
						) {
							reverseClear(a, b);
						}
					}
				}
			}
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

	function formatNumber(n: number) {
		return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
	}

	function checkIfAffordable(plotChosen: any, z: Game) {
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
		// some plots have requirements.plots which is an array of IDs, check if we have those by using hasPlotOfType
		if (
			plotChosen.requirements.plots !== undefined &&
			plotChosen.requirements.plots.length > 0
		) {
			plotChosen.requirements.plots.forEach((plot: any) => {
				if (!hasPlotOfType(plot, z)) {
					requirementsMet = false;
				}
			});
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
		class="border-gray-500 border-r-2 overflow-clip max-w-[90vw] max-h-[90vh]
		"
	>
		<Dialog.Header>
			<Dialog.Title class="text-2xl font-bold">
				<span class="text-2xl font-bold"></span>Set this Plot</Dialog.Title
			>
			{#if tooltip !== ''}
				<Dialog.Description class="text-sm">{tooltip}</Dialog.Description>
			{/if}
			<div class="mt-4"></div>
			<Stats classText="w-full" clickEvents="false" />
			<div class="mb-4"></div>
		</Dialog.Header>
		<div
			class="flex flex-row w-full px-4 py-2 text-white
		"
		>
			<div
				class="
			flex items-center
			"
			>
				<Input
					type="text"
					id="search-bar"
					placeholder="Search Plot Options..."
					value={searchQuery}
					on:input={handleInput}
					bind:this={searchInput}
					class="border rounded w-auto"
				/>
			</div>
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
		<div
			class="overflow-y-scroll
		scroll-smooth no-scrollbar max-h-[60vh]
		"
		>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
			<table
				class="text-left table-auto text-xs w-full border-collapse rounded-lgshadow-lg"
				on:click={handlePlotOptionClick}
			>
				<thead
					class="
					sticky top-0 z-10 bg-slate-900 position-sticky text-white text-left w-full px-5
				"
				>
					<tr class="text-xs text-left">
						<th class="px-2 py-2">Title</th>
						<th class="px-2 pr-2 py-2 w-48">Desc</th>
						<th class="px-2 py-2">Profit</th>
						<th class="px-2 py-2">Employees</th>
						<th class="px-2 py-2">Cost</th>
						<th class="px-2 py-2">Requires</th>
						<th class="px-2 py-2">Modifiers</th>
						<th class="px-2 py-2">Instant effect</th>
					</tr>
				</thead>
				<tbody class="overflow-hidden text-xs mx-2">
					{#each reactiveOptions as option (option.id)}
						<tr
							class="plotOption border-b border-black {option.affordable
								? 'cursor-pointer'
								: 'unaffordable cursor-not-allowed bg-gray-200'}
								{option.selected ? 'italic font-light opacity-50 ' : ''}
								
								"
							data-plotoptionid={option.id}
							style="background-color: 
									{!option.selected
								? getColor(
										getOptionIndex(option.id),
										checkIfPlotCanBeUpgraded(x, y),
									)
								: 'gray'}
							"
						>
							<td class="px-2 py-2 w-12">
								{option.selected
									? `✅ SELECTED ${option.title.substring(2)}`
									: `${option.title}`}
							</td>
							<td class="px-2 py-2 w-24">{@html option.description}</td>
							<td class="px-2 py-2 w-12 font-bold">
								{#if option.revenue_per_week > 0}
									<div>
										<span
											>${roundTo(
												$DB.economyAndLaws.tax_rate * option.revenue_per_week,
												2,
											)}</span
										>
									</div>
								{/if}
							</td>
							<td
								class="px-2 py-2 w-8
								{option.requirements.employees >
								$DB.townInfo.population_count - $DB.townInfo.employees
									? 'underline bg-red-800 text-white'
									: ''}
							">{option.requirements.employees || ''}</td
							>
							<td
								class="px-2 py-2 w-8
									{option.requirements.gold > $DB.townInfo.gold
									? 'underline bg-red-800 text-white border-none'
									: ''}
					"
								>${formatNumber(option.requirements.gold)}
								{#if option.requirements.knowledge > 0}
									<br />
									{option.requirements.knowledge} KPts
								{/if}
							</td>
							<td class="px-2 py-2 w-12">
								<div>
									<!-- list each requirements.plot[]  -->
									{#each option.requirements.plots as plot}
										{#if hasPlotOfType(plot, $DB)}
											<span class="text-green-500">✅</span>
										{:else}
											<span class="text-red-500">❌</span>
										{/if}
										{plot}
										<br />
									{/each}
								</div>
							</td>
							<td class="px-2 py-2 w-12 text-xs">
								<div class="text-xs">
									{#if option.effect_modifiers.happiness != 1.0}
										😀 {formatModifier(option.effect_modifiers.happiness)}
									{/if}
								</div>
								<div class="mt-2">
									{#if option.effect_modifiers.health != 1.0}
										😷 {formatModifier(option.effect_modifiers.health)}
									{/if}
								</div>
							</td>
							<td class="px-2 py-2 w-12"
								>{#if option.immediate_variable_changes.happiness != 0}
									😀 {formatInstantChange(
										option.immediate_variable_changes.happiness,
									)}
								{/if}
								{#if option.immediate_variable_changes.health != 0}
									<br />
									😷 {formatInstantChange(
										option.immediate_variable_changes.health,
									)}
								{/if}
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
