<script lang="ts">
  // One townsperson: a compact row that opens into their card (#64).
  import { DB } from "./store";
  import {
    ageOf,
    careerOf,
    CAREERS,
    EDU_LEVELS,
    FAVOURITES,
    GUARD,
    moodFace,
    moodParts,
    personMood,
    plotById,
    worksDream,
    stageOf,
  } from "./people";
  import { options } from "./objects/PlotTypeOptions";
  import type { Person } from "./types";

  export let person: Person;
  let open = false;

  $: z = $DB!;
  $: age = ageOf(person, z);
  $: ageEmoji = age < 18 ? "🧒" : age >= 65 ? "🧓" : "🧑";
  $: mood = personMood(person, z);
  $: dream = CAREERS.find((c) => c.id === person.dream);
  $: jobPlot = person.job && person.job !== GUARD ? plotById(z, person.job) : undefined;
  $: jobOption = jobPlot ? options[jobPlot.type] : undefined;
  $: stage = stageOf(person, z);
  $: jobTitle =
    person.job === GUARD
      ? "Guardian"
      : jobOption
        ? `${careerOf(jobOption.id)?.title ?? "Worker"} at the ${jobOption.title.toLowerCase()}`
        : stage === "child"
          ? "Too young to work"
          : stage === "elder"
            ? "Retired"
            : "Out of work";
  $: isDream = worksDream(person, z);
  $: fav = options.find((o) => o.id === person.fav);
  $: traits = [
    person.work >= 1.1 ? "hard worker" : person.work <= 0.9 ? "takes it easy" : "",
    person.appetite >= 1.1 ? "big eater" : person.appetite <= 0.9 ? "small appetite" : "",
    person.restless ? "restless" : "",
  ].filter(Boolean);
  $: parts = open ? moodParts(person, z).sort((a, b) => a.amount - b.amount) : [];
</script>

<div class="person" class:open>
  <button class="row" on:click={() => (open = !open)}>
    <span>{moodFace(mood)}</span>
    <span class="name">{person.name}</span>
    <span class="opacity-60">{ageEmoji}{age}</span>
    {#if isDream}<span title="Works their dream job">⭐</span>{/if}
  </button>
  {#if open}
    <div class="card">
      <span>{jobTitle}{isDream ? " ⭐ dream job" : ""}</span>
      {#if !isDream && dream}
        <span class="opacity-75">Dreams of being a {dream.title.toLowerCase()} {dream.emoji}</span>
      {/if}
      {#if fav}
        <span class="opacity-75">{fav.emoji} {FAVOURITES[person.fav]?.reason ?? `loves the ${fav.title.toLowerCase()}`}</span>
      {/if}
      <span class="opacity-75"
        >🎓 {EDU_LEVELS[Math.floor(person.edu)]}{traits.length ? ` · ${traits.join(", ")}` : ""}</span
      >
      {#each parts as part}
        <span class={part.amount >= 0 ? "text-green-300" : "text-red-300"}
          >{part.amount >= 0 ? "+" : ""}{Math.round(part.amount)} {part.text}</span
        >
      {/each}
    </div>
  {/if}
</div>

<style>
  .row {
    display: flex;
    gap: 6px;
    align-items: center;
    width: 100%;
    text-align: left;
    font-size: 0.72rem;
    padding: 2px 4px;
    border-radius: 6px;
  }
  .row:hover {
    background: rgba(255, 255, 255, 0.07);
  }
  .name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 0.68rem;
    padding: 4px 8px 6px 24px;
  }
</style>
