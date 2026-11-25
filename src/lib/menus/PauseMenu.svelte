<script lang="ts">
  // Pause: switch or manage towns, and see achievements.
  import {
    DB,
    paused,
    userDB,
    showAlert,
    isReadOnly,
    setSelectedGame,
    deleteGame,
    leaveToNewTown,
    loadGameFromFile,
  } from "../store";
  import { achievements } from "$lib/objects/AchievementList";
  import { PERKS } from "$lib/perks";
  import Modal from "$lib/components/Modal.svelte";
  import Btn from "$lib/components/Btn.svelte";
  import { createAMockTown, formatNumber } from "$lib/utils";
  // @ts-ignore
  import { compressMyGame } from "$lib/gameShare";
  import type { Game } from "$lib/types";

  let tab: "towns" | "achievements" = "towns";

  // ---- Towns ----
  $: games = $userDB.games.map((json) => {
    try {
      return JSON.parse(json) as Game;
    } catch {
      return null;
    }
  });

  function newTown() {
    $paused = false;
    leaveToNewTown();
  }

  function saveGame() {
    const blob = new Blob([JSON.stringify($DB)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${$DB?.townInfo.name ?? "town"} ${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadGame() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      file.text().then((text) => {
        try {
          if (!loadGameFromFile(JSON.parse(text))) showAlert("That isn't a Plots town file.");
        } catch {
          showAlert("Couldn't read that file.");
        }
      });
    };
    input.click();
  }

  async function share() {
    const url = compressMyGame();
    try {
      await navigator.clipboard.writeText(url);
      showAlert("Share link copied to clipboard!");
    } catch {
      showAlert(`Copy this link to share your town:<br/><br/>${url}`);
    }
  }

  function deleteTown() {
    const name = $DB?.townInfo.name ?? "this town";
    if (!confirm(`Delete ${name}? This can't be undone.`)) return;
    deleteGame($userDB.selectedGame);
  }

  // ---- Achievements (earned once per account; many unlock perks) ----
  type Entry = [string, number, string, boolean?]; // id, day, town
  $: earned = new Map<string, Entry>(($userDB.achievements as Entry[]).map((a) => [a[0], a]));
  $: doneCount = achievements.filter((a) => earned.has(a.id)).length;
  $: list = [...achievements].sort((x, y) => Number(earned.has(y.id)) - Number(earned.has(x.id)));
  const perkOf = (id?: string) => PERKS.find((p) => p.id === id);
</script>

<Modal open={$paused} title="Paused" size="lg" onClose={() => ($paused = false)}>
  <div class="tabs" slot="header">
    <button class:on={tab === "towns"} on:click={() => (tab = "towns")}>🏘️ Towns</button>
    {#if !isReadOnly}
      <button class:on={tab === "achievements"} on:click={() => (tab = "achievements")}
        >🏆 Achievements <span class="opacity-60">{doneCount}/{achievements.length}</span></button
      >
    {/if}
  </div>

  {#if tab === "towns"}
    <div class="flex flex-col gap-1.5">
      {#each games as game, index}
        {#if game}
          <button
            class="town"
            class:current={index === $userDB.selectedGame}
            disabled={index === $userDB.selectedGame}
            on:click={() => setSelectedGame(index)}
          >
            <span class="font-semibold">🏠 {game.townInfo.name}</span>
            <span class="text-xs opacity-65"
              >Year {Math.floor(game.environment.day / 360) + 1} · 👥 {formatNumber(
                game.townInfo.population_count,
                false,
              )} · 💰{formatNumber(game.townInfo.gold, false)}</span
            >
            {#if index === $userDB.selectedGame}<span class="tag">Playing</span>{/if}
          </button>
        {/if}
      {/each}
    </div>
  {:else}
    <span class="opacity-70">Earned once across all your towns. Many unlock a perk to bring to new towns.</span>
    <div class="grid grid-cols-2 gap-1.5">
      {#each list as a (a.id)}
        {@const e = earned.get(a.id)}
        {@const perk = perkOf(a.unlocks)}
        <div class="ach" class:todo={!e}>
          <span class="text-2xl">{e || !a.secret ? a.icon : "❔"}</span>
          <div class="flex-1 flex flex-col gap-0.5">
            <span class="font-semibold">{e || !a.secret ? a.title : "Secret"}</span>
            <span class="text-xs opacity-75">{e || !a.secret ? a.description : "Keep playing to find out."}</span>
            {#if perk}
              <span class="text-[11px] {e ? 'text-yellow-200' : 'opacity-60'}">Unlocks {perk.icon} {perk.title}</span>
            {/if}
            {#if e}
              <span class="text-[11px] text-green-300">✓ Day {e[1]} in {e[2]}</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <svelte:fragment slot="footer">
    {#if tab === "towns"}
      {#if $DB?.gameSettings.includes("devMode")}
        <Btn on:click={createAMockTown}>🔄 Mock town</Btn>
      {/if}
      <Btn on:click={saveGame}>💾 Save file</Btn>
      <Btn on:click={loadGame}>📤 Load file</Btn>
      <Btn on:click={share}>📲 Share</Btn>
      <Btn variant="danger" on:click={deleteTown}>Delete town</Btn>
      <Btn variant="primary" on:click={newTown}>+ New town</Btn>
    {:else}
      <Btn variant="primary" on:click={() => ($paused = false)}>Resume</Btn>
    {/if}
  </svelte:fragment>
</Modal>

<style>
  .tabs {
    display: flex;
    gap: 4px;
    margin-top: 8px;
  }
  .tabs button {
    font-size: 0.8rem;
    padding: 5px 12px;
    border-radius: 8px;
    opacity: 0.65;
  }
  .tabs button:focus:not(:focus-visible) {
    outline: none;
  }
  .tabs button.on {
    background: rgba(255, 255, 255, 0.1);
    opacity: 1;
  }
  .town {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    text-align: left;
    padding: 8px 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
  }
  .town:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }
  .town.current {
    background: rgba(168, 115, 75, 0.25);
    cursor: default;
  }
  .tag {
    position: absolute;
    right: 10px;
    top: 10px;
    font-size: 0.65rem;
    padding: 1px 6px;
    border-radius: 6px;
    background: rgba(168, 115, 75, 0.8);
  }
  .ach {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
  }
  .ach.todo {
    opacity: 0.55;
  }
</style>
