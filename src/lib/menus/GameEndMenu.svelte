<script>
	import { DB, paused } from '../store.ts';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button, buttonVariants } from '$lib/components/ui/button';

	let show = false;

	$: {
		if ($DB.endGameDetails != null && $DB.overtime == false) {
			show = true;
		} else {
			show = false;
		}
	}

	function keepPlaying() {
		let z = $DB;
		z.overtime = true;
		DB.set(z);
		show = false;
		paused.set(false);
	}
</script>

<Dialog.Root bind:open={show}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				{$DB.endGameDetails.win == true
					? 'You won! 🎉'
					: 'You lost! 😭'}</Dialog.Title
			>
			<Dialog.Description>
				<span class="text-gray-500 text-sm">{$DB.endGameDetails.msg}</span>
				<br />
				<br />
				<Button on:click={keepPlaying}>Keep playin'</Button>
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
	/*  */
</style>
