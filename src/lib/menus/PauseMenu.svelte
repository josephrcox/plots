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
    ACTIVE_GAME_DB_NAME,
    TEMP_GAME_DB_NAME,
    setSelectedGame,
    USER_DB_NAME,
  } from "../store";
  import * as Dialog from "$lib/components/ui/dialog";
  // @ts-ignore
  import { winScenarios } from "../objects/WinScenarios.js";

  // @ts-ignore
  import {
    difficulty_options,
    // @ts-ignore
  } from "../objects/difficulty.js";

  import { achievements } from "$lib/objects/AchievementList.js";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import SimpleButton from "$lib/components/SimpleButton.svelte";
  import { createAMockTown, formatNumber } from "$lib/utils";
  // @ts-ignore
  import { compressMyGame } from "$lib/gameShare";
  import { local } from "d3-selection";
  import { Game } from "$lib/types";
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

  function loadGame(e: any) {
    const files = e.target.files;
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
    $DB = null;
    localStorage.removeItem(ACTIVE_GAME_DB_NAME);
    clearDB();
  }

  let games: Game[] = [];
  $: {
    // parse each individual game and then add to the games array
    games = [];
    for (let i = 0; i < $userDB.games.length; i++) {
      games.push(JSON.parse($userDB.games[i]));
    }
  }
</script>

<Dialog.Root bind:open={$paused}>
  <Dialog.Content
    class="max-w-[75%] max-h-[100%] flex flex-col justify-between bg-popupBackground text-accentText overflow-scroll"
  >
    <Dialog.Header>
      <Dialog.Title class="text-3xl font-semibold text-accentText"
        >Pause</Dialog.Title
      >
    </Dialog.Header>
    <div class="flex flex-row w-full gap-10 justify-between">
      <div class="flex flex-col flex-grow max-h-[80%] justify-between">
        <div class="flex flex-col bg-accent rounded-md p-2 pt-3">
          <div class="text-sm pb-2">Switch towns</div>
          <ul class="flex flex-col gap-0">
            {#each games as game, index}
              <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
              <li
                class="text-sm rounded-sm p-2
                 flex flex-col
                 {index == $userDB.selectedGame
                  ? 'bg-darkerAccent text-accentText cursor-not-allowed'
                  : 'hover:bg-white hover:text-black cursor-pointer '}
                "
                on:click={() => {
                  setSelectedGame(index);
                }}
              >
                <span class="before:content-['🏠'] before:mr-2"
                  >{game.townInfo.name}</span
                >
                <span class="text-xs opacity-70 font-mono"
                  >{game.environment.day} days, {formatNumber(
                    game.townInfo.gold,
                    false,
                  )} gold, {formatNumber(game.townInfo.population_count, false)}
                  population
                </span>
              </li>
            {/each}
          </ul>
          <div class="flex flex-row justify-end pt-2">
            <SimpleButton
              styling="font-bold hover:brightness-110 hover:bg-sidebarBackground hover:text-black w-min"
              text="+ Build new town"
              onOpen={restartGame}
            />
          </div>
        </div>
        <div class="flex flex-row flex-wrap gap-3">
          <SimpleButton
            styling="bg-gray-500"
            text="💾 Save town file"
            onOpen={saveGame}
          />

          <SimpleButton
            text="📤 Load town file"
            styling="bg-gray-500"
            onOpen={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.onchange = (e) => loadGame(e);
              input.click();
            }}
          />
          <SimpleButton
            text="📲 Share town"
            styling="bg-gray-500"
            onOpen={async () => {
              const url = await compressMyGame();
              navigator.clipboard.writeText(url);
              alert("Copied to clipboard");
            }}
          />
          <SimpleButton
            text="❌ Delete current town"
            styling="bg-red-800"
            onOpen={async () => {
              // clear the current selected game from the userDB, and then switch to the next game
              let newUserDB = { ...$userDB };
              newUserDB.games.splice($userDB.selectedGame, 1);
              localStorage.setItem(USER_DB_NAME, JSON.stringify(newUserDB));
              setSelectedGame(0);
            }}
          />
          {#if $DB.gameSettings.includes("devMode")}
            <SimpleButton
              styling="bg-black opacity-50 w-min"
              text="🔄 New mock town"
              onOpen={() => {
                createAMockTown($DB);
              }}
            />
          {/if}
        </div>
      </div>
      <div class="flex flex-col gap-6 justify-between">
        {#if localStorage.getItem(TEMP_GAME_DB_NAME) == null}
          <div class="flex-grow">
            <h4 class="underline underline-offset-4">
              Achievements ({completedAchievements.length}
              / {achievements.length})
            </h4>
            <span class="text-sm text-gray-400"
              >Track your progress through towns & complete challenges! Rewards
              for completing achievements can be applied to the current town.
            </span>
            <br />
            <div class="overflow-scroll mt-2 h-[60vh]">
              <div
                class="flex flex-col gap-4 overflow-scroll pb-10 scroll-smooth"
              >
                {#each reactiveAchievements as achievement}
                  <div
                    class="flex flex-col gap-3 cursor-default rounded-xl
						{hasAchievement(achievement.id)
                      ? 'bg-green-700 text-accentText'
                      : 'bg-gray-500 opacity-35'}
						
						"
                  >
                    <div class="flex-col flex px-3 py-2 gap-1">
                      <div class="min-w-32 flex">
                        <span class="flex flex-row w-[100%]">
                          <div
                            class="flex flex-row w-[100%] justify-between gap-6

										"
                          >
                            <span class="font-semibold text-sm text-nowrap">
                              {achievement.icon} {achievement.title}</span
                            >

                            <div
                              class="font-thin opacity-75 text-xs text-wrap max-w-[50%]"
                            >
                              {achievement.requirements}
                            </div>
                          </div>
                        </span>
                      </div>
                      <div class=" opacity-85 text-xs font-light">
                        {achievement.description}
                      </div>
                      <div
                        class="pb-2 {hasAchievement(achievement.id)
                          ? ''
                          : 'hidden'} text-xs text-green-400"
                      >
                        ✅ Completed on Day {getAchievementCompletionDayAndTown(
                          achievement.id,
                        )}
                      </div>

                      {#if hasAchievement(achievement.id) && !achievementPrizeCollected(achievement.id)}
                        <SimpleButton
                          text={`💰 Collect Prize: $${formatNumber(achievement.prize)} gold`}
                          styling={"bg-yellow-300 text-black"}
                          onOpen={() => {
                            collectPrize(achievement.id);
                            // hide this button
                            const button = document.getElementById(
                              `collectPrize-${achievement.id}`,
                            );
                            if (button) {
                              button.style.display = "none";
                            }
                          }}
                        />
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div></Dialog.Content
  >
</Dialog.Root>

<AlertDialog.Root open={$showAchievementPopup}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title class="text-center text-lg font-bold"
        >{getLatestAchievementObject()?.title}</AlertDialog.Title
      >
      <AlertDialog.Description>
        <div class="flex flex-row align-middle justify-evenly px-6 py-2">
          <div class=" absolute top-4 left-4 text-5xl">
            {getLatestAchievementObject()?.icon}
          </div>
          <div
            class="pl-8 w-[80%] align-middle flex flex-col justify-center text-lg"
          >
            {getLatestAchievementObject()?.description}
            {getLatestAchievementObject()?.requirements}
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
