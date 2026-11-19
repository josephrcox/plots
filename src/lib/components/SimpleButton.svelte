<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip";
  import Button from "./ui/button/button.svelte";

  export let text: string;
  export let onOpen: () => void;
  export let styling: string = "bg-accent text-accentText";
  /** Below 100 renders the button dimmed (e.g. a feature not unlocked yet). */
  export let opacity: number = 100;
  export let onHoverText: string = "";

  $: classes = `text-sm flex flex-col py-1.5 rounded-xl cursor-pointer
    transition-all duration-150 filter hover:brightness-110
    ${opacity < 100 ? "opacity-30 hover:opacity-40" : ""} ${styling}`;
</script>

{#if onHoverText}
  <Tooltip.Root openDelay={200} closeDelay={0}>
    <!-- asChild: the Button itself is the trigger (no button-in-button). -->
    <Tooltip.Trigger asChild let:builder>
      <Button
        builders={[builder]}
        class={classes}
       
        on:click={onOpen}><div>{text}</div></Button
      >
    </Tooltip.Trigger>
    <Tooltip.Content>{onHoverText}</Tooltip.Content>
  </Tooltip.Root>
{:else}
  <Button class={classes} on:click={onOpen}
    ><div>{text}</div></Button
  >
{/if}
