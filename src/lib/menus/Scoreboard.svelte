<script lang="ts">
	// @ts-ignore
	import { DB, clearDB, showScoreboard } from '../store.js';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { winScenarios } from '../objects/WinScenarios.js';
	import { difficulty_options } from '../objects/difficulty.js';

	const scenarios: any = winScenarios;
	const endGoal = scenarios[$DB.endGoal];
	const difficulty: number = (difficulty_options as any)[$DB.difficulty] || 0;

	let dbInitialized = false;
	$: if ($DB) {
		dbInitialized = true;
	} else {
		dbInitialized = false;
	}
</script>

<Dialog.Root bind:open={$showScoreboard}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Scoreboard</Dialog.Title>
			<Dialog.Description>
				{endGoal.description_title}
			</Dialog.Description>
		</Dialog.Header>
		hi
		<Dialog.Footer>footer</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	/*  */
</style>
