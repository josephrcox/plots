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
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <h1
      class="
                text-xl
                w-full
                pb-2
                text-center
                cursor-pointer
            "
      on:click={() => {
        $DB.townLog = [];
      }}
    >
      Alerts
    </h1>
    {#each $DB.townLog as log}
      <p class="text-sm">{log.day}</p>
      <p class="text-xs">{log.message}</p>
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
    ></ul>
  </div>
</div>

<style>
  /*  */
</style>
