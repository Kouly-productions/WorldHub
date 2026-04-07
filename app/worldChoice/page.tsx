"use client";

import React, { useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function worldChoice() {
  const router = useRouter();
  const createPlanetImg = "/create_planet.png";
  const joinPlanetImg = "/join_planet.png";
  const existingWorldPlanetImg = "/existing_world_planet.png";
  const [loggedIn, setLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newWorldName, setNewWorldName] = useState("");
  const [existingWorldId, setExistingWorldId] = useState<string | null>(null);

  useEffect(() => {
    async function checkUserAndWorld() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setLoggedIn(!!user);

      if (user) {
        // Tjek om brugeren allerede har en verden
        const { data } = await supabase
          .from("World")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (data) {
          setExistingWorldId(data.id);
        }
      }
    }

    checkUserAndWorld();
  }, []);

  async function handleCreateWorld() {
    if (!newWorldName) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("World")
        .insert({
          name: newWorldName,
          owner_id: user.id,
        })
        .select()
        .single();

      if (!error && data) {
        setShowModal(false);
        setNewWorldName("");
        router.push(`/worldDashboard/${data.id}`);
      } else {
        alert("Fejl ved oprettelse: " + (error?.message || "Ukendt fejl"));
      }
    } else {
      alert("Du skal være logget ind for at oprette en verden.");
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center font-sans overflow-hidden text-white p-6">
      {/* Profil / Login knap */}
      <Link
        href={loggedIn ? "/profil" : "/login"}
        className="absolute top-6 right-6 px-5 py-2 rounded-lg border border-purple-400/30 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all"
      >
        {loggedIn ? "Profil" : "Login"}
      </Link>

      {/* Overskrift sektion */}
      <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
          Velkommen til WorldHub
        </h1>
        <p className="text-white/50 text-lg">
          Vælg din skæbne og begynd dit eventyr!
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-12 md:gap-32 items-center justify-center max-w-6xl w-full">
        {/* CREATE WORLD BUTTON */}
        <div
          onClick={() => setShowModal(true)}
          className="group flex flex-col items-center cursor-pointer transition-transform duration-500 hover:scale-105"
        >
          <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8 flex items-center justify-center">
            {/* hover effect */}
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/0 group-hover:border-purple-500/40 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all duration-500 ease-out z-0" />

            {/* Planet image */}
            <img
              src={createPlanetImg}
              alt="Create World Planet"
              className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />

            <Plus className="absolute text-white w-12 h-12 z-20 opacity-80 group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
          </div>

          <h2 className="text-2xl font-bold tracking-widest text-white/80 group-hover:text-purple-400 transition-colors duration-300 text-center">
            CREATE WORLD
          </h2>
          <div className="h-1 w-0 group-hover:w-full bg-purple-500 transition-all duration-300 mt-2" />
        </div>

        {/* JOIN WORLD BUTTON */}
        <div className="group flex flex-col items-center cursor-pointer transition-transform duration-500 hover:scale-105">
          <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8 flex items-center justify-center">
            {/* hover effect */}
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/0 group-hover:border-blue-500/40 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all duration-500 ease-out z-0" />

            {/* Planet image */}
            <img
              src={joinPlanetImg}
              alt="Join World Planet"
              className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />

            <Users className="absolute text-white w-12 h-12 z-20 opacity-80 group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
          </div>

          <h2 className="text-2xl font-bold tracking-widest text-white/80 group-hover:text-blue-400 transition-colors duration-300 text-center">
            JOIN WORLD
          </h2>
          <div className="h-1 w-0 group-hover:w-full bg-blue-500 transition-all duration-300 mt-2" />
        </div>

        {/* Hvis brugeren HAR en verden, vis GOTO YOUR WORLD */}
        {existingWorldId && (
          <div
            onClick={() => router.push(`/worldDashboard/${existingWorldId}`)}
            className="group flex flex-col items-center cursor-pointer transition-transform duration-500 hover:scale-105"
          >
            <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8 flex items-center justify-center">
              {/* hover effect */}
              <div className="absolute inset-0 rounded-full border-2 border-green-500/0 group-hover:border-green-500/40 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] transition-all duration-500 ease-out z-0" />

              {/* Planet image */}
              <img
                src={existingWorldPlanetImg}
                alt="Your World Planet"
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              <Users className="absolute text-white w-12 h-12 z-20 opacity-80 group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
            </div>

            <h2 className="text-2xl font-bold tracking-widest text-white/80 group-hover:text-green-400 transition-colors duration-300 text-center">
              GO TO YOUR WORLD
            </h2>
            <div className="h-1 w-0 group-hover:w-full bg-green-500 transition-all duration-300 mt-2" />
          </div>
        )}
      </div>

      {/* background glow for extra depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
      </div>
      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-purple-500/30 p-8 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(168,85,247,0.2)]">
            <h3 className="text-2xl font-bold text-white mb-6">
              Navngiv din verden
            </h3>

            <input
              type="text"
              placeholder="F.eks. Det Glemte Rige..."
              value={newWorldName}
              onChange={(e) => setNewWorldName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white mb-6 focus:border-purple-500 outline-none transition-colors"
              autoFocus
            />

            <div className="flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={handleCreateWorld}
                className="flex-1 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors shadow-lg shadow-purple-900/20"
              >
                Opret Verden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
