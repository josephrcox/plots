<script lang="ts">
  // Shown when an achievement is earned; the clock waits while it's open.
  import { userDB, showAchievementPopup } from "../store";
  import { achievements } from "$lib/objects/AchievementList";
  import Modal from "$lib/components/Modal.svelte";
  import Btn from "$lib/components/Btn.svelte";
  import { formatNumber } from "$lib/utils";

  $: latest = (() => {
    const list = $userDB.achievements;
    const last = list[list.length - 1];
    return last ? achievements.find((a) => a.id === last[0]) : undefined;
  })();
</script>

<Modal
  open={$showAchievementPopup}
  size="sm"
  icon={latest?.icon ?? "🏆"}
  title={latest?.title ?? "Achievement"}
  subtitle={latest?.description ?? ""}
  onClose={() => ($showAchievementPopup = false)}
>
  <span class="text-center opacity-75">
    Collect its 💰{formatNumber(latest?.prize ?? 0, false)} reward from Achievements in the pause menu (P).
  </span>
  <svelte:fragment slot="footer">
    <Btn variant="primary" on:click={() => ($showAchievementPopup = false)}>Nice!</Btn>
  </svelte:fragment>
</Modal>

