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
  export let canPurchase: boolean;

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
</script>

<Tooltip.Root openDelay={400} closeDelay={0}>
  <Tooltip.Trigger>
    <div
      on:click={canPurchase ? () => purchaseCallback(option) : () => {}}
      class="plotOption"
      data-plotOptionId={option.id}
    >
      <div
        class="flex flex-col w-36 h-48 min-h-32 min-w-36 rounded-xl text-white drop-shadow-lg border-black border-2 hover:translate-y-[-8px] transition-transform duration-300 ease-in-out z-100

        {canPurchase || option.selected
          ? 'cursor-pointer'
          : 'cursor-not-allowed opacity-30'}
        {option.selected ? 'border-4 border-white scale-105' : ''}
            
        "
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
        <div class="bg-sidebarBackground text-black rounded-t-lg py-1">
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
    </div>
  </Tooltip.Trigger>
  <Tooltip.Content>
    <PlotTooltip {option} checkRequirements={true} />
  </Tooltip.Content>
</Tooltip.Root>

<style>
  /* your styles go here */
</style>
