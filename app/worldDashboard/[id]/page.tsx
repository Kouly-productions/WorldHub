"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Search, X } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

export default function WorldDashboard() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.id as string;
  const [worldData, setWorldData] = useState<any>(null);
  const [npcs, setNpcs] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSearchUsers(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      const { data, error } = await supabase
        .from("Profiles")
        .select("id, username, email")
        .ilike("username", `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      // Filter out users who are already in this world
      const existingIds = members.map((m) => m.user_id);
      if (worldData?.owner_id && !existingIds.includes(worldData.owner_id)) {
        existingIds.push(worldData.owner_id);
      }

      const filtered = (data || []).filter((p) => !existingIds.includes(p.id));
      setSearchResults(filtered);
    } catch (err: any) {
      console.error("Search error:", err.message);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleInviteUser(
    userId: string,
    username: string,
    email: string,
  ) {
    try {
      const { data, error } = await supabase
        .from("World_Members")
        .insert({
          world_id: worldId,
          user_id: userId,
          role: "member",
        })
        .select()
        .single();

      if (error) throw error;

      // Add them to the list right away so the UI updates
      setMembers((prev) => [
        ...prev,
        { ...data, Profiles: { username, email } },
      ]);

      // Remove from search results since they're added now
      setSearchResults((prev) => prev.filter((p) => p.id !== userId));
      alert(`${username} has been added to the world!`);
    } catch (err: any) {
      alert("Couldn't add user: " + err.message);
    }
  }

  async function handleDeleteCharacter(characterId: string, isNpc: boolean) {
    if (!confirm("Are you sure you want to delete this character?")) return;

    try {
      const { error } = await supabase
        .from("Characters")
        .delete()
        .eq("id", characterId);

      if (error) throw error;

      // Remove from local state so I don't need a full refetch
      if (isNpc) {
        setNpcs((prev) => prev.filter((c) => c.id !== characterId));
      } else {
        setPlayers((prev) => prev.filter((c) => c.id !== characterId));
      }
    } catch (err: any) {
      alert("Couldn't delete character: " + err.message);
    }
  }

  useEffect(() => {
    async function fetchData() {
      if (!worldId) return;

      // Grab the world data
      const { data: world, error: worldError } = await supabase
        .from("World")
        .select("*")
        .eq("id", worldId)
        .single();

      if (worldError) {
        console.error("Error fetching world:", worldError);
      } else {
        setWorldData(world);
      }

      // Check who's logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Figure out the user's role in this world
        const { data: memberData } = await supabase
          .from("World_Members")
          .select("role")
          .eq("world_id", worldId)
          .eq("user_id", user.id)
          .single();

        if (memberData) {
          setUserRole(memberData.role);
        } else if (world?.owner_id === user.id) {
          // Fallback, owner might not be in the members table yet
          setUserRole("owner");
        }
      }

      // Grab members so we can filter them out when inviting
      const { data: membersData } = await supabase
        .from("World_Members")
        .select("*, Profiles:user_id (username, email)")
        .eq("world_id", worldId);

      if (membersData) {
        setMembers(membersData);
      }

      // Get all characters for this world
      const { data: chars, error: charsError } = await supabase
        .from("Characters")
        .select(
          `
          *,
          Profiles (
            username
          )
        `,
        )
        .eq("world_id", worldId)
        .order("created_at", { ascending: false });

      if (charsError) {
        console.error("Error fetching characters:", charsError);
      } else {
        const allChars = chars || [];
        setNpcs(allChars.filter((c) => c.is_npc !== false));
        setPlayers(allChars.filter((c) => c.is_npc === false));
      }

      setLoading(false);
    }

    fetchData();
  }, [worldId]);

  const rarityConfig: Record<
    string,
    {
      border: string;
      accent: string;
      badgeBg: string;
      text: string;
      glow: string;
    }
  > = {
    Common: {
      border: "border-[#3a3a3a]",
      accent: "text-gray-400",
      badgeBg: "bg-gray-600",
      text: "text-gray-100",
      glow: "",
    },
    Uncommon: {
      border: "border-green-700/60",
      accent: "text-green-400",
      badgeBg: "bg-green-600",
      text: "text-green-50",
      glow: "",
    },
    Rare: {
      border: "border-blue-600/60",
      accent: "text-blue-400",
      badgeBg: "bg-blue-600",
      text: "text-blue-50",
      glow: "",
    },
    Epic: {
      border: "border-purple-500/60",
      accent: "text-purple-400",
      badgeBg: "bg-purple-600",
      text: "text-purple-50",
      glow: "",
    },
    Legendary: {
      border: "border-amber-500",
      accent: "text-amber-400",
      badgeBg: "bg-amber-600",
      text: "text-amber-50",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.25)]",
    },
  };

  function renderCard(char: any, isNpc: boolean) {
    const rarity = char.rarity || "Common";
    const rc = rarityConfig[rarity] || rarityConfig.Common;
    return (
      <div
        key={char.id}
        className={`relative flex flex-col rounded-sm ${rc.border} border-2 bg-[#1a1510] overflow-hidden group transition-all duration-300 hover:-translate-y-1 ${rc.glow}`}
      >
        {/* Legendary shimmer */}
        {rarity === "Legendary" && (
          <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-amber-300/10 to-transparent group-hover:animate-[shimmer_2s_infinite] z-50 pointer-events-none" />
        )}

        {/* Top banner: class + level */}
        <div className="relative bg-[#111] border-b-2 ${rc.border} py-3 text-center">
          <p
            className={`text-xs font-bold uppercase tracking-[0.25em] ${rc.accent}`}
          >
            {char.class || "Warrior"}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">
            Lvl. {char.level || 1}
          </p>
          {/* Decorative corner accents */}
          <div
            className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${rc.border}`}
          />
          <div
            className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${rc.border}`}
          />
          <div
            className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${rc.border}`}
          />
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${rc.border}`}
          />
        </div>

        {/* Portrait */}
        <div className="relative h-52 w-full bg-[#0d0b08] overflow-hidden">
          {char.portrait_url ? (
            <img
              src={char.portrait_url}
              alt={char.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-b from-[#1a1510] to-[#0d0b08]">
              <span className="text-7xl opacity-15">👤</span>
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-[#1a1510] via-transparent to-transparent" />

          {/* Rarity badge floating on portrait */}
          <div
            className={`absolute top-2 right-2 px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest ${rc.badgeBg} ${rc.text}`}
          >
            {rarity}
          </div>
        </div>

        {/* Name + bio */}
        <div className="px-5 pt-4 pb-2 text-center">
          <h3 className="text-lg font-bold text-white tracking-wide leading-tight">
            {char.name}
          </h3>
          <p className="text-xs text-white/40 italic mt-1 line-clamp-2">
            {char.biography || "No backstory written yet."}
          </p>

          {/* HP bar */}
          {char.full_health != null && char.full_health > 0 && (
            <div className="mt-3">
              <div className="w-full h-2.5 bg-[#111] rounded-full overflow-hidden border border-amber-900/30">
                <div
                  className={`h-full rounded-full bg-linear-to-r ${
                    (char.health ?? char.full_health) / char.full_health > 0.5
                      ? "from-amber-600 via-amber-500 to-amber-400"
                      : (char.health ?? char.full_health) / char.full_health > 0.25
                        ? "from-orange-700 via-orange-500 to-orange-400"
                        : "from-red-800 via-red-600 to-red-500"
                  }`}
                  style={{ width: `${Math.min(100, ((char.health ?? char.full_health) / char.full_health) * 100)}%` }}
                />
              </div>
              <p className="text-xs font-bold mt-1.5 text-amber-400 tracking-wide">
                <span className="text-red-500">&#10084;</span> {(char.health ?? char.full_health).toLocaleString()} / {char.full_health.toLocaleString()} <span className="text-amber-300/60 text-[10px]">HP</span>
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 my-2 flex items-center gap-2">
          <div
            className={`flex-1 h-px bg-linear-to-r from-transparent via-white/20 to-transparent`}
          />
          <div className={`w-1.5 h-1.5 rotate-45 border ${rc.border}`} />
          <div
            className={`flex-1 h-px bg-linear-to-r from-transparent via-white/20 to-transparent`}
          />
        </div>

        {/* Info grid - 2 columns like the reference */}
        <div className="px-5 py-2 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
          <div className="flex items-center gap-2">
            <span className={`text-xs ${rc.accent}`}>&#9672;</span>
            <span className="text-white/70">{char.gender || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${rc.accent}`}>&#9672;</span>
            <span className="text-white/70">{char.class || "Warrior"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${rc.accent}`}>&#9672;</span>
            <span className="text-white/70">Age {char.age || "?"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${rc.accent}`}>&#9672;</span>
            <span className="text-white/70">
              {char.relationship_status || "Single"}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 my-2 flex items-center gap-2">
          <div className="flex-1 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
          <div className={`w-1.5 h-1.5 rotate-45 border ${rc.border}`} />
          <div className="flex-1 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Stat boxes */}
        <div className="px-3 pb-2 pt-1 grid grid-cols-3 gap-1.5">
          {[
            { label: "STR", value: char.strength, color: "text-red-400" },
            { label: "DEX", value: char.dexterity, color: "text-green-400" },
            {
              label: "CON",
              value: char.constitution,
              color: "text-yellow-400",
            },
            {
              label: "INT",
              value: char.intelligence,
              color: "text-purple-400",
            },
            { label: "WIS", value: char.wisdom, color: "text-blue-400" },
            { label: "CHA", value: char.charisma, color: "text-pink-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#111] border border-white/10 rounded-sm py-1.5 text-center"
            >
              <p
                className={`text-[8px] font-bold uppercase tracking-wider ${stat.color}`}
              >
                {stat.label}
              </p>
              <p className="text-sm font-black text-white">
                {stat.value ?? "—"}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom row: "by" + admin actions */}
        <div className="px-4 pb-3 pt-1 flex items-center justify-between relative z-20">
          <span className="text-[10px] text-white/30 truncate max-w-[100px]">
            by {char.Profiles?.username || "?"}
          </span>
          {(userRole === "owner" || userRole === "admin") && (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(
                    `/worldDashboard/${worldId}/edit-character/${char.id}`,
                  );
                }}
                className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white rounded-sm text-xs font-bold transition-colors"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteCharacter(char.id, isNpc);
                }}
                className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-sm text-xs font-bold transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="Loading world..." />;
  }

  if (!worldData) {
    return (
      <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center text-white">
        World not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col font-sans overflow-hidden text-white p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            {worldData.name}
          </h1>
          <div className="flex gap-3">
            {(userRole === "owner" || userRole === "admin") && (
              <Link
                href={`/worldDashboard/${worldId}/admin`}
                className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/50 rounded-lg text-sm transition-all flex items-center gap-2 text-orange-100"
              >
                <span>⚙️</span> Admin Panel
              </Link>
            )}
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-all flex items-center gap-2"
            >
              <span>👥</span> Invite Members
            </button>
          </div>
        </div>
        <Link
          href="/worldChoice"
          className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm"
        >
          Back to overview
        </Link>
      </header>

      <div className="max-w-7xl mx-auto w-full">
        <div className="space-y-8">
          {/* NPC section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-purple-400">⚡</span> NPCs
              </h2>
              <Link
                href={`/worldDashboard/${worldId}/create-npc`}
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg text-sm transition-all flex items-center gap-2"
              >
                <span>➕</span> Create NPC
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {npcs.map((char) => renderCard(char, true))}
            </div>

            {npcs.length === 0 && (
              <div className="text-center py-16 text-white/30">
                <p className="text-lg mb-2">No NPCs yet</p>
                <Link
                  href={`/worldDashboard/${worldId}/create-npc`}
                  className="text-purple-400 hover:text-purple-300 underline text-sm"
                >
                  Create your first NPC
                </Link>
              </div>
            )}
          </section>

          {/* Player characters section */}
          <section className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-purple-400">⚡</span> Player Characters
              </h2>
              <Link
                href={`/worldDashboard/${worldId}/create-player`}
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg text-sm transition-all flex items-center gap-2"
              >
                <span>➕</span> Create Player
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {players.map((char) => renderCard(char, false))}
            </div>

            {players.length === 0 && (
              <div className="text-center py-16 text-white/30 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-lg mb-2">No player characters yet</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Invite modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md relative shadow-2xl shadow-purple-900/20">
            <button
              onClick={() => {
                setIsInviteModalOpen(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-purple-400">🔍</span> Find Player
            </h2>

            <form onSubmit={handleSearchUsers} className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username..."
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg py-3 pl-10 pr-3 text-white outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
              >
                {isSearching ? "..." : "Search"}
              </button>
            </form>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div>
                      <p className="font-bold text-white">{user.username}</p>
                      <p className="text-xs text-white/50">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleInviteUser(user.id, user.username, user.email)
                    }
                    className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600 hover:text-white rounded-lg text-sm font-bold transition-all"
                  >
                    Add
                  </button>
                </div>
              ))}

              {searchResults.length === 0 && searchQuery && !isSearching && (
                <div className="text-center py-8 text-white/30">
                  <p>No new users found.</p>
                  <p className="text-xs mt-1">Try a different spelling.</p>
                </div>
              )}

              {searchResults.length === 0 && !searchQuery && (
                <div className="text-center py-8 text-white/20">
                  <p>Search for a friend to invite them.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
