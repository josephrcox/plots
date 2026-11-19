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

  $: pos = $inspected;
  $: plot = $DB && pos ? $DB.plots[pos.x]?.[pos.y] : null;
  // Close if the building went away (bulldozed, town switched...).
  $: if (pos && (!plot || !plot.active)) inspected.set(null);
  $: option = plot && plot.type > -1 ? options[plot.type] : null;
  $: effects = $DB && pos && plot?.active ? activeEffects(pos.x, pos.y, $DB) : [];
  $: nearWater = $DB && pos ? isAdjacentToWater(pos.x, pos.y, $DB) : false;
  $: liege = $DB && pos ? isLiegeOnPlot(pos.x, pos.y, $DB) : false;
  $: staff = $DB && plot ? staffing($DB).get(plot.id) : undefined;

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
    class="fixed right-3 z-30 w-[240px] bg-sidebarBackground text-sidebarText rounded-xl shadow-2xl border-4 border-foreground p-3 flex flex-col gap-2 max-h-[calc(100vh-230px)] overflow-y-auto no-scrollbar"
    style="top:{HUD.top + 8}px;"
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
        class="chip text-white {effect.good ? 'bg-green-700' : 'bg-red-700'}"
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
