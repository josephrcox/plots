<script lang="ts">
  // Shows new town log entries briefly under the top bar. The full log stays
  // in the town panel.
  import { fly, fade } from "svelte/transition";
  import { DB } from "./store";
  import { HUD } from "./ui";
  import { Vibe, type TownLog } from "./types";

  const SHOW_MS = 6000;
  const MAX_TOASTS = 3;
  const REPEAT_MS = 3 * 60 * 1000;
  const lastShown = new Map<string, number>();

  type Toast = TownLog & { key: number };
  let toasts: Toast[] = [];
  let nextKey = 0;
  // Entries that existed when the town loaded aren't news.
  const seen = new Set(($DB?.townLog ?? []).map(id));

  function id(log: TownLog) {
    return `${log.day}|${log.message}`;
  }

  $: if ($DB) {
    for (const log of [...$DB.townLog].reverse()) {
      const key = id(log);
      if (seen.has(key)) continue;
      seen.add(key);
      // Recurring messages (e.g. unemployment) are re-logged every month;
      // only toast them again after a while.
      // Numbers change between repeats ("14 people can't find jobs").
      const kind = log.message.replace(/\d[\d,.]*/g, "#");
      const last = lastShown.get(kind) ?? -Infinity;
      if (Date.now() - last < REPEAT_MS) continue;
      lastShown.set(kind, Date.now());
      const toast = { ...log, key: nextKey++ };
      toasts = [toast, ...toasts].slice(0, MAX_TOASTS);
      setTimeout(() => {
        toasts = toasts.filter((t) => t.key !== toast.key);
      }, SHOW_MS);
    }
  }
</script>

<div
  class="fixed left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 items-center pointer-events-none w-[min(420px,90vw)]"
  style="top:{HUD.top + 10}px;"
>
  {#each toasts as toast (toast.key)}
    <div
      class="pointer-events-auto text-xs px-3 py-2 rounded-xl shadow-lg w-full
      {toast.vibe == Vibe.BAD
        ? 'bg-white text-textDanger border border-red-300'
        : toast.vibe == Vibe.GOOD
          ? 'bg-green-200 text-green-900'
          : 'bg-sidebarBackground text-sidebarText'}"
      in:fly={{ y: -10, duration: 200 }}
      out:fade={{ duration: 200 }}
    >
      {toast.message}
    </div>
  {/each}
</div>
