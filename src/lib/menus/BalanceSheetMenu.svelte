<script>
	import { DB, modifyPlotMenuOptions, showBalanceSheet } from '../store';

	function openMenu(coords) {
		let x = parseInt(coords.split(',')[0]);
		let y = parseInt(coords.split(',')[1]);
		$modifyPlotMenuOptions.x = x;
		$modifyPlotMenuOptions.y = y;
		$modifyPlotMenuOptions.visible = true;
	}
</script>

<div class="dialog">
	<div class="dialog-content">
		<!-- Create an HTML table with columns for day, profits, balance -->
		<div class="heading_m">Balance Sheet</div>
		<br />
		{#if $DB.balanceSheetHistory.length == 0}
			<div class="text-center padding-sides">
				No data to display yet. Build some buildings and make sure that the tax
				rate is above 0%.
			</div>
		{:else}
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
		{/if}
	</div>
</div>

<style>
	.heading_m {
		padding-left: 5px;
	}
	.dialog {
		position: fixed;
		top: 180px;
		right: 0px;
		display: flex;
		height: 100%;
		padding-top: 0px;
		background-color: rgb(65, 65, 65);
		color: white;
	}

	.dialog-content {
		border-radius: 0.5em;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
		height: 100%;
		overflow: auto;
		padding-top: 10px;
		max-width: 224px;
		background-color: rgb(43, 43, 43);
		color: white;
	}

	table,
	td,
	tr {
		border: 1px solid rgba(0, 0, 0, 0.132);
		border-collapse: collapse;
		border-spacing: 0;
		padding: 0px;
		padding-inline: 6px;
		text-align: start;
		font-size: 0.9em;
	}
	td {
		padding-inline: 2em;
		min-width: max-content;
	}
	table {
		height: 100px;
		overflow-y: scroll;
		min-width: 224px;
	}
	.plot_link {
		cursor: pointer;
		color: rgb(109, 109, 255);
	}
</style>
