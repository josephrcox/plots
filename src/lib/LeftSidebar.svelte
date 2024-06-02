<script lang="ts">
  import { roundTo } from "./utils";
  import { DB, ACTIVE_GAME_DB_NAME, modifyPlotMenuOptions } from "./store";
</script>

<!-- fixed to left side and fill entire height -->
<div class="flex flex-row text-foregroundText">
  <div
    class="bg-foreground w-[160px] border-foregroundDark border-4
			{$modifyPlotMenuOptions.visible ? 'bottom-8  opacity-70' : 'bottom-2'}
		z-10 fixed left-3 p-3 top-[190px] drop-shadow-xl rounded-xl transition-all duration-300"
  >
    <!-- left sidebar -->
    <h1
      class="
                text-xl
                w-full
                pb-2
                text-center
            "
    >
      Alerts
    </h1>
    {#if $DB.townLog == ""}
      <span class="text-sm italic text-center opacity-70"
        >No alerts in the last 30d</span
      >
    {/if}
    {#each $DB.townLog.split("\n") as log}
      <p class="text-xs">{log}</p>
      <br />
    {/each}

    <ul
      class="
                list-disc
                pl-5
                gap-2
                flex
                flex-col text-xs
            "
    >
      <!-- <li class="text-textDanger3">Citizens are somewhat horny</li>
			<li class="text-textDanger2">Citizens are mildly horny</li>
			<li class="text-textDanger1">Citizens are incredibly horny</li> -->
    </ul>
  </div>
</div>

<style>
  /*  */
</style>
