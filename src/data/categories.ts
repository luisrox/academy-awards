import type { CategoryGroup } from "@/lib/types";

export type CategoryGroupDefinition = {
  id: CategoryGroup;
  label: string;
};

export const CATEGORY_GROUPS: CategoryGroupDefinition[] = [
  { id: "headline", label: "The Big Two" },
  { id: "acting", label: "Acting" },
  { id: "writing", label: "Writing" },
  { id: "feature", label: "Features" },
  { id: "craft", label: "Crafts" },
  { id: "music", label: "Music" },
  { id: "shorts", label: "Short Films" },
  { id: "retired", label: "Retired Categories" },
  { id: "special", label: "Special Awards" },
];

const GROUP_ORDER = new Map(
  CATEGORY_GROUPS.map((group, index) => [group.id, index]),
);

export function groupOrder(id: CategoryGroup): number {
  const order = GROUP_ORDER.get(id);
  if (order === undefined) {
    throw new Error(`Unknown category group: ${id}`);
  }
  return order;
}
