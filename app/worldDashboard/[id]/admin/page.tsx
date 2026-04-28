"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Settings,
  ScrollText,
  Trash2,
  X,
  Search,
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

export default function AdminPanel() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [worldData, setWorldData] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("members");
  const [worldName, setWorldName] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Max stat values for this world. Each character's stats can't go higher than these.
  const [maxStats, setMaxStats] = useState({
    max_strength: 30,
    max_dexterity: 30,
    max_constitution: 30,
    max_intelligence: 30,
    max_wisdom: 30,
    max_charisma: 30,
  });

  // Classes are stored as a comma separated string in the World table. We split it into a list here.
  const [classes, setClasses] = useState<string[]>([]);
  const [newClass, setNewClass] = useState("");

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function fetchAdminData() {
      if (!worldId) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Grab the world data
      const { data: world, error: worldError } = await supabase
        .from("World")
        .select("*")
        .eq("id", worldId)
        .single();

      if (worldError) {
        console.error("Error fetching world:", worldError);
        setLoading(false);
        return;
      }
      setWorldData(world);
      setWorldName(world.name || "");

      // Load the max stats. If the columns don't exist yet (database hasn't been updated), fall back to 30.
      setMaxStats({
        max_strength: world.max_strength ?? 30,
        max_dexterity: world.max_dexterity ?? 30,
        max_constitution: world.max_constitution ?? 30,
        max_intelligence: world.max_intelligence ?? 30,
        max_wisdom: world.max_wisdom ?? 30,
        max_charisma: world.max_charisma ?? 30,
      });

      // Load classes. The string "Warrior,Mage,..." gets split into an array.
      const classList = world.classes
        ? world.classes
            .split(",")
            .map((c: string) => c.trim())
            .filter((c: string) => c.length > 0)
        : [];
      setClasses(classList);

      // Need to figure out what role the current user has
      let role = "member";
      const { data: memberData } = await supabase
        .from("World_Members")
        .select("role")
        .eq("world_id", worldId)
        .eq("user_id", user.id)
        .single();

      if (memberData) {
        role = memberData.role;
      } else if (world.owner_id === user.id) {
        role = "owner";
      }

      setUserRole(role);

      // Redirect non admins
      if (role !== "owner" && role !== "admin") {
        router.push(`/worldDashboard/${worldId}`);
        return;
      }

      // Fetch all members with their profile info
      const { data: membersData, error: membersError } = await supabase
        .from("World_Members")
        .select(
          `
          *,
          Profiles:user_id (
            username,
            email
          )
        `,
        )
        .eq("world_id", worldId);

      if (membersError) {
        console.error("Error fetching members:", membersError);
      } else {
        // We assume the owner is already in World_Members for now
        setMembers(membersData || []);
      }

      setLoading(false);
    }

    fetchAdminData();
  }, [worldId, router]);

  async function handleRoleChange(memberId: string, newRole: string) {
    // Only the owner should be able to promote to owner
    if (userRole !== "owner" && newRole === "owner") return;

    try {
      const { error } = await supabase
        .from("World_Members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
      );
    } catch (err: any) {
      alert("Couldn't change role: " + err.message);
    }
  }

  async function handleKickMember(memberId: string) {
    if (!confirm("Are you sure you want to kick this user?")) return;

    try {
      const { error } = await supabase
        .from("World_Members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: any) {
      alert("Couldn't remove user: " + err.message);
    }
  }

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
        {
          ...data,
          Profiles: { username, email },
        },
      ]);

      // Remove from search results since they're added now
      setSearchResults((prev) => prev.filter((p) => p.id !== userId));
      alert(`${username} has been added to the world!`);
    } catch (err: any) {
      alert("Couldn't add user: " + err.message);
    }
  }

  async function handleSaveSettings() {
    if (!worldName.trim()) {
      alert("World name can't be empty.");
      return;
    }
    setSavingSettings(true);
    try {
      // Save the world name, max stats and the classes list all in one update.
      // Classes are joined back to a comma separated string for storage.
      const { error } = await supabase
        .from("World")
        .update({
          name: worldName.trim(),
          ...maxStats,
          classes: classes.join(","),
        })
        .eq("id", worldId);

      if (error) throw error;

      setWorldData((prev: any) => ({
        ...prev,
        name: worldName.trim(),
        ...maxStats,
        classes: classes.join(","),
      }));
      alert("Settings saved!");
    } catch (err: any) {
      alert("Couldn't save settings: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  }

  // Update one of the max stat values. Min is 1, max is 100 to keep things reasonable.
  function updateMaxStat(key: keyof typeof maxStats, value: number) {
    const clamped = Math.max(1, Math.min(100, value));
    setMaxStats((prev) => ({ ...prev, [key]: clamped }));
  }

  // Add a new class to the list. Trims whitespace and skips duplicates.
  function handleAddClass() {
    const trimmed = newClass.trim();
    if (!trimmed) return;
    if (classes.includes(trimmed)) {
      alert("That class already exists.");
      return;
    }
    setClasses((prev) => [...prev, trimmed]);
    setNewClass("");
  }

  // Remove a class from the list by index.
  function handleRemoveClass(index: number) {
    setClasses((prev) => prev.filter((_, i) => i !== index));
  }

  const [deleting, setDeleting] = useState(false);

  async function handleDeleteWorld() {
    if (
      !confirm(
        "Are you SURE you want to delete this world? This cannot be undone.",
      )
    )
      return;
    if (
      !confirm(
        "This will permanently delete all members and characters. Type OK to confirm.",
      )
    )
      return;

    setDeleting(true);
    try {
      // Delete characters first, then members, then the world itself
      const { error: charsError } = await supabase
        .from("Characters")
        .delete()
        .eq("world_id", worldId);

      if (charsError) throw charsError;

      const { error: membersError } = await supabase
        .from("World_Members")
        .delete()
        .eq("world_id", worldId);

      if (membersError) throw membersError;

      const { error: worldError } = await supabase
        .from("World")
        .delete()
        .eq("id", worldId);

      if (worldError) throw worldError;

      router.push("/worldChoice");
    } catch (err: any) {
      alert("Couldn't delete world: " + err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading admin panel..." />;
  }

  if (userRole !== "owner" && userRole !== "admin") {
    return null; // Will be redirected in useEffect
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white font-sans p-6 flex justify-center">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/worldDashboard/${worldId}`}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-orange-400 to-red-600 bg-clip-text text-transparent flex items-center gap-3">
              <span>⚙️</span> Admin Panel
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Managing: <span className="text-white">{worldData?.name}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("members")}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all text-left ${
                activeTab === "members"
                  ? "bg-orange-500/20 border-orange-500/50 border text-orange-400"
                  : "bg-[#1a1a1a] border border-white/5 hover:bg-white/5 text-white/70"
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-bold">Members</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all text-left ${
                activeTab === "settings"
                  ? "bg-orange-500/20 border-orange-500/50 border text-orange-400"
                  : "bg-[#1a1a1a] border border-white/5 hover:bg-white/5 text-white/70"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-bold">Settings</span>
            </button>
            <button
              onClick={() => setActiveTab("characters")}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all text-left ${
                activeTab === "characters"
                  ? "bg-orange-500/20 border-orange-500/50 border text-orange-400"
                  : "bg-[#1a1a1a] border border-white/5 hover:bg-white/5 text-white/70"
              }`}
            >
              <ScrollText className="w-5 h-5" />
              <span className="font-bold">Characters</span>
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-[#111] border border-white/10 rounded-2xl p-6 min-h-[500px]">
            {/* MEMBERS TAB */}
            {activeTab === "members" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <h2 className="text-xl font-bold">Member Management</h2>
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-bold transition-colors"
                  >
                    + Invite
                  </button>
                </div>

                <div className="space-y-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between bg-[#1a1a1a] p-4 rounded-xl border border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">
                          👤
                        </div>
                        <div>
                          <p className="font-bold text-white">
                            {member.Profiles?.username || "Unknown User"}
                          </p>
                          <p className="text-xs text-white/50">
                            {member.Profiles?.email || "No email"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Role Selector */}
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member.id, e.target.value)
                          }
                          disabled={
                            userRole !== "owner" || member.role === "owner"
                          }
                          className="bg-black border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-orange-500 disabled:opacity-50"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                          {userRole === "owner" && (
                            <option value="owner">Owner</option>
                          )}
                        </select>

                        {/* Kick Button */}
                        <button
                          onClick={() => handleKickMember(member.id)}
                          disabled={member.role === "owner"}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Kick"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {members.length === 0 && (
                    <p className="text-white/50 text-center py-8">
                      No members found.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="space-y-8">
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-xl font-bold">World Settings</h2>
                </div>

                {/* World name */}
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/70">
                      World Name
                    </label>
                    <input
                      type="text"
                      value={worldName}
                      onChange={(e) => setWorldName(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 focus:border-orange-500 outline-none text-white"
                    />
                  </div>
                </div>

                {/* Max stats. Each input is 1-100. */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Max Stat Values</h3>
                    <p className="text-sm text-white/50">
                      Set the highest value each stat can reach in this world.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { key: "max_strength", label: "Strength", color: "text-red-400" },
                      { key: "max_dexterity", label: "Dexterity", color: "text-green-400" },
                      { key: "max_constitution", label: "Constitution", color: "text-yellow-400" },
                      { key: "max_intelligence", label: "Intelligence", color: "text-purple-400" },
                      { key: "max_wisdom", label: "Wisdom", color: "text-blue-400" },
                      { key: "max_charisma", label: "Charisma", color: "text-pink-400" },
                    ].map((stat) => (
                      <div key={stat.key} className="space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-wider ${stat.color}`}>
                          {stat.label}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={maxStats[stat.key as keyof typeof maxStats]}
                          onChange={(e) =>
                            updateMaxStat(
                              stat.key as keyof typeof maxStats,
                              parseInt(e.target.value) || 1,
                            )
                          }
                          className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2 focus:border-orange-500 outline-none text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Classes list. Owner/admin can add and remove. */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Available Classes</h3>
                    <p className="text-sm text-white/50">
                      The list of character classes that can be picked when creating a character.
                    </p>
                  </div>

                  {/* Add new class */}
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      value={newClass}
                      onChange={(e) => setNewClass(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddClass();
                        }
                      }}
                      placeholder="Type a new class name..."
                      className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 focus:border-orange-500 outline-none text-white"
                    />
                    <button
                      onClick={handleAddClass}
                      disabled={!newClass.trim()}
                      className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 disabled:opacity-30 disabled:cursor-not-allowed border border-orange-500/40 rounded-lg text-sm font-bold text-orange-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {/* Existing classes shown as removable tags */}
                  <div className="flex flex-wrap gap-2">
                    {classes.length === 0 ? (
                      <p className="text-white/40 italic text-sm">
                        No classes yet. Add one above.
                      </p>
                    ) : (
                      classes.map((cls, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 group"
                        >
                          <span className="text-sm text-white/80">{cls}</span>
                          <button
                            onClick={() => handleRemoveClass(index)}
                            className="text-white/40 hover:text-red-400 transition-colors"
                            title="Remove class"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Save button at the bottom saves everything at once */}
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-bold transition-colors"
                  >
                    {savingSettings ? "Saving..." : "Save Settings"}
                  </button>
                </div>

                {userRole === "owner" && (
                  <div className="mt-12 pt-6 border-t border-red-500/30">
                    <h3 className="text-red-400 font-bold mb-2">Danger Zone</h3>
                    <p className="text-sm text-white/50 mb-4">
                      Once you delete a world, it cannot be recovered.
                    </p>
                    <button
                      onClick={handleDeleteWorld}
                      disabled={deleting}
                      className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600 hover:text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting ? "Deleting..." : "Delete World"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CHARACTERS TAB */}
            {activeTab === "characters" && (
              <div className="space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-xl font-bold">Character Moderation</h2>
                  <p className="text-sm text-white/50 mt-1">
                    Here you can delete or hide characters that break the rules.
                  </p>
                </div>

                <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-8 text-center">
                  <ScrollText className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">
                    Character moderation coming soon...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INVITE MODAL */}
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
