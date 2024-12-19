<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { Separator } from "$lib/components/ui/separator";
  import {
    firstEmoji,
    getOptionIndex,
    formatModifier,
    formatNumber,
    roundTo,
    formatInstantChange,
    capitalizeFirstLetter,
    isAdjacentToPlots,
  } from "./utils";
  import {
    DB,
    ACTIVE_GAME_DB_NAME,
    modifyPlotMenuOptions,
    reverseClear,
    hasPlotOfType,
    showCustomAlert,
    paused,
  } from "./store";
  import {
    getColor,
    options,
    plotTypeMaximums,
  } from "./objects/PlotTypeOptions";
  import { Game, PlotOption } from "./types";
  // @ts-ignore
  import RightSidebar from "./RightSidebar.svelte";
  import PlotTile from "./components/PlotTile.svelte";

  export let x = 0;
  export let y = 0;
  export let open = false;
  export let tooltip = "";
  let PlotTypeOptions = options;

  const BOTTOM_MENU_HEIGHT = "50vh";

  let reactiveOptions: PlotOption[] = PlotTypeOptions.map(
    (option: PlotOption | any) => ({
      ...option,
      affordable: checkIfAffordable(option, $DB),
      selected: isSelected(option),
    }),
  );

  $: if ($DB) {
    reactiveOptions = PlotTypeOptions.map((option: PlotOption | any) => ({
      ...option,
      affordable: checkIfAffordable(option, $DB),
      selected: isSelected(option),
    }));
    // if hasPlotOfType('tree_farm').length == 0, then only show small home, farm, and tree farm
    if (hasPlotOfType("tree_farm", $DB).length === 0) {
      reactiveOptions = reactiveOptions.filter(
        (option) =>
          option.id === "small_homes" ||
          option.id === "farm" ||
          option.id === "tree_farm",
      );
    }

    if ($modifyPlotMenuOptions.isMineralSource) {
      reactiveOptions = reactiveOptions.filter(
        (option) => option.id === "mine",
      );
    }
    // if a plot has selected: true then put it at index 0
    // iterate over plotTypeMaximums and remove any options that are at their maximum.
    // If 'lab': 1, then make sure that if hasPlotOfType('lab') > 0, then remove that option from the list.
    Object.keys(plotTypeMaximums).forEach((key) => {
      let max = plotTypeMaximums[key];
      if (max > 0) {
        let count = hasPlotOfType(key, $DB).length;
        reactiveOptions = reactiveOptions.filter((option) => {
          return option.id !== key || count < max;
        });
      }
    });
    reactiveOptions.sort((a, b) => {
      if (a.selected && !b.selected) return -1;
      return 0;
    });
    if (!$modifyPlotMenuOptions.isMineralSource) {
      reactiveOptions = reactiveOptions.filter(
        (option) => option.id !== "mine",
      );
    }
  }

  function isSelected(option: PlotOption) {
    return $DB.plots[x][y].type > -1
      ? PlotTypeOptions[$DB.plots[x][y].type].id === option.id
      : false;
  }

  function checkIfAffordable(plotChosen: any, z: Game) {
    let requirementsMet = true;

    if (plotChosen.requirements.gold > z.townInfo.gold) {
      requirementsMet = false;
    }
    let availableEmployees = z.townInfo.population_count - z.townInfo.employees;
    if (
      plotChosen.requirements.employees !== undefined &&
      plotChosen.requirements.employees > 0
    ) {
      if (plotChosen.requirements.employees > availableEmployees) {
        requirementsMet = false;
      }
    }
    if (plotChosen.requirements.knowledge !== undefined) {
      if (plotChosen.requirements.knowledge > z.townInfo.knowledge_points) {
        requirementsMet = false;
      }
    }
    // Iterate over keys in plotChosen.requirements.resources
    if (plotChosen.requirements.resources !== undefined) {
      Object.keys(plotChosen.requirements.resources).forEach((resource) => {
        if (
          plotChosen.requirements.resources[resource] != 0 &&
          $DB.resources[resource] < plotChosen.requirements.resources[resource]
        ) {
          requirementsMet = false;
        }
      });
    }

    if (plotChosen.active_costs !== undefined) {
      if (plotChosen.active_costs.gold > z.townInfo.gold) {
        requirementsMet = false;
      } else if (plotChosen.active_costs.power > z.resources.power) {
        requirementsMet = false;
      } else if (plotChosen.active_costs.wood > z.resources.wood) {
        requirementsMet = false;
      } else if (plotChosen.active_costs.stone > z.resources.stone) {
        requirementsMet = false;
      } else if (plotChosen.active_costs.metal > z.resources.metal) {
        requirementsMet = false;
      } else if (
        plotChosen.active_costs.bureaucracy > z.resources.bureaucracy
      ) {
        requirementsMet = false;
      } else if (plotChosen.active_costs.food > z.resources.food) {
        requirementsMet = false;
      }
    }

    // check if the user has the required plots
    if (plotChosen.requirements.plots.length > 0) {
      plotChosen.requirements.plots.forEach((plot: string) => {
        if (hasPlotOfType(plot, z).length === 0) {
          requirementsMet = false;
        }
      });
    }

    return requirementsMet;
  }

  function handlePlotOptionClick(event: any) {
    const plotOption = event.target.closest(".plotOption");

    if (plotOption) {
      const plotOptionID = plotOption.dataset.plotoptionid;
      choosePlotOption(plotOptionID);
    }
  }

  function choosePlotOption(id: string) {
    const plotOptions = document.querySelectorAll(".plotOption");
    plotOptions.forEach((plotOption) => {
      plotOption.classList.remove("active");
    });

    const plotOption = document.querySelector(`[data-plotoptionid="${id}"]`);
    if (plotOption) {
      plotOption.classList.add("active");
      purchasePlot(x, y, id);
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
            checkIfPlotCanBeUpgraded(plot[0], plot[1]) == true
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

      function checkIfPlotCanBeUpgraded(x: number, y: number) {
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
          {
            x: plot.x - 1,
            y: plot.y,
          },
          {
            x: plot.x + 1,
            y: plot.y,
          },
          {
            x: plot.x,
            y: plot.y - 1,
          },
          {
            x: plot.x,
            y: plot.y + 1,
          },
        ];

        return adjacentPlots.some((adjacentPlot) => {
          if (
            adjacentPlot.x < 0 ||
            adjacentPlot.x > $DB.plots.length - 1 ||
            adjacentPlot.y < 0 ||
            adjacentPlot.y > $DB.plots.length - 1
          ) {
            return false;
          }
          const adjacentPlotData = $DB.plots[adjacentPlot.x][adjacentPlot.y];
          return adjacentPlotData.active;
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

      DB.set(z);
      localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));

      // Select the next plot
      let found = false;
      for (let i = x; i < z.plots.length; i++) {
        for (let j = y; j < z.plots[i].length; j++) {
          if (
            z.plots[i][j].active === false &&
            z.plots[i][j].mineralSource == false &&
            z.plots[i][j].water == false
          ) {
            x = i;
            y = j;
            found = true;
            break;
          }
        }
        if (found) {
          break;
        }
      }
      $modifyPlotMenuOptions.x = x;
      $modifyPlotMenuOptions.y = y;
      $modifyPlotMenuOptions.visible = false;
    } else {
      tooltip =
        "You do not have enough resources to purchase this plot. If it's a 'Large' plot, make sure you have a 2x2 area available. ";
      const plotOptions = document.querySelectorAll(".plotOption");
      plotOptions.forEach((plotOption) => {
        plotOption.classList.remove("active");
      });
    }
  }

  function checkIfPlotCanBeUpgraded(arg0: number, arg1: number) {
    throw new Error("Function not implemented.");
  }

  function clearPlot() {
    const plotOptions = document.querySelectorAll(".plotOption");
    plotOptions.forEach((plotOption) => {
      plotOption.classList.remove("active");
    });
    reverseClear(x, y, $DB);
  }
</script>

{#if open}
  <div
    class="w-[100vw] fixed bottom-[-5px] max-h-[{BOTTOM_MENU_HEIGHT}]
     z-50 flex flex-row justify-center text-center items-center bg-popupBackground text-sidebarText px-4
      align-bottom
      shadow-2xl rounded-t-2xl
      "
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
                {#each reactiveOptions.filter( (option) => ($modifyPlotMenuOptions.isMineralSource ? option.id === "mine" : true), ) as option (option.id)}
                  <PlotTile
                    {option}
                    purchaseCallback={handlePlotOptionClick}
                    canPurchase={option.affordable ?? false}
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
  /*  */
</style>
