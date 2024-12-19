<script lang="ts">
  import { capitalizeFirstLetter, formatNumber, roundTo } from "./utils";
  import { DB, modifyPlotMenuOptions, showTutorialStepConfetti } from "./store";
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
  export let mini = false;

  $: {
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
</script>

<div
  class="bg-sidebarBackground text-sidebarText border-foreground border-4 {$modifyPlotMenuOptions.visible &&
  !mini
    ? 'opacity-0'
    : ''}
	z-10 rounded-xl px-2 pt-2 transition-all duration-300 overflow-y-scroll scroll
  {mini ? 'min-w-56' : 'fixed right-3 top-[190px] sidebar w-[220px] bottom-4'}"
>
  <div class="flex flex-row w-full pb-6">
    <div class="flex flex-col rounded-xl gap-2 w-full">
      <h1 class="text-lg w-full text-center pb-1">Stats</h1>
      {#each attributes as { name, value, modifier, color, hover, description, max }}
        <div class="flex flex-col gap-1">
          <Tooltip.Root openDelay={200} closeDelay={0}>
            <Tooltip.Trigger
              class="w-full flex flex-row align-middle justify-between text-sm filter hover:brightness-110"
            >
              <span class="text-md pr-2">{name} </span>
              <Progress
                {value}
                max={max ?? 300}
                class="min-w-[80px] max-w-[80px] "
                {color}
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
    <Tooltip.Root openDelay={200} closeDelay={0}>
      <Tooltip.Trigger>
        <h1 class="text-lg w-full text-center pb-2">
          Resources

          <div
            class="text-xs w-full text-center mb-2 cursor-pointer
          {atCapacity == true ? 'text-textDanger animate-pulse font-bold' : ''} 
            {$DB.gameSettings.includes('bagOfHolding') ? 'opacity-30' : ''}
          "
          >
            {$DB.gameSettings.includes("bagOfHolding")
              ? "No resource cap"
              : `Capacity: ${formatNumber($DB.resource_capacity, false)}`}
          </div>
        </h1>

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

  <div class="flex flex-col gap-8 h-full">
    <div class="flex flex-col text-md text-nowrap gap-2">
      {#each resources as { icon, name, value, rate }}
        <Tooltip.Root openDelay={200} closeDelay={0}>
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
                class="flex flex-col gap-2 whitespace-nowrap min-w-fit bg-gray-600/90 p-3 rounded-lg text-white"
              >
                <span class="text-md font-bold"
                  >{icon} {capitalizeFirstLetter(name)}</span
                >
                {#if rate > 0}
                  <span class="text-green-200">+{rate} (weekly)</span>
                {:else if rate < 0}
                  <span class="text-red-200">{rate} (weekly)</span>
                {:else if rate != null}
                  <span class="text-blue-200">+{rate} (weekly)</span>
                {:else}
                  <span class="display-none" />
                {/if}

                {#if getRequiredPlots(name).length > 0}
                  <Separator class="bg-gray-400" />
                  <span class="text-sm font-semibold text-gray-100"
                    >Required for</span
                  >
                {/if}
                <div class="flex flex-col flex-wrap min-w-full">
                  {#each getRequiredPlots(name) as plot}
                    <span class="text-xs mr-4 text-gray-100">{plot}</span>
                  {/each}
                </div>
              </div>
            </TooltipContent>
          </Tooltip.Trigger>
        </Tooltip.Root>
      {/each}
    </div>

    {#if !mini}
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
              amount={10}
              x={[-1, -0.4]}
              y={[0.25, 0.75]}
              rounded
              size={15}
            />
            <Confetti cone amount={10} x={[0.4, 1]} y={[0.25, 0.75]} />
            <Confetti infinite amount={75} delay={[0, 200]} />
          {/if}
          <h1 class="text-lg w-full text-center">Milestones</h1>
          {#if $DB.currentTutorialStep > 0}
            <span class="text-xs opacity-65 cursor-pointer pb-2"
              >{!showCompleted
                ? `Show ${$DB.currentTutorialStep} completed`
                : `Hide ${$DB.currentTutorialStep} completed`}</span
            >
          {/if}
        </div>
        <div class="scroll overflow-y-scroll">
          {#each tutorialMessages as step, index}
            {#if $DB.currentTutorialStep > index}
              {#if showCompleted}
                <Milestone {index} {step} />
              {/if}
            {:else}
              <Milestone {index} {step} />
            {/if}
          {/each}
        </div>
      </div>
    {:else}
      <br />
    {/if}
  </div>
</div>

<style>
</style>
