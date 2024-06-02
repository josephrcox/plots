<script>
  import { options, getColor } from "./objects/PlotTypeOptions";
  import { DB, modifyPlotMenuOptions, unique, paused } from "./store.ts";
  import Tooltip from "./Tooltip.svelte";

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
  };
  export let classText = "";
  export let canBeUpgraded = false;

  function openMenu(e, a, b) {
    let plots = document.querySelectorAll(".plot_container");
    console.log(`test ${!data.active && !canBeUpgraded}`);
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

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<button
  class="plot_container {classText} overflow-visible {data.type == -1 &&
  canBeUpgraded == false
    ? ''
    : ''} {data.mineralSource ? 'hidden' : ''} {canBeUpgraded
    ? 'cursor-pointer'
    : 'cursor-not-allowed'}
	{data.disabled ? 'animate-spin' : ''}
		"
  style="background-color: {$modifyPlotMenuOptions.x == data.x &&
  $modifyPlotMenuOptions.y == data.y &&
  $modifyPlotMenuOptions.visible
    ? 'white'
    : getColor(data.type, canBeUpgraded)}"
  data-active={data.active}
  data-hideHoverAnimation={$modifyPlotMenuOptions.visible ||
    (data.type == -1 && data.x == 0 && data.y == 0)}
  data-id={data.id}
  data-x={data.x}
  data-y={data.y}
  data-optionIndex={data.optionIndex}
  on:click={openMenu}
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
    <Tooltip text="Mineral Source (mine)" emoji="⛏️" tone="standard" />
  {/if}
</button>

<style>
  .plot_container {
    position: relative;
    width: 110px;
    height: 125px;
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
    gap: 10px;
    color: black;
  }
</style>
