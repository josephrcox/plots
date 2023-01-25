<script>
	import { DB, modifyPlotMenuOptions, showBalanceSheet } from '../store';
	import Draggable from '../Draggable.svelte';

	function openMenu(coords) {
		showBalanceSheet.set(false);
		let x = parseInt(coords.split(',')[0]);
		let y = parseInt(coords.split(',')[1]);
		$modifyPlotMenuOptions.x = x;
		$modifyPlotMenuOptions.y = y;
		$modifyPlotMenuOptions.visible = true;
	}
</script>

<Draggable>
	<div class="dialog">
		<div class="dialog-content">
			<!-- Create an HTML table with columns for day, profits, balance -->
			<div class="heading_m">Balance Sheet</div>
			<br />
			<table>
				<thead>
					<tr>
						<th>Day</th>
						<th>Plot</th>
						<th>Profits</th>
						<th>Balance</th>
					</tr>
				</thead>
				<tbody>
					<!-- Loop through the balance sheet data -->
					{#each $DB.balanceSheetHistory as row}
						<tr>
							<td>{row.day}</td>
							<th
								class="plot_link"
								on:click={() => {
									openMenu(row.plot);
								}}>{row.plot}</th
							>

							<td>{row.profits}</td>
							<td>{row.balance}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</Draggable>

<style>
	.dialog {
		/* position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%); */
        position: absolute;
        top: 50%;
        left: 50%;
		display: flex;
		resize: both;
		height: 200px;
	}

	.dialog-content {
		background: white;
		padding: 1em;
		border-radius: 0.5em;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
		height: 100%;
		overflow: auto;
		resize: both;
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
	td {
		padding-inline: 2em;
		min-width: max-content;
	}
	table {
		height: 100px;
		overflow-y: scroll;
	}
	.plot_link {
		cursor: pointer;
		color: blue;
	}
</style>
