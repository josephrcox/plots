<script>
	import { onMount } from 'svelte';
	import {
		DB,
		ACTIVE_GAME_DB_NAME,
		speed,
		showBalanceSheet,
		headerHeight,
	} from './store.ts';
	import BalanceSheetMenu from './menus/BalanceSheetMenu.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { Badge } from '$lib/components/ui/badge';

	let balanceSheetComponent;
	let showCityHallControls = false;

	let year = Math.floor($DB.environment.day / 365) + 1;
	let day = $DB.environment.day % 365;
	// change day and year whenever $DB.environment.day changes
	export let stats = [];
	$: {
		const header = document.getElementById('headerObject');
		if (header) {
			$headerHeight = header.offsetHeight;
		}
		year = Math.floor($DB.environment.day / 365) + 1;
		day = $DB.environment.day % 365;
		stats = [
			{
				label: 'Population',
				value: `${$DB.townInfo.population_count}/${$DB.townInfo.population_max}`,
				subtitle: `<span
					class='
						rounded-full px-1 py-1 text-xs
						${
							$DB.townInfo.population_count < $DB.townInfo.population_max
								? 'text-red-500'
								: 'text-green-500'
						}
					'>
					${$DB.townInfo.population_max - $DB.townInfo.population_count}
				</span>`,
				tap: () => {
					// TODO
				},
			},
			{
				label: 'Employees',
				value: `${$DB.townInfo.employees}/${$DB.townInfo.population_count}`,
				subtitle: `<span
					class='
						rounded-full px-1 py-1 text-xs
						${
							$DB.townInfo.employees < $DB.townInfo.population_count
								? 'text-red-500'
								: 'text-green-500'
						}
					'>
					${$DB.townInfo.population_count - $DB.townInfo.employees}
				</span>`,
				tap: () => {
					// TODO
				},
			},
			{
				label: 'Knowledge',
				value: $DB.townInfo.knowledge_points,
				tap: () => {
					// TODO
				},
			},
			{
				label: 'Gold',
				value: roundTo($DB.townInfo.gold, 0),
				// $DB.economy_and_laws.last_month_profit
				subtitle: `<span
					class='
						rounded-full px-1 py-1 text-xs
						${$DB.economyAndLaws.last_month_profit < 0 ? 'text-red-500' : 'text-green-500'}
					'>
					${$DB.economyAndLaws.last_month_profit}
				</span>`,
				tap: () => {
					$showBalanceSheet = !$showBalanceSheet;
				},
			},
			{
				label: 'Tourism 💰',
				value: $DB.townInfo.gold_from_tourism,
				tap: () => {
					transferFundsFromBank();
				},
			},
			{
				label: 'Happiness',
				value: `${roundTo($DB.townInfo.happiness / 3, 0)}/100`,
				subtitle: `<span
					class='
						rounded-full px-1 py-1 text-xs text-white
						${$DB.townInfo.happiness < 50 ? 'text-red-500' : 'text-green-500'}
					'>
					${$DB.modifiers.happiness < 1 ? '🔴' : '🟢'}
				</span>`,
				tap: () => {
					// TODO
				},
			},
			{
				label: 'Health',
				value: `${roundTo($DB.townInfo.health / 3, 0)}/100`,
				subtitle: `<span
					class='
						rounded-full px-1 py-1 text-xs text-white
						${$DB.townInfo.health < 50 ? 'text-red-500' : 'text-green-500'}
					'>
					${$DB.modifiers.health < 1 ? '🔴' : '🟢'}
				</span>`,
				tap: () => {
					// TODO
				},
			},
		];
	}

	function changeName() {
		let newName = prompt('Enter a new name for your town (under 200 chars)');
		if (newName && newName.length < 200) {
			let z = $DB;
			z.townInfo.name = newName;
			DB.set(z);
			localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
		}
	}
	export let speedMultiplier = 1;

	function slowDown() {
		let cspeed = $speed;
		cspeed = cspeed * 2;
		if (cspeed >= 8000) {
			cspeed = 8000;
		}
		$speed = cspeed;
		speedMultiplier = 2000 / $speed;
	}

	function speedUp() {
		let cspeed = $speed;
		cspeed = cspeed / 2;

		if (cspeed <= 250) {
			cspeed = 250;
		}
		$speed = cspeed;
		speedMultiplier = 2000 / $speed;
	}

	function setTaxRate(e) {
		let z = $DB;
		z.economyAndLaws.tax_rate = roundTo(e.target.value, 2);
		DB.set(z);
		localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
	}

	export function roundTo(n, digits) {
		if (digits === undefined) {
			digits = 0;
		}

		var multiplicator = Math.pow(10, digits);
		n = parseFloat((n * multiplicator).toFixed(11));
		var test = Math.round(n) / multiplicator;
		return +test.toFixed(digits);
	}

	export function transferFundsFromBank() {
		let z = $DB;
		// Checks gold_from_tourism and as long as you have a bank, it should transfer
		if (z.hasABank === true) {
			z.townInfo.gold += z.townInfo.gold_from_tourism;
			z.townInfo.gold_from_tourism = 0;
			DB.set(z);
			localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
		} else {
			alert('You need a bank to transfer funds from tourism activities.');
		}
	}

	document.addEventListener('keydown', (e) => {
		let key = e.key.toLowerCase();
		switch (key) {
			case '1':
				e.preventDefault();
				slowDown();
				break;
			case '2':
				e.preventDefault();
				speedUp();
				break;
			default:
				break;
		}
	});

	let intervalId;
</script>

<div
	class="select-none flex flex-col bg-slate-800 fixed top-0 left-0 w-screen text-slate-200 pb-3 pl-5 pr-5"
	id="headerObject"
>
	<div class="select-none flex justify-evenly items-center px-2 pb-0">
		<div>
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				class="text-2xl font-bold cursor-pointer mb-3
				 text-emerald-400"
				id="townName"
				on:click={changeName}
			>
				{$DB.townInfo.name}
			</div>
			<div class="text-xs">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<span on:click={slowDown}>⏪ </span>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<span on:click={speedUp}> ⏩</span>
				{speedMultiplier}x - year {year} day {day}
			</div>
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="
			flex flex-col items-center gap-1 mt-2 drop-shadow-md p-2 rounded-lg max-h-20 ml-6 mr-4 overflow-y-scroll scroll-smooth no-scrollbar"
			on:click={() => {
				$DB.townLog = '';
			}}
		>
			<div class="text-md cursor-pointer">🚨 Alerts</div>
			{#if $DB.townLog.length > 0}
				<div class="townLog text-xs text-start">
					{$DB.townLog.split('\n')[0]}
				</div>
				{#each $DB.townLog.split('\n').slice(1, 300) as line}
					<span
						class="townLog text-xs text-start text-slate-500 cursor-pointer"
					>
						{line}
					</span>
				{/each}
			{:else}
				<span class="townLog text-xs text-start text-slate-500">No Alerts</span>
			{/if}
		</div>
		<div>
			<!-- minimal range for tax rate with a number above representing the tax -->
			<div class=" p-2 rounded-lg m-3 text-center">
				<div class="text-sm cursor-pointer">
					Tax Rate ({$DB.economyAndLaws.tax_rate * 100}%)
				</div>
				<input
					type="range"
					min="0"
					max="1.0"
					step="0.05"
					value={$DB.economyAndLaws.tax_rate}
					on:input={setTaxRate}
					class="cursor-pointer w-100"
				/>
			</div>
		</div>
	</div>
	<Separator
		class="mb-3 mt-0 bg-slate-700
	"
	/>
	<div class="flex flex-row justify-between pr-5 pl-5">
		{#each stats as stat}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				class="flex flex-col items-center cursor-pointer text-center flex-1"
				on:click={stat.tap}
			>
				<span class="text-xs pl-4 pr-4 rounded-lg">
					{stat.label}
				</span>

				<span class="text-xs text-slate-500"
					>{stat.value}
					{#if stat.subtitle != null}
						<!-- stat.subtitle as html -->
						{@html stat.subtitle}
					{/if}</span
				>
			</div>
		{/each}
	</div>
</div>

{#if $showBalanceSheet}
	<BalanceSheetMenu />
{/if}

<style>
	/* no styles */
</style>
