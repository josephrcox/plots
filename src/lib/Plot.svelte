<script>
  import { options, getColor } from "./objects/PlotTypeOptions";
  import {
    DB,
    modifyPlotMenuOptions,
    unique,
    paused,
    settingLiegeLocation,
    setLiegeLocation,
    isLiegeOnPlot,
  } from "./store.ts";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import PlotTooltip from "./PlotTooltip.svelte";
  import { isAdjacentToWater } from "./utils";

  export let data = {
    id: 0,
    active: false,
    x: 0,
    y: 0,
    type: -1,
    styling: "",
    referencePlot: [],
    mineralSource: false,
    disabled: false,
    water: false,
  };

  let currentPlotOption;

  $: {
    if (data.type > -1) {
      currentPlotOption = options[data.type];
    }
  }
  export let classText = "";
  export let canBeUpgraded = false;

  const isLiegeLocationPlot = (x, y) => {
    return (
      $DB.liege_location != null &&
      x == $DB.liege_location[0] &&
      y == $DB.liege_location[1]
    );
  };

  function openMenu(e, a, b) {
    let plots = document.querySelectorAll(".plot_container");
    if ($paused == false) {
      if (
        data.referencePlot != undefined &&
        data.referencePlot[0] !== null &&
        a == undefined &&
        b == undefined &&
        data.referencePlot[1] !== undefined
      ) {
        return openMenu(e, data.referencePlot[0], data.referencePlot[1]);
      } else if (!data.active && !canBeUpgraded) {
        $unique = {};
        $modifyPlotMenuOptions.visible = false;
        plots.forEach((plot) => {
          plot.classList.remove("selected");
        });
      } else {
        if (a != undefined && b != undefined) {
          $modifyPlotMenuOptions.x = a;
          $modifyPlotMenuOptions.y = b;
        } else {
          $modifyPlotMenuOptions.x = data.x;
          $modifyPlotMenuOptions.y = data.y;
        }
        $modifyPlotMenuOptions.isMineralSource = data.mineralSource;
        $modifyPlotMenuOptions.visible = true;

        plots.forEach((plot) => {
          plot.classList.remove("selected");
        });
        // Highlight a plot when it's clicked on
        if (a != undefined && b != undefined) {
          document
            .querySelector(`.plot_container[data-x="${a}"][data-y="${b}"]`)
            .classList.add("selected");
        } else {
          document
            .querySelector(`.plot_container[data-id="${data.id}"]`)
            .classList.add("selected");
        }
      }
    }
  }

  export function changePlotType(type) {
    if ($paused == false) {
      $DB.plots[data.x][data.y].type = type;
      $modifyPlotMenuOptions.visible = false;
    }
  }
</script>

<Tooltip.Root openDelay={400} closeDelay={0}>
  <Tooltip.Trigger>
    <button
      class="plot_container {classText}  overflow-visible {data.type == -1 &&
      canBeUpgraded == false
        ? ''
        : ''} {data.mineralSource ? 'hidden' : ''} {canBeUpgraded
        ? 'cursor-pointer'
        : 'cursor-not-allowed'}
	{data.disabled ? 'animate-spin' : ''}
		"
      style="background-color: {data.water
        ? 'bg-blue-900 opacity-100'
        : $modifyPlotMenuOptions.x == data.x &&
            $modifyPlotMenuOptions.y == data.y &&
            $modifyPlotMenuOptions.visible
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
      data-optionIndex={data.optionIndex}
      on:click={data.water
        ? null
        : $settingLiegeLocation
          ? setLiegeLocation(data.x, data.y, $DB)
          : openMenu}
      data-canBeUpgraded={canBeUpgraded}
      data-type={data.type}
      data-type-id={data.typeId}
      data-refPlotX={data.referencePlot !== undefined
        ? data.referencePlot[1]
        : null}
      data-refPlotY={data.referencePlot !== undefined
        ? data.referencePlot[0]
        : null}
      data-size={data.type > -1 ? options[data.type].requirements.size : null}
      data-mineralSource={data.mineralSource}
      data-water={data.water}
      data-nearWater={isAdjacentToWater(data.x, data.y, $DB)}
      data-liegeLocation={isLiegeLocationPlot(data.x, data.y)}
    >
      {#if data.type > -1}
        <div>
          <span
            data-size={options[data.type].requirements.size}
            data-x={data.x}
            data-y={data.y}
          >
            <span class="text-lg align-text-top select-none"
              >{options[data.type].title.substring(0, 2)}</span
            >
            <br />
            <span
              class="text-xs align-text-top font-normal text-black from-stone-600 select-none"
              >{options[data.type].title.substring(2)}
            </span>
          </span>
        </div>
      {:else if data.type == -1 && data.x == 0 && data.y == 0}
        <!--  -->
      {/if}
      {#if data.mineralSource && data.type == -1}
        <span class="text-lg">🧲</span>
      {/if}
      {#if isLiegeLocationPlot(data.x, data.y)}
        <span class="text-xl absolute top-0">👑</span>
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
      {#if isAdjacentToWater(data.x, data.y, $DB)}
        <span
          class="text-xs bg-blue-500 text-white px-2 py-3 italic rounded-2xl text-center"
          >Near water - Generating more food & revenue!</span
        >
      {/if}
      {#if isLiegeOnPlot(data.x, data.y, $DB)}
        <span
          class="text-xs bg-pink-700 text-white px-2 py-3 italic rounded-2xl text-center"
        >
          {#if options[data.type].liege_on_plot_hint == null}
            You are hanging out on the {options[data.type].title} plot, but nothing
            seems to be changing except a revenue boost.
          {:else}
            {options[data.type].liege_on_plot_hint}
          {/if}
        </span>
      {/if}

      {#if data.active}
        <PlotTooltip option={currentPlotOption} checkRequirements={false} />
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
    background-color: rgb(21 28 41);
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
      background-color: rgb(0, 0, 180);
    }
    50% {
      background-color: rgb(0, 0, 220);
    }
    100% {
      background-color: rgb(0, 0, 180);
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
      waterAnimation1 3s infinite,
      waterAnimation2 4s infinite;
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
