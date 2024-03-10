<script lang="ts">
	import { onMount } from 'svelte';
	import ModifyPlotMenu from './menus/ModifyPlotMenu.svelte';
	import Plot from './Plot.svelte';
	import {
		DB,
		modifyPlotMenuOptions,
		unique,
		paused,
		headerHeight,
	} from './store';

	$: if ($DB) {
		checkForAvailablePlots();
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
	}

	export function restartModifyPlotMenu() {
		$unique = {};
	}
</script>

{#if $DB != null}
	<div class="grid overflow-x-scroll overflow-visible">
		{#each $DB.plots as plotRow}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div class="row overflow-visible" on:click={restartModifyPlotMenu}>
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
				open={$modifyPlotMenuOptions.visible}
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
