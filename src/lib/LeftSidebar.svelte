<script lang="ts">
  import { roundTo } from "./utils";

  import {
    DB,
    modifyPlotMenuOptions,
    settingLiegeLocation,
    showCityHallMenu,
    showKnowledgeMenu,
    showLabMenu,
    hasPlotOfType,
    isReadOnly,
  } from "./store";
  import Slider from "./components/ui/slider/slider.svelte";
  import { Vibe } from "./types";
  import SimpleButton from "./components/SimpleButton.svelte";

  $: hasLab = hasPlotOfType("lab", $DB!).length >= 1;

  function showTheLabMenu() {
    if (hasLab) showLabMenu.set(true);
  }

  function setProductivity(newProductivity: number[]) {
    $DB!.townInfo.productivity = roundTo(newProductivity[0], 2);
  }

  function setTaxRate(newRate: number[]) {
    $DB!.economyAndLaws.tax_rate = roundTo(newRate[0], 2);
  }
</script>

<div
  class="flex flex-row text-sidebarText bg-sidebarBackground overflow-clip {$modifyPlotMenuOptions.visible
    ? 'opacity-10'
    : ''}"
>
  <div
    class="w-[220px] text-sidebarText bg-sidebarBackground overflow-scroll border-foregroundDark border-4 bottom-4
		z-10 fixed left-3 py-2 top-16 drop-shadow-xl rounded-xl transition-all duration-300"
  >
    <div class="flex flex-col justify-center mx-2 gap-4">
      <div
        class="flex flex-col gap-2 rounded-xl text-center justify-center mb-2 mt-0 pt-2"
      >
        <div
          class="flex flex-col justify-center w-full text-center items-center gap-1
        min-h-12 pb-2 rounded-xl"
        >
          <div class="mb-1">
            <span class="text-sm">Tax Rate</span>
            <span class="text-sm"
              >{roundTo($DB.economyAndLaws.tax_rate * 100, 0)}%</span
            >
          </div>
          <Slider
            value={[$DB.economyAndLaws.tax_rate]}
            onValueChange={setTaxRate}
            min={0}
            max={0.5}
            step={0.05}
            disabled={isReadOnly}
            class="cursor-pointer w-[75%]"
          />
        </div>
        <div
          class="flex flex-col justify-center w-full text-center items-center gap-2"
        >
          <div class="mb-1">
            <span class="text-sm">Productivity</span>
            <span class="text-sm">{roundTo($DB.townInfo.productivity, 0)}%</span
            >
          </div>
          <Slider
            value={[$DB.townInfo.productivity]}
            onValueChange={setProductivity}
            min={0}
            max={200}
            step={5}
            disabled={isReadOnly}
            class="cursor-pointer w-[75%]"
          />
        </div>
      </div>
      <div>
        <div class="flex flex-col gap-2">
          <SimpleButton
            text={!$settingLiegeLocation
              ? "👑 Set your location (boost)"
              : "Select an active plot!"}
            onOpen={function () {
              $settingLiegeLocation = !$settingLiegeLocation;
            }}
          />

          <SimpleButton
            text="🧠 Sell Knowledge"
            onOpen={function () {
              $showKnowledgeMenu = !$showKnowledgeMenu;
            }}
          />
          <SimpleButton
            text="🏢 Manage City"
            onOpen={function () {
              $showCityHallMenu = !$showCityHallMenu;
            }}
          />
          <SimpleButton
            text={$DB.lab.active_experiment !== null
              ? `🧪 ${$DB.lab.active_experiment.duration} days left`
              : "🧪 Manage Lab"}
            onOpen={showTheLabMenu}
            opacity={hasLab ? 100 : 30}
            onHoverText={hasLab
              ? ""
              : "Build a Lab to perform experiments. Experiments can save lives, make money, or generally improve your town."}
          />
        </div>
      </div>
      <div>
        <div class="overflow-y-scroll h-[100%] w-[100%] pb-4 scroll-smooth">
          {#each $DB.townLog as log}
            <div
              class=" px-2 py-2 rounded-2xl fade-in mb-4
        {log.vibe == Vibe.BAD
                ? 'bg-white text-textDanger border '
                : log.vibe == Vibe.GOOD
                  ? 'bg-green-300'
                  : log.vibe == Vibe.NORMAL
                    ? 'bg-accent'
                    : 'bg-accent'}
      
      "
            >
              <p
                class="font-mono text-[10px]
          "
              >
                DAY {log.day}
              </p>
              <p class="text-xs">{log.message}</p>
            </div>
          {/each}
        </div>
      </div>
    </div>
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  </div>
</div>

<style>
  * {
    scrollbar-width: none;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
