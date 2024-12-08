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
  <div class="flex justify-between flex-col align-middle items-center w-full">
    <div class="rounded-xl">
      <div
        class="flex flex-col gap-4 justify-center w-full
        "
      >
        <div class=" text-md">
          <div
            on:click={changeName}
            class="cursor-pointer flex flex-row justify-start"
          >
            <h1
              class="font-bold cursor-pointer w-full text-center select-none text-3xl"
            >
              {$DB.townInfo.name}
            </h1>
          </div>
        </div>
        <div>
          <div class="flex flex-col align-middle justify-center">
            <!-- circle div that says the day number, with the day and year below (outside of circle) -->
            <div
              class="flex align-middle items-center text-accentText flex-row w-full justify-center gap-2 h-max"
            >
              <div
                class="rounded-xl flex-row text-accentText gap-4 w-18 flex items-center max-w-18"
              >
                <span class="flex flex-col gap-1">
                  <span class="text-xs">Year</span>
                  <span class="font-semibold text-xs">
                    {Math.floor($DB.environment.day / 365) + 1}
                  </span>
                </span>
                <span class="flex flex-col gap-1">
                  <span class="text-xs">Day</span>
                  <span class="font-semibold text-xs">
                    {($DB.environment.day % 365) + 1}
                  </span>
                </span>
              </div>
              <span
                class="font-mono cursor text-blue-500 text-nowrap noselect text-end w-36"
                on:click={() => {
                  nextSpeed();
                }}
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
