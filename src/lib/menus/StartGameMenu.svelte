<script lang="ts">
	import { startGame } from '../store';

	function captureAndStart() {
		const difficulty = (
			document.getElementById('difficulty') as HTMLSelectElement
		).value;
		const endGoal = (document.getElementById('endGoal') as HTMLSelectElement)
			.value;

		startGame(difficulty, endGoal);
	}
</script>

<div class="dialog">
	<div class="dialog-content">
		Welcome to Plots!
		<br />
		Select a difficulty
		<select id="difficulty">
			<option value="0">Easy (quick game)</option>
			<option value="1" selected>Normal (longer game)</option>
			<option value="2">Hard (longest game)</option>
		</select>
		<br />
		Select a goal
		<select id="endGoal">
			<option value="land" selected>Fill up the grid</option>
			<option value="political">Rule the world through politics</option>
		</select>
		<br />
		<button on:click={captureAndStart}> Start game </button>
	</div>
</div>

<style>
	.dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
	}

	.dialog-content {
		background: rgb(56 72 108);
		padding: 1em;
		border-radius: 0.5em;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
	}
</style>
