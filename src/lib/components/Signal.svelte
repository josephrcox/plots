<script lang="ts">
  // A small "signal strength" icon: 1–3 bars for how strong an effect is.
  // Green for good, red for bad, grey for slight. The exact number, if any,
  // goes in `title` so it only shows on hover.
  export let level = 0; // 0–3
  export let tone: "good" | "bad" | "neutral" = "good";
  export let title = "";
  const heights = [5, 8, 11];
</script>

<span class="signal {tone}" {title} aria-label="{tone} effect, {level} of 3">
  {#each heights as h, i}
    <span class="bar" class:on={i < level} style="height:{h}px"></span>
  {/each}
</span>

<style>
  .signal {
    display: inline-flex;
    align-items: flex-end;
    gap: 1px;
    height: 11px;
    vertical-align: -1px;
    margin: 0 2px;
  }
  .bar {
    width: 3px;
    border-radius: 1px;
    background: rgba(255, 255, 255, 0.18);
  }
  .good .bar.on {
    background: rgb(74, 222, 128);
  }
  .bad .bar.on {
    background: rgb(248, 113, 113);
  }
  .neutral .bar.on {
    background: rgb(186, 230, 253);
  }
</style>
