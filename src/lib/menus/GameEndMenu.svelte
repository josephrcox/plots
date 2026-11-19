<script lang="ts">
  import {
    DB,
    paused,
    modifyPlotMenuOptions,
    showAlert,
    LOSS_GRACE_DAYS,
  } from "../store";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";

  $: show = $DB != null && $DB.endGameDetails.msg != "";
  // A town can keep playing after its first loss only.
  $: canContinue = $DB != null && !$DB.overtime;
  // The build menu would otherwise cover this dialog.
  $: if (show) $modifyPlotMenuOptions.visible = false;

  function keepPlaying() {
    if (!canContinue) return;
    $DB!.overtime = true;
    $DB!.endGameDetails = { msg: "", win: false, still_playing: true };
    $DB!.lossGraceUntil = $DB!.environment.day + LOSS_GRACE_DAYS;
    paused.set(false);
    showAlert(
      `Your town gets one more chance. You have ${LOSS_GRACE_DAYS} days to turn things around. If it falls again, it's over for good.`,
    );
  }
</script>

<!-- Only the buttons close this dialog. -->
<Dialog.Root open={show} closeOnEscape={false} closeOnOutsideClick={false}>
  <Dialog.Content class="bg-foregroundDark text-accentText">
    <Dialog.Header>
      <Dialog.Title>
        {$DB.endGameDetails.win == true
          ? "You won! 🎉"
          : canContinue
            ? "You lost! 😭"
            : "Your town has fallen for good 🪦"}</Dialog.Title
      >
      <Dialog.Description>
        <span class="text-gray-500 text-sm">{$DB.endGameDetails.msg}</span>
        <br />
        <br />
        {#if canContinue}
          <Button on:click={keepPlaying} class="bg-accent">Keep playin'</Button>
        {:else}
          <Button on:click={() => paused.set(true)} class="bg-accent"
            >Start a new town</Button
          >
        {/if}
      </Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer>
      <span class="text-gray-500 text-sm">
        {#if canContinue}
          You can only keep playing once per town. To start over, press P and
          click "+ Build new town".
        {:else}
          Press P and click "+ Build new town" to start over.
        {/if}
      </span>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
