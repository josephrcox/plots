<script lang="ts">
  console.log("hello world");
  import { fade, slide } from "svelte/transition";
  import { onMount, onDestroy } from "svelte";
  import {
    roundTo,
    capitalizeFirstLetter,
    isAdjacentToPlots,
    checkIfPlotCanBeUpgraded,
    analyticsEvent,
  } from "./utils";
  import {
    DB,
    ACTIVE_GAME_DB_NAME,
    modifyPlotMenuOptions,
    reverseClear,
    hasPlotOfType,
    showCustomAlert,
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

  // Optimized reactive options
  $: filteredOptions = $DB
    ? PlotTypeOptions.filter((option) => option.id === "mine")
    : [];

  $: baseOptions = $DB
    ? PlotTypeOptions.map((option: PlotOption | any) => ({
        ...option,
        affordable: checkIfAffordable(option, $DB),
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
  function findClosestPlot(startX: number, startY: number, z: Game) {
    // Early return if no valid plots possible
    if (!z || !z.plots || !z.plots.length) return null;

    const maxX = z.plots.length;
    const maxY = z.plots[0].length;

    // Search in expanding squares from the start position
    for (let dist = 1; dist < maxX + maxY; dist++) {
      // Check plots at current distance
      for (let dx = -dist; dx <= dist; dx++) {
        for (let dy = -dist; dy <= dist; dy++) {
          // Only check plots at exactly distance 'dist'
          if (Math.abs(dx) + Math.abs(dy) !== dist) continue;

          const i = startX + dx;
          const j = startY + dy;

          // Skip if out of bounds
          if (i < 0 || i >= maxX || j < 0 || j >= maxY) continue;

          if (
            !z.plots[i][j].active &&
            !z.plots[i][j].mineralSource &&
            !z.plots[i][j].water &&
            !z.plots[i][j].disabled &&
            checkIfPlotCanBeUpgraded(i, j, z)
          ) {
            return [i, j]; // Return first valid plot at this distance
          }
        }
      }
    }

    return null;
  }

  function isSelected(option: PlotOption) {
    return $DB.plots[x][y].type > -1
      ? PlotTypeOptions[$DB.plots[x][y].type].id === option.id
      : false;
  }

  function checkIfAffordable(plotChosen: any, z: Game) {
    let requirementsMet = true;
    let onlyEmploymentFailing = true;

    // Check all non-employment requirements first
    if (plotChosen.requirements.gold > z.townInfo.gold) {
      requirementsMet = false;
      onlyEmploymentFailing = false;
    }

    if (plotChosen.requirements.knowledge !== undefined) {
      if (plotChosen.requirements.knowledge > z.townInfo.knowledge_points) {
        requirementsMet = false;
        onlyEmploymentFailing = false;
      }
    }

    // Check resources
    if (plotChosen.requirements.resources !== undefined) {
      Object.keys(plotChosen.requirements.resources).forEach((resource) => {
        if (
          plotChosen.requirements.resources[resource] != 0 &&
          $DB.resources[resource] < plotChosen.requirements.resources[resource]
        ) {
          requirementsMet = false;
          onlyEmploymentFailing = false;
        }
      });
    }

    // Now check employment separately
    let availableEmployees = z.townInfo.population_count - z.townInfo.employees;
    if (
      plotChosen.requirements.employees !== undefined &&
      plotChosen.requirements.employees > 0
    ) {
      const existingPlot = z.plots[x][y];
      if (existingPlot.type !== -1) {
        const existingPlotType = PlotTypeOptions[existingPlot.type];
        const existingEmployees = existingPlotType.requirements.employees || 0;

        // If this is the only failing requirement and the employment matches
        if (
          onlyEmploymentFailing &&
          plotChosen.requirements.employees <= existingEmployees
        ) {
          requirementsMet = true;
        } else if (
          plotChosen.requirements.employees >
          availableEmployees + existingEmployees
        ) {
          requirementsMet = false;
        }
      } else if (plotChosen.requirements.employees > availableEmployees) {
        requirementsMet = false;
      }
    }

    // Check active costs
    if (plotChosen.active_costs !== undefined) {
      if (plotChosen.active_costs.gold > z.townInfo.gold) {
        requirementsMet = false;
        onlyEmploymentFailing = false;
      } else if (plotChosen.active_costs.power > z.resources.power) {
        requirementsMet = false;
        onlyEmploymentFailing = false;
      } else if (plotChosen.active_costs.wood > z.resources.wood) {
        requirementsMet = false;
        onlyEmploymentFailing = false;
      } else if (plotChosen.active_costs.stone > z.resources.stone) {
        requirementsMet = false;
        onlyEmploymentFailing = false;
      } else if (plotChosen.active_costs.metal > z.resources.metal) {
        requirementsMet = false;
        onlyEmploymentFailing = false;
      } else if (
        plotChosen.active_costs.bureaucracy > z.resources.bureaucracy
      ) {
        requirementsMet = false;
        onlyEmploymentFailing = false;
      } else if (plotChosen.active_costs.food > z.resources.food) {
        requirementsMet = false;
        onlyEmploymentFailing = false;
      }
    }

    // check if the user has the required plots
    if (plotChosen.requirements.plots.length > 0) {
      plotChosen.requirements.plots.forEach((plot: string) => {
        if (hasPlotOfType(plot, z).length === 0) {
          requirementsMet = false;
          onlyEmploymentFailing = false;
        }
      });
    }

    return requirementsMet;
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

    if (checkIfAffordable(plotChosen, z)) {
      if (z.plots[x][y].type !== -1) {
        reverseClear(x, y, z);
      }

      tooltip = "";
      z.plots[x][y].type = typeIndex;
      z.plots[x][y].active = true;
      z.plots[x][y].referencePlot = [];
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
        z.modifiers.happiness * plotChosen.effect_modifiers.happiness,
        2,
      );
      z.modifiers.health = roundTo(
        z.modifiers.health * plotChosen.effect_modifiers.health,
        2,
      );
      z.modifiers.community = roundTo(
        z.modifiers.community * plotChosen.effect_modifiers.community,
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

  function purchasePlot(
    x: number,
    y: number,
    typeID: string,
    override = false,
  ) {
    let z = $DB;
    // get the index from the typeID
    const typeIndex = options.findIndex((option) => option.id === typeID);
    // bulleted list of requirement keys and values
    const list = Object.entries(options[typeIndex].requirements).map(
      ([key, value]) => {
        return `<li>${capitalizeFirstLetter(key)}: ${value}</li>`;
      },
    );

    let plotChosen = options[typeIndex];

    //// We may do this eventually but not now :)
    if (checkIfAffordable(plotChosen, $DB) == false) {
      return showCustomAlert.set(
        `You can not afford this.
        <br/><br/>
        ${list}`,
      );
    }

    // check if the plot has required adjacent_plots
    if (plotChosen.requirements.adjacent_plots !== undefined && !override) {
      let adjacentPlots = plotChosen.requirements.adjacent_plots;
      let adjacentPlotsMet = isAdjacentToPlots(
        x,
        y,
        z,
        plotChosen.requirements.adjacent_plots,
      );
      if (adjacentPlotsMet === false) {
        return showCustomAlert.set(
          `This plot requires adjacent plots of type: ${adjacentPlots.join(
            ", ",
          )}`,
        );
      }
    }

    // go over requirements
    let requirementsMet = true;
    if (
      plotChosen.requirements.gold > z.townInfo.gold ||
      plotChosen.requirements.employees >
        z.townInfo.population_count - z.townInfo.employees
    ) {
      requirementsMet = false;
    }

    if (
      (plotChosen.requirements.size != null &&
        plotChosen.requirements.size != 1 &&
        requirementsMet) ||
      !override
    ) {
      // Usually, plots only take up one plot. If they specify a size, then they take up at least a 2x2 square.
      // Check if there is room for the larger plot to be placed, and then set the plots around it in the square to be unusable.
      let size = plotChosen.requirements.size;
      let possibleSquares = [];
      let isSchool =
        PlotTypeOptions[typeIndex].title.toLowerCase().indexOf("school") != -1;

      for (let i = 0; i < 4; i++) {
        let square = [[x, y]];

        if (i === 0) {
          square.push([x - (size - 1), y - (size - 1)]);
          square.push([x - (size - 1), y]);
          square.push([x, y - (size - 1)]);
        } else if (i === 1) {
          square.push([x, y - (size - 1)]);
          square.push([x + (size - 1), y - (size - 1)]);
          square.push([x + (size - 1), y]);
        } else if (i === 2) {
          square.push([x - (size - 1), y]);
          square.push([x - (size - 1), y + (size - 1)]);
          square.push([x, y + (size - 1)]);
        } else if (i === 3) {
          square.push([x, y + (size - 1)]);
          square.push([x + (size - 1), y + (size - 1)]);
          square.push([x + (size - 1), y]);
        }
        possibleSquares.push(square);
      }

      // Check if any of the possible squares have entirely active==false plots that are within the bounds of the map.
      possibleSquares = possibleSquares.filter((square) => {
        return square.every((plot) => {
          return (
            plot[0] >= 0 &&
            plot[0] <= z.plots.length - 1 &&
            plot[1] >= 0 &&
            plot[1] <= z.plots.length - 1 &&
            !z.plots[plot[0]][plot[1]].active &&
            checkIfPlotCanBeUpgraded(plot[0], plot[1], z) == true
          );
        });
      });
      if (possibleSquares.length === 0) {
        requirementsMet = false;
      } else if (possibleSquares.length > 0) {
        let chosenSquare = possibleSquares[0];
        chosenSquare.forEach((plot) => {
          z.plots[plot[0]][plot[1]].active = true;
          z.plots[plot[0]][plot[1]].type = isSchool ? -3 : -2; // This is marking them as unusable.
          z.plots[plot[0]][plot[1]].referencePlot = [x, y];
        });
      }
    }

    if (requirementsMet === true || override) {
      // Check if the plot is already set to a type. If so, reverse the effects of that type.
      if (z.plots[x][y].type !== -1) {
        reverseClear(x, y, z);
      }

      tooltip = "";
      z.plots[x][y].type = typeIndex;
      z.plots[x][y].active = true;
      z.plots[x][y].referencePlot = [];
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
        z.modifiers.happiness * plotChosen.effect_modifiers.happiness,
        2,
      );
      z.modifiers.health = roundTo(
        z.modifiers.health * plotChosen.effect_modifiers.health,
        2,
      );
      z.modifiers.community = roundTo(
        z.modifiers.community * plotChosen.effect_modifiers.community,
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

      // Add analytics event for plot purchase
      analyticsEvent($DB, Events.BUILD_PLOT, {
        plot_type: plotChosen.id,
        x: x.toString(),
        y: y.toString(),
        difficulty: z.difficulty,
        end_goal: z.endGoal,
        settings: z.settings.join(","),
      });

      DB.set(z);
      localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));

      // Find the next closest available and upgradable plot
      let closestDistance = Infinity;
      let closestPlot = null;

      for (let i = 0; i < z.plots.length; i++) {
        for (let j = 0; j < z.plots[i].length; j++) {
          if (
            !z.plots[i][j].active &&
            !z.plots[i][j].mineralSource &&
            !z.plots[i][j].water &&
            !z.plots[i][j].disabled &&
            checkIfPlotCanBeUpgraded(i, j, z)
          ) {
            // Calculate Manhattan distance from current plot
            const distance = Math.abs(i - x) + Math.abs(j - y);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestPlot = [i, j];
            }
          }
        }
      }

      if (closestPlot) {
        x = closestPlot[0];
        y = closestPlot[1];
        $modifyPlotMenuOptions.x = x;
        $modifyPlotMenuOptions.y = y;

        // Scroll to the new plot
        const element = document.querySelector(
          `.plot_container[data-x="${x}"][data-y="${y}"]`,
        );
        if (element) {
          const container = document.documentElement || document.body;
          const elementRect = element.getBoundingClientRect();
          const containerHeight = window.innerHeight || container.clientHeight;
          const containerWidth = window.innerWidth || container.clientWidth;

          const scrollTop =
            container.scrollTop + elementRect.top - containerHeight / 2 + 225;
          const scrollLeft =
            container.scrollLeft + elementRect.left - containerWidth / 2;

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
      // Keep the menu open by not setting visible to false
      // $modifyPlotMenuOptions.visible = false;
    } else {
      tooltip =
        "You do not have enough resources to purchase this plot. If it's a 'Large' plot, make sure you have a 2x2 area available. ";
      const plotOptions = document.querySelectorAll(".plotOption");
      plotOptions.forEach((plotOption) => {
        plotOption.classList.remove("active");
      });
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

{#if open}
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
                class="flex flex-row text-start justify-start items-start flex-wrap py-8
              {$modifyPlotMenuOptions.isMineralSource
                  ? 'pt-6 gap-2'
                  : 'pt-6 gap-2'} w-full align-middle"
              >
                <!-- Filter to show only the "mine" option if isMineralSource is true -->
                {#if checkIfPlotCanBeUpgraded($modifyPlotMenuOptions.x, $modifyPlotMenuOptions.y, $DB)}
                  {#each reactiveOptions.filter( (option) => ($modifyPlotMenuOptions.isMineralSource ? option.id === "mine" : true), ) as option (option.id)}
                    <PlotTile
                      {option}
                      purchaseCallback={() => {}}
                      canPurchase={option.affordable ?? false}
                    />
                  {/each}
                {:else}
                  <div class="text-white font-semibold">
                    You can only expand your kingdom through adjacent plots.
                    Select one of the <span class="text-yellow-500 bold"
                      >yellow</span
                    > plots.
                  </div>
                {/if}
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
  /*  */
</style>
