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
    showOnlyAffordable,
    toggleShowOnlyAffordable,
    showCustomAlert,
  } from "./store";
  import {
    getColor,
    options,
    plotTypeMaximums,
  } from "./objects/PlotTypeOptions";
  import { Game, PlotOption } from "./types";
  import { Input } from "$lib/components/ui/input";
  import { onMount } from "svelte";
  import { Button } from "./components/ui/button";
  import PlotTooltip from "./PlotTooltip.svelte";

  export let x = 0;
  export let y = 0;
  export let open = false;
  export let tooltip = "";
  let searchQuery = "";
  let PlotTypeOptions = options;

  let searchInput: any;
  let totalAffordableOptionsCount: number;

  const BOTTOM_MENU_HEIGHT = Math.round(window.innerHeight * 0.2) + "px";

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
      // only show if ID is "mine"
      reactiveOptions = reactiveOptions.filter(
        (option) => option.id === "mine",
      );
    }
    if ($showOnlyAffordable) {
      reactiveOptions = reactiveOptions.filter((option) => option.affordable);
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
  }

  $: reactiveOptions = reactiveOptions.filter((option) =>
    option.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  function handleInput(event: any) {
    searchQuery = (event.target.value as string) || "";
  }

  function isSelected(option: PlotOption) {
    return $DB.plots[x][y].type > -1
      ? PlotTypeOptions[$DB.plots[x][y].type].id === option.id
      : false;
    return false;
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

  function purchasePlot(x: number, y: number, typeID: string) {
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
    // if (checkIfAffordable(plotChosen, $DB) == false) {
    //   return showCustomAlert.set(
    //     `You can not afford this.
    //     <br/><br/>
    //     ${list}`,
    //   );
    // }

    // check if the plot has required adjacent_plots
    if (plotChosen.requirements.adjacent_plots !== undefined) {
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
      plotChosen.requirements.size != null &&
      plotChosen.requirements.size != 1 &&
      requirementsMet
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

    if (requirementsMet === true) {
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
    class="w-[100vw] fixed bottom-0 h-[{BOTTOM_MENU_HEIGHT}]
    p-1 z-50 flex flex-col justify-center text-center items-center"
  >
    <div
      class="
        text-xl
        items-center justify-center
        w-[90%]
        align-bottom
        bg-foreground
        border-4 border-gray-400 shadow-2xl rounded-t-xl
        py-2

        "
    >
      <!-- content -->
      <div
        class="flex flex-col gap-2 px-2 justify-end"
        on:click={handlePlotOptionClick}
      >
        <div class="text-sm">
          <div
            class="flex flex-row w-full
		"
          >
            <div
              class="
			flex items-end
			"
            >
              <Input
                type="text"
                autofocus
                id="search-bar"
                placeholder="Search Plot Options..."
                value={searchQuery}
                on:input={handleInput}
                bind:this={searchInput}
                class="border rounded w-auto bg-white placeholder-black text-black text-xs"
              />
            </div>
            <!-- toggle to only show affordable ones -->
            <div class="flex items-center ml-4">
              <input
                type="checkbox"
                id="toggle-affordable"
                class="rounded"
                on:change={() => {
                  toggleShowOnlyAffordable();
                }}
                checked={$showOnlyAffordable}
              />
              <label
                for="toggle-affordable"
                class="ml-2
					no-select cursor-pointer
				
				">Buildable</label
              >
            </div>
            <div class="flex justify-end ml-6">
              {#if $DB.plots[x][y].type !== -1 && canBulldoze(x, y)}
                <button
                  on:click={clearPlot}
                  id="bulldoze"
                  class="px-2 py-2 bg-red-500 rounded hover:bg-red-600 transition duration-300 ease-in-out"
                  >❌ Bulldoze</button
                >
              {/if}
            </div>
          </div>
        </div>

        <div
          class="flex flex-col {$modifyPlotMenuOptions.isMineralSource ||
          searchQuery.length > 0
            ? 'gap-0 pt-0'
            : 'gap-4'} w-full overflow-y-scroll h-72 pb-24"
        >
          {#each $modifyPlotMenuOptions.isMineralSource || searchQuery.length > 0 ? [1] : hasPlotOfType("tree_farm", $DB).length != 0 ? [1, 2, 3, 4] : [1] as level}
            <div>
              {#if searchQuery.length == 0 && !$modifyPlotMenuOptions.isMineralSource}
                <div class="text-sm font-extralight pb-3">Level {level}</div>
              {/if}
              <div
                class="flex flex-row text-start justify-start items-start flex-wrap
                  {$modifyPlotMenuOptions.isMineralSource ||
                searchQuery.length > 0
                  ? 'pt-0 gap-0'
                  : 'pt-2 gap-4'}
                 w-full align-middle"
              >
                {#each searchQuery.length == 0 && !$modifyPlotMenuOptions.isMineralSource ? reactiveOptions.filter((option) => option.level === level) : reactiveOptions as option (option.id)}
                  <Tooltip.Root openDelay={400} closeDelay={0}>
                    <Tooltip.Trigger>
                      <div
                        class="plotOption cursor-pointer min-w-40
                                          {$modifyPlotMenuOptions.isMineralSource ||
                        searchQuery.length > 0
                          ? 'mx-1 my-2'
                          : ''}
                        relative h-[120px] rounded-xl flex flex-col align-middle transition-all duration-100
            {option.affordable || option.selected
                          ? 'cursor-pointer'
                          : 'opacity-40 cursor-not-allowed '}
            {option.selected
                          ? 'border-4 border-yellow-200 opacity-100 rounded-none'
                          : ''} "
                        data-plotoptionid={option.id}
                        style="background-color: {getColor(
                          getOptionIndex(option.id),
                          true,
                        )}"
                      >
                        <div class="pt-2">
                          <span class="text-md text-center">
                            {!option.selected ? firstEmoji(option.title) : "✅"}
                          </span>
                          <span class="text-xs text-center font-bold mx-1">
                            {option.title.substring(2)}
                          </span>
                        </div>
                        {#if option.active_costs.power > 0}
                          <span
                            class="bg-yellow-300 text-xs text-black tex px-1 py-0.5 rounded-2xl absolute top-[-5px] right-[-2px]"
                            >🔋{option.active_costs.power}
                          </span>
                        {/if}
                        {#if hasPlotOfType(option.id, $DB).length > 0}
                          <span
                            class="bg-black text-xs text-white tex px-1 py-0.5 rounded-2xl absolute top-[-5px] left-[-2px]"
                            >x{hasPlotOfType(option.id, $DB).length}
                          </span>
                        {/if}
                        <span
                          style={option.styling}
                          class="text-xs text-center pt-4"
                        >
                          Costs 💰 {formatNumber(
                            option.requirements.gold,
                            false,
                          )}

                          {#if option.revenue_per_week > 0}
                            <br />
                            Makes 💰 {formatNumber(
                              option.revenue_per_week,
                              false,
                            )}/week
                          {/if}

                          {#if option.requirements.employees > 0}
                            <br />
                            Employs {formatNumber(
                              option.requirements.employees,
                              false,
                            )}
                          {/if}
                        </span>
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      <PlotTooltip {option} />
                    </Tooltip.Content>
                  </Tooltip.Root>
                {/each}

                {#if reactiveOptions.filter((option) => option.level === level).length === 0 && searchQuery.length == 0 && !$modifyPlotMenuOptions.isMineralSource}
                  <span class="text-sm pt-2">No plots available!</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /*  */
</style>
