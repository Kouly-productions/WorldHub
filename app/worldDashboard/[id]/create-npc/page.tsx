"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function CreateNPCPage() {
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
    gender: "Ukendt",
    class: "Warrior",
    rarity: "Common",
    age: 20,
    strength: 50,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Du skal være logget ind");

      let portrait_url = "";

      // Håndter billede upload hvis der er valgt et
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${worldId}/${fileName}`;

        console.log("Forsøger at uploade til bucket: avatars, path:", filePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile);

        if (uploadError) {
          console.error("Upload fejl detaljer:", uploadError);
          throw new Error(`Kunne ikke uploade billede: ${uploadError.message}`);
        }

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
        strength: formData.strength,
        portrait_url: portrait_url || null,
      });

      if (error) throw error;

      // Succes! Send tilbage til dashboardet
      router.push(`/worldDashboard/${worldId}`);
      router.refresh();
    } catch (error: any) {
      alert("Fejl: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white font-sans p-6 flex justify-center">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/worldDashboard/${worldId}`}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold bg-linear-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Opret Ny NPC
          </h1>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#1a1a1a] border border-purple-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.1)] space-y-6"
        >
          {/* Avatar Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-purple-300">
              Avatar / Portræt
            </label>
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-purple-500/50"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                  <span className="text-2xl opacity-50">👤</span>
                </div>
              )}
              <div className="flex-1">
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
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 focus:border-purple-500 outline-none transition-colors text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/30 cursor-pointer"
                />
                <p className="text-xs text-white/50 mt-2">
                  Anbefalet størrelse: 500x500 pixels (JPG, PNG)
                </p>
              </div>
            </div>
          </div>

          {/* Navn & Klasse */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-300">
                Karakterens Navn
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-colors"
                placeholder="F.eks. Gandalf..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-300">
                Klasse
              </label>
              <input
                type="text"
                required
                value={formData.class}
                onChange={(e) =>
                  setFormData({ ...formData, class: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-colors"
                placeholder="F.eks. Warrior, Mage..."
              />
            </div>
          </div>

          {/* Rarity & Styrke */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-300">
                Rarity
              </label>
              <select
                value={formData.rarity}
                onChange={(e) =>
                  setFormData({ ...formData, rarity: e.target.value })
                }
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-colors text-white"
              >
                <option value="Common">Common (Grå)</option>
                <option value="Uncommon">Uncommon (Grøn)</option>
                <option value="Rare">Rare (Blå)</option>
                <option value="Epic">Epic (Lilla)</option>
                <option value="Legendary">Legendary (Orange)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-300">
                Styrke (1-100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.strength}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    strength: parseInt(e.target.value) || 50,
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Alder, Køn & Status */}
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-300">
                Alder
              </label>
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
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-300">Køn</label>
              <input
                type="text"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-colors"
                placeholder="F.eks. Mand, Kvinde..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-300">
                Status
              </label>
              <select
                value={formData.relationship_status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    relationship_status: e.target.value,
                  })
                }
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-colors text-white"
              >
                <option value="Single">Single</option>
                <option value="In relationship">In relationship</option>
                <option value="Engaged">Engaged</option>
                <option value="Married">Married</option>
              </select>
            </div>
          </div>

          {/* Level & Synlighed */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-300">
                Level
              </label>
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
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-300">
                Synlighed
              </label>
              <div className="flex items-center gap-3 h-[50px]">
                <input
                  type="checkbox"
                  checked={formData.is_visible}
                  onChange={(e) =>
                    setFormData({ ...formData, is_visible: e.target.checked })
                  }
                  className="w-5 h-5 accent-purple-500 cursor-pointer"
                />
                <span className="text-white/70 text-sm">
                  Synlig for andre spillere
                </span>
              </div>
            </div>
          </div>

          {/* Biografi */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-purple-300">
              Biografi / Baggrundshistorie
            </label>
            <textarea
              rows={6}
              value={formData.biography}
              onChange={(e) =>
                setFormData({ ...formData, biography: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-colors resize-none"
              placeholder="Skriv din karakters historie her..."
            />
          </div>

          {/* Voice URL (Valgfri) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-purple-300">
              Voice URL (Valgfri)
            </label>
            <input
              type="url"
              value={formData.voice_url}
              onChange={(e) =>
                setFormData({ ...formData, voice_url: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-colors"
              placeholder="https://..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 mt-8"
          >
            {loading ? (
              "Opretter..."
            ) : (
              <>
                <Save className="w-5 h-5" /> Gem NPC
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
