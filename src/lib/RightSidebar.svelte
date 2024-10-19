<script lang="ts">
  import Header from "./Header.svelte";
  import PlotController from "./PlotController.svelte";
  import { capitalizeFirstLetter, formatNumber, roundTo } from "./utils";
  import {
    DB,
    ACTIVE_GAME_DB_NAME,
    modifyPlotMenuOptions,
    hasPlotOfType,
  } from "./store";
  import LeftSidebar from "./LeftSidebar.svelte";
  import Slider from "./components/ui/slider/slider.svelte";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import TooltipContent from "./components/ui/tooltip/tooltip-content.svelte";
  import Separator from "./components/ui/separator/separator.svelte";
  import { options } from "./objects/PlotTypeOptions";
  import { Vibe } from "./types";

  let mute: string = localStorage.getItem("mute") || "false";
  let atCapacity = false;

  $: {
    mute = localStorage.getItem("mute") || "false";
    atCapacity =
      $DB.resources.food >= $DB.resource_capacity ||
      $DB.resources.wood >= $DB.resource_capacity ||
      $DB.resources.stone >= $DB.resource_capacity ||
      $DB.resources.metal >= $DB.resource_capacity;
  }

  type ResourceKey =
    | "food"
    | "wood"
    | "stone"
    | "metal"
    | "power"
    | "knowledge"
    | "bureaucracy";

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
      icon: "🪨",
      name: "stone",
      value: $DB.resources.stone,
      rate: $DB.resource_rate.stone,
    },
    {
      icon: "🧠",
      name: "knowledge",
      value: $DB.townInfo.knowledge_points,
      rate: $DB.resource_rate.knowledge,
    },
    {
      icon: "🧲",
      name: "metal",
      value: $DB.resources.metal,
      rate: $DB.resource_rate.metal,
    },
    {
      icon: "🔋",
      name: "power",
      value: $DB.resources.power,
      rate: null,
    },
    {
      icon: "🧑‍⚖️",
      name: "bureaucracy",
      value: $DB.resources.bureaucracy,
      rate: $DB.resource_rate.bureaucracy,
    },
  ];

  function plotsThatNeed(resourceIndex: ResourceKey): string[] {
    let plotsThatNeed: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (
        resourceIndex != "knowledge" &&
        options[i].requirements.resources[resourceIndex] > 0
      ) {
        plotsThatNeed.push(options[i].title);
      } else {
        if (resourceIndex == "power" && options[i].active_costs.power > 0) {
          plotsThatNeed.push(options[i].title);
        } else if (
          resourceIndex == "knowledge" &&
          options[i].requirements.knowledge > 0
        ) {
          plotsThatNeed.push(options[i].title);
        }
      }
    }
    return plotsThatNeed;
  }

  function isValidResourceKey(key: string): key is ResourceKey {
    return ["food", "wood", "stone", "metal", "power", "knowledge"].includes(
      key,
    );
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
    ? 'bottom-8 opacity-70'
    : 'bottom-2'}
	z-10 fixed right-3 top-[190px] rounded-xl px-2 pt-2 transition-all duration-300"
>
  <div class="flex flex-row justify-center">
    <Tooltip.Root openDelay={400} closeDelay={0}>
      <Tooltip.Trigger>
        <div class="flex flex-row items-center pb-2 gap-2">
          <h1 class="text-lg w-full text-center">Resources ℹ️</h1>
        </div>
        <div
          class="text-xs w-full text-center mb-2 cursor-pointer italic
          {atCapacity == true
            ? 'text-textDanger1 animate-pulse font-bold'
            : 'text-textPrimary'} 
            {$DB.gameSettings.includes('bagOfHolding') ? 'opacity-30' : ''}
          "
        >
          {$DB.gameSettings.includes("bagOfHolding")
            ? "No resource cap"
            : `Capacity: ${formatNumber($DB.resource_capacity, false)}`}
        </div>
        <Tooltip.Content class="text-sm w-[200px]">
          <div class="text-sm">
            Resources are generated from plots. Generation rate can be increased
            by raising the productivity of the town, at the cost of some
            happiness.
            <br />
            <br />
            There is also a slight bit of randomness as townspeople aren't robots.
            <br />
            <br />
            <span class="font-bold">Stockpile plots</span> increase the maximum
            amount of resources you can store.
            <br />
            <br />
            If the cap is 500, then you can store 500 of each resource before the
            cap is reached.
            <br />
            Capacity is increased by 2,000 per Stockpile plot.
            <br />
            <span class="text-red-800 font-bold">
              {$DB.gameSettings.includes("bagOfHolding")
                ? "There is no resource cap in this game mode! (Bag of Holding)"
                : ""}
            </span>
          </div>
        </Tooltip.Content>
      </Tooltip.Trigger>
    </Tooltip.Root>
  </div>
  <div class="w-[full] flex flex-row justify-center"></div>

  <Separator class="mb-4 bg-background" />

  <div
    class="flex flex-col justify-between gap-4 text-foregroundText h-full pb-12"
  >
    <div class="flex flex-col text-sm text-nowrap gap-2">
      {#each resources as { icon, name, value, rate }}
        <Tooltip.Root openDelay={400} closeDelay={0}>
          <Tooltip.Trigger>
            <span
              class="flex flex-row justify-between
              {value <= 0
                ? 'text-textDanger1 font-semibold'
                : 'text-textPrimary'}
            "
            >
              {icon}
              {formatNumber(parseInt(value), false)}
              {#if value >= $DB.resource_capacity}
                <span class="text-textDanger1">⚠️ CAP</span>
              {:else if rate > 0}
                <span class="text-textHappy">+{rate}</span>
              {:else if rate < 0}
                <span class="text-textDanger2">{rate}</span>
              {:else if rate == null}
                <span></span>
              {:else}
                <span class="text-textPrimary">+{rate}</span>
              {/if}
            </span>
            <TooltipContent>
              <div class="flex flex-col gap-2 whitespace-nowrap min-w-fit">
                <span class="text-md font-bold"
                  >{icon} {capitalizeFirstLetter(name)}</span
                >
                {#if rate > 0}
                  <span class="text-textHappy">+{rate} (weekly)</span>
                {:else if rate < 0}
                  <span class="text-textDanger2">{rate} (weekly)</span>
                {:else if rate != null}
                  <span class="">+{rate} (weekly)</span>
                {:else}
                  <span class="display-none" />
                {/if}

                {#if getRequiredPlots(name).length > 0}
                  <Separator class="bg-white" />
                  <span class="text-sm font-semibold">Required for</span>
                {/if}
                <div class="flex flex-col flex-wrap min-w-full">
                  {#each getRequiredPlots(name) as plot}
                    <span class="text-xs mr-4">{plot}</span>
                  {/each}
                </div>
              </div>
            </TooltipContent>
          </Tooltip.Trigger>
        </Tooltip.Root>
      {/each}
    </div>
    <Separator class="bg-background" />
    <div class="flex flex-row gap-2 items-start justify-center">
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <h3
        class="
                text-md
                cursor-pointer
            "
        on:click={() => {
          $DB.townLog = [];
        }}
      >
        Alerts {$DB.townLog.length > 0 ? `(clear)` : ""}
      </h3>
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
    <div class="overflow-y-scroll h-[100%] w-[100%] px-0 pb-16 scroll-smooth">
      {#if $DB.townLog.length == 0}
        <p class="text-center text-xs opacity-50">No alerts</p>
      {/if}
      {#each $DB.townLog as log}
        <div
          class=" px-2 py-2 rounded-2xl fade-in mb-4
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
          <p class="text-xs">{log.message}</p>
        </div>
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
  .overflow-y-scroll {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
</style>
