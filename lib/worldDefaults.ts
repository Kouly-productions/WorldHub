// Stores all the default settings that a brand new world starts with.

// This defines what an "Attribute" (like Strength) should look like
export type WorldAttribute = {
  id: string;
  name: string;
  color: string;
  max: number;
};

// This defines what a "Rarity" (like Epic or Legendary) should look like
export type WorldRarity = {
  name: string;
  color: string;
};

// The default attributes every new world gets automatically
export const DEFAULT_ATTRIBUTES: WorldAttribute[] = [
  { id: "strength", name: "Strength", color: "#ef4444", max: 30 },
  { id: "dexterity", name: "Dexterity", color: "#22c55e", max: 30 },
  { id: "constitution", name: "Constitution", color: "#eab308", max: 30 },
  { id: "intelligence", name: "Intelligence", color: "#a855f7", max: 30 },
  { id: "wisdom", name: "Wisdom", color: "#3b82f6", max: 30 },
  { id: "charisma", name: "Charisma", color: "#ec4899", max: 30 },
];

// The default rarities for characters that every new world gets automatically
export const DEFAULT_RARITIES: WorldRarity[] = [
  { name: "Common", color: "#9ca3af" },
  { name: "Uncommon", color: "#22c55e" },
  { name: "Rare", color: "#3b82f6" },
  { name: "Epic", color: "#a855f7" },
  { name: "Legendary", color: "#f59e0b" },
];

// The default classes a character can choose from in a new world
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
