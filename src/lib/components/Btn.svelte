<script lang="ts">
  // The one button style for menus: primary (terracotta), secondary (quiet),
  // danger (red) and gold (rewards).
  export let variant: "primary" | "secondary" | "danger" | "gold" = "secondary";
  export let disabled = false;
  export let title = "";
  export let full = false;
</script>

<button class="btn {variant}" class:full {disabled} {title} on:click>
  <slot />
</button>

<style>
  .btn {
    font-size: 0.82rem;
    font-weight: 600;
    padding: 7px 14px;
    border-radius: 9px;
    transition: filter 0.12s, background 0.12s;
    white-space: nowrap;
  }
  .btn.full {
    width: 100%;
  }
  .btn:hover:not(:disabled) {
    filter: brightness(1.12);
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .primary {
    background: rgb(168, 115, 75);
    color: white;
  }
  .secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  .danger {
    background: rgba(220, 70, 70, 0.85);
    color: white;
  }
  .gold {
    background: rgb(250, 204, 21);
    color: rgb(40, 35, 10);
  }
</style>
