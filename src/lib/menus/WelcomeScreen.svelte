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
    showCustomAlert,
  } from "../store";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  // @ts-ignore
  import { winScenarios } from "../objects/WinScenarios.js";
  // @ts-ignore
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

  const objectives = [
    {
      text: "Create a thriving economy",
      description:
        "Invite people into your town, and have them work to generate food, wood, and other resources.",
    },
    {
      text: "Grow your kingdom",
      description:
        "Get enough resources to build a <span class='text-green-300'>City Hall</span>, which will be used to expand your kingdom and keep your townspeople the happiest!",
    },
    {
      text: "Keep the town Happy and Healthy",
      description:
        "Pay attention to your happiness and health in the top left when you place plots. Certain ones may greatly impact your town's well-being. ",
    },
  ];
</script>

<AlertDialog.Root open={$showWelcome}>
  <AlertDialog.Content
    class="bg-foregroundDark text-accentText min-w-[50vw] min-h-[50vh] flex flex-col justify-between "
  >
    <AlertDialog.Header>
      <AlertDialog.Description>
        <div class="flex flex-row gap-6">
          <div
            class="flex flex-col gap-8 overflow-y-scroll
          "
          >
            <div class="flex flex-col gap-4">
              <h1 class="text-3xl mt-4 text-white font-semibold">
                The town of <span class="text-accent">{$DB.townInfo.name}</span>
                has been founded!
              </h1>
              <p>
                Congratulations! 🎉 After leaving your old town, you've
                discovered a fertile land bursting with potential. This is your
                chance to build a thriving new community from the ground up.
              </p>
              <p>
                As the town founder and <span class="">formal liege</span>, you
                must <span class="text-blue-300">collect taxes</span>, and use
                that funding to
                <span class="text-blue-300">build plots</span>.
              </p>
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex flex-row align-middle items-center">
                <h3 class="text-lg underline underline-offset-8">
                  Your Objectives
                </h3>
              </div>

              <ul
                class="select-none
                gap-4 flex flex-col
              "
              >
                {#each objectives as objective}
                  <li class="flex flex-row gap-2 items-center">
                    <div class="flex flex-col gap-2">
                      <span class="hover:text-green-300 font-bold"
                        >☑️ {objective.text}</span
                      >
                      <span
                        class="text-sm transition-all duration-300 ease-in-out
                        "
                      >
                        <blockquote class="text-xs px-[18px]">
                          {@html objective.description}
                        </blockquote>
                      </span>
                    </div>
                  </li>
                {/each}
              </ul>
            </div>
          </div>
          <!-- <img src="welcome_example_plot.png" class="max-w-[60%] object-fit" /> -->
        </div>
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel
        class="bg-accent rounded-2xl text-accentText px-4 py-2 hover:scale-110 transition-all duration-300 "
        on:click={() => {
          showWelcome.set(false);
        }}
      >
        Start your kingdom
      </AlertDialog.Cancel>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<style>
  .overflow-y-scroll {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
</style>
