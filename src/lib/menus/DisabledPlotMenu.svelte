<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { DB, disabledPlotMenu, reverseClear } from "../store";
  import { flyAndScale } from "$lib/utils";

  function handleSnooze() {
    if ($DB.townInfo.gold >= $disabledPlotMenu.plotCost) {
      $DB.townInfo.gold -= $disabledPlotMenu.plotCost;
      $DB.plots[$disabledPlotMenu.x][$disabledPlotMenu.y].snoozedUntil =
        $DB.environment.day + 10;
      $DB.plots[$disabledPlotMenu.x][$disabledPlotMenu.y].disabled = false;
    }
    $disabledPlotMenu.visible = false;
  }

  function handleBulldoze() {
    console.log("x:", $disabledPlotMenu.x);
    console.log("y:", $disabledPlotMenu.y);
    reverseClear($disabledPlotMenu.x, $disabledPlotMenu.y, $DB);
    $disabledPlotMenu.visible = false;
  }
</script>

<Dialog.Root bind:open={$disabledPlotMenu.visible}>
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
          <li>Snooze for 30 days (costs {$disabledPlotMenu.plotCost} gold)</li>
        </ol>
      </div>
    </div>

    <Dialog.Footer class="p-4 border-t border-accent/20 flex justify-end gap-2">
      <Button variant="destructive" on:click={handleBulldoze}>Bulldoze</Button>
      <Button
        variant="default"
        disabled={$DB.townInfo.gold < $disabledPlotMenu.plotCost}
        on:click={handleSnooze}
      >
        Snooze ({$disabledPlotMenu.plotCost} gold)
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
