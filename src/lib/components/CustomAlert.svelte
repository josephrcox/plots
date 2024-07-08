<script lang="ts">
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { showCustomAlert } from "../store.js";
</script>

<AlertDialog.Root open={$showCustomAlert != ""}>
  <AlertDialog.Content
    class="bg-foregroundDark text-white rounded-input shadow-3xl justify-center items-center flex flex-col py-2 text-lg font-semibold p-2 min-w-96 min-h-36
         sm:rounded-2xl sm:flex sm:flex-col sm:p-6 sm:text-md sm:font-semibold sm:py-4 sm:items-center sm:justify-center max-h-[50vh]

         "
  >
    <span
      class="whitespace-pre-wrap overflow-scroll text-center
      sm:whitespace-normal break-all sm:text-md sm:font-semibold sm:py-4 sm:items-center sm:justify-center"
      style="max-height: 80%;">🛎️ {@html $showCustomAlert}</span
    >
    <AlertDialog.Action
      class="bg-button hover:scale-105 min-w-[70%] transition-all duration-150 mt-2"
      on:click={() => {
        showCustomAlert.set("");
      }}>Got it</AlertDialog.Action
    >
    <AlertDialog.Footer>
      <!-- Optional Cancel button or other footer content -->
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
