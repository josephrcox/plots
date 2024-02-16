<script>
	import { DB } from '../store.ts';
</script>

{#if $DB.endGameDetails != null}
	<div class="dialog">
		<div class="dialog-content">
			GAME OVER
			<br />
			{$DB.endGameDetails.msg}
			<br />
			<br />
			Reset the game by pressing SHIFT+ESC
		</div>
	</div>
{/if}

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
