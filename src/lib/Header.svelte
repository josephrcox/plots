<script>
	import { onMount } from 'svelte';
	import { DB, ACTIVE_GAME_DB_NAME, speed, showBalanceSheet } from './store.ts';
	import BalanceSheetMenu from './menus/BalanceSheetMenu.svelte';
	import HowToPlayMenu from './menus/HowToPlayMenu.svelte';

	let balanceSheetComponent;
	let showCityHallControls = false;

	let year = Math.floor($DB.environment.day / 365) + 1;
	let day = $DB.environment.day % 365;
	// change day and year whenever $DB.environment.day changes
	$: {
		year = Math.floor($DB.environment.day / 365) + 1;
		day = $DB.environment.day % 365;
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

	let showHowToPlay = false;
</script>

<div class="header noselect">
	<div class="header__left">
		<div class="heading_l" on:dblclick={changeName}>{$DB.townInfo.name}</div>
		<div class="subheading_m">double click to change name</div>
		<div>
			<span on:click={slowDown}>⏪ </span> <span on:click={speedUp}> ⏩</span>

			{speedMultiplier}x - year {year} day {day}
		</div>
		{#if $DB.townLog.length > 0}
			<div
				class="townLog message"
				on:click={() => {
					$DB.townLog = '';
				}}
			>
				{$DB.townLog}
			</div>
		{/if}
	</div>

	<div class="header__right">
		<div>
			<div class="subheading_m">👪 Population</div>
			<div class="text_m">
				{$DB.townInfo.population_count}/{$DB.townInfo.population_max}
			</div>
		</div>
		<div>
			<div class="subheading_m">🧑‍🌾 Employees</div>
			<div class="text_m">
				{$DB.townInfo.employees}/{$DB.townInfo.population_count}
				<br />
				{#if $DB.townInfo.population_count - $DB.townInfo.employees > 0}
					<span class="text_ss gray"
						>({$DB.townInfo.population_count - $DB.townInfo.employees} unemployed)</span
					>
				{/if}
			</div>
		</div>
		<div>
			<div class="subheading_m">🧠 Knowledge</div>
			<div class="text_m">
				{$DB.townInfo.knowledge_points}
			</div>
		</div>
		<div
			on:click={() => {
				let show = $showBalanceSheet;
				show = !show;
				showBalanceSheet.set(show);
			}}
		>
			<div class="subheading_m">💰 Gold</div>
			<div class="text_m">
				{$DB.townInfo.gold}
				<br />
				{#if $DB.economyAndLaws.last_month_profit >= 0}
					<span class="text_s green"
						>(+{$DB.economyAndLaws.last_month_profit})</span
					>
				{:else if $DB.economyAndLaws.last_month_profit < 0}
					<span class="text_s red"
						>({$DB.economyAndLaws.last_month_profit})</span
					>
				{/if}
			</div>
		</div>
		<div
			on:click={() => {
				transferFundsFromBank();
			}}
		>
			<div class="subheading_m">💰 Tourism Gold</div>
			<div class="text_m">
				${$DB.townInfo.gold_from_tourism}
			</div>
		</div>
		<div>
			<div class="subheading_m">😁 Happiness</div>
			<div class="text_m">
				{#if $DB.townInfo.happiness >= 50}
					<span class="green">{$DB.townInfo.happiness}</span>
				{:else}
					<span class="red">{$DB.townInfo.happiness}</span>
				{/if}
				<span class="text_ss gray">({roundTo($DB.modifiers.happiness, 2)})</span
				>
				{#if $DB.townInfo.happiness >= 300}
					<span class="yellow max_label">MAX</span>
				{:else if $DB.townInfo.happiness >= 150}
					<span>👍</span>
				{:else if $DB.townInfo.happiness < 150}
					<span>👎</span>
				{/if}
			</div>
		</div>
		<div>
			<div class="subheading_m">🏥 Health</div>
			<div class="text_m">
				{#if $DB.townInfo.health >= 50}
					<span class="green">{$DB.townInfo.health}</span>
				{:else}
					<span class="red">{$DB.townInfo.health}</span>
				{/if}

				<span class="text_ss gray">({roundTo($DB.modifiers.health, 2)})</span>
				{#if $DB.townInfo.health >= 300}
					<span class="yellow max_label">MAX</span>
				{/if}
			</div>
		</div>
	</div>

	<div>
		<div
			class="text_m pointer"
			on:click={() => (showHowToPlay = !showHowToPlay)}
		>
			🏆 {#if showHowToPlay}
				Close
			{:else}
				How to play
			{/if}
		</div>
		<br />
		<div class="taxInfo">
			<div class="subheading_m">Tax rate (more tax = less happiness)</div>
			<input
				type="range"
				min="0"
				max="1"
				step="0.01"
				bind:value={$DB.economyAndLaws.tax_rate}
				on:change={setTaxRate}
			/>
			<div class="incrementalButtons">
				<button
					on:mousedown={() => {
						intervalId = setInterval(() => {
							let z = $DB;
							z.economyAndLaws.tax_rate = roundTo(
								z.economyAndLaws.tax_rate - 0.01,
								2,
							);
							DB.set(z);
							localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
						}, 100);
					}}
					on:mouseup={() => {
						clearInterval(intervalId);
					}}
					on:click={() => {
						// go down by 0.01
						let z = $DB;
						z.economyAndLaws.tax_rate = roundTo(
							z.economyAndLaws.tax_rate - 0.01,
							2,
						);
					}}
				>
					-
				</button>

				<div
					class="text_m"
					on:dblclick={() => {
						let newTaxRate = parseFloat(prompt('Set a new tax rate (0-1)'));
						if (newTaxRate && newTaxRate >= 0 && newTaxRate <= 1) {
							let z = $DB;
							z.economyAndLaws.tax_rate = roundTo(newTaxRate, 2);
							DB.set(z);
							localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
						}
					}}
				>
					{($DB.economyAndLaws.tax_rate * 100).toFixed(0)}%
				</div>

				<button
					on:mousedown={() => {
						intervalId = setInterval(() => {
							let z = $DB;
							z.economyAndLaws.tax_rate = roundTo(
								z.economyAndLaws.tax_rate + 0.01,
								2,
							);
							DB.set(z);
							localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
						}, 100);
					}}
					on:mouseup={() => {
						clearInterval(intervalId);
					}}
					on:click={() => {
						let z = $DB;
						z.economyAndLaws.tax_rate = roundTo(
							z.economyAndLaws.tax_rate + 0.01,
							2,
						);
						DB.set(z);
						localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
					}}
				>
					+
				</button>
			</div>
		</div>
	</div>
</div>

{#if showHowToPlay}
	<HowToPlayMenu />
{/if}

{#if $showBalanceSheet}
	<BalanceSheetMenu />
{/if}

<style>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		background-color: rgb(11, 16, 24);
		border-bottom: 1px solid black;
		color: rgb(232, 230, 227);
		position: fixed;
		top: 0;
		z-index: 1;
		overflow-x: scroll;
		height: min-content;
		gap: 21px;
		width: 97.5%;
		-ms-overflow-style: none;
		scrollbar-width: none;
		overflow-x: clip;
		max-height: 141px;
	}

	.header__left {
		display: flex;
		flex-direction: column;
		width: 30%;
		max-height: 171px;
	}

	.header__right {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-gap: 16px;
		min-width: fit-content;
		padding-inline: 10px;
		max-height: 171px;
	}

	.header__right div {
		min-width: 30px;
	}

	.header__right > div > .subheading_m {
		text-align: center;
	}

	.subheading_m {
		color: white;
		border-bottom: 1px solid rgba(255, 255, 255, 0.228);
	}

	.taxInfo {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: #37496c;
		padding: 9px;
		border-radius: 3px;
	}

	.max_label {
		font-size: 12px;
		font-style: italic;
	}

	.incrementalButtons {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		width: 100%;
		margin-bottom: 5px;
		margin-top: 5px;
	}
</style>
