<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import { customAlertText, showCustomAlert } from "../store.js";
  import { flyAndScale } from "$lib/utils";
</script>

<Dialog.Root open={$customAlertText != ""}>
  <Dialog.Content
    transition={flyAndScale}
    class="bg-sidebarBackground text-sidebarText max-w-md rounded-xl shadow-xl border border-accent p-4"
  >
    <Dialog.Header>
      <Dialog.Description class="text-center mt-2 flex flex-col gap-2">
        <span class="whitespace-pre-wrap text-[15px]">
          {@html $customAlertText}
        </span>
      </Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer class="mt-4 flex justify-center">
      <button
        class="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-md transition-colors"
        on:click={() => {
          customAlertText.set("");
        }}
      >
        Got it
      </button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  :global(.dialog-overlay) {
    background-color: rgba(0, 0, 0, 0.5);
  }
</style>
