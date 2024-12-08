<script lang="ts">
  import BottomBar from "./BottomBar.svelte";
  import ExpandButton from "./ExpandButton.svelte";
  // @ts-ignore
  import Plot from "./Plot.svelte";
  import { DB, expandTown, modifyPlotMenuOptions, unique } from "./store";

  $: if ($DB) {
    checkForAvailablePlots();
  }

  let styleString: string;
  let styleIndex = 0;

  let sizes = [
    `margin-left: 300px; margin-top: 200px; scale: 1;`,
    `margin-left: 650px; margin-top: 600px; scale: 1.5;`,
  ];

  $: {
    styleString = sizes[styleIndex];
  }

  document.addEventListener("keypress", function (e) {
    if (e.key === "*") {
      styleIndex == sizes.length - 1 ? (styleIndex = 0) : styleIndex++;
    }
  });

  document.addEventListener("click", function (e) {
    const elem = e.target as HTMLDivElement;
    if (
      (elem.dataset.x == undefined &&
        elem.dataset.type != "-1" &&
        elem.dataset.size != undefined) ||
      elem.id == "plotContainerMain" ||
      elem.classList.contains("row") ||
      elem.classList.contains("grid")
    ) {
      $modifyPlotMenuOptions.visible = false;
    }
  });

  export function checkIfPlotCanBeUpgraded(x: number, y: number) {
    let plot = {
      x: x,
      y: y,
    };

    // the only exception is plot 0,0, which can be upgraded from the start
    if (plot.x === 0 && plot.y === 0) {
      return true;
    }
    // you can only upgrade a plot if it is adjacent to a plot that already is {active:true}.

    const adjacentPlots = [
      { x: plot.x - 1, y: plot.y },
      { x: plot.x + 1, y: plot.y },
      { x: plot.x, y: plot.y - 1 },
      { x: plot.x, y: plot.y + 1 },
    ];
    return adjacentPlots.some((adjacentPlot) => {
      // check if adjacent plot is outside of the 25x25 grid
      if (
        adjacentPlot.x < 0 ||
        adjacentPlot.x >= $DB.plots.length || // Changed from '>' to '>='
        adjacentPlot.y < 0 ||
        adjacentPlot.y >= $DB.plots[adjacentPlot.x].length // Assuming a square grid
      ) {
        return false;
      }
      const adjacentPlotData = $DB.plots[adjacentPlot.x][adjacentPlot.y];
      return adjacentPlotData.active;
    });
  }

  function checkForAvailablePlots() {
    let available = [];
    for (let x = 0; x < $DB.plots.length; x++) {
      for (let y = 0; y < $DB.plots.length; y++) {
        const canBeUpgraded = checkIfPlotCanBeUpgraded(x, y);
        if (canBeUpgraded) {
          if ($DB.plots[x][y].active == false) {
            available.push($DB.plots[x][y]);
          }
        }
      }
    }
  }

  export function restartModifyPlotMenu() {
    $unique = {};
  }
</script>

{#if $DB != null}
  <div class="flex flex-col">
    <div
      style={styleString}
      id="plotContainerMain"
      class="items-center h-max flex flex-col pr-80 pb-80
      "
    >
      <div class="flex flex-row items-center">
        <div class="grid plot_controller">
          {#each $DB.plots as plotRow, rowIndex}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
              class="row {rowIndex % 2 !== 0 ? 'odd-row' : ''}"
              on:click={restartModifyPlotMenu}
            >
              {#each plotRow as plot}
                <Plot
                  classText="hexagon"
                  data={plot}
                  canBeUpgraded={checkIfPlotCanBeUpgraded(plot.x, plot.y)}
                />
              {/each}
            </div>
          {/each}
        </div>
        <span>
          <ExpandButton direction="east" />
        </span>
      </div>
      <span>
        <ExpandButton direction="south" />
      </span>
    </div>
  </div>

  {#key $unique}
    {#if $modifyPlotMenuOptions.visible}
      <BottomBar
        x={$modifyPlotMenuOptions.x}
        y={$modifyPlotMenuOptions.y}
        open={$modifyPlotMenuOptions.visible}
      />
    {/if}
  {/key}
{/if}

<style>
  /* CSS */

  #plotContainerMain {
    /* scale: 1; */
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .grid {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    margin: 0;
    padding: 25px;
    padding-top: 40px;
  }

  .row {
    display: flex;
    justify-content: center;
    margin-top: -20px;
  }

  .odd-row {
    margin-left: 100px;
    margin-top: -20px;
  }
</style>
