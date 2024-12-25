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
  import { analyticsEvent, flyAndScale } from "$lib/utils";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Difficulty, EndGoal, Events, WinScenario } from "$lib/types";
  // @ts-ignore
  import { winScenarios } from "../objects/WinScenarios";

  paused.set(false);
  const showDifficulty = false;

  function captureAndStart() {
    const difficulty = showDifficulty
      ? (document.getElementById("difficulty") as HTMLSelectElement).value
      : "1";
    const endGoal = (document.getElementById("endGoal") as HTMLSelectElement)
      .value;
    const townName = (document.getElementById("townName") as HTMLInputElement)
      .value;

    const checkboxes = ["devMode", "tomPetty", "casual", "bagOfHolding"];
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
    if (newName) {
      let z = $userDB;
      z.username = newName;
      setUserDB(z);
    }
  }
</script>

<Dialog.Root bind:open={$startGameMenu.visible}>
  <Dialog.Content
    transition={flyAndScale}
    class="bg-sidebarBackground text-sidebarText max-w-xl rounded-md shadow-xl border border-accent"
  >
    <Dialog.Header class="p-4 border-b border-accent/20">
      <Dialog.Title class="text-2xl font-semibold"
        >Welcome to Plots!</Dialog.Title
      >
      <Dialog.Description>
        <a
          href="https://github.com/josephrcox/plots#how-to-play"
          class="text-accent hover:text-accent/80 text-sm mb-4 hover:underline inline-block"
          target="_blank"
        >
          GitHub / Learn how to play</a
        >
      </Dialog.Description>
    </Dialog.Header>

    <div class="p-4 space-y-4">
      {#if showDifficulty}
        <div class="space-y-2">
          <Label for="difficulty" class="text-sm font-medium">Map Size</Label>
          <select
            id="difficulty"
            class="w-full p-2 rounded-md border border-accent/20 bg-sidebarBackground text-sidebarText focus:ring-2 focus:ring-accent/50"
          >
            <option value="1" selected>Normal</option>
          </select>
        </div>
      {/if}

      <div class="space-y-2">
        <Label for="endGoal" class="text-sm font-medium">Game Mode</Label>
        <select
          id="endGoal"
          class="w-full p-2 rounded-md border border-accent/20 bg-sidebarBackground text-sidebarText focus:ring-2 focus:ring-accent/50"
          value={selectedGameMode}
          on:change={setSelectedGameMode}
        >
          <option value="land">{winScenarios.land.short_title}</option>
          <option value="free_play">{winScenarios.free_play.short_title}</option
          >
        </select>
        <p class="text-sm text-sidebarText/80 mt-1">
          {selectedGameMode === "land"
            ? winScenarios.land.description_title
            : winScenarios.free_play.description_title}
        </p>
      </div>

      <div class="space-y-2">
        <Label for="townName" class="text-sm font-medium">Town Name</Label>
        <Input
          id="townName"
          class="w-full p-2 rounded-md border border-accent/20 bg-sidebarBackground text-sidebarText focus:ring-2 focus:ring-accent/50"
          placeholder="Will be randomized if left blank"
        />
      </div>

      <div class="space-y-4">
        <Label class="text-sm font-medium">Game Settings</Label>
        <div class="hidden">
          <input type="checkbox" id="devMode" />
        </div>
        <div class="flex items-start space-x-2">
          <input
            type="checkbox"
            id="tomPetty"
            class="mt-1 rounded border-accent/20"
          />
          <label for="tomPetty" class="text-sm">
            The 'Tom Petty' mode: If your happiness or health reaches 0, you
            lose 50% of your gold and continue the game. You won't back down.
          </label>
        </div>
        <div class="flex items-start space-x-2">
          <input
            type="checkbox"
            id="casual"
            checked
            class="mt-1 rounded border-accent/20"
          />
          <label for="casual" class="text-sm">
            Casual game: Faster and easier overall while exposing more of the
            game mechanics.
          </label>
        </div>
        <div class="flex items-start space-x-2">
          <input
            type="checkbox"
            id="bagOfHolding"
            class="mt-1 rounded border-accent/20"
          />
          <label for="bagOfHolding" class="text-sm">
            Bag of Holding: No resource cap or need to purchase stockpiles.
          </label>
        </div>
      </div>
    </div>

    <Dialog.Footer
      class="p-4 border-t border-accent/20 flex justify-between items-center"
    >
      <span
        class="text-xs text-sidebarText/50 hover:text-sidebarText cursor-pointer"
        on:click={setUsername}
      >
        {$userDB.username}
      </span>
      <div class="space-x-2">
        <Button
          variant="outline"
          class="border-accent/20 hover:bg-accent/10"
          on:click={deleteAllData}
        >
          Reset user
        </Button>
        <Button
          class="bg-accent hover:bg-accent/80 text-white"
          on:click={captureAndStart}
        >
          Start game
        </Button>
      </div>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  :global(.dialog-overlay) {
    background-color: rgba(0, 0, 0, 0.5);
  }

  input[type="checkbox"] {
    accent-color: rgb(168, 115, 75);
  }

  :global(.text-sm) {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
</style>
