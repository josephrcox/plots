<script>
	import PlotController from './lib/PlotController.svelte';
	import GameClock from './lib/gameClock.svelte';
	import Header from './lib/Header.svelte';
	import PauseMenu from './lib/PauseMenu.svelte';
	import { DATABASE_NAME, paused } from './lib/store';
	import { modifyPlotMenuOptions } from './lib/store';

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
			localStorage.removeItem(DATABASE_NAME);
			location.reload();
		} else {
			console.log(e.key)
		}
	});
</script>

{#if $paused == true}
	<PauseMenu />
{/if}

<Header />
<GameClock />
<div class="plot_grid">
	<PlotController />
</div>

<style>
	.plot_grid {
		max-width: 100%;
		max-height: 100%;
		overflow-x: scroll;
		overflow-y: scroll;
	}
</style>
