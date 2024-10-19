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
    showTutorialStepConfetti,
  } from "./store";
  import Button from "./components/ui/button/button.svelte";
  import Slider from "./components/ui/slider/slider.svelte";
  import { tutorialMessages } from "./objects/tutorial_messages";
  import Separator from "./components/ui/separator/separator.svelte";
  import { Confetti } from "svelte-confetti";

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

  //// Tester for confetti. Leave commented out unless testing.
  document.addEventListener("keydown", function (e) {
    switch (e.key) {
      case "Escape":
        $showTutorialStepConfetti = true;
        setTimeout(() => {
          $showTutorialStepConfetti = false;
        }, 5000);
        break;
    }
  });
</script>

<div class="flex flex-row text-foregroundText overflow-clip">
  <div
    class="bg-foreground w-[160px] overflow-scroll border-foregroundDark border-4
			{$modifyPlotMenuOptions.visible ? 'bottom-8  opacity-70' : 'bottom-2'}
		z-10 fixed left-3 py-2 top-[190px] drop-shadow-xl rounded-xl transition-all duration-300"
  >
    <div class="flex flex-col justify-center mx-2 overflow-scroll">
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
      <Separator class="bg-background mt-4" />
      <div class="mt-4">
        <h1 class="text-lg w-full text-center pb-2">Milestones</h1>
        <div
          class="
        "
        >
          {#each tutorialMessages as step, index}
            <div
              class="text-xs flex flex-row justify-center align-middle pb-2
              text-textPrimary mb-2 transition-all duration-300 noselect
            {$DB.currentTutorialStep == index ? 'opacity-100' : 'opacity-35'}
          "
            >
              {#if $showTutorialStepConfetti && $DB.currentTutorialStep == index}
                <Confetti cone x={[-0.5, 0.5]} />
                <Confetti
                  cone
                  amount={10}
                  x={[-1, -0.4]}
                  y={[0.25, 0.75]}
                  rounded
                  size={15}
                />
                <Confetti cone amount={10} x={[0.4, 1]} y={[0.25, 0.75]} />

                <Confetti infinite amount={75} delay={[0, 200]} />
              {/if}
              {step.isComplete($DB) ||
              ($showTutorialStepConfetti && $DB.currentTutorialStep == index)
                ? "✅"
                : "⬜️"}
              {step.message}
            </div>
          {/each}
        </div>
      </div>
    </div>
    <br />
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  </div>
</div>

<style>
  .noselect {
    user-select: none;
  }
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
