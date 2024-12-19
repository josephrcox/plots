<script lang="ts">
  import { Tooltip as TooltipPrimitive } from "bits-ui";
  import { cn, flyAndScale } from "$lib/utils.js";

  type $$Props = TooltipPrimitive.ContentProps;

  let className: $$Props["class"] = undefined;
  export let sideOffset: $$Props["sideOffset"] = 16;
  export let transition: $$Props["transition"] = flyAndScale;
  export let transitionConfig: $$Props["transitionConfig"] = {
    y: 6,
    duration: 100,
  };
  export { className as class };
</script>

<TooltipPrimitive.Content
  {transition}
  {transitionConfig}
  {sideOffset}
  class={cn(
    "z-50 overflow-hidden border bg-sidebarBackground px-3 py-1.5 text-sm text-black shadow-md rounded-2xl",
    className,
  )}
  {...$$restProps}
>
  <slot />
</TooltipPrimitive.Content>
