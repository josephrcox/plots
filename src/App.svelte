<script lang="ts">
	import PlotController from './lib/PlotController.svelte';
	import GameClock from './lib/gameClock.svelte';
	import Header from './lib/Header.svelte';
	import PauseMenu from './lib/menus/PauseMenu.svelte';

	import {
		ACTIVE_GAME_DB_NAME,
		paused,
		showBalanceSheet,
		unique,
		DB,
		clearDB,
		modifyPlotMenuOptions,
		// @ts-ignore
	} from './lib/store.ts';
	import BalanceSheetMenu from './lib/menus/BalanceSheetMenu.svelte';
	import GameLostMenu from './lib/menus/GameLostMenu.svelte';
	import StartGameMenu from './lib/menus/StartGameMenu.svelte';

	let dbInitialized = false;

	$: if ($DB) {
		dbInitialized = true;
	} else {
		dbInitialized = false;
	}

	let isOnReferencePlot = false;

	// if key P is pressed, pause the game
	document.addEventListener('keydown', (e) => {
		// if input then return
		if (
			((document.activeElement != null &&
				document.activeElement.nodeName === 'INPUT') ||
				(document.activeElement != null &&
					document.activeElement.nodeName == 'TEXTAREA')) &&
			e.key !== 'Escape'
		)
			return;
		let key = e.key.toLowerCase();
		switch (key) {
			case 'p':
				if ($paused == true) {
					paused.set(false);
				} else {
					paused.set(true);
					$modifyPlotMenuOptions.visible = false;
				}
				break;
			case 'escape':
				if (e.shiftKey) {
					$paused = true;
					localStorage.setItem('reset', 'true');
					location.reload();
					clearDB();
				} else {
					if ($modifyPlotMenuOptions.visible == true) {
						$modifyPlotMenuOptions.visible = false;
					}
				}
				break;
			case 'arrowleft':
			case 'a':
				e.preventDefault();
				changeSelectedPlot(0, -1, 'up');
				break;
			case 'arrowright':
			case 'd':
				e.preventDefault();
				changeSelectedPlot(0, 1, 'down');
				break;
			case 'arrowup':
			case 'w':
				e.preventDefault();
				changeSelectedPlot(-1, 0, 'left');
				break;
			case 'arrowdown':
			case 's':
				e.preventDefault();
				changeSelectedPlot(1, 0, 'right');
				break;
			default:
				break;
		}
	});

	function changeSelectedPlot(
		changeX: number,
		changeY: number,
		direction: string,
	) {
		if (
			$modifyPlotMenuOptions.visible === false &&
			$modifyPlotMenuOptions.x === 0 &&
			$modifyPlotMenuOptions.y === 0
		) {
			openPlotMenu(0, 0, direction);
		} else {
			let x = $modifyPlotMenuOptions.x;
			let y = $modifyPlotMenuOptions.y;
			if (x + changeX < 0) {
				x = 0;
			} else if (x + changeX > $DB.plots.length) {
				x = $DB.plots.length;
			} else {
				x += changeX;
			}
			if (y + changeY < 0) {
				y = 0;
			} else if (y + changeY > $DB.plots.length) {
				y = $DB.plots.length;
			} else {
				y += changeY;
			}
			openPlotMenu(x, y, direction);
		}
	}

	export function openPlotMenu(x: number, y: number, direction: string) {
		if (isOnReferencePlot == true) {
			switch (direction) {
				case 'up':
					y -= 2;
					break;
				case 'down':
					y += 1;
					break;
				case 'left':
					x -= 2;
					break;
				case 'right':
					x += 1;
					break;
			}
		}
		if (x < 0) {
			x = 0;
		} else if (x > $DB.plots.length) {
			x = $DB.plots.length;
		}
		if (y < 0) {
			y = 0;
		} else if (y > $DB.plots.length) {
			y = $DB.plots.length;
		}
		let plots = document.querySelectorAll(
			'.plot_container',
		) as NodeListOf<HTMLDivElement>;
		let plot: any;
		plots.forEach((p) => {
			if (p.dataset.x == `$x` && p.dataset.y == `$y`) {
				plot = p;
			}
		});
		if ($paused == false) {
			if (plot.dataset.canBeUpgraded === 'true') {
				$modifyPlotMenuOptions.visible = true;
			} else {
				$modifyPlotMenuOptions.visible = false;
			}
			// check if it has a referencePlot variable, if so, use that instead of the X and Y provided here.
			if (plot.dataset.refPlotX !== undefined && plot.dataset.refPlotY != '') {
				isOnReferencePlot = true;
				plots.forEach((p) => {
					if (
						p.dataset.x == plot.dataset.refPlotX &&
						p.dataset.y == plot.dataset.refPlotY
					) {
						plot = p;
						x = parseInt(plot.dataset.x);
						y = parseInt(plot.dataset.y);
					}
				});
			} else {
				isOnReferencePlot = false;
			}
			if (plot.dataset.size !== '1' && plot.dataset.size !== undefined) {
				isOnReferencePlot = true;
			}
			$modifyPlotMenuOptions.x = x;
			$modifyPlotMenuOptions.y = y;

			plots.forEach((plot) => {
				plot.classList.remove('selected');
				plot.style.border = 'none';
				plot.style.fontWeight = '';
			});
			// Highlight a plot when it's clicked on
			plot.classList.add('selected');

			if (isOnReferencePlot) {
				let borderStyling = '4px solid #00800045';
				// top left
				plot.classList.remove('selected');
				plot.style.borderTop = borderStyling;
				plot.style.borderLeft = borderStyling;
				plot.style.fontWeight = '600';

				// add the selected class to the plots that are one to the right, one below, and one to the right and below.
				plots.forEach((p) => {
					const datasetX = parseInt(`${p.dataset.x}`);
					const datasetY = parseInt(`${p.dataset.y}`);
					if (datasetX == x + 1 && datasetY == y) {
						// left bottom
						p.style.borderLeft = borderStyling;
						p.style.borderBottom = borderStyling;
					}
					if (datasetX == x && datasetY == y + 1) {
						// top right
						p.style.borderTop = borderStyling;
						p.style.borderRight = borderStyling;
					}
					if (datasetX == x + 1 && datasetY == y + 1) {
						// bottom right
						p.style.borderBottom = borderStyling;
						p.style.borderRight = borderStyling;
					}
				});
			}

			// Scroll the plot into view
			plot.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
				inline: 'center',
			});

			$unique = {};
		}
	}
</script>

{#if dbInitialized || $DB == null}
	{#if $DB == null}
		<StartGameMenu />
	{:else}
		{#if $paused == true}
			<PauseMenu />
		{/if}

		{#if $showBalanceSheet == true}
			<BalanceSheetMenu />
		{/if}

		<Header />
		<GameClock />
		<GameLostMenu />
		<div class="plot_grid" data-marginRight={$showBalanceSheet}>
			<PlotController />
			<br />
		</div>

		<style>
			.plot_grid {
				overflow-x: scroll;
				overflow-y: scroll;
				width: 300%;
				height: 300vh;
				margin-top: 175px;
			}
			.plot_grid[data-marginRight='true'] {
				/* This is for when the balanceSheet is being shown. */
				margin-right: 224px;
			}
		</style>
	{/if}
{/if}
