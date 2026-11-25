<script lang="ts">
  // A building can't cover its running costs: pay to keep it going a while,
  // or bulldoze it. Closing the dialog any other way bulldozes it.
  import { DB, disabledPlotMenu, resolveDisabledPlot, SNOOZE_DAYS } from "../store";
  import Modal from "$lib/components/Modal.svelte";
  import Btn from "$lib/components/Btn.svelte";
</script>

<Modal
  open={$disabledPlotMenu.visible}
  size="sm"
  icon="🚨"
  title="{$disabledPlotMenu.plotName} is shutting down"
  subtitle="It can't cover its running costs."
  onClose={() => resolveDisabledPlot("bulldoze")}
>
  <div class="rounded-lg bg-red-500/15 px-3 py-2">
    <span class="text-xs uppercase tracking-wider opacity-60">Short of</span>
    <ul class="mt-1">
      {#each $disabledPlotMenu.missingResources as resource}
        <li>{resource}</li>
      {/each}
    </ul>
  </div>
  <p class="opacity-70 text-xs">
    Keep it running for {SNOOZE_DAYS} more days for 💰{$disabledPlotMenu.plotCost}, or bulldoze it for free.
  </p>
  <svelte:fragment slot="footer">
    <Btn variant="danger" on:click={() => resolveDisabledPlot("bulldoze")}>Bulldoze</Btn>
    <Btn
      variant="primary"
      disabled={($DB?.townInfo.gold ?? 0) < $disabledPlotMenu.plotCost}
      on:click={() => resolveDisabledPlot("snooze")}>Keep it (💰{$disabledPlotMenu.plotCost})</Btn
    >
  </svelte:fragment>
</Modal>
