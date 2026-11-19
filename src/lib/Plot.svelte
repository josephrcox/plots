<script lang="ts">
  import { options, getColor } from "./objects/PlotTypeOptions";
  import {
    DB,
    modifyPlotMenuOptions,
    unique,
    paused,
    settingLiegeLocation,
    setLiegeLocation,
    isLiegeOnPlot,
    isReadOnly,
  } from "./store";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import PlotTooltip from "./PlotTooltip.svelte";
  import { isAdjacentToWater } from "./utils";
  import { activeEffects } from "./neighbours";
  import type { Plot } from "./types";

  export let data: Plot;
  export let classText = "";
  export let canBeUpgraded = false;

  $: option = data.type > -1 ? options[data.type] : undefined;
  $: nearWater = isAdjacentToWater(data.x, data.y, $DB!);
  $: liegeHere = isLiegeOnPlot(data.x, data.y, $DB!);
  $: neighbourEffects = data.active ? activeEffects(data.x, data.y, $DB!) : [];
  $: isSelected =
    $modifyPlotMenuOptions.visible &&
    $modifyPlotMenuOptions.x == data.x &&
    $modifyPlotMenuOptions.y == data.y;

  function scrollPlotIntoView(element: Element) {
    const rect = element.getBoundingClientRect();
    const container = document.documentElement;
    window.scrollTo({
      top: container.scrollTop + rect.top - window.innerHeight / 2 + 225,
      left: container.scrollLeft + rect.left - window.innerWidth / 2,
      behavior: "smooth",
    });
  }

  function handleClick(e: MouseEvent) {
    if (data.water || isReadOnly) return;

    if ($settingLiegeLocation) {
      if (data.active) setLiegeLocation(data.x, data.y, $DB!);
      return;
    }
    // No building while paused or while the game-over dialog is up.
    if ($paused) return;
    if ($DB!.endGameDetails.msg !== "") return;

    if (!data.active && !canBeUpgraded) {
      $unique = {};
      $modifyPlotMenuOptions.visible = false;
      return;
    }

    $modifyPlotMenuOptions = {
      x: data.x,
      y: data.y,
      isMineralSource: data.mineralSource,
      visible: true,
    };
    scrollPlotIntoView(e.currentTarget as Element);
  }
</script>

<Tooltip.Root openDelay={400} closeDelay={0}>
  <!-- asChild: the plot button itself is the trigger (no button-in-button). -->
  <Tooltip.Trigger asChild let:builder>
    <button
      use:builder.action
      {...builder}
      class="plot_container {classText} overflow-visible"
      class:selected={isSelected}
      class:cursor-pointer={canBeUpgraded}
      class:cursor-not-allowed={!canBeUpgraded}
      class:cursor-crosshair={$settingLiegeLocation && data.active}
      style="background-color: {data.water
        ? 'rgba(66, 135, 245, 1)'
        : isSelected
          ? 'white'
          : data.mineralSource
            ? 'black'
            : getColor(data.type, canBeUpgraded)}"
      data-active={data.active}
      data-hideHoverAnimation={$modifyPlotMenuOptions.visible ||
        (data.type == -1 && data.x == 0 && data.y == 0)}
      data-id={data.id}
      data-x={data.x}
      data-y={data.y}
      on:click={handleClick}
      data-canBeUpgraded={canBeUpgraded}
      data-type={data.type}
      data-type-id={data.typeId}
      data-size={option ? option.requirements.size : null}
      data-mineralSource={data.mineralSource}
      data-water={data.water}
      data-nearWater={nearWater}
      data-liegeLocation={liegeHere}
    >
      {#if option}
        <div>
          <span
            data-size={option.requirements.size}
            data-x={data.x}
            data-y={data.y}
          >
            <span class="text-lg align-text-top select-none"
              >{option.emoji}</span
            >
            <br />
            <span
              class="text-sm align-text-top {option.id == 'mine'
                ? 'text-white'
                : 'text-black'} select-none"
              >{option.title}
            </span>
          </span>
        </div>
      {:else if data.type == -1 && data.x == 0 && data.y == 0}
        <span
          class="text-md text-black select-none transition-all duration-500
          animate-pulse
          "
        >
          Start here!
        </span>
      {/if}
      {#if data.mineralSource && data.type == -1}
        <span class="text-lg">🧲</span>
      {/if}
      {#if liegeHere}
        <span class="text-lg absolute top-0">👑</span>
      {/if}
    </button>
  </Tooltip.Trigger>
  <Tooltip.Content
    class="max-w-64 rounded-3xl {data.type < 0 && !data.water ? 'hidden' : ''}"
  >
    <div class="flex flex-col gap-2">
      {#if data.water}
        Water - Place farms nearby for more food & revenue!
      {/if}
      {#if nearWater}
        <span
          class="text-xs bg-blue-500 text-white px-2 py-3 rounded-2xl text-center"
          >Near water - Generating more food & revenue!</span
        >
      {/if}
      {#if liegeHere && option}
        <span
          class="text-xs bg-pink-700 text-white px-2 py-3 rounded-2xl text-center"
        >
          {#if option.liege_on_plot_hint == null}
            You are hanging out on the {option.title} plot, but nothing seems to
            be changing except a revenue boost.
          {:else}
            {option.liege_on_plot_hint}
          {/if}
        </span>
      {/if}

      {#each neighbourEffects as effect}
        <span
          class="text-xs text-white px-2 py-2 rounded-2xl text-center {effect.good
            ? 'bg-green-700'
            : 'bg-red-700'}">{effect.text}</span
        >
      {/each}
      {#if data.active && option}
        <PlotTooltip {option} checkRequirements={false} />
      {/if}
    </div>
  </Tooltip.Content>
</Tooltip.Root>

<style>
  .plot_container {
    position: relative;
    width: 90px;
    height: 105px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    margin: 0 5px 0 5px;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    transition: box-shadow 0.1s;
    box-shadow: 0 0 0 0 transparent;
  }

  .plot_container[data-hideHoverAnimation="false"]:hover:before {
    opacity: 0.2;
    scale: 1.01;
  }
  .plot_container:hover[data-canBeUpgraded="true"] {
    scale: 1.02;
    transition: ease-in-out 0.1s;
    filter: brightness(1.1);
    cursor: pointer;
  }

  .plot_container[data-active="true"] {
    background-color: rgb(204 218 209);
  }
  .plot_container[data-canBeUpgraded="false"] {
    background-color: rgb(41, 21, 21);
  }
  @keyframes sparkleAnimation {
    0%,
    100% {
      background-position: 0 0;
      opacity: 0.7;
    }
    50% {
      background-position: 100% 100%;
      opacity: 1;
    }
  }

  .plot_container[data-nearWater="true"] {
    background-image: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(255, 255, 255, 0.1) 60%,
      transparent 90%
    );
    background-size: 200% 200%;
    animation: sparkleAnimation 4s ease-in-out infinite;
  }

  @keyframes waterAnimation1 {
    0% {
      background-color: rgba(48, 128, 137, 1);
    }
    50% {
      background-color: rgba(64, 154, 184, 1);
    }
    100% {
      background-color: rgba(48, 128, 137, 1);
    }
  }

  @keyframes waterAnimation2 {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
    100% {
      opacity: 1;
    }
  }

  .plot_container[data-water="true"] {
    animation:
      waterAnimation1 10s infinite,
      waterAnimation2 5s infinite;
  }

  .plot_container[data-type="-2"] {
    background-color: #858507;
    border: none;
  }

  .plot_container[data-size="2"] {
    background-color: rgb(42, 62, 230);
    border: none;
  }

  .plot_container[data-type="-3"] {
    background-color: rgb(42, 62, 230);
    border: none;
  }
  .plot_container > div {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    gap: 8px;
    color: black;
  }
</style>
