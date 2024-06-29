<script lang="ts">
  import Header from "./Header.svelte";
  import PlotController from "./PlotController.svelte";
  import { roundTo } from "./utils";
  import { DB, ACTIVE_GAME_DB_NAME } from "./store";
  import LeftSidebar from "./LeftSidebar.svelte";
  import RightSidebar from "./RightSidebar.svelte";
  import BottomBar from "./BottomBar.svelte";

  function setTaxRate(e: any) {
    let z = $DB;
    z.economyAndLaws.tax_rate = roundTo(e.target.value, 2);
    DB.set(z);
    localStorage.setItem(ACTIVE_GAME_DB_NAME, JSON.stringify(z));
  }
</script>

<!-- fixed to left side and fill entire height -->
<div class="flex flex-col max-h-[100%] justify-between">
  <div>
    <Header />
  </div>
  <div class="flex flex-row text-foregroundText">
    <LeftSidebar />
    <PlotController />
    <RightSidebar />
    <BottomBar />
  </div>
</div>

<style>
  /*  */
</style>
