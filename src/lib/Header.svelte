<script lang="ts">
  import { onMount } from "svelte";
  import {
    DB,
    ACTIVE_GAME_DB_NAME,
    speed,
    modifyPlotMenuOptions,
    showTutorialStepConfetti,
    paused,
  } from "./store";
  import { formatDuration, formatNumber, roundTo } from "./utils";
  import SimpleButton from "./components/SimpleButton.svelte";

  const speeds = $DB.gameSettings.includes("casual")
    ? [375, 200, 100]
    : [550, 375, 100];
  let speedIndex = 0;

  onMount(() => {
    $DB.gameSettings.includes("casual") ? ($speed = 375) : ($speed = 550);
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

  function nextSpeed() {
    speedIndex == speeds.length - 1 ? (speedIndex = 0) : speedIndex++;
    $speed = speeds[speedIndex];
  }

  let formattedTime = "00:00:00";

  $: if ($DB.timeSpent > 0) {
    formattedTime = formatDuration($DB.timeSpent);
  } else {
    formattedTime = "00:00:00";
  }
</script>

<div
  id="header"
  class="flex px-6 gap-6 justify-center flex-row fixed top-0 left-0 right-0 cursor-default z-10 bg-black text-[white] py-3 align-middle
     border-b-4 border-sidebarBackground

		{$modifyPlotMenuOptions.visible ? 'opacity-70' : ''}
	"
>
  <SimpleButton
    text="Pause game"
    onOpen={() => ($paused = true)}
    styling={"fixed top-2 right-2"}
  />
  <div class="flex justify-between flex-col align-middle items-center w-full">
    <div class="rounded-xl">
      <div
        class="flex flex-col gap-2 justify-center w-full
        "
      >
        <div class="text-4xl flex flex-row items-center justify-between">
          <div
            on:click={changeName}
            class="cursor-pointer flex flex-row justify-start"
          >
            <h1 class="cursor-pointer w-full text-center select-none">
              {$DB.townInfo.name}
            </h1>
          </div>
        </div>
        <div>
          <div class="flex flex-col align-middle justify-center">
            <div
              class="flex align-middle items-center text-accentText flex-row w-full justify-center gap-2 h-max"
            >
              <span class="text-xs px-4 min-w-24"
                >👥 {$DB.townInfo.population_count}</span
              >
              <div
                class="rounded-xl flex-row text-accentText gap-4 w-20 flex items-center max-w-24"
              >
                <span class="flex flex-col">
                  <span class="text-xs">Year</span>
                  <span class="font-semibold text-xs">
                    {Math.floor($DB.environment.day / 365) + 1}
                  </span>
                </span>
                <span class="flex flex-col">
                  <span class="text-xs">Day</span>
                  <span class="font-semibold text-xs">
                    {($DB.environment.day % 365) + 1}
                  </span>
                </span>
              </div>
              <span
                class="cursor text-blue-200 text-nowrap noselect text-end w-36"
                on:click={() => {
                  nextSpeed();
                }}
                class:text-blue-200={speedIndex == 0}
                class:text-yellow-200={speedIndex == 1}
                class:text-red-200={speedIndex == 2}
                >{speedIndex == 0
                  ? "Normal"
                  : speedIndex == 1
                    ? "Fast"
                    : "Superfast"} Speed</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /*  */
</style>
