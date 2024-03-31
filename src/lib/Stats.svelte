<script>
	import { DB, ACTIVE_GAME_DB_NAME, showKnowledgeMenu } from './store.ts';
	import { numberWithCommas } from './utils.ts';

	export let stats = [];
	export let classText = '';
	export let clickEvents = 'true';

	$: {
		// TODO: Fix bug where gold is sometimes shown as NaN. Possibly related to hot reload.
		stats = [
			{
				label: 'Population',
				value: `${numberWithCommas($DB.townInfo.population_count)}/${numberWithCommas($DB.townInfo.population_max)}`,
				subtitle: `<span
					class='
						rounded-full px-1 py-1 text-xs
						${
							$DB.townInfo.population_count < $DB.townInfo.population_max
								? 'text-red-300'
								: 'text-green-500'
						}
					'>
					${numberWithCommas($DB.townInfo.population_max - $DB.townInfo.population_count)}
				</span>`,
				tap: () => {
					// TODO
				},
			},
			{
				label: 'Employees',
				value: `${numberWithCommas($DB.townInfo.employees)}/${numberWithCommas($DB.townInfo.population_count)}`,
				subtitle: `<span
					class='
						rounded-full px-1 py-1 text-xs
						${
							$DB.townInfo.employees < $DB.townInfo.population_count
								? 'text-red-300'
								: 'text-green-500'
						}
					'>
					${numberWithCommas($DB.townInfo.population_count - $DB.townInfo.employees)}
				</span>`,
				tap: () => {
					// TODO
				},
			},
			{
				label: 'Knowledge',
				value:
					numberWithCommas($DB.townInfo.knowledge_points) +
					`${clickEvents == 'true' ? ' (click me)' : ''}`,
				tap: () => {
					$showKnowledgeMenu = !$showKnowledgeMenu;
				},
			},
			{
				label: 'Gold',
				value: '$' + numberWithCommas(roundTo($DB.townInfo.gold, 0)),
				subtitle: `<span
					class='
						rounded-full px-1 py-1 text-xs
						${$DB.economyAndLaws.last_month_profit < 0 ? 'text-red-300' : 'text-green-500'}
					'>
					${numberWithCommas(roundTo($DB.economyAndLaws.last_month_profit, 0))}
				</span>`,
				tap: () => {
					//
				},
			},
			{
				label: 'Tourism Gold',
				value:
					'$' + numberWithCommas(roundTo($DB.townInfo.gold_from_tourism, 0)),
				tap: () => {
					transferFundsFromBank();
				},
			},
			{
				label: 'Happiness',
				value: `${roundTo($DB.townInfo.happiness, 0)}/${$DB.maximums.happiness}`,
				subtitle: `<span
					class='
						rounded-full px-1 py-1 text-xs 
						${$DB.modifiers.happiness < 1 ? 'text-red-500 opacity-100' : 'text-green-500 opacity-70'}
					'>
					${$DB.modifiers.happiness < 1 ? '' : ''} (${roundTo($DB.modifiers.happiness, 2)}x)
				</span>`,
				tap: () => {
					// TODO
				},
			},
			{
				label: 'Health',
				value: `${roundTo($DB.townInfo.health, 0)}/${$DB.maximums.health}`,
				subtitle: `<span
					class='
						rounded-full px-1 py-1 text-xs transition-all duration-300
						${$DB.modifiers.health < 1 ? 'text-red-500 opacity-100' : 'text-green-500 opacity-70'}
					'>
					${$DB.modifiers.health < 1 ? '' : ''} (${roundTo($DB.modifiers.health, 2)}x)
				</span>`,
				tap: () => {
					// TODO
				},
			},
		];
	}

	export function roundTo(n, digits) {
		if (digits === undefined) {
			digits = 0;
		}
		if (n == null || n == undefined) {
			return 0;
		}

		n = parseFloat((n * Math.pow(10, digits)).toFixed(11));
		var test = Math.round(n) / Math.pow(10, digits);

		return +test.toFixed(digits);
	}

	export function transferFundsFromBank() {
		let z = $DB;
		// Checks gold_from_tourism and as long as you have a bank, it should transfer
		if (z.hasBank === true) {
			z.townInfo.gold += z.townInfo.gold_from_tourism;
			z.townInfo.gold_from_tourism = 0;
			DB.set(z);
			localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
		} else {
			alert('You need a bank to transfer funds from tourism activities.');
		}
	}
</script>

<div class="flex flex-row justify-between pr-5 pl-5 {classText}">
	{#each stats as stat}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="flex flex-col items-center text-center flex-1
				{clickEvents == 'true' ? 'cursor-pointer' : ''}
			"
			on:click={clickEvents == 'true' ? stat.tap : null}
		>
			<span
				class="text-xs pl-4 pr-4 whitespace-nowrap font-bold underline underline-offset-4 mb-1"
			>
				{stat.label}
			</span>

			<span class="text-xs"
				>{stat.value}
				{#if stat.subtitle != null}
					{@html stat.subtitle}
				{/if}</span
			>
		</div>
	{/each}
</div>

<style>
	/* nothin' */
</style>
