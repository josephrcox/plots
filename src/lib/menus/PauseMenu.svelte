<script lang="ts">
	// @ts-ignore
	import { DB, clearDB, paused } from '../store.ts';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
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
			<Dialog.Description>Unpause any time by pressing 'P'</Dialog.Description>
		</Dialog.Header>
		<span class="italic">{endGoal.description_title}</span>
		<div class="gap-0 py-0 text-gray-400">
			{#if $DB.endGoal == 'land'}
				<div class="text-base leading-relaxed">
					With your difficulty ({difficulty}), you must also have:
				</div>
				<ul class="list-inside list-disc text-base leading-relaxedmt-0">
					<li>
						{#if $DB.townInfo.population_count >= endGoal.requirements[$DB.difficulty].population_count}
							✅
						{:else}
							❌
						{/if}
						Population: {JSON.stringify(
							endGoal.requirements[$DB.difficulty].population_count,
						)} - Currently at {JSON.stringify($DB.townInfo.population_count)}
					</li>
					<li>
						{#if $DB.townInfo.happiness >= endGoal.requirements[$DB.difficulty].happiness}
							✅
						{:else}
							❌
						{/if}
						Happiness: {JSON.stringify(
							endGoal.requirements[$DB.difficulty].happiness,
						)} - Currently at {JSON.stringify($DB.townInfo.happiness)}
					</li>
					<li>
						{#if $DB.townInfo.employees / $DB.townInfo.population_count >= endGoal.requirements[$DB.difficulty].employment}
							✅
						{:else}
							❌
						{/if}
						Employment: {JSON.stringify(
							endGoal.requirements[$DB.difficulty].employment * 100,
						)}% - Currently at {JSON.stringify(
							($DB.townInfo.employees / $DB.townInfo.population_count || 0) *
								100,
						)}%
					</li>
					<li>
						{#if $DB.townInfo.health >= endGoal.requirements[$DB.difficulty].health}
							✅
						{:else}
							❌
						{/if}
						Health: {JSON.stringify(
							endGoal.requirements[$DB.difficulty].health,
						)} - Currently at {JSON.stringify($DB.townInfo.health)}
					</li>

					<li>
						{#if $DB.townInfo.knowledge_points >= endGoal.requirements[$DB.difficulty].knowledge}
							✅
						{:else}
							❌
						{/if}
						Knowledge: {JSON.stringify(
							endGoal.requirements[$DB.difficulty].knowledge,
						)} - Currently at {JSON.stringify($DB.townInfo.knowledge_points)}
					</li>
				</ul>
				{#if endGoal.requirements[$DB.difficulty].required_plots != null && endGoal.requirements[$DB.difficulty].required_plots.length > 0}
					<br />
					You also need to have these plots:
					{#each endGoal.requirements[$DB.difficulty].required_plots as plot}
						<div class="text-base leading-relaxed">
							<li>{plot}</li>
						</div>
					{/each}
				{/if}
			{/if}
		</div>
		<Dialog.Footer>
			<div class="flex flex-col gap-3">
				<div class="flex gap-10">
					<Label
						for="saveButton"
						class="cursor-pointer bg-blue-600 rounded-md text-center p-2.5 hover:bg-blue-700 justify-center flex 
					">Save game</Label
					>
					<Button
						class="
					bg-blue-600 hover:bg-blue-700 hidden
					"
						id="saveButton"
						on:click={() => saveGame()}>Save</Button
					>

					<Label
						for="upload"
						class="cursor-pointer bg-blue-600 rounded-md text-center p-2.5 hover:bg-blue-700 justify-center flex 
					">Upload game</Label
					>
					<Input class="hidden" type="file" on:change={loadGame} id="upload" />
				</div>
			</div>
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
