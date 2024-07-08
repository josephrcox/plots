<script lang="ts">
  import { limeGreen } from "@doist/todoist-api-typescript";
  import { DB, expandTown, hasPlotOfType, showCustomAlert } from "./store";
  import Button from "./components/ui/button/button.svelte";
  export let direction: string;
</script>

<div class="w-48 h-max">
  {#if hasPlotOfType("city_hall", $DB).length > 0}
    <Button
      class="bg-button h-max rounded-2xl hover:scale-110 transition-transform duration-200 ease-in-out hover:drop-shadow-2xl"
      on:click={() => {
        const attempt = expandTown($DB, direction);
        if (attempt) {
          showCustomAlert.set(attempt);
        }
      }}
    >
      <div>
        spanMy liege, you can expand your <br />kingdom
        <span class=" font-extrabold text-blue-200"
          >{direction.toUpperCase()}</span
        >
        using
        <br />your
        <span class="text-blue-200 bold">City Hall</span>!<br /><br />
        <span class="opacity-75 text-xs"
          >Requires {Math.round(Math.pow(1.5, $DB.kingdom_expansions + 5))} Guardians
          <br />to be employed. (see city mgmt menu)</span
        >
      </div>
    </Button>
  {:else}
    <span class="text-xs">
      My liege, if you build a City Hall, you can expand your city {direction}
    </span>
  {/if}
</div>

<style>
  /* your styles go here */
</style>
