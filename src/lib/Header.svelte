<script lang="ts">
  import { onMount } from "svelte";
  import {
    DB,
    ACTIVE_GAME_DB_NAME,
    speed,
    showLabMenu,
    showKnowledgeMenu,
    modifyPlotMenuOptions,
    showTutorialStepConfetti,
  } from "./store";
  import { Confetti } from "svelte-confetti";
  import { fade } from "svelte/transition";
  import { formatDuration, formatNumber, roundTo } from "./utils";
  import { Separator } from "$lib/components/ui/separator";
  import Button from "./components/ui/button/button.svelte";
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

  function showTheLabMenu() {
    if ($DB.hasLab) showLabMenu.set(true);
  }

  // Assuming $DB.timeSpent is reactive and stores time in milliseconds
  let formattedTime = "00:00:00";

  // Watch for changes in $DB.timeSpent and update formattedTime
  $: if ($DB.timeSpent > 0) {
    formattedTime = formatDuration($DB.timeSpent);
  } else {
    formattedTime = "00:00:00";
  }
</script>

<div
  class="flex justify-between px-6 gap-6 flex-row text-start fixed top-0 left-0 right-0 cursor-default z-20 bg-foreground text-foregroundText h-max
		{$modifyPlotMenuOptions.visible ? 'opacity-70' : ''}
	"
>
  <div class="flex flex-row gap-6 my-2 h-max">
    <div
      class="flex flex-col w-36 h-full justify-center text-foregroundText bg-accent p-2 rounded-xl"
    >
      <span>
        <h2 class="text-lg text-white">Stats</h2>
        <Separator class="bg-white" />
        <span class="text-xs"
          >Happiness (x{roundTo($DB.modifiers.happiness, 2)})</span
        >
        <Progress
          value={$DB.townInfo.happiness}
          max={300}
          class="w-full h-2"
          color={parseInt($DB.townInfo.happiness) > 200
            ? "bg-green-500"
            : parseInt($DB.townInfo.happiness) > 100
              ? "bg-yellow-500"
              : "bg-red-500"}
        />
      </span>
      <span>
        <span class="text-xs">Health (x{roundTo($DB.modifiers.health, 2)})</span
        >
        <Progress
          value={$DB.townInfo.health}
          max={300}
          class="w-full h-2"
          color={parseInt($DB.townInfo.health) > 200
            ? "bg-green-500"
            : parseInt($DB.townInfo.health) > 100
              ? "bg-yellow-500"
              : "bg-red-500"}
        />
      </span>
      <span>
        <span class="text-xs"
          >Community (x{roundTo($DB.modifiers.community, 2)})</span
        >
        <Progress
          value={$DB.townInfo.community}
          max={300}
          class="w-full h-2"
          color={parseInt($DB.townInfo.community) > 200
            ? "bg-green-500"
            : parseInt($DB.townInfo.community) > 100
              ? "bg-yellow-500"
              : "bg-red-500"}
        />
      </span>
    </div>
    <div class="flex justify-between flex-col">
      <div class=" rounded-xl">
        <div class="flex flex-col justify-between">
          <div
            on:click={changeName}
            class="cursor-pointer transition-all duration=150 min-h-8"
          >
            <h1
              class="font-bold cursor-pointer w-full pb-2 text-start select-none"
            >
              {$DB.townInfo.name}
            </h1>
          </div>
          <div
            class="flex flex-row gap-4 flex-wrap
						items-center"
          >
            <span class="text-sm"
              >👥 {$DB.townInfo.population_count} / {$DB.townInfo
                .population_max}</span
            >
            <span class="text-xs"
              ><span class="text-sm"
                >💰 {formatNumber($DB.townInfo.gold, false)}</span
              >
              <span class="pl-2"></span>
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
            </span>
          </div>

          <div
            class="text-xs pt-1 {$DB.townInfo.employees ==
            $DB.townInfo.population_count
              ? 'text-textPrimary'
              : $DB.townInfo.employees > $DB.townInfo.population_count * 0.95
                ? 'text-textDanger3'
                : $DB.townInfo.employees > $DB.townInfo.population_count * 0.9
                  ? 'text-textDanger2'
                  : 'text-textDanger1'}
					"
          >
            {#if $DB.townInfo.employees == $DB.townInfo.population_count}
              {#if $DB.townInfo.population_count === 0}
                Nobody lives here , build some homes
              {:else}
                All citizens employed
              {/if}
            {:else}
              {roundTo(
                ($DB.townInfo.employees / $DB.townInfo.population_count) * 100,
                0,
              )}% employment ({$DB.townInfo.employees}/{$DB.townInfo
                .population_count} - {$DB.townInfo.population_count -
                $DB.townInfo.employees} unemployed)
            {/if}
          </div>
          <span class="text-xs text-secondary cursor-pointer"
            >Game time: {formattedTime}</span
          >
        </div>
      </div>
      <div
        class="flex flex-row gap-2 align-middle
        justify-center items-center
      "
      >
        <Button
          class="text-xs flex flex-col h-min  bg-button cursor-pointer text-textPrimary p-1.5"
          on:click={function () {
            $showKnowledgeMenu = !$showKnowledgeMenu;
          }}
          ><div>Manage Knowledge</div>
        </Button>
        <Button
          class="text-xs flex flex-col h-min p-1.5 {$DB.hasLab
            ? 'bg-button cursor-pointer text-textPrimary'
            : 'bg-button cursor-not-allowed text-textPrimary opacity-35'}"
          on:click={showTheLabMenu}
          ><div>
            Manage Lab
            {#if $DB.lab.active_experiment !== null}
              {#if $DB.lab.active_experiment.duration > 0}
                <span>{$DB.lab.active_experiment.duration}d</span>
              {:else if $DB.lab.active_experiment.duration === 0}
                <span
                  class="
										animate-pulse
									">✅ DONE!</span
                >
              {/if}
            {/if}
          </div>
        </Button>
      </div>
    </div>
  </div>
  <div
    class="flex flex-row flex-wrap align-middle justify-center items-center w-64 {$showTutorialStepConfetti
      ? 'opacity-25 '
      : ''}
      transition-all duration-700"
  >
    <div class="flex flex-col justify-center w-full align-middle items-center">
      {#if $DB.currentTutorialStep != 0}
        <div
          class="flex flex-col justify-center items-center
  
        "
        >
          <div
            class=" flex flex-row justify-center text-xs bg-white rounded-t-2xl text-black py-2 whitespace-nowrap px-2 opacity-50"
          >
            <Tooltip.Root openDelay={200} closeDelay={0}>
              <Tooltip.Trigger>
                <span
                  class="w-full no-select opacity-70 whitespace-nowrap text-center"
                >
                  Last reward
                  <div>
                    💰{tutorialMessages[$DB.currentTutorialStep - 1].goldReward}
                  </div>
                </span>
              </Tooltip.Trigger>
              <Tooltip.Content class="bg-black text-white rounded-2xl">
                Last completed task: {tutorialMessages[
                  $DB.currentTutorialStep - 1
                ].message}
              </Tooltip.Content>
            </Tooltip.Root>
          </div>
        </div>
      {/if}
      {#if $showTutorialStepConfetti}
        <Confetti y={[-0.5, 0.5]} x={[-0.5, 0.5]} duration={2000} />
      {/if}

      <div
        class="gap flex-row items-center flex bg-white text-slate-800 py-1 px-2 rounded-xl w-full"
      >
        <div class="text-lg h-max">👨‍🦰</div>
        <div class="text-xs ml-2 overflow-auto opacity-80">
          {#if $DB.currentTutorialStep >= tutorialMessages.length}
            No more goals!
          {:else}
            {tutorialMessages[$DB.currentTutorialStep].message}
            <span class="opacity-40"
              >(💰{tutorialMessages[$DB.currentTutorialStep].goldReward})</span
            >
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div class="flex justify-center align-middle flex-col">
    <!-- right -->
    <div class="flex flex-col">
      <!-- circle div that says the day number, with the day and year below (outside of circle) -->
      <div class="flex flex-col items-center h-max">
        <div>
          <span class="text-xs text-secondary cursor-pointer"
            >Press P to Pause</span
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

<style>
  input[type="range"] {
    background: black;
    color: black;
    cursor: pointer;
    width: 100px;
  }

  input[type="range"]:focus {
    outline: none;
  }

  input[type="range"]::-webkit-slider-runnable-track {
    border-radius: 0.5rem;
    height: 0.5rem;
  }

  input[type="range"]::-webkit-slider-thumb {
    background-color: black;
    color: black;
    margin-top: -4px;
    height: 1rem;
    width: 1rem;
  }

  input[type="range"]:focus::-webkit-slider-thumb {
    border: none;
  }

  input[type="range"]::-moz-range-track {
    border-radius: 0.5rem;
    height: 0.5rem;
  }

  input[type="range"]::-moz-range-thumb {
    border: none;
    border-radius: 0;
    height: 1rem;
    width: 1rem;
  }

  input[type="range"]:focus::-moz-range-thumb {
    border: none;
    outline: 3px solid #000000;
    outline-offset: 0.125rem;
  }
</style>
