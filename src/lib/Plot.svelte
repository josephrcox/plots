<script>
	import { options, getColor } from './objects/PlotTypeOptions.js';
	import { DB, modifyPlotMenuOptions, unique, paused } from './store.ts';
	import Tooltip from './Tooltip.svelte';

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

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="plot_container overflow-visible {data.type == -1 &&
	canBeUpgraded == false
		? 'border-slate-500 border-dashed border'
		: ''}"
	style="background-color:{getColor(data.type, canBeUpgraded)}"
	data-active={data.active}
	data-id={data.id}
	data-x={data.x}
	data-y={data.y}
	data-optionIndex={data.optionIndex}
	on:click={openMenu}
	data-canBeUpgraded={canBeUpgraded}
	data-type={data.type}
	data-type-id={data.typeId}
	data-refPlotX={data.referencePlot !== undefined
		? data.referencePlot[1]
		: null}
	data-refPlotY={data.referencePlot !== undefined
		? data.referencePlot[0]
		: null}
	data-size={data.type > -1 ? options[data.type].requirements.size : null}
>
	{#if data.type > -1}
		<div>
			<span data-size={options[data.type].requirements.size}
				><span class="text-lg">{options[data.type].title.substring(0, 2)}</span
				><br />{options[data.type].title.substring(2)}
				{options[data.type].requirements.size > 1
					? `(${options[data.type].requirements.size}x${
							options[data.type].requirements.size
						})`
					: ''}
			</span>
		</div>
	{:else if data.type == -1 && data.x == 0 && data.y == 0}
		<Tooltip text="Build your first home" happy="true" />
	{/if}
</div>

<style>
	.plot_container {
		width: 100px;
		height: 100px;
		background-color: rgb(126, 158, 255);
		word-wrap: normal;
		min-width: 100px;
		display: flex;
		align-items: start;
		justify-content: center;
		align-items: center;
		font-size: 0.7em;
		box-sizing: border-box;
		-moz-box-sizing: border-box;
		-webkit-box-sizing: border-box;
		overflow: visible;
		padding: 2px;

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
		background-color: rgb(89 89 239);
	}
	.plot_container[data-canBeUpgraded='false'] {
		background-color: rgb(21 28 41);
	}
	.plot_container[data-type='-2'] {
		background-color: #858507;
		border: none;
	}

	.plot_container[data-size='2'] {
		background-color: rgb(42, 62, 230);
		border: none;
	}

	.plot_container[data-type='-3'] {
		background-color: rgb(42, 62, 230);
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
