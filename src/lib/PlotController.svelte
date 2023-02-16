<script lang="ts">
	import { onMount } from 'svelte';
	import ModifyPlotMenu from './menus/ModifyPlotMenu.svelte';
	import Plot from './Plot.svelte';
	import { DB, modifyPlotMenuOptions, unique, paused } from './store.js';

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

	export function restartModifyPlotMenu() {
		$unique = {};
	}

	// check if ?dev=true is in the url
	if (window.location.search.includes('dev=true')) {
		let z = $DB;
		z.towninfo.name = 'DevTown';
		z.towninfo.gold = 10000;
		z.towninfo.population = 0;
		z.towninfo.happiness = 100000;
		z.towninfo.health = 100000;
		$DB = z;
	}
</script>

<div class="grid">
	{#each $DB.plots as plotRow}
		<div class="row" on:click={restartModifyPlotMenu}>
			{#each plotRow as plot}
				<Plot data={plot} canBeUpgraded={checkIfPlotCanBeUpgraded(plot.x, plot.y)} />
			{/each}
		</div>
	{/each}
</div>

{#key $unique}
	{#if $modifyPlotMenuOptions.visible}
		<ModifyPlotMenu x={$modifyPlotMenuOptions.x} y={$modifyPlotMenuOptions.y}/>
	{/if}
	
{/key}

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
