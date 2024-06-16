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
    showWelcome,
  } from "../store";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  // @ts-ignore
  import { winScenarios } from "../objects/WinScenarios.js";
  import { difficulty_options } from "../objects/difficulty.js";
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
          alert("Invalid game file");
          return;
        }
        clearDB(JSON.parse(contents));
      } else {
        alert("Invalid game file: is not String.");
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
</script>

<AlertDialog.Root open={$showWelcome}>
  <AlertDialog.Content class="bg-foregroundDark text-foregroundText">
    <AlertDialog.Header>
      <AlertDialog.Title class="">Welcome to Plots!</AlertDialog.Title>
      <AlertDialog.Description>
        <div class="flex flex-col gap-3 max-h-[50vh] overflow-y-scroll">
          <p>
            You come across a large amount of land, and you decide to start a
            town called <span class="font-bold text-accent"
              >{$DB.townInfo.name}.</span
            >
          </p>
          <div>
            <p>To run a successful town, you will need to have:</p>
            <ul class="list-desc">
              <Separator class="bg-white mt-2 mb-1" />
              <li>
                👥 People - build homes and they will stay as long as they are
                happy.
              </li>
              <Separator class="bg-white mt-2 mb-1" />
              <li>
                🪵 Resources - generated by some plots and used to build others.
                some plots require sustained weekly resources (such as needing
                wood to heat homes)
              </li>
              <Separator class="bg-white mt-2 mb-1" />
              <li>
                💰 Gold - generated by plots through tax revenue. most plots
                make the town some amount of money but some cost a lot to
                operate.
              </li>
              <Separator class="bg-white mt-2 mb-1" />
            </ul>
          </div>
          <p>
            The town's key metrics are <span
              class="font-bold text-textHappyDark">Happiness</span
            >
            and <span class="font-bold text-textHappyDark">Health</span>, shown
            in the top-left corner.
          </p>
          <p>
            These metrics are affected by the plots you build. Some plots may
            not always increase happiness, and some could even be harmful enough
            to tear down an otherwise great town.
          </p>
          <p>
            Be cautious and make sure to hover over plots before you buy them.
          </p>
          <img src="welcome_example_plot.png" class="max-w-[60%] object-fit" />
        </div>
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel
        class="bg-button rounded-2xl text-foregroundText px-4 py-2 hover:rounded-lg transition-all duration-300"
        on:click={() => {
          showWelcome.set(false);
        }}
      >
        Close
      </AlertDialog.Cancel>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<style>
  /*  */
</style>
