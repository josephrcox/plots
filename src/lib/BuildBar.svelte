<script lang="ts">
  // The build bar: category tabs and compact building buttons.
  // - Picking a building selects it as a tool; click tiles on the map to place
  //   it (it stays selected until Esc / right-click).
  // - If a tile was chosen first (clicking an empty tile, or Replace in the
  //   inspector), picking a building builds it there straight away.
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { DB, paused, isReadOnly } from "./store";
  import {
    tool,
    targetTile,
    inspected,
    buildCategory,
    availability,
    placementCheck,
    leftPanelOpen,
    rightPanelOpen,
    HUD,
  } from "./ui";
  import {
    categoriesWithOptions,
    optionsIn,
    categoryOf,
  } from "./objects/categories";
  import { getOptionIndex, placePlot, formatAmount, analyticsEvent } from "./utils";
  import { previewPlacement } from "./neighbours";
  import Signal from "./components/Signal.svelte";
  import PlotTooltip from "./PlotTooltip.svelte";
  import { Events, type PlotOption } from "./types";
  import { options } from "./objects/PlotTypeOptions";
  import { siteOf } from "./sites";

  const categories = categoriesWithOptions();

  $: if (!categories.some((c) => c.id === $buildCategory)) {
    $buildCategory = categories[0].id;
  }
  $: category = categories.find((c) => c.id === $buildCategory)!;
  $: categoryOptions = optionsIn(category);

  $: target = $targetTile;
  $: targetPlot = $DB && target ? $DB.plots[target.x]?.[target.y] : null;
  $: replacing = targetPlot?.active ? options[targetPlot.type] : null;

  // A mineral deposit only takes a Mine, and a special site only a few
  // buildings: jump to the tab with the first one that fits.
  $: if (targetPlot && !targetPlot.active && siteOf(targetPlot)) {
    const first = options.find((o) => o.id === siteOf(targetPlot)!.allows[0]);
    if (first) $buildCategory = categoryOf(first).id;
  }

  $: status = (() => {
    if ($tool.kind === "build") {
      const o = options[getOptionIndex($tool.id)];
      return `Placing ${o?.emoji} ${o?.title}: click highlighted tiles · Esc to stop`;
    }
    if ($tool.kind === "bulldoze") {
      return "Bulldozing: click a building · Esc to stop";
    }
    if (replacing) return `Replace ${replacing.emoji} ${replacing.title} with…`;
    if (target) return "Pick a building for the selected tile · Esc to cancel";
    return "Pick a building, then click the map to place it";
  })();

  function checkFor(option: PlotOption) {
    if (!$DB) return { ok: false, reason: "" };
    if (target) {
      return placementCheck(option, target.x, target.y, $DB, true);
    }
    return availability(option, $DB);
  }

  // Recomputed whenever the town, tab or target changes.
  $: checks =
    $DB &&
    target !== undefined &&
    Object.fromEntries(categoryOptions.map((o) => [o.id, checkFor(o)]));

  // Which tabs have something buildable right now (a dot on the tab).
  $: tabHasAvailable =
    $DB &&
    Object.fromEntries(
      categories.map((c) => [
        c.id,
        optionsIn(c).some((o) => availability(o, $DB!).ok),
      ]),
    );

  function pick(option: PlotOption) {
    if (!$DB || isReadOnly || $paused || $DB.endGameDetails.msg !== "") return;
    const check = checkFor(option);
    if (target) {
      if (!check.ok) return;
      const z = $DB;
      const wasReplacing = !!replacing;
      if (placePlot(z, target.x, target.y, option.id)) {
        analyticsEvent(z, Events.BUILD_PLOT, {
          plot_type: option.id,
          x: target.x.toString(),
          y: target.y.toString(),
          end_goal: z.endGoal,
          day: z.environment.day,
          settings: z.gameSettings.join(","),
        });
        DB.set(z);
        if (wasReplacing) inspected.set(target);
        targetTile.set(null);
      }
      return;
    }
    if (!check.ok) return;
    const selected = $tool.kind === "build" && $tool.id === option.id;
    tool.set(selected ? { kind: "none" } : { kind: "build", id: option.id });
    inspected.set(null);
  }

  function toggleBulldoze() {
    targetTile.set(null);
    tool.set($tool.kind === "bulldoze" ? { kind: "none" } : { kind: "bulldoze" });
  }

  function costLine(option: PlotOption) {
    // Gold plus the two biggest other costs; the tooltip has the full list.
    const r = option.requirements.resources;
    const others = (
      [
        ["🪵", r.wood],
        ["🪨", r.stone],
        ["🧲", r.metal],
        ["🧠", option.requirements.knowledge],
      ] as [string, number][]
    )
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
    return [["💰", option.requirements.gold] as [string, number], ...others]
      .map(([icon, n]) => `${icon}${formatAmount(n)}`)
      .join(" ");
  }

  function handleKeyDown(e: KeyboardEvent) {
    const active = document.activeElement?.nodeName;
    if (
      e.metaKey ||
      e.ctrlKey ||
      e.altKey ||
      active === "INPUT" ||
      active === "TEXTAREA" ||
      $paused ||
      document.querySelector("[role=dialog], [role=alertdialog]")
    ) {
      return;
    }
    const n = Number(e.key);
    const key = e.key.toLowerCase();
    const slot = BUILD_KEYS.indexOf(key);
    if (Number.isInteger(n) && n >= 1 && n <= categories.length) {
      // Number keys pick the tab.
      $buildCategory = categories[n - 1].id;
    } else if (slot >= 0) {
      // The QWERTY row picks a building in the open tab (Q = first).
      const option = categoryOptions[slot];
      if (option) pick(option);
    } else if (key === "b") {
      toggleBulldoze();
    }
  }

  /** Keys for the buildings in the open tab, in order. */
  const BUILD_KEYS = ["q", "w", "e", "r", "t", "y", "u", "i"];

</script>

<svelte:window on:keydown={handleKeyDown} />

{#if $DB && !isReadOnly}
  <div
    class="fixed bottom-0 z-20 flex justify-center pointer-events-none"
    style="left:{$leftPanelOpen ? HUD.panel : 0}px; right:{$rightPanelOpen
      ? HUD.panel
      : 0}px;"
  >
    <div
      class="pointer-events-auto bg-popupBackground text-white rounded-t-xl shadow-2xl px-3 pt-2 pb-3 min-w-0 shrink-0"
      style="width: min(980px, calc(100% - 24px));"
    >
      <!-- Tabs + status -->
      <div class="flex flex-row items-center gap-1 mb-2 overflow-x-auto no-scrollbar min-w-0">
        {#each categories as c, i}
          <button
            class="tab"
            class:active={c.id === $buildCategory}
            title="{c.label} ({i + 1})"
            on:click={() => ($buildCategory = c.id)}
          >
            <span>{c.emoji}</span>
            <span class="hidden 2xl:inline">{c.label}</span>
            <span class="key">{i + 1}</span>
            {#if tabHasAvailable && tabHasAvailable[c.id] && c.id !== $buildCategory}
              <span class="dot" />
            {/if}
          </button>
        {/each}
        <span class="flex-grow" />
        <span class="text-[11px] opacity-70 truncate px-2 hidden sm:inline"
          >{status}</span
        >
        <button
          class="tab"
          class:danger={$tool.kind === "bulldoze"}
          title="Bulldoze (B)"
          on:click={toggleBulldoze}
        >
          <span>🚜</span>
          <span class="hidden 2xl:inline">Bulldoze</span>
          <span class="key">B</span>
        </button>
      </div>

      <!-- Buildings -->
      <div
        class="flex flex-row gap-2 overflow-x-auto no-scrollbar min-w-0 overscroll-x-contain"
        on:wheel={(e) => {
          // Let a normal mouse wheel scroll this row sideways.
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.currentTarget.scrollLeft += e.deltaY;
            e.preventDefault();
          }
        }}
      >
        {#each categoryOptions as option, index (option.id)}
          {@const check = checks ? checks[option.id] : { ok: false, reason: "" }}
          {@const selected = $tool.kind === "build" && $tool.id === option.id}
          <Tooltip.Root openDelay={350} closeDelay={0}>
            <Tooltip.Trigger asChild let:builder>
              <button
                use:builder.action
                {...builder}
                class="building"
                class:selected
                class:unavailable={!check.ok}
                data-option-id={option.id}
                on:click={() => pick(option)}
              >
                {#if index < BUILD_KEYS.length}<span class="hotkey">{BUILD_KEYS[index].toUpperCase()}</span>{/if}
                <span class="text-2xl leading-none">{option.emoji}</span>
                <span class="name">{option.title}</span>
                {#if check.ok}
                  <span class="cost">{costLine(option)}</span>
                {:else}
                  <span class="reason">{check.reason}</span>
                {/if}
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content side="top" class="max-w-72">
              {#if target && check.ok && $DB}
                {#each previewPlacement(option.id, target.x, target.y, $DB) as line}
                  <div
                    class="text-xs px-2 py-1 rounded mb-1 {line.neutral
                      ? 'bg-sky-500/20 text-sky-200'
                      : line.good
                        ? 'bg-green-500/20 text-green-200'
                        : 'bg-red-500/20 text-red-200'}"
                  >
                    {line.text}{#if line.strength}<Signal
                        level={line.strength}
                        tone={line.neutral ? "neutral" : line.good ? "good" : "bad"}
                      />{/if}
                  </div>
                {/each}
              {/if}
              <PlotTooltip {option} />
            </Tooltip.Content>
          </Tooltip.Root>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 0.8rem;
    white-space: nowrap;
    opacity: 0.75;
  }
  .tab:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.08);
  }
  .tab.active {
    opacity: 1;
    background: rgba(255, 255, 255, 0.16);
  }
  .tab.danger {
    opacity: 1;
    background: rgb(185, 55, 60);
  }
  .key {
    font-family: monospace;
    font-size: 0.65rem;
    opacity: 0.6;
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-radius: 4px;
    padding: 0 4px;
  }
  .dot {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    background: rgb(255, 210, 90);
  }
  .hotkey {
    position: absolute;
    top: 4px;
    left: 6px;
    font-size: 0.6rem;
    font-family: monospace;
    opacity: 0.45;
  }
  .building {
    position: relative;
    flex: 0 0 auto;
    width: 112px;
    height: 88px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 4px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.07);
    border: 2px solid transparent;
    transition: transform 0.1s, background 0.1s;
  }
  .building:hover {
    background: rgba(255, 255, 255, 0.14);
  }
  .building.selected {
    border-color: rgb(255, 210, 90);
    background: rgba(255, 210, 90, 0.18);
  }
  .building.unavailable {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .building.unavailable:hover {
    transform: none;
  }
  .name {
    font-size: 0.72rem;
    line-height: 1.1;
    text-align: center;
  }
  .cost {
    font-family: monospace;
    font-size: 0.6rem;
    opacity: 0.8;
    line-height: 1.1;
    text-align: center;
  }
  .reason {
    font-size: 0.6rem;
    line-height: 1.1;
    color: rgb(255, 150, 150);
    text-align: center;
  }
</style>
