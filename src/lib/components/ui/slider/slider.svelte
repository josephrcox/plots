<script lang="ts">
  import { Slider as SliderPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";

  type $$Props = SliderPrimitive.Props;

  let className: $$Props["class"] = undefined;
  export let value: $$Props["value"] = [0];
  export { className as class };
</script>

<SliderPrimitive.Root
  bind:value
  class={cn(
    "relative flex w-full touch-none select-none items-center",
    className,
  )}
  {...$$restProps}
  let:thumbs
>
  <span class="relative h-2 w-full grow overflow-hidden bg-black">
    <SliderPrimitive.Range class="absolute h-full bg-primary" />
  </span>
  {#each thumbs as thumb}
    <SliderPrimitive.Thumb
      {thumb}
      class="block h-4 w-4  bg-accent focus-visible:outline-none  disabled:pointer-events-none disabled:opacity-50"
    />
  {/each}
</SliderPrimitive.Root>
