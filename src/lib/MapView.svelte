<script lang="ts">
  // The full-screen map: a camera (drag / wheel / keys) over absolutely
  // positioned hex tiles. Clicks are handled here, by tool:
  //   build     → place on a highlighted tile (the tool stays active)
  //   bulldoze  → remove the clicked building
  //   none      → built tile opens the inspector; empty tile becomes the
  //               build bar's target
  import { onMount } from "svelte";
  import {
    DB,
    paused,
    settingLiegeLocation,
    setLiegeLocation,
    isReadOnly,
    reverseClear,
    isLiegeOnPlot,
    staffing,
  } from "./store";
  import {
    tool,
    targetTile,
    inspected,
    hovered,
    placementCheck,
    optionById,
    leftPanelOpen,
    rightPanelOpen,
    HUD,
    overlay,
    type Check,
    type Tool,
  } from "./ui";
  import {
    placePlot,
    checkIfPlotCanBeUpgraded,
    suggestedStart,
    townHasStarted,
    isAdjacentToWater,
    analyticsEvent,
  } from "./utils";
  import { previewPlacement } from "./neighbours";
  import {
    landValue,
    landValueWord,
    landValueTone,
    pollutionAt,
    pollutionWord,
  } from "./land";
  import Plot, {
    TILE_W,
    TILE_H,
    COL_STEP,
    ROW_STEP,
    tileLeft,
    tileTop,
    type TileState,
  } from "./Plot.svelte";
  import ExpandButton from "./ExpandButton.svelte";
  import { homeOccupancy } from "./migration";
  import { options } from "./objects/PlotTypeOptions";
  import { levelStatus, homeCapacity } from "./housing";
  import { coverage } from "./needs";
  import { siteOf, allowedTitles } from "./sites";
  import { isFogged, showsFog } from "./fog";
  import Signal from "./components/Signal.svelte";
  import { strength, STEPS } from "./strength";
  import HoverCard from "./HoverCard.svelte";
  import { Events, type Plot as PlotData } from "./types";

  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 2.5;
  const KEY_PAN_SPEED = 700; // px per second
  const DRAG_THRESHOLD = 5;

  let viewport: HTMLDivElement;
  let cam = { x: 0, y: 0, zoom: 1 };
  let mouse = { x: 0, y: 0 };

  $: cameraKey = `plots.camera.${$DB?.gameId}`;
  $: rows = $DB?.plots.length ?? 0;
  $: cols = $DB?.plots[0]?.length ?? 0;
  $: worldW = cols * COL_STEP + COL_STEP / 2;
  $: worldH = Math.max(0, rows - 1) * ROW_STEP + TILE_H;

  // ---------------------------------------------------------------------------
  // Tile state
  // ---------------------------------------------------------------------------

  $: buildOption = $tool.kind === "build" ? optionById($tool.id) : undefined;

  // Where the current build tool can go: computed once per change, not per tile.
  let placeable: boolean[][] = [];
  $: placeable =
    $DB && buildOption
      ? $DB.plots.map((row) =>
          row.map((p) => placementCheck(buildOption!, p.x, p.y, $DB!).ok),
        )
      : [];

  // Buildings without all their workers get a badge; homes show how full.
  $: staff = $DB ? staffing($DB) : null;
  $: occupancy = $DB ? homeOccupancy($DB) : null;
  // Home levels and where they're heading (#60).
  $: levels = (() => {
    const m = new Map<string, { level: number; trend: "up" | "down" | "steady" }>();
    if (!$DB || !occupancy) return m;
    const cov = coverage($DB);
    for (const row of $DB.plots) {
      for (const p of row) {
        if (homeCapacity(p) === 0) continue;
        const o = occupancy.get(p.id);
        const s = levelStatus(p, $DB, !!o && o.people >= o.capacity, cov);
        m.set(p.id, { level: s.level, trend: s.trend });
      }
    }
    return m;
  })();

  // Before the first building, point at a good starting tile.
  $: startTile = $DB && !townHasStarted($DB) ? suggestedStart($DB) : null;

  $: buildable = $DB
    ? $DB.plots.map((row) =>
        row.map(
          (p) =>
            !p.active && !p.water && checkIfPlotCanBeUpgraded(p.x, p.y, $DB!),
        ),
      )
    : [];

  type Pos = { x: number; y: number } | null;
  const same = (a: Pos, x: number, y: number) => a?.x === x && a?.y === y;

  function stateFor(
    plot: PlotData,
    current: Tool,
    hover: Pos,
    target: Pos,
    inspect: Pos,
    canPlace: boolean[][],
  ): TileState {
    const { x, y } = plot;
    const isHovered = same(hover, x, y);
    if (same(target, x, y) || same(inspect, x, y)) return "selected";
    if (current.kind === "build") {
      if (canPlace[x]?.[y]) return isHovered ? "ghost" : "placeable";
      if (isHovered && !plot.water) return "blocked";
      return plot.active ? "normal" : "dim";
    }
    if (current.kind === "bulldoze") {
      if (!plot.active) return "dim";
      return isHovered ? "doomed" : "normal";
    }
    return "normal";
  }

  // Re-evaluated whenever any input changes.
  $: tileStates = $DB
    ? $DB.plots.map((row) =>
        row.map((p) =>
          stateFor(p, $tool, $hovered, $targetTile, $inspected, placeable),
        ),
      )
    : null;

  // Overlay tints (#59). Land value: red below ordinary, green above.
  // Pollution: brown, stronger the dirtier.
  function overlayFor(p: PlotData, mode: string, z: typeof $DB) {
    if (mode === "none" || !z || p.water || p.offMap || isFogged(z, p)) return null;
    if (mode === "pollution") {
      const v = p.pollution ?? 0;
      if (v < 1) return { tint: "rgba(80, 200, 120, 0.18)", label: null };
      const a = Math.min(0.85, 0.2 + v / 110);
      return { tint: `rgba(110, 60, 30, ${a})`, label: null };
    }
    const v = landValue(p.x, p.y, z).value;
    if (landValueTone(v) === "neutral") return { tint: "rgba(200, 200, 200, 0.15)", label: null };
    const d = (v - 50) / 50;
    const tint =
      d >= 0
        ? `rgba(40, 190, 90, ${0.15 + d * 0.6})`
        : `rgba(220, 60, 50, ${0.15 + -d * 0.6})`;
    return { tint, label: null };
  }
  $: overlays = $DB
    ? $DB.plots.map((row) => row.map((p) => overlayFor(p, $overlay, $DB)))
    : [];

  function cycleOverlay() {
    overlay.update((o) => (o === "none" ? "land" : o === "land" ? "pollution" : "none"));
  }

  // Hover card for the build / bulldoze tools.
  let hoverCheck: Check | null = null;
  let hoverPreview: { text: string; good: boolean }[] = [];
  $: {
    hoverCheck = null;
    hoverPreview = [];
    if ($DB && $hovered && buildOption) {
      const { x, y } = $hovered;
      if (!$DB.plots[x][y].water) {
        hoverCheck = placementCheck(buildOption, x, y, $DB);
        if (hoverCheck.ok) {
          hoverPreview = previewPlacement(buildOption.id, x, y, $DB);
        }
      }
    }
  }
  $: hoveredPlot = $DB && $hovered ? $DB.plots[$hovered.x]?.[$hovered.y] : null;

  // ---------------------------------------------------------------------------
  // Clicks
  // ---------------------------------------------------------------------------

  let dragged = false;

  function tileFromEvent(e: Event) {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-x]");
    if (!el) return null;
    return { x: Number(el.dataset.x), y: Number(el.dataset.y) };
  }

  function handleClick(e: MouseEvent) {
    if (dragged || !$DB || isReadOnly) return;
    const pos = tileFromEvent(e);
    if (!pos) {
      // Clicking empty space clears the target and inspector (not the tool).
      targetTile.set(null);
      inspected.set(null);
      return;
    }
    const z = $DB;
    const plot = z.plots[pos.x][pos.y];

    if ($settingLiegeLocation) {
      if (plot.active) setLiegeLocation(pos.x, pos.y, z);
      return;
    }
    // No building while paused or while the game-over dialog is up.
    if ($paused || z.endGameDetails.msg !== "") return;

    if ($tool.kind === "build" && buildOption) {
      if (!placeable[pos.x]?.[pos.y]) return;
      if (placePlot(z, pos.x, pos.y, buildOption.id)) {
        analyticsEvent(z, Events.BUILD_PLOT, {
          plot_type: buildOption.id,
          x: pos.x.toString(),
          y: pos.y.toString(),
          end_goal: z.endGoal,
          day: z.environment.day,
          settings: z.gameSettings.join(","),
        });
        DB.set(z);
      }
      return;
    }
    if ($tool.kind === "bulldoze") {
      if (!plot.active) return;
      if ($inspected?.x === pos.x && $inspected?.y === pos.y) {
        inspected.set(null);
      }
      reverseClear(pos.x, pos.y, z);
      return;
    }

    if (plot.active) {
      targetTile.set(null);
      inspected.set(pos);
    } else if (buildable[pos.x]?.[pos.y] || (plot.site === "mineral" && !isFogged(z, plot))) {
      inspected.set(null);
      const same = $targetTile?.x === pos.x && $targetTile?.y === pos.y;
      targetTile.set(same ? null : pos);
    } else {
      targetTile.set(null);
      inspected.set(null);
    }
  }

  function handleContextMenu(e: MouseEvent) {
    // Right-click cancels the current tool, like most builders.
    e.preventDefault();
    if ($tool.kind !== "none") tool.set({ kind: "none" });
    else {
      targetTile.set(null);
      inspected.set(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Camera
  // ---------------------------------------------------------------------------

  function clampZoom(z: number) {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
  }

  function zoomAt(factor: number, sx: number, sy: number) {
    const zoom = clampZoom(cam.zoom * factor);
    const wx = (sx - cam.x) / cam.zoom;
    const wy = (sy - cam.y) / cam.zoom;
    cam = { zoom, x: sx - wx * zoom, y: sy - wy * zoom };
  }

  /** The part of the screen not covered by the HUD. */
  function visibleRect() {
    const left = $leftPanelOpen ? HUD.panel : 0;
    const right = $rightPanelOpen ? HUD.panel : 0;
    return {
      left,
      top: HUD.top,
      width: Math.max(200, window.innerWidth - left - right),
      height: Math.max(200, window.innerHeight - HUD.top - HUD.bottom),
    };
  }

  /** Frames the built part of the town (plus a margin of free land). */
  export function fitTown() {
    if (!$DB) return;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    // Frame the buildings, or all of the land before anything is built.
    const started = townHasStarted($DB);
    for (const row of $DB.plots) {
      for (const p of row) {
        if (started ? !p.active : p.offMap || isFogged($DB, p)) continue;
        minX = Math.min(minX, tileLeft(p.x, p.y));
        maxX = Math.max(maxX, tileLeft(p.x, p.y) + TILE_W);
        minY = Math.min(minY, tileTop(p.x));
        maxY = Math.max(maxY, tileTop(p.x) + TILE_H);
      }
    }
    if (minX === Infinity) {
      // No land at all (shouldn't happen): frame the corner.
      minX = 0;
      minY = 0;
      maxX = TILE_W;
      maxY = TILE_H;
    }
    const margin = (started ? 2 : 0.5) * COL_STEP;
    minX -= margin;
    minY -= margin;
    maxX += margin;
    maxY += margin;
    const view = visibleRect();
    const zoom = clampZoom(
      Math.min(1.2, view.width / (maxX - minX), view.height / (maxY - minY)),
    );
    cam = {
      zoom,
      x: view.left + view.width / 2 - ((minX + maxX) / 2) * zoom,
      y: view.top + view.height / 2 - ((minY + maxY) / 2) * zoom,
    };
  }

  // Remember the camera per town.
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  $: if (cam && $DB) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(cameraKey, JSON.stringify(cam));
      } catch {}
    }, 300);
  }

  function loadCamera() {
    try {
      const saved = JSON.parse(localStorage.getItem(cameraKey) ?? "null");
      if (saved && [saved.x, saved.y, saved.zoom].every(Number.isFinite)) {
        cam = { ...saved, zoom: clampZoom(saved.zoom) };
        return;
      }
    } catch {}
    fitTown();
  }

  // Mouse wheels zoom; trackpad two-finger scrolls pan; pinches (ctrlKey) zoom.
  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const mouseWheel =
      e.deltaMode === 1 ||
      (e.deltaX === 0 && Math.abs(e.deltaY) >= 50 && Number.isInteger(e.deltaY));
    if (e.ctrlKey || mouseWheel) {
      const speed = e.ctrlKey ? 0.01 : 0.0015;
      zoomAt(Math.exp(-e.deltaY * speed), e.clientX, e.clientY);
    } else {
      cam = { ...cam, x: cam.x - e.deltaX, y: cam.y - e.deltaY };
    }
  }

  // Drag to pan (any button); two fingers to pinch-zoom.
  const pointers = new Map<number, { x: number; y: number }>();
  let dragStart: { x: number; y: number; camX: number; camY: number } | null =
    null;
  let pinchStart: { dist: number; zoom: number } | null = null;

  function handlePointerDown(e: PointerEvent) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged = false;
    if (pointers.size === 1) {
      dragStart = { x: e.clientX, y: e.clientY, camX: cam.x, camY: cam.y };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: cam.zoom };
      dragged = true;
    }
  }

  function handlePointerMove(e: PointerEvent) {
    mouse = { x: e.clientX, y: e.clientY };
    if (e.pointerType === "mouse" || pointers.size === 0) {
      const pos = tileFromEvent(e);
      if (pos?.x !== $hovered?.x || pos?.y !== $hovered?.y) hovered.set(pos);
    }
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2 && pinchStart) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const target = clampZoom((pinchStart.zoom * dist) / pinchStart.dist);
      zoomAt(target / cam.zoom, (a.x + b.x) / 2, (a.y + b.y) / 2);
      return;
    }
    if (!dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (!dragged && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!dragged) {
      dragged = true;
      viewport.setPointerCapture(e.pointerId);
    }
    cam = { ...cam, x: dragStart.camX + dx, y: dragStart.camY + dy };
  }

  function handlePointerUp(e: PointerEvent) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
    if (pointers.size === 0) dragStart = null;
  }

  // Keyboard: WASD / arrows pan, +/- zoom, F fits the town.
  const held = new Set<string>();
  const PAN_KEYS: Record<string, [number, number]> = {
    w: [0, 1],
    arrowup: [0, 1],
    s: [0, -1],
    arrowdown: [0, -1],
    a: [1, 0],
    arrowleft: [1, 0],
    d: [-1, 0],
    arrowright: [-1, 0],
  };

  function keyboardBlocked(e: KeyboardEvent) {
    const active = document.activeElement?.nodeName;
    return (
      e.metaKey ||
      e.ctrlKey ||
      e.altKey ||
      active === "INPUT" ||
      active === "TEXTAREA" ||
      $paused ||
      document.querySelector("[role=dialog], [role=alertdialog]") != null
    );
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (keyboardBlocked(e)) return;
    const key = e.key.toLowerCase();
    if (PAN_KEYS[key]) {
      e.preventDefault();
      if (!e.repeat) {
        // A quick tap still nudges the map; holding pans smoothly.
        const [dx, dy] = PAN_KEYS[key];
        cam = { ...cam, x: cam.x + dx * 40, y: cam.y + dy * 40 };
      }
      held.add(key);
      startKeyPan();
    } else if (key === "f") {
      fitTown();
    } else if (key === "o") {
      cycleOverlay();
    } else if (key === "=" || key === "+") {
      zoomAt(1.2, window.innerWidth / 2, window.innerHeight / 2);
    } else if (key === "-" || key === "_") {
      zoomAt(1 / 1.2, window.innerWidth / 2, window.innerHeight / 2);
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    held.delete(e.key.toLowerCase());
  }

  let panFrame = 0;
  let lastFrame = 0;
  function startKeyPan() {
    if (panFrame) return;
    lastFrame = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      let dx = 0,
        dy = 0;
      for (const key of held) {
        dx += PAN_KEYS[key][0];
        dy += PAN_KEYS[key][1];
      }
      if (held.size === 0) {
        panFrame = 0;
        return;
      }
      cam = {
        ...cam,
        x: cam.x + dx * KEY_PAN_SPEED * dt,
        y: cam.y + dy * KEY_PAN_SPEED * dt,
      };
      panFrame = requestAnimationFrame(step);
    };
    panFrame = requestAnimationFrame(step);
  }

  onMount(() => {
    loadCamera();
    // The wheel listener must be non-passive to stop the page zooming.
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    const clearKeys = () => held.clear();
    window.addEventListener("blur", clearKeys);
    return () => {
      viewport.removeEventListener("wheel", handleWheel);
      window.removeEventListener("blur", clearKeys);
      cancelAnimationFrame(panFrame);
    };
  });
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

{#if $DB}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    bind:this={viewport}
    class="fixed inset-0 overflow-hidden touch-none select-none"
    class:cursor-grabbing={dragged && dragStart}
    on:click={handleClick}
    on:contextmenu={handleContextMenu}
    on:pointerdown={handlePointerDown}
    on:pointermove={handlePointerMove}
    on:pointerup={handlePointerUp}
    on:pointercancel={handlePointerUp}
    on:pointerleave={() => hovered.set(null)}
  >
    <div
      class="absolute left-0 top-0 origin-top-left"
      style="width:{worldW}px; height:{worldH}px; transform: translate({cam.x}px, {cam.y}px) scale({cam.zoom});"
    >
      {#each $DB.plots as row, x}
        {#each row as plot, y (plot.id)}
          {#if !plot.offMap || showsFog($DB, plot)}
          <Plot
            data={plot}
            buildable={buildable[x]?.[y] ?? false}
            nearWater={isAdjacentToWater(x, y, $DB)}
            liegeHere={isLiegeOnPlot(x, y, $DB)}
            state={tileStates ? tileStates[x][y] : "normal"}
            ghostEmoji={buildOption?.emoji ?? ""}
            crosshair={$settingLiegeLocation && plot.active}
            startHint={startTile?.[0] === x && startTile?.[1] === y}
            occupancy={occupancy?.get(plot.id) ?? null}
            fogged={showsFog($DB, plot)}
            homeLevel={levels.get(plot.id)?.level ?? 0}
            levelTrend={levels.get(plot.id)?.trend ?? "steady"}
            tint={overlays[x]?.[y]?.tint ?? null}
            tintLabel={overlays[x]?.[y]?.label ?? null}
            understaffed={(() => {
              const s = staff?.get(plot.id);
              // Places for retirees fill as people retire; not a shortage.
              if (plot.type > -1 && options[plot.type]?.type === "retirement") return false;
              return !!s && s.staffed < s.needed;
            })()}
          />
          {/if}
        {/each}
      {/each}

      <div
        class="absolute"
        style="left:{worldW + 30}px; top:{worldH / 2 - 60}px;"
        on:pointerdown|stopPropagation
      >
        <ExpandButton direction="east" />
      </div>
      <div
        class="absolute"
        style="left:{worldW / 2 - 96}px; top:{worldH + 30}px;"
        on:pointerdown|stopPropagation
      >
        <ExpandButton direction="south" />
      </div>
    </div>
  </div>

  <!-- Camera controls -->
  <div
    class="fixed z-20 flex flex-col gap-1"
    style="right:{$rightPanelOpen ? HUD.panel + 12 : 12}px; bottom:{HUD.bottom +
      8}px;"
  >
    <button
      class="cam-btn"
      title="Zoom in (+)"
      on:click={() =>
        zoomAt(1.2, window.innerWidth / 2, window.innerHeight / 2)}>＋</button
    >
    <button
      class="cam-btn"
      title="Zoom out (−)"
      on:click={() =>
        zoomAt(1 / 1.2, window.innerWidth / 2, window.innerHeight / 2)}
      >－</button
    >
    <button class="cam-btn text-xs" title="Fit town (F)" on:click={fitTown}
      >⤢</button
    >
    <button
      class="cam-btn mt-2"
      class:active={$overlay === "land"}
      title="Land value overlay (O)"
      on:click={() => overlay.set($overlay === "land" ? "none" : "land")}>🏡</button
    >
    <button
      class="cam-btn"
      class:active={$overlay === "pollution"}
      title="Pollution overlay (O)"
      on:click={() => overlay.set($overlay === "pollution" ? "none" : "pollution")}
      >🏭</button
    >
  </div>

  {#if $overlay !== "none"}
    <div
      class="fixed z-20 rounded-lg bg-popupBackground text-white text-xs px-3 py-2 shadow-xl"
      style="right:{($rightPanelOpen ? HUD.panel + 12 : 12) + 44}px; bottom:{HUD.bottom + 8}px;"
    >
      {#if $overlay === "land"}
        <div class="font-semibold mb-1">🏡 Land value</div>
        <div class="legend land"></div>
        <div class="flex justify-between opacity-80"><span>Blighted</span><span>Prime</span></div>
        <div class="opacity-70 mt-1 w-52">Parks, churches, healers and water raise it; pollution and noise lower it. Homes on good land are happier.</div>
      {:else}
        <div class="font-semibold mb-1">🏭 Pollution</div>
        <div class="legend pollution"></div>
        <div class="flex justify-between opacity-80"><span>Clean</span><span>Toxic</span></div>
        <div class="opacity-70 mt-1 w-52">Mines, quarries, smithies and mills pollute 2 tiles around them. It builds up over months and fades slowly. Parks and tree farms clean it.</div>
      {/if}
    </div>
  {/if}

  {#if $overlay === "none" && $tool.kind === "none" && hoveredPlot && siteOf(hoveredPlot) && !isFogged($DB, hoveredPlot) && !dragged}
    {@const site = siteOf(hoveredPlot)}
    <div
      class="fixed z-30 pointer-events-none w-56 rounded-lg bg-popupBackground text-white text-xs p-2 shadow-xl flex flex-col gap-1"
      style="left:{Math.min(mouse.x + 18, window.innerWidth - 240)}px; top:{Math.min(mouse.y + 18, window.innerHeight - 160)}px;"
    >
      <span class="font-semibold">{site?.emoji} {site?.title}</span>
      <span class="text-green-300">{site?.bonus}</span>
      <span class="opacity-75">Fits: {site ? allowedTitles(site) : ""}</span>
    </div>
  {/if}

  {#if $overlay !== "none" && $tool.kind === "none" && hoveredPlot && !hoveredPlot.water && !hoveredPlot.offMap && !isFogged($DB, hoveredPlot) && !dragged && $DB}
    {@const lv = landValue(hoveredPlot.x, hoveredPlot.y, $DB)}
    {@const pol = pollutionAt($DB, hoveredPlot.x, hoveredPlot.y)}
    <div
      class="fixed z-30 pointer-events-none w-56 rounded-lg bg-popupBackground text-white text-xs p-2 shadow-xl flex flex-col gap-1"
      style="left:{Math.min(mouse.x + 18, window.innerWidth - 240)}px; top:{Math.min(mouse.y + 18, window.innerHeight - 160)}px;"
    >
      <span class="font-semibold">🏡 {landValueWord(lv.value)} land</span>
      {#each lv.parts as part}
        <span class={part.amount >= 0 ? "text-green-300" : "text-red-300"}
          ><Signal level={Math.max(1, strength(part.amount, STEPS.land))} tone={part.amount >= 0 ? "good" : "bad"} />
          {part.text}</span
        >
      {/each}
      <span class="font-semibold mt-1"
        >🏭 {pollutionWord(pol)} air{#if pol >= 1}<Signal level={Math.max(1, strength(pol, STEPS.pollution))} tone="bad" />{/if}</span
      >
    </div>
  {/if}

  {#if $tool.kind !== "none" && hoveredPlot && !hoveredPlot.water && !dragged}
    <HoverCard
      x={mouse.x}
      y={mouse.y}
      option={buildOption}
      check={hoverCheck}
      preview={hoverPreview}
      bulldozeTarget={$tool.kind === "bulldoze" && hoveredPlot.active
        ? hoveredPlot
        : null}
    />
  {/if}
{/if}

<style>
  .cam-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(250, 243, 224, 0.95);
    color: rgb(47, 65, 80);
    font-weight: 600;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
  .cam-btn:hover {
    filter: brightness(0.95);
  }
  .cam-btn.active {
    background: rgb(250, 204, 21);
  }
  .legend {
    height: 8px;
    border-radius: 4px;
    width: 208px;
  }
  .legend.land {
    background: linear-gradient(to right, rgba(220, 60, 50, 0.9), rgba(200, 200, 200, 0.3), rgba(40, 190, 90, 0.9));
  }
  .legend.pollution {
    background: linear-gradient(to right, rgba(80, 200, 120, 0.4), rgba(110, 60, 30, 0.95));
  }
</style>
