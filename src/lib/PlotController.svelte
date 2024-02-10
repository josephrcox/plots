<script lang="ts">
	import { onMount } from 'svelte';
	import ModifyPlotMenu from './menus/ModifyPlotMenu.svelte';
	import Plot from './Plot.svelte';
	import { DB, modifyPlotMenuOptions, unique, paused } from './store.js';
	$: if ($DB) {
		checkForAvailablePlots();
	}

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
				adjacentPlot.x >= $DB.plots.length || // Changed from '>' to '>='
				adjacentPlot.y < 0 ||
				adjacentPlot.y >= $DB.plots[adjacentPlot.x].length // Assuming a square grid
			) {
				return false;
			}
			const adjacentPlotData = $DB.plots[adjacentPlot.x][adjacentPlot.y];
			return adjacentPlotData.active;
		});
	}

	function checkForAvailablePlots() {
		console.log($DB.plots.length);
		let available = [];
		for (let x = 0; x < $DB.plots.length; x++) {
			for (let y = 0; y < $DB.plots.length; y++) {
				const canBeUpgraded = checkIfPlotCanBeUpgraded(x, y);
				if (canBeUpgraded) {
					if ($DB.plots[x][y].active == false) {
						available.push($DB.plots[x][y]);
					}
				}
			}
		}
		console.log(available);
	}

	export function restartModifyPlotMenu() {
		$unique = {};
	}

	// check if ?dev=true is in the url
	if (window.location.search.includes('dev=true')) {
		$DB.towninfo.name = 'DevTown';
		$DB.towninfo.gold = 100000000;
		$DB.towninfo.population = 0;
		$DB.towninfo.happiness = 100000;
		$DB.towninfo.health = 100000;
		$DB.modifiers.happiness = 100000;
		$DB.modifiers.health = 100000;
		$DB.towninfo.knowledge_points = 10000;
	}
</script>

{#if $DB != null}
	<div class="grid">
		{#each $DB.plots as plotRow}
			<div class="row" on:click={restartModifyPlotMenu}>
				{#each plotRow as plot}
					<Plot
						data={plot}
						canBeUpgraded={checkIfPlotCanBeUpgraded(plot.x, plot.y)}
					/>
				{/each}
			</div>
		{/each}
	</div>
	{#key $unique}
		{#if $modifyPlotMenuOptions.visible}
			<ModifyPlotMenu
				x={$modifyPlotMenuOptions.x}
				y={$modifyPlotMenuOptions.y}
			/>
		{/if}
	{/key}
{/if}

<style>
	.grid {
		display: flex;
		flex-direction: column;
		margin: 0;
	}
	.row {
		display: flex;
		flex-direction: row;
	}
</style>
