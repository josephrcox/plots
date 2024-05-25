<script lang="ts">
	// @ts-ignore
	import { DB, showKnowledgeMenu, ACTIVE_GAME_DB_NAME } from '../store.js';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { winScenarios } from '../objects/WinScenarios.js';
	import { difficulty_options } from '../objects/difficulty.js';
	import LineGraph from '$lib/components/LineGraph.svelte';
	const scenarios: any = winScenarios;
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
		if ($DB.hasBank === true) {
			z.townInfo.gold += Math.round(z.townInfo.knowledge_points * marketRate);
			z.townInfo.knowledge_points = 0;
			DB.set(z);
			localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
		} else {
			alert('You need a bank to convert knowledge to gold.');
		}
	}

	function formatNumber(n: number) {
		return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
	}
</script>

<Dialog.Root bind:open={$showKnowledgeMenu}>
	<Dialog.Content
		transitionConfig={{ duration: 0 }}
		class="bg-foreground text-foregroundText"
	>
		<Dialog.Header>
			<Dialog.Title
				>Manage your Knowledge ({$DB.townInfo.knowledge_points} pts)</Dialog.Title
			>
			<Dialog.Description>
				<!--  -->
			</Dialog.Description>
		</Dialog.Header>
		<span class="italic">Knowledge is power, unlock it!</span>
		<div class="py-0 flex flex-col gap-4 text-gray-400 overflow-x-auto">
			<div>
				Market Rate: <span
					class="
				{marketRate < 0 ? 'text-red-500' : 'text-green-500'}
			">{marketRate ?? 0} gold</span
				>
				per Knowledge Point
				{#if marketRate > 0}
					<br />
					(total value: ${formatNumber(
						$DB.townInfo.knowledge_points * marketRate,
					)})
				{/if}
			</div>
			<LineGraph data={graphData} />

			{#if marketRate < 0}
				<div>
					Wait until the market value is <span class="text-green-500"
						>positive</span
					> to sell your Knowledge for Gold. Keep in mind that you need a bank to
					convert.
				</div>
			{/if}
			{#if $DB.hasBank && marketRate > 0}
				<div>
					<Button variant={'default'} on:click={convertKnowledgeToGold}>
						Convert Knowledge to Gold
					</Button>
				</div>
			{/if}
			{#if $DB.hasBank === false}
				<div>You need a bank to convert knowledge to gold.</div>
			{/if}
		</div>
		<Dialog.Footer>
			<!--  -->
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	/* nothin' */
</style>
