<script lang="ts">
	import { DB, hasPlotOfType, showLabMenu, reverseClear } from '../store.js';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { winScenarios } from '../objects/WinScenarios.js';
	import { experiments } from '$lib/objects/ExperimentsList.js';
	import { Experiment, Plot } from '$lib/types.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	const scenarios: any = winScenarios;

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
			ex.cost = Math.floor(Math.random() * (ex.cost * 0.35) + ex.cost * 0.8);
			newExperiments.push(ex);
		}

		newExperiments = newExperiments.filter(
			(value, index) => newExperiments.indexOf(value) === index,
		);
		// remove all entries that are undefined
		newExperiments = newExperiments.filter((n) => n);
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
			case 'goodbye_carrots':
				removeAllPlotsOfType('carrot_farm');
				break;
			case 'missing_treasure':
				$DB.townInfo.gold += Math.floor(
					Math.random() * $DB.lab.active_experiment.cost * 2,
				);
				break;
			case 'tax_relief':
				$DB.economyAndLaws.max_tax_rate =
					(Math.random() * 0.8 + 1.2) * $DB.economyAndLaws.max_tax_rate;
				break;
			case 'coffee_boost_tourism':
				$DB.townInfo.gold += 5000; // Coffee tourism? Why not!
				$DB.townInfo.gold_from_tourism += 10000; // Coffee tourism? Why not!
				break;
			case 'bee_bonanza':
				removeAllPlotsOfType('coffee_bean_farm');
				break;
			case 'wheat_whirlwind':
				removeAllPlotsOfType('wheat_farm');
				$DB.townInfo.happiness *= 1.5;
				$DB.modifiers.happiness += 3;
				break;
			case 'aquatic_overachievers':
				removeAllPlotsOfType('fishery');
				$DB.townInfo.gold_from_tourism += 30000;
				break;
			case 'educational_eclipse':
				removeAllPlotsOfType('small_school');
				removeAllPlotsOfType('large_school');
				$DB.townInfo.knowledge_points *= 0.8;
				break;
			case 'education_grant':
				$DB.townInfo.knowledge_points *= 1.5;
				$DB.townInfo.gold += 150000;
				break;
			case 'mindfulness_meditation_classes':
				$DB.modifiers.happiness * 1.5;
				break;
			default:
				break;
		}
		// used to mark as already done so that the effects don't double
		$DB.lab.active_experiment.duration = -1;
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

	function removeAllPlotsOfType(typeId: string) {
		let plotsOfType: any[] = hasPlotOfType(typeId, $DB);
		for (let i = 0; i < plotsOfType.length; i++) {
			reverseClear(plotsOfType[i].x, plotsOfType[i].y, $DB);
		}
	}
</script>

<AlertDialog.Root open={showAlert}>
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
						class="min-w-48 w-max flex-col
				{ex.cost > $DB.townInfo.gold ? 'cursor-not-allowed' : ''}
				"
						>${formatNumber(ex.cost).split('.')[0]} gold

						{#if $DB.devMode === true}
							<span class="text-xs text-gray-400"> // dev-{ex.id}</span>
						{/if}
					</Button>
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
