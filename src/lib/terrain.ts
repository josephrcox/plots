// Town land generation. Each town gets an irregular landmass inside its grid;
// cells outside it are "off" the map (not drawn, never usable). Expansions
// grow a new chunk of land outward in the chosen direction.
//
// Invariants (checked by `checkTerrain`):
// - All ground (land + the mineral deposit) is one hex-connected piece, so
//   every buildable tile can eventually be reached by building outward.
// - Every water tile touches ground. Water never splits the land.

import { hexNeighbourCoords } from "./neighbours";

export type Cell = "off" | "land" | "water" | "mineral";
export type Grid = Cell[][];
type Pos = [number, number];

const isGround = (c: Cell | undefined) => c === "land" || c === "mineral";

function cellAt(g: Grid, x: number, y: number): Cell | undefined {
  return g[x]?.[y];
}

function neighbours(g: Grid, x: number, y: number): Pos[] {
  return hexNeighbourCoords(x, y).filter(([i, j]) => cellAt(g, i, j) != null);
}

function groundNeighbours(g: Grid, x: number, y: number) {
  return neighbours(g, x, y).filter(([i, j]) => isGround(g[i][j])).length;
}

/** Whether all ground cells form one connected piece. */
export function groundConnected(g: Grid): boolean {
  let start: Pos | null = null;
  let total = 0;
  for (let x = 0; x < g.length; x++) {
    for (let y = 0; y < g[x].length; y++) {
      if (isGround(g[x][y])) {
        total++;
        start ??= [x, y];
      }
    }
  }
  if (!start) return true;
  const seen = new Set([start.join()]);
  const queue = [start];
  while (queue.length) {
    const [x, y] = queue.pop()!;
    for (const [i, j] of neighbours(g, x, y)) {
      const key = `${i},${j}`;
      if (!seen.has(key) && isGround(g[i][j])) {
        seen.add(key);
        queue.push([i, j]);
      }
    }
  }
  return seen.size === total;
}

/** Every water cell touches ground. */
function waterTouchesGround(g: Grid, cells: Pos[]): boolean {
  return cells.every(
    ([x, y]) => g[x][y] !== "water" || groundNeighbours(g, x, y) > 0,
  );
}

/** Both invariants; used by generation and by the tests. */
export function checkTerrain(g: Grid): boolean {
  const water: Pos[] = [];
  g.forEach((row, x) =>
    row.forEach((c, y) => c === "water" && water.push([x, y])),
  );
  return groundConnected(g) && waterTouchesGround(g, water);
}

/** Smooth random field in [0, 1], so shapes have bays and peninsulas. */
function noiseField(rows: number, cols: number, cell = 4) {
  const gx = Math.ceil(rows / cell) + 2;
  const gy = Math.ceil(cols / cell) + 2;
  const knots = Array.from({ length: gx }, () =>
    Array.from({ length: gy }, () => Math.random()),
  );
  return (x: number, y: number) => {
    const fx = x / cell;
    const fy = y / cell;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    return lerp(
      lerp(knots[x0][y0], knots[x0][y0 + 1], ty),
      lerp(knots[x0 + 1][y0], knots[x0 + 1][y0 + 1], ty),
      tx,
    );
  };
}

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Turns `count` off-map cells next to existing ground into land, one at a
 * time, so the result stays connected. `bias` steers where it grows.
 */
function growLand(
  g: Grid,
  count: number,
  bias: (x: number, y: number) => number,
  allowed: (x: number, y: number) => boolean = () => true,
): Pos[] {
  const noise = noiseField(g.length, g[0].length);
  const added: Pos[] = [];
  for (let n = 0; n < count; n++) {
    const frontier: Pos[] = [];
    const weights: number[] = [];
    for (let x = 0; x < g.length; x++) {
      for (let y = 0; y < g[x].length; y++) {
        if (g[x][y] !== "off" || !allowed(x, y)) continue;
        const touching = groundNeighbours(g, x, y);
        if (touching === 0) continue;
        frontier.push([x, y]);
        // Favour cells that close up gaps (compact shapes), shaped by noise.
        weights.push(
          (0.15 + noise(x, y) ** 2) * touching ** 2 * Math.max(1e-9, bias(x, y)),
        );
      }
    }
    if (frontier.length === 0) break;
    const [x, y] = weightedPick(frontier, weights);
    g[x][y] = "land";
    added.push([x, y]);
  }
  return added;
}

/**
 * Turns about `fraction` of `cells` into small lakes, keeping the land
 * connected and every water tile on a shore.
 */
function addWater(g: Grid, cells: Pos[], fraction: number) {
  const target = Math.round(cells.length * fraction);
  let made = 0;
  const tryWater = ([x, y]: Pos) => {
    if (g[x][y] !== "land") return false;
    g[x][y] = "water";
    const check = [[x, y] as Pos, ...neighbours(g, x, y)];
    if (groundConnected(g) && waterTouchesGround(g, check)) return true;
    g[x][y] = "land";
    return false;
  };
  for (let attempt = 0; attempt < target * 6 && made < target; attempt++) {
    const seed = cells[Math.floor(Math.random() * cells.length)];
    if (!tryWater(seed)) continue;
    made++;
    // Grow the lake a little.
    let edge = seed;
    const size = 1 + Math.floor(Math.random() * 3);
    for (let k = 1; k < size && made < target; k++) {
      const options = neighbours(g, edge[0], edge[1]).filter(
        ([i, j]) => g[i][j] === "land",
      );
      if (!options.length) break;
      const next = options[Math.floor(Math.random() * options.length)];
      if (tryWater(next)) {
        made++;
        edge = next;
      }
    }
  }
}

/** A new town: `landCount` tiles of land inside a `rows` × `cols` grid. */
export function generateTerrain(
  rows: number,
  cols: number,
  landCount: number,
): Grid {
  const g: Grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => "off" as Cell),
  );
  const cx = Math.floor(rows / 2);
  const cy = Math.floor(cols / 2);
  g[cx][cy] = "land";
  // Stay away from the very edges so expansions have somewhere to attach.
  const added = growLand(g, Math.min(landCount, rows * cols) - 1, (x, y) => {
    const dx = (x - cx) / (rows / 2);
    const dy = (y - cy) / (cols / 2);
    return 1 - Math.min(0.95, Math.hypot(dx, dy) * 0.6);
  });
  const land = [[cx, cy] as Pos, ...added];
  addWater(g, land, 0.1);

  // The mineral deposit: a well-connected land tile away from the centre.
  const candidates = land.filter(
    ([x, y]) =>
      g[x][y] === "land" &&
      groundNeighbours(g, x, y) >= 3 &&
      Math.hypot(x - cx, y - cy) >= 2,
  );
  const pool = candidates.length
    ? candidates
    : land.filter(([x, y]) => g[x][y] === "land");
  const [mx, my] = pool[Math.floor(Math.random() * pool.length)];
  g[mx][my] = "mineral";
  return g;
}

/**
 * Adds a chunk of about `count` land tiles in the newly added strip
 * (`newCells` wide, on the `direction` side). The grid must already include
 * the new (off) cells. If the land doesn't reach the strip yet, a short land
 * bridge is grown toward it first. Returns the cells that changed.
 */
export function expandTerrain(
  g: Grid,
  direction: "east" | "south",
  count: number,
  newCells = 5,
): Pos[] {
  const rows = g.length;
  const cols = g[0].length;
  const inStrip = (x: number, y: number) =>
    direction === "east" ? y >= cols - newCells : x >= rows - newCells;
  // How far toward the strip a cell is, 0..1.
  const progress = (x: number, y: number) =>
    direction === "east" ? y / (cols - 1) : x / (rows - 1);
  const stripHasGround = () =>
    g.some((row, x) => row.some((c, y) => inStrip(x, y) && isGround(c)));

  // 1. Bridge: walk the land toward the strip, a tile at a time.
  const added: Pos[] = [];
  const maxBridge = direction === "east" ? cols : rows;
  for (let n = 0; n < maxBridge && !stripHasGround(); n++) {
    // Extend from whichever frontier tile is furthest toward the strip.
    let best: Pos[] = [];
    let bestProgress = -1;
    for (let x = 0; x < rows; x++) {
      for (let y = 0; y < cols; y++) {
        if (g[x][y] !== "off" || groundNeighbours(g, x, y) === 0) continue;
        const p = progress(x, y);
        if (p > bestProgress + 1e-9) {
          best = [[x, y]];
          bestProgress = p;
        } else if (Math.abs(p - bestProgress) <= 1e-9) {
          best.push([x, y]);
        }
      }
    }
    if (!best.length) break;
    const [bx, by] = best[Math.floor(Math.random() * best.length)];
    g[bx][by] = "land";
    added.push([bx, by]);
  }

  // 2. The new chunk itself, only inside the strip.
  added.push(
    ...growLand(
      g,
      count,
      (x, y) => 0.5 + progress(x, y),
      inStrip,
    ),
  );
  addWater(g, added, 0.1);
  return added;
}
