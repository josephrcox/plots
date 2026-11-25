// Town needs that grow with the town (#48). Placeholder until #48 lands:
// home levels (housing.ts) ask here whether the town's needs allow a level.
import type { Game } from "./types";

export function needsAllowLevel(_z: Game, _level: number): { ok: boolean; reason: string } {
  return { ok: true, reason: "" };
}
