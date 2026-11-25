<script lang="ts">
  // Selling knowledge for gold at the bank, at a market rate that moves.
  import { DB, showKnowledgeMenu } from "../store";
  import { formatAmount, formatNumber } from "$lib/utils";
  import Modal from "$lib/components/Modal.svelte";
  import Btn from "$lib/components/Btn.svelte";
  // @ts-ignore
  import LineGraph from "$lib/components/LineGraph.svelte";

  $: graphData = $DB?.economyAndLaws.knowledge_gold_market_rates ?? [];
  $: marketRate = graphData[graphData.length - 1] ?? 0;
  $: value = ($DB?.townInfo.knowledge_points ?? 0) * marketRate;

  function sell() {
    if (!$DB?.hasBank || marketRate <= 0) return;
    $DB.townInfo.gold += value;
    $DB.townInfo.knowledge_points = 0;
  }
</script>

<Modal
  open={$showKnowledgeMenu}
  title="🧠 Knowledge market"
  subtitle="{formatAmount($DB.townInfo.knowledge_points)} knowledge on hand"
  onClose={() => ($showKnowledgeMenu = false)}
>
  <div class="flex flex-row justify-between">
    <span class="opacity-70">Today's rate</span>
    <span class={marketRate > 0 ? "text-green-300" : "text-red-300"}>💰{marketRate} per point</span>
  </div>
  <LineGraph data={graphData} />
  <p class="text-xs opacity-70">
    {#if !$DB.hasBank}
      You need a bank to sell knowledge.
    {:else if marketRate <= 0}
      Wait for the rate to turn positive before selling.
    {:else}
      Selling everything now would bring in 💰{formatNumber(value)}.
    {/if}
  </p>
  <svelte:fragment slot="footer">
    <Btn variant="primary" disabled={!$DB.hasBank || marketRate <= 0} on:click={sell}>Sell all knowledge</Btn>
  </svelte:fragment>
</Modal>
