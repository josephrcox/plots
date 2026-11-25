// Places for retirees (#65 follow-up). Retired townspeople spend their days
// at a community garden, storyteller's corner, craft guild, social club or
// museum. In the data model they're "members" filling slots like workers,
// but the UI calls them members, and the benefits are modest and come from
// what elders bring: wisdom for the young, community, stories, green space.
// Venues are pricey and cost gold to run; their main job is happy elders.

import { options } from "./objects/PlotTypeOptions";
import type { Game, Plot } from "./types";

export const VENUE_TYPE = "retirement";

export function isVenueId(id: string | undefined): boolean {
  return !!id && options.find((o) => o.id === id)?.type === VENUE_TYPE;
}

export function isVenue(plot: Plot | undefined): boolean {
  return !!plot && plot.type > -1 && options[plot.type]?.type === VENUE_TYPE;
}

/** What each venue does, scaled by how full it is (0–1). */
export const VENUE = {
  /** Storyteller's Corner: extra weekly learning for children within reach. */
  storyteller: { reach: 3, childLearning: 0.03 },
  /** Craft Guild: adults within reach learn (up to skilled); workshops next door produce more. */
  craft_guild: { reach: 3, adultLearning: 0.01, maxEdu: 2, workshopReach: 2, workshopBoost: 0.1 },
  /** Social Club: town community each week, and mood for homes within reach. */
  social_club: { reach: 3, community: 0.5, mood: 4 },
  /** Museum: a new exhibit every few months relieves boredom; inns earn more. */
  museum: { exhibitWeeks: 13, boredomRelief: 6, innBoost: 1.2 },
};

/** Mood for retirees with somewhere to go, and without. */
export const RETIREE_MOOD = { member: 8, idle: -4 };
/** Active retirees live a little longer. */
export const MEMBER_DEATH_FACTOR = 0.9;

export const EXHIBITS = [
  "the old mill's first ledger",
  "a hundred years of harvest festivals",
  "the founders' letters",
  "maps of the town as it grew",
  "the great flood remembered",
  "toys from grandparents' childhoods",
  "portraits of the first families",
  "tools of the town's trades",
];
