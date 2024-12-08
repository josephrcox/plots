<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip";
  import Button from "./ui/button/button.svelte";

  export let text: string;
  export let onOpen: () => void;
  export let backgroundColor: string = "accent";
  export let opacity: number = 100;
  export let onHoverText: string = "";
</script>

<Tooltip.Root openDelay={onHoverText.length > 0 ? 400 : 10000} closeDelay={0}>
  <Tooltip.Content
    >{onHoverText.length > 0
      ? onHoverText
      : "Why are you hovering here?"}</Tooltip.Content
  >
  <Tooltip.Trigger class="flex flex-col h-min">
    <Button
      class="text-xs flex flex-col h-min bg-accent cursor-pointer text-accentText p-1.5 text-start
  bg-{backgroundColor} cursor-pointer text-accentText opacity-{opacity}
  "
      on:click={onOpen}><div>{text}</div></Button
    >
  </Tooltip.Trigger>
</Tooltip.Root>
