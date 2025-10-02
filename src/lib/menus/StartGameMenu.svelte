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
  import { FormInput } from "lucide-svelte";

  paused.set(false);
  const showDifficulty = false;

  function captureAndStart() {
    const townName = (document.getElementById("townName") as HTMLInputElement)
      .value;

    const checkboxes = ["devMode", "tomPetty", "casual", "bagOfHolding"];
    const settings = checkboxes.filter(
      (id) => (document.getElementById(id) as HTMLInputElement).checked,
    );

    const dif = "1";
    const eg = "free_play";

    startGame(dif, eg, townName, settings);
  }

  let selectedGameMode = "free_play";

  const setSelectedGameMode = (e: Event) => {
    selectedGameMode = (e.target as HTMLSelectElement).value;
  };

  function deleteAllData() {
    showCustomAlert("Deleted :)");
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

  function keyPressed(e: KeyboardEvent) {
    if (e.key === "Enter") {
      captureAndStart();
    }
  }
</script>

<Dialog.Root
  bind:open={$startGameMenu.visible}
  onOutsideClick={(e) => e.preventDefault()}
>
  <Dialog.Content
    transition={flyAndScale}
    class="bg-sidebarBackground text-sidebarText max-w-xl rounded-md shadow-xl border border-accent"
  >
    <Dialog.Title class="text-3xl font-semibold ">Welcome to Plots</Dialog.Title
    >

    <div>
      <div class="pb-8 flex flex-col gap-2">
        <Label for="townName" class="text-md font-bold">Your town name</Label>
        <Input
          id="townName"
          autofocus
          class="w-full p-2 ml-2 rounded-md border border-accent/20 bg-sidebarBackground text-sidebarText focus:ring-2 focus:ring-accent/50"
          placeholder="Will be randomized if left blank"
          on:keydown={(e) => {
            keyPressed(e);
          }}
        />
      </div>

      <div class="pb-4">
        <Label class="text-md font-bold pb-1 flex flex-col gap-2"
          >Town settings</Label
        >
        <div class="hidden">
          <input type="checkbox" id="devMode" />
        </div>
        <div class="flex flex-col gap-4 pl-2">
          <div class="flex items-start space-x-2">
            <input
              type="checkbox"
              id="casual"
              checked
              class="mt-1 rounded border-accent/20"
            />
            <label for="casual" class="text-sm">
              Casual game: Faster and easier overall while exposing more of the
              game mechanics. Recommended for most games.
            </label>
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
              id="bagOfHolding"
              class="mt-1 rounded border-accent/20"
            />
            <label for="bagOfHolding" class="text-sm">
              Bag of Holding: No resource cap or need to purchase stockpiles.
            </label>
          </div>
        </div>
      </div>

      <div class="flex flex-row justify-between">
        <div class="flex flex-grow align-middle items-center text-start">
          <a
            href="https://github.com/josephrcox/plots#how-to-play"
            class="text-accent hover:text-accent/80 text-sm italic opacity-65"
            target="_blank"
          >
            GitHub / Learn how to play</a
          >
        </div>
        <div class="flex flex-row align-middle items-center gap-2">
          <span
            class="text-xs text-sidebarText/50 hover:text-sidebarText cursor-pointer"
            on:click={setUsername}
          >
            {$userDB.username}
          </span>
          <div class="space-x-2">
            <Button
              class="bg-accent hover:bg-accent/80 text-white"
              on:click={captureAndStart}
            >
              Start game
            </Button>
          </div>
        </div>
      </div>
    </div></Dialog.Content
  >
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
