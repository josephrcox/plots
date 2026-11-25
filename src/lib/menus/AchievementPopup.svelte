<script lang="ts">
  // A small toast when an achievement is earned (doesn't stop the game).
  import { userDB, showAchievementPopup } from "../store";
  import { achievements } from "$lib/objects/AchievementList";
  import { PERKS } from "$lib/perks";
  import { fly } from "svelte/transition";

  $: latest = (() => {
    const list = $userDB.achievements;
    const last = list[list.length - 1];
    return last ? achievements.find((a) => a.id === last[0]) : undefined;
  })();
  $: perk = PERKS.find((p) => p.id === latest?.unlocks);

  let timer: ReturnType<typeof setTimeout> | undefined;
  $: if ($showAchievementPopup) {
    clearTimeout(timer);
    timer = setTimeout(() => showAchievementPopup.set(false), 7000);
  }
</script>

{#if $showAchievementPopup && latest}
  <button
    class="toast"
    transition:fly={{ y: -16, duration: 180 }}
    on:click={() => showAchievementPopup.set(false)}
    title="Dismiss"
  >
    <span class="text-3xl">{latest.icon}</span>
    <span class="flex flex-col text-left">
      <span class="text-[10px] uppercase tracking-wider opacity-60">Achievement</span>
      <span class="font-semibold">{latest.title}</span>
      {#if perk}<span class="text-xs text-yellow-200">Unlocked for new towns: {perk.icon} {perk.title}</span>{/if}
    </span>
  </button>
{/if}

<style>
  .toast {
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-radius: 14px;
    background: rgb(45, 51, 39);
    color: white;
    border: 1px solid rgba(250, 204, 21, 0.5);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  }
</style>
