<script lang="ts">
	// @ts-ignore
	import { DB, clearDB, paused } from '../store.ts';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	let defaultModal = $paused;
	import { winScenarios } from '../objects/WinScenarios.js';
	import { difficulty_options } from '../objects/difficulty.js';

	const scenarios: any = winScenarios;
	const endGoal = scenarios[$DB.endGoal];
	const difficulty: number = (difficulty_options as any)[$DB.difficulty] || 0;

	let dbInitialized = false;
	$: if ($DB) {
		dbInitialized = true;
	} else {
		dbInitialized = false;
	}

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

<Dialog.Root bind:open={$paused}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Pause Menu</Dialog.Title>
			<Dialog.Description>
				{#if $DB.endGoal == 'land'}
					{endGoal.description_title}
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-0">
			{#if $DB.endGoal == 'land'}
				<div class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
					{endGoal.description_title}
				</div>
				<div
					class="text-base leading-relaxed text-gray-500 dark:text-gray-400 mt-4"
				>
					With your difficulty ({difficulty}), you must also have:
				</div>
				<ul
					class="list-inside list-disc text-base leading-relaxed text-gray-500 dark:text-gray-400 mt-0"
				>
					<li>
						{#if $DB.townInfo.population_count >= endGoal.requirements[$DB.difficulty].population_count}
							✅
						{/if}
						Population: {JSON.stringify(
							endGoal.requirements[$DB.difficulty].population_count,
						)} - Currently at {JSON.stringify($DB.townInfo.population_count)}
					</li>
					<li>
						{#if $DB.townInfo.happiness >= endGoal.requirements[$DB.difficulty].happiness}
							✅
						{/if}
						Happiness: {JSON.stringify(
							endGoal.requirements[$DB.difficulty].happiness,
						)} - Currently at {JSON.stringify($DB.townInfo.happiness)}
					</li>
					<li>
						{#if $DB.townInfo.health >= endGoal.requirements[$DB.difficulty].health}
							✅
						{/if}
						Health: {JSON.stringify(
							endGoal.requirements[$DB.difficulty].health,
						)} - Currently at {JSON.stringify($DB.townInfo.health)}
					</li>
					<li>
						{#if $DB.townInfo.employees / $DB.townInfo.population_count >= endGoal.requirements[$DB.difficulty].employment}
							✅
						{/if}
						Employment at {JSON.stringify(
							endGoal.requirements[$DB.difficulty].employment * 100,
						)}% - Currently at {JSON.stringify(
							($DB.townInfo.employees / $DB.townInfo.population_count || 0) *
								100,
						)}%
					</li>
				</ul>
			{/if}
		</div>
		<Dialog.Footer>
			<div class="flex flex-col gap-3">
				<Label class="pb-2">Save or load game</Label>
				<div class="flex gap-10">
					<Button on:click={() => saveGame()}>Save</Button>
					<Input type="file" on:change={loadGame} id="upload" />
				</div>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- 
<Modal
	title="Pause Menu"
	bind:open={defaultModal}
	autoclose
	outsideclose
	on:close={() => {
		$paused = false;
	}}
>
	{#if $DB.endGoal == 'land'}
		<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
			{endGoal.description_title}
		</p>

		<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400 mt-4">
			With your difficulty ({difficulty}), you must also have:
		</p>

		<ul
			class="list-inside list-disc text-base leading-relaxed text-gray-500 dark:text-gray-400 mt-4"
		>
			<li>
				{#if $DB.townInfo.population_count >= endGoal.requirements[$DB.difficulty].population_count}
					✅
				{/if}
				Population: {JSON.stringify(
					endGoal.requirements[$DB.difficulty].population_count,
				)} - Currently at {JSON.stringify($DB.townInfo.population_count)}
			</li>
			<li>
				{#if $DB.townInfo.happiness >= endGoal.requirements[$DB.difficulty].happiness}
					✅
				{/if}
				Happiness: {JSON.stringify(
					endGoal.requirements[$DB.difficulty].happiness,
				)} - Currently at {JSON.stringify($DB.townInfo.happiness)}
			</li>
			<li>
				{#if $DB.townInfo.health >= endGoal.requirements[$DB.difficulty].health}
					✅
				{/if}Health: {JSON.stringify(
					endGoal.requirements[$DB.difficulty].health,
				)} - Currently at {JSON.stringify($DB.townInfo.health)}
			</li>
			<li>
				{#if $DB.townInfo.employees / $DB.townInfo.population_count >= endGoal.requirements[$DB.difficulty].employment}
					✅
				{/if}
				Employment at {JSON.stringify(
					endGoal.requirements[$DB.difficulty].employment * 100,
				)}% - Currently at {JSON.stringify(
					($DB.townInfo.employees / $DB.townInfo.population_count || 0) * 100,
				)}%
			</li>
		</ul>
	{/if}

	<svelte:fragment slot="footer">
		<br />
		<div></div>
		<div class="flex flex-col gap-3">
			<Label class="pb-2">Save or load game</Label>
			<div class="flex gap-10">
				<Button
					id="save"
					on:click={() => {
						saveGame();
					}}>Save</Button
				>

				<Fileupload on:change={loadGame} id="upload" />
			</div>
		</div>
	</svelte:fragment>
</Modal> -->

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
