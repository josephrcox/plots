// Build bar categories. Each plot option lands in a category by its `type`,
// so new plot types appear automatically; a type not listed here goes to
// "Other" rather than disappearing from the build bar.

import { options } from "./PlotTypeOptions";
import type { PlotOption } from "../types";

export type Category = {
  id: string;
  label: string;
  emoji: string;
  types: string[];
};

export const CATEGORIES: Category[] = [
  { id: "housing", label: "Housing", emoji: "🏠", types: ["residential"] },
  {
    id: "production",
    label: "Production",
    emoji: "🌾",
    types: ["farm", "lumber", "quarry", "mine"],
  },
  {
    id: "industry",
    label: "Industry",
    emoji: "⚙️",
    types: ["industrial", "stockpile"],
  },
  {
    id: "commerce",
    label: "Commerce",
    emoji: "💰",
    types: ["business", "shop", "tourism", "bank"],
  },
  {
    id: "services",
    label: "Services",
    emoji: "🎪",
    types: ["recreation", "medical"],
  },
  {
    id: "knowledge",
    label: "Knowledge",
    emoji: "🎓",
    types: ["education", "science"],
  },
  { id: "civic", label: "Civic", emoji: "🏛️", types: ["federal"] },
];

const OTHER: Category = { id: "other", label: "Other", emoji: "📦", types: [] };

export function categoryOf(option: PlotOption): Category {
  return CATEGORIES.find((c) => c.types.includes(option.type)) ?? OTHER;
}

/** Categories that have at least one option, in display order. */
export function categoriesWithOptions(): Category[] {
  const used = new Set(options.map((o) => categoryOf(o).id));
  const list = CATEGORIES.filter((c) => used.has(c.id));
  if (used.has(OTHER.id)) list.push(OTHER);
  return list;
}

export function optionsIn(category: Category): PlotOption[] {
  return options.filter((o) => categoryOf(o).id === category.id);
}
