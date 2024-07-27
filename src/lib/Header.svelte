<script lang="ts">
  import { onMount } from "svelte";
  import {
    DB,
    ACTIVE_GAME_DB_NAME,
    speed,
    modifyPlotMenuOptions,
    showTutorialStepConfetti,
  } from "./store";
  import { Confetti } from "svelte-confetti";
  import { formatDuration, formatNumber, roundTo } from "./utils";
  import { Progress } from "$lib/components/ui/progress/index.js";
  import { tutorialMessages } from "./objects/tutorial_messages";
  import * as Tooltip from "$lib/components/ui/tooltip";

  onMount(() => {
    const interval = setInterval(() => {
      $DB.timeSpent += 1000;
    }, 1000);

    return () => {
      clearInterval(interval); // Clear the interval when the component is destroyed
    };
  });

  function changeName() {
    let newName = prompt("Enter a new name for your town (under 200 chars)");
    if (newName && newName.length < 200 && newName.length >= 1) {
      let z = $DB;
      z.townInfo.name = newName;
      DB.set(z);
      localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
    }
  }

  function toggleSpeed(newSpeed: number) {
    $speed = newSpeed;
    // find all with .speedButton and remove the active class
    let buttons = document.querySelectorAll(".speedButton");
    buttons.forEach((button) => {
      button.classList.remove("active");
    });
    return $speed;
  }

  // Assuming $DB.timeSpent is reactive and stores time in milliseconds
  let formattedTime = "00:00:00";

  // Watch for changes in $DB.timeSpent and update formattedTime
  $: if ($DB.timeSpent > 0) {
    formattedTime = formatDuration($DB.timeSpent);
  } else {
    formattedTime = "00:00:00";
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
      },
      {
        name: "Health",
        description:
          "Healthy townspeople are less likely to die (and leave the town obviously).",
        value: $DB.townInfo.health,
        modifier: $DB.modifiers.health,
        color: getColor($DB.townInfo.health),
        hover: true,
      },
      {
        name: "Community",
        description:
          "Townspeople that feel at home are less likely to leave, and less likely to get bored.",
        value: $DB.townInfo.community,
        modifier: $DB.modifiers.community,
        color: getColor($DB.townInfo.community),
        hover: true,
      },
      {
        name: "Employment",
        description:
          "The number of people employed in your town. Unemployed people are more likely to leave.",
        value: ($DB.townInfo.employees / $DB.townInfo.population_count) * 300,
        modifier: null,
        color: getEmploymentColor(
          $DB.townInfo.employees / $DB.townInfo.population_count,
        ),
        hover: false,
      },
    ];
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
  class="flex justify-between px-6 gap-6 flex-row text-start fixed top-0 left-0 right-0 cursor-default z-10 bg-foreground text-foregroundText max-h-[135px] h-[135px]
		{$modifyPlotMenuOptions.visible ? 'opacity-70' : ''}
	"
>
  <div class="flex justify-between flex-col py-2 max-w-[25%] w-[25%]">
    <div class="rounded-xl">
      <div
        class="flex flex-col gap-1
        "
      >
        <div class="flex flex-row items-start text-md">
          <div
            on:click={changeName}
            class="cursor-pointer flex flex-row justify-start"
          >
            <h1
              class="font-bold cursor-pointer w-full text-start select-none text-lg"
            >
              {$DB.townInfo.name}
            </h1>
          </div>
        </div>

        <div
          class="flex flex-row gap-4 flex-wrap
						items-center"
        >
          <span class="text-sm"
            >👥 {$DB.townInfo.population_count} / {$DB.townInfo
              .population_max}</span
          >
        </div>
        <div>
          <span class="text-xs"
            ><span class="text-sm"
              >💰 {formatNumber($DB.townInfo.gold, false)}</span
            >
          </span>
        </div>
        <div class="text-xs">
          {#if $DB.economyAndLaws.weeklyProfit > 0}
            <span class="text-textHappy"
              >+${$DB.economyAndLaws.weeklyProfit}</span
            >
          {:else if $DB.economyAndLaws.weeklyProfit < 0}
            <span class="text-textDanger2"
              >{$DB.economyAndLaws.weeklyProfit}</span
            >
          {:else}
            <span class="text-textPrimary"
              >+${$DB.economyAndLaws.weeklyProfit}</span
            >
          {/if}
          <span class="text-gray-400">(weekly)</span>
        </div>

        <div
          class="text-xs pt-0 opacity-70 {$DB.townInfo.employees ==
          $DB.townInfo.population_count
            ? 'text-textPrimary'
            : $DB.townInfo.employees > $DB.townInfo.population_count * 0.95
              ? 'text-textDanger3'
              : $DB.townInfo.employees > $DB.townInfo.population_count * 0.9
                ? 'text-textDanger2'
                : 'text-textDanger1'}
					"
        >
          <span class="text-xs">
            {#if $DB.townInfo.employees == $DB.townInfo.population_count}
              {#if $DB.townInfo.population_count === 0}
                Nobody lives here , build some homes
              {/if}
            {:else}
              {roundTo(
                ($DB.townInfo.employees / $DB.townInfo.population_count) * 100,
                0,
              )}% employment ({$DB.townInfo.employees}/{$DB.townInfo
                .population_count} - {$DB.townInfo.population_count -
                $DB.townInfo.employees} unemployed)
            {/if}
          </span>
        </div>
      </div>
    </div>
  </div>
  <div class="flex flex-row gap-2 my-2">
    <div
      class="flex flex-col text-foregroundText py-1 rounded-xl gap-4 flex-wrap max-h-[110px]"
    >
      {#each attributes as { name, value, modifier, color, hover }}
        <div class="flex flex-col gap-2">
          <Tooltip.Root openDelay={400} closeDelay={0}>
            <Tooltip.Trigger class="w-full mt-0 flex flex-col">
              <span class="text-xs pb-2"
                >{name}
                {#if modifier != null}(x{roundTo(modifier, 2)})
                {/if}</span
              >
              <Progress {value} max={300} class="w-full" {color} />
            </Tooltip.Trigger>
            {#if hover}
              <Tooltip.Content
                class={getColor(value)
                  // slightly lighter
                  .replace("500", "300")}
              >
                <div class="flex flex-col justify-between text-black p-0 m-0">
                  <span class="text-sm font-bold">{name}</span>
                  <span class="text-xs">Base: {value} / 300</span>
                  {#if modifier != null}
                    <span class="text-xs">Modifier: {roundTo(modifier, 0)}</span
                    >
                  {/if}
                </div>
              </Tooltip.Content>
            {/if}
          </Tooltip.Root>
        </div>
      {/each}
    </div>
  </div>

  <div class="flex justify-end align-end w-[25%]">
    <!-- right -->
    <div class="flex flex-col">
      <!-- circle div that says the day number, with the day and year below (outside of circle) -->
      <div class="flex flex-col items-center h-max">
        <div>
          <span class="text-xs text-secondary cursor-pointer"
            >Game time · {formattedTime}</span
          >
        </div>
        <div
          class="rounded-xl bg-accent flex-row justify-between text-accentText w-36 h-14 flex px-6 items-center mb-2"
        >
          <span class="flex flex-col gap-2 text-center">
            <span class="text-xs">Day</span>
            <span class="font-semibold text-xs">
              {($DB.environment.day % 365) + 1}
            </span>
          </span>
          <span class="flex flex-col gap-2 text-center">
            <span class="text-xs">Year</span>
            <span class="font-semibold text-xs">
              {Math.floor($DB.environment.day / 365) + 1}
            </span>
          </span>
        </div>
        <div
          class="flex flex-row gap-2 align-middle
					justify-center
					items-center"
        >
          <span
            class="{$speed.toString() === '2000'
              ? 'text-textPrimary font-semibold text-lg transition-all duration-100'
              : 'text-md'} text-accent cursor-pointer"
            on:click={() => toggleSpeed(2000)}>Slow</span
          >
          <span
            class="{$speed.toString() === '750'
              ? 'text-textPrimary font-semibold text-lg transition-all duration-100'
              : 'text-md'} text-accent cursor-pointer"
            on:click={() => toggleSpeed(750)}>Normal</span
          >
          <span
            class="{$speed.toString() === '200'
              ? 'text-textPrimary font-semibold text-lg transition-all duration-100'
              : 'text-md'} text-accent cursor-pointer"
            on:click={() => toggleSpeed(200)}>Fast</span
          >
        </div>
      </div>
    </div>
  </div>
</div>

<div
  class=" {$showTutorialStepConfetti ? 'opacity-25 ' : ''}
      transition-all duration-1000
      {$DB.environment.day === 0 ? 'wiggle' : ''}
      "
>
  <div
    class="flex flex-col justify-center w-full align-middle items-center fixed max-w-[50vw] z-10

          {$DB.environment.day === 0 ? 'top-[160px]' : 'top-[130px]'}
    left-0 right-0 mx-auto
  "
  >
    {#if $showTutorialStepConfetti}
      <Confetti y={[-0.5, 0.5]} x={[-0.5, 0.5]} duration={2000} />
    {/if}

    <div
      class="gap flex-row items-center flex bg-white text-slate-800 py-1 px-2 rounded-xl w-full
        
      "
    >
      <div class="text-lg h-max">👨‍🦰</div>
      <div class="text-xs ml-2 overflow-auto opacity-80">
        {#if $DB.currentTutorialStep >= tutorialMessages.length}
          No more goals!
        {:else}
          Milestone {$DB.currentTutorialStep + 1} : {tutorialMessages[
            $DB.currentTutorialStep
          ].message}
          <span class="opacity-40"
            >(💰{tutorialMessages[$DB.currentTutorialStep].goldReward})</span
          >
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .wiggle {
    animation: wiggle 3s infinite;
  }

  @keyframes wiggle {
    0% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(5deg);
    }
    50% {
      transform: rotate(0deg);
    }
    75% {
      transform: rotate(-5deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }
</style>
