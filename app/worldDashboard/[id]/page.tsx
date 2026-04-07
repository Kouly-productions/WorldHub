"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function WorldDashboard() {
  const params = useParams();
  const worldId = params.id as string;
  const [worldData, setWorldData] = useState<any>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!worldId) return;

      // Hent verden
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

      // Hent karakterer
      const { data: chars, error: charsError } = await supabase
        .from("Characters")
        .select("*")
        .eq("world_id", worldId)
        .order("created_at", { ascending: false });

      if (charsError) {
        console.error("Error fetching characters:", charsError);
      } else {
        setCharacters(chars || []);
      }

      setLoading(false);
    }

    fetchData();
  }, [worldId]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center text-white">
        Loader verden...
      </div>
    );
  }

  if (!worldData) {
    return (
      <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center text-white">
        Verden blev ikke fundet.
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
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-all flex items-center gap-2">
              <span>👥</span> Inviter Medlemmer
            </button>
          </div>
        </div>
        <Link
          href="/worldChoice"
          className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm"
        >
          Tilbage til oversigt
        </Link>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto w-full">
        {/* Content Area */}
        <div className="space-y-8">
          {/* NPC Section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-purple-400">⚡</span> NPCer
              </h2>
              <Link
                href={`/worldDashboard/${worldId}/create-npc`}
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg text-sm transition-all flex items-center gap-2"
              >
                <span>➕</span> Opret NPC
              </Link>
            </div>

            {/* Characters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {characters.map((char) => {
                const rarity = char.rarity || "Common";

                const rarityConfig: Record<
                  string,
                  {
                    border: string;
                    shadow: string;
                    badgeBg: string;
                    text: string;
                    bgGradient: string;
                    animation: string;
                  }
                > = {
                  Common: {
                    border: "border-gray-600/50",
                    shadow: "hover:shadow-gray-500/20",
                    badgeBg: "bg-gray-600",
                    text: "text-gray-100",
                    bgGradient: "bg-linear-to-b from-gray-900/40 to-[#141414]",
                    animation: "",
                  },
                  Uncommon: {
                    border: "border-green-500/50",
                    shadow: "hover:shadow-green-500/20",
                    badgeBg: "bg-green-500",
                    text: "text-green-50",
                    bgGradient: "bg-linear-to-b from-green-900/20 to-[#141414]",
                    animation: "",
                  },
                  Rare: {
                    border: "border-blue-500/60",
                    shadow: "hover:shadow-blue-500/30",
                    badgeBg: "bg-blue-500",
                    text: "text-blue-50",
                    bgGradient: "bg-linear-to-b from-blue-900/30 to-[#141414]",
                    animation: "",
                  },
                  Epic: {
                    border: "border-purple-500/60",
                    shadow: "hover:shadow-purple-500/30",
                    badgeBg: "bg-purple-500",
                    text: "text-purple-50",
                    bgGradient:
                      "bg-linear-to-b from-purple-900/30 to-[#141414]",
                    animation: "",
                  },
                  Legendary: {
                    border: "border-orange-500",
                    shadow:
                      "hover:shadow-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.2)]",
                    badgeBg: "bg-orange-500",
                    text: "text-orange-50",
                    bgGradient:
                      "bg-linear-to-b from-orange-900/40 to-[#141414]",
                    animation: "animate-pulse-slow", // Du kan tilføje en custom animation i tailwind config senere
                  },
                };
                const rc = rarityConfig[rarity] || rarityConfig.Common;

                const strength = char.strength ?? 50;
                const strengthColor =
                  strength >= 80
                    ? "bg-red-500"
                    : strength >= 60
                      ? "bg-orange-500"
                      : strength >= 40
                        ? "bg-yellow-500"
                        : strength >= 20
                          ? "bg-blue-500"
                          : "bg-gray-500";

                return (
                  <div
                    key={char.id}
                    className={`flex flex-col rounded-2xl ${rc.border} border-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${rc.shadow} ${rc.bgGradient} overflow-hidden group relative`}
                  >
                    {/* Legendary Shine Effect */}
                    {rarity === "Legendary" && (
                      <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_2s_infinite] z-50 pointer-events-none" />
                    )}

                    {/* Portrait Header */}
                    <div className="relative h-56 w-full bg-[#0a0a0a] overflow-hidden border-b border-white/5">
                      {char.portrait_url ? (
                        <img
                          src={char.portrait_url}
                          alt={char.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-800 to-[#111]">
                          <span className="text-6xl opacity-20">👤</span>
                        </div>
                      )}

                      {/* Overlays for at gøre teksten læsbar */}
                      <div className="absolute inset-0 bg-linear-to-t from-[#141414] via-transparent to-transparent" />

                      {/* Rarity Badge */}
                      <div
                        className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${rc.badgeBg} ${rc.text} shadow-lg`}
                      >
                        {rarity}
                      </div>

                      {/* Level Badge */}
                      <div className="absolute top-3 right-3 w-12 h-12 bg-black/80 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center flex-col shadow-lg z-10">
                        <span className="text-[9px] text-white/50 leading-none mb-0.5">
                          LVL
                        </span>
                        <span className="text-base font-bold text-white leading-none">
                          {char.level || 1}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex-1 flex flex-col relative z-10">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-xl font-black text-white uppercase tracking-wide truncate drop-shadow-md">
                          {char.name}
                        </h3>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-md ml-2 whitespace-nowrap bg-black/50 border border-white/10 ${rc.text}`}
                        >
                          {char.class || "Warrior"}
                        </span>
                      </div>

                      <p className="text-sm text-gray-400 line-clamp-2 mb-5 flex-1">
                        {char.biography ||
                          "Ingen beskrivelse tilgængelig for denne karakter endnu."}
                      </p>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 bg-black/60 backdrop-blur-sm p-4 rounded-xl border border-white/10 shadow-inner">
                        {/* Age */}
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                            Alder
                          </p>
                          <p className="text-xs font-medium text-gray-200">
                            {char.age || "Ukendt"}
                          </p>
                        </div>

                        {/* Gender */}
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                            Køn
                          </p>
                          <p className="text-xs font-medium text-gray-200 truncate">
                            {char.gender || "Ukendt"}
                          </p>
                        </div>

                        {/* Relationship */}
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                            Status
                          </p>
                          <p className="text-xs font-medium text-gray-200 truncate">
                            {char.relationship_status || "Single"}
                          </p>
                        </div>

                        {/* Strength */}
                        <div className="col-span-3 mt-2">
                          <div className="flex justify-between items-end mb-1.5">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                              Styrke
                            </p>
                            <p className="text-[10px] font-bold text-gray-300">
                              {strength} / 100
                            </p>
                          </div>
                          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${strengthColor} rounded-full`}
                              style={{ width: `${strength}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {characters.length === 0 && (
              <div className="text-center py-16 text-white/30">
                <p className="text-lg mb-2">Ingen NPCer endnu</p>
                <Link
                  href={`/worldDashboard/${worldId}/create-npc`}
                  className="text-purple-400 hover:text-purple-300 underline text-sm"
                >
                  Opret din første NPC
                </Link>
              </div>
            )}
          </section>

          {/* Player Characters Section */}
          <section className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-purple-400">⚡</span> Player karaktere
              </h2>
              <Link
                href={`/worldDashboard/${worldId}/create-player`}
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg text-sm transition-all flex items-center gap-2"
              >
                <span>➕</span> Opret Player
              </Link>
            </div>
            <div className="text-center py-16 text-white/30 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-lg mb-2">Ingen player karaktere endnu</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
