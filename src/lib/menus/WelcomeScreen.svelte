<script lang="ts">
  import { DB, showWelcome } from "../store";
  import Modal from "$lib/components/Modal.svelte";
  import Btn from "$lib/components/Btn.svelte";
</script>

<Modal open={$showWelcome} icon="🚩" title="{$DB.townInfo.name} is founded!" size="sm" onClose={() => ($showWelcome = false)}>
  <p class="text-center opacity-80">
    Build a great town and keep your people happy. Found it on the 🚩 start tile with a set of homes,
    then add farms and a tree farm. The goal on the right guides you.
  </p>
  <svelte:fragment slot="footer">
    <Btn variant="primary" on:click={() => ($showWelcome = false)}>Begin</Btn>
  </svelte:fragment>
</Modal>
