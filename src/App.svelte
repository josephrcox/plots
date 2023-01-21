<script>
	import PlotController from './lib/PlotController.svelte';
	import GameClock from './lib/gameClock.svelte';
	import Header from './lib/Header.svelte';

</script>

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
