<script lang="ts">
  import {
    DB,
    expandTown,
    hasPlotOfType,
    showAlert,
    requiredGuardiansForExpansion,
  } from "./store";
  import Btn from "./components/Btn.svelte";
  export let direction: "east" | "south";
</script>

<div class="w-48 h-max">
  {#if hasPlotOfType("city_hall", $DB).length > 0}
    <Btn
      variant="primary"
      on:click={() => {
        const error = expandTown($DB, direction);
        if (error) showAlert(error);
      }}
    >
      <div>
        My liege, you can expand your <br />kingdom
        <span class=" font-extrabold text-blue-200"
          >{direction.toUpperCase()}</span
        >
        using
        <br />your
        <span class="text-blue-200 bold">City Hall</span>!<br /><br />
        <span class="opacity-75 text-xs"
          >Requires {requiredGuardiansForExpansion($DB)} Guardians
          <br />to be employed. (see city mgmt menu)</span
        >
      </div>
    </Btn>
  {:else}
    <span class="text-xs">
      My liege, if you build a City Hall, you can expand your city {direction}
    </span>
  {/if}
</div>
