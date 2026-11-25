// Turns effect sizes into 1–3 "signal bars" for the UI, so players see how
// strong something is without raw numbers. Thresholds per kind of effect.

/** 0 = negligible, 1–3 = how strong |amount| is against the thresholds. */
export function strength(amount: number, [one, two, three]: [number, number, number]): number {
  const a = Math.abs(amount);
  if (a >= three) return 3;
  if (a >= two) return 2;
  if (a >= one) return 1;
  return 0;
}

/** Thresholds for each kind of effect. */
export const STEPS = {
  mood: [1, 5, 9] as [number, number, number], // personal mood points
  pollution: [5, 20, 45] as [number, number, number], // pollution level
  land: [1, 6, 10] as [number, number, number], // land value points from one source
  boost: [0.05, 0.2, 0.4] as [number, number, number], // multiplier above/below 1
  weekly: [0.3, 1.5, 3] as [number, number, number], // stat change per week
};

export const tone = (amount: number) => (amount >= 0 ? "good" : "bad");
