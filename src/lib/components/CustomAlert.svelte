<script lang="ts">
  // One-off messages from the game (tips, results, errors).
  import { customAlertText } from "../store.js";
  import Modal from "./Modal.svelte";
  import Btn from "./Btn.svelte";
</script>

<Modal open={$customAlertText !== ""} size="sm" onClose={() => customAlertText.set("")}>
  <p class="text-center whitespace-pre-wrap text-[15px] leading-relaxed">{@html $customAlertText}</p>
  <svelte:fragment slot="footer">
    <Btn variant="primary" on:click={() => customAlertText.set("")}>Got it</Btn>
  </svelte:fragment>
</Modal>
