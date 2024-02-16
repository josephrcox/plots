<script lang="js">
	import { writable } from 'svelte/store';
	import { DB } from '../store.ts';
	import { winScenarios } from '../objects/WinScenarios.js';
	import { difficulty_options } from '../objects/difficulty.js';

	let showDialog = true;

	function closeDialog() {
		showDialog = false;
	}

	let dbInitialized = false;
	$: if ($DB) {
		dbInitialized = true;
	} else {
		dbInitialized = false;
	}
</script>

{#if dbInitialized && $DB != null && showDialog}
	<div class="dialog">
		<div class="dialog-content">
			HOW TO PLAY ({winScenarios[$DB.endGoal].short_title})
			<br />
			<hr />
			{#if $DB.endGoal == 'land'}
				{winScenarios[$DB.endGoal].description_title}
				<br />
				<br />
				With your difficulty ({difficulty_options[$DB.difficulty]}), you must
				also have:
				<br />
				<br />
				<li>
					Population: {JSON.stringify(
						winScenarios.land.requirements[$DB.difficulty].population_count,
					)}
				</li>
				<br />
				<li>
					Happiness: {JSON.stringify(
						winScenarios.land.requirements[$DB.difficulty].happiness,
					)}
				</li>
				<br />
				<li>
					Health: {JSON.stringify(
						winScenarios.land.requirements[$DB.difficulty].health,
					)}
				</li>
				<br />
				<!-- convert from 1 to 100% -->
				<li>
					Employment at {JSON.stringify(
						winScenarios.land.requirements[$DB.difficulty].employment * 100,
					)}%
				</li>
			{/if}
			<br />
			<hr />
			<br />
			Reset the game by pressing SHIFT+ESC
		</div>
	</div>
{/if}

<style>
	.dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
	}

	.dialog-content {
		background: rgb(56 72 108);
		padding: 1em;
		border-radius: 0.5em;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
	}
</style>
