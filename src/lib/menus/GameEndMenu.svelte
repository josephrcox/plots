<script lang="ts">
  import { DB, paused, showAlert, LOSS_GRACE_DAYS } from "../store";
  import Modal from "$lib/components/Modal.svelte";
  import Btn from "$lib/components/Btn.svelte";
  import { resetMapUi } from "../ui";
  import { hasPerk } from "$lib/perks";

  $: show = $DB != null && $DB.endGameDetails.msg != "";
  // A town can keep playing after its first loss only.
  $: canContinue = $DB != null && !$DB.overtime;
  // Drop any build tool so nothing can be placed behind this dialog.
  $: if (show) resetMapUi();

  function keepPlaying() {
    if (!canContinue) return;
    $DB!.overtime = true;
    $DB!.endGameDetails = { msg: "", win: false, still_playing: true };
    const grace = LOSS_GRACE_DAYS * (hasPerk($DB, "resilient") ? 2 : 1);
    $DB!.lossGraceUntil = $DB!.environment.day + grace;
    paused.set(false);
    showAlert(
      `Your town gets one more chance. You have ${grace} days to turn things around. If it falls again, it's over for good.`,
    );
  }
</script>

<!-- Only the buttons close this dialog. -->
<Modal
  open={show}
  dismissible={false}
  size="sm"
  icon={$DB.endGameDetails.win ? "🎉" : canContinue ? "😭" : "🪦"}
  title={$DB.endGameDetails.win ? "You won!" : canContinue ? "Your town has fallen" : "Your town has fallen for good"}
  subtitle={$DB.endGameDetails.msg}
>
  <p class="text-center text-xs opacity-60">
    {canContinue ? "You can keep playing once per town." : "Start fresh from the pause menu."}
  </p>
  <svelte:fragment slot="footer">
    {#if canContinue}
      <Btn on:click={() => paused.set(true)}>New town…</Btn>
      <Btn variant="primary" on:click={keepPlaying}>Keep playin'</Btn>
    {:else}
      <Btn variant="primary" on:click={() => paused.set(true)}>Start a new town</Btn>
    {/if}
  </svelte:fragment>
</Modal>
