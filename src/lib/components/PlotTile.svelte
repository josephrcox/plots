<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { getColor } from "$lib/objects/PlotTypeOptions";
  import PlotTooltip from "$lib/PlotTooltip.svelte";
  import { DB } from "$lib/store";
  import { Game, PlotOption } from "$lib/types";
  import { formatNumber, getOptionIndex } from "$lib/utils";

  export let option: PlotOption;
  let z: Game = $DB;
  $: z = $DB;

  export let purchaseCallback: (option: PlotOption) => void;

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

  let name = option.title;
  let emoji = option.emoji;
  let cost = option.requirements.gold;
  let costStyle = $DB.townInfo.gold < cost ? "text-red-500 font-semibold" : "";
  let revenue = option.revenue_per_week;
  let employees = option.requirements.employees;
  let employeeCountStyle =
    $DB.townInfo.population_count - $DB.townInfo.employees < employees
      ? "text-red-500 font-semibold"
      : "";
  let requiredPower = option.active_costs.power;
  let color = getColor(getOptionIndex(option.id), false, 5);
  export let count = 0;

  let subtitle = "";
  const resources = Object.entries(option.generated_resources)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => `${value} ${key}`);

  if (resources.length > 0) {
    subtitle = `Produces: ${resources.join(", ")}`;
  }

  function getFailureReasons(): string[] {
    const reasons: string[] = [];
    if (!isAffordable.gold) reasons.push("Not enough gold");
    if (!isAffordable.knowledge) reasons.push("Not enough knowledge");
    if (!isAffordable.resources) reasons.push("Missing resources");
    if (!isAffordable.employees) reasons.push("Not enough workers");
    if (!isAffordable.activeCosts) reasons.push("Can't support active costs");
    if (!isAffordable.adjacent) reasons.push("Missing adjacent plots");
    if (!isAffordable.requiredPlots) reasons.push("Missing required plots");
    return reasons;
  }
</script>

<Tooltip.Root openDelay={400} closeDelay={0}>
  <Tooltip.Trigger>
    <div
      on:click={isAffordable.affordable
        ? () => purchaseCallback(option)
        : () => {}}
      class="plotOption relative"
      data-plotOptionId={option.id}
    >
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
            {#each getFailureReasons() as reason}
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
