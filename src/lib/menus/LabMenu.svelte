<script lang="ts">
  import {
    DB,
    hasPlotOfType,
    showLabMenu,
    reverseClear,
    showCustomAlert,
  } from "../store.js";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { experiments } from "$lib/objects/ExperimentsList.js";
  import { Experiment, Plot } from "$lib/types.js";
  import Separator from "$lib/components/ui/separator/separator.svelte";

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
    if (filteredExperiments.length === 0) {
      return [];
    }

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
      showCustomAlert.set(
        "You do not have enough gold to purchase this experiment.",
      );
      return;
    }
    $DB.townInfo.gold -= chosen.cost;
    $DB.lab.active_experiment = chosen;
    $DB.lab.past_experiments.push(chosen);
  }

  function completeExperiment() {
    $showLabMenu = false;
    showAlert = true;
    // fire the experiment's effects
    let experiment = experimentOptions.find(
      (ex) => ex.id === $DB.lab.active_experiment.id,
    );
    let changedDB = experiment != null ? experiment.effect($DB) : $DB;
    $DB = changedDB;

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
    return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
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
  <Dialog.Content class="bg-foreground text-accentText">
    <Dialog.Header>
      <Dialog.Title>
        <span>Manage your Laboratory 🔬 🧪</span>
      </Dialog.Title>

      <Dialog.Description>
        <span
          >You have earned <span
            class="
				{$DB.lab.xp < 0 ? 'text-textDanger' : 'text-primaryText'}
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
            >${formatNumber(ex.cost).split(".")[0]} gold

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
      <span class=" text-left text-textDanger">
        Keep in mind that not all experiments yield positive results.</span
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  /* nothin' */
</style>
