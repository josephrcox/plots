<script lang="ts">
  import { DB, showLabMenu, showAlert } from "../store";
  import Modal from "$lib/components/Modal.svelte";
  import Btn from "$lib/components/Btn.svelte";
  import { experiments } from "$lib/objects/ExperimentsList";
  import type { Experiment } from "$lib/types";
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

<!-- An experiment finished: show what it did. -->
<Modal
  open={showCompletedAlert}
  dismissible={false}
  size="sm"
  icon="🎉"
  title="Experiment complete: {$DB?.lab.active_experiment?.title ?? ''}"
>
  <p class="text-center opacity-80 whitespace-pre-wrap">{$DB?.lab.active_experiment?.description}</p>
  <svelte:fragment slot="footer">
    <Btn variant="primary" on:click={finalizeAndNext}>Thank the scientists</Btn>
  </svelte:fragment>
</Modal>

<Modal
  open={$showLabMenu}
  title="🧪 Laboratory"
  subtitle="{$DB.lab.xp} XP earned from experiments. Not every experiment goes well."
  onClose={() => ($showLabMenu = false)}
>
  {#if $DB.lab.active_experiment !== null}
    {#if $DB.lab.active_experiment.duration === 0}
      <p>The experiment is finished. Time to face the results.</p>
    {:else}
      <p class="opacity-80">An experiment is running: {$DB.lab.active_experiment.duration} days to go.</p>
    {/if}
  {:else if experimentOptions.length > 0}
    <p class="opacity-80">Fund the next experiment. You'll learn what it does when it's done.</p>
    <div class="flex flex-col gap-1.5">
      {#each experimentOptions as ex}
        <Btn full disabled={ex.cost > $DB.townInfo.gold} on:click={() => purchaseExperiment(ex)}
          >🧪 Mystery experiment · 💰{formatNumber(ex.cost, false)}{$DB.gameSettings.includes("devMode") ? ` (${ex.id})` : ""}</Btn
        >
      {/each}
    </div>
  {:else}
    <p class="opacity-70">No experiments left to run.</p>
  {/if}
  <svelte:fragment slot="footer">
    {#if $DB.lab.active_experiment?.duration === 0}
      <Btn variant="primary" on:click={completeExperiment}>See the results</Btn>
    {/if}
  </svelte:fragment>
</Modal>
