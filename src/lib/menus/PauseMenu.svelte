<script lang="ts">
  // @ts-ignore
  import {
    DB,
    clearDB,
    paused,
    hasPlotOfType,
    userDB,
    showCompletedAchievements,
    pauseMenuTab,
    showAchievementPopup,
    showCustomAlert,
  } from "../store";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  // @ts-ignore
  import { winScenarios } from "../objects/WinScenarios.js";

  // @ts-ignore
  import {
    max_tax_rates_based_on_difficulty,
    difficulty_options,
    // @ts-ignore
  } from "../objects/difficulty.js";

  import { achievements } from "$lib/objects/AchievementList.js";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  const scenarios: any = winScenarios;
  const endGoal = scenarios[$DB.endGoal];
  const difficulty: number = (difficulty_options as any)[$DB.difficulty] || 0;

  achievements.sort((a, b) => {
    if (hasAchievement(a.id) && !hasAchievement(b.id)) return -1;
    if (!hasAchievement(a.id) && hasAchievement(b.id)) return 1;
    return 0;
  });

  const completedAchievements = achievements.filter((a) =>
    hasAchievement(a.id),
  );

  function getAchievementCompletionDayAndTown(id: string) {
    const achievement = $userDB.achievements.find(
      (a: [string, number]) => a[0] == id,
    );
    if (achievement == null) return 0;
    return `${achievement[1]} in ${achievement[2]}.`;
  }

  function achievementPrizeCollected(id: string) {
    const achievement = $userDB.achievements.find(
      (a: [string, number]) => a[0] == id,
    );
    if (achievement == null) return false;
    return achievement[3];
  }

  function collectPrize(id: string) {
    const achievement = $userDB.achievements.find(
      (a: [string, number]) => a[0] == id,
    );
    if (achievement == null) return;
    // if (achievement[3]) return;
    const achievementObject = achievements.find((a) => a.id == id);
    if (achievementObject == null) return;
    $DB.townInfo.gold += achievementObject.prize;
    achievement[3] = true;
    $userDB.achievements = $userDB.achievements.map((a: [string, number]) =>
      a[0] == id ? achievement : a,
    );
  }

  let reactiveAchievements = achievements;

  function formatNumber(n: number) {
    return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
  }

  let dbInitialized = false;
  $: if ($DB) {
    dbInitialized = true;

    // check if $showCompletedAchievements is true
    if ($showCompletedAchievements) {
      reactiveAchievements = achievements;
    } else {
      reactiveAchievements = [];
      // Show only those that are not in the userDB
      // OR those that ARE in the userDB but have achievementPrizeCollected == false
      for (let i = 0; i < achievements.length; i++) {
        if (
          !hasAchievement(achievements[i].id) ||
          !achievementPrizeCollected(achievements[i].id)
        ) {
          reactiveAchievements.push(achievements[i]);
        }
      }
    }
  } else {
    dbInitialized = false;
  }

  function saveGame() {
    const data = JSON.stringify($DB);
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function loadGame() {
    const uploader = document.getElementById("upload") as HTMLInputElement;
    const files = uploader.files;
    if (files == null) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      if (e.target == null) return;
      const contents = e.target.result;
      if (typeof contents === "string") {
        if (!isValidFile(contents)) {
          showCustomAlert.set("Invalid game file");
          return;
        }
        clearDB(JSON.parse(contents));
      } else {
        showCustomAlert.set("Invalid game file: is not String.");
      }
    };
    reader.readAsText(file);
  }

  function isValidFile(s: string) {
    const json = JSON.parse(s);
    if (json.townInfo != null && json.difficulty != null) return true;
    return false;
  }

  function hasAchievement(id: string) {
    if ($userDB.achievements == null) return false;
    return (
      $userDB.achievements.find((a: [string, number]) => a[0] == id) != null
    );
  }

  export function toggleShowCompleted() {
    showCompletedAchievements.update((value) => !value);
    localStorage.setItem(
      "showCompletedAchievements",
      localStorage.getItem("showCompletedAchievements") === "true"
        ? "false"
        : "true",
    );
  }

  if (localStorage.getItem("pauseMenuTab") == null) {
    localStorage.setItem("pauseMenuTab", "game");
    pauseMenuTab.set("game");
  }

  function getLatestAchievementObject() {
    const latestAchievement =
      $userDB.achievements[$userDB.achievements.length - 1];
    if (latestAchievement == null) return;
    return achievements.find((a) => a.id == latestAchievement[0]);
  }

  function restartGame() {
    $paused = true;
    localStorage.setItem("reset", "true");
    //location.reload();
    clearDB();
  }
</script>

<Dialog.Root bind:open={$paused}>
  <Dialog.Content
    class=" max-w-[90vw] max-h-[90vh] bg-foregroundDark text-accentText"
  >
    <Dialog.Header>
      <Dialog.Title>Pause Menu</Dialog.Title>
      <Dialog.Description>Unpause any time by pressing 'P'</Dialog.Description>
    </Dialog.Header>
    <div class="flex flex-row w-full gap-10">
      <div class="flex flex-col gap-6 justify-between">
        <div class="flex-col h-max">
          <h4 class="underline underline-offset-4">This game</h4>
          <span class="text-sm text-gray-400">{endGoal.description_title}</span>
          <div class="mt-6 gap-0 py-0 text-gray-400 text-sm">
            {#if $DB.endGoal == "land"}
              <div class="leading-relaxed text-sm">
                With your difficulty ({difficulty}), you must also have:
              </div>
              <ul class="list-inside list-disc leading-relaxedmt-0 text-sm">
                <li>
                  {#if $DB.townInfo.population_count >= endGoal.requirements[$DB.difficulty].population_count}
                    ✅
                  {:else}
                    ❌
                  {/if}
                  Population: {JSON.stringify(
                    endGoal.requirements[$DB.difficulty].population_count,
                  )} - Currently at {JSON.stringify(
                    $DB.townInfo.population_count,
                  )}
                </li>
                <li>
                  {#if $DB.townInfo.happiness >= endGoal.requirements[$DB.difficulty].happiness}
                    ✅
                  {:else}
                    ❌
                  {/if}
                  Happiness: {JSON.stringify(
                    endGoal.requirements[$DB.difficulty].happiness,
                  )} - Currently at {JSON.stringify($DB.townInfo.happiness)}
                </li>
                <li>
                  {#if $DB.townInfo.employees / $DB.townInfo.population_count >= endGoal.requirements[$DB.difficulty].employment}
                    ✅
                  {:else}
                    ❌
                  {/if}
                  Employment: {JSON.stringify(
                    endGoal.requirements[$DB.difficulty].employment * 100,
                  )}% - Currently at {JSON.stringify(
                    ($DB.townInfo.employees / $DB.townInfo.population_count ||
                      0) * 100,
                  )}%
                </li>
                <li>
                  {#if $DB.townInfo.health >= endGoal.requirements[$DB.difficulty].health}
                    ✅
                  {:else}
                    ❌
                  {/if}
                  Health: {JSON.stringify(
                    endGoal.requirements[$DB.difficulty].health,
                  )} - Currently at {JSON.stringify($DB.townInfo.health)}
                </li>

                <li>
                  {#if $DB.townInfo.knowledge_points >= endGoal.requirements[$DB.difficulty].knowledge}
                    ✅
                  {:else}
                    ❌
                  {/if}
                  Knowledge: {JSON.stringify(
                    endGoal.requirements[$DB.difficulty].knowledge,
                  )} - Currently at {JSON.stringify(
                    $DB.townInfo.knowledge_points,
                  )}
                </li>
              </ul>
              {#if endGoal.requirements[$DB.difficulty].required_plots != null && endGoal.requirements[$DB.difficulty].required_plots.length > 0}
                <br />
                You also need to have these plots:
                {#each endGoal.requirements[$DB.difficulty].required_plots as plot}
                  <div class="text-sm">
                    <li>
                      {#if hasPlotOfType(plot, $DB).length > 0}
                        ✅
                      {:else}
                        ❌
                      {/if}
                      {plot}
                    </li>
                  </div>
                {/each}
              {/if}
            {/if}
          </div>
        </div>
        <div>
          <div class="flex flex-col gap-3 h-max">
            <div class="flex gap-10 justify-start min-w-[100%] w-[100%] items">
              <Label
                for="saveButton"
                class="cursor-pointer bg-blue-600 rounded-md text-center p-2.5 hover:bg-blue-700 justify-center flex 
					">Save game</Label
              >
              <Button
                class="
					bg-blue-600 hover:bg-blue-700 hidden
					"
                id="saveButton"
                on:click={() => saveGame()}>Save</Button
              >

              <Label
                for="upload"
                class="cursor-pointer bg-blue-600 rounded-md text-center p-2.5 hover:bg-blue-700 justify-center flex 
					">Upload game</Label
              >
              <Input
                class="hidden"
                type="file"
                on:change={loadGame}
                id="upload"
              />
              <Button
                class="
					bg-blue-600 hover:bg-blue-700
					"
                id="newGame"
                on:click={() => restartGame()}>New Game</Button
              >
            </div>
          </div>
        </div>
      </div>
      <Separator orientation="vertical" />
      <div>
        <h4 class="underline underline-offset-4">
          Your achievement ({completedAchievements.length}
          / {achievements.length})
        </h4>
        <span class="text-sm text-gray-400"
          >Track your progress through games & complete challenges!
        </span>
        <br />
        <div class="flex items-center">
          <input
            type="checkbox"
            id="toggle-show-completed"
            class="rounded"
            tabindex="-1"
            on:change={() => {
              toggleShowCompleted();
            }}
            on:keydown={(e) => {
              if (e.key === "p") {
                paused.set(false);
              }
            }}
            checked={localStorage.getItem("showCompletedAchievements") ===
              "true"}
          />
          <label
            for="toggle-show-completed"
            class="text-xs text-gray-400 select-none ml-2
					no-select cursor-pointer
				
				">Show completed</label
          >
        </div>
        <div class="overflow-scroll mt-2 h-[55vh]">
          <div class="flex flex-col gap-4 overflow-scroll pb-20 scroll-smooth">
            {#each reactiveAchievements as achievement}
              <div
                class="flex flex-col gap-3 cursor-default rounded-md
						{hasAchievement(achievement.id) ? 'bg-green-700' : 'bg-gray-500 opacity-35'}
						
						"
              >
                <div class="flex-col flex px-3 py-2 gap-0">
                  <div class="min-w-32 flex">
                    <span class="flex flex-row justify-between w-[100%]">
                      <div
                        class="flex flex-row gap-3 w-[100%] text- items-center

										"
                      >
                        <span class="font-semibold text-lg"
                          >{achievement.title}</span
                        >

                        <div class="font-thin text-white opacity-75 text-xs">
                          {achievement.requirements}
                        </div>
                      </div>
                      <div
                        class="text-sm flex-grow pr-1 break-inside-avoid
											"
                      >
                        {achievement.icon}
                      </div>
                    </span>
                  </div>
                  <div class="text-white opacity-75 text-sm font-light">
                    {achievement.description}
                  </div>
                  <div
                    class="{hasAchievement(achievement.id)
                      ? ''
                      : 'hidden'} text-xs text-green-400"
                  >
                    ✅ Completed on Day {getAchievementCompletionDayAndTown(
                      achievement.id,
                    )}
                  </div>

                  {#if hasAchievement(achievement.id) && !achievementPrizeCollected(achievement.id)}
                    <Button
                      class="bg-blue-600 hover:bg-blue-700 mt-4"
                      id="collectPrize-{achievement.id}"
                      on:click={() => {
                        collectPrize(achievement.id);
                        // hide this button
                        const button = document.getElementById(
                          `collectPrize-${achievement.id}`,
                        );
                        if (button) {
                          button.style.display = "none";
                        }
                      }}
                    >
                      Collect Prize: ${formatNumber(achievement.prize)} gold
                    </Button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
        <span class="text-sm text-yellow-400 italic"
          >Prizes apply to the current game you are in. You can wait to apply
          them until the right time.
        </span>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>

<AlertDialog.Root open={$showAchievementPopup}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title class="text-center text-xl font-bold"
        >{getLatestAchievementObject()?.title}</AlertDialog.Title
      >
      <AlertDialog.Description>
        <div class="flex flex-row align-middle justify-evenly px-6 py-4">
          <div class="text-center w-[30%] align-middle flex flex-col text-8xl">
            {getLatestAchievementObject()?.icon}
          </div>
          <div
            class="pl-8 w-[80%] align-middle flex flex-col justify-center text-lg"
          >
            {getLatestAchievementObject()?.description}
          </div>
        </div>
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel
        on:click={() => {
          $showAchievementPopup = false;
        }}>Close to collect prize</AlertDialog.Cancel
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<style>
  /*  */
</style>
