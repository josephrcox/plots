<script lang="ts">
  // New town: a name and a few settings.
  import { startGame, startGameMenu, userDB, paused } from "../store";
  import Modal from "$lib/components/Modal.svelte";
  import Btn from "$lib/components/Btn.svelte";
  import { PERKS, MAX_PERKS, unlockedPerks, unlockedBy, type PerkId } from "$lib/perks";

  paused.set(false);

  let name = "";
  let casual = true;
  let tomPetty = false;
  let bagOfHolding = false;

  const SETTINGS = [
    { key: "casual", title: "Casual", about: "Faster and easier, with more of the game's workings explained. Recommended for a first town." },
    { key: "tomPetty", title: "Tom Petty mode", about: "If happiness or health hits zero, lose half your gold and carry on. You won't back down." },
    { key: "bagOfHolding", title: "Bag of Holding", about: "No storage limit; no need for stockpiles." },
  ] as const;
  $: values = { casual, tomPetty, bagOfHolding };
  function toggle(key: (typeof SETTINGS)[number]["key"]) {
    if (key === "casual") casual = !casual;
    if (key === "tomPetty") tomPetty = !tomPetty;
    if (key === "bagOfHolding") bagOfHolding = !bagOfHolding;
  }

  // Perks unlocked by achievements; bring up to MAX_PERKS.
  $: unlocked = unlockedPerks($userDB);
  let chosen: PerkId[] = [];
  function togglePerk(id: PerkId) {
    if (chosen.includes(id)) chosen = chosen.filter((p) => p !== id);
    else if (chosen.length < MAX_PERKS) chosen = [...chosen, id];
  }

  function start() {
    const settings = [
      ...SETTINGS.filter((s) => values[s.key]).map((s) => s.key as string),
      ...chosen.map((id) => `perk:${id}`),
    ];
    startGame("1", "free_play", name, settings);
  }

  function setUsername() {
    const next = prompt("Your player name")?.trim();
    if (next) $userDB.username = next;
  }
</script>

<Modal open={$startGameMenu.visible} title="Found a new town" dismissible={false} size="lg">
  <label class="flex flex-col gap-1">
    <span class="label">Town name</span>
    <!-- svelte-ignore a11y-autofocus -->
    <input
      class="field"
      bind:value={name}
      autofocus
      placeholder="Leave blank for a random name"
      on:keydown={(e) => e.key === "Enter" && start()}
    />
  </label>

  <div class="flex flex-col gap-1.5">
    <span class="label">Settings</span>
    {#each SETTINGS as s}
      <button class="setting" class:on={values[s.key]} on:click={() => toggle(s.key)}>
        <span class="check">{values[s.key] ? "✓" : ""}</span>
        <span class="flex flex-col text-left">
          <span class="font-semibold">{s.title}</span>
          <span class="text-xs opacity-70">{s.about}</span>
        </span>
      </button>
    {/each}
  </div>

  <div class="flex flex-col gap-1.5">
    <span class="label">Perks · bring up to {MAX_PERKS} ({chosen.length} chosen)</span>
    <span class="text-xs opacity-60 -mt-1">Starting bonuses for this town. Earn achievements to unlock more.</span>
    <div class="grid grid-cols-2 gap-1.5">
      {#each PERKS as perk}
        {@const open = unlocked.has(perk.id)}
        <button
          class="perk"
          class:on={chosen.includes(perk.id)}
          class:locked={!open}
          disabled={!open || (!chosen.includes(perk.id) && chosen.length >= MAX_PERKS)}
          title={open ? perk.about : `Unlock with the "${unlockedBy(perk.id)?.title}" achievement`}
          on:click={() => togglePerk(perk.id)}
        >
          <span>{perk.icon}</span>
          <span class="flex flex-col text-left">
            <span class="font-semibold text-xs">{perk.title}</span>
            <span class="text-[11px] opacity-80">{perk.about}</span>
            {#if !open}
              <span class="text-[11px] text-yellow-200/80">🔒 Unlock: {unlockedBy(perk.id)?.description}</span>
            {/if}
          </span>
        </button>
      {/each}
    </div>
  </div>

  <svelte:fragment slot="footer">
    <a
      href="https://github.com/josephrcox/plots#how-to-play"
      target="_blank"
      class="text-xs opacity-60 hover:opacity-100 mr-auto">How to play ↗</a
    >
    <button class="text-xs opacity-60 hover:opacity-100" title="Change player name" on:click={setUsername}
      >👤 {$userDB.username === "click_to_set_username" ? "Set player name" : $userDB.username}</button
    >
    <Btn variant="primary" on:click={start}>Start town</Btn>
  </svelte:fragment>
</Modal>

<style>
  .label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.6;
  }
  .field {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 9px;
    padding: 8px 10px;
    color: white;
    outline: none;
  }
  .field:focus {
    border-color: rgb(168, 115, 75);
  }
  .setting {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
  }
  .setting.on {
    background: rgba(168, 115, 75, 0.22);
  }
  .perk {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 6px 8px;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.05);
  }
  .perk.on {
    background: rgba(250, 204, 21, 0.18);
    outline: 1px solid rgba(250, 204, 21, 0.6);
  }
  .perk.locked {
    opacity: 0.6;
  }
  .perk:disabled:not(.locked) {
    opacity: 0.6;
  }
  .check {
    flex: none;
    width: 18px;
    height: 18px;
    margin-top: 1px;
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
  }
  .setting.on .check {
    background: rgb(168, 115, 75);
    border-color: rgb(168, 115, 75);
  }
</style>
