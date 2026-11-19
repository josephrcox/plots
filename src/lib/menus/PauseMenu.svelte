<script lang="ts">
  import {
    DB,
    paused,
    userDB,
    showCompletedAchievements,
    pauseMenuTab,
    showAchievementPopup,
    showAlert,
    isReadOnly,
    setSelectedGame,
    deleteGame,
    leaveToNewTown,
    loadGameFromFile,
  } from "../store";
  import * as Dialog from "$lib/components/ui/dialog";
  import { achievements } from "$lib/objects/AchievementList";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import SimpleButton from "$lib/components/SimpleButton.svelte";
  import { createAMockTown, formatNumber } from "$lib/utils";
  // @ts-ignore
  import { compressMyGame } from "$lib/gameShare";
  import type { Game } from "$lib/types";

  achievements.sort((a, b) => {
    if (hasAchievement(a.id) && !hasAchievement(b.id)) return -1;
    if (!hasAchievement(a.id) && hasAchievement(b.id)) return 1;
    return 0;
  });

  $: completedAchievements = $userDB
    ? achievements.filter((a) => hasAchievement(a.id))
    : [];

  function getAchievementCompletionDayAndTown(id: string) {
    const achievement = $userDB.achievements.find((a) => a[0] == id);
    if (achievement == null) return 0;
    return `${achievement[1]} in ${achievement[2]}.`;
  }

  function achievementPrizeCollected(id: string) {
    const achievement = $userDB.achievements.find((a) => a[0] == id);
    if (achievement == null) return false;
    return achievement[3] != null;
  }

  function collectPrize(id: string) {
    const achievement = $userDB.achievements.find((a) => a[0] == id);
    const achievementObject = achievements.find((a) => a.id == id);
    if (!achievement || !achievementObject || achievement[3] != null) return;
    $DB!.townInfo.gold += achievementObject.prize;
    $userDB.achievements = $userDB.achievements.map((a) =>
      a[0] == id ? ([a[0], a[1], a[2], true] as typeof a) : a,
    );
  }

  // Hide achievements whose prize has been collected, unless toggled on.
  $: reactiveAchievements = $showCompletedAchievements
    ? achievements
    : achievements.filter(
        (a) =>
          $userDB &&
          (!hasAchievement(a.id) || !achievementPrizeCollected(a.id)),
      );

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

  function loadGame(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (!loadGameFromFile(JSON.parse(String(reader.result)))) {
          showAlert("Invalid game file");
        }
      } catch {
        showAlert("Invalid game file: could not read it.");
      }
    };
    reader.readAsText(file);
  }

  function hasAchievement(id: string) {
    return $userDB.achievements.some((a) => a[0] == id);
  }

  export function toggleShowCompleted() {
    showCompletedAchievements.update((value) => {
      localStorage.setItem("showCompletedAchievements", String(!value));
      return !value;
    });
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
    $paused = false;
    leaveToNewTown();
  }

  function deleteCurrentTown() {
    const name = $DB?.townInfo.name ?? "this town";
    if (!confirm(`Delete ${name}? This can't be undone.`)) return;
    deleteGame($userDB.selectedGame);
  }

  // Summaries for the town switcher (games are stored as JSON strings).
  $: games = $userDB.games.map((json) => {
    try {
      return JSON.parse(json) as Game;
    } catch {
      return null;
    }
  });
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
              {#if game}
                <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                <li
                  class="text-sm rounded-sm p-2
                 flex flex-col
                 {index == $userDB.selectedGame
                    ? 'bg-darkerAccent text-accentText cursor-not-allowed'
                    : 'hover:bg-white hover:text-black cursor-pointer '}
                "
                  on:click={() => {
                    if (index != $userDB.selectedGame) setSelectedGame(index);
                  }}
                >
                  <span class="before:content-['🏠'] before:mr-2"
                    >{game.townInfo.name}</span
                  >
                  <span class="text-xs opacity-70 font-mono"
                    >{game.environment.day} days, {formatNumber(
                      game.townInfo.gold,
                      false,
                    )} gold, {formatNumber(
                      game.townInfo.population_count,
                      false,
                    )}
                    population
                  </span>
                </li>
              {/if}
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
              input.accept = "application/json,.json";
              input.onchange = loadGame;
              input.click();
            }}
          />
          <SimpleButton
            text="📲 Share town"
            styling="bg-gray-500"
            onOpen={async () => {
              const url = compressMyGame();
              try {
                await navigator.clipboard.writeText(url);
                showAlert("Share link copied to clipboard!");
              } catch {
                showAlert(`Copy this link to share your town:<br/><br/>${url}`);
              }
            }}
          />
          <SimpleButton
            text="❌ Delete current town"
            styling="bg-red-800"
            onOpen={deleteCurrentTown}
          />
          {#if $DB.gameSettings.includes("devMode")}
            <SimpleButton
              styling="bg-black opacity-50 w-min"
              text="🔄 New mock town"
              onOpen={createAMockTown}
            />
          {/if}
        </div>
      </div>
      <div class="flex flex-col gap-6 justify-between">
        {#if !isReadOnly}
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
                          onOpen={() => collectPrize(achievement.id)}
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
