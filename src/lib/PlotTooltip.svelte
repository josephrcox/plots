<script lang="ts">
  // A building's card: what it costs, what it needs, what it makes and what
  // it uses each week. Shown in build bar tooltips and the inspector, both
  // on the dark HUD background.
  import { DB, hasPlotOfType } from "./store";
  import { formatAmount, getOptionFromId } from "./utils";
  import type { PlotOption } from "./types";

  export let option: PlotOption;
  /** Mark costs the town can't pay yet (off in the inspector). */
  export let checkRequirements = true;
  export let showTitle = true;

  type Chip = { icon: string; text: string; short?: boolean };

  const ICONS: Record<string, string> = {
    gold: "💰",
    food: "🥕",
    wood: "🪵",
    stone: "🪨",
    metal: "🧲",
    power: "🔋",
    bureaucracy: "🧑‍⚖️",
    knowledge: "🧠",
  };

  function have(key: string): number {
    if (key === "gold") return $DB.townInfo.gold;
    if (key === "knowledge") return $DB.townInfo.knowledge_points;
    return $DB.resources[key as keyof typeof $DB.resources] ?? 0;
  }

  $: req = option.requirements;
  $: cost = [
    ["gold", req.gold],
    ["knowledge", req.knowledge],
    ...Object.entries(req.resources),
  ]
    .filter(([, n]) => Number(n) > 0)
    .map(([key, n]) => ({
      icon: ICONS[key as string],
      text: formatAmount(Number(n)),
      short: checkRequirements && have(key as string) < Number(n),
    })) as Chip[];

  $: makes = [
    ...(option.revenue_per_week > 0
      ? [{ icon: "💰", text: `+${formatAmount(option.revenue_per_week)}/wk` }]
      : []),
    ...Object.entries(option.generated_resources)
      .filter(([, n]) => n > 0)
      .map(([key, n]) => ({
        icon: ICONS[key],
        text: key === "power" ? `+${formatAmount(n)}` : `+${formatAmount(n)}/wk`,
      })),
    ...(option.knowledge_points_per_month > 0
      ? [{ icon: "🧠", text: `+${formatAmount(option.knowledge_points_per_month)}/mo` }]
      : []),
  ] as Chip[];

  $: uses = Object.entries(option.active_costs)
    .filter(([, n]) => n > 0)
    .map(([key, n]) => ({
      icon: ICONS[key],
      text: key === "power" ? formatAmount(n) : `${formatAmount(n)}/wk`,
    })) as Chip[];

  $: needs = [
    ...req.plots.map((id) => ({
      text: getOptionFromId(id)?.title ?? id,
      short: checkRequirements && hasPlotOfType(id, $DB).length === 0,
    })),
    ...req.adjacent_plots.map((id) => ({
      text: `Next to ${id === "water" ? "water" : (getOptionFromId(id)?.title ?? id)}`,
      short: false,
    })),
  ];

  $: rows = [
    { label: "Cost", chips: cost },
    { label: "Makes", chips: makes },
    { label: "Uses", chips: uses },
  ].filter((r) => r.chips.length);
</script>

<div class="flex flex-col gap-2 max-w-64 text-white">
  {#if showTitle}
    <span class="text-sm font-semibold">{option.emoji} {option.title}</span>
  {/if}
  {#if option.description}
    <span class="text-xs opacity-75 leading-snug">{option.description}</span>
  {/if}

  <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-baseline text-xs">
    {#each rows as row}
      <span class="label">{row.label}</span>
      <span class="flex flex-wrap gap-1">
        {#each row.chips as chip}
          <span class="chip" class:short={chip.short} class:make={row.label === "Makes"}
            >{chip.icon} {chip.text}</span
          >
        {/each}
      </span>
    {/each}
    {#if req.employees > 0}
      <span class="label">Workers</span>
      <span><span class="chip">👷 {req.employees}</span></span>
    {/if}
    {#if needs.length}
      <span class="label">Needs</span>
      <span class="flex flex-wrap gap-1">
        {#each needs as need}
          <span class="chip" class:short={need.short}>{need.text}</span>
        {/each}
      </span>
    {/if}
  </div>
</div>

<style>
  .label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    opacity: 0.55;
  }
  .chip {
    padding: 1px 6px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.09);
    white-space: nowrap;
  }
  .chip.make {
    background: rgba(74, 222, 128, 0.15);
    color: rgb(187, 247, 208);
  }
  .chip.short {
    background: rgba(248, 113, 113, 0.22);
    color: rgb(254, 202, 202);
  }
</style>
