<script lang="ts">
  // Drives the simulation: advances one game day every `$speed` ms while the
  // game is running. The rules themselves live in ./simulation.ts.
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { DB, getGame, speed } from "./store";
  import { canAdvanceDay, simulateDay } from "./simulation";

  // How often (ms) to check whether a day should pass. Small enough that
  // speed changes and un-pausing feel immediate.
  const POLL_INTERVAL_MS = 20;

  function advanceDay() {
    const game = getGame();
    if (!canAdvanceDay(game)) return;
    try {
      DB.set(simulateDay(game));
    } catch (error) {
      console.error("Error in game loop:", error);
      if (window.location.hostname === "localhost") {
        alert("Error in game loop: " + error);
      }
    }
  }

  onMount(() => {
    let elapsed = 0;
    let last = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      if (!canAdvanceDay(getGame())) {
        elapsed = 0;
      } else {
        elapsed += now - last;
      }
      last = now;
      if (elapsed >= get(speed)) {
        elapsed = 0;
        advanceDay();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  });
</script>
