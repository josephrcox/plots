<script lang="ts">
  import { onMount } from "svelte";
  import {
    DB,
    speed,
    modifyPlotMenuOptions,
    paused,
    isReadOnly,
  } from "./store";
  import { formatDuration } from "./utils";
  import SimpleButton from "./components/SimpleButton.svelte";
  import { Separator } from "$lib/components/ui/separator";

  // Milliseconds per game day for x1 / x2 / x3.
  const speeds = $DB!.gameSettings.includes("casual")
    ? [375, 75, 35]
    : [550, 150, 70];
  let speedIndex = 0;
  $speed = speeds[0];

  onMount(() => {
    const interval = setInterval(() => {
      if (!$paused && $DB) $DB.timeSpent += 1000;
    }, 1000);
    return () => clearInterval(interval);
  });

  function changeName() {
    if (isReadOnly) return;
    const newName = prompt("Enter a new name for your town (under 200 chars)");
    if (newName && newName.trim().length >= 1 && newName.length < 200) {
      $DB!.townInfo.name = newName.trim();
    }
  }

  function nextSpeed() {
    if (isReadOnly) return;
    speedIndex = (speedIndex + 1) % speeds.length;
    $speed = speeds[speedIndex];
  }

  $: formattedTime = formatDuration($DB?.timeSpent ?? 0);
</script>

<div
  id="header"
  class="flex px-6 gap-6 justify-center flex-row fixed top-0 left-0 right-0 cursor-default z-10 bg-black text-[white] py-1 align-middle
     border-b-4 border-sidebarBackground

		{$modifyPlotMenuOptions.visible ? 'opacity-70' : ''}
	"
>
  <SimpleButton
    text="Pause"
    onOpen={() => ($paused = true)}
    styling={"fixed top-2 right-4 opacity-70 bg-gray-600"}
  />
  <div class="flex justify-between flex-col align-middle items-center w-full">
    <div class="rounded-xl w-full">
      <div
        class="flex flex-col gap-2 justify-center w-full
        "
      >
        <div class="text-2xl flex flex-row items-center w-full text-center">
          <div
            class="cursor-pointer flex flex-row justify-center text-center w-full"
          >
            <div
              on:click={changeName}
              class="cursor-pointer w-min whitespace-nowrap text-center select-none font-serif opacity-80"
            >
              {$DB.townInfo.name}
            </div>
          </div>
        </div>
        <div>
          <div
            class="flex flex-col align-middle w-full justify-center items-center"
          >
            <div
              class="flex align-middle items-center text-accentText flex-row justify-between h-max
              "
            >
              <span
                class="text-sm text-left items-start justify-start w-min flex-nowrap text-nowrap"
                >👥 {$DB.townInfo.population_count}</span
              >
              <Separator
                orientation="vertical"
                class="h-12 bg-gray-600 opacity-50 mx-4"
              />
              <div class="flex flex-row justify-start gap-6 align-middle">
                <span class="flex flex-col">
                  <span class="text-xs">Year</span>
                  <span class="font-semibold text-xs">
                    {Math.floor($DB.environment.day / 365) + 1}
                  </span>
                </span>
                <span class="flex flex-col">
                  <span class="text-xs">Week</span>
                  <span class="font-semibold text-xs">
                    {(Math.floor($DB.environment.day / 7) % 52) + 1}
                  </span>
                </span>
              </div>

              <Separator
                orientation="vertical"
                class="h-12 bg-gray-600 opacity-50 mx-4"
              />
              <span
                class="cursor-pointer text-blue-200 noselect"
                on:click={nextSpeed}
                class:text-blue-200={speedIndex == 0}
                class:text-yellow-200={speedIndex == 1}
                class:text-red-200={speedIndex == 2}
                >{speedIndex == 0
                  ? "⏩ x1"
                  : speedIndex == 1
                    ? "⏩ x2"
                    : "⏩ x3"}</span
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
