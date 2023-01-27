<script>
	import PlotController from './lib/PlotController.svelte';
	import GameClock from './lib/gameClock.svelte';
	import Header from './lib/Header.svelte';
	import PauseMenu from './lib/menus/PauseMenu.svelte';
	import { DATABASE_NAME, paused, showBalanceSheet } from './lib/store';
	import { modifyPlotMenuOptions } from './lib/store';
  import BalanceSheetMenu from './lib/menus/BalanceSheetMenu.svelte';

	// if key P is pressed, pause the game
	document.addEventListener('keydown', (e) => {
		if (e.key.toLowerCase() == 'p') {
			if ($paused == true) {
				paused.set(false);
			} else {
				paused.set(true);
				$modifyPlotMenuOptions.visible = false;
			}
		} else if (e.key.toLowerCase() == 'escape') {
			if (prompt("Are you sure?") == "yes") {
				localStorage.removeItem(DATABASE_NAME);
				location.reload();
			}
		} else {
			console.log(e.key)
		}
	});

	let screenWidth = window.innerWidth;
	let screenHeight = window.innerHeight;
</script>

{#if $paused == true}
	<PauseMenu />
{/if}

{#if $showBalanceSheet == true}
	<BalanceSheetMenu/>
{/if}


<Header />
<GameClock />
<div class="plot_grid" data-marginright={$showBalanceSheet}>
	<PlotController />
</div>

<style>
	.plot_grid {
		max-width: 100%;
		max-height: 100%;
		overflow-x: scroll;
		overflow-y: scroll;
	}
	.plot_grid[data-marginright="true"] {
		/* This is for when the balanceSheet is being shown. */
		margin-right: 224px; 
	}
</style>
