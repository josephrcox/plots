<script lang="ts">
  import {
    startGame,
    DB,
    startGameMenu,
    userDB,
    setUserDB,
    paused,
    showCustomAlert,
  } from "../store";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import { flyAndScale } from "$lib/utils";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Difficulty, EndGoal, WinScenario } from "$lib/types";
  // @ts-ignore
  import { winScenarios } from "../objects/WinScenarios";

  paused.set(false);

  function captureAndStart() {
    const difficulty = (
      document.getElementById("difficulty") as HTMLSelectElement
    ).value;
    const endGoal = (document.getElementById("endGoal") as HTMLSelectElement)
      .value;
    const townName = (document.getElementById("townName") as HTMLInputElement)
      .value;

    // GAME SETTINGS
    const checkboxes = ["devMode", "tomPetty", "casual"];
    const settings = checkboxes.filter(
      (id) => (document.getElementById(id) as HTMLInputElement).checked,
    );

    const dif = difficulty as Difficulty;
    const eg = endGoal as EndGoal;
    startGame(dif, eg, townName, settings);
  }

  let selectedGameMode = "free_play";

  const setSelectedGameMode = (e: Event) => {
    selectedGameMode = (e.target as HTMLSelectElement).value;
  };

  function deleteAllData() {
    showCustomAlert.set("Deleted :)");
    localStorage.clear();
    window.location.href = "";
  }

  function setUsername() {
    const newName = prompt("Enter new username");
    let z = $userDB;
    z.username = newName;
    setUserDB(z);
  }
</script>

<Dialog.Root bind:open={$startGameMenu.visible}>
  <Dialog.Content
    transition={flyAndScale}
    class="bg-foregroundDark text-foregroundText"
  >
    <Dialog.Header>
      <Dialog.Title>Welcome to Plots!</Dialog.Title>
      <Dialog.Description>
        <a
          href="https://github.com/josephrcox/plots#how-to-play"
          class="text-blue-500 text-sm mb-4 hover:underline"
          target="_blank"
        >
          GitHub / Learn how to play</a
        >

        <div class="flex flex-col justify-center gap-5 mt-4">
          <div>
            <Label for="difficulty" class="mt-2"
              >Select a map size (difficulty)</Label
            >
            <select
              id="difficulty"
              class="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            >
              <!-- <option value="0">Easy (quick game)</option> -->
              <option value="1" selected>Normal</option>
              <!-- <option value="2">Hard (longest game)</option> -->
            </select>
          </div>

          <div>
            <Label for="endGoal" class="mt-2">Select a game mode</Label>
            {#if selectedGameMode === "land"}
              <p class="text-gray-500 text-sm">
                {winScenarios.land.description_title}
              </p>
            {:else}
              <p class="text-gray-500 text-sm">
                {winScenarios.free_play.description_title}
              </p>
            {/if}

            <select
              id="endGoal"
              class="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={selectedGameMode}
              on:change={setSelectedGameMode}
            >
              <option value="land">{winScenarios.land.short_title}</option>
              <option value="free_play"
                >{winScenarios.free_play.short_title}</option
              >
            </select>
          </div>

          <div>
            <Label for="townName" class="mt-2">Town Name</Label>
            <Input
              id="townName"
              class="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Will be randomized if you leave blank"
            />
          </div>
          <div>
            <input type="checkbox" id="devMode" class="mt-1" />
            <label for="devMode" class="mt-2">Dev mode</label>
          </div>
          <div>
            <input type="checkbox" id="tomPetty" class="mt-1" />
            <label for="tomPetty" class="mt-2">
              The 'Tom Petty' mode. If your happiness or health reaches 0, you
              lose 90% of your gold and continue the game. You won't back down.
            </label>
          </div>
          <div>
            <input type="checkbox" id="casual" class="mt-1" />
            <label for="casual" class="mt-2">
              Casual game. Faster and easier overall while exposing more of the
              game mechanics.
            </label>
          </div>
        </div>
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <!-- Footer -->
      <div class="flex flex-row justify-between w-full px-1">
        <span
          class="italic opacity-30 text-xs py-2 text-start rounded h-full flex flex-col justify-center mr-10"
          on:click={setUsername}>{$userDB.username}</span
        >
        <div>
          <Button on:click={deleteAllData}>Reset user</Button>
          <button
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
            on:click={captureAndStart}
          >
            Start game
          </button>
        </div>
      </div>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  label {
    /* no select */
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
</style>
