<script>
	import { onDestroy, onMount } from 'svelte';
	import { DATABASE_NAME, DB, modifyPlotMenuOptions } from './store.js';
	import { options } from './jsonObjects/PlotTypeOptions.js';

	export let x = 0;
	export let y = 0;
	let PlotTypeOptions = options;
	export let tempMessage = '';

	let mounted = false;
	onMount(() => (mounted = true));

	onMount(() => {
		const plotOptions = document.querySelectorAll('.plotOption');
		if ($DB.plots[x][y].type !== -1) {
			plotOptions[$DB.plots[x][y].type].classList.add('active');
		}
	});

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

		if (requirementsMet === true) {
			// Check if the plot is already set to a type. If so, reverse the effects of that type.
			if (z.plots[x][y].type !== -1) {
				reverseClear(x, y);
			}

			tempMessage = '';
			console.log('met');
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
			z.towninfo.visitors += plotChosen.immediate_variable_changes.visitors;
			// Effect modifiers
			z.modifiers.happiness = roundTo(
				z.modifiers.happiness * plotChosen.effect_modifiers.happiness,
				3
			);
			z.modifiers.health = roundTo(
				z.modifiers.health * plotChosen.effect_modifiers.health,
				3
			);
			z.modifiers.visitors = roundTo(
				z.modifiers.visitors * plotChosen.effect_modifiers.visitors,
				3
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

		// Immediate variable changes
		z.towninfo.population_count -=
			options[oldPlotType].immediate_variable_changes.population;
		z.towninfo.population_max -=
			options[oldPlotType].immediate_variable_changes.population;
		z.towninfo.happiness -=
			options[oldPlotType].immediate_variable_changes.happiness;
		z.towninfo.health -= options[oldPlotType].immediate_variable_changes.health;
		z.towninfo.visitors -=
			options[oldPlotType].immediate_variable_changes.visitors;
		// Effect modifiers
		z.modifiers.happiness = roundTo(
			z.modifiers.happiness / options[oldPlotType].effect_modifiers.happiness,
			3
		);
		z.modifiers.health = roundTo(
			z.modifiers.health / options[oldPlotType].effect_modifiers.health,
			3
		);
		z.modifiers.visitors = roundTo(
			z.modifiers.visitors / options[oldPlotType].effect_modifiers.visitors,
			3
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
</script>

<div class="dialog">
	<div class="dialog-content">
		{#if tempMessage !== ''}
			<div class="message">{tempMessage}</div>
		{/if}
		Modify plot: {y}, {x}
		<br />
		<button on:click={close} id="close">Close</button>
		<br />
		<label for="plotType">Plot Type</label>
		{#if $DB.plots[x][y].type !== -1 && canBulldoze(x, y)}
			<button on:click={clearPlot} id="bulldoze">🔥</button>
		{/if}

		<div class="plotOptions">
			{#each PlotTypeOptions as option (option)}
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
					{#if option.revenue_per_week > 0}
						<div>
							<span class="subheading_m">Profits</span>
							<br />
							<span class="text_m"
								><span class="strikethrough">{option.revenue_per_week}</span> 
								{roundTo($DB.economy_and_laws.tax_rate * option.revenue_per_week, 2)} gold (with tax rate)</span
							>
						</div>
					{/if}

					<div>
						<span class="subheading_m">Requirements</span>
						<br />
						{#if option.requirements.gold !== 0}
							{#if $DB.towninfo.gold < option.requirements.gold}
								<span class="text_m cost_label" style="color: red"
									>{option.requirements.gold} gold</span
								>
							{:else}
								<span class="text_m cost_label"
									>{option.requirements.gold} gold</span
								>
							{/if}

							<br />
						{/if}

						{#if option.requirements.employees !== 0}
							{#if $DB.towninfo.population_count - $DB.towninfo.employees < option.requirements.employees}
								<span class="text_m cost_label" style="color: red"
									>{option.requirements.employees} employees
								</span>
							{:else}
								<span class="text_m cost_label"
									>{option.requirements.employees} employees
								</span>
							{/if}
						{/if}
					</div>
				</div>
			{/each}
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
		border: 1px solid black;
		width: 12em;
		height: 12em;
		min-width: 12em;
		padding: 5px;
		background-color: #f2f2f2;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		z-index: 10;
	}

	.dialog-content {
		background: white;
		padding: 1em;
		border-radius: 0.5em;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
	}
	#close {
		position: absolute;
		top: 0;
		right: 0;
		margin: 1em;
	}
	#bulldoze {
		position: absolute;
		top: 30px;
		right: 0;
		margin: 1em;
	}
	.cost_label {
		color: green;
		font-size: 14px;
	}
</style>
