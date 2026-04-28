"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, ThumbsDown, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import LoadingScreen from "@/components/LoadingScreen";

// Each character has its own page now. URL looks like:
// /worldDashboard/[id]/character/[characterId]
// We grab the character ID from the URL and fetch all info from Supabase.

export default function CharacterPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.id as string;
  const characterId = params.characterId as string;

  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Modal state for adding a new like or dislike.
  // The type tells us which field to update when the user submits.
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<"like" | "dislike">("like");
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    async function fetchData() {
      // Don't bother fetching if the URL is missing the ID for some reason.
      if (!characterId) return;

      // Get the character data
      const { data, error } = await supabase
        .from("Characters")
        .select("*")
        .eq("id", characterId)
        .single();

      if (error) {
        console.error("Couldn't load character:", error.message);
      } else {
        setCharacter(data);
      }

      // Figure out the user's role in this world so we know if they can add things
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: memberData } = await supabase
          .from("World_Members")
          .select("role")
          .eq("world_id", worldId)
          .eq("user_id", user.id)
          .single();

        if (memberData) {
          setUserRole(memberData.role);
        } else {
          // If the user isn't in World_Members, check if they are the owner of the world
          const { data: world } = await supabase
            .from("World")
            .select("owner_id")
            .eq("id", worldId)
            .single();

          if (world?.owner_id === user.id) {
            setUserRole("owner");
          }
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [characterId, worldId]);

  // Splits comma-separated text into a clean list so each item can be shown as a bullet point.
  // Empty strings get filtered out so "coffee,, rain" doesn't produce an empty item in the middle.
  function splitToList(text: string | null): string[] {
    if (!text) return [];
    return text
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  // Called when the user clicks the "Add like" or "Add dislike" button.
  // We remember which type it is, reset the input field and open the modal.
  function openAddModal(type: "like" | "dislike") {
    setAddType(type);
    setNewItem("");
    setAddModalOpen(true);
  }

  // Called when the user clicks "Add" inside the modal.
  // We append the new item to the existing text (comma separated) and save it to the database.
  async function handleAddItem() {
    const trimmed = newItem.trim();
    if (!trimmed) return;

    // Pick the right field depending on whether it's a like or dislike
    const fieldName = addType === "like" ? "likes" : "dislikes";
    const currentValue = character[fieldName] || "";

    // If the field already has content, append with comma + space.
    // If the field is empty, just use the new item by itself.
    const newValue = currentValue
      ? `${currentValue}, ${trimmed}`
      : trimmed;

    const { error } = await supabase
      .from("Characters")
      .update({ [fieldName]: newValue })
      .eq("id", characterId);

    if (error) {
      alert("Couldn't save: " + error.message);
      return;
    }

    // Update local state so the new item shows up immediately without refetching everything
    setCharacter({ ...character, [fieldName]: newValue });
    setAddModalOpen(false);
    setNewItem("");
  }

  // When the user clicks the X next to an item, we remove it from the list.
  // We rebuild the string by filtering out the chosen item.
  async function handleRemoveItem(type: "like" | "dislike", index: number) {
    const fieldName = type === "like" ? "likes" : "dislikes";
    const list = splitToList(character[fieldName]);
    list.splice(index, 1);
    const newValue = list.join(", ");

    const { error } = await supabase
      .from("Characters")
      .update({ [fieldName]: newValue })
      .eq("id", characterId);

    if (error) {
      alert("Couldn't remove: " + error.message);
      return;
    }

    setCharacter({ ...character, [fieldName]: newValue });
  }

  if (loading) {
    return <LoadingScreen message="Loading character..." />;
  }

  // If the character ID is wrong or the row was deleted, show a fallback.
  if (!character) {
    return (
      <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-6">
        <p className="text-lg mb-4">Character not found.</p>
        <Link
          href={`/worldDashboard/${worldId}`}
          className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  // canEdit decides if we show the buttons for adding and removing items.
  // Only owner and admin can change the character here.
  const canEdit = userRole === "owner" || userRole === "admin";

  const likes = splitToList(character.likes);
  const dislikes = splitToList(character.dislikes);

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white font-sans">
      {/* Top bar with a back button */}
      <header className="max-w-5xl mx-auto px-6 pt-6 pb-4">
        <Link
          href={`/worldDashboard/${worldId}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-16">
        {/* Header section: portrait + name */}
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-end mb-12 pb-8 border-b border-white/10">
          {/* Portrait */}
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden bg-[#1a1510] border-2 border-white/10 shrink-0">
            {character.portrait_url ? (
              <img
                src={character.portrait_url}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl opacity-20">
                👤
              </div>
            )}
          </div>

          {/* Name and basics */}
          <div className="text-center md:text-left flex-1">
            <p className="text-xs uppercase tracking-[0.25em] text-purple-400/80 mb-2">
              {character.is_npc ? "Non-Player Character" : "Player Character"}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent mb-3">
              {character.name}
            </h1>
            {character.biography && (
              <p className="text-white/60 italic max-w-2xl">
                {character.biography}
              </p>
            )}
          </div>
        </div>

        {/* Two columns: likes and dislikes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Likes */}
          <section className="bg-[#1a1510] border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-bold text-green-300">Likes</h2>
              </div>
              {canEdit && (
                <button
                  onClick={() => openAddModal("like")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 rounded-md text-xs font-bold text-green-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add like
                </button>
              )}
            </div>

            {likes.length > 0 ? (
              <ul className="space-y-2">
                {likes.map((item: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-2 text-white/80 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">+</span>
                      <span>{item}</span>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveItem("like", index)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400/70 hover:text-red-400 transition-all"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-white/30 italic">Nothing written yet.</p>
            )}
          </section>

          {/* Dislikes */}
          <section className="bg-[#1a1510] border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ThumbsDown className="w-5 h-5 text-red-400" />
                <h2 className="text-xl font-bold text-red-300">Dislikes</h2>
              </div>
              {canEdit && (
                <button
                  onClick={() => openAddModal("dislike")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 rounded-md text-xs font-bold text-red-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add dislike
                </button>
              )}
            </div>

            {dislikes.length > 0 ? (
              <ul className="space-y-2">
                {dislikes.map((item: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-2 text-white/80 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-red-400">-</span>
                      <span>{item}</span>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveItem("dislike", index)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400/70 hover:text-red-400 transition-all"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-white/30 italic">Nothing written yet.</p>
            )}
          </section>
        </div>
      </main>

      {/* Add like/dislike modal */}
      {addModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setAddModalOpen(false)}
        >
          <div
            className="bg-[#1a1510] border border-white/10 rounded-xl p-6 w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-2 text-white">
              {addType === "like"
                ? "What does the character like?"
                : "What does the character dislike?"}
            </h3>
            <p className="text-sm text-white/40 mb-4">
              Write one thing at a time.
            </p>

            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddItem();
                }
              }}
              placeholder={
                addType === "like"
                  ? "e.g. coffee, rainy days..."
                  : "e.g. loud noises, spiders..."
              }
              className="w-full bg-[#0d0b08] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-purple-500/50 transition-colors mb-4"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItem.trim()}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                  addType === "like"
                    ? "bg-green-600 hover:bg-green-500 disabled:bg-green-600/30"
                    : "bg-red-600 hover:bg-red-500 disabled:bg-red-600/30"
                } disabled:cursor-not-allowed text-white`}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
