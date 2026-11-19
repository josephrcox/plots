<script lang="ts">
  import { DB, showKnowledgeMenu } from "../store";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import { formatNumber, formatAmount } from "$lib/utils";
  // @ts-ignore
  import LineGraph from "$lib/components/LineGraph.svelte";

  $: graphData = $DB?.economyAndLaws.knowledge_gold_market_rates ?? [];
  $: marketRate = graphData[graphData.length - 1] ?? 0;

  function convertKnowledgeToGold() {
    if (!$DB?.hasBank || marketRate <= 0) return;
    $DB.townInfo.gold += $DB.townInfo.knowledge_points * marketRate;
    $DB.townInfo.knowledge_points = 0;
  }
</script>

<Dialog.Root bind:open={$showKnowledgeMenu}>
  <Dialog.Content
    transitionConfig={{ duration: 0 }}
    class="bg-foreground text-accentText"
  >
    <Dialog.Header>
      <Dialog.Title
        >Manage your Knowledge ({formatAmount($DB.townInfo.knowledge_points)} pts)</Dialog.Title
      >
      <Dialog.Description>
        <!--  -->
      </Dialog.Description>
    </Dialog.Header>
    <span class="">Knowledge is power, unlock it!</span>
    <div class="py-0 flex flex-col gap-4 text-gray-400 overflow-x-auto">
      <div>
        Market Rate: <span
          class="
				{marketRate < 0 ? 'text-red-500' : 'text-green-500'}
			">{marketRate ?? 0} gold</span
        >
        per Knowledge Point
        {#if marketRate > 0}
          <br />
          (total value: ${formatNumber(
            $DB.townInfo.knowledge_points * marketRate,
          )})
        {/if}
      </div>
      <LineGraph data={graphData} />

      {#if marketRate < 0}
        <div>
          Wait until the market value is <span class="text-green-500"
            >positive</span
          > to sell your Knowledge for Gold. Keep in mind that you need a bank to
          convert.
        </div>
      {/if}
      {#if $DB.hasBank && marketRate > 0}
        <div>
          <Button variant={"default"} on:click={convertKnowledgeToGold}>
            Convert Knowledge to Gold
          </Button>
        </div>
      {/if}
      {#if $DB.hasBank === false}
        <div>You need a bank to convert knowledge to gold.</div>
      {/if}
    </div>
    <Dialog.Footer>
      <!--  -->
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  /* nothin' */
</style>
