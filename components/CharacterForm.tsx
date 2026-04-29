"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, X, Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  DEFAULT_ATTRIBUTES,
  DEFAULT_CLASSES,
  DEFAULT_RARITIES,
  type WorldAttribute,
  type WorldRarity,
} from "@/lib/worldDefaults";
import LoadingScreen from "@/components/LoadingScreen";

// One shared form for all three character flows

export type CharacterFormMode = "create-npc" | "create-player" | "edit";

interface Props {
  worldId: string;
  mode: CharacterFormMode;
  // Only required when mode === "edit"
  characterId?: string;
}

const LEGACY_ATTRIBUTE_KEYS = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-linear-to-r from-transparent via-amber-700/40 to-transparent" />
      <span className="text-sm font-bold text-amber-200/70 uppercase tracking-widest">
        {label}
      </span>
      <div className="flex-1 h-px bg-linear-to-r from-transparent via-amber-700/40 to-transparent" />
    </div>
  );
}

export default function CharacterForm({ worldId, mode, characterId }: Props) {
  const router = useRouter();

  // Mode derived flags. Keeping them as small variables rather than scattering
  // mode checks throughout the JSX keeps the markup readable.
  const showAI = mode === "create-npc";
  const runsModeration = mode === "create-npc";
  const isEdit = mode === "edit";
  const isNpc = mode !== "create-player"; // edit/npc both store as NPC by default
  const title =
    mode === "create-npc"
      ? "Create New NPC"
      : mode === "create-player"
        ? "Create Player Character"
        : "Edit Character";
  const submitLabel =
    mode === "edit"
      ? "Save Changes"
      : mode === "create-npc"
        ? "Create NPC"
        : "Create Player";
  const submitLoadingLabel = mode === "edit" ? "Saving..." : "Creating...";

  // Loading flags
  // loading is for the submit button fetching is the initial fetch in edit mode.
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Avatar / portrait upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Form fields
  // Note: stat values live in attributeValues below since they're dynamic.
  const [formData, setFormData] = useState({
    name: "",
    biography: "",
    level: 1,
    is_visible: true,
    voice_url: "",
    relationship_status: "Single",
    gender: "Unknown",
    class: "Warrior",
    rarity: "Common",
    age: 20,
    health: 100,
    full_health: 100,
  });

  // Character's stat values, keyed by attribute id from world.attributes.
  const [attributeValues, setAttributeValues] = useState<
    Record<string, number>
  >({});

  // World driven option lists
  const [attributes, setAttributes] =
    useState<WorldAttribute[]>(DEFAULT_ATTRIBUTES);
  const [availableClasses, setAvailableClasses] =
    useState<string[]>(DEFAULT_CLASSES);
  const [availableRarities, setAvailableRarities] =
    useState<WorldRarity[]>(DEFAULT_RARITIES);

  // AI generation state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Load the world's settings once when the component mounts. This populates
  // the dropdowns (classes, rarities) and the dynamic attribute list.
  useEffect(() => {
    async function loadWorldSettings() {
      if (!worldId) return;

      const { data: world } = await supabase
        .from("World")
        .select("classes, rarities, attributes")
        .eq("id", worldId)
        .single();

      if (!world) return;

      // Attributes
      let attrList: WorldAttribute[] = DEFAULT_ATTRIBUTES;
      if (Array.isArray(world.attributes) && world.attributes.length > 0) {
        const cleaned: WorldAttribute[] = world.attributes
          .filter((a: any) => a && typeof a.name === "string" && a.name.trim())
          .map((a: any) => ({
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
        if (cleaned.length > 0) attrList = cleaned;
      }
      setAttributes(attrList);

      // Seed default values only when creating, in edit mode the actual
      // character values come from fetchCharacter() below.
      if (!isEdit) {
        const seeded: Record<string, number> = {};
        attrList.forEach((a) => {
          seeded[a.id] = Math.min(10, a.max);
        });
        setAttributeValues(seeded);
      }

      // Classes
      if (world.classes) {
        const list = world.classes
          .split(",")
          .map((c: string) => c.trim())
          .filter((c: string) => c.length > 0);

        if (list.length > 0) {
          setAvailableClasses(list);
          // For create modes, snap to a valid value if the default doesn't fit.
          // For edit, we keep the saved class even if it's no longer in the list.
          if (!isEdit) {
            setFormData((prev) =>
              list.includes(prev.class) ? prev : { ...prev, class: list[0] },
            );
          }
        }
      }

      // Rarities
      if (Array.isArray(world.rarities) && world.rarities.length > 0) {
        const cleaned: WorldRarity[] = world.rarities
          .filter((r: any) => r && typeof r.name === "string" && r.name.trim())
          .map((r: any) => ({
            name: r.name.trim(),
            color: typeof r.color === "string" ? r.color : "#9ca3af",
          }));

        if (cleaned.length > 0) {
          setAvailableRarities(cleaned);
          if (!isEdit) {
            setFormData((prev) =>
              cleaned.some((r) => r.name === prev.rarity)
                ? prev
                : { ...prev, rarity: cleaned[0].name },
            );
          }
        }
      }
    }

    loadWorldSettings();
  }, [worldId, isEdit]);

  // In edit mode: fetch the existing character and populate the form.
  // Rerun this when attributes changes too, so newly added world
  // attributes get seeded with defaults for existing characters
  useEffect(() => {
    if (!isEdit || !characterId) return;

    async function fetchCharacter() {
      try {
        const { data, error } = await supabase
          .from("Characters")
          .select("*")
          .eq("id", characterId!)
          .single();

        if (error) throw error;
        if (!data) return;

        setFormData({
          name: data.name || "",
          biography: data.biography || "",
          level: data.level || 1,
          is_visible: data.is_visible ?? true,
          voice_url: data.voice_url || "",
          relationship_status: data.relationship_status || "Single",
          gender: data.gender || "Unknown",
          class: data.class || "Warrior",
          rarity: data.rarity || "Common",
          age: data.age || 20,
          health: data.health || 100,
          full_health: data.full_health || 100,
        });

        // Load attribute values, preferring JSONB and falling back to the
        // legacy strength/dex/etc. columns for old characters.
        const stored =
          data.attribute_values && typeof data.attribute_values === "object"
            ? (data.attribute_values as Record<string, number>)
            : {};
        const legacyMap: Record<string, number> = {
          strength: data.strength,
          dexterity: data.dexterity,
          constitution: data.constitution,
          intelligence: data.intelligence,
          wisdom: data.wisdom,
          charisma: data.charisma,
        };
        setAttributeValues(() => {
          const next: Record<string, number> = { ...stored };
          attributes.forEach((a) => {
            if (next[a.id] == null) {
              next[a.id] = legacyMap[a.id] ?? 10;
            }
          });
          return next;
        });

        if (data.portrait_url) {
          setAvatarPreview(data.portrait_url);
        }
      } catch (err: any) {
        console.error("Error fetching character:", err.message);
        alert("Could not load character data.");
      } finally {
        setFetching(false);
      }
    }

    fetchCharacter();
  }, [isEdit, characterId, attributes]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function updateAttributeValue(attr: WorldAttribute, delta: number) {
    setAttributeValues((prev) => {
      const current = prev[attr.id] ?? 1;
      return {
        ...prev,
        [attr.id]: Math.max(1, Math.min(attr.max, current + delta)),
      };
    });
  }

  function setAttributeValue(attr: WorldAttribute, value: number) {
    setAttributeValues((prev) => ({
      ...prev,
      [attr.id]: Math.max(1, Math.min(attr.max, value)),
    }));
  }

  // Pulls out the legacy column values from attributeValues so we can write
  // them back to the legacy strength/dex/etc. columns for back-compat.
  function buildLegacyColumns(): Record<string, number> {
    const out: Record<string, number> = {};
    LEGACY_ATTRIBUTE_KEYS.forEach((key) => {
      if (attributeValues[key] != null) {
        out[key] = attributeValues[key];
      }
    });
    return out;
  }

  async function uploadPortraitIfNeeded(): Promise<string | null> {
    if (!avatarFile) {
      // In edit mode we keep whatever was already there (avatarPreview holds the existing URL).
      return isEdit ? avatarPreview : "";
    }
    const fileExt = avatarFile.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${worldId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile);

    if (uploadError)
      throw new Error(`Couldn't upload image: ${uploadError.message}`);

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return publicUrl;
  }

  // ── AI generation (create-npc only) ───────────────────────────────────────
  async function handleGenerateWithAI() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);

    try {
      const res = await fetch("/api/generate-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          attributes: attributes.map((a) => ({
            id: a.id,
            name: a.name,
            max: a.max,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI generation failed");

      setFormData((prev) => ({
        ...prev,
        name: data.name || prev.name,
        biography: data.biography || prev.biography,
        class: data.class || prev.class,
        gender: data.gender || prev.gender,
        age: data.age || prev.age,
        level: data.level || prev.level,
        health: data.health || prev.health,
        full_health: data.full_health || prev.full_health,
        rarity: data.rarity || prev.rarity,
        relationship_status:
          data.relationship_status || prev.relationship_status,
      }));

      if (data.attribute_values && typeof data.attribute_values === "object") {
        setAttributeValues((prev) => {
          const next: Record<string, number> = { ...prev };
          attributes.forEach((a) => {
            const v = data.attribute_values[a.id];
            if (typeof v === "number" && !isNaN(v)) {
              next[a.id] = Math.max(1, Math.min(a.max, Math.floor(v)));
            }
          });
          return next;
        });
      }

      setAiModalOpen(false);
      setAiPrompt("");
    } catch (err: any) {
      alert("AI Error: " + err.message);
    } finally {
      setAiLoading(false);
    }
  }

  // create or update depending on mode
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // NPCs are moderated for inappropriate content before saving.
      if (runsModeration) {
        const modRes = await fetch("/api/moderate-character", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            biography: formData.biography,
          }),
        });
        const modData = await modRes.json();
        if (modData.flagged) {
          alert("Character rejected: " + modData.reason);
          setLoading(false);
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You need to be logged in");

      const portrait_url = await uploadPortraitIfNeeded();

      const payload = {
        ...formData,
        attribute_values: attributeValues,
        ...buildLegacyColumns(),
        portrait_url: portrait_url || null,
      };

      if (isEdit) {
        const { data: updateData, error } = await supabase
          .from("Characters")
          .update(payload)
          .eq("id", characterId!)
          .select();

        if (error) throw error;
        if (!updateData || updateData.length === 0) {
          throw new Error(
            "No rows were updated. You might not have permission to edit this character.",
          );
        }
      } else {
        const { error } = await supabase.from("Characters").insert({
          ...payload,
          world_id: worldId,
          user_id: user.id,
          is_npc: isNpc,
        });
        if (error) throw error;
      }

      router.push(`/worldDashboard/${worldId}`);
      router.refresh();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Shared Tailwind classes
  const inputClass =
    "w-full bg-[#15120e] border border-amber-900/30 rounded px-3 py-2.5 text-white outline-none focus:border-amber-500/60 transition-colors text-sm";
  const selectClass = inputClass;
  const labelClass =
    "text-xs font-bold text-amber-300/70 uppercase tracking-wider";

  if (fetching) {
    return <LoadingScreen message="Loading character..." />;
  }

  return (
    <div className="min-h-screen w-full bg-[#0d0b08] text-white font-sans p-6 flex justify-center">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/worldDashboard/${worldId}`}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/50" />
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1a1510] border-2 border-amber-900/30 rounded-sm p-8 shadow-[0_0_60px_rgba(120,60,10,0.15)] relative"
        >
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-amber-700/50" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-amber-700/50" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-amber-700/50" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-amber-700/50" />

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-white mb-2 tracking-wide">
            {title}
          </h1>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-amber-700/40 to-transparent" />
            <div className="w-2 h-2 rotate-45 border border-amber-700/50" />
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-amber-700/40 to-transparent" />
          </div>

          {/* AI generator button (NPCs only) */}
          {showAI && (
            <div className="flex justify-center mb-2">
              <button
                type="button"
                onClick={() => setAiModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-violet-900/60 via-purple-700/60 to-violet-900/60 hover:from-violet-800/80 hover:via-purple-600/80 hover:to-violet-800/80 border border-purple-500/30 rounded-sm text-sm font-bold text-purple-200 uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]"
              >
                <Sparkles className="w-4 h-4" /> Create with AI
              </button>
            </div>
          )}

          {/* BASIC INFO */}
          <SectionDivider label="Basic Info" />

          {/* Avatar + Name/Class row */}
          <div className="flex gap-6 items-start mb-6">
            <div className="relative group cursor-pointer shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-amber-700/50"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#15120e] border-2 border-dashed border-amber-900/40 flex items-center justify-center group-hover:border-amber-500/50 transition-colors">
                  <span className="text-3xl opacity-30">👤</span>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg, image/png, image/jpg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelClass}>Character Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Enter character name..."
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Class</label>
                <select
                  value={formData.class}
                  onChange={(e) =>
                    setFormData({ ...formData, class: e.target.value })
                  }
                  className={selectClass}
                >
                  {/* In edit mode, keep the character's saved class as an
                      option even if it's no longer in the world's list. */}
                  {isEdit &&
                    formData.class &&
                    !availableClasses.includes(formData.class) && (
                      <option value={formData.class}>{formData.class}</option>
                    )}
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Rarity & Gender */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <label className={labelClass}>Rarity</label>
              <select
                value={formData.rarity}
                onChange={(e) =>
                  setFormData({ ...formData, rarity: e.target.value })
                }
                className={selectClass}
              >
                {/* In edit mode, keep the character's saved rarity even if it
                    was removed from the world. Marked as "(legacy)" so it's
                    clear it's not part of the current list. */}
                {isEdit &&
                  formData.rarity &&
                  !availableRarities.some(
                    (r) => r.name === formData.rarity,
                  ) && (
                    <option value={formData.rarity}>
                      {formData.rarity} (legacy)
                    </option>
                  )}
                {availableRarities.map((rarity) => (
                  <option key={rarity.name} value={rarity.name}>
                    {rarity.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Gender</label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className={selectClass}
              >
                <option value="Unknown">Unknown</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Age & Level */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <label className={labelClass}>Age</label>
              <input
                type="number"
                min="0"
                value={formData.age}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    age: parseInt(e.target.value) || 0,
                  })
                }
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Level</label>
              <input
                type="number"
                min="1"
                value={formData.level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    level: parseInt(e.target.value) || 1,
                  })
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* Health */}
          <div className="mb-4 space-y-1">
            <label className={labelClass}>Health (HP)</label>
            <div className="flex items-center gap-3">
              <span className="text-red-500 text-lg">&#10084;</span>
              <input
                type="number"
                min="1"
                value={formData.health}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    health: parseInt(e.target.value) || 1,
                  })
                }
                className={inputClass}
                placeholder="Current HP"
              />
              <span className="text-amber-400/60 text-sm font-bold">/</span>
              <input
                type="number"
                min="1"
                value={formData.full_health}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    full_health: parseInt(e.target.value) || 1,
                  })
                }
                className={inputClass}
                placeholder="Max HP"
              />
              <span className="text-amber-400/60 text-xs font-bold tracking-wider">
                HP
              </span>
            </div>
          </div>

          {/* Visibility */}
          <label className="flex items-center gap-3 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={formData.is_visible}
              onChange={(e) =>
                setFormData({ ...formData, is_visible: e.target.checked })
              }
              className="w-4 h-4 accent-purple-500 cursor-pointer"
            />
            <span className="text-sm text-white/60">
              Visible to other players
            </span>
          </label>

          {/* ATTRIBUTES */}
          {attributes.length > 0 && (
            <>
              <SectionDivider label="Attributes" />

              <div className="grid grid-cols-2 gap-3">
                {attributes.map((attr) => {
                  const value = attributeValues[attr.id] ?? 1;
                  return (
                    <div
                      key={attr.id}
                      className="flex items-center bg-[#15120e] border border-amber-900/20 rounded overflow-hidden"
                    >
                      <div className="relative flex-1 flex items-center h-11">
                        <div
                          className="absolute inset-y-0 left-0 opacity-30"
                          style={{
                            width: `${(value / attr.max) * 100}%`,
                            backgroundColor: attr.color,
                          }}
                        />
                        <span
                          className="relative text-xs font-bold pl-3 uppercase tracking-wider"
                          style={{ color: attr.color }}
                        >
                          {attr.name}
                        </span>
                      </div>

                      <div className="flex items-center shrink-0">
                        <button
                          type="button"
                          onClick={() => updateAttributeValue(attr, -1)}
                          className="w-7 h-11 bg-amber-900/20 hover:bg-amber-700/30 text-amber-300/70 font-bold text-base transition-colors border-l border-amber-900/20"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={attr.max}
                          value={value}
                          onChange={(e) => {
                            const v = parseInt(e.target.value);
                            if (!isNaN(v)) setAttributeValue(attr, v);
                          }}
                          className="w-12 h-11 bg-transparent text-center text-sm font-black text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateAttributeValue(attr, 1)}
                          className="w-7 h-11 bg-amber-900/20 hover:bg-amber-700/30 text-amber-300/70 font-bold text-base transition-colors border-l border-amber-900/20"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* BIOGRAPHY & EXTRAS */}
          <SectionDivider label="Biography & Extras" />

          <div className="space-y-4">
            <div className="space-y-1">
              <label className={labelClass}>Biography / Backstory</label>
              <textarea
                rows={5}
                value={formData.biography}
                onChange={(e) =>
                  setFormData({ ...formData, biography: e.target.value })
                }
                className={`${inputClass} resize-none`}
                placeholder="Write your character's story here..."
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Voice URL (Optional)</label>
              <input
                type="text"
                value={formData.voice_url}
                onChange={(e) =>
                  setFormData({ ...formData, voice_url: e.target.value })
                }
                className={inputClass}
                placeholder="Enter URL..."
              />
            </div>
          </div>

          {/* Submit */}
          <div className="mt-8 relative">
            <div className="absolute -top-px left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-700/40 to-transparent" />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 bg-linear-to-r from-purple-900/80 via-purple-700/80 to-purple-900/80 hover:from-purple-800/90 hover:via-purple-600/90 hover:to-purple-800/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-sm transition-all border border-purple-500/30 uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(168,85,247,0.15)]"
            >
              {loading ? submitLoadingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>

      {/* AI Generation Modal (NPCs only) */}
      {showAI && aiModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1510] border-2 border-purple-500/30 rounded-sm p-6 w-full max-w-lg relative shadow-[0_0_60px_rgba(168,85,247,0.15)]">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500/40" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-purple-500/40" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-500/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500/40" />

            <button
              onClick={() => {
                setAiModalOpen(false);
                setAiPrompt("");
              }}
              className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                Generate NPC with AI
              </h2>
            </div>

            <p className="text-sm text-white/40 mb-4">
              Describe the character you want. The AI will fill in all the
              fields for you.
            </p>

            <textarea
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. A mysterious elven mage who guards an ancient library, very powerful but secretive..."
              className="w-full bg-[#15120e] border border-purple-900/30 rounded px-4 py-3 text-white outline-none focus:border-purple-500/60 transition-colors text-sm resize-none placeholder:text-white/20 mb-4"
              disabled={aiLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerateWithAI();
                }
              }}
            />

            <button
              onClick={handleGenerateWithAI}
              disabled={aiLoading || !aiPrompt.trim()}
              className="w-full py-3 bg-linear-to-r from-purple-900/80 via-purple-700/80 to-purple-900/80 hover:from-purple-800/90 hover:via-purple-600/90 hover:to-purple-800/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-sm transition-all border border-purple-500/30 uppercase tracking-widest text-sm flex items-center justify-center gap-2"
            >
              {aiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Generate
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
