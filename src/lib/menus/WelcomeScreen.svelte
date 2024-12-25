<script lang="ts">
  import { DB, showWelcome } from "../store";
  import * as Dialog from "$lib/components/ui/dialog";
  import { flyAndScale } from "$lib/utils";
</script>

<Dialog.Root bind:open={$showWelcome}>
  <Dialog.Content
    transition={flyAndScale}
    class="bg-sidebarBackground text-sidebarText max-w-md rounded-md shadow-xl border border-accent p-4"
  >
    <Dialog.Header>
      <Dialog.Title class="text-xl font-semibold text-center">
        {$DB.townInfo.name}
      </Dialog.Title>
      <Dialog.Description
        class="text-center mt-2 text-sm text-sidebarText/80 flex flex-col gap-2"
      >
        <span>
          The town of <span class="text-accent">{$DB.townInfo.name}</span> has been
          founded!
        </span>
        <span>
          Your goal is to build a great town and keep your people happy. Use the
          milestones on the right side as a guide.
        </span>
        <span>
          Start by building a set of homes, some farms, and a tree farm.
        </span>
      </Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer class="mt-4 flex justify-center">
      <button
        class="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-md transition-colors"
        on:click={() => ($showWelcome = false)}
      >
        Begin
      </button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  :global(.dialog-overlay) {
    background-color: rgba(0, 0, 0, 0.5);
  }
</style>
