<script lang="ts">
  import { onMount } from "svelte";
  import BottomBar from "./BottomBar.svelte";
  import ExpandButton from "./ExpandButton.svelte";
  import Plot from "./Plot.svelte";
  import { DB, modifyPlotMenuOptions, unique } from "./store";
  import { checkIfPlotCanBeUpgraded } from "./utils";

  const SIZE_KEY = "plotsSize";
  // Zoom levels, cycled with the "z" key.
  const sizes = [
    `margin-left: 300px; margin-top: 200px; scale: 1;`,
    `margin-left: 650px; margin-top: 600px; scale: 1.5;`,
    `margin-left: -50px; margin-top: -50px; scale: 0.6;`,
  ];

  let styleIndex = parseInt(localStorage.getItem(SIZE_KEY) ?? "0") || 0;
  if (styleIndex < 0 || styleIndex >= sizes.length) styleIndex = 0;
  $: styleString = sizes[styleIndex];

  function handleKeypress(e: KeyboardEvent) {
    const active = document.activeElement?.nodeName;
    if (active === "INPUT" || active === "TEXTAREA") return;
    if (e.key === "z") {
      styleIndex = (styleIndex + 1) % sizes.length;
      localStorage.setItem(SIZE_KEY, styleIndex.toString());
    }
  }

  // Clicking empty space around the grid closes the build menu.
  function handleDocumentClick(e: MouseEvent) {
    const elem = e.target as HTMLElement;
    if (
      (elem.dataset?.x == undefined &&
        elem.dataset?.type != "-1" &&
        elem.dataset?.size != undefined) ||
      elem.id == "plotContainerMain" ||
      elem.classList?.contains("row") ||
      elem.classList?.contains("grid")
    ) {
      $modifyPlotMenuOptions.visible = false;
    }
  }

  onMount(() => {
    document.addEventListener("keypress", handleKeypress);
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("keypress", handleKeypress);
      document.removeEventListener("click", handleDocumentClick);
    };
  });

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
                  canBeUpgraded={checkIfPlotCanBeUpgraded(plot.x, plot.y, $DB)}
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
