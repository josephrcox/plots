<script lang="ts">
	import BottomBar from './BottomBar.svelte';
	import ModifyPlotMenu from './menus/ModifyPlotMenu.svelte';
	import Plot from './Plot.svelte';
	import { DB, modifyPlotMenuOptions, unique } from './store';

	$: if ($DB) {
		checkForAvailablePlots();
	}

	document.addEventListener('click', function (e) {
		const elem = e.target as HTMLDivElement;
		if (
			(elem.dataset.x == undefined &&
				elem.dataset.type != '-1' &&
				elem.dataset.size != undefined) ||
			elem.id == 'plotContainerMain' ||
			elem.classList.contains('row') ||
			elem.classList.contains('grid')
		) {
			$modifyPlotMenuOptions.visible = false;
		}
	});

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
	<div
		id="plotContainerMain"
		class="absolute left-[170px] top-[170px] overflow-scroll pl-20 pr-64 py-20"
	>
		<div class="grid overflow-x-scroll overflow-y-scroll plot_controller">
			{#each $DB.plots as plotRow, rowIndex}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="row {rowIndex % 2 !== 0 ? 'odd-row' : ''}"
					on:click={restartModifyPlotMenu}
				>
					{#each plotRow as plot}
						<Plot
							classText="hexagon"
							data={plot}
							canBeUpgraded={checkIfPlotCanBeUpgraded(plot.x, plot.y)}
						/>
					{/each}
				</div>
			{/each}
		</div>
	</div>
	{#key $unique}
		{#if $modifyPlotMenuOptions.visible}
			<!-- <ModifyPlotMenu
				x={$modifyPlotMenuOptions.x}
				y={$modifyPlotMenuOptions.y}
				open={$modifyPlotMenuOptions.visible}
			/> -->
			<BottomBar
				x={$modifyPlotMenuOptions.x}
				y={$modifyPlotMenuOptions.y}
				open={$modifyPlotMenuOptions.visible}
			/>
		{/if}
	{/key}
{/if}

<style>
	/* CSS */
	.grid {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		margin: 0;
		padding: 0;
		padding-top: 40px;
		overflow-y: scroll;
		overflow-x: scroll;
	}

	.row {
		display: flex;
		justify-content: center;
		margin-top: -20px;
	}

	.odd-row {
		margin-left: 119px;
		margin-top: -20px;
	}
</style>
