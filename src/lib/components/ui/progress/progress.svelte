<script lang="ts">
  import { Progress as ProgressPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";

  type $$Props = ProgressPrimitive.Props;

  let className: $$Props["class"] = undefined;
  export let max: $$Props["max"] = 100;
  export let value: $$Props["value"] = undefined;
  export let color: $$Props["color"] = "bg-accent";
  export let text: $$Props["text"] = undefined;
  export { className as class };
</script>

<ProgressPrimitive.Root
  class={cn(
    "relative h-6 w-full overflow-hidden  bg-black border border-gray-300",
    className,
  )}
  {...$$restProps}
>
  <div
    class="h-full w-full flex-1 {color} transition-all relative"
    style={`transform: translateX(-${100 - (100 * (value ?? 0)) / (max ?? 1)}%)`}
  ></div>
  <span
    class="absolute inset-0 flex items-center justify-center text-white text-sm"
  >
    {text}
  </span>
</ProgressPrimitive.Root>
