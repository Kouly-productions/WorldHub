"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  DEFAULT_ATTRIBUTES,
  DEFAULT_CLASSES,
  DEFAULT_RARITIES,
  type WorldAttribute,
} from "@/lib/worldDefaults";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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

export default function CreatePlayerPage() {
  const router = useRouter();
  const params = useParams();
  const worldId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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

  // Character's attribute values, keyed by attribute id from world.attributes.
  const [attributeValues, setAttributeValues] = useState<
    Record<string, number>
  >({});

  // List of attributes the character can have. Loaded from world.attributes
  // (JSONB) when the page mounts. Defaults live in lib/worldDefaults.ts.
  const [attributes, setAttributes] =
    useState<WorldAttribute[]>(DEFAULT_ATTRIBUTES);

  // List of classes the user can pick from. Comes from the World table.
  // Defaults to the shared list in lib/worldDefaults.ts.
  const [availableClasses, setAvailableClasses] =
    useState<string[]>(DEFAULT_CLASSES);

  // List of rarities the user can pick from. Loaded from World.rarities (JSONB).
  const [availableRarities, setAvailableRarities] =
    useState<typeof DEFAULT_RARITIES>(DEFAULT_RARITIES);

  // Load the world's settings (max stats and class list) when the page opens.
  useEffect(() => {
    async function loadWorldSettings() {
      if (!worldId) return;

      const { data: world } = await supabase
        .from("World")
        .select("classes, rarities, attributes")
        .eq("id", worldId)
        .single();

      if (world) {
        // Build attributes list, either from world.attributes or fall back
        // to the default 6 D&D style stats.
        let attrList: WorldAttribute[] = DEFAULT_ATTRIBUTES;
        if (Array.isArray(world.attributes) && world.attributes.length > 0) {
          const cleaned: WorldAttribute[] = world.attributes
            .filter(
              (a: any) => a && typeof a.name === "string" && a.name.trim(),
            )
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

        const seeded: Record<string, number> = {};
        attrList.forEach((a) => {
          seeded[a.id] = Math.min(10, a.max);
        });
        setAttributeValues(seeded);

        if (world.classes) {
          const list = world.classes
            .split(",")
            .map((c: string) => c.trim())
            .filter((c: string) => c.length > 0);

          if (list.length > 0) {
            setAvailableClasses(list);
            // If the default selected class doesn't exist in the world's list,
            // pick the first one so the form shows a valid class.
            setFormData((prev) =>
              list.includes(prev.class) ? prev : { ...prev, class: list[0] },
            );
          }
        }

        // Load rarities from the world. Same idea as classes - if the current
        // selection isn't in the list, snap to the first one.
        if (Array.isArray(world.rarities) && world.rarities.length > 0) {
          const cleaned = world.rarities
            .filter(
              (r: any) => r && typeof r.name === "string" && r.name.trim(),
            )
            .map((r: any) => ({
              name: r.name.trim(),
              color: typeof r.color === "string" ? r.color : "#9ca3af",
            }));

          if (cleaned.length > 0) {
            setAvailableRarities(cleaned);
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
  }, [worldId]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("You need to be logged in");

      let portrait_url = "";

      if (avatarFile) {
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

        portrait_url = publicUrl;
      }

      const legacyKeys = [
        "strength",
        "dexterity",
        "constitution",
        "intelligence",
        "wisdom",
        "charisma",
      ];
      const legacyColumns: Record<string, number> = {};
      legacyKeys.forEach((key) => {
        if (attributeValues[key] != null) {
          legacyColumns[key] = attributeValues[key];
        }
      });

      const { error } = await supabase.from("Characters").insert({
        world_id: worldId,
        user_id: user.id,
        name: formData.name,
        biography: formData.biography,
        level: formData.level,
        is_visible: formData.is_visible,
        voice_url: formData.voice_url,
        relationship_status: formData.relationship_status,
        gender: formData.gender,
        class: formData.class,
        rarity: formData.rarity,
        age: formData.age,
        health: formData.health,
        full_health: formData.full_health,
        attribute_values: attributeValues,
        ...legacyColumns,
        portrait_url: portrait_url || null,
        is_npc: false,
      });

      if (error) throw error;

      router.push(`/worldDashboard/${worldId}`);
      router.refresh();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-[#15120e] border border-amber-900/30 rounded px-3 py-2.5 text-white outline-none focus:border-amber-500/60 transition-colors text-sm";
  const selectClass =
    "w-full bg-[#15120e] border border-amber-900/30 rounded px-3 py-2.5 text-white outline-none focus:border-amber-500/60 transition-colors text-sm";
  const labelClass =
    "text-xs font-bold text-amber-300/70 uppercase tracking-wider";

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
            Create Player Character
          </h1>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-amber-700/40 to-transparent" />
            <div className="w-2 h-2 rotate-45 border border-amber-700/50" />
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-amber-700/40 to-transparent" />
          </div>

          {/* ── BASIC INFO ── */}
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
                  {/* Classes come from the world settings, set by owner/admin */}
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

          {/* ── ATTRIBUTES ── */}
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

          {/* ── BIOGRAPHY & EXTRAS ── */}
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
              {loading ? "Creating..." : "Create Player"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
