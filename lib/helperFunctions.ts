// Small helper functions that clean up data coming from the database.
import {
  DEFAULT_ATTRIBUTES,
  DEFAULT_CLASSES,
  DEFAULT_RARITIES,
  type WorldAttribute,
  type WorldRarity,
} from "@/lib/worldDefaults";

// Takes the raw attribute data (like Strength or Speed) from the database and cleans it up.
// If the database has nothing saved, returns the default attributes.
export function parseAttributes(raw: unknown): WorldAttribute[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_ATTRIBUTES;
  }
  
  // Go through the list and make sure every attribute has the right pieces (name and color)
  const cleaned: WorldAttribute[] = raw
    .filter((a: any) => a && typeof a.name === "string" && a.name.trim())
    .map((a: any) => ({
      // The id is used to link characters to this stat. If it's missing, we make one out of the name.
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

// Does the exact same thing but for item rarities (like "Common" or "Epic").
export function parseRarities(raw: unknown): WorldRarity[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_RARITIES;
  }
  
  // Clean up the list of rarities
  const cleaned: WorldRarity[] = raw
    .filter((r: any) => r && typeof r.name === "string" && r.name.trim())
    .map((r: any) => ({
      name: r.name.trim(),
      color: typeof r.color === "string" ? r.color : "#9ca3af",
    }));
  return cleaned.length > 0 ? cleaned : DEFAULT_RARITIES;
}

// Classes are saved as a single text line like "Warrior,Mage,Rogue".
// This splits that text into a real list of separate words.
export function parseClasses(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw.trim()) {
    return DEFAULT_CLASSES;
  }
  
  // Split the text whenever there is a comma
  const list = raw
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  return list.length > 0 ? list : DEFAULT_CLASSES;
}
