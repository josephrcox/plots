<script>
	import PlotController from './lib/PlotController.svelte';
	import { startGameClock } from './lib/gameClock';
	import Header from './lib/Header.svelte';
	

	startGameClock();
</script>

<Header />
<PlotController />

<style>

</style>
