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
  } from "./utils";
  import {
    DB,
    ACTIVE_GAME_DB_NAME,
    modifyPlotMenuOptions,
    reverseClear,
    hasPlotOfType,
    showOnlyAffordable,
    toggleShowOnlyAffordable,
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

  export let option: PlotOption;
  export let checkRequirements: boolean = true;

  function getRequirementString(
    icon: string,
    required: number,
    current: number,
  ) {
    if (required == 0 || required == null)
      return "<span class='hidden'></span>";
    let s = "";
    let classText = "";
    if (current < required && checkRequirements) {
      classText = "text-textDanger1 border-2 border-red-400";
    }
    s = `<span class='${classText}'>${icon} ${required}</span>`;

    return s;
  }

  function getEmojiForResource(resource: string) {
    switch (resource) {
      case "food":
        return "🥕";
      case "knowledge":
        return "🧠";
      case "wood":
        return "🪵";
      case "stone":
        return "🪨";
      case "metal":
        return "🧲";
      case "power":
        return "🔋";
      case "bureaucracy":
        return "🧑‍⚖️";
      default:
        return "💰";
    }
  }
</script>

{#if option != null}
  <div class="flex flex-col gap-2">
    <span class="text-md">{options[getOptionIndex(option.id)].title}</span>
    <span class="text-xs">{options[getOptionIndex(option.id)].description}</span
    >
  </div>

  <div class="flex flex-col w-36 h-min gap-0 text-xs">
    <Separator class={"bg-secondary opacity-25 mt-1 mb-1"} />
    <span class="font-semibold">Requirements</span>
    <div class="flex flex-col gap-1">
      {@html getRequirementString(
        "💰",
        options[getOptionIndex(option.id)].requirements.gold,
        $DB.townInfo.gold,
      )}
      {@html getRequirementString(
        "🥕",
        options[getOptionIndex(option.id)].requirements.resources.food,
        $DB.resources.food,
      )}
      {@html getRequirementString(
        "🧠",
        options[getOptionIndex(option.id)].requirements.knowledge,
        $DB.townInfo.knowledge_points,
      )}
      {@html getRequirementString(
        "🪵",
        options[getOptionIndex(option.id)].requirements.resources.wood,
        $DB.resources.wood,
      )}
      {@html getRequirementString(
        "🪨",
        options[getOptionIndex(option.id)].requirements.resources.stone,
        $DB.resources.stone,
      )}
      {@html getRequirementString(
        "🧲",
        options[getOptionIndex(option.id)].requirements.resources.metal,
        $DB.resources.metal,
      )}
      {@html getRequirementString(
        "🔋",
        options[getOptionIndex(option.id)].active_costs.power,
        $DB.resources.power,
      )}
      {@html getRequirementString(
        "🧑‍⚖️",
        options[getOptionIndex(option.id)].requirements.resources.bureaucracy,
        $DB.resources.bureaucracy,
      )}
      {#if options[getOptionIndex(option.id)].requirements.employees != 0}
        <span
          class={options[getOptionIndex(option.id)].requirements.employees >
            $DB.townInfo.population_count - $DB.townInfo.employees &&
          checkRequirements
            ? "px-1 text-textDanger1 font-bold border-2 border-red-400"
            : ""}
          >👥 {options[getOptionIndex(option.id)].requirements.employees} employees
        </span>
      {/if}
    </div>
  </div>
  {#if options[getOptionIndex(option.id)].revenue_per_week != 0}
    <div class="flex flex-col gap-1 text-xs">
      <Separator class={"bg-secondary opacity-25 mt-0"} />
      <span class="font-semibold">Weekly revenue</span>
      <span>💰 {options[getOptionIndex(option.id)].revenue_per_week} </span>
    </div>
  {/if}
  <!-- Modifiers -->
  <!-- {#if Object.values(options[getOptionIndex(option.id)].effect_modifiers).some((value) => value != 1)}
    <div class="flex flex-col gap-1 text-xs">
      <Separator class={"bg-secondary opacity-25 mt-2"} />
      <span class="font-semibold">Effect modifiers</span>
      {#each Object.keys(options[getOptionIndex(option.id)].effect_modifiers) as key, index}
        {#if Object.values(options[getOptionIndex(option.id)].effect_modifiers)[index] != 1}
          <span
            class={Object.values(
              options[getOptionIndex(option.id)].effect_modifiers,
            )[index] > 1
              ? "text-textHappyDark"
              : "text-textDanger1"}
            >{capitalizeFirstLetter(key)}
            {formatModifier(
              Object.values(
                options[getOptionIndex(option.id)].effect_modifiers,
              )[index],
            )}
          </span>
        {/if}
      {/each}
    </div>
  {/if} -->
  <!-- Instant changes -->
  <!-- {#if Object.values(options[getOptionIndex(option.id)].immediate_variable_changes).some((value) => value != 0)}
    <div class="flex flex-col gap-1 text-xs">
      <Separator class={"bg-secondary opacity-25 mt-2"} />
      <span class="font-semibold">Instant changes</span>
      {#each Object.keys(options[getOptionIndex(option.id)].immediate_variable_changes) as key, index}
        {#if Object.values(options[getOptionIndex(option.id)].immediate_variable_changes)[index] != 0}
          <span
            class={Object.values(
              options[getOptionIndex(option.id)].immediate_variable_changes,
            )[index] > 0
              ? "text-textHappyDark"
              : "text-textDanger1"}
            >{capitalizeFirstLetter(key)}
            {formatInstantChange(
              Object.values(
                options[getOptionIndex(option.id)].immediate_variable_changes,
              )[index],
              key != "population",
            )}
          </span>
        {/if}
      {/each}
    </div>
  {/if} -->
  {#if Object.values(options[getOptionIndex(option.id)].active_costs).some((value) => value != 0)}
    <div class="flex flex-col gap-1 text-xs">
      <Separator class={"bg-secondary opacity-25 mt-2"} />
      <span class="font-semibold">Weekly Costs</span>
      {#each Object.keys(options[getOptionIndex(option.id)].active_costs) as key, index}
        {#if Object.values(options[getOptionIndex(option.id)].active_costs)[index] != 0}
          <span
            class={Object.values(
              options[getOptionIndex(option.id)].active_costs,
            )[index] > 0
              ? "text-textDanger1"
              : "text-textHappyDark"}
            >{capitalizeFirstLetter(key)}
            {getEmojiForResource(key)}
            {-1 *
              Object.values(options[getOptionIndex(option.id)].active_costs)[
                index
              ]}
          </span>
        {/if}
      {/each}
    </div>
  {/if}
  {#if Object.values(options[getOptionIndex(option.id)].generated_resources).some((value) => value != 0)}
    <div class="flex flex-col gap-1 text-xs">
      <Separator class={"bg-secondary opacity-25 mt-2"} />
      <span class="font-semibold">Generated Resources</span>
      {#each Object.keys(options[getOptionIndex(option.id)].generated_resources) as key, index}
        {#if Object.values(options[getOptionIndex(option.id)].generated_resources)[index] != 0}
          <span
            class={Object.values(
              options[getOptionIndex(option.id)].generated_resources,
            )[index] > 0
              ? "text-textHappyDark"
              : "text-textDanger1"}
          >
            {getEmojiForResource(key)}
            {capitalizeFirstLetter(key)}
            {formatInstantChange(
              Object.values(
                options[getOptionIndex(option.id)].generated_resources,
              )[index],
              false,
            )}
          </span>
        {/if}
      {/each}
    </div>
  {/if}
{/if}
