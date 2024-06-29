<script lang="ts">
  import { limeGreen } from "@doist/todoist-api-typescript";
  import { DB, expandTown, hasPlotOfType } from "./store";
  import Button from "./components/ui/button/button.svelte";
  export let direction: string;
</script>

<div class="w-48 h-max">
  {#if hasPlotOfType("city_hall", $DB).length > 0}
    <Button
      class="bg-button h-max rounded-2xl hover:scale-110 transition-transform duration-200 ease-in-out hover:drop-shadow-2xl"
      on:click={() => {
        expandTown($DB, direction);
      }}
    >
      <div>
        My liege, you can expand your <br />kingdom
        <span class=" font-extrabold text-blue-200"
          >{direction.toUpperCase()}</span
        >
        using
        <br />your
        <span class="text-blue-200 bold mx-1">City Hall</span>!<br /><br />
        <span class="italic">May trigger a discovery</span>
      </div>
    </Button>
  {:else}
    <span>
      My liege, if you build a City Hall, you can expand your city {direction}
    </span>
  {/if}
</div>

<style>
  /* your styles go here */
</style>
