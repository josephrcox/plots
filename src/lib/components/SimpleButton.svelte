<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip";
  import Button from "./ui/button/button.svelte";

  export let text: string;
  export let onOpen: () => void;
  export let styling: string = "bg-accent text-accentText";
  export let opacity: number = 100;
  export let onHoverText: string = "";
</script>

<Tooltip.Root openDelay={onHoverText.length > 0 ? 200 : 999999} closeDelay={0}>
  <Tooltip.Content
    >{onHoverText.length > 0
      ? onHoverText
      : "Why are you hovering here?"}</Tooltip.Content
  >
  <Tooltip.Trigger class="flex flex-col">
    <Button
      class="text-sm flex flex-col py-1.5 
        opacity-{opacity} {opacity < 100 ? 'hover:opacity-40' : ''} 
        rounded-xl cursor-pointer transition-all duration-150 
        filter hover:brightness-110
        {styling}"
      on:click={onOpen}><div>{text}</div></Button
    >
  </Tooltip.Trigger>
</Tooltip.Root>
