<script>
	import { onMount } from 'svelte';
	import { DB, ACTIVE_GAME_DB_NAME, speed, showBalanceSheet } from './store.ts';
	import BalanceSheetMenu from './menus/BalanceSheetMenu.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { Badge } from '$lib/components/ui/badge';

	let balanceSheetComponent;
	let showCityHallControls = false;

	let year = Math.floor($DB.environment.day / 365) + 1;
	let day = $DB.environment.day % 365;
	// change day and year whenever $DB.environment.day changes
	$: {
		year = Math.floor($DB.environment.day / 365) + 1;
		day = $DB.environment.day % 365;
	}

	const stats = [
		{
			label: 'Population',
			value: `${$DB.townInfo.population_count}/${$DB.townInfo.population_max}`,
			tap: () => {
				// TODO
			},
		},
		{
			label: 'Employees',
			value: `${$DB.townInfo.employees}/${$DB.townInfo.population_count}`,
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
			value: $DB.townInfo.gold,
			tap: () => {
				// toggle balance sheet
				showBalanceSheet = !showBalanceSheet;
			},
		},
		{
			label: 'Tourism Gold',
			value: $DB.townInfo.gold_from_tourism,
			tap: () => {
				transferFundsFromBank();
			},
		},
		{
			label: 'Happiness',
			value: `${roundTo($DB.townInfo.happiness / 3, 0)}/100`,
			tap: () => {
				// TODO
			},
		},
		{
			label: 'Health',
			value: `${roundTo($DB.townInfo.health / 3, 0)}/100`,
			tap: () => {
				// TODO
			},
		},
	];

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

	function roundTo(n, digits) {
		if (digits === undefined) {
			digits = 0;
		}

		var multiplicator = Math.pow(10, digits);
		n = parseFloat((n * multiplicator).toFixed(11));
		var test = Math.round(n) / multiplicator;
		return +test.toFixed(digits);
	}

	function transferFundsFromBank() {
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
	class="noselect flex flex-col bg-slate-800 fixed top-0 left-0 w-screen text-slate-200 pb-3 pl-5 pr-5"
>
	<div class="noselect flex justify-evenly items-center px-2 pt-3 pb-3">
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
			<div class="text-sm">
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
			flex flex-col items-center gap-1 mt-2 drop-shadow-md p-2 rounded-lg max-h-20 overflow-y-scroll scroll-smooth no-scrollbar"
			on:click={() => {
				$DB.townLog = '';
			}}
		>
			<div class="text-xl cursor-pointer">🚨 Alerts</div>
			{#if $DB.townLog.length > 0}
				<div class="townLog text-xs text-start">
					{$DB.townLog.split('\n')[0]}
				</div>
				{#each $DB.townLog.split('\n').slice(1, 300) as line}
					<div class="townLog text-xs text-start text-slate-500">
						{line}
					</div>
				{/each}
			{:else}
				<div class="townLog mt-2">🗑️ No town log messages</div>
			{/if}
		</div>
		<div>
			<!-- minimal range for tax rate with a number above representing the tax -->
			<div class=" p-2 rounded-lg m-3 text-center">
				<div class="text-lg cursor-pointer">Tax Rate</div>
				<input
					type="range"
					min="0"
					max="100"
					step="0.1"
					value={$DB.economyAndLaws.tax_rate}
					on:input={setTaxRate}
					class="cursor-pointer w-100"
				/>
				<div class="text-sm">{$DB.economyAndLaws.tax_rate}%</div>
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
				class="flex flex-col items-center cursor-pointer justify-center text-center flex-1 gap-2"
				on:click={stat.tap}
			>
				<!-- <span class="text-sm cursor-pointer">{stat.label}</span> -->
				<Badge class="text-xs bg-slate-900 text-slate-300">{stat.label}</Badge>
				<span class="text-xs">{stat.value}</span>
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
