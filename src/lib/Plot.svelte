<script lang="ts" context="module">
  // Hex geometry, shared with MapView. x is the row, y the column; odd rows
  // sit half a column to the right.
  export const TILE_W = 90;
  export const TILE_H = 105;
  export const COL_STEP = 100;
  export const ROW_STEP = 85;

  export function tileLeft(x: number, y: number) {
    return y * COL_STEP + (x % 2 === 1 ? COL_STEP / 2 : 0);
  }
  export function tileTop(x: number) {
    return x * ROW_STEP;
  }

  /** How a tile is drawn for the current tool / selection. */
  export type TileState =
    | "normal"
    | "dim" // not usable with the current tool
    | "placeable" // the current build tool can go here
    | "ghost" // placeable and under the cursor: shows the building
    | "blocked" // under the cursor but the tool can't go here
    | "doomed" // under the cursor with the bulldozer
    | "selected"; // targeted or inspected
</script>

<script lang="ts">
  import { options, getColor } from "./objects/PlotTypeOptions";
  import type { Plot } from "./types";
  import { siteOf, siteFor } from "./sites";
  import { GROUND_COLOR } from "./fog";

  export let data: Plot;
  export let buildable = false;
  export let nearWater = false;
  export let liegeHere = false;
  export let state: TileState = "normal";
  export let ghostEmoji = "";
  export let crosshair = false;
  export let startHint = false;
  export let understaffed = false;
  /** For homes that aren't full yet: people living there / room. */
  export let occupancy: { people: number; capacity: number } | null = null;
  /** Map overlay tint and its number, when an overlay is on. */
  export let tint: string | null = null;
  /** Homes: level (1–3) and which way it's heading. */
  export let fogged = false;
  /** Surveyor perk: show a special site's icon even under fog. */
  export let surveyed = false;
  export let homeLevel = 0;
  export let levelTrend: "up" | "down" | "steady" = "steady";
  export let tintLabel: string | null = null;

  $: option = data.type > -1 ? options[data.type] : undefined;
  $: site = fogged ? undefined : siteOf(data);
  $: mineral = data.site === "mineral";
  $: usedSite = siteFor(data);
  $: fill = fogged
    ? "transparent"
    : data.offMap
      ? GROUND_COLOR // explored edge of the land
      : data.water
    ? "rgb(64, 140, 170)"
    : tint && !option && !mineral
      ? "rgb(205, 200, 185)" // neutral under an overlay, so the tint reads
    : mineral && !option
      ? "rgb(20, 20, 20)"
      : getColor(data.type, buildable);
  $: ring =
    state === "selected"
      ? "white"
      : state === "ghost" || state === "placeable"
        ? "rgb(255, 230, 120)"
        : state === "doomed" || state === "blocked"
          ? "rgb(230, 70, 70)"
          : "";
</script>

<div
  class="plot_container"
  class:fogbank={fogged}
  class:dim={state === "dim"}
  class:pulse={state === "placeable"}
  class:crosshair
  class:clickable={buildable || data.active}
  style="left:{tileLeft(data.x, data.y)}px; top:{tileTop(data.x)}px; background:{ring ||
    'transparent'};"
  data-x={data.x}
  data-y={data.y}
  data-active={data.active}
  data-water={data.water}
  data-type-id={data.typeId}
  data-state={state}
>
  <div
    class="inner"
    class:inset={ring !== ""}
    class:water={data.water && !fogged}
    class:fog={fogged}
    class:sparkle={nearWater}
    style="background-color:{fill};"
  >
    {#if fogged}
      <!-- nothing shows through fog (except sites, with the surveyor perk) -->
    {:else if state === "ghost"}
      <span class="emoji opacity-70">{ghostEmoji}</span>
    {:else if option}
      <span class="emoji">{option.emoji}</span>
      <span class="title" class:text-white={option.id === "mine"}
        >{option.title}</span
      >
      {#if homeLevel > 1 || levelTrend !== "steady"}
        <span
          class="level"
          title="Home level {homeLevel}{levelTrend === 'up'
            ? ', growing'
            : levelTrend === 'down'
              ? ', declining'
              : ''}"
          >{"★".repeat(homeLevel)}{levelTrend === "up" ? "↑" : levelTrend === "down" ? "↓" : ""}</span
        >
      {/if}
      {#if occupancy && occupancy.people < occupancy.capacity}
        <span class="occupancy" title="People living here"
          >👥 {occupancy.people}/{occupancy.capacity}</span
        >
      {/if}
    {:else if site}
      <span class="emoji">{site.emoji}</span>
      <span class="title site-title" class:text-white={mineral}>{site.title}</span>
    {:else if startHint}
      <span class="emoji animate-bounce">🚩</span>
      <span class="title">Start here!</span>
    {/if}
  </div>
  {#if tint}
    <div class="overlay" style="background:{tint};">
      {#if tintLabel}<span class="overlay-label">{tintLabel}</span>{/if}
    </div>
  {/if}
  <!-- Badges hang off the outer tile, which keeps its size when the inner
       tile shrinks to show a selection ring, so they never shift. -->
  {#if option && state !== "ghost"}
    {#if data.disabled}
      <span class="badge" title="Shut down">⚠️</span>
    {:else if understaffed}
      <span class="badge staff" title="Not enough workers">👷</span>
    {/if}
  {/if}
  {#if fogged && surveyed && siteOf(data)}
    <span class="surveyed" title={siteOf(data)?.title}>{siteOf(data)?.emoji}</span>
  {/if}
  {#if site && option && state !== "ghost"}
    <span class="site-badge" class:dim-badge={!usedSite} title={site.title}>{site.emoji}</span>
  {/if}
  {#if liegeHere}
    <span class="liege">👑</span>
  {/if}
  {#if state === "doomed"}
    <span class="doom">🚜</span>
  {/if}
</div>

<style>
  .plot_container {
    position: absolute;
    z-index: 1; /* above the fog blanket */
    width: 90px;
    height: 105px;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    transition: opacity 0.15s, filter 0.15s;
  }
  .plot_container.clickable {
    cursor: pointer;
  }
  .plot_container.crosshair {
    cursor: crosshair;
  }
  .plot_container.dim {
    opacity: 0.35;
    filter: saturate(0.4);
  }
  .plot_container.pulse {
    animation: pulse 1.6s ease-in-out infinite;
  }
  .plot_container:hover:not(.dim) .inner {
    filter: brightness(1.1);
  }
  .inner {
    position: absolute;
    inset: 0;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    user-select: none;
    transition: inset 0.1s;
  }
  .inner.inset {
    inset: 5px;
  }
  .overlay {
    position: absolute;
    inset: 0;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    pointer-events: none;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .overlay-label {
    margin-bottom: 12px;
    font-size: 0.8rem;
    font-weight: 700;
    color: white;
    background: rgba(0, 0, 0, 0.55);
    border-radius: 6px;
    padding: 0 4px;
  }
  .emoji {
    font-size: 1.4rem;
    line-height: 1.2;
  }
  .title {
    font-size: 0.75rem;
    line-height: 1.1;
    color: black;
    padding: 0 6px;
  }
  .badge {
    left: 50%;
    transform: translateX(-50%);
    position: absolute;
    top: 14px;
    font-size: 0.8rem;
  }
  .level {
    font-size: 0.65rem;
    line-height: 1.1;
    color: rgb(120, 80, 0);
    letter-spacing: -1px;
  }
  .occupancy {
    font-size: 0.6rem;
    color: rgba(0, 0, 0, 0.7);
    line-height: 1.2;
  }
  .badge.staff {
    background: rgb(217, 119, 6);
    border-radius: 9999px;
    padding: 0 3px;
    font-size: 0.7rem;
  }
  /* Fog: a solid dark sheet. Each unexplored cell is a plain square, a bit
     larger than its tile so neighbours overlap with no gaps; no filters or
     gradients, so it stays cheap to draw. */
  .plot_container.fogbank {
    clip-path: none;
    transform: scale(1.25);
    z-index: 0;
    background: transparent !important;
  }
  .inner.fog {
    display: none;
  }
  .surveyed {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.2rem;
    opacity: 0.8;
  }
  .site-title {
    font-size: 0.62rem;
    opacity: 0.75;
  }
  .site-badge {
    position: absolute;
    right: 12px;
    top: 20px;
    font-size: 0.7rem;
  }
  .site-badge.dim-badge {
    opacity: 0.4;
  }
  .liege {
    left: 50%;
    transform: translateX(-50%);
    position: absolute;
    top: 4px;
    font-size: 1rem;
  }
  .doom {
    left: 50%;
    transform: translateX(-50%);
    position: absolute;
    bottom: 10px;
    font-size: 1rem;
  }
  @keyframes pulse {
    0%,
    100% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.25);
    }
  }
  .inner.sparkle {
    background-image: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.45) 0%,
      rgba(255, 255, 255, 0.1) 60%,
      transparent 90%
    );
    background-size: 200% 200%;
    animation: sparkle 4s ease-in-out infinite;
  }
  @keyframes sparkle {
    0%,
    100% {
      background-position: 0 0;
    }
    50% {
      background-position: 100% 100%;
    }
  }
  .inner.water {
    animation: water 10s infinite;
  }
  @keyframes water {
    0%,
    100% {
      background-color: rgb(48, 128, 137);
    }
    50% {
      background-color: rgb(64, 154, 184);
    }
  }
</style>
