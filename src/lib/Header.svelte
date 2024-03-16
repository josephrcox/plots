<script>
	import { onMount } from 'svelte';
	import {
		DB,
		ACTIVE_GAME_DB_NAME,
		speed,
		showBalanceSheet,
		headerHeight,
		showLabMenu,
	} from './store.ts';
	import BalanceSheetMenu from './menus/BalanceSheetMenu.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import Tooltip from './Tooltip.svelte';
	import { numberWithCommas } from './utils.ts';
	import Stats from './Stats.svelte';
	import Button from './components/ui/button/button.svelte';
	import LabMenu from './menus/LabMenu.svelte';

	let year;
	let day;
	$: {
		const header = document.getElementById('headerObject');
		if (header) {
			$headerHeight = header.offsetHeight + 32;
		}
		year = Math.floor($DB.environment.day / 365) + 1;
		day = numberWithCommas($DB.environment.day);
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

	let speedMultiplier = 'Normal';

	function toggleSpeed() {
		if ($speed == 500) {
			$speed = 250;
			speedMultiplier = 'Fast';
		} else {
			$speed = 500;
			speedMultiplier = 'Normal';
		}
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

	document.addEventListener('keydown', (e) => {
		let key = e.key.toLowerCase();
		switch (key) {
			case '1':
				e.preventDefault();
				toggleSpeed();
				break;
			case '2':
				e.preventDefault();
				toggleSpeed();
				break;
			default:
				break;
		}
	});

	function showTheLabMenu() {
		showLabMenu.set(true);
	}
</script>

<div
	class="
	<!-- center horizontally -->
	flex justify-center
	text-center
	p-3
	fixed
	top-0
	left-0
	right-0
"
>
	<div
		class="select-none flex flex-col justify-start align-left text-left bg-slate-300 border-b-2 border-black text-black p-3 border-r-20 rounded-lg w-10/12"
		id="headerObject"
	>
		<div class="select-none flex justify-evenly">
			<div>
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div
					class="text-2xl font-bold cursor-pointer
				 text-emerald-700"
					id="townName"
					on:click={changeName}
				>
					{$DB.townInfo.name}
				</div>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="text-xs gap-2 cursor-pointer hover:text-blue-600"
					on:click={toggleSpeed}
				>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div class="flex flex-col">
						<span>{speedMultiplier} speed</span>
						<span>Day {day} ({year}y)</span>
					</div>
				</div>
				<span class="text-xs text-col"
					>💡 Press P to Pause or learn how to play</span
				>
			</div>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="
			flex flex-col gap-1 drop-shadow-md text-center pb-6 rounded-lg max-h-24 h-24 hover:max-h-48 hover:h-48 transition-all ml-6 mr-4 overflow-y-scroll scroll-smooth no-scrollbar cursor-pointer text-slate-500 hover:text-blue-600 w-1/2
			"
				on:click={() => {
					$DB.townLog = '';
				}}
			>
				<div class="text-md cursor-pointer">🚨 Alerts (scroll)</div>
				{#if $DB.townLog.length > 0}
					<div class="townLog text-xs text-center">
						{$DB.townLog.split('\n')[0]}
					</div>
					{#each $DB.townLog.split('\n').slice(1, 300) as line}
						<span class="townLog text-xs text-center cursor-pointer">
							{line}
						</span>
					{/each}
				{:else}
					<span class="townLog text-xs text-slate-500 text-center"
						>No Alerts</span
					>
				{/if}
			</div>
			<div class="">
				<!-- minimal range for tax rate with a number above representing the tax -->
				<div class=" pb-2 rounded-lg text-center">
					<div class="text-sm">
						<span class="text-slate-500">Tax Rate</span>

						<span class="text-sm text-gray-700"
							>({roundTo($DB.economyAndLaws.tax_rate * 100, 0)}%)</span
						>
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
					<br />

					{#if $DB.economyAndLaws.tax_rate == 0}
						<Tooltip text="Set this!!!" />
					{/if}
					<!-- TODO REMOVE TRUE HERE BEFORE MERGE -->
					{#if $DB.hasLab || true}
						<Button
							class="text-xs flex flex-col h-min mt-2"
							on:click={showTheLabMenu}
							><div>Manage Lab</div>
							{#if $DB.lab.active_experiment !== null}
								{#if $DB.lab.active_experiment.duration > 0}
									<span>{$DB.lab.active_experiment.duration}d</span>
								{:else if $DB.lab.active_experiment.duration === 0}
									<span
										class="
									
										animate-pulse
									">✅ DONE!</span
									>
								{/if}
							{/if}
						</Button>
					{/if}
				</div>
			</div>
		</div>
		<Separator
			class="mb-3 mt-0 bg-slate-700
	"
		/>
		<Stats />
	</div>
</div>

{#if $showBalanceSheet}
	<BalanceSheetMenu />
{/if}

<style>
	input[type='range'] {
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		cursor: pointer;
		width: 100px;
	}

	input[type='range']:focus {
		outline: none;
	}

	input[type='range']::-webkit-slider-runnable-track {
		background-color: rgb(3, 71, 117);
		border-radius: 0.5rem;
		height: 0.5rem;
	}

	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		margin-top: -4px;
		background-color: rgb(255, 255, 255);
		height: 1rem;
		width: 1rem;
	}

	input[type='range']:focus::-webkit-slider-thumb {
		border: none;
	}

	input[type='range']::-moz-range-track {
		background-color: rgb(3, 71, 117);
		border-radius: 0.5rem;
		height: 0.5rem;
	}

	input[type='range']::-moz-range-thumb {
		border: none;
		border-radius: 0;
		background-color: rgb(255, 255, 255);
		height: 1rem;
		width: 1rem;
	}

	input[type='range']:focus::-moz-range-thumb {
		border: none;
		outline: 3px solid #053a5f;
		outline-offset: 0.125rem;
	}
</style>
