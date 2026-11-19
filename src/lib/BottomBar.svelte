<script lang="ts">
  import { fade, slide } from "svelte/transition";
  import {
    analyticsEvent,
    findClosestPlot,
    checkIfAffordable,
    placePlot,
  } from "./utils";
  import {
    DB,
    modifyPlotMenuOptions,
    reverseClear,
    hasPlotOfType,
    isReadOnly,
  } from "./store";
  import { options, plotTypeMaximums } from "./objects/PlotTypeOptions";
  import { type Plot, Events } from "./types";
  import RightSidebar from "./RightSidebar.svelte";
  import PlotTile from "./components/PlotTile.svelte";
  import { previewPlacement } from "./neighbours";

  export let x = 0;
  export let y = 0;
  export let open = false;
  export let tooltip = "";
  const STARTER_PLOTS = ["small_homes", "farm", "tree_farm"];

  $: currentTypeId = $DB ? $DB.plots[x][y].typeId : "";

  // Options shown for the selected plot, with the current one sorted first.
  $: visibleOptions = $DB
    ? options
        .filter((option) => {
          if ($modifyPlotMenuOptions.isMineralSource) {
            return option.id === "mine";
          }
          if (option.id === "mine") return false;
          // Until there's a tree farm, only the starter plots are offered.
          if (
            hasPlotOfType("tree_farm", $DB!).length === 0 &&
            !STARTER_PLOTS.includes(option.id)
          ) {
            return false;
          }
          const max = plotTypeMaximums[option.id];
          if (
            typeof max === "number" &&
            max > 0 &&
            hasPlotOfType(option.id, $DB!).length >= max
          ) {
            return false;
          }
          return true;
        })
        .map((option) => ({
          ...option,
          selected: option.id === currentTypeId,
          affordability: checkIfAffordable(option, $DB!, x, y),
          neighbourEffects:
            option.id === currentTypeId
              ? []
              : previewPlacement(option.id, x, y, $DB!),
        }))
        .sort((a, b) => Number(b.selected) - Number(a.selected))
    : [];

  function isNavigable(px: number, py: number, plots: Plot[][]): boolean {
    return (
      px >= 0 &&
      px < plots.length &&
      py >= 0 &&
      py < plots[0].length &&
      !plots[px][py].water &&
      !plots[px][py].disabled
    );
  }

  function findNextValidPosition(
    deltaX: number,
    deltaY: number,
  ): [number, number] | null {
    const plots = $DB!.plots;
    let px = $modifyPlotMenuOptions.x + deltaX;
    let py = $modifyPlotMenuOptions.y + deltaY;
    while (px >= 0 && px < plots.length && py >= 0 && py < plots[0].length) {
      if (isNavigable(px, py, plots)) return [px, py];
      px += deltaX;
      py += deltaY;
    }
    return null;
  }

  /** Moves the build menu to another plot and scrolls it into view. */
  function selectPlot(newX: number, newY: number) {
    x = newX;
    y = newY;
    $modifyPlotMenuOptions.x = newX;
    $modifyPlotMenuOptions.y = newY;
    $modifyPlotMenuOptions.isMineralSource =
      $DB!.plots[newX][newY].mineralSource;

    const element = document.querySelector(
      `.plot_container[data-x="${newX}"][data-y="${newY}"]`,
    );
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const container = document.documentElement;
    window.scrollTo({
      top: container.scrollTop + rect.top - window.innerHeight / 2 + 225,
      left: container.scrollLeft + rect.left - window.innerWidth / 2,
      behavior: "smooth",
    });
  }

  function handlePlotOptionClick(event: MouseEvent) {
    const plotOption = (event.target as HTMLElement).closest<HTMLElement>(
      ".plotOption",
    );
    const plotOptionID = plotOption?.dataset.plotoptionid;
    if (!plotOptionID) return;

    if (plotOptionID === $DB!.plots[x][y].typeId) {
      reverseClear(x, y, $DB!);
      return;
    }
    choosePlotOption(plotOptionID);
  }

  function choosePlotOption(plotOptionID: string) {
    const z = $DB!;
    if (!placePlot(z, x, y, plotOptionID)) {
      tooltip =
        "You do not have enough resources to purchase this plot. If it's a 'Large' plot, make sure you have a 2x2 area available. ";
      return;
    }
    tooltip = "";

    analyticsEvent(z, Events.BUILD_PLOT, {
      plot_type: plotOptionID,
      x: x.toString(),
      y: y.toString(),
      end_goal: z.endGoal,
      day: z.environment.day,
      settings: z.gameSettings.join(","),
    });
    DB.set(z);

    const nextPlot = findClosestPlot(x, y, z);
    if (nextPlot) selectPlot(nextPlot[0], nextPlot[1]);
  }

  const NAVIGATION_KEYS: Record<string, [number, number]> = {
    arrowup: [-1, 0],
    w: [-1, 0],
    arrowdown: [1, 0],
    s: [1, 0],
    arrowleft: [0, -1],
    a: [0, -1],
    arrowright: [0, 1],
    d: [0, 1],
  };

  function handleKeydown(event: KeyboardEvent) {
    if (!open || !$DB) return;
    const active = document.activeElement?.nodeName;
    if (active === "INPUT" || active === "TEXTAREA") return;
    const delta = NAVIGATION_KEYS[event.key.toLowerCase()];
    if (!delta) return;
    const next = findNextValidPosition(delta[0], delta[1]);
    if (next) selectPlot(next[0], next[1]);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open && !isReadOnly}
  <!-- Add overlay with fade transition -->
  <div
    class="fixed inset-0 bg-black/20 z-[998]"
    on:click={() => ($modifyPlotMenuOptions.visible = false)}
    transition:fade={{ duration: 200 }}
  />

  <div
    class="w-[100vw] fixed bottom-0 max-h-[50vh]
      z-[999] flex flex-row justify-center text-center items-center bg-popupBackground text-sidebarText px-4
      shadow-2xl rounded-t-2xl"
    on:click|stopPropagation
    transition:slide={{ duration: 200, axis: "y" }}
  >
    <div class=" h-max w-full flex-grow">
      <div>
        <div
          class="flex flex-row gap-2 justify-start pt-8 flex-grow w-full"
          on:click={handlePlotOptionClick}
        >
          <div class="flex gap-1 pb-24 overflow-scroll max-h-[50vh]">
            <div>
              <div
                class="flex flex-row text-start justify-start items-start flex-wrap py-8 px-8 max-w-[75vw] pt-6 gap-2 w-full align-middle"
              >
                {#each visibleOptions as option (option.id)}
                  <PlotTile
                    {option}
                    isAffordable={option.affordability}
                    neighbourEffects={option.neighbourEffects}
                  />
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div>
      <RightSidebar mini={true} />
    </div>
  </div>
{/if}

<style>
  /* Hide scrollbars across all platforms while maintaining scroll functionality */
  :global(*) {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }

  :global(*::-webkit-scrollbar) {
    display: none; /* Chrome, Safari and Opera */
  }
</style>
