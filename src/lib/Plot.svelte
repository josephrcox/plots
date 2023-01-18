<script>
	import { options } from './PlotTypeOptions';
	import { DB, modifyPlotMenuOptions, unique } from './store';

	export let data = {
		id: 0,
		active: false,
		x: 0,
		y: 0,
		type: -1,
	};
	export let canBeUpgraded = false;

	function openMenu() {
		if (!data.active && !canBeUpgraded) {
			$unique = {};
			$modifyPlotMenuOptions.visible = false;
		} else {
			$modifyPlotMenuOptions.x = data.x;
			$modifyPlotMenuOptions.y = data.y;
			$modifyPlotMenuOptions.visible = true;
		}
	}

	export function changePlotType(type) {
		$DB.plots[data.x][data.y].type = type;
		$modifyPlotMenuOptions.visible = false;
	}
</script>

<div
	class="plot_container"
	data-active={data.active}
	on:click={openMenu}
	data-canbeupgraded={canBeUpgraded}
>
	{#if data.type !== -1}
		{options[data.type].title}
		{options[data.type].subtitle}
	{/if}
</div>

<style>
	.plot_container {
		width: 100px;
		height: 100px;
		border: 1px solid rgb(100, 100, 100);
		background-color: rgb(232, 231, 231);

		text-align: center;
		word-wrap: normal;
		min-width: 100px;
		display: flex;
		justify-content: center;
		align-items: center;
		/* no select */
		-webkit-touch-callout: none; /* iOS Safari */
		-webkit-user-select: none; /* Safari */
		-khtml-user-select: none; /* Konqueror HTML */
		-moz-user-select: none; /* Old versions of Firefox */
		-ms-user-select: none; /* Internet Explorer/Edge */
		user-select: none; /* Non-prefixed version, currently
                              supported by Chrome, Opera and Firefox */
	}
	.plot_container[data-active='true'] {
		background-color: rgba(0, 0, 255, 0.243);
	}
	.plot_container[data-canbeupgraded='false'] {
		background-color: black;
	}
</style>
