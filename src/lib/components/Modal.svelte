<script lang="ts">
  // The one dialog every screen uses: a dark HUD-style panel with a title,
  // an optional subtitle and close button, a body and a footer. Built on
  // bits-ui's Dialog for focus handling and Escape.
  import { Dialog } from "bits-ui";
  import { fly, fade } from "svelte/transition";

  export let open = false;
  export let title = "";
  export let subtitle = "";
  /** Optional big emoji or icon shown above the title. */
  export let icon = "";
  export let size: "sm" | "md" | "lg" = "md";
  /** Whether Escape, clicking outside and the × close it. */
  export let dismissible = true;
  export let onClose: () => void = () => {};

  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl" };

  function change(next: boolean) {
    if (!next && dismissible) {
      open = false;
      onClose();
    }
  }
</script>

<Dialog.Root
  {open}
  onOpenChange={change}
  closeOnEscape={dismissible}
  closeOnOutsideClick={dismissible}
>
  <Dialog.Portal>
    <Dialog.Overlay
      transition={fade}
      transitionConfig={{ duration: 120 }}
      class="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]"
    />
    <Dialog.Content
      transition={fly}
      transitionConfig={{ y: 12, duration: 160 }}
      class="modal fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] {widths[size]} -translate-x-1/2 -translate-y-1/2 max-h-[85vh] flex flex-col"
    >
      <div class="flex flex-row items-start gap-3 px-5 pt-5 pb-3">
        <div class="flex-1 flex flex-col gap-1 {icon ? 'items-center text-center' : ''}">
          {#if icon}<span class="text-4xl leading-none mb-1">{icon}</span>{/if}
          {#if title}
            <Dialog.Title class="text-lg font-semibold leading-tight">{title}</Dialog.Title>
          {/if}
          {#if subtitle}
            <Dialog.Description class="text-sm opacity-70">{subtitle}</Dialog.Description>
          {/if}
          <slot name="header" />
        </div>
        {#if dismissible}
          <button class="close" title="Close (Esc)" on:click={() => change(false)}>×</button>
        {/if}
      </div>
      <div class="px-5 pb-4 overflow-y-auto no-scrollbar flex flex-col gap-3 text-sm">
        <slot />
      </div>
      {#if $$slots.footer}
        <div class="footer px-5 py-3 flex flex-row flex-wrap items-center justify-end gap-2">
          <slot name="footer" />
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.modal) {
    background: rgb(45, 51, 39);
    color: white;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
  }
  .close {
    font-size: 1.4rem;
    line-height: 1;
    opacity: 0.55;
    padding: 0 4px;
  }
  .close:hover {
    opacity: 1;
  }
  .footer {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
</style>
