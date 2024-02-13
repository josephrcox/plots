<script>
	import { onMount } from 'svelte';
	import { options } from './objects/PlotTypeOptions.js';
	import { DB, modifyPlotMenuOptions, unique, paused } from './store';

	export let data = {
		id: 0,
		active: false,
		x: 0,
		y: 0,
		type: -1,
		styling: '',
		referencePlot: [],
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

	function openMenu(e, a, b) {
		let plots = document.querySelectorAll('.plot_container');
		if ($paused == false) {
			if (
				data.referencePlot != undefined &&
				data.referencePlot[0] !== null &&
				a == undefined &&
				b == undefined &&
				data.referencePlot[1] !== undefined
			) {
				return openMenu(e, data.referencePlot[0], data.referencePlot[1]);
			} else if (!data.active && !canBeUpgraded) {
				$unique = {};
				$modifyPlotMenuOptions.visible = false;
				plots.forEach((plot) => {
					plot.classList.remove('selected');
				});
			} else {
				if (a != undefined && b != undefined) {
					$modifyPlotMenuOptions.x = a;
					$modifyPlotMenuOptions.y = b;
				} else {
					$modifyPlotMenuOptions.x = data.x;
					$modifyPlotMenuOptions.y = data.y;
				}

				$modifyPlotMenuOptions.visible = true;

				plots.forEach((plot) => {
					plot.classList.remove('selected');
				});
				// Highlight a plot when it's clicked on
				if (a != undefined && b != undefined) {
					document
						.querySelector(`.plot_container[data-x="${a}"][data-y="${b}"]`)
						.classList.add('selected');
				} else {
					document
						.querySelector(`.plot_container[data-id="${data.id}"]`)
						.classList.add('selected');
				}
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
	data-optionIndex={data.optionIndex}
	on:click={openMenu}
	data-canBeUpgraded={canBeUpgraded}
	style={specialStylingString}
	data-type={data.type}
	data-referencePlotX={data.referencePlot !== undefined
		? data.referencePlot[0]
		: null}
	data-referencePlotY={data.referencePlot !== undefined
		? data.referencePlot[1]
		: null}
	data-size={data.type > -1 ? options[data.type].requirements.size : null}
>
	{#if data.type > -1}
		<div>
			<span data-size={options[data.type].requirements.size}
				>{options[data.type].title}</span
			>
			<!-- <br />
				<span>{data.x},{data.y}</span> -->
		</div>
	{/if}
</div>

<style>
	.plot_container {
		width: 100px;
		height: 100px;
		background-color: rgb(126, 158, 255);
		border: 1px solid rgba(0, 0, 0, 0.7);
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
		background-color: rgb(89 89 239);
	}
	.plot_container[data-canBeUpgraded='false'] {
		background-color: rgb(64, 64, 64);
		border: none;
	}
	.plot_container[data-type='-2'] {
		background-color: rgba(152, 255, 95, 0.69);
		border: none;
	}

	.plot_container[data-type='-3'] {
		background-color: rgba(62, 62, 242, 0.7);
		border: none;
	}

	span[data-size='2'] {
		transform: translateX(50px) translateY(40px);
	}

	.plot_container > div {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		gap: 10px;
		color: black;
	}
</style>
