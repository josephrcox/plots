<script lang="ts">
  import { roundTo } from "./utils";
  import { DB, ACTIVE_GAME_DB_NAME, modifyPlotMenuOptions } from "./store";
  import { Vibe } from "./types";
  let mute: string = localStorage.getItem("mute") || "false";

  $: {
    mute = localStorage.getItem("mute") || "false";
  }
</script>

<!-- fixed to left side and fill entire height -->
<div class="flex flex-row text-foregroundText">
  <div
    class="bg-foreground w-[160px] border-foregroundDark border-4
			{$modifyPlotMenuOptions.visible ? 'bottom-8  opacity-70' : 'bottom-2'}
		z-10 fixed left-3 py-2 top-[190px] drop-shadow-xl rounded-xl transition-all duration-300 overflow-y-clip"
  >
    <!-- left sidebar -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div class="flex flex-row gap-2 items-start justify-center">
      <h1
        class="
                text-xl

                pb-2
                
                cursor-pointer
            "
        on:click={() => {
          $DB.townLog = [];
        }}
      >
        Alerts
      </h1>
      <button
        on:click={() => {
          localStorage.setItem(
            "mute",
            mute == "false" ? "true" : mute === "true" ? "false" : "true",
          );
          mute = localStorage.getItem("mute") || "false";
        }}
      >
        {mute == "true" ? "🔇" : "🔊"}
      </button>
    </div>
    <div class="overflow-y-scroll h-[100%] w-[100%] px-1 pb-16 scroll-smooth">
      {#if $DB.townLog.length == 0}
        <p class="text-center">No alerts</p>
      {/if}
      {#each $DB.townLog as log}
        <div
          class=" p-2 rounded-2xl fade-in
        {log.vibe == Vibe.BAD
            ? 'bg-red-600'
            : log.vibe == Vibe.GOOD
              ? 'bg-green-600'
              : log.vibe == Vibe.NORMAL
                ? 'bg-accent'
                : 'bg-accent'}
      
      "
        >
          <p
            class="font-mono text-[10px]
          "
          >
            DAY {log.day}
          </p>
          <p class="text-xs pb-1">{log.message}</p>
        </div>
        <br />
      {/each}
    </div>

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
  .fade-in {
    animation: fadeIn 0.5s;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
