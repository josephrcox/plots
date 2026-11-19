<script lang="ts">
  // Placeholder: not reachable from the UI yet.
  import { DB, showScoreboard } from "../store";
  import * as Dialog from "$lib/components/ui/dialog";
  // @ts-ignore
  import { winScenarios } from "../objects/WinScenarios.js";

  $: endGoal = $DB ? (winScenarios as any)[$DB.endGoal] : null;
</script>

<Dialog.Root bind:open={$showScoreboard}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Scoreboard</Dialog.Title>
      <Dialog.Description>
        {endGoal?.description_title ?? ""}
      </Dialog.Description>
    </Dialog.Header>
    hi
    <Dialog.Footer>footer</Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  /*  */
</style>
