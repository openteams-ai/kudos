// Presentation metadata for the rewards store, kept in one place so the page,
// the store grid, and the history view all describe categories identically.
//
// Tile classes are written as complete literal strings (never interpolated) so
// Tailwind's JIT scanner emits them — each category gets a soft, on-brand wash
// behind its emoji drawn from the Nebari palette plus two celebratory accents.

export const CATEGORY_ORDER = [
  "Gift Cards",
  "Company Swag",
  "Experiences",
  "Time Off",
  "Charity",
] as const;

export type Category = (typeof CATEGORY_ORDER)[number];

type CategoryStyle = {
  /** Soft tinted background for the emoji tile. */
  tile: string;
  /** Optional warm note shown above the category's grid. */
  note?: string;
};

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "Gift Cards": { tile: "bg-teal/10" },
  "Company Swag": { tile: "bg-primary/10" },
  "Experiences": { tile: "bg-gold/20" },
  "Time Off": { tile: "bg-[#7C3AED]/10" },
  "Charity": {
    tile: "bg-[#F43F5E]/10",
    note: "Turn your points into good — we handle the donation in your name.",
  },
};

export function tileClass(category: string): string {
  return CATEGORY_STYLES[category]?.tile ?? "bg-primary/10";
}
