<script lang="ts">
  import PlotController from "./lib/PlotController.svelte";
  import GameClock from "./lib/gameClock.svelte";
  import Header from "./lib/Header.svelte";
  import PauseMenu from "./lib/menus/PauseMenu.svelte";
  import DisabledPlotMenu from "./lib/menus/DisabledPlotMenu.svelte";

  import {
    paused,
    DB,
    modifyPlotMenuOptions,
    startGameMenu,
    showWelcome,
    settingLiegeLocation,
    disabledPlotMenu,
    resolveDisabledPlot,
    showKnowledgeMenu,
    showCityHallMenu,
    showLabMenu,
    showScoreboard,
    showAchievementPopup,
  } from "./lib/store";
  import GameEndMenu from "./lib/menus/GameEndMenu.svelte";
  import StartGameMenu from "./lib/menus/StartGameMenu.svelte";
  import Scoreboard from "./lib/menus/Scoreboard.svelte";
  import KnowledgeMenu from "./lib/menus/KnowledgeMenu.svelte";
  import LabMenu from "./lib/menus/LabMenu.svelte";
  import Hud from "./lib/Hud.svelte";
  import WelcomeScreen from "./lib/menus/WelcomeScreen.svelte";
  import CityHallMenu from "./lib/menus/CityHallMenu.svelte";
  import CustomAlert from "./lib/components/CustomAlert.svelte";
  import { runTests } from "./tests";

  runTests();

  $: $startGameMenu.visible = $DB == null;

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

  type RGB = { r: number; g: number; b: number };
  function blendColors(color1: RGB, color2: RGB, ratio: number): RGB {
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

  // P / Escape closes the top-most menu, or toggles pause if none is open.
  function handleKeydown(e: KeyboardEvent) {
    const active = document.activeElement?.nodeName;
    if ((active === "INPUT" || active === "TEXTAREA") && e.key !== "Escape") {
      return;
    }
    const key = e.key.toLowerCase();
    if (key !== "p" && key !== "escape") return;

    // The achievement popup lives inside the pause menu; close it first so it
    // doesn't linger and reappear the next time the game is paused.
    if ($showAchievementPopup) return ($showAchievementPopup = false);
    if ($showKnowledgeMenu) return ($showKnowledgeMenu = false);
    if ($showLabMenu) return ($showLabMenu = false);
    if ($showCityHallMenu) return ($showCityHallMenu = false);
    if ($showScoreboard) return ($showScoreboard = false);
    if ($modifyPlotMenuOptions.visible) {
      return ($modifyPlotMenuOptions.visible = false);
    }
    if ($disabledPlotMenu.visible) {
      // Escape dismisses the warning, which bulldozes the plot. P does nothing
      // here: pausing should never destroy a building.
      if (key === "escape") resolveDisabledPlot("bulldoze");
      return;
    }
    if ($settingLiegeLocation) return ($settingLiegeLocation = false);

    $paused = !$paused;
    if ($paused) $modifyPlotMenuOptions.visible = false;
  }
</script>

<!-- Registered on document (not window) so it runs before bits-ui's own
     Escape handling closes a dialog. -->
<svelte:document on:keydown={handleKeydown} />
<CustomAlert />

{#if $DB == null}
  <StartGameMenu />
{:else}
  {#if $paused == true}
    <PauseMenu />
  {/if}

  <!-- Remount per town so component state (speeds, lab offers...) resets
       when switching towns. -->
  {#key $DB.gameId}
    <Hud />
    <GameClock />
    <GameEndMenu />
    <Scoreboard />
    <KnowledgeMenu />
    <LabMenu />
    <CityHallMenu />
    <DisabledPlotMenu />
    {#if $DB.environment.day == 0 && $showWelcome}
      <WelcomeScreen />
    {/if}
  {/key}
{/if}
