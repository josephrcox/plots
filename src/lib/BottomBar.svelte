<script lang="ts">
  import { fade, slide } from "svelte/transition";
  import { onMount, onDestroy } from "svelte";
  import {
    roundTo,
    capitalizeFirstLetter,
    isAdjacentToPlots,
    checkIfPlotCanBeUpgraded,
    analyticsEvent,
    findClosestPlot,
    isAdjacentToWater,
    checkIfAffordable,
  } from "./utils";
  import {
    DB,
    ACTIVE_GAME_DB_NAME,
    modifyPlotMenuOptions,
    reverseClear,
    hasPlotOfType,
    showCustomAlert,
    TEMP_GAME_DB_NAME,
  } from "./store";
  import { options, plotTypeMaximums } from "./objects/PlotTypeOptions";
  import { Game, PlotOption, Events } from "./types";
  // @ts-ignore
  import RightSidebar from "./RightSidebar.svelte";
  import PlotTile from "./components/PlotTile.svelte";

  export let x = 0;
  export let y = 0;
  export let open = false;
  export let tooltip = "";
  let PlotTypeOptions = options;
  let containerElement: HTMLElement;
  const BOTTOM_MENU_HEIGHT = "50vh";

  // Cache for plot type lookups
  const plotTypeCache = new Map<string, number>();

  function getTypeIndex(typeId: string): number {
    if (!plotTypeCache.has(typeId)) {
      plotTypeCache.set(
        typeId,
        options.findIndex((option) => option.id === typeId),
      );
    }
    return plotTypeCache.get(typeId)!;
  }

  $: baseOptions = $DB
    ? PlotTypeOptions.map((option: PlotOption | any) => ({
        ...option,
        affordable: checkIfAffordable(option, $DB, x, y).affordable,
        selected: isSelected(option),
      }))
    : [];

  $: reactiveOptions = $DB
    ? (() => {
        let options = [...baseOptions];

        // Early return for mineral sources
        if ($modifyPlotMenuOptions.isMineralSource) {
          return options.filter((option) => option.id === "mine");
        }

        // Apply tree farm filter
        if (hasPlotOfType("tree_farm", $DB).length === 0) {
          options = options.filter((option) =>
            ["small_homes", "farm", "tree_farm"].includes(option.id),
          );
        }

        // Apply plot maximums filter - only filter if the plot type has a maximum and we've reached it
        for (const [plotType, maxCount] of Object.entries(plotTypeMaximums)) {
          if (
            typeof maxCount === "number" &&
            maxCount > 0 &&
            hasPlotOfType(plotType, $DB).length >= maxCount
          ) {
            options = options.filter((option) => option.id !== plotType);
          }
        }

        // Sort selected to front
        return options.sort((a, b) => (a.selected && !b.selected ? -1 : 0));
      })()
    : [];

  // Helper functions for plot validation and navigation
  function isValidPlot(x: number, y: number, plots: any[][]): boolean {
    return (
      x >= 0 &&
      x < plots.length &&
      y >= 0 &&
      y < plots[0].length &&
      !plots[x][y].water &&
      !plots[x][y].disabled
    );
  }

  function findNextValidPosition(
    startX: number,
    startY: number,
    deltaX: number,
    deltaY: number,
    plots: any[][],
  ): [number, number] | null {
    let x = startX + deltaX;
    let y = startY + deltaY;

    while (x >= 0 && x < plots.length && y >= 0 && y < plots[0].length) {
      if (isValidPlot(x, y, plots)) {
        return [x, y];
      }
      x += deltaX;
      y += deltaY;
    }

    return null;
  }

  // Optimized closest plot finder

  function isSelected(option: PlotOption) {
    return $DB.plots[x][y].type > -1
      ? PlotTypeOptions[$DB.plots[x][y].type].id === option.id
      : false;
  }

  function handlePlotOptionClick(event: any) {
    const plotOption = event.target.closest(".plotOption");

    if (plotOption) {
      const plotOptionID = plotOption.dataset.plotoptionid;

      if (plotOptionID === $DB.plots[x][y].typeId) {
        clearPlot();
        return;
      }
      choosePlotOption(plotOptionID);
    }
  }

  function choosePlotOption(plotOptionID: string) {
    const typeIndex = getTypeIndex(plotOptionID);
    const plotChosen = PlotTypeOptions[typeIndex];
    let z = $DB;

    if (checkIfAffordable(plotChosen, z, x, y).affordable) {
      if (z.plots[x][y].type !== -1) {
        reverseClear(x, y, z);
      }

      tooltip = "";
      z.plots[x][y].type = typeIndex;
      z.plots[x][y].active = true;
      z.plots[x][y].typeId = plotChosen.id;
      z.townInfo.gold -= plotChosen.requirements.gold;
      z.townInfo.gold = roundTo(z.townInfo.gold, 2);
      // Immediate variable changes
      z.townInfo.population_count +=
        plotChosen.immediate_variable_changes.population;
      z.townInfo.population_max +=
        plotChosen.immediate_variable_changes.population;
      z.townInfo.happiness += plotChosen.immediate_variable_changes.happiness;
      z.townInfo.health += plotChosen.immediate_variable_changes.health;
      // Effect modifiers
      z.modifiers.happiness = roundTo(
        z.modifiers.happiness * plotChosen.purchase_effect_modifiers.happiness,
        2,
      );
      z.modifiers.health = roundTo(
        z.modifiers.health * plotChosen.purchase_effect_modifiers.health,
        2,
      );
      z.modifiers.community = roundTo(
        z.modifiers.community * plotChosen.purchase_effect_modifiers.community,
        2,
      );
      // Employer modifications
      z.townInfo.employees += plotChosen.requirements.employees;

      // Plot count
      if (
        z.plotCounts[typeIndex] === undefined ||
        z.plotCounts[typeIndex] === null
      ) {
        z.plotCounts[typeIndex] = 0;
      }
      z.plotCounts[typeIndex]++;
      z.lastChangeDay = z.environment.day;

      if (plotChosen.requirements.resources !== undefined) {
        const resourcesForPlot = plotChosen.requirements.resources;
        z.resources.food -= resourcesForPlot.food;
        z.resources.wood -= resourcesForPlot.wood;
        z.resources.stone -= resourcesForPlot.stone;
        z.resources.metal -= resourcesForPlot.metal;
      }

      switch (plotChosen.id) {
        case "city_hall":
          z.hasCityHall = true;
          break;
        case "bank":
          z.hasBank = true;
          break;
        default:
          break;
      }

      analyticsEvent(z, Events.BUILD_PLOT, {
        plot_type: plotChosen.id,
        x: x.toString(),
        y: y.toString(),
        end_goal: z.endGoal,
        day: z.environment.day,
        settings: z.gameSettings.join(","),
      });

      DB.set(z);
      localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));

      // Find and move to next plot
      const nextPlot = findClosestPlot(x, y, z);
      if (nextPlot) {
        const [newX, newY] = nextPlot;
        x = newX;
        y = newY;
        $modifyPlotMenuOptions.x = newX;
        $modifyPlotMenuOptions.y = newY;

        // Scroll to the new plot
        const element = document.querySelector(
          `.plot_container[data-x="${newX}"][data-y="${newY}"]`,
        );
        if (element) {
          const elementRect = element.getBoundingClientRect();
          const containerHeight =
            window.innerHeight || containerElement.clientHeight;
          const containerWidth =
            window.innerWidth || containerElement.clientWidth;

          const scrollTop =
            containerElement.scrollTop +
            elementRect.top -
            containerHeight / 2 +
            225;
          const scrollLeft =
            containerElement.scrollLeft + elementRect.left - containerWidth / 2;

          window.scrollTo({
            top: scrollTop,
            left: scrollLeft,
            behavior: "smooth",
          });

          // Update plot highlighting
          const plots = document.querySelectorAll(".plot_container");
          plots.forEach((plot) => plot.classList.remove("selected"));
          element.classList.add("selected");
        }
      }
    } else {
      tooltip =
        "You do not have enough resources to purchase this plot. If it's a 'Large' plot, make sure you have a 2x2 area available. ";
      const plotOptions = document.querySelectorAll(".plotOption");
      plotOptions.forEach((plotOption) => {
        plotOption.classList.remove("active");
      });
    }
  }

  function canBulldoze(x: number, y: number) {
    if (
      $DB.liege_location != null &&
      x == $DB.liege_location[0] &&
      y == $DB.liege_location[1]
    ) {
      return false;
    }

    if ($modifyPlotMenuOptions.isMineralSource) {
      return false;
    }
    let neighbors = 0;
    if (x > 0) {
      if ($DB.plots[x - 1][y].type !== -1) {
        neighbors++;
      }
    }
    if (x < $DB.plots.length - 1) {
      if ($DB.plots[x + 1][y].type !== -1) {
        neighbors++;
      }
    }
    if (y > 0) {
      if ($DB.plots[x][y - 1].type !== -1) {
        neighbors++;
      }
    }
    if (y < $DB.plots[0].length - 1) {
      if ($DB.plots[x][y + 1].type !== -1) {
        neighbors++;
      }
    }
    if (neighbors <= 4) {
      return true;
    } else {
      return false;
    }
  }

  function clearPlot() {
    const plotOptions = document.querySelectorAll(".plotOption");
    plotOptions.forEach((plotOption) => {
      plotOption.classList.remove("active");
    });
    reverseClear(x, y, $DB);
  }

  // Add keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (!open) return;

    let newPosition: [number, number] | null = null;

    switch (event.key.toLowerCase()) {
      case "arrowup":
      case "w":
        newPosition = findNextValidPosition(
          $modifyPlotMenuOptions.x,
          $modifyPlotMenuOptions.y,
          -1,
          0,
          $DB.plots,
        );
        break;
      case "arrowdown":
      case "s":
        newPosition = findNextValidPosition(
          $modifyPlotMenuOptions.x,
          $modifyPlotMenuOptions.y,
          1,
          0,
          $DB.plots,
        );
        break;
      case "arrowleft":
      case "a":
        newPosition = findNextValidPosition(
          $modifyPlotMenuOptions.x,
          $modifyPlotMenuOptions.y,
          0,
          -1,
          $DB.plots,
        );
        break;
      case "arrowright":
      case "d":
        newPosition = findNextValidPosition(
          $modifyPlotMenuOptions.x,
          $modifyPlotMenuOptions.y,
          0,
          1,
          $DB.plots,
        );
        break;
      default:
        return;
    }

    if (!newPosition) return;

    const [newX, newY] = newPosition;
    $modifyPlotMenuOptions.x = newX;
    $modifyPlotMenuOptions.y = newY;

    // Scroll to the new position
    const element = document.querySelector(
      `.plot_container[data-x="${newX}"][data-y="${newY}"]`,
    );
    if (element) {
      const elementRect = element.getBoundingClientRect();
      const containerHeight =
        window.innerHeight || containerElement.clientHeight;
      const containerWidth = window.innerWidth || containerElement.clientWidth;

      const scrollTop =
        containerElement.scrollTop +
        elementRect.top -
        containerHeight / 2 +
        225;
      const scrollLeft =
        containerElement.scrollLeft + elementRect.left - containerWidth / 2;

      window.scrollTo({
        top: scrollTop,
        left: scrollLeft,
        behavior: "smooth",
      });

      // Update plot highlighting
      const plots = document.querySelectorAll(".plot_container");
      plots.forEach((plot) => plot.classList.remove("selected"));
      element.classList.add("selected");
    }
  }

  onMount(() => {
    containerElement = document.documentElement || document.body;
    window.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleKeydown);
  });
</script>

{#if open && localStorage.getItem(TEMP_GAME_DB_NAME) == null}
  <!-- Add overlay with fade transition -->
  <div
    class="fixed inset-0 bg-black/20 z-[998]"
    on:click={() => ($modifyPlotMenuOptions.visible = false)}
    transition:fade={{ duration: 200 }}
  />

  <div
    class="w-[100vw] fixed bottom-0 max-h-[{BOTTOM_MENU_HEIGHT}]
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
          <div
            class="flex gap-1 pb-24 overflow-scroll max-h-[{BOTTOM_MENU_HEIGHT}]"
          >
            <div>
              <div
                class="flex flex-row text-start justify-start items-start flex-wrap py-8 px-8 max-w-[75vw]
              {$modifyPlotMenuOptions.isMineralSource
                  ? 'pt-6 gap-2'
                  : 'pt-6 gap-2'} w-full align-middle"
              >
                <!-- Filter to show only the "mine" option if isMineralSource is true -->
                {#each reactiveOptions.filter((option) => {
                  if ($modifyPlotMenuOptions.isMineralSource) {
                    return option.id === "mine";
                  } else {
                    return option.id !== "mine";
                  }
                }) as option (option.id)}
                  <PlotTile
                    {option}
                    purchaseCallback={() => {}}
                    isAffordable={checkIfAffordable(option, $DB, x, y)}
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
