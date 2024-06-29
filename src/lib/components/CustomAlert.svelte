<script lang="ts">
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { showCustomAlert } from "../store.js";
</script>

<AlertDialog.Root open={$showCustomAlert != ""}>
  <AlertDialog.Content
    class="bg-foregroundDark text-white rounded-input shadow-3xl justify-center items-center min-h-36 flex flex-col py-4 text-md font-semibold p-4 w-96
         sm:rounded-2xl sm:flex sm:flex-col sm:w-full
    "
  >
    🛎️ {$showCustomAlert}
    <AlertDialog.Action
      class="bg-button hover:scale-105 min-w-[70%] transition-all duration-150 mt-4 "
      on:click={() => {
        showCustomAlert.set("");
      }}>Got it</AlertDialog.Action
    >
    <AlertDialog.Footer>
      <!-- <AlertDialog.Cancel>Cancel</AlertDialog.Cancel> -->
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<style>
  /* nothin' */
</style>
