<script lang="ts">
	import PlotController from './lib/PlotController.svelte';
	import GameClock from './lib/gameClock.svelte';
	import Header from './lib/Header.svelte';
	import PauseMenu from './lib/menus/PauseMenu.svelte';
	import { DATABASE_NAME, paused, showBalanceSheet, unique } from './lib/store';
	import { modifyPlotMenuOptions } from './lib/store';
	import BalanceSheetMenu from './lib/menus/BalanceSheetMenu.svelte';

	// if key P is pressed, pause the game
	document.addEventListener('keydown', (e) => {
		let key = e.key.toLowerCase();
		console.log(key)
		switch(key) {
			case 'p':
				if ($paused == true) {
					paused.set(false);
				} else {
					paused.set(true);
					$modifyPlotMenuOptions.visible = false;
				}
				break;
			case 'escape':
				if (prompt('Are you sure?') == 'yes') {
					localStorage.removeItem(DATABASE_NAME);
					location.reload();
				}
				break;
			case 'arrowleft': case 'a':
				e.preventDefault();
				changeSelectedPlot(0, -1);
				break;
			case 'arrowright': case 'd':
				e.preventDefault();
				changeSelectedPlot(0, 1);
				break;
			case 'arrowup': case 'w':
				e.preventDefault();
				changeSelectedPlot(-1, 0);
				break;
			case 'arrowdown': case 's':
				e.preventDefault();
				changeSelectedPlot(1, 0);
				break;
			default:
				break;
		}

	});

	function changeSelectedPlot(changeX, changeY) {
		if ($modifyPlotMenuOptions.visible === false && $modifyPlotMenuOptions.x === 0 && $modifyPlotMenuOptions.y === 0) {
			openPlotMenu(0, 0);
		} else {
			let x = $modifyPlotMenuOptions.x;
			let y = $modifyPlotMenuOptions.y;
			if (x + changeX < 0) {
				x = 0;
			} else if (x + changeX > 25) {
				x = 25;
			} else {
				x += changeX;
			}
			if (y + changeY < 0) {
				y = 0;
			} else if (y + changeY > 25) {
				y = 25;
			} else {
				y += changeY;
			}
			openPlotMenu(x, y);
		}
		
	}

	export function openPlotMenu(x,y) {
		let plots = document.querySelectorAll('.plot_container') as NodeListOf<HTMLDivElement>;
		let plot;
		plots.forEach((p) => {
			if (p.dataset.x == x && p.dataset.y == y) {
				plot = p;
			}
		});
		if ($paused == false) {
			$modifyPlotMenuOptions.visible = true;
			$modifyPlotMenuOptions.x = x;
			$modifyPlotMenuOptions.y = y;

			plots.forEach((plot) => {
				plot.classList.remove('selected');
			});
			// Highlight a plot when it's clicked on
			plot
				.classList.add('selected');
			// Scroll the plot into view
			plot.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
			$unique = {};
		}
	}
</script>

{#if $paused == true}
	<PauseMenu />
{/if}

{#if $showBalanceSheet == true}
	<BalanceSheetMenu />
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
	.plot_grid[data-marginright='true'] {
		/* This is for when the balanceSheet is being shown. */
		margin-right: 224px;
	}
</style>
