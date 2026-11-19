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

  export let data: Plot;
  export let buildable = false;
  export let nearWater = false;
  export let liegeHere = false;
  export let state: TileState = "normal";
  export let ghostEmoji = "";
  export let crosshair = false;
  export let startHint = false;

  $: option = data.type > -1 ? options[data.type] : undefined;
  $: fill = data.water
    ? "rgb(64, 140, 170)"
    : data.mineralSource && !option
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
    class:water={data.water}
    class:sparkle={nearWater}
    style="background-color:{fill};"
  >
    {#if state === "ghost"}
      <span class="emoji opacity-70">{ghostEmoji}</span>
    {:else if option}
      <span class="emoji">{option.emoji}</span>
      <span class="title" class:text-white={option.id === "mine"}
        >{option.title}</span
      >
      {#if data.disabled}
        <span class="badge" title="Shut down">⚠️</span>
      {/if}
    {:else if data.mineralSource}
      <span class="emoji">🧲</span>
    {:else if startHint}
      <span class="emoji animate-bounce">🚩</span>
      <span class="title">Start here!</span>
    {/if}
    {#if liegeHere}
      <span class="liege">👑</span>
    {/if}
    {#if state === "doomed"}
      <span class="doom">🚜</span>
    {/if}
  </div>
</div>

<style>
  .plot_container {
    position: absolute;
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
    position: absolute;
    top: 14px;
    font-size: 0.8rem;
  }
  .liege {
    position: absolute;
    top: 4px;
    font-size: 1rem;
  }
  .doom {
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
