<script lang="ts">
  import { capitalizeFirstLetter, formatNumber, roundTo } from "./utils";
  import {
    DB,
    hasPlotOfType,
    modifyPlotMenuOptions,
    showTutorialStepConfetti,
    TEMP_GAME_DB_NAME,
  } from "./store";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import TooltipContent from "./components/ui/tooltip/tooltip-content.svelte";
  import Separator from "./components/ui/separator/separator.svelte";
  import { options } from "./objects/PlotTypeOptions";
  import { Vibe } from "./types";
  import { Progress } from "$lib/components/ui/progress/index.js";
  import { tutorialMessages } from "./objects/tutorial_messages";
  //@ts-ignore
  import Milestone from "./Milestone.svelte";
  import Confetti from "svelte-confetti";

  let atCapacity = false;
  let showCompleted = false;
  let completedCount = 0;
  let lastAlertTime = 0;
  let previousCapacityState = false;
  export let mini = false;

  $: {
    completedCount = tutorialMessages.filter((step) =>
      step.isComplete($DB),
    ).length;
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
      icon: "💰",
      name: "gold",
      value: $DB.townInfo.gold,
      rate: $DB.economyAndLaws.weeklyProfit,
    },
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
  ];

  if (hasPlotOfType("city_hall", $DB).length > 0) {
    resources.push({
      icon: "🧑‍⚖️",
      name: "bureaucracy",
      value: $DB.resources.bureaucracy,
      rate: $DB.resource_rate.bureaucracy,
    });
  }

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

  let attributes: any[];
  $: {
    attributes = [
      {
        name: "Happiness",
        description:
          "Happy townspeople spend more money and are less likely to leave.",
        value: $DB.townInfo.happiness,
        modifier: $DB.modifiers.happiness,
        color: getColor($DB.townInfo.happiness),
        hover: true,
        max: 300,
      },
      {
        name: "Health",
        description:
          "Healthy townspeople are less likely to die (and leave the town obviously).",
        value: $DB.townInfo.health,
        modifier: $DB.modifiers.health,
        color: getColor($DB.townInfo.health),
        hover: true,
        max: 300,
      },
      {
        name: "Community",
        description:
          "Townspeople that feel at home are less likely to leave, and less likely to get bored.",
        value: $DB.townInfo.community,
        modifier: $DB.modifiers.community,
        color: getColor($DB.townInfo.community),
        hover: true,
        max: 300,
      },
      {
        name: "Employment",
        description:
          "The number of people employed in your town. Unemployed people are more likely to leave.",
        value: $DB.townInfo.employees,
        modifier: null,
        color: getEmploymentColor(
          $DB.townInfo.employees / $DB.townInfo.population_count,
        ),
        hover: true,
        max: $DB.townInfo.population_count,
      },
      {
        name: `🛝 Recreation`,
        description:
          "Tracker for how many plots you have for recreation, which keeps townspeople happy. <br/><br/>Make sure as your town grows that you build enough 🛝 plots. ",
        value: $DB.townInfo.recreation,
        modifier: null,
        color:
          $DB.townInfo.recreation / getTotalPlotCount($DB) >= 0.2
            ? "bg-green-500"
            : "bg-orange-300",
        hover: true,
        max: getTotalPlotCount($DB),
      },
    ];
  }

  function getTotalPlotCount(z: any) {
    let count = 0;
    for (let i = 0; i < z.plots.length; i++) {
      for (let j = 0; j < z.plots[i].length; j++) {
        if (z.plots[i][j].active == true && z.plots[i][j].type > -1) {
          count++;
        }
      }
    }
    return count;
  }

  const getEmploymentColor = (value: number) => {
    if (value === 1) {
      return "bg-green-500";
    } else if (value > 0.9) {
      return "bg-yellow-500";
    } else {
      return "bg-red-500";
    }
  };

  const getColor = (value: number) => {
    if (value > 149) {
      return "bg-green-500";
    } else if (value > 99) {
      return "bg-yellow-500";
    } else {
      return "bg-red-500";
    }
  };

  function playAtCapacityAlertSound() {
    const audio = new Audio("/alert.mp3");
    audio.volume = 0.5;
    audio.play().catch((err) => console.log("Error playing sound:", err));
  }

  $: {
    const newCapacityState =
      $DB.resources.food >= $DB.resource_capacity ||
      $DB.resources.wood >= $DB.resource_capacity ||
      $DB.resources.stone >= $DB.resource_capacity ||
      $DB.resources.metal >= $DB.resource_capacity;

    const now = Date.now();
    if (
      newCapacityState &&
      !previousCapacityState &&
      now - lastAlertTime > 30000 &&
      !mini &&
      !$DB.gameSettings.includes("bagOfHolding") &&
      localStorage.getItem(TEMP_GAME_DB_NAME) == null
    ) {
      playAtCapacityAlertSound();
      lastAlertTime = now;
    }

    previousCapacityState = newCapacityState;
    atCapacity = newCapacityState;
  }
</script>

<div
  class="bg-sidebarBackground w-[220px] text-sidebarText border-foreground border-4 {$modifyPlotMenuOptions.visible &&
  !mini
    ? 'opacity-0'
    : ''}
	z-10 rounded-xl px-2 pt-2 transition-all ease-in-out duration-150 overflow-y-scroll scroll
fixed right-3 top-16 sidebar bottom-4"
>
  <div class="flex flex-row w-full pb-6">
    <div class="flex flex-col rounded-xl gap-2 w-full">
      <h1 class="text-lg w-full text-center pb-1">Stats</h1>
      {#each attributes as { name, value, modifier, color, hover, description, max }}
        <div class="flex flex-col gap-1">
          <Tooltip.Root openDelay={400} closeDelay={0}>
            <Tooltip.Trigger
              class="w-full flex flex-row align-middle justify-between text-sm filter hover:brightness-110"
            >
              <span class="text-md pr-2">{name} </span>
              <Progress
                {value}
                max={max ?? 300}
                class="min-w-[80px] max-w-[80px] "
                {color}
                text={`${roundTo(value, 0)} / ${roundTo(max, 0)}`}
              />
            </Tooltip.Trigger>
            {#if hover}
              <Tooltip.Content
                class="rounded-2xl text-white {color ?? getColor(value)}"
              >
                <div class="flex flex-col justify-between max-w-48">
                  <span class="text-md"
                    >{name}: {formatNumber(value, false)}
                    {max ? `out of ${max}` : ""}</span
                  >
                  <Separator class="mb-2 mt-1" />
                  <span>{@html description}</span>
                </div>
              </Tooltip.Content>
            {/if}
          </Tooltip.Root>
        </div>
      {/each}
    </div>
  </div>
  <div class="flex flex-row justify-center">
    <Tooltip.Root openDelay={400} closeDelay={0}>
      <Tooltip.Trigger>
        <h1 class="text-lg w-full text-center pb-2">
          Resources

          <div
            class="text-xs w-full text-center mb-2 cursor-pointer
          {atCapacity == true
              ? 'text-textDanger animate-[wiggle_0.5s_ease-in-out_infinite] font-bold'
              : ''} 
            {$DB.gameSettings.includes('bagOfHolding') ? 'opacity-30' : ''}
          "
          >
            {$DB.gameSettings.includes("bagOfHolding")
              ? "No resource cap"
              : `Capacity: ${formatNumber($DB.resource_capacity, false)}`}
          </div>
        </h1>

        <Tooltip.Content class="text-sm max-h-[200px] overflow-y-scroll">
          <div class="text-sm">
            ℹ️ Resources are generated from plots. Generation rate can be
            increased by raising the productivity of the town, at the cost of
            some happiness.
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

  <div class="flex flex-col gap-4 h-full">
    <div class="flex flex-col text-md text-nowrap gap-2">
      {#each resources as { icon, name, value, rate }}
        <Tooltip.Root openDelay={400} closeDelay={0}>
          <Tooltip.Trigger>
            <span
              class="flex flex-row justify-between text-sm
              {value <= 0 ? 'text-textDanger font-semibold' : ''}
            "
            >
              {icon}
              {formatNumber(parseInt(value), false)}
              {#if value >= $DB.resource_capacity && name != "gold"}
                <span class="text-textDanger">⚠️ CAP</span>
              {:else if rate > 0}
                <span class="text-textHappy">+{rate}</span>
              {:else if rate < 0}
                <span class="text-textDanger">{rate}</span>
              {:else if rate == null}
                <span></span>
              {:else}
                <span class="">+{rate}</span>
              {/if}
            </span>
            <TooltipContent>
              <div
                class="flex flex-col gap-2 whitespace-nowrap min-w-fit rounded-lg text-black"
              >
                <div>
                  <span class="text-md font-bold"
                    >{icon} {capitalizeFirstLetter(name)}</span
                  >
                  {#if rate > 0}
                    <span class="text-textHappy">+{rate} (weekly)</span>
                  {:else if rate < 0}
                    <span class="text-textDanger">{rate} (weekly)</span>
                  {:else if rate != null}
                    <span class="text-gray-600">+{rate} (weekly)</span>
                  {:else}
                    <span class="display-none" />
                  {/if}
                </div>

                {#if getRequiredPlots(name).length > 0}
                  <Separator class="bg-gray-400" />
                  <span class="text-sm font-semibold">Required for</span>
                  <div class="grid grid-cols-3 justify-between">
                    {#each getRequiredPlots(name) as plot}
                      <span class="text-xs pr-3">{plot}</span>
                    {/each}
                  </div>
                {/if}
              </div>
            </TooltipContent>
          </Tooltip.Trigger>
        </Tooltip.Root>
      {/each}
    </div>

    <div>
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div
        class="text-lg w-full text-center noselect flex flex-col no-select"
        on:click={() => {
          showCompleted = !showCompleted;
        }}
      >
        {#if $showTutorialStepConfetti}
          <Confetti cone x={[-0.5, 0.5]} />
          <Confetti
            cone
            amount={50}
            x={[-1, -0.4]}
            y={[0.25, 0.75]}
            rounded
            size={8}
          />
          <Confetti cone amount={10} x={[0.4, 1]} y={[0.25, 0.75]} />
          <Confetti infinite amount={75} delay={[0, 200]} />
        {/if}
        <h1 class="text-lg w-full text-center">Milestones</h1>
        {#if $DB.currentTutorialStep > 0}
          <span class="text-xs opacity-65 cursor-pointer pb-2"
            >{!showCompleted
              ? `Show ${completedCount} completed`
              : `Hide ${completedCount} completed`}</span
          >
        {/if}
      </div>
      <div class="scroll overflow-y-scroll">
        {#each tutorialMessages as step, index}
          {#if showCompleted || index == $DB.currentTutorialStep}
            <Milestone {index} {step} />
          {:else if !step.isComplete($DB)}
            <Milestone {index} {step} />
          {/if}
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
</style>
