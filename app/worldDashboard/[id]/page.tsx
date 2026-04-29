"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Search, X, Backpack, Plus, Trash2 } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { DEFAULT_ATTRIBUTES, type WorldAttribute } from "@/lib/worldDefaults";

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

  // Inventory modal state
  const [inventoryCharacter, setInventoryCharacter] = useState<any | null>(
    null,
  );
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  // World items catalog state
  const [worldItems, setWorldItems] = useState<any[]>([]);
  const [isLoadingWorldItems, setIsLoadingWorldItems] = useState(false);
  const [isItemsCatalogOpen, setIsItemsCatalogOpen] = useState(false);

  // Create item form state
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    type: "misc",
    rarity: "Common",
  });
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  // Holds the file the user picked for the item image
  // Image gets uploaded when the form is submitted, not when picked.
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);

  // Add-item-to-character picker state
  const [isAddItemPickerOpen, setIsAddItemPickerOpen] = useState(false);
  const [addingItemId, setAddingItemId] = useState<string | null>(null);

  async function fetchWorldItems() {
    setIsLoadingWorldItems(true);
    try {
      const { data, error } = await supabase
        .from("Items")
        .select("*")
        .eq("world_id", worldId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorldItems(data || []);
    } catch (err: any) {
      console.error("Error fetching items:", err.message);
    } finally {
      setIsLoadingWorldItems(false);
    }
  }

  function openItemsCatalog() {
    setIsItemsCatalogOpen(true);
    fetchWorldItems();
  }

  function closeItemsCatalog() {
    setIsItemsCatalogOpen(false);
  }

  async function openInventory(char: any) {
    setInventoryCharacter(char);
    setIsLoadingInventory(true);
    try {
      const { data, error } = await supabase
        .from("Character_Inventory")
        .select(`*, Items (*)`)
        .eq("character_id", char.id)
        .order("acquired_at", { ascending: false });

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (err: any) {
      console.error("Error fetching inventory:", err.message);
      setInventoryItems([]);
    } finally {
      setIsLoadingInventory(false);
    }
  }

  function closeInventory() {
    setInventoryCharacter(null);
    setInventoryItems([]);
  }

  function openCreateItemModal() {
    setNewItem({
      name: "",
      description: "",
      type: "misc",
      rarity: "Common",
    });
    // Reset the picked file too so the modal starts fresh
    setItemImageFile(null);
    setItemImagePreview(null);
    setIsCreateItemModalOpen(true);
  }

  function closeCreateItemModal() {
    setIsCreateItemModalOpen(false);
    setItemImageFile(null);
    setItemImagePreview(null);
  }

  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.name.trim()) {
      alert("Item must have a name.");
      return;
    }
    setIsCreatingItem(true);

    try {
      // If the user picked a file, upload it to the items bucket and use the public URL.
      // No file means no image, simple as that.
      let image_url: string | null = null;

      if (itemImageFile) {
        const fileExt = itemImageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${worldId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("items")
          .upload(filePath, itemImageFile);

        if (uploadError) {
          throw new Error(`Couldn't upload image: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("items").getPublicUrl(filePath);

        image_url = publicUrl;
      }

      const { data, error } = await supabase
        .from("Items")
        .insert({
          world_id: worldId,
          name: newItem.name.trim(),
          description: newItem.description.trim() || null,
          type: newItem.type,
          rarity: newItem.rarity,
          image_url,
        })
        .select()
        .single();

      if (error) throw error;

      setWorldItems((prev) => (data ? [data, ...prev] : prev));
      closeCreateItemModal();
    } catch (err: any) {
      alert("Couldn't create item: " + err.message);
    } finally {
      setIsCreatingItem(false);
    }
  }

  async function handleDeleteWorldItem(itemId: string, itemName: string) {
    if (!confirm(`Delete "${itemName}" from the world catalog?`)) return;
    try {
      const { error } = await supabase.from("Items").delete().eq("id", itemId);
      if (error) throw error;
      setWorldItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err: any) {
      alert("Couldn't delete item: " + err.message);
    }
  }

  async function openAddItemPicker() {
    setIsAddItemPickerOpen(true);
    if (worldItems.length === 0) {
      fetchWorldItems();
    }
  }

  function closeAddItemPicker() {
    setIsAddItemPickerOpen(false);
  }

  async function handleAddItemToCharacter(itemId: string) {
    if (!inventoryCharacter) return;
    setAddingItemId(itemId);

    try {
      const { data, error } = await supabase
        .from("Character_Inventory")
        .insert({
          character_id: inventoryCharacter.id,
          item_id: itemId,
          quantity: 1,
        })
        .select(`*, Items (*)`)
        .single();

      if (error) throw error;

      if (data) {
        setInventoryItems((prev) => [data, ...prev]);
      }
      closeAddItemPicker();
    } catch (err: any) {
      alert("Couldn't add item: " + err.message);
    } finally {
      setAddingItemId(null);
    }
  }

  async function handleRemoveInventoryItem(entryId: string, itemName: string) {
    if (!confirm(`Remove "${itemName}" from this character?`)) return;
    try {
      const { error } = await supabase
        .from("Character_Inventory")
        .delete()
        .eq("id", entryId);

      if (error) throw error;
      setInventoryItems((prev) => prev.filter((e) => e.id !== entryId));
    } catch (err: any) {
      alert("Couldn't remove item: " + err.message);
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

  // The list of attributes for this world. Falls back to the shared default
  // render correctly even before the admin defines anything.
  const worldAttributes: WorldAttribute[] = (() => {
    if (
      !Array.isArray(worldData?.attributes) ||
      worldData.attributes.length === 0
    ) {
      return DEFAULT_ATTRIBUTES;
    }
    const cleaned: WorldAttribute[] = worldData.attributes
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
    return cleaned.length > 0 ? cleaned : DEFAULT_ATTRIBUTES;
  })();

  // Build a style object for a character's rarity based on the world's
  // configured rarities (admin-defined). Falls back to a neutral gray if
  // the rarity name isn't in the world's list (e.g. legacy character).
  function getCharRarityStyle(rarityName: string) {
    const worldRarities: Array<{ name: string; color: string }> = Array.isArray(
      worldData?.rarities,
    )
      ? worldData.rarities
      : [];
    const found = worldRarities.find((r) => r.name === rarityName);
    const hex = found?.color || "#6b7280";
    return {
      hex,
      borderStyle: { borderColor: hex } as React.CSSProperties,
      accentStyle: { color: hex } as React.CSSProperties,
      badgeStyle: {
        backgroundColor: hex,
        color: "#fff",
      } as React.CSSProperties,
      glowStyle: { boxShadow: `0 0 20px ${hex}40` } as React.CSSProperties,
    };
  }

  function renderCard(char: any, isNpc: boolean) {
    const rarity = char.rarity || "Common";
    const rs = getCharRarityStyle(rarity);

    // When the card is clicked (not the buttons), go to the character page.
    // Buttons inside the card already use stopPropagation so this won't fire when they're clicked.
    function handleCardClick() {
      router.push(`/worldDashboard/${worldId}/character/${char.id}`);
    }

    return (
      <div
        key={char.id}
        onClick={handleCardClick}
        className="relative flex flex-col rounded-sm border-2 bg-[#1a1510] overflow-hidden group transition-all duration-300 hover:-translate-y-1 cursor-pointer"
        style={{ ...rs.borderStyle, ...rs.glowStyle }}
      >
        {/* Top banner: class + level */}
        <div
          className="relative bg-[#111] border-b-2 py-3 text-center"
          style={rs.borderStyle}
        >
          <p
            className="text-xs font-bold uppercase tracking-[0.25em]"
            style={rs.accentStyle}
          >
            {char.class || "Warrior"}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">
            Lvl. {char.level || 1}
          </p>
          {/* Decorative corner accents */}
          <div
            className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2"
            style={rs.borderStyle}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2"
            style={rs.borderStyle}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2"
            style={rs.borderStyle}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2"
            style={rs.borderStyle}
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
            className="absolute top-2 right-2 px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest"
            style={rs.badgeStyle}
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
                      : (char.health ?? char.full_health) / char.full_health >
                          0.25
                        ? "from-orange-700 via-orange-500 to-orange-400"
                        : "from-red-800 via-red-600 to-red-500"
                  }`}
                  style={{
                    width: `${Math.min(100, ((char.health ?? char.full_health) / char.full_health) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs font-bold mt-1.5 text-amber-400 tracking-wide">
                <span className="text-red-500">&#10084;</span>{" "}
                {(char.health ?? char.full_health).toLocaleString()} /{" "}
                {char.full_health.toLocaleString()}{" "}
                <span className="text-amber-300/60 text-[10px]">HP</span>
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 my-2 flex items-center gap-2">
          <div className="flex-1 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
          <div
            className="w-1.5 h-1.5 rotate-45 border"
            style={rs.borderStyle}
          />
          <div className="flex-1 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Info grid - 2 columns like the reference */}
        <div className="px-5 py-2 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs" style={rs.accentStyle}>
              &#9672;
            </span>
            <span className="text-white/70">{char.gender || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={rs.accentStyle}>
              &#9672;
            </span>
            <span className="text-white/70">{char.class || "Warrior"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={rs.accentStyle}>
              &#9672;
            </span>
            <span className="text-white/70">Age {char.age || "?"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={rs.accentStyle}>
              &#9672;
            </span>
            <span className="text-white/70">
              {char.relationship_status || "Single"}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 my-2 flex items-center gap-2">
          <div className="flex-1 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
          <div
            className="w-1.5 h-1.5 rotate-45 border"
            style={rs.borderStyle}
          />
          <div className="flex-1 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Stat boxes, dynamically built from world.attributes. Each box
            shows a short 3 letter label + the character's value for that
            attribute. Falls back to legacy strength/dex/etc. columns for
            characters that haven't been migrated to attribute_values yet. */}
        {worldAttributes.length > 0 && (
          <div className="px-3 pb-2 pt-1 grid grid-cols-3 gap-1.5">
            {worldAttributes.map((attr) => {
              // Prefer the JSONB attribute_values, then the legacy column with
              // the matching name (for back compat).
              const value =
                char.attribute_values?.[attr.id] ?? char[attr.id] ?? null;
              // Short 3 letter label for the box ("Strength" -> "STR").
              const shortLabel = attr.name.slice(0, 3).toUpperCase();
              return (
                <div
                  key={attr.id}
                  className="bg-[#111] border border-white/10 rounded-sm py-1.5 text-center"
                  title={attr.name}
                >
                  <p
                    className="text-[8px] font-bold uppercase tracking-wider"
                    style={{ color: attr.color }}
                  >
                    {shortLabel}
                  </p>
                  <p className="text-sm font-black text-white">
                    {value ?? "-"}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom row: "by" + actions */}
        <div className="px-4 pb-3 pt-1 flex items-center justify-between relative z-20">
          <span className="text-[10px] text-white/30 truncate max-w-[100px]">
            by {char.Profiles?.username || "?"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openInventory(char);
              }}
              className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500 hover:text-white rounded-sm text-xs font-bold transition-colors flex items-center gap-1"
              title="View inventory"
            >
              <Backpack className="w-3.5 h-3.5" />
              Inventory
            </button>
            {(userRole === "owner" || userRole === "admin") && (
              <>
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
              </>
            )}
          </div>
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
              <>
                <Link
                  href={`/worldDashboard/${worldId}/admin`}
                  className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/50 rounded-lg text-sm transition-all flex items-center gap-2 text-orange-100"
                >
                  <span>⚙️</span> Admin Panel
                </Link>
                <button
                  onClick={openItemsCatalog}
                  className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 rounded-lg text-sm transition-all flex items-center gap-2 text-amber-100"
                >
                  <Backpack className="w-4 h-4" /> World Items
                </button>
              </>
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

      {/* Inventory modal */}
      {inventoryCharacter && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeInventory}
        >
          <div
            className="bg-[#1a1510] border-2 border-amber-500/40 rounded-lg w-full max-w-2xl relative shadow-2xl shadow-amber-900/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeInventory}
              className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors z-10 p-1 rounded-sm hover:bg-white/10"
              aria-label="Close inventory"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 p-5 border-b border-amber-500/20">
              {inventoryCharacter.portrait_url ? (
                <img
                  src={inventoryCharacter.portrait_url}
                  alt={inventoryCharacter.name}
                  className="w-14 h-14 rounded-sm object-cover border border-amber-500/40"
                />
              ) : (
                <div className="w-14 h-14 rounded-sm bg-[#0d0b08] border border-amber-500/40 flex items-center justify-center text-2xl opacity-40">
                  👤
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/80 flex items-center gap-2">
                  <Backpack className="w-3.5 h-3.5" /> Inventory
                </p>
                <h2 className="text-xl font-bold bg-linear-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                  {inventoryCharacter.name}
                </h2>
                <p className="text-[11px] text-white/40 mt-0.5">
                  Lvl. {inventoryCharacter.level || 1}{" "}
                  {inventoryCharacter.class || "Adventurer"}
                </p>
              </div>
            </div>

            {/* Action bar */}
            {(userRole === "owner" || userRole === "admin") && (
              <div className="flex justify-end px-5 pt-4">
                <button
                  onClick={openAddItemPicker}
                  className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 rounded-sm text-xs font-bold text-amber-200 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
            )}

            {/* Body */}
            <div className="p-5 max-h-[55vh] overflow-y-auto">
              {isLoadingInventory ? (
                <div className="text-center py-12 text-white/40 text-sm">
                  Loading items...
                </div>
              ) : inventoryItems.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-md bg-[#0f0d0a]">
                  <div className="text-5xl mb-3 opacity-30">🎒</div>
                  <p className="text-white/60 mb-1">The bag is empty.</p>
                  <p className="text-xs text-white/30">
                    Items will appear here once the inventory system is wired
                    up.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inventoryItems.map((entry) => {
                    const item = entry.Items;
                    if (!item) return null;
                    const rc = rarityConfig[item.rarity] || rarityConfig.Common;
                    const canManage =
                      userRole === "owner" || userRole === "admin";
                    return (
                      <div
                        key={entry.id}
                        className={`bg-[#0f0d0a] border ${rc.border} rounded-md p-3 flex gap-3 relative group`}
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-12 h-12 rounded-sm object-cover border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-sm bg-[#1a1510] border border-white/10 flex items-center justify-center text-xl opacity-40 shrink-0">
                            📦
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`font-bold text-sm truncate ${rc.text}`}
                            >
                              {item.name}
                            </p>
                            {entry.quantity > 1 && (
                              <span className="text-[10px] font-bold text-amber-300 bg-amber-900/40 px-1.5 py-0.5 rounded-sm shrink-0">
                                ×{entry.quantity}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
                            {item.type} · {item.rarity}
                          </p>
                          {item.description && (
                            <p className="text-xs text-white/50 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {canManage && (
                          <button
                            onClick={() =>
                              handleRemoveInventoryItem(entry.id, item.name)
                            }
                            className="absolute top-2 right-2 p-1 rounded-sm bg-black/40 text-red-400/70 hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove from inventory"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Item modal */}
      {isCreateItemModalOpen && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-60 p-4"
          onClick={closeCreateItemModal}
        >
          <div
            className="bg-[#1a1510] border-2 border-amber-500/40 rounded-lg w-full max-w-md relative shadow-2xl shadow-amber-900/40"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeCreateItemModal}
              className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors z-10 p-1 rounded-sm hover:bg-white/10"
              aria-label="Close create item"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-5 border-b border-amber-500/20">
              <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/80">
                New Item
              </p>
              <h2 className="text-xl font-bold bg-linear-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                Forge an Item
              </h2>
            </div>

            <form onSubmit={handleCreateItem} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400/80 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                  placeholder="Longsword, Health Potion..."
                  className="w-full bg-[#0f0d0a] border border-white/10 rounded-sm py-2 px-3 text-white text-sm outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400/80 mb-1.5">
                  Description
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                  placeholder="What does this item do?"
                  rows={3}
                  className="w-full bg-[#0f0d0a] border border-white/10 rounded-sm py-2 px-3 text-white text-sm outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-400/80 mb-1.5">
                    Type
                  </label>
                  <select
                    value={newItem.type}
                    onChange={(e) =>
                      setNewItem({ ...newItem, type: e.target.value })
                    }
                    className="w-full bg-[#0f0d0a] border border-white/10 rounded-sm py-2 px-3 text-white text-sm outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="weapon">Weapon</option>
                    <option value="armor">Armor</option>
                    <option value="potion">Potion</option>
                    <option value="scroll">Scroll</option>
                    <option value="misc">Misc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-400/80 mb-1.5">
                    Rarity
                  </label>
                  <select
                    value={newItem.rarity}
                    onChange={(e) =>
                      setNewItem({ ...newItem, rarity: e.target.value })
                    }
                    className="w-full bg-[#0f0d0a] border border-white/10 rounded-sm py-2 px-3 text-white text-sm outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="Common">Common</option>
                    <option value="Uncommon">Uncommon</option>
                    <option value="Rare">Rare</option>
                    <option value="Epic">Epic</option>
                    <option value="Legendary">Legendary</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400/80 mb-1.5">
                  Image (optional)
                </label>

                <div className="flex items-center gap-3">
                  {/* Image preview / placeholder */}
                  <div className="relative shrink-0">
                    {itemImagePreview ? (
                      <img
                        src={itemImagePreview}
                        alt="Preview"
                        className="w-16 h-16 rounded object-cover border-2 border-amber-700/50"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded bg-[#0f0d0a] border-2 border-dashed border-amber-900/40 flex items-center justify-center">
                        <span className="text-2xl opacity-30">📦</span>
                      </div>
                    )}
                  </div>

                  {/* File picker. Hidden input + label trick gives us a styled button */}
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="cursor-pointer w-full bg-[#0f0d0a] border border-white/10 hover:border-amber-500/50 rounded-sm py-2 px-3 text-white text-sm transition-colors text-center">
                      {itemImageFile ? "Change image" : "Upload image"}
                      <input
                        type="file"
                        accept="image/jpeg, image/png, image/jpg, image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setItemImageFile(file);
                            setItemImagePreview(URL.createObjectURL(file));
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    {itemImageFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setItemImageFile(null);
                          setItemImagePreview(null);
                        }}
                        className="text-xs text-white/40 hover:text-red-400 transition-colors text-left"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCreateItemModal}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingItem || !newItem.name.trim()}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm text-sm font-bold transition-colors"
                >
                  {isCreatingItem ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* World Items catalog modal */}
      {isItemsCatalogOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeItemsCatalog}
        >
          <div
            className="bg-[#1a1510] border-2 border-amber-500/40 rounded-lg w-full max-w-3xl relative shadow-2xl shadow-amber-900/30"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeItemsCatalog}
              className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors z-10 p-1 rounded-sm hover:bg-white/10"
              aria-label="Close world items"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-5 border-b border-amber-500/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/80 flex items-center gap-2">
                  <Backpack className="w-3.5 h-3.5" /> World Catalog
                </p>
                <h2 className="text-xl font-bold bg-linear-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                  {worldData?.name} Items
                </h2>
              </div>
              <button
                onClick={openCreateItemModal}
                className="mr-10 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-sm text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create Item
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {isLoadingWorldItems ? (
                <div className="text-center py-12 text-white/40 text-sm">
                  Loading items...
                </div>
              ) : worldItems.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-md bg-[#0f0d0a]">
                  <div className="text-5xl mb-3 opacity-30">⚔️</div>
                  <p className="text-white/60 mb-1">No items yet.</p>
                  <p className="text-xs text-white/30">
                    Click "Create Item" to forge one.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {worldItems.map((item) => {
                    const rc = rarityConfig[item.rarity] || rarityConfig.Common;
                    return (
                      <div
                        key={item.id}
                        className={`bg-[#0f0d0a] border ${rc.border} rounded-md p-3 flex gap-3`}
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-14 h-14 rounded-sm object-cover border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-sm bg-[#1a1510] border border-white/10 flex items-center justify-center text-2xl opacity-40 shrink-0">
                            📦
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`font-bold text-sm truncate ${rc.text}`}
                            >
                              {item.name}
                            </p>
                            <span
                              className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${rc.badgeBg} ${rc.text}`}
                            >
                              {item.rarity}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
                            {item.type}
                          </p>
                          {item.description && (
                            <p className="text-xs text-white/50 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteWorldItem(item.id, item.name)
                            }
                            className="mt-2 text-[10px] text-red-400/70 hover:text-red-400 underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Item to character picker modal */}
      {isAddItemPickerOpen && inventoryCharacter && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-60 p-4"
          onClick={closeAddItemPicker}
        >
          <div
            className="bg-[#1a1510] border-2 border-amber-500/40 rounded-lg w-full max-w-lg relative shadow-2xl shadow-amber-900/40"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeAddItemPicker}
              className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors z-10 p-1 rounded-sm hover:bg-white/10"
              aria-label="Close add item"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-5 border-b border-amber-500/20">
              <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/80">
                Add Item
              </p>
              <h2 className="text-lg font-bold text-white">
                Give to{" "}
                <span className="bg-linear-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                  {inventoryCharacter.name}
                </span>
              </h2>
            </div>

            <div className="p-5 max-h-[55vh] overflow-y-auto">
              {isLoadingWorldItems ? (
                <div className="text-center py-10 text-white/40 text-sm">
                  Loading items...
                </div>
              ) : worldItems.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-md bg-[#0f0d0a]">
                  <div className="text-4xl mb-3 opacity-30">⚔️</div>
                  <p className="text-white/60 mb-1 text-sm">
                    No items in this world yet.
                  </p>
                  <p className="text-xs text-white/30">
                    Close this and use "World Items" to create some first.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {worldItems.map((item) => {
                    const rc = rarityConfig[item.rarity] || rarityConfig.Common;
                    return (
                      <div
                        key={item.id}
                        className={`bg-[#0f0d0a] border ${rc.border} rounded-md p-3 flex items-center gap-3`}
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-10 h-10 rounded-sm object-cover border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-sm bg-[#1a1510] border border-white/10 flex items-center justify-center text-lg opacity-40 shrink-0">
                            📦
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-bold text-sm truncate ${rc.text}`}
                          >
                            {item.name}
                          </p>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider">
                            {item.type} · {item.rarity}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddItemToCharacter(item.id)}
                          disabled={addingItemId === item.id}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm text-xs font-bold transition-colors"
                        >
                          {addingItemId === item.id ? "..." : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
