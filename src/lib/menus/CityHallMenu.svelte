<script lang="ts">
  import {
    DB,
    hasPlotOfType,
    showCityHallMenu,
    reverseClear,
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
  <Dialog.Content class="bg-foreground text-foregroundText">
    <Dialog.Header>
      <Dialog.Title class="text-xl">
        <div class="flex justify-between mr-10">
          <span>{$DB.townInfo.name}</span>
          <span>🧑‍⚖️ {$DB.resources.bureaucracy}</span>
        </div>
      </Dialog.Title>

      <Dialog.Description class="w-3/4"></Dialog.Description>
      <Separator class="mb-4" />
      <div class="w-full">
        {#if hasPlotOfType("city_hall", $DB).length > 0}
          <span class="text-lg font-bold"> Laws 🧑‍⚖️ </span>
          <!-- each Law in laws -->
          {#each laws as law}
            <div
              class="flex justify-between align-middle items-center pt-2 pb-2 gap-2
            "
            >
              <span>{law.description}</span>
              <Button
                class="bg-button rounded-2xl"
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
                      alert("Not enough bureaucracy!");
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
