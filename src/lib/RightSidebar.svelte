<script lang="ts">
  // Right panel: how the town feels and why. Each stat shows its value, a
  // meter with "normal" (150) marked, the weekly trend, and its biggest cause;
  // click a stat for every cause and what the stat does. Then any pressing
  // needs, then the next milestone.
  import { fly, slide } from "svelte/transition";
  import { DB, showTutorialStepConfetti } from "./store";
  import { tutorialMessages } from "./objects/tutorial_messages";
  import Confetti from "svelte-confetti";
  import { rightPanelOpen, inspected, HUD } from "./ui";
  import {
    statDrivers,
    statEffect,
    townNeeds,
    type StatKey,
  } from "./statDrivers";
  import { formatAmount } from "./utils";

  const STATS: { key: StatKey; label: string; icon: string; about: string }[] = [
    {
      key: "happiness",
      label: "Happiness",
      icon: "😊",
      about: "Happy towns pay more tax and attract new people.",
    },
    {
      key: "health",
      label: "Health",
      icon: "❤️",
      about: "Below 50, sick people start leaving town.",
    },
    {
      key: "community",
      label: "Community",
      icon: "🤝",
      about: "A close community earns and produces more.",
    },
  ];

  let open: StatKey | null = null;
  let showAllGoals = false;

  // Weekly trend: compare with the value from about a week ago.
  let history: { day: number; values: Record<StatKey, number> }[] = [];
  $: if ($DB) {
    const day = $DB.environment.day;
    const last = history[history.length - 1];
    if (!last || last.day !== day) {
      history = [
        ...history.filter((h) => h.day > day - 30 && h.day <= day),
        {
          day,
          values: {
            happiness: $DB.townInfo.happiness,
            health: $DB.townInfo.health,
            community: $DB.townInfo.community,
          },
        },
      ];
    }
  }
  function trend(key: StatKey): number | null {
    if (!$DB) return null;
    const day = $DB.environment.day;
    const past = [...history].reverse().find((h) => h.day <= day - 7);
    if (!past) return null;
    return $DB.townInfo[key] - past.values[key];
  }

  $: drivers = $DB ? statDrivers($DB) : null;
  $: needs = $DB ? townNeeds($DB) : [];
  $: goalIndex = $DB?.currentTutorialStep ?? 0;
  $: goal = tutorialMessages[goalIndex];
  $: doneCount = Math.min(goalIndex, tutorialMessages.length);

  function color(v: number) {
    return v > 149 ? "rgb(74, 222, 128)" : v > 99 ? "rgb(250, 204, 21)" : "rgb(248, 113, 113)";
  }
</script>

{#if !$rightPanelOpen}
  <button
    class="fixed right-3 z-20 bg-popupBackground text-white rounded-lg shadow-lg px-3 py-2 text-sm"
    style="top:{HUD.top + 8}px;"
    title="Show town status"
    on:click={() => ($rightPanelOpen = true)}>‹ Status 📊</button
  >
{:else if $DB}
  <div
    class="panel fixed right-3 bottom-3 z-20 flex flex-col gap-3 overflow-y-auto no-scrollbar
    {$inspected ? 'invisible' : ''}"
    style="top:{HUD.top + 8}px; width:{HUD.panel - 16}px;"
    transition:fly={{ x: 40, duration: 150 }}
  >
    <div class="flex flex-row items-center justify-between">
      <span class="heading">Town status</span>
      <button
        class="opacity-50 hover:opacity-100 text-sm px-1"
        title="Hide panel"
        on:click={() => ($rightPanelOpen = false)}>›</button
      >
    </div>

    <!-- Mood -->
    <div class="flex flex-col gap-1">
      {#each STATS as stat}
        {@const value = $DB.townInfo[stat.key]}
        {@const max = $DB.maximums[stat.key]}
        {@const t = trend(stat.key)}
        {@const causes = drivers ? drivers[stat.key] : []}
        <button
          class="stat"
          class:open={open === stat.key}
          on:click={() => (open = open === stat.key ? null : stat.key)}
        >
          <div class="flex flex-row items-center gap-2 w-full">
            <span>{stat.icon}</span>
            <span class="text-sm flex-grow text-left">{stat.label}</span>
            {#if t != null && Math.abs(t) >= 1}
              <span
                class="text-[10px] font-mono"
                class:text-green-300={t > 0}
                class:text-red-300={t < 0}
                title="Change over the last week"
                >{t > 0 ? "▲" : "▼"}{Math.round(Math.abs(t))}</span
              >
            {/if}
            <span class="font-mono text-sm" style="color:{color(value)}"
              >{Math.round(value)}</span
            >
          </div>
          <div class="meter">
            <div
              class="fill"
              style="width:{Math.min(100, (value / max) * 100)}%; background:{color(
                value,
              )};"
            />
            <div
              class="tick"
              style="left:{(150 / max) * 100}%;"
              title="Normal (150)"
            />
          </div>
          {#if open !== stat.key}
            <span
              class="text-[11px] text-left w-full truncate"
              class:text-red-300={causes[0] && !causes[0].good}
              class:text-green-300={causes[0]?.good}
              class:opacity-60={!causes[0]}
              >{causes[0]?.text ?? "Steady"}</span
            >
          {/if}
        </button>
        {#if open === stat.key}
          <div class="details" transition:slide={{ duration: 120 }}>
            <span class="opacity-70">{stat.about}</span>
            {#if $DB}
              {@const effect = statEffect($DB, stat.key)}
              <span class={effect.good ? "text-green-300" : "text-red-300"}
                >Now: {effect.text}</span
              >
            {/if}
            {#each causes as c}
              <span class={c.good ? "text-green-300" : "text-red-300"}
                >{c.good ? "▲" : "▼"} {c.text}</span
              >
            {:else}
              <span class="opacity-60">Nothing is pushing it right now.</span>
            {/each}
            <span class="opacity-50"
              >Stats drift back toward 150 over time.</span
            >
          </div>
        {/if}
      {/each}
    </div>

    <!-- Needs -->
    {#if needs.length}
      <div class="flex flex-col gap-1">
        <span class="heading">Needs</span>
        {#each needs as need}
          <span
            class="need"
            class:bad={!need.good}
            class:good={need.good}>{need.text}</span
          >
        {/each}
      </div>
    {/if}

    <!-- Milestones -->
    <div class="flex flex-col gap-1 relative">
      {#if $showTutorialStepConfetti}
        <Confetti cone x={[-0.5, 0.5]} />
        <Confetti cone amount={30} x={[-1, -0.4]} y={[0.25, 0.75]} rounded size={8} />
        <Confetti cone amount={10} x={[0.4, 1]} y={[0.25, 0.75]} />
      {/if}
      <div class="flex flex-row items-baseline justify-between">
        <span class="heading">Next goal</span>
        <button
          class="text-[11px] opacity-60 hover:opacity-100"
          on:click={() => (showAllGoals = !showAllGoals)}
          >{doneCount}/{tutorialMessages.length} {showAllGoals ? "▴" : "▾"}</button
        >
      </div>
      {#if goal}
        <div class="goal">
          <span class="text-sm">{goal.message}</span>
          <span class="text-[11px] text-amber-300"
            >Reward 💰{formatAmount(goal.goldReward)}</span
          >
        </div>
      {:else}
        <span class="text-sm opacity-70">All milestones done 🎉</span>
      {/if}
      {#if showAllGoals}
        <div class="flex flex-col gap-1" transition:slide={{ duration: 120 }}>
          {#each tutorialMessages as step, i}
            <span
              class="text-[11px] leading-snug"
              class:opacity-50={i > goalIndex}
              class:text-green-300={i < goalIndex}
              >{i < goalIndex ? "✓" : i === goalIndex ? "→" : "·"}
              {step.message}</span
            >
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .panel {
    background: rgb(45, 51, 39);
    color: white;
    border-radius: 12px;
    padding: 10px 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
  }
  .heading {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.6;
  }
  .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    text-align: left;
  }
  .stat:hover,
  .stat.open {
    background: rgba(255, 255, 255, 0.1);
  }
  .meter {
    position: relative;
    width: 100%;
    height: 5px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.12);
  }
  .fill {
    height: 100%;
    border-radius: 9999px;
    transition: width 0.3s;
  }
  .tick {
    position: absolute;
    top: -2px;
    width: 2px;
    height: 9px;
    background: rgba(255, 255, 255, 0.7);
  }
  .details {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 11px;
    padding: 2px 8px 8px;
  }
  .need {
    font-size: 12px;
    padding: 5px 8px;
    border-radius: 8px;
  }
  .need.bad {
    background: rgba(248, 113, 113, 0.18);
    color: rgb(254, 202, 202);
  }
  .need.good {
    background: rgba(74, 222, 128, 0.12);
    color: rgb(187, 247, 208);
  }
  .goal {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
  }
</style>
