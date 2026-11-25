<script lang="ts">
  // Left panel: town policies (tax, productivity) with what they do right
  // now, the town's special actions, and the town log.
  import { fly } from "svelte/transition";
  import { roundTo, formatAmount } from "./utils";
  import { leftPanelOpen, HUD } from "./ui";
  import {
    DB,
    settingLiegeLocation,
    showCityHallMenu,
    showKnowledgeMenu,
    showLabMenu,
    hasPlotOfType,
    isReadOnly,
  } from "./store";
  import {
    productivityResourceMultiplier,
    productivityHappinessMultiplier,
  } from "./simulation";
  import Slider from "./components/ui/slider/slider.svelte";
  import { Vibe } from "./types";
  import { taxMood } from "./tax";

  $: hasLab = hasPlotOfType("lab", $DB!).length >= 1;
  $: hasCityHall = hasPlotOfType("city_hall", $DB!).length >= 1;
  // Recomputed whenever the game state or the slider changes.
  $: tax = taxMood($DB!);
  $: productivity = $DB!.townInfo.productivity;
  $: output = productivityResourceMultiplier(productivity);
  $: mood = productivityHappinessMultiplier(productivity);

  function setProductivity(v: number[]) {
    $DB!.townInfo.productivity = roundTo(v[0], 2);
  }
  function setTaxRate(v: number[]) {
    $DB!.economyAndLaws.tax_rate = roundTo(v[0], 2);
  }

  $: actions = [
    {
      icon: "👑",
      label: $settingLiegeLocation ? "Pick a building…" : "Visit a building",
      hint: "Boosts the building you stand on",
      enabled: true,
      active: $settingLiegeLocation,
      run: () => ($settingLiegeLocation = !$settingLiegeLocation),
    },
    {
      icon: "🧠",
      label: "Sell knowledge",
      hint: $DB!.hasBank ? "Trade knowledge for gold" : "Needs a Bank",
      enabled: true,
      active: false,
      run: () => ($showKnowledgeMenu = true),
    },
    {
      icon: "🏛️",
      label: "City Hall",
      hint: hasCityHall ? "Laws, guardians, expansion" : "Build a City Hall",
      enabled: true,
      active: false,
      run: () => ($showCityHallMenu = true),
    },
    {
      icon: "🧪",
      label:
        $DB!.lab.active_experiment !== null
          ? `${$DB!.lab.active_experiment.duration} days left`
          : "Lab",
      hint: hasLab ? "Run experiments" : "Build a Laboratory",
      enabled: hasLab,
      active: false,
      run: () => hasLab && ($showLabMenu = true),
    },
  ];
</script>

{#if !$leftPanelOpen}
  <button
    class="fixed left-3 z-20 bg-popupBackground text-white rounded-lg shadow-lg px-3 py-2 text-sm"
    style="top:{HUD.top + 8}px;"
    title="Show town panel"
    on:click={() => ($leftPanelOpen = true)}>🏛️ Town ›</button
  >
{:else if $DB}
  <div
    class="panel fixed left-3 bottom-3 z-20 flex flex-col gap-3 overflow-hidden"
    style="top:{HUD.top + 8}px; width:{HUD.panel - 16}px;"
    transition:fly={{ x: -40, duration: 150 }}
  >
    <div class="flex flex-row items-center justify-between">
      <span class="heading">Policies</span>
      <button
        class="opacity-50 hover:opacity-100 text-sm px-1"
        title="Hide panel"
        on:click={() => ($leftPanelOpen = false)}>‹</button
      >
    </div>

    <!-- Tax -->
    <div class="policy">
      <div class="flex flex-row justify-between text-sm">
        <span>💰 Tax rate</span>
        <span class="font-mono">{roundTo($DB.economyAndLaws.tax_rate * 100, 0)}%</span>
      </div>
      <Slider
        value={[$DB.economyAndLaws.tax_rate]}
        onValueChange={setTaxRate}
        min={0}
        max={0.5}
        step={0.05}
        disabled={isReadOnly}
        class="cursor-pointer"
      />
      <span
        class="text-[11px]"
        class:text-red-300={tax.level === "bad"}
        class:text-amber-200={tax.level === "high"}
        class:text-green-300={tax.level === "low"}
        class:opacity-70={tax.level === "ok"}
        title={tax.hint}
      >
        {tax.word}: {tax.hint.toLowerCase()}
      </span>
      <span class="text-[11px] opacity-70">💰{formatAmount($DB.economyAndLaws.weeklyProfit)}/wk income</span>
    </div>

    <!-- Productivity -->
    <div class="policy">
      <div class="flex flex-row justify-between text-sm">
        <span>⚒️ Productivity</span>
        <span class="font-mono">{Math.round(productivity)}%</span>
      </div>
      <Slider
        value={[productivity]}
        onValueChange={setProductivity}
        min={0}
        max={200}
        step={5}
        disabled={isReadOnly}
        class="cursor-pointer"
      />
      <span class="text-[11px] opacity-80">
        Output ×{output}
        {#if mood !== 1}
          · <span class={mood > 1 ? "text-green-300" : "text-red-300"}
            >mood {mood > 1 ? "+" : "−"}{Math.round(Math.abs(mood - 1) * 100)}%/month</span
          >
        {/if}
      </span>
    </div>

    <!-- Actions -->
    <div class="grid grid-cols-2 gap-1.5">
      {#each actions as a}
        <button
          class="action"
          class:active={a.active}
          class:disabled={!a.enabled}
          title={a.hint}
          on:click={a.run}
        >
          <span class="text-lg leading-none">{a.icon}</span>
          <span class="text-[11px] leading-tight">{a.label}</span>
          <span class="text-[9px] leading-tight opacity-60">{a.hint}</span>
        </button>
      {/each}
    </div>

    <!-- Town log -->
    <span class="heading">Town log</span>
    <div class="flex flex-col gap-1.5 overflow-y-auto no-scrollbar flex-1 min-h-0 -mt-1">
      {#each $DB.townLog as log (log.day + log.message)}
        <div
          class="log"
          class:bad={log.vibe == Vibe.BAD}
          class:good={log.vibe == Vibe.GOOD}
        >
          <span class="text-[9px] font-mono opacity-60">DAY {log.day}</span>
          <span class="text-[11px] leading-snug">{log.message}</span>
        </div>
      {:else}
        <span class="text-[11px] opacity-50">Nothing has happened yet.</span>
      {/each}
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
  .policy {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
  }
  .action {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 4px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.07);
    text-align: center;
  }
  .action:hover {
    background: rgba(255, 255, 255, 0.14);
  }
  .action.active {
    background: rgb(168, 115, 75);
  }
  .action.disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .log {
    display: flex;
    flex-direction: column;
    padding: 5px 8px;
    border-radius: 8px;
    border-left: 3px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.05);
  }
  .log.bad {
    border-left-color: rgb(248, 113, 113);
  }
  .log.good {
    border-left-color: rgb(74, 222, 128);
  }
</style>
