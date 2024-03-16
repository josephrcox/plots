<script lang="ts">
	// @ts-ignore
	import { DB, showLabMenu } from '../store.js';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { winScenarios } from '../objects/WinScenarios.js';
	import { difficulty_options } from '../objects/difficulty.js';
	import { experiments } from '$lib/objects/ExperimentsList.js';
	import { Experiment } from '$lib/types.js';
	import { data } from 'autoprefixer';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	const scenarios: any = winScenarios;
	const endGoal = scenarios[$DB.endGoal];
	const difficulty: number = (difficulty_options as any)[$DB.difficulty] || 0;

	let experimentOptions: Experiment[] = [];
	let dbInitialized = false;
	let showAlert = false;
	let generated = false;
	$: if ($DB) {
		dbInitialized = true;
		experimentOptions =
			generated == false ? fetchNewExperiments() : experimentOptions;
		if ($DB.lab.active_experiment?.duration === -1) {
			showAlert = true;
		}
	} else {
		dbInitialized = false;
	}

	function fetchNewExperiments() {
		if (experimentOptions.length > 0 || !dbInitialized) {
			return experimentOptions;
		}

		let newExperiments: Experiment[] = [];
		// filter out experiments already in past_experiments
		let filteredExperiments = experiments.filter(
			(ex) =>
				!$DB.lab.past_experiments.some((past: Experiment) => past.id === ex.id),
		);

		for (let i = 0; i < 3; i++) {
			let ex =
				filteredExperiments[
					Math.floor(Math.random() * filteredExperiments.length)
				];
			ex.cost = Math.floor(ex.cost * (Math.random() * 1.5 + 0.8));
			newExperiments.push(ex);
		}

		newExperiments = newExperiments.filter(
			(value, index) => newExperiments.indexOf(value) === index,
		);
		// remove all entries that are undefined
		newExperiments = newExperiments.filter((n) => n);
		console.log(newExperiments);
		generated = true;
		return newExperiments;
	}

	function purchaseExperiment(chosen: Experiment) {
		if ($DB.townInfo.gold < chosen.cost) {
			alert('You do not have enough gold to purchase this experiment.');
			return;
		}
		$DB.townInfo.gold -= chosen.cost;
		$DB.lab.active_experiment = chosen;
		$DB.lab.past_experiments.push(chosen);
	}

	function completeExperiment() {
		$showLabMenu = false;
		showAlert = true;
		switch ($DB.lab.active_experiment?.id) {
			case 'sunshine':
				$DB.modifiers.happiness = 50;
				break;
			case 'antibiotics':
				$DB.modifiers.health = 50;
				break;
			default:
				break;
		}
		$DB.lab.active_experiment.duration = -1; // used to mark as already done
	}

	function finalizeAndNext() {
		let z = $DB;
		z.lab.xp += Math.round(
			z.lab.active_experiment.cost * (Math.random() * 2 + 0.5),
		);
		z.lab.active_experiment = null;
		showAlert = false;
		$DB = z;
	}

	function formatNumber(n: number) {
		return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
	}
	function roundTo(n: number, digits: number) {
		if (digits === undefined) {
			digits = 0;
		}

		var m = Math.pow(10, digits);
		n = parseFloat((n * m).toFixed(11));
		var test = Math.round(n) / m;
		return +test.toFixed(digits);
	}
</script>

<AlertDialog.Root open={showAlert}>
	<!-- <AlertDialog.Trigger></AlertDialog.Trigger> -->
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title class="text-center"
				>🎉 Experiment Completed: {$DB.lab.active_experiment
					.title}</AlertDialog.Title
			>
			<AlertDialog.Description>
				<div
					class=" select-none whitespace-pre-wrap
					text-lg
					text-gray-400
					leading-6
					px-4
					py-4
					text-center
				"
				>
					{$DB.lab.active_experiment.description}
				</div>
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<!-- <AlertDialog.Cancel>Cancel</AlertDialog.Cancel> -->
			<AlertDialog.Action
				on:click={() => {
					finalizeAndNext();
				}}>Thank the scientists</AlertDialog.Action
			>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<Dialog.Root bind:open={$showLabMenu}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				<span>Manage your Laboratory 🔬 🧪</span>
			</Dialog.Title>

			<Dialog.Description>
				<span
					>You have earned <span
						class="italic
				{$DB.lab.xp < 0 ? 'text-red-500' : 'text-green-500'}
					">{$DB.lab.xp} XP</span
					> from experiments. XP can be used to buy advanced plots and develop your
					city.
				</span>
			</Dialog.Description>
		</Dialog.Header>
		<Separator />
		{#if $DB.lab.active_experiment !== null}
			<!-- spot to show current experiment -->
			Currently running an experiment... check back in {$DB.lab
				.active_experiment.duration} days.
			{#if $DB.lab.active_experiment.duration === 0}
				<Button
					on:click={() => {
						completeExperiment();
					}}
					variant="outline">Complete experiment (and face the impact)</Button
				>
			{/if}
		{:else if experimentOptions.length > 0}
			<div
				class=" select-none
					text-sm
					"
			>
				It's time to fund your next experiment! Choose a project below based on
				it's funding requirement. Once the experiment is over, you will see the
				results.
			</div>
			<div
				class="text-center flex flex-col justify-center
			items-center gap-4
			"
			>
				{#each experimentOptions as ex}
					<Button
						on:click={() => {
							ex.cost < $DB.townInfo.gold ? purchaseExperiment(ex) : null;
						}}
						variant="outline"
						class="min-w-48 w-max
				{ex.cost > $DB.townInfo.gold ? 'cursor-not-allowed' : ''}
				">${formatNumber(ex.cost).split('.')[0]} gold</Button
					>
				{/each}
			</div>
		{:else if experimentOptions.length === 0}
			No more experiments available
		{/if}
		<Separator class="mt-4" />
		<Dialog.Footer>
			<span class="italic text-left text-red-800">
				Keep in mind that not all experiments yield positive results.</span
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	/* nothin' */
</style>
