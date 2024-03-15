<script lang="ts">
	// @ts-ignore
	import { DB, showLabMenu } from '../store.js';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
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

	function formatNumber(n: number) {
		return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
	}
</script>

<Dialog.Root bind:open={$showLabMenu}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Placeholder lab menu</Dialog.Title>
			<Dialog.Description>
				<!--  -->
			</Dialog.Description>
		</Dialog.Header>
		lab stuff
		<Dialog.Footer>
			<!--  -->
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	/* nothin' */
</style>
