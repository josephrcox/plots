<script lang="ts">
  // Small card next to the cursor while a build or bulldoze tool is active:
  // what it costs, whether it fits here, and what it would do to neighbours.
  import { options } from "./objects/PlotTypeOptions";
  import type { Plot, PlotOption } from "./types";
  import type { Check } from "./ui";
  import type { EffectLine } from "./neighbours";
  import { formatAmount } from "./utils";
  import { DB, workerBalance } from "./store";

  export let x: number;
  export let y: number;
  export let option: PlotOption | undefined;
  export let check: Check | null;
  export let preview: EffectLine[] = [];
  export let bulldozeTarget: Plot | null = null;

  $: costs = option
    ? [
        ["💰", option.requirements.gold],
        ["🪵", option.requirements.resources.wood],
        ["🪨", option.requirements.resources.stone],
        ["🧲", option.requirements.resources.metal],
        ["🥕", option.requirements.resources.food],
        ["🧠", option.requirements.knowledge],
      ].filter(([, n]) => Number(n) > 0)
    : [];

  // A new building is staffed last, from whoever is free.
  $: needed = option?.requirements.employees ?? 0;
  $: free = $DB ? Math.max(0, workerBalance($DB)) : 0;
  $: staffedPct = needed > 0 ? Math.round((Math.min(free, needed) / needed) * 100) : 100;

  // Keep the card on screen.
  $: left = Math.min(x + 18, window.innerWidth - 240);
  $: top = Math.min(y + 18, window.innerHeight - 160);
</script>

<div
  class="fixed z-30 pointer-events-none w-56 rounded-lg bg-popupBackground text-white text-xs p-2 shadow-xl flex flex-col gap-1"
  style="left:{left}px; top:{top}px;"
>
  {#if bulldozeTarget}
    <span class="font-semibold text-red-300"
      >🚜 Bulldoze {options[bulldozeTarget.type]?.title}</span
    >
  {:else if option && check}
    <span class="font-semibold">{option.emoji} {option.title}</span>
    <span class="font-mono opacity-80">
      {#each costs as [icon, n]}<span class="mr-2">{icon}{formatAmount(Number(n))}</span>{/each}
    </span>
    {#if needed > 0 && option.type === "retirement"}
      <span class="opacity-80">🧓 Room for {needed} retirees</span>
    {:else if needed > 0}
      {#if free >= needed}
        <span class="opacity-80">👷 {needed} workers ({free} free)</span>
      {:else}
        <span class="text-amber-300"
          >👷 Only {free} of {needed} workers free: runs at {staffedPct}%</span
        >
      {/if}
    {/if}
    {#if !check.ok}
      <span class="text-red-300">{check.reason || "Can't build here"}</span>
    {:else}
      {#each preview as line}
        <span
          class={line.neutral
            ? "text-sky-300"
            : line.good
              ? "text-green-300"
              : "text-red-300"}>{line.text}</span
        >
      {/each}
      <span class="opacity-60">Click to build · Esc to stop</span>
    {/if}
  {/if}
</div>
