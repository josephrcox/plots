<script lang="ts">
	// @ts-ignore
	import {
		DB,
		clearDB,
		paused,
		showKnowledgeMenu,
		ACTIVE_GAME_DB_NAME,
	} from '../store.js';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { winScenarios } from '../objects/WinScenarios.js';
	import { difficulty_options } from '../objects/difficulty.js';
	import LineGraph from '$lib/components/LineGraph.svelte';
	const scenarios: any = winScenarios;
	const endGoal = scenarios[$DB.endGoal];
	const difficulty: number = (difficulty_options as any)[$DB.difficulty] || 0;
	let graphData: number[];
	let marketRate = 0;

	let dbInitialized = false;
	$: if ($DB) {
		dbInitialized = true;
		graphData = $DB.economyAndLaws.knowledge_gold_market_rates;
		marketRate =
			$DB.economyAndLaws.knowledge_gold_market_rates[
				$DB.economyAndLaws.knowledge_gold_market_rates.length - 1
			];
	} else {
		dbInitialized = false;
	}

	export function convertKnowledgeToGold() {
		let z = $DB;
		// Checks gold_from_tourism and as long as you have a bank, it should transfer
		if ($DB.hasBank === true) {
			z.townInfo.gold += z.townInfo.gold_from_tourism;
			z.townInfo.gold_from_tourism = 0;
			DB.set(z);
			localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
		} else {
			alert('You need a bank to convert knowledge to gold.');
		}
	}
</script>

<Dialog.Root bind:open={$showKnowledgeMenu}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Manage your Knowledge</Dialog.Title>
			<Dialog.Description>
				<!--  -->
			</Dialog.Description>
		</Dialog.Header>
		<span class="italic">Knowledge is power, unlock it!</span>
		<div class="py-0 flex flex-col gap-4 text-gray-400">
			<div>
				Your Knowledge is worth <span
					class="
				{marketRate < 0 ? 'text-red-500' : 'text-green-500'}
			">{marketRate}</span
				>
				Gold per unit.
			</div>
			<LineGraph data={graphData} />
			{#if marketRate < 0}
				<div>
					Wait until the market value is <span class="text-green-500"
						>positive</span
					> to sell your Knowledge for Gold.
				</div>
			{/if}
			{#if $DB.hasBank && marketRate > 0}
				<div>
					<Button variant={'default'} on:click={convertKnowledgeToGold}>
						Convert Knowledge to Gold
					</Button>
				</div>
			{:else if marketRate > 0}
				<div class="font-bold">Get a bank to convert 🏦</div>
			{/if}
		</div>
		<Dialog.Footer>
			<!--  -->
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	/* nuttin' */
</style>
