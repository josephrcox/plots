<script lang="ts">
  import {
    DB,
    hasPlotOfType,
    showCityHallMenu,
    showAlert,
    freeWorkers,
    syncEmployment,
  } from "../store";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { laws } from "$lib/objects/Laws";
  import type { Law } from "$lib/types";

  $: hasCityHall = hasPlotOfType("city_hall", $DB!).length > 0;

  function fireGuardian() {
    if ($DB!.townInfo.guardians <= 0) return showAlert("No guardians to fire.");
    $DB!.townInfo.guardians -= 1;
    syncEmployment($DB!);
  }

  function hireGuardian() {
    // Guardians are hired from the unemployed.
    if (freeWorkers($DB!) <= 0) return showAlert("Not enough people.");
    $DB!.townInfo.guardians += 1;
    syncEmployment($DB!);
  }

  function toggleLaw(law: Law) {
    const econ = $DB!.economyAndLaws;
    if (econ.enacted.includes(law.id)) {
      // Repeal
      econ.enacted = econ.enacted.filter((id) => id !== law.id);
      if (law.id === "tax_free") econ.tax_free_weeks = 0;
    } else if (law.cost <= $DB!.resources.bureaucracy) {
      // Enact
      $DB!.resources.bureaucracy -= law.cost;
      econ.enacted = [...econ.enacted, law.id];
    } else {
      showAlert("Not enough bureaucracy!");
    }
    $DB = $DB;
  }
</script>

<Dialog.Root bind:open={$showCityHallMenu}>
  <Dialog.Content class="bg-foreground text-accentText h-[80vh] w-full scroll">
    <Dialog.Header>
      <Dialog.Title class="text-lg">
        <div class="flex justify-between mr-10">
          <span>{$DB.townInfo.name}</span>
          <span>🧑‍⚖️ {$DB.resources.bureaucracy}</span>
        </div>
      </Dialog.Title>

      <Dialog.Description class="w-full "></Dialog.Description>
      {#if hasCityHall}
        <Separator class="mb-4" />
        <div class="w-full">
          <span class="text-lg font-bold"> Hire Guardians ⚔️ </span>
          <br />
          <span class="text-sm"
            >Guardians work for you and are required to expand your kingdom.
            They do not generate revenue, but still require housing & food.
          </span>
          <div
            class="flex flex-row justify-between
         align-middle items-center pt-2 pb-2 gap-2
        "
          >
            <div>
              <!-- left minus, center text value, right plus -->
              <Button
                class="bg-accent rounded-2xl h-min select-none
            {$DB.townInfo.guardians <= 0 ? 'opacity-50 cursor-not-allowed' : ''}
            "
                on:click={fireGuardian}>-</Button
              >
              <span class="text-lg font-bold select-none px-2">
                {$DB.townInfo.guardians}
              </span>
              <Button
                class="bg-accent rounded-2xl h-min select-none
            
              {freeWorkers($DB) <= 0
                  ? 'opacity-50 cursor-not-allowed'
                  : ''}
            "
                on:click={hireGuardian}>+</Button
              >
            </div>
            <span class="w-max"
              >{freeWorkers($DB)}
              unemployed available for hire.</span
            >
          </div>
        </div>
      {/if}
      <Separator class="mb-4" />
      <div class="w-full">
        {#if hasCityHall}
          <span class="text-lg font-bold"> Laws 🧑‍⚖️ </span>
          {#each laws as law}
            <div
              class="flex justify-between align-middle items-center pt-2 pb-2 gap-2
            "
            >
              <span class="text-sm">{law.description}</span>
              <Button
                class="bg-accent rounded-2xl 
                {$DB.economyAndLaws.enacted.includes(law.id)
                  ? 'bg-textDanger'
                  : 'bg-accent'}

                {!$DB.economyAndLaws.enacted.includes(law.id)
                  ? law.cost <= $DB.resources.bureaucracy
                    ? 'cursor-pointer'
                    : 'cursor-not-allowed opacity-30'
                  : 'cursor-pointer'}
                "
                on:click={() => toggleLaw(law)}
              >
                {#if $DB.economyAndLaws.enacted.includes(law.id)}
                  Repeal ❌
                {:else}
                  Enact for 🧑‍⚖️ {law.cost}
                {/if}
              </Button>
            </div>
            <Separator class="bg-white opacity-30" />
          {/each}
        {:else}
          Build a City Hall to manage your city.
        {/if}
      </div>
    </Dialog.Header>
    <Dialog.Footer>
      <!-- <span class=" text-left text-textDanger">
        
        </span
      > -->
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  /* nothin' */
</style>
