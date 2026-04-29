// All the defaults a brand new world starts with.
// If you want to change a default (a color, a class name, etc.), do it here
// and not in the individual pages.

export type WorldAttribute = {
  id: string;
  name: string;
  color: string;
  max: number;
};

export type WorldRarity = {
  name: string;
  color: string;
};

// The ids match the legacy column names so old characters (which only have
// data in strength/dexterity/etc.) still show up correctly.
export const DEFAULT_ATTRIBUTES: WorldAttribute[] = [
  { id: "strength", name: "Strength", color: "#ef4444", max: 30 },
  { id: "dexterity", name: "Dexterity", color: "#22c55e", max: 30 },
  { id: "constitution", name: "Constitution", color: "#eab308", max: 30 },
  { id: "intelligence", name: "Intelligence", color: "#a855f7", max: 30 },
  { id: "wisdom", name: "Wisdom", color: "#3b82f6", max: 30 },
  { id: "charisma", name: "Charisma", color: "#ec4899", max: 30 },
];

export const DEFAULT_RARITIES: WorldRarity[] = [
  { name: "Common", color: "#9ca3af" },
  { name: "Uncommon", color: "#22c55e" },
  { name: "Rare", color: "#3b82f6" },
  { name: "Epic", color: "#a855f7" },
  { name: "Legendary", color: "#f59e0b" },
];

export const DEFAULT_CLASSES: string[] = [
  "Warrior",
  "Mage",
  "Rogue",
  "Cleric",
  "Ranger",
  "Paladin",
  "Bard",
  "Necromancer",
  "Druid",
  "Monk",
];
