<script lang="ts">
  // Right panel: town stats and milestones. Collapsible.
  import { fly } from "svelte/transition";
  import { formatNumber, roundTo } from "./utils";
  import { DB, showTutorialStepConfetti, countJobs } from "./store";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import Separator from "./components/ui/separator/separator.svelte";
  import { Progress } from "$lib/components/ui/progress/index.js";
  import { tutorialMessages } from "./objects/tutorial_messages";
  import Milestone from "./Milestone.svelte";
  import Confetti from "svelte-confetti";
  import { rightPanelOpen, inspected, HUD } from "./ui";

  let showCompleted = false;
  $: completedCount = tutorialMessages.filter((step) =>
    step.isComplete($DB),
  ).length;

  const statColor = (value: number) =>
    value > 149 ? "bg-green-500" : value > 99 ? "bg-yellow-500" : "bg-red-500";

  const employmentColor = (ratio: number) =>
    ratio === 1 ? "bg-green-500" : ratio > 0.9 ? "bg-yellow-500" : "bg-red-500";

  function builtCount(z: any) {
    let count = 0;
    for (const row of z.plots) {
      for (const p of row) if (p.active && p.type > -1) count++;
    }
    return count;
  }

  $: built = builtCount($DB);
  $: attributes = [
    {
      name: "Happiness",
      description:
        "Happy townspeople spend more money and are less likely to leave.",
      value: $DB.townInfo.happiness,
      color: statColor($DB.townInfo.happiness),
      max: $DB.maximums.happiness,
    },
    {
      name: "Health",
      description:
        "Healthy townspeople are less likely to die (and leave the town obviously).",
      value: $DB.townInfo.health,
      color: statColor($DB.townInfo.health),
      max: $DB.maximums.health,
    },
    {
      name: "Community",
      description:
        "Townspeople that feel at home are less likely to leave, and less likely to get bored.",
      value: $DB.townInfo.community,
      color: statColor($DB.townInfo.community),
      max: $DB.maximums.community,
    },
    {
      name: "Jobs filled",
      description:
        "How many of your buildings' jobs have workers. Buildings without enough workers produce and earn less; the newest ones go short first. Build homes to bring in more people.",
      value: $DB.townInfo.employees,
      color: employmentColor(
        countJobs($DB) > 0 ? $DB.townInfo.employees / countJobs($DB) : 1,
      ),
      max: countJobs($DB),
    },
    {
      name: "🛝 Recreation",
      description:
        "How many of your buildings provide recreation, which keeps townspeople happy. As your town grows, build enough 🛝 plots (about 1 in 5).",
      value: $DB.townInfo.recreation,
      color:
        $DB.townInfo.recreation / Math.max(1, built) >= 0.2
          ? "bg-green-500"
          : "bg-orange-300",
      max: built,
    },
  ];
</script>

{#if !$rightPanelOpen}
  <button
    class="fixed right-3 z-20 bg-sidebarBackground text-sidebarText rounded-lg shadow-lg px-3 py-2 text-sm"
    style="top:{HUD.top + 8}px;"
    title="Show stats panel"
    on:click={() => ($rightPanelOpen = true)}>‹ Stats 📊</button
  >
{:else}
  <div
    class="bg-sidebarBackground text-sidebarText border-foreground border-4 z-20 rounded-xl px-3 pt-2 overflow-y-auto no-scrollbar fixed right-3 bottom-3 drop-shadow-xl
    {$inspected ? 'invisible' : ''}"
    style="top:{HUD.top + 8}px; width:{HUD.panel - 16}px;"
    transition:fly={{ x: 40, duration: 150 }}
  >
    <button
      class="absolute top-1 left-2 text-sm opacity-50 hover:opacity-100"
      title="Hide panel"
      on:click={() => ($rightPanelOpen = false)}>›</button
    >
    <div class="flex flex-col gap-2 w-full pb-4">
      <h1 class="text-lg w-full text-center pb-1">Stats</h1>
      {#each attributes as { name, value, color, description, max }}
        <Tooltip.Root openDelay={300} closeDelay={0}>
          <Tooltip.Trigger
            class="w-full flex flex-row items-center justify-between text-sm hover:brightness-110"
          >
            <span class="pr-2">{name}</span>
            <Progress
              {value}
              max={max || 1}
              class="min-w-[90px] max-w-[90px]"
              {color}
              text={`${roundTo(value, 0)} / ${roundTo(max, 0)}`}
            />
          </Tooltip.Trigger>
          <Tooltip.Content class="rounded-2xl text-white {color}">
            <div class="flex flex-col max-w-48">
              <span class="text-md"
                >{name}: {formatNumber(value, false)} out of {max}</span
              >
              <Separator class="mb-2 mt-1" />
              <span>{description}</span>
            </div>
          </Tooltip.Content>
        </Tooltip.Root>
      {/each}
    </div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="w-full text-center noselect flex flex-col cursor-pointer"
      on:click={() => (showCompleted = !showCompleted)}
    >
      {#if $showTutorialStepConfetti}
        <Confetti cone x={[-0.5, 0.5]} />
        <Confetti cone amount={50} x={[-1, -0.4]} y={[0.25, 0.75]} rounded size={8} />
        <Confetti cone amount={10} x={[0.4, 1]} y={[0.25, 0.75]} />
        <Confetti infinite amount={75} delay={[0, 200]} />
      {/if}
      <h1 class="text-lg">Milestones</h1>
      {#if $DB.currentTutorialStep > 0}
        <span class="text-xs opacity-65 pb-2"
          >{showCompleted ? "Hide" : "Show"} {completedCount} completed</span
        >
      {/if}
    </div>
    <div class="pb-4">
      {#each tutorialMessages as step, index}
        {#if showCompleted || index == $DB.currentTutorialStep || !step.isComplete($DB)}
          <Milestone {index} {step} />
        {/if}
      {/each}
    </div>
  </div>
{/if}
