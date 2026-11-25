<script lang="ts">
  // Details for the clicked building: what it does, what its neighbours do
  // to it, and Replace / Bulldoze.
  import { fly } from "svelte/transition";
  import {
    DB,
    reverseClear,
    isLiegeOnPlot,
    isReadOnly,
    staffing,
  } from "./store";
  import { inspected, targetTile, tool, HUD } from "./ui";
  import { options } from "./objects/PlotTypeOptions";
  import { activeEffects } from "./neighbours";
  import { isAdjacentToWater } from "./utils";
  import PlotTooltip from "./PlotTooltip.svelte";
  import { homeOccupancy, weeklyArrivals } from "./migration";
  import { levelStatus, MAX_LEVEL } from "./housing";

  $: pos = $inspected;
  $: plot = $DB && pos ? $DB.plots[pos.x]?.[pos.y] : null;
  // Close if the building went away (bulldozed, town switched...).
  $: if (pos && (!plot || !plot.active)) inspected.set(null);
  $: option = plot && plot.type > -1 ? options[plot.type] : null;
  $: effects = $DB && pos && plot?.active ? activeEffects(pos.x, pos.y, $DB) : [];
  $: nearWater = $DB && pos ? isAdjacentToWater(pos.x, pos.y, $DB) : false;
  $: liege = $DB && pos ? isLiegeOnPlot(pos.x, pos.y, $DB) : false;
  $: staff = $DB && plot ? staffing($DB).get(plot.id) : undefined;
  $: home = $DB && plot ? homeOccupancy($DB).get(plot.id) : undefined;
  $: arrivals = $DB ? weeklyArrivals($DB) : 0;
  $: level = $DB && plot && home ? levelStatus(plot, $DB, home.people >= home.capacity) : null;

  function replace() {
    if (!pos) return;
    tool.set({ kind: "none" });
    targetTile.set(pos);
    inspected.set(null);
  }

  function bulldoze() {
    if (!pos || !$DB) return;
    reverseClear(pos.x, pos.y, $DB);
    inspected.set(null);
  }
</script>

{#if plot && option && pos}
  <div
    class="fixed right-3 z-30 bg-popupBackground text-white rounded-xl shadow-2xl p-3 flex flex-col gap-2 max-h-[calc(100vh-230px)] overflow-y-auto no-scrollbar"
    style="top:{HUD.top + 8}px; width:{HUD.panel - 16}px;"
    transition:fly={{ x: 40, duration: 150 }}
  >
    <div class="flex flex-row items-start justify-between">
      <span class="text-lg font-semibold">{option.emoji} {option.title}</span>
      <button
        class="text-lg leading-none opacity-60 hover:opacity-100 px-1"
        title="Close (Esc)"
        on:click={() => inspected.set(null)}>×</button
      >
    </div>

    {#if plot.disabled}
      <span class="chip bg-red-600 text-white"
        >⚠️ Shut down: it can't cover its running costs</span
      >
    {/if}
    {#if home}
      <span
        class="chip text-white {home.people < home.capacity
          ? 'bg-amber-600'
          : 'bg-green-700'}"
        >🏠 {home.people} of {home.capacity} people{home.people < home.capacity
          ? arrivals > 0
            ? `. Newcomers arrive weekly (about ${arrivals} town-wide).`
            : ". Nobody is moving in right now."
          : " (full)"}</span
      >
    {/if}
    {#if level}
      <div class="chip bg-yellow-900 text-white flex flex-col gap-1">
        <span class="font-semibold"
          >{"★".repeat(level.level)} Level {level.level} home · room for {level.capacity}</span
        >
        {#if level.trend === "down"}
          <span class="text-red-300"
            >Declining ({level.progress}/{level.weeks} weeks): {level.slipping.join(", ")}</span
          >
        {:else if level.trend === "up"}
          <span class="text-green-300"
            >Growing to level {level.level + 1} ({level.progress}/{level.weeks} weeks)</span
          >
        {:else if level.level < MAX_LEVEL}
          <span class="opacity-80">To grow, it needs {level.missing.join(", ")}.</span>
        {:else}
          <span class="opacity-80">Top level.</span>
        {/if}
      </div>
    {/if}
    {#if staff && staff.staffed < staff.needed}
      <span class="chip bg-amber-600 text-white"
        >👷 {staff.staffed} of {staff.needed} workers: running at {Math.round(
          (staff.staffed / staff.needed) * 100,
        )}%. Build homes for more people.</span
      >
    {:else if staff}
      <span class="chip bg-green-700 text-white"
        >👷 Fully staffed ({staff.needed} workers)</span
      >
    {/if}
    {#if nearWater}
      <span class="chip bg-blue-500 text-white"
        >💧 Near water: more food and revenue</span
      >
    {/if}
    {#if liege}
      <span class="chip bg-pink-700 text-white"
        >👑 {option.liege_on_plot_hint ?? "You're here: revenue boost"}</span
      >
    {/if}
    {#each effects as effect}
      <span
        class="chip text-white {effect.neutral
          ? 'bg-sky-800'
          : effect.good
            ? 'bg-green-700'
            : 'bg-red-700'}"
        >{effect.text}</span
      >
    {/each}

    <PlotTooltip {option} checkRequirements={false} showTitle={false} />

    {#if !isReadOnly}
      <div class="flex flex-row gap-2 pt-1">
        <button class="action bg-accent" on:click={replace}>🔁 Replace</button>
        <button class="action bg-destructive" on:click={bulldoze}
          >🚜 Bulldoze</button
        >
      </div>
    {/if}
  </div>
{/if}

<style>
  .chip {
    font-size: 0.72rem;
    padding: 6px 10px;
    border-radius: 12px;
  }
  .action {
    flex: 1;
    color: white;
    font-size: 0.8rem;
    padding: 6px 0;
    border-radius: 8px;
  }
  .action:hover {
    filter: brightness(1.1);
  }
</style>
