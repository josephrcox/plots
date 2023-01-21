<script>
	import { DB } from './store.js';
	import { onMount } from 'svelte';
	import { DATABASE_NAME } from './store.js';

	function changeName() {
		let newName = prompt('Enter a new name for your town (under 200 chars)');
		if (newName && newName.length < 200) {
			let z = $DB;
			z.towninfo.name = newName;
			DB.set(z);
			localStorage.setItem(DATABASE_NAME, JSON.stringify(z));
		}
	}
</script>

<div class="header noselect">
	<div class="header__left">
		<div class="heading_l" on:dblclick={changeName}>{$DB.towninfo.name}</div>
		<div class="subheading_m">double click to change name</div>
        <div>(day {$DB.environment.day})</div>
	</div>
	<div class="header__center">
		<div>
			<div class="subheading_m">Population</div>
			<div class="text_m">
				{$DB.towninfo.population_count}/{$DB.towninfo.population_max}
			</div>
		</div>
		<div>
			<div class="subheading_m">Employees</div>
			<div class="text_m">
				{$DB.towninfo.employees}/{($DB.towninfo.population_count)}
			</div>
		</div>
        <div>
			<div class="subheading_m">Gold</div>
			<div class="text_m">
				{$DB.towninfo.gold}
			</div>
		</div>
        <div>
			<div class="subheading_m">Happiness</div>
			<div class="text_m">
				{Math.round($DB.towninfo.happiness)}
			</div>
		</div>
        <div>
			<div class="subheading_m">Health</div>
			<div class="text_m">
				{$DB.towninfo.health}
			</div>
		</div>
        <div>
			<div class="subheading_m">Total visitors</div>
			<div class="text_m">
				{$DB.towninfo.total_visitors}
			</div>
		</div>
	</div>

	<div class="header__right">
		
	</div>
</div>

<style>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		background-color: #161f30;
		border-bottom: 1px solid black;
		color: white;
        /* Pin to the top of the screen at all times */
        position: sticky;
        top: 0;
        z-index: 1;
        width: 100%;
	}

	.header__left {
		display: flex;
		flex-direction: column;
	}

    .header__center {
        display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-gap: 16px;
    }

    .header__center >div>.subheading_m {
        text-align: center;
    }

	.header__right {
		display: flex;
		flex-direction: column;
	}

	.subheading_m {
		color: white;
		border-bottom: 1px solid rgba(255, 255, 255, 0.228);
	}

	table,
	td,
	tr {
		border: 1px solid rgba(128, 128, 128, 0.246);
		border-collapse: collapse;
		border-spacing: 0;
		padding: 3px;
		padding-inline: 6px;
		text-align: start;
	}
</style>
