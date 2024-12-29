<script lang="ts">
  import PlotController from "./lib/PlotController.svelte";
  import GameClock from "./lib/gameClock.svelte";
  import Header from "./lib/Header.svelte";
  import PauseMenu from "./lib/menus/PauseMenu.svelte";
  import DisabledPlotMenu from "./lib/menus/DisabledPlotMenu.svelte";

  import {
    paused,
    unique,
    DB,
    clearDB,
    modifyPlotMenuOptions,
    startGameMenu,
    showWelcome,
    settingLiegeLocation,
    setLiegeLocation,
    disabledPlotMenu,
    showKnowledgeMenu,
    showCityHallMenu,
    showLabMenu,
    showScoreboard,
    userDB,
    TEMP_GAME_DB_NAME,
    // @ts-ignore
  } from "./lib/store.ts";
  // @ts-ignore
  import { runTests } from "./tests";
  import GameEndMenu from "./lib/menus/GameEndMenu.svelte";
  import StartGameMenu from "./lib/menus/StartGameMenu.svelte";
  import Scoreboard from "./lib/menus/Scoreboard.svelte";
  import KnowledgeMenu from "./lib/menus/KnowledgeMenu.svelte";
  import LabMenu from "./lib/menus/LabMenu.svelte";
  import Hud from "./lib/Hud.svelte";
  import WelcomeScreen from "./lib/menus/WelcomeScreen.svelte";
  import CityHallMenu from "./lib/menus/CityHallMenu.svelte";
  import CustomAlert from "./lib/components/CustomAlert.svelte";

  let dbInitialized = false;
  runTests();

  $: if ($DB) {
    $startGameMenu.visible = false;
    dbInitialized = true;
    if ($settingLiegeLocation == true) {
      // where data-active=="true"
      const plots = document.querySelectorAll(".plot_container");
      plots.forEach((plot: any) => {
        if (plot.dataset.canbeupgraded == "true") {
          plot.style.cursor = "pointer";
          plot.style.cursor =
            "url('https://github.com/josephrcox/plots/raw/main/public/liege_place.cur'), auto";
        }
      });
    }
  } else {
    $startGameMenu.visible = true;
    dbInitialized = false;
  }

  const colors = [
    // { r: 60, g: 50, b: 100 }, // Subtle Ultra Violet
    // { r: 30, g: 75, b: 110 }, // Subtle Lapis Lazuli
    // { r: 12, g: 155, b: 105 }, // Subtle Emerald
    // { r: 180, g: 145, b: 60 }, // Subtle Saffron

    { r: 85, g: 60, b: 40 }, // Brown (Fall/Winter)
    { r: 115, g: 85, b: 55 }, // Muted Orange (Autumn)
    { r: 70, g: 100, b: 50 }, // Forest Green (Spring)
    { r: 120, g: 65, b: 50 }, // Reddish-Brown (Summer/Fall)
  ];

  let currentIndex = 0;
  let nextIndex = 1;
  let transitionProgress = 0;
  const transitionSpeed = 0.0001; // Even slower transitions for seasonal effect

  function blendColors(color1, color2, ratio) {
    return {
      r: Math.round(color1.r + (color2.r - color1.r) * ratio),
      g: Math.round(color1.g + (color2.g - color1.g) * ratio),
      b: Math.round(color1.b + (color2.b - color1.b) * ratio),
    };
  }

  function updateBackgroundColor() {
    // Calculate the blended color
    const blendedColor = blendColors(
      colors[currentIndex],
      colors[nextIndex],
      transitionProgress,
    );

    // Apply the color to the document body
    document.body.style.backgroundColor = `rgb(${blendedColor.r}, ${blendedColor.g}, ${blendedColor.b})`;

    // Update the transition progress
    transitionProgress += transitionSpeed;
    if (transitionProgress >= 1) {
      transitionProgress = 0;
      currentIndex = nextIndex;
      nextIndex = (nextIndex + 1) % colors.length;
    }

    // Request the next frame
    requestAnimationFrame(updateBackgroundColor);
  }

  // Start the color transition
  updateBackgroundColor();

  // if key P is pressed, pause the game
  document.addEventListener("keydown", (e) => {
    if (
      ((document.activeElement != null &&
        document.activeElement.nodeName === "INPUT") ||
        (document.activeElement != null &&
          document.activeElement.nodeName == "TEXTAREA")) &&
      e.key !== "Escape"
    )
      return;
    let key = e.key.toLowerCase();
    switch (key) {
      case "p":
      case "escape":
        // Check for any open menus first
        if ($showKnowledgeMenu) {
          $showKnowledgeMenu = false;
          break;
        }
        if ($showLabMenu) {
          $showLabMenu = false;
          break;
        }
        if ($showCityHallMenu) {
          $showCityHallMenu = false;
          break;
        }
        if ($showScoreboard) {
          $showScoreboard = false;
          break;
        }
        if ($modifyPlotMenuOptions.visible) {
          $modifyPlotMenuOptions.visible = false;
          break;
        }
        if ($disabledPlotMenu.visible) {
          // If disabled plot menu is open, close it and bulldoze the plot
          const plot = $DB.plots[$disabledPlotMenu.x][$disabledPlotMenu.y];
          plot.active = false;
          plot.type = -1;
          plot.disabled = false;
          $disabledPlotMenu.visible = false;
          break;
        }
        if ($settingLiegeLocation) {
          settingLiegeLocation.set(false);
          const plots = document.querySelectorAll(".plot_container");
          plots.forEach((plot: any) => {
            plot.style.cursor = "";
          });
          break;
        }

        // If no menus are open, toggle pause state
        paused.set(!$paused);
        // Ensure menus are closed when pausing
        if ($paused) {
          $modifyPlotMenuOptions.visible = false;
        }
        break;

      default:
        break;
    }
  });
</script>

{#if dbInitialized || $DB == null}
  {#if $DB == null}
    <StartGameMenu />
  {:else}
    {#if $paused == true}
      <PauseMenu />
    {/if}

    <Hud />
    <GameClock />
    <GameEndMenu />
    <Scoreboard />
    <KnowledgeMenu />
    <LabMenu />
    <CityHallMenu />
    <CustomAlert />
    <DisabledPlotMenu />
    {#if $DB.environment.day == 0 && $showWelcome}
      <WelcomeScreen />
    {/if}
  {/if}
{/if}

<style>
</style>
