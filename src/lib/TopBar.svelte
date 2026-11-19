<script lang="ts">
  // Top bar: town, population, resources, date, speed and pause.
  import { onMount } from "svelte";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import {
    DB,
    speed,
    paused,
    isReadOnly,
    hasPlotOfType,
    showCustomAlert,
    countJobs,
    staffing,
  } from "./store";
  import { options } from "./objects/PlotTypeOptions";
  import { CustomAlerts } from "./objects/CustomAlerts";
  import { formatNumber, formatAmount, capitalizeFirstLetter } from "./utils";
  import { HUD } from "./ui";

  // Milliseconds per game day for x1 / x2 / x3.
  const speeds = $DB!.gameSettings.includes("casual")
    ? [375, 75, 35]
    : [550, 150, 70];
  let speedIndex = 0;
  $speed = speeds[0];

  onMount(() => {
    const interval = setInterval(() => {
      if (!$paused && $DB) $DB.timeSpent += 1000;
    }, 1000);
    return () => clearInterval(interval);
  });

  function changeName() {
    if (isReadOnly) return;
    const newName = prompt("Enter a new name for your town (under 200 chars)");
    if (newName && newName.trim().length >= 1 && newName.length < 200) {
      $DB!.townInfo.name = newName.trim();
    }
  }

  function nextSpeed() {
    if (isReadOnly) return;
    speedIndex = (speedIndex + 1) % speeds.length;
    $speed = speeds[speedIndex];
  }

  type Row = {
    icon: string;
    name: string;
    value: number;
    rate: number | null;
    capped: boolean;
  };

  $: bag = $DB.gameSettings.includes("bagOfHolding");
  $: cap = $DB.resource_capacity;
  $: rows = [
    { icon: "🥕", name: "food", value: $DB.resources.food, rate: $DB.resource_rate.food, capped: true },
    { icon: "🪵", name: "wood", value: $DB.resources.wood, rate: $DB.resource_rate.wood, capped: true },
    { icon: "🪨", name: "stone", value: $DB.resources.stone, rate: $DB.resource_rate.stone, capped: true },
    { icon: "🧲", name: "metal", value: $DB.resources.metal, rate: $DB.resource_rate.metal, capped: true },
    { icon: "🧠", name: "knowledge", value: $DB.townInfo.knowledge_points, rate: $DB.resource_rate.knowledge, capped: false },
    { icon: "🔋", name: "power", value: $DB.resources.power, rate: null, capped: false },
    // Bureaucracy only matters once there's a City Hall.
    ...(hasPlotOfType("city_hall", $DB).length > 0
      ? [{ icon: "🧑‍⚖️", name: "bureaucracy", value: $DB.resources.bureaucracy, rate: $DB.resource_rate.bureaucracy, capped: true }]
      : []),
  ] as Row[];

  function atCap(row: Row) {
    return row.capped && !bag && row.value >= cap;
  }

  /** Titles of the buildings that need this resource. */
  function neededBy(name: string): string[] {
    return options
      .filter((o) => {
        if (name === "knowledge") return o.requirements.knowledge > 0;
        if (name === "power") return o.active_costs.power > 0;
        const key = name as keyof typeof o.requirements.resources;
        return (o.requirements.resources[key] ?? 0) > 0;
      })
      .map((o) => o.title);
  }

  // Play a sound and show a tip the first time storage fills up.
  let wasAtCap = false;
  let lastAlert = 0;
  $: {
    const full = !bag && rows.some((r) => r.capped && r.value >= cap);
    if (full && !wasAtCap && Date.now() - lastAlert > 30000 && !isReadOnly) {
      lastAlert = Date.now();
      const audio = new Audio("/alert.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
      showCustomAlert(CustomAlerts.CAPACITY);
    }
    wasAtCap = full;
  }

  // Workers: people minus jobs. Negative means some jobs are unfilled.
  $: jobs = countJobs($DB);
  $: workers = $DB.townInfo.population_count - jobs;
  $: understaffed = [...staffing($DB).values()].filter(
    (s) => s.staffed < s.needed,
  ).length;

  function rateText(rate: number | null) {
    if (rate == null) return "–";
    if (Math.abs(rate) < 0.05) return "±0";
    return rate > 0 ? `▲ ${formatAmount(rate)}` : `▼ ${formatAmount(-rate)}`;
  }
</script>

<div
  class="fixed top-0 left-0 right-0 z-30 bg-black text-white flex flex-row items-center gap-3 px-3 shadow-lg"
  style="height:{HUD.top}px;"
>
  <!-- Town -->
  <div class="flex flex-col leading-tight min-w-0 shrink">
    <button
      class="font-serif text-md truncate text-left opacity-90 hover:opacity-100"
      title="Rename town"
      on:click={changeName}>{$DB.townInfo.name}</button
    >
    <span class="text-[11px] opacity-70"
      >👥 {formatNumber($DB.townInfo.population_count, false)} / {formatNumber(
        $DB.townInfo.population_max,
        false,
      )}</span
    >
  </div>

  <!-- Resources -->
  <div class="flex flex-row items-center gap-1 overflow-x-auto no-scrollbar flex-grow justify-center">
    <Tooltip.Root openDelay={250} closeDelay={0}>
      <Tooltip.Trigger asChild let:builder>
        <div use:builder.action {...builder} class="res">
          <span class="top"><span>💰</span><span class="val">{formatAmount($DB.townInfo.gold)}</span></span>
          <span class="rate" class:up={$DB.economyAndLaws.weeklyProfit >= 0.05} class:down={$DB.economyAndLaws.weeklyProfit <= -0.05}
            >{rateText($DB.economyAndLaws.weeklyProfit)}</span
          >
        </div>
      </Tooltip.Trigger>
      <Tooltip.Content class="text-xs max-w-60">
        💰 Gold ({rateText($DB.economyAndLaws.weeklyProfit)} per week). Income depends on tax rate, happiness and how full your homes are.
      </Tooltip.Content>
    </Tooltip.Root>

    <Tooltip.Root openDelay={250} closeDelay={0}>
      <Tooltip.Trigger asChild let:builder>
        <div use:builder.action {...builder} class="res" class:full={workers < 0}>
          <span class="top"><span>👷</span><span class="val">{Math.abs(workers)}</span></span>
          <span class="rate" class:up={workers > 0} class:down={workers < 0}
            >{workers < 0 ? "short" : workers > 0 ? "free" : "all busy"}</span
          >
        </div>
      </Tooltip.Trigger>
      <Tooltip.Content class="text-xs max-w-64">
        <div class="font-semibold mb-1">👷 Workers</div>
        <div>
          {$DB.townInfo.population_count} people, {jobs} jobs{$DB.townInfo
            .guardians > 0
            ? ` (incl. ${$DB.townInfo.guardians} guardians)`
            : ""}.
        </div>
        {#if workers < 0}
          <div class="mt-1">
            {-workers} jobs are unfilled, so {understaffed} building{understaffed ===
            1
              ? " is"
              : "s are"} running below full output. The newest buildings are
            short first. Build homes to bring in more people.
          </div>
        {:else}
          <div class="mt-1">
            Every building is fully staffed. New buildings take workers from
            the {workers} free.
          </div>
        {/if}
      </Tooltip.Content>
    </Tooltip.Root>

    {#each rows as row (row.name)}
      <Tooltip.Root openDelay={250} closeDelay={0}>
        <Tooltip.Trigger asChild let:builder>
          <div
            use:builder.action
            {...builder}
            class="res"
            class:empty={row.value <= 0}
            class:full={atCap(row)}
          >
            <span class="top"><span>{row.icon}</span><span class="val">{formatAmount(row.value)}</span></span>
            {#if atCap(row)}
              <span class="rate down">FULL</span>
            {:else}
              <span
                class="rate"
                class:up={row.rate != null && row.rate >= 0.05}
                class:down={row.rate != null && row.rate <= -0.05}
                >{rateText(row.rate)}</span
              >
            {/if}
          </div>
        </Tooltip.Trigger>
        <Tooltip.Content class="text-xs max-w-64">
          <div class="font-semibold mb-1">
            {row.icon} {capitalizeFirstLetter(row.name)}
            {#if row.rate != null}<span class="font-normal opacity-70"> ({rateText(row.rate)} per week)</span>{/if}
          </div>
          {#if neededBy(row.name).length}
            <div class="opacity-80">Needed for: {neededBy(row.name).join(", ")}</div>
          {/if}
        </Tooltip.Content>
      </Tooltip.Root>
    {/each}

    <Tooltip.Root openDelay={250} closeDelay={0}>
      <Tooltip.Trigger asChild let:builder>
        <div use:builder.action {...builder} class="res opacity-70">
          <span class="top"><span>📦</span><span class="val">{bag ? "∞" : formatNumber(cap, false)}</span></span>
          <span class="rate">storage</span>
        </div>
      </Tooltip.Trigger>
      <Tooltip.Content class="text-xs max-w-64">
        {#if bag}
          No storage limit in this game mode (Bag of Holding).
        {:else}
          Storage: you can hold up to {formatNumber(cap, false)} of each
          resource. Stockpiles add more. Resources over the limit are lost.
        {/if}
      </Tooltip.Content>
    </Tooltip.Root>
  </div>

  <!-- Time -->
  <div class="flex flex-row items-center gap-2 shrink-0">
    <span class="text-[11px] opacity-80 text-right leading-tight">
      Year {Math.floor($DB.environment.day / 365) + 1}<br />Week {(Math.floor(
        $DB.environment.day / 7,
      ) %
        52) +
        1}
    </span>
    <button
      class="ctl"
      class:text-blue-200={speedIndex == 0}
      class:text-yellow-200={speedIndex == 1}
      class:text-red-200={speedIndex == 2}
      title="Game speed"
      on:click={nextSpeed}>⏩ x{speedIndex + 1}</button
    >
    <button class="ctl" title="Pause (P)" on:click={() => ($paused = true)}
      >⏸</button
    >
  </div>
</div>

<style>
  .res {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 58px;
    padding: 2px 8px;
    line-height: 1.15;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.07);
    font-size: 0.8rem;
    white-space: nowrap;
    cursor: default;
  }
  .res.empty .val {
    color: rgb(255, 140, 140);
  }
  .res.full {
    background: rgba(230, 90, 100, 0.35);
  }
  .top {
    display: flex;
    gap: 4px;
    align-items: baseline;
  }
  .val {
    font-family: monospace;
  }
  .rate {
    font-size: 0.65rem;
    opacity: 0.7;
  }
  .rate.up {
    color: rgb(120, 230, 160);
    opacity: 1;
  }
  .rate.down {
    color: rgb(255, 140, 140);
    opacity: 1;
  }
  .ctl {
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.12);
    font-size: 0.8rem;
  }
  .ctl:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
