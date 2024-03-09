<script>
	import { DB } from '../store.ts';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { winScenarios } from '../objects/WinScenarios.js';
	import { difficulty_options } from '../objects/difficulty.js';
</script>

<!-- 
{#if $DB.endGameDetails != null}
	<div class="dialog">
		<div class="dialog-content">
			{$DB.endGameDetails.win == true ? 'You won!' : 'You lost!'}
			<br />
			{$DB.endGameDetails.msg}
			<br />
			<br />
			Reset the game by pressing SHIFT+ESC
		</div>
	</div>
{/if} -->

<Dialog.Root bind:open={$DB.endGameDetails}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				{$DB.endGameDetails.win == true
					? 'You won! 🎉'
					: 'You lost! 😭'}</Dialog.Title
			>
			<Dialog.Description>
				<span class="text-gray-500 text-sm">{$DB.endGameDetails.msg}</span>
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer>
			<span class="text-gray-500 text-sm"
				>Reset the game by pressing SHIFT+ESC</span
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

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
