<script>
	import { onDestroy, onMount } from 'svelte';
	import { DATABASE_NAME, DB, modifyPlotMenuOptions } from './store.js';
	import { options } from './PlotTypeOptions.js';

	export let x = 0;
	export let y = 0;
	let PlotTypeOptions = options;

	let mounted = false;
	onMount(() => (mounted = true));

	onMount(() => {
		const plotOptions = document.querySelectorAll('.plotOption');
		if ($DB.plots[x][y].type !== -1) {
			plotOptions[$DB.plots[x][y].type].classList.add('active');
		}
	});

	function close() {
		$modifyPlotMenuOptions.visible = false;
	}

	function clearPlot() {
		let z = $DB;
		z.plots[x][y].type = -1;
		z.plots[x][y].active = false;
		DB.set(z);
		localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
		const plotOptions = document.querySelectorAll('.plotOption');
		plotOptions.forEach((plotOption) => {
			plotOption.classList.remove('active');
		});
	}

	function choosePlotOption(e) {
		if (e.target.classList.contains('plotOption')) {
			// remove active class from all plot options
			const plotOptions = document.querySelectorAll('.plotOption');
			plotOptions.forEach((plotOption) => {
				plotOption.classList.remove('active');
			});
			e.target.classList.add('active');
			// find what index the clicked element is in the plotOptions array
			const plotOptionIndex = Array.from(plotOptions).indexOf(e.target);

			let z = $DB;
			z.plots[x][y].type = plotOptionIndex;
			if (plotOptionIndex === -1) {
				z.plots[x][y].active = false;
			} else {
				z.plots[x][y].active = true;
			}
			DB.set(z);
			localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
		}
	}

	export function canBulldoze(x, y) {
        // if the plot has zero or one adjacent neighbors (above, below, left, right), it can be bulldozed. 
        // if the plot has two or more adjacent neighbors, it cannot be bulldozed.
        let neighbors = 0;
        if (x > 0) {
            if ($DB.plots[x - 1][y].type !== -1) {
                neighbors++;
            }
        }
        if (x < $DB.plots.length - 1) {
            if ($DB.plots[x + 1][y].type !== -1) {
                neighbors++;
            }
        }
        if (y > 0) {
            if ($DB.plots[x][y - 1].type !== -1) {
                neighbors++;
            }
        }
        if (y < $DB.plots[0].length - 1) {
            if ($DB.plots[x][y + 1].type !== -1) {
                neighbors++;
            }
        }
        if (neighbors < 2) {
            return true;
        } else {
            return false;
        }
	}
</script>

<div class="dialog">
	<div class="dialog-content">
		Modify plot: {y}, {x}
		<br />
		<button on:click={close} id="close">Close</button>
		<br />
		<label for="plotType">Plot Type</label>
		{#if $DB.plots[x][y].type !== -1 && canBulldoze(x, y)}
			<button on:click={clearPlot} id="bulldoze">🔥</button>
		{/if}

		<div class="plotOptions">
			{#each PlotTypeOptions as option (option)}
				<div
					class="plotOption background-lightgray"
					data-active={option.selected}
					on:click={choosePlotOption}
				>
					<span class="heading_m">{option.title}</span>
					<br />
					<span class="subheading_m">{option.subtitle}</span>
					<br />
					<span class="text_m">{option.description}</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.plotOptions {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-gap: 16px;
	}

	.plotOption {
		border: 1px solid black;
		width: 10em;
		height: 10em;
		min-width: 10em;
		padding: 5px;
		background-color: #f2f2f2;
		display: flex;
		flex-direction: column;
	}

	.dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
	}

	.dialog-content {
		background: white;
		padding: 1em;
		border-radius: 0.5em;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
	}
	#close {
		position: absolute;
		top: 0;
		right: 0;
		margin: 1em;
	}
	#bulldoze {
		position: absolute;
		top: 30px;
		right: 0;
		margin: 1em;
	}
</style>
