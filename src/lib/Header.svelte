<script>
	import { onMount } from 'svelte';
	import { DB, DATABASE_NAME, speed, showBalanceSheet } from './store.js';
	import BalanceSheetMenu from './menus/BalanceSheetMenu.svelte';

	let balanceSheetComponent;

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
			z.towninfo.name = newName;
			DB.set(z);
			localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
		}
	}
	let speedMultiplier = 1;

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
		console.log(cspeed);
		speedMultiplier = 2000 / $speed;
	}

	function setTaxRate(e) {
		let z = $DB;
		z.economy_and_laws.tax_rate = roundTo(e.target.value, 2);
		DB.set(z);
		localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
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

	let intervalId;
</script>

<div class="header noselect">
	<div class="header__left">
		<div class="heading_l" on:dblclick={changeName}>{$DB.towninfo.name}</div>
		<div class="subheading_m">double click to change name</div>
		<div>
			<span on:click={slowDown}>⏪ </span> <span on:click={speedUp}> ⏩</span>

			{speedMultiplier}x - year {year} day {day}
		</div>
		<div class="townLog message" on:click={
			() => {
				$DB.townLog = '';
			}
		}>{$DB.townLog}</div>
	</div>
	<div class="header__center" />

	<div class="header__right">
		<div>
			<div class="subheading_m">👪 Population</div>
			<div class="text_m">
				{$DB.towninfo.population_count}/{$DB.towninfo.population_max}
			</div>
		</div>
		<div>
			<div class="subheading_m">🧑‍🌾 Employees</div>
			<div class="text_m">
				{$DB.towninfo.employees}/{$DB.towninfo.population_count}
				<br />
				{#if $DB.towninfo.population_count - $DB.towninfo.employees > 0}
					<span class="text_ss gray"
						>({$DB.towninfo.population_count - $DB.towninfo.employees} unemployed)</span
					>
				{/if}
			</div>
		</div>
		<div>
			<div class="subheading_m">🧠 Knowledge</div>
			<div class="text_m">
				{$DB.towninfo.knowledge_points}
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
				{$DB.towninfo.gold} 
				<br/>
				{#if $DB.economy_and_laws.lastMonthProfit >= 0}
					 <span class="text_ss green">(+{$DB.economy_and_laws.lastMonthProfit} last 30d)</span>
				{:else if $DB.economy_and_laws.lastMonthProfit < 0}
					 <span class="text_ss red">({$DB.economy_and_laws.lastMonthProfit} last 30d)</span>
				{/if}
			</div>
		</div>
		<div>
			<div class="subheading_m">😁 Happiness</div>
			<div class="text_m">
				{Math.round($DB.towninfo.happiness)}
				<span class="text_ss gray">({roundTo($DB.modifiers.happiness, 2)})</span
				>
				{#if $DB.towninfo.happiness >= 300}
					<span class="yellow max_label">MAX</span>
				{/if}
			</div>
		</div>
		<div>
			<div class="subheading_m">🩺 Health</div>
			<div class="text_m">
				{$DB.towninfo.health}
				<span class="text_ss gray">({roundTo($DB.modifiers.health, 2)})</span>
				{#if $DB.towninfo.health >= 300}
					<span class="yellow max_label">MAX</span>
				{/if}
			</div>
		</div>
	</div>
	<div class="taxInfo">
		<div class="subheading_m">Tax rate (more tax = less happiness)</div>
		<input
			type="range"
			min="0"
			max="1"
			step="0.01"
			bind:value={$DB.economy_and_laws.tax_rate}
			on:change={setTaxRate}
		/>
		<div class="incrementalButtons">
			<button
				on:mousedown={() => {
					intervalId = setInterval(() => {
						let z = $DB;
						z.economy_and_laws.tax_rate = roundTo(
							z.economy_and_laws.tax_rate - 0.01,
							2
						);
						DB.set(z);
						localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
					}, 100);
				}}
				on:mouseup={() => {
					clearInterval(intervalId);
				}}
				on:click={() => {
					// go down by 0.01
					let z = $DB;
					z.economy_and_laws.tax_rate = roundTo(
						z.economy_and_laws.tax_rate - 0.01,
						2
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
						z.economy_and_laws.tax_rate = roundTo(newTaxRate, 2);
						DB.set(z);
						localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
					}
				}}
			>
				{$DB.economy_and_laws.tax_rate}%
			</div>

			<button
				on:mousedown={() => {
					intervalId = setInterval(() => {
						let z = $DB;
						z.economy_and_laws.tax_rate = roundTo(
							z.economy_and_laws.tax_rate + 0.01,
							2
						);
						DB.set(z);
						localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
					}, 100);
				}}
				on:mouseup={() => {
					clearInterval(intervalId);
				}}
				on:click={() => {
					let z = $DB;
					z.economy_and_laws.tax_rate = roundTo(
						z.economy_and_laws.tax_rate + 0.01,
						2
					);
					DB.set(z);
					localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
				}}
			>
				+
			</button>
		</div>
	</div>
</div>

<style>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		background-color: rgb(11, 16, 24);
		border-bottom: 1px solid black;
		color: rgb(232, 230, 227);
		/* Pin to the top of the screen at all times */
		position: sticky;
		top: 0;
		z-index: 1;
		overflow-x: scroll;
		height: 150px;
		gap: 21px;
	}

	.header__left {
		display: flex;
		flex-direction: column;
		min-width: fit-content;
	}

	.header__right {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-gap: 16px;
		min-width: fit-content;
		padding-inline: 10px;
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
