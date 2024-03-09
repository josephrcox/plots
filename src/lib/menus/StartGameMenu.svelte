<script lang="ts">
	import { startGame, DB, startGameMenu } from '../store';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { flyAndScale } from '$lib/utils';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Difficulty, EndGoal, WinScenario } from '$lib/types';
	import { winScenarios } from '$lib/objects/WinScenarios';

	function captureAndStart() {
		const difficulty = (
			document.getElementById('difficulty') as HTMLSelectElement
		).value;
		const endGoal = (document.getElementById('endGoal') as HTMLSelectElement)
			.value;
		const townName = (document.getElementById('townName') as HTMLInputElement)
			.value;
		const dif = difficulty as Difficulty;
		const eg = endGoal as EndGoal;
		startGame(dif, eg, townName);
	}

	let selectedGameMode = 'land';

	const setSelectedGameMode = (e: Event) => {
		selectedGameMode = (e.target as HTMLSelectElement).value;
	};
</script>

<Dialog.Root bind:open={$startGameMenu.visible}>
	<Dialog.Content transition={flyAndScale}>
		<Dialog.Header>
			<Dialog.Title class="mb-4">Welcome to Plots!</Dialog.Title>
			<Dialog.Description>
				<div class="flex flex-col justify-center gap-5">
					<div>
						<Label for="difficulty" class="mt-2">Select a difficulty</Label>
						<select
							id="difficulty"
							class="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						>
							<option value="0">Easy (quick game)</option>
							<option value="1" selected>Normal (longer game)</option>
							<option value="2">Hard (longest game)</option>
						</select>
					</div>

					<div>
						<Label for="endGoal" class="mt-2">Select a gamemode</Label>
						{#if selectedGameMode === 'land'}
							<p class="text-gray-500 text-sm">
								{winScenarios.land.description_title}
							</p>
						{:else}
							<p class="text-gray-500 text-sm">
								{winScenarios.political.description_title}
							</p>
						{/if}

						<select
							id="endGoal"
							class="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
							value={selectedGameMode}
							on:change={setSelectedGameMode}
						>
							<option value="land">Fill up the grid</option>
							<option value="political">Rule the world through politics</option>
						</select>
					</div>

					<div>
						<Label for="townName" class="mt-2">Town Name</Label>
						<Input
							id="townName"
							class="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
							placeholder="Will be randomized if you leave blank"
						/>
					</div>
				</div>
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<!-- Footer -->
			<button
				class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
				on:click={captureAndStart}
			>
				Start game
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	/* .dialog {
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
	} */
</style>
