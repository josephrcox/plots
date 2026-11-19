<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { getColor } from "$lib/objects/PlotTypeOptions";
  import PlotTooltip from "$lib/PlotTooltip.svelte";
  import { DB, freeWorkers } from "$lib/store";
  import type { PlotOption } from "$lib/types";
  import type { EffectLine } from "$lib/neighbours";
  import { formatNumber, getOptionIndex } from "$lib/utils";

  // Clicks are handled by the parent (BottomBar) via `data-plotOptionId`.
  export let option: PlotOption;
  export let isAffordable: {
    affordable: boolean;
    gold: boolean;
    knowledge: boolean;
    resources: boolean;
    employees: boolean;
    activeCosts: boolean;
    adjacent: boolean;
    requiredPlots: boolean;
  };
  /** What building here would do to/with its neighbours. */
  export let neighbourEffects: EffectLine[] = [];

  $: name = option.title;
  $: emoji = option.emoji;
  $: cost = option.requirements.gold;
  $: revenue = option.revenue_per_week;
  $: employees = option.requirements.employees;
  $: requiredPower = option.active_costs.power;
  $: color = getColor(getOptionIndex(option.id), false, 5);
  $: costStyle = $DB!.townInfo.gold < cost ? "text-red-500 font-semibold" : "";
  $: employeeCountStyle =
    freeWorkers($DB!) < employees
      ? "text-red-500 font-semibold"
      : "";

  $: producedResources = Object.entries(option.generated_resources)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => `${value} ${key}`);
  $: subtitle =
    producedResources.length > 0
      ? `Produces: ${producedResources.join(", ")}`
      : "";

  $: failureReasons = [
    [isAffordable.gold, "Not enough gold"],
    [isAffordable.knowledge, "Not enough knowledge"],
    [isAffordable.resources, "Missing resources"],
    [isAffordable.employees, "Not enough workers"],
    [isAffordable.activeCosts, "Can't support active costs"],
    [isAffordable.adjacent, "Missing adjacent plots"],
    [isAffordable.requiredPlots, "Missing required plots"],
  ]
    .filter(([ok]) => !ok)
    .map(([, reason]) => reason as string);
</script>

<Tooltip.Root openDelay={400} closeDelay={0}>
  <Tooltip.Trigger>
    <div class="plotOption relative" data-plotOptionId={option.id}>
      <div
        class="flex flex-col w-36 h-48 min-h-32 min-w-36 rounded-xl text-white z-10 drop-shadow-lg border-black border-2 hover:translate-y-[-8px] transition-transform duration-300 ease-in-out z-100
        {option.selected ? 'border-4 border-white scale-105' : ''}"
        style="background: {color};"
      >
        <!-- first div should take up most of the height -->
        <div
          class="flex flex-col flex-grow rounded-xl p-2 gap-0 justify-center items-center"
        >
          <span class="text-3xl"> {emoji}</span>
          <span class="font-medium text-center text-md">
            {name}
          </span>
          {#if option.selected}
            <span class="text-[11px] text-wrap text-yellow-300"
              >Click to bulldoze
            </span>
          {:else if subtitle}
            <span class="text-[11px] text-wrap">{subtitle} </span>
          {/if}
          {#each neighbourEffects as effect}
            <span
              class="text-[10px] leading-tight text-wrap mt-0.5 px-1 rounded {effect.good
                ? 'bg-green-900/60 text-green-200'
                : 'bg-red-900/60 text-red-200'}">{effect.text}</span
            >
          {/each}
        </div>
        <div class="bg-sidebarBackground text-black rounded-b-lg z-50 py-1">
          {#if employees}
            <span class="text-[11px] opacity-80"
              >Hires
              <span class="{employeeCountStyle} font-medium">{employees}</span>

              employees</span
            >
          {/if}
          <div
            class="flex flex-row justify-between mx-2 text-[11px] font-mono items-center"
          >
            <span class=" {costStyle}">💰{formatNumber(cost, false)}</span>

            {#if revenue > 0}
              <span>+💰{formatNumber(revenue, false)}/wk</span>
            {/if}
          </div>
          <div class="flex flex-row justify-between mx-2 text-[11px] font-mono">
            {#if requiredPower > 0}
              <span>🔌{requiredPower}</span>
            {/if}
          </div>
        </div>
      </div>

      {#if !isAffordable.affordable && !option.selected}
        <div
          class="absolute inset-0 flex items-start justify-center rounded-xl bg-black/80"
        >
          <div class="p-2 text-center mt-4">
            <div class="text-white font-bold text-lg mb-2">
              {name}
            </div>
            {#each failureReasons as reason}
              <div class="text-red-400 font-semibold text-[10px] mb-1">
                {reason}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </Tooltip.Trigger>
  <Tooltip.Content>
    <PlotTooltip {option} checkRequirements={true} />
  </Tooltip.Content>
</Tooltip.Root>

<style>
  .plotOption {
    position: relative;
  }
</style>
