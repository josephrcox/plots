<script>
	import { onMount } from 'svelte';
	import { options } from './jsonObjects/PlotTypeOptions.js';
	import { DB, modifyPlotMenuOptions, unique, paused } from './store';

	export let data = {
		id: 0,
		active: false,
		x: 0,
		y: 0,
		type: -1,
		styling: '',
	};
	export let canBeUpgraded = false;

	$: onChange(data);

	function onChange(...args) {
		refreshStyling();
	}
	let specialStylingString = data.styling;

	onMount(async () => {
		if (data.type >= 0 && options[data.type].styling) {
			specialStylingString = options[data.type].styling;
		}
	});

	function refreshStyling() {
		if (data.type >= 0 && options[data.type].styling) {
			specialStylingString = options[data.type].styling;
		}
		if (data.type < 0) {
			specialStylingString = '';
		}
	}

	function openMenu() {
		let plots = document.querySelectorAll('.plot_container');
		if ($paused == false) {
			if (!data.active && !canBeUpgraded) {
				$unique = {};
				$modifyPlotMenuOptions.visible = false;
				plots.forEach((plot) => {
					plot.classList.remove('selected');
				});
			} else {
				$modifyPlotMenuOptions.x = data.x;
				$modifyPlotMenuOptions.y = data.y;
				$modifyPlotMenuOptions.visible = true;

				plots.forEach((plot) => {
					plot.classList.remove('selected');
				});
				// Highlight a plot when it's clicked on
				document
					.querySelector(`.plot_container[data-id="${data.id}"]`)
					.classList.add('selected');
			}
		}
	}

	export function changePlotType(type) {
		if ($paused == false) {
			$DB.plots[data.x][data.y].type = type;
			$modifyPlotMenuOptions.visible = false;
		}
	}
</script>

<div
	class="plot_container"
	data-active={data.active}
	data-id={data.id}
	data-x={data.x}
	data-y={data.y}
	on:click={openMenu}
	data-canbeupgraded={canBeUpgraded} 
	style={specialStylingString}
>
	{#if data.type !== -1}
		{#if data.type === -2}
			(part of a park)
		{:else}
			<div>
				<span>{options[data.type].title}</span>
				<!-- <br />
				<span>{data.x},{data.y}</span> -->
			</div>
		{/if}
	{/if}
</div>

<style>
	.plot_container {
		width: 100px;
		height: 100px;
		border: 1px solid rgb(100, 100, 100);
		background-color: rgb(37, 40, 42);

		text-align: center;
		word-wrap: normal;
		min-width: 100px;
		display: flex;
		justify-content: center;
		align-items: center;

		font-size: 0.8em;
		padding: 6px;

		/* no select */
		-webkit-touch-callout: none; /* iOS Safari */
		-webkit-user-select: none; /* Safari */
		-khtml-user-select: none; /* Konqueror HTML */
		-moz-user-select: none; /* Old versions of Firefox */
		-ms-user-select: none; /* Internet Explorer/Edge */
		user-select: none; /* Non-prefixed version, currently
                              supported by Chrome, Opera and Firefox */
		box-sizing: border-box;
		-moz-box-sizing: border-box;
		-webkit-box-sizing: border-box;
	}
	.plot_container[data-active='true'] {
		background-color: rgba(0, 0, 255, 0.243);
	}
	.plot_container[data-canbeupgraded='false'] {
		background-color: black;
		border: none;
	}

	.plot_container > div {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		gap: 10px;
		color: black;
	}
</style>
