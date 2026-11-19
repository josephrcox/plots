<script lang="ts">
  import Header from "./Header.svelte";
  import PlotController from "./PlotController.svelte";
  import LeftSidebar from "./LeftSidebar.svelte";
  import RightSidebar from "./RightSidebar.svelte";
</script>

<div class="flex flex-col max-h-[100%] justify-between">
  <div>
    <Header />
  </div>
  <div class="flex flex-row text-accentText">
    <LeftSidebar />
    <PlotController />
    <RightSidebar />
  </div>
</div>

<style>
  /*  */
</style>
