<script lang="ts">
  import Header from "./Header.svelte";
  import PlotController from "./PlotController.svelte";
  import { roundTo } from "./utils";
  import { DB, ACTIVE_GAME_DB_NAME, modifyPlotMenuOptions } from "./store";
  import LeftSidebar from "./LeftSidebar.svelte";
  import Slider from "./components/ui/slider/slider.svelte";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import TooltipContent from "./components/ui/tooltip/tooltip-content.svelte";
  import Separator from "./components/ui/separator/separator.svelte";
  import { options } from "./objects/PlotTypeOptions";

  type ResourceKey = "food" | "wood" | "stone" | "coal" | "metal";

  function setTaxRate(newRate: number[]) {
    let z = $DB;
    z.economyAndLaws.tax_rate = roundTo(newRate[0], 2);
    DB.set(z);
    localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
  }

  function setProductivity(newProductivity: number[]) {
    let z = $DB;
    z.townInfo.productivity = roundTo(newProductivity[0], 2);
    DB.set(z);
    localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
  }

  let resources = [];
  $: resources = [
    {
      icon: "🥕",
      name: "food",
      value: $DB.resources.food,
      rate: $DB.resource_rate.food,
    },
    {
      icon: "🪵",
      name: "wood",
      value: $DB.resources.wood,
      rate: $DB.resource_rate.wood,
    },
    {
      icon: "⛏️",
      name: "stone",
      value: $DB.resources.stone,
      rate: $DB.resource_rate.stone,
    },
    {
      icon: "🪨",
      name: "coal",
      value: $DB.resources.coal,
      rate: $DB.resource_rate.coal,
    },
    {
      icon: "🧲",
      name: "metal",
      value: $DB.resources.metal,
      rate: $DB.resource_rate.metal,
    },
  ];

  function plotsThatNeed(resourceIndex: ResourceKey): string[] {
    let plotsThatNeed: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].requirements.resources[resourceIndex] > 0) {
        plotsThatNeed.push(options[i].title);
      }
    }
    return plotsThatNeed;
  }

  function isValidResourceKey(key: string): key is ResourceKey {
    return ["food", "wood", "stone", "coal", "metal"].includes(key);
  }

  function getRequiredPlots(resourceName: string): string[] {
    if (isValidResourceKey(resourceName)) {
      return plotsThatNeed(resourceName);
    }
    return [];
  }
</script>

<div
  class="bg-foreground w-[160px] sidebar border-foregroundDark border-4
            			{$modifyPlotMenuOptions.visible
    ? 'bottom-72 opacity-70'
    : 'bottom-2'}
	z-10 fixed right-3 top-[190px] rounded-xl p-2 transition-all duration-300"
>
  <h1 class="text-xl w-full text-center pb-2">Resources</h1>
  <div
    class="flex flex-col justify-between gap-4 text-foregroundText h-full pb-12"
  >
    <div class="flex flex-col text-sm text-nowrap gap-2">
      {#each resources as { icon, name, value, rate }}
        <Tooltip.Root openDelay={300} closeDelay={0}>
          <Tooltip.Trigger>
            <span class="flex flex-row justify-between">
              {icon}
              {value}
              {#if rate > 0}
                <span class="text-textHappy">+{rate}</span>
              {:else if rate < 0}
                <span class="text-textDanger2">{rate}</span>
              {:else}
                <span class="text-textPrimary">+{rate}</span>
              {/if}
            </span>
            <TooltipContent>
              <div class="flex flex-col gap-2 w-28">
                <span class="text-md font-bold">{icon} {name}</span>
                {#if rate > 0}
                  <span class="text-textHappy">+{rate}</span>
                {:else if rate < 0}
                  <span class="text-textDanger2">{rate}</span>
                {:else}
                  <span class="">+{rate}</span>
                {/if}
                <Separator />
                {#if getRequiredPlots(name).length > 0}
                  <span class="text-sm font-semibold">Used to build:</span>
                {/if}
                {#each getRequiredPlots(name) as plot}
                  <span class="text-xs">{plot}</span>
                {/each}
              </div>
            </TooltipContent>
          </Tooltip.Trigger>
        </Tooltip.Root>
      {/each}
    </div>

    <div class="flex flex-col gap-6 rounded-xl text-center justify-center">
      <div
        class="flex flex-col justify-center w-full text-center items-center gap-2"
      >
        <div>
          <span class="text-xs">Productivity</span>
          <span class="text-xs">({roundTo($DB.townInfo.productivity, 0)}%)</span
          >
        </div>
        <Slider
          value={[$DB.townInfo.productivity]}
          onValueChange={setProductivity}
          min={0}
          max={200}
          step={5}
          class="cursor-pointer w-3/4"
        />
      </div>
      <div
        class="flex flex-col justify-center w-full text-center items-center gap-2
        min-h-24 px-2 py-1 rounded-xl {$DB.economyAndLaws.tax_rate === 0
          ? 'bg-textDanger1 animate-pulse font-bold'
          : ''}"
      >
        <div>
          <span class="text-xs">Tax Rate</span>
          <span class="text-xs"
            >({roundTo($DB.economyAndLaws.tax_rate * 100, 0)}%)</span
          >
        </div>
        <Slider
          value={[$DB.economyAndLaws.tax_rate]}
          onValueChange={setTaxRate}
          min={0}
          max={1.0}
          step={0.05}
          class="cursor-pointer w-3/4"
        />
      </div>
    </div>
  </div>
</div>

<style>
  /* Add any additional styling if needed */
</style>
