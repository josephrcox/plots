<script lang="ts">
  import {
    DB,
    hasPlotOfType,
    showCityHallMenu,
    reverseClear,
    showCustomAlert,
  } from "../store.js";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { winScenarios } from "../objects/WinScenarios.js";
  import { experiments } from "$lib/objects/ExperimentsList.js";
  import { Experiment, Plot } from "$lib/types.js";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { laws } from "$lib/objects/Laws";

  let dbInitialized = false;
  $: if ($DB) {
    dbInitialized = true;
  } else {
    dbInitialized = false;
  }
</script>

<Dialog.Root bind:open={$showCityHallMenu}>
  <Dialog.Content
    class="bg-foreground text-foregroundText h-[80vh] overflow-scroll"
  >
    <Dialog.Header>
      <Dialog.Title class="text-xl">
        <div class="flex justify-between mr-10">
          <span>{$DB.townInfo.name}</span>
          <span>🧑‍⚖️ {$DB.resources.bureaucracy}</span>
        </div>
      </Dialog.Title>

      <Dialog.Description class="w-3/4 overflow-scroll "></Dialog.Description>
      {#if hasPlotOfType("city_hall", $DB).length > 0}
        <Separator class="mb-4" />
        <div class="w-full">
          <span class="text-lg font-bold"> Hire Guardians ⚔️ </span>
          <br />
          <span class="text-sm italic"
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
                on:click={() => {
                  if ($DB.townInfo.guardians > 0) {
                    $DB.townInfo.guardians -= 1;
                    $DB.townInfo.employees -= 1;
                  } else {
                    showCustomAlert.set("No guardians to fire.");
                  }
                }}>-</Button
              >
              <span class="text-lg font-bold select-none px-2">
                {$DB.townInfo.guardians}
              </span>
              <Button
                class="bg-accent rounded-2xl h-min select-none
            
              {$DB.townInfo.employees >= $DB.townInfo.population_count
                  ? 'opacity-50 cursor-not-allowed'
                  : ''}
            "
                on:click={() => {
                  if ($DB.townInfo.employees < $DB.townInfo.population_count) {
                    // There are unemployed people.
                    $DB.townInfo.guardians += 1;
                    $DB.townInfo.employees += 1;
                  } else {
                    showCustomAlert.set("Not enough people.");
                  }
                }}>+</Button
              >
            </div>
            <span class="w-max"
              >{$DB.townInfo.population_count - $DB.townInfo.employees}
              unemployed available for hire.</span
            >
          </div>
        </div>
      {/if}
      <Separator class="mb-4" />
      <div class="w-full">
        {#if hasPlotOfType("city_hall", $DB).length > 0}
          <span class="text-lg font-bold"> Laws 🧑‍⚖️ </span>
          {#each laws as law}
            <div
              class="flex justify-between align-middle items-center pt-2 pb-2 gap-2
            "
            >
              <span>{law.description}</span>
              <Button
                class="bg-accent rounded-2xl 
                {$DB.economyAndLaws.enacted.includes(law.id)
                  ? 'bg-textDanger1'
                  : 'bg-accent'}

                {!$DB.economyAndLaws.enacted.includes(law.id)
                  ? law.cost <= $DB.resources.bureaucracy
                    ? 'cursor-pointer'
                    : 'cursor-not-allowed opacity-30'
                  : 'cursor-pointer'}
                "
                on:click={() => {
                  if ($DB.economyAndLaws.enacted.includes(law.id)) {
                    // Repeal
                    $DB.economyAndLaws.enacted.splice(
                      $DB.economyAndLaws.enacted.indexOf(law.id),
                      1,
                    );
                  } else {
                    // Enact
                    if (law.cost <= $DB.resources.bureaucracy) {
                      $DB.resources.bureaucracy -= law.cost;
                      $DB.economyAndLaws.enacted.push(law.id);
                    } else {
                      showCustomAlert.set("Not enough bureaucracy!");
                    }
                  }
                }}
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
      <!-- <span class="italic text-left text-textDanger1">
        
        </span
      > -->
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  /* nothin' */
</style>
