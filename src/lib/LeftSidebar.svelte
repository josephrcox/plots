<script lang="ts">
  import { roundTo } from "./utils";
  import {
    DB,
    ACTIVE_GAME_DB_NAME,
    modifyPlotMenuOptions,
    settingLiegeLocation,
    showCityHallMenu,
    showKnowledgeMenu,
    showLabMenu,
  } from "./store";
  import Button from "./components/ui/button/button.svelte";
  import Slider from "./components/ui/slider/slider.svelte";

  function showTheLabMenu() {
    if ($DB.hasLab) showLabMenu.set(true);
  }

  function setProductivity(newProductivity: number[]) {
    let z = $DB;
    z.townInfo.productivity = roundTo(newProductivity[0], 2);
    DB.set(z);
    localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
  }

  function setTaxRate(newRate: number[]) {
    let z = $DB;
    z.economyAndLaws.tax_rate = roundTo(newRate[0], 2);
    DB.set(z);
    localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
  }
</script>

<!-- fixed to left side and fill entire height -->
<div class="flex flex-row text-foregroundText">
  <div
    class="bg-foreground w-[160px] border-foregroundDark border-4
			{$modifyPlotMenuOptions.visible ? 'bottom-8  opacity-70' : 'bottom-2'}
		z-10 fixed left-3 py-2 top-[190px] drop-shadow-xl rounded-xl transition-all duration-300 overflow-y-clip"
  >
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <!-- <h1
      class="text-xl text-center cursor-pointer"
      on:click={() => {
        $DB.townLog = [];
      }}
    >
      Settings
    </h1> -->
    <div class="flex flex-col justify-center mx-2">
      <div
        class="flex flex-col gap-2 rounded-xl text-center justify-center mb-2 mt-0"
      >
        <div
          class="flex flex-col justify-center w-full text-center items-center gap-2
        min-h-12 pb-2 rounded-xl {$DB.economyAndLaws.tax_rate === 0
            ? 'bg-textDanger1 animate-pulse font-bold'
            : ''}"
        >
          <div>
            <span class="text-xs">💰 Tax Rate</span>
            <span class="text-xs"
              >{roundTo($DB.economyAndLaws.tax_rate * 100, 0)}%</span
            >
          </div>
          <Slider
            value={[$DB.economyAndLaws.tax_rate]}
            onValueChange={setTaxRate}
            min={0}
            max={0.5}
            step={0.05}
            class="cursor-pointer w-[90%]"
          />
        </div>
        <div
          class="flex flex-col justify-center w-full text-center items-center gap-2"
        >
          <div>
            <span class="text-xs">💪 Productivity</span>
            <span class="text-xs">{roundTo($DB.townInfo.productivity, 0)}%</span
            >
          </div>
          <Slider
            value={[$DB.townInfo.productivity]}
            onValueChange={setProductivity}
            min={0}
            max={200}
            step={5}
            class="cursor-pointer w-[90%]"
          />
        </div>
      </div>
      <div
        class="flex flex-col gap-2 align-middle
        justify-start mt-6
      "
      >
        <Button
          class="text-xs flex flex-col h-min  bg-accent cursor-pointer text-textPrimary p-1.5
          
            {$settingLiegeLocation ? 'bg-green-500' : ''}
          "
          on:click={function () {
            $settingLiegeLocation = true;
          }}
          ><div>
            {#if !$settingLiegeLocation}
              Set your location!
            {:else}
              Pick an active Plot
            {/if}
          </div>
        </Button>
        <Button
          class="text-xs flex flex-col h-min  bg-accent cursor-pointer text-textPrimary p-1.5"
          on:click={function () {
            $showKnowledgeMenu = !$showKnowledgeMenu;
          }}
          ><div>Manage Knowledge</div>
        </Button>
        <Button
          class="text-xs flex flex-col h-min  bg-accent cursor-pointer text-textPrimary p-1.5"
          on:click={function () {
            $showCityHallMenu = !$showCityHallMenu;
          }}
          ><div>City Management</div>
        </Button>
        <Button
          class="text-xs flex flex-col h-min p-1.5 {$DB.hasLab
            ? 'bg-accent cursor-pointer text-textPrimary'
            : 'bg-accent cursor-not-allowed text-textPrimary opacity-35'}"
          on:click={showTheLabMenu}
          ><div>
            Manage Lab
            {#if $DB.lab.active_experiment !== null}
              {#if $DB.lab.active_experiment.duration > 0}
                <span>{$DB.lab.active_experiment.duration}d</span>
              {:else if $DB.lab.active_experiment.duration === 0}
                <span
                  class="
										animate-pulse
									">✅ DONE!</span
                >
              {/if}
            {/if}
          </div>
        </Button>
      </div>
    </div>
    <br />
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  </div>
</div>

<style>
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
