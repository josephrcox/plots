<script lang="ts">
  import { onMount } from "svelte";
  import {
    DB,
    ACTIVE_GAME_DB_NAME,
    speed,
    modifyPlotMenuOptions,
    showTutorialStepConfetti,
  } from "./store";
  import { formatDuration, formatNumber, roundTo } from "./utils";
  import { Progress } from "$lib/components/ui/progress/index.js";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import Separator from "./components/ui/separator/separator.svelte";

  onMount(() => {
    $DB.gameSettings.includes("casual") ? ($speed = 375) : ($speed = 750);
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
    if ($DB.gameSettings.includes("casual")) {
      newSpeed /= 2;
    }
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
        max: null,
      },
      {
        name: "Health",
        description:
          "Healthy townspeople are less likely to die (and leave the town obviously).",
        value: $DB.townInfo.health,
        modifier: $DB.modifiers.health,
        color: getColor($DB.townInfo.health),
        hover: true,
        max: null,
      },
      {
        name: "Community",
        description:
          "Townspeople that feel at home are less likely to leave, and less likely to get bored.",
        value: $DB.townInfo.community,
        modifier: $DB.modifiers.community,
        color: getColor($DB.townInfo.community),
        hover: true,
        max: null,
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
        max: null,
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
          <span class="text-xs">
            <span class="text-sm"
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
      {#each attributes as { name, value, modifier, color, hover, description, max }}
        <div class="flex flex-col gap-2">
          <Tooltip.Root openDelay={400} closeDelay={0}>
            <Tooltip.Trigger
              class="w-full mt-0 flex flex-col align-middle items-center"
            >
              <span class="text-xs pb-2"
                >{name}
                {#if modifier != null}(x{roundTo(modifier, 2)})
                {/if}</span
              >
              <Progress
                {value}
                max={max ?? 300}
                class="min-w-[80px] max-w-[80px]"
                {color}
              />
            </Tooltip.Trigger>
            {#if hover}
              <Tooltip.Content
                class="rounded-2xl {color ??
                  getColor(value)
                    // slightly lighter
                    .replace('500', '300')}"
              >
                <div
                  class="flex flex-col justify-between text-black p-0 m-0 max-w-48"
                >
                  <span class="text-md"
                    >{name}: {formatNumber(value, false)} out of 300</span
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
            class="{$speed.toString() === '2000' || $speed.toString() === '1000'
              ? 'text-textPrimary font-semibold text-lg transition-all duration-100'
              : 'text-md'} text-accent cursor-pointer"
            on:click={() => toggleSpeed(2000)}>Slow</span
          >
          <span
            class="{$speed.toString() === '750' || $speed.toString() === '375'
              ? 'text-textPrimary font-semibold text-lg transition-all duration-100'
              : 'text-md'} text-accent cursor-pointer"
            on:click={() => toggleSpeed(750)}>Normal</span
          >
          <span
            class="{$speed.toString() === '200' || $speed.toString() === '100'
              ? 'text-textPrimary font-semibold text-lg transition-all duration-100'
              : 'text-md'} text-accent cursor-pointer"
            on:click={() => toggleSpeed(200)}>Fast</span
          >
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /*  */
</style>
