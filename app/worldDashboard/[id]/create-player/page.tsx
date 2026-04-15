"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const statColors: Record<string, string> = {
  Strength: "bg-red-700",
  Dexterity: "bg-green-700",
  Constitution: "bg-yellow-600",
  Intelligence: "bg-purple-700",
  Wisdom: "bg-blue-700",
  Charisma: "bg-pink-700",
};

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
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });

  function updateStat(key: string, delta: number) {
    setFormData((prev) => ({
      ...prev,
      [key]: Math.max(
        1,
        Math.min(30, (prev[key as keyof typeof prev] as number) + delta),
      ),
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
        strength: formData.strength,
        dexterity: formData.dexterity,
        constitution: formData.constitution,
        intelligence: formData.intelligence,
        wisdom: formData.wisdom,
        charisma: formData.charisma,
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
                  <option value="Warrior">Warrior</option>
                  <option value="Mage">Mage</option>
                  <option value="Rogue">Rogue</option>
                  <option value="Cleric">Cleric</option>
                  <option value="Ranger">Ranger</option>
                  <option value="Paladin">Paladin</option>
                  <option value="Bard">Bard</option>
                  <option value="Necromancer">Necromancer</option>
                  <option value="Druid">Druid</option>
                  <option value="Monk">Monk</option>
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
                <option value="Common">Common (Gray)</option>
                <option value="Uncommon">Uncommon (Green)</option>
                <option value="Rare">Rare (Blue)</option>
                <option value="Epic">Epic (Purple)</option>
                <option value="Legendary">Legendary (Orange)</option>
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
          <SectionDivider label="Attributes" />

          <div className="grid grid-cols-2 gap-3">
            {(
              [
                "strength",
                "dexterity",
                "constitution",
                "intelligence",
                "wisdom",
                "charisma",
              ] as const
            ).map((key) => {
              const label = key.charAt(0).toUpperCase() + key.slice(1);
              const value = formData[key];
              const barColor = statColors[label] || "bg-gray-600";

              return (
                <div
                  key={key}
                  className="flex items-center bg-[#15120e] border border-amber-900/20 rounded overflow-hidden"
                >
                  {/* Stat bar background */}
                  <div className="relative flex-1 flex items-center h-11">
                    <div
                      className={`absolute inset-y-0 left-0 ${barColor} opacity-30`}
                      style={{ width: `${(value / 30) * 100}%` }}
                    />
                    <span className="relative text-xs font-bold text-white/80 pl-3 uppercase tracking-wider">
                      {label}
                    </span>
                  </div>

                  <div className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => updateStat(key, -1)}
                      className="w-7 h-11 bg-amber-900/20 hover:bg-amber-700/30 text-amber-300/70 font-bold text-base transition-colors border-l border-amber-900/20"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={value}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v))
                          setFormData((prev) => ({
                            ...prev,
                            [key]: Math.max(1, Math.min(30, v)),
                          }));
                      }}
                      className="w-10 h-11 bg-transparent text-center text-sm font-black text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateStat(key, 1)}
                      className="w-7 h-11 bg-amber-900/20 hover:bg-amber-700/30 text-amber-300/70 font-bold text-base transition-colors border-l border-amber-900/20"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

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
