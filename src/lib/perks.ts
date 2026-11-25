// Perks: things achievements unlock for future towns. When founding a town
// you may bring up to MAX_PERKS of the ones you've unlocked. Chosen perks are
// stored in the town's gameSettings as "perk:<id>".

import type { Game, UserDatabase } from "./types";
import { achievements } from "./objects/AchievementList";

export type PerkId =
  | "founders_fund"
  | "seed_bank"
  | "lumber_stock"
  | "old_maps"
  | "surveyor"
  | "planned_homes"
  | "wise_elders"
  | "dreamers"
  | "learned_settlers"
  | "generous"
  | "resilient";

export type Perk = { id: PerkId; icon: string; title: string; about: string };

export const PERKS: Perk[] = [
  { id: "founders_fund", icon: "💰", title: "Founders' fund", about: "Start with 150 extra gold." },
  { id: "seed_bank", icon: "🌾", title: "Seed bank", about: "Start with plenty of food in store." },
  { id: "lumber_stock", icon: "🪵", title: "Lumber stock", about: "Start with extra wood and stone." },
  { id: "old_maps", icon: "🗺️", title: "Old maps", about: "Start with twice as much of the land explored." },
  { id: "surveyor", icon: "🔭", title: "Surveyor's notes", about: "Special sites show through the fog." },
  { id: "planned_homes", icon: "🏡", title: "Planned homes", about: "Your first home starts at level 2." },
  { id: "wise_elders", icon: "🧓", title: "Wise elders", about: "Retirees are happier and live a little longer." },
  { id: "dreamers", icon: "✨", title: "Dreamers", about: "People in their dream jobs get even more done." },
  { id: "learned_settlers", icon: "🎓", title: "Learned settlers", about: "Newcomers arrive with more schooling." },
  { id: "generous", icon: "🎁", title: "Generous neighbours", about: "Townspeople's requests pay twice as much." },
  { id: "resilient", icon: "🔥", title: "Resilient", about: "Keep playin' after a fall gives twice as long to recover." },
];

export const MAX_PERKS = 2;

export function hasPerk(z: Game | null | undefined, id: PerkId): boolean {
  return !!z?.gameSettings.includes(`perk:${id}`);
}

/** Perks unlocked by the achievements this player has earned. */
export function unlockedPerks(udb: UserDatabase): Set<PerkId> {
  const earned = new Set(udb.achievements.map((a) => a[0]));
  const out = new Set<PerkId>();
  for (const a of achievements) if (a.unlocks && earned.has(a.id)) out.add(a.unlocks);
  return out;
}

/** The achievement that unlocks a perk. */
export function unlockedBy(id: PerkId) {
  return achievements.find((a) => a.unlocks === id);
}

/** One-off effects applied when a town is founded with its perks. */
export function applyStartingPerks(z: Game) {
  if (hasPerk(z, "founders_fund")) z.townInfo.gold += 150;
  if (hasPerk(z, "seed_bank")) z.resources.food += 60;
  if (hasPerk(z, "lumber_stock")) {
    z.resources.wood += 100;
    z.resources.stone += 40;
  }
}
