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
	let tableRowCounter = 0;
</script>

<div class="header noselect">
	<div class="header__left">
		<div class="heading_l" on:dblclick={changeName}>{$DB.towninfo.name}</div>
		<div class="subheading_m">double click to change name</div>
	</div>
	<div class="header__right">
		<table>
			{#each Object.entries($DB.towninfo) as [info, value]}
				{#if info !== 'name'}
					<tr>
						<td>{info}</td>
						<td>{value}</td>
					</tr>
				{/if}
			{/each}
		</table>
	</div>
</div>

<style>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		background-color: #161616;
		border-bottom: 1px solid black;
		color: white;
	}

	.header__left {
		display: flex;
		flex-direction: column;
	}

	.header__right {
		display: flex;
		flex-direction: column;
	}

	.subheading_m {
		color: white;
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
