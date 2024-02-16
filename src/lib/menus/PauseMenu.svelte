<script lang="ts">
	// @ts-ignore
	import { DB, clearDB } from '../store.ts';

	function saveGame() {
		const data = JSON.stringify($DB);
		const blob = new Blob([data], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${new Date().toISOString()}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function loadGame() {
		const uploader = document.getElementById('upload') as HTMLInputElement;
		const files = uploader.files;
		if (files == null) return;
		const file = files[0];
		const reader = new FileReader();
		reader.onload = function (e) {
			if (e.target == null) return;
			const contents = e.target.result;
			if (typeof contents === 'string') {
				if (!isValidFile(contents)) {
					alert('Invalid game file');
					return;
				}
				clearDB(JSON.parse(contents));
			} else {
				alert('Invalid game file: is not String.');
			}
		};
		reader.readAsText(file);
	}

	function isValidFile(s: string) {
		const json = JSON.parse(s);
		if (json.townInfo != null && json.difficulty != null) return true;
		return false;
	}
</script>

<div class="dialog">
	<div class="dialog-content">
		The game is paused!
		<br />
		Load file:
		<input type="file" id="upload" on:change={loadGame} />
		<br />
		Backup save:
		<button id="save" on:click={saveGame}>Save</button>
		<br />
		Unpause the game by pressing P
		<br />
		<br />
		Reset the game by pressing SHIFT+ESC
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
