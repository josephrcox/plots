<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import {
    DB,
    disabledPlotMenu,
    resolveDisabledPlot,
    SNOOZE_DAYS,
  } from "../store";
  import { flyAndScale } from "$lib/utils";
</script>

<!-- Closing the dialog any other way bulldozes the plot. -->
<Dialog.Root
  open={$disabledPlotMenu.visible}
  onOpenChange={(open) => {
    if (!open) resolveDisabledPlot("bulldoze");
  }}
>
  <Dialog.Content
    transition={flyAndScale}
    class="bg-sidebarBackground text-sidebarText max-w-md rounded-md shadow-xl border border-accent"
  >
    <Dialog.Header class="p-4 border-b border-accent/20">
      <Dialog.Title class="text-xl font-semibold">
        🚨 Plot Disabled Warning
      </Dialog.Title>
    </Dialog.Header>

    <div class="p-4 space-y-4">
      <p>
        Your {$disabledPlotMenu.plotName}
        {$disabledPlotMenu.location} is about to be disabled!
      </p>

      <div class="bg-red-500/10 p-3 rounded-md">
        <p class="font-semibold">Missing Resources:</p>
        <ul class="list-disc list-inside">
          {#each $disabledPlotMenu.missingResources as resource}
            <li>{resource}</li>
          {/each}
        </ul>
      </div>

      <div class="bg-accent/10 p-3 rounded-md">
        <p>You have two options:</p>
        <ol class="list-decimal list-inside">
          <li>Bulldoze the plot (free)</li>
          <li>
            Snooze for {SNOOZE_DAYS} days (costs {$disabledPlotMenu.plotCost} gold)
          </li>
        </ol>
      </div>
    </div>

    <Dialog.Footer class="p-4 border-t border-accent/20 flex justify-end gap-2">
      <Button
        variant="destructive"
        on:click={() => resolveDisabledPlot("bulldoze")}>Bulldoze</Button
      >
      <Button
        variant="default"
        disabled={($DB?.townInfo.gold ?? 0) < $disabledPlotMenu.plotCost}
        on:click={() => resolveDisabledPlot("snooze")}
      >
        Snooze ({$disabledPlotMenu.plotCost} gold)
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
