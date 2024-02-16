<script lang="ts">
	import { writable } from 'svelte/store';
	// @ts-ignore
	import { DB } from '../store.ts';
	import { winScenarios } from '../objects/WinScenarios.js';
	import { difficulty_options } from '../objects/difficulty.js';

	let showDialog = true;
	const scenarios: any = winScenarios;
	const endGoal = scenarios[$DB.endGoal];
	const difficulty: number = (difficulty_options as any)[$DB.difficulty] || 0;

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
			HOW TO PLAY ({endGoal.short_title})
			<br />
			<hr />
			{#if $DB.endGoal == 'land'}
				{endGoal.description_title}
				<br />
				<br />
				With your difficulty ({difficulty}), you must also have:
				<br />
				<br />
				<li>
					Population: {JSON.stringify(
						endGoal.requirements[$DB.difficulty].population_count,
					)}
				</li>
				<br />
				<li>
					Happiness: {JSON.stringify(
						endGoal.requirements[$DB.difficulty].happiness,
					)}
				</li>
				<br />
				<li>
					Health: {JSON.stringify(endGoal.requirements[$DB.difficulty].health)}
				</li>
				<br />
				<!-- convert from 1 to 100% -->
				<li>
					Employment at {JSON.stringify(
						endGoal.requirements[$DB.difficulty].employment * 100,
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
