<script>
  import { DB, showTutorialStepConfetti } from "./store";
  import Confetti from "svelte-confetti";
  import { formatNumber } from "./utils";

  export let index;
  export let step;
</script>

<div
  class="text-sm flex flex-row justify-start align-middle pb-2
               mb-2 transition-all duration-300 noselect
            {$DB.currentTutorialStep == index
    ? 'opacity-100'
    : step.isComplete($DB)
      ? 'opacity-100 text-green-600'
      : 'opacity-50'}
          "
>
  {#if $showTutorialStepConfetti && $DB.currentTutorialStep == index}
    <Confetti cone x={[-0.5, 0.5]} />
    <Confetti
      cone
      amount={10}
      x={[-1, -0.4]}
      y={[0.25, 0.75]}
      rounded
      size={15}
    />
    <Confetti cone amount={10} x={[0.4, 1]} y={[0.25, 0.75]} />
    <Confetti infinite amount={75} delay={[0, 200]} />
  {/if}

  <span class="flex flex-col text-start">
    <span class="text-[10px] opacity-100 font-mono"
      >💰{formatNumber(step.goldReward, false)}
    </span>
    <span>{step.message}</span>
  </span>
</div>
