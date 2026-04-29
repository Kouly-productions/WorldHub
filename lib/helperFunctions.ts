// Small helpers for reading the World table.

import {
  DEFAULT_ATTRIBUTES,
  DEFAULT_CLASSES,
  DEFAULT_RARITIES,
  type WorldAttribute,
  type WorldRarity,
} from "@/lib/worldDefaults";

// Take the raw attributes JSON from the DB and turn it into a clean list.
// Returns the defaults if the column is empty or doesn't look right.
export function parseAttributes(raw: unknown): WorldAttribute[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_ATTRIBUTES;
  }
  const cleaned: WorldAttribute[] = raw
    .filter((a: any) => a && typeof a.name === "string" && a.name.trim())
    .map((a: any) => ({
      // The id is what links a character's attribute_values to the world's
      // attribute. If it's missing make one from the name as a fallback.
      id:
        typeof a.id === "string" && a.id.trim()
          ? a.id.trim()
          : a.name.trim().toLowerCase().replace(/\s+/g, "_"),
      name: a.name.trim(),
      color: typeof a.color === "string" ? a.color : "#9ca3af",
      max:
        typeof a.max === "number" && a.max > 0
          ? Math.min(999, Math.floor(a.max))
          : 30,
    }));
  return cleaned.length > 0 ? cleaned : DEFAULT_ATTRIBUTES;
}

// Same idea for rarities. Drops anything without a name and falls back to
// the defaults if nothing is left.
export function parseRarities(raw: unknown): WorldRarity[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_RARITIES;
  }
  const cleaned: WorldRarity[] = raw
    .filter((r: any) => r && typeof r.name === "string" && r.name.trim())
    .map((r: any) => ({
      name: r.name.trim(),
      color: typeof r.color === "string" ? r.color : "#9ca3af",
    }));
  return cleaned.length > 0 ? cleaned : DEFAULT_RARITIES;
}

// Classes are stored as "Warrior,Mage,Rogue" so we just split on comma.
export function parseClasses(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw.trim()) {
    return DEFAULT_CLASSES;
  }
  const list = raw
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  return list.length > 0 ? list : DEFAULT_CLASSES;
}
