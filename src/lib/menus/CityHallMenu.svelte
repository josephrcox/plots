<script lang="ts">
  // City Hall: guardians (needed to expand) and laws.
  import { relieve, NOVELTY } from "../boredom";
  import { DB, hasPlotOfType, showCityHallMenu, showAlert, freeWorkers, syncEmployment } from "../store";
  import { formatAmount } from "$lib/utils";
  import Modal from "$lib/components/Modal.svelte";
  import Btn from "$lib/components/Btn.svelte";
  import { laws } from "$lib/objects/Laws";
  import type { Law } from "$lib/types";

  $: hasCityHall = hasPlotOfType("city_hall", $DB!).length > 0;
  $: free = freeWorkers($DB!);

  function setGuardians(delta: number) {
    if (delta > 0 && free <= 0) return showAlert("Nobody is free to hire.");
    if (delta < 0 && $DB!.townInfo.guardians <= 0) return;
    $DB!.townInfo.guardians += delta;
    syncEmployment($DB!);
    $DB = $DB;
  }

  function toggleLaw(law: Law) {
    const econ = $DB!.economyAndLaws;
    if (econ.enacted.includes(law.id)) {
      econ.enacted = econ.enacted.filter((id) => id !== law.id);
      if (law.id === "tax_free") econ.tax_free_weeks = 0;
    } else if (law.cost <= $DB!.resources.bureaucracy) {
      $DB!.resources.bureaucracy -= law.cost;
      econ.enacted = [...econ.enacted, law.id];
      relieve($DB!, NOVELTY.law);
    } else {
      return showAlert("Not enough bureaucracy.");
    }
    $DB = $DB;
  }
</script>

<Modal
  open={$showCityHallMenu}
  title="🏛️ City Hall"
  subtitle={hasCityHall ? `🧑‍⚖️ ${formatAmount($DB.resources.bureaucracy)} bureaucracy to spend` : "Build a City Hall to hire guardians and pass laws."}
  onClose={() => ($showCityHallMenu = false)}
>
  {#if hasCityHall}
    <section class="card">
      <div class="flex flex-row items-center justify-between gap-3">
        <div class="flex flex-col">
          <span class="font-semibold">⚔️ Guardians</span>
          <span class="text-xs opacity-70">Needed to expand the kingdom. They need homes and food but earn nothing.</span>
        </div>
        <div class="flex flex-row items-center gap-2">
          <Btn disabled={$DB.townInfo.guardians <= 0} on:click={() => setGuardians(-1)}>−</Btn>
          <span class="font-semibold w-6 text-center">{$DB.townInfo.guardians}</span>
          <Btn disabled={free <= 0} on:click={() => setGuardians(1)}>+</Btn>
        </div>
      </div>
      <span class="text-xs opacity-60">{free} people free to hire</span>
    </section>

    <span class="heading">Laws</span>
    {#each laws as law}
      {@const enacted = $DB.economyAndLaws.enacted.includes(law.id)}
      <section class="card flex-row items-center gap-3" class:enacted>
        <span class="flex-1 text-xs leading-relaxed">{law.description}</span>
        {#if enacted}
          <Btn variant="danger" on:click={() => toggleLaw(law)}>Repeal</Btn>
        {:else}
          <Btn variant="primary" disabled={law.cost > $DB.resources.bureaucracy} on:click={() => toggleLaw(law)}
            >Enact 🧑‍⚖️{law.cost}</Btn
          >
        {/if}
      </section>
    {/each}
  {/if}
</Modal>

<style>
  .heading {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.6;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
  }
  .card.enacted {
    background: rgba(168, 115, 75, 0.2);
  }
</style>
