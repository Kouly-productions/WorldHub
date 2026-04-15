"use client";

import React, { useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import LoadingScreen from "@/components/LoadingScreen";

export default function worldChoice() {
  const router = useRouter();
  const createPlanetImg = "/create_planet.png";
  const joinPlanetImg = "/join_planet.png";
  const existingWorldPlanetImg = "/existing_world_planet.png";
  const [loggedIn, setLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newWorldName, setNewWorldName] = useState("");
  const [userWorlds, setUserWorlds] = useState<any[]>([]);
  const [showWorldsModal, setShowWorldsModal] = useState(false);
  const [ready, setReady] = useState(false);
  const [pulses, setPulses] = useState<
    { id: number; x: number; y: number; horizontal: boolean }[]
  >([]);

  useEffect(() => {
    let id = 0;
    const interval = setInterval(() => {
      const gx = Math.floor(Math.random() * (window.innerWidth / 60)) * 60;
      const gy = Math.floor(Math.random() * (window.innerHeight / 60)) * 60;
      const horizontal = Math.random() > 0.5;
      const pulse = { id: id++, x: gx, y: gy, horizontal };
      setPulses((prev) => [...prev, pulse]);
      setTimeout(
        () => setPulses((prev) => prev.filter((p) => p.id !== pulse.id)),
        2000,
      );
    }, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function checkUserAndWorld() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setLoggedIn(!!user);

      if (user) {
        const { data: ownedWorlds } = await supabase
          .from("World")
          .select("*")
          .eq("owner_id", user.id);

        const { data: memberData, error: memberError } = await supabase
          .from("World_Members")
          .select("world_id")
          .eq("user_id", user.id);

        if (memberError) {
          console.error("Error fetching member worlds:", memberError);
        }

        console.log("Member data found:", memberData);

        let memberWorlds: any[] = [];

        if (memberData && memberData.length > 0) {
          const worldIds = memberData.map((m) => m.world_id);

          const { data: worldsData, error: worldsError } = await supabase
            .from("World")
            .select("*")
            .in("id", worldIds);

          if (worldsError) {
            console.error("Error fetching the worlds themselves:", worldsError);
          } else if (worldsData) {
            memberWorlds = worldsData;
          }
        }

        const allWorldsMap = new Map();

        ownedWorlds?.forEach((w) => {
          allWorldsMap.set(w.id, { ...w, role: "owner" });
        });

        memberWorlds.forEach((w) => {
          if (w && !allWorldsMap.has(w.id)) {
            allWorldsMap.set(w.id, { ...w, role: "member" });
          }
        });

        setUserWorlds(Array.from(allWorldsMap.values()));
      }

      setReady(true);
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
        alert("Error creating world: " + (error?.message || "Unknown error"));
      }
    } else {
      alert("You need to be logged in to create a world.");
    }
  }

  if (!ready) {
    return <LoadingScreen message="Loading worlds..." />;
  }

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center font-sans overflow-hidden text-white p-6">
      {/* Static grid background */}
      <div
        className="absolute inset-1 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.35) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Light pulses that travel along grid lines */}
      {pulses.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full bg-purple-400 pointer-events-none z-0"
          style={{
            left: p.x,
            top: p.y,
            boxShadow:
              "0 0 8px 4px rgba(168,85,247,0.6), 0 0 20px 8px rgba(168,85,247,0.3)",
            animation: p.horizontal
              ? "pulseRunH 2s ease-out forwards"
              : "pulseRunV 2s ease-out forwards",
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#0a0a0a_80%)] pointer-events-none" />

      {/* Profile / Login button */}
      <Link
        href={loggedIn ? "/profil" : "/login"}
        className="absolute top-6 right-6 px-5 py-2 rounded-lg border border-purple-400/30 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all animate-[fadeIn_0.5s_ease-out]"
      >
        {loggedIn ? "Profile" : "Login"}
      </Link>

      {/* Header section */}
      <div className="text-center mb-16 animate-[fadeSlideDown_0.6s_ease-out_both]">
        <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
          Welcome to WorldHub
        </h1>
        <p className="text-white/50 text-lg">
          Choose your destiny and begin your adventure!
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-12 md:gap-32 items-center justify-center max-w-6xl w-full">
        {/* CREATE WORLD */}
        <div
          onClick={() => setShowModal(true)}
          className="group flex flex-col items-center cursor-pointer transition-transform duration-500 hover:scale-105 animate-[fadeSlideUp_0.6s_ease-out_0.2s_both]"
        >
          <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/0 group-hover:border-purple-500/40 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all duration-500 ease-out z-0" />
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

        {/* JOIN WORLD */}
        <div className="group flex flex-col items-center cursor-pointer transition-transform duration-500 hover:scale-105 animate-[fadeSlideUp_0.6s_ease-out_0.4s_both]">
          <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/0 group-hover:border-blue-500/40 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all duration-500 ease-out z-0" />
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

        {/* YOUR WORLDS - only if user has any */}
        {userWorlds.length > 0 && (
          <div
            onClick={() => {
              if (userWorlds.length === 1) {
                router.push(`/worldDashboard/${userWorlds[0].id}`);
              } else {
                setShowWorldsModal(true);
              }
            }}
            className="group flex flex-col items-center cursor-pointer transition-transform duration-500 hover:scale-105 animate-[fadeSlideUp_0.6s_ease-out_0.6s_both]"
          >
            <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-green-500/0 group-hover:border-green-500/40 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] transition-all duration-500 ease-out z-0" />
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
            <h2 className="text-2xl font-bold tracking-widest text-white/80 group-hover:text-green-400 transition-colors duration-300 text-center uppercase">
              YOUR WORLDS
            </h2>
            <div className="h-1 w-0 group-hover:w-full bg-green-500 transition-all duration-300 mt-2" />
          </div>
        )}
      </div>

      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
      </div>
      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-purple-500/30 p-8 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(168,85,247,0.2)]">
            <h3 className="text-2xl font-bold text-white mb-6">
              Name your world
            </h3>

            <input
              type="text"
              placeholder="e.g. The Forgotten Realm..."
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
                Cancel
              </button>
              <button
                onClick={handleCreateWorld}
                className="flex-1 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors shadow-lg shadow-purple-900/20"
              >
                Create World
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Worlds List Modal */}
      {showWorldsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-green-500/30 p-8 rounded-2xl max-w-2xl w-full shadow-[0_0_50px_rgba(34,197,94,0.2)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Your Worlds</h3>
              <button
                onClick={() => setShowWorldsModal(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {userWorlds.map((world) => (
                <div
                  key={world.id}
                  onClick={() => router.push(`/worldDashboard/${world.id}`)}
                  className="bg-black/50 border border-white/10 hover:border-green-500/50 rounded-xl p-6 cursor-pointer transition-all hover:bg-green-500/5 group"
                >
                  <h4 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors mb-2">
                    {world.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                        world.role === "owner"
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {world.role === "owner" ? "Owner" : "Member"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
