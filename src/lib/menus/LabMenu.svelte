<script lang="ts">
  import { DB, showLabMenu, showAlert } from "../store";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { experiments } from "$lib/objects/ExperimentsList";
  import type { Experiment } from "$lib/types";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { formatNumber } from "$lib/utils";

  // Up to three experiments to choose from, with randomized prices.
  let experimentOptions: Experiment[] = [];
  let generated = false;

  $: if ($DB && !generated) {
    experimentOptions = drawExperiments();
    generated = true;
  }
  // duration === -1 marks a completed experiment awaiting acknowledgement.
  $: showCompletedAlert = $DB?.lab.active_experiment?.duration === -1;

  function drawExperiments(): Experiment[] {
    const done = new Set($DB!.lab.past_experiments.map((ex) => ex.id));
    const pool = experiments.filter((ex) => !done.has(ex.id));
    const picks = new Set<Experiment>();
    for (let i = 0; i < 3 && pool.length > 0; i++) {
      picks.add(pool[Math.floor(Math.random() * pool.length)]);
    }
    // Copy so the base price in ExperimentsList isn't overwritten.
    return [...picks].map((ex) => ({
      ...ex,
      cost: Math.floor(Math.random() * (ex.cost * 0.35) + ex.cost * 0.8),
    }));
  }

  function purchaseExperiment(chosen: Experiment) {
    if ($DB!.townInfo.gold < chosen.cost) {
      showAlert("You do not have enough gold to purchase this experiment.");
      return;
    }
    $DB!.townInfo.gold -= chosen.cost;
    $DB!.lab.active_experiment = { ...chosen };
    $DB!.lab.past_experiments = [...$DB!.lab.past_experiments, chosen];
  }

  function completeExperiment() {
    const active = $DB!.lab.active_experiment;
    if (!active) return;
    $showLabMenu = false;
    // Effects are functions, which aren't saved, so look them up by id.
    const experiment = experiments.find((ex) => ex.id === active.id);
    const changed = experiment ? experiment.effect($DB!) : $DB!;
    // Mark as done so the effects can't be applied twice.
    changed.lab.active_experiment!.duration = -1;
    $DB = changed;
  }

  function finalizeAndNext() {
    const z = $DB!;
    const active = z.lab.active_experiment;
    if (active) {
      z.lab.xp += Math.round(active.cost * (Math.random() * 2 + 0.5));
    }
    z.lab.active_experiment = null;
    $DB = z;
    // Offer a fresh set of experiments next time.
    generated = false;
  }
</script>

<AlertDialog.Root open={showCompletedAlert}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title class="text-center"
        >🎉 Experiment Completed: {$DB?.lab.active_experiment
          ?.title}</AlertDialog.Title
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
          {$DB?.lab.active_experiment?.description}
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
            on:click={() => purchaseExperiment(ex)}
            variant="outline"
            class="min-w-48 w-max flex-col
				{ex.cost > $DB.townInfo.gold ? 'cursor-not-allowed' : ''}
				"
            >💰{formatNumber(ex.cost, false)} gold

            {#if $DB.gameSettings.includes("devMode")}
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
