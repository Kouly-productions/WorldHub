"use client";

import React, { useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  DEFAULT_ATTRIBUTES,
  DEFAULT_CLASSES,
  DEFAULT_RARITIES,
} from "@/lib/worldDefaults";
import { ROLES } from "@/lib/roles";
import LoadingScreen from "@/components/LoadingScreen";

export default function worldChoice() {
  // router makes it easier to move to different pages
  const router = useRouter();

  // These variables hold the paths to the planet images we show on screen
  const createPlanetImg = "/create_planet.png";
  const joinPlanetImg = "/join_planet.png";
  const existingWorldPlanetImg = "/existing_world_planet.png";

  // States that remember information while the user is on the page
  const [loggedIn, setLoggedIn] = useState(false); // Is the user logged in?
  const [showModal, setShowModal] = useState(false); // Should we show the "Create World" popup?
  const [newWorldName, setNewWorldName] = useState(""); // The name of the new world they type
  const [userWorlds, setUserWorlds] = useState<any[]>([]); // A list of the user's worlds
  const [showWorldsModal, setShowWorldsModal] = useState(false); // Should we show the list of worlds popup?
  const [ready, setReady] = useState(false); // Is the page done loading data?
  const [pulses, setPulses] = useState<
    { id: number; x: number; y: number; horizontal: boolean }[]
  >([]); // Just for the cool glowing lights moving in the background... TOOK FOREVER TO MAKE....

  // Make the cool glowing lights run across the background grid
  useEffect(() => {
    let id = 0;
    const interval = setInterval(() => {
      // Pick a random spot for the light to start
      const gx = Math.floor(Math.random() * (window.innerWidth / 60)) * 60;
      const gy = Math.floor(Math.random() * (window.innerHeight / 60)) * 60;

      // Decide if the light goes left/right or up/down
      const horizontal = Math.random() > 0.5;
      const pulse = { id: id++, x: gx, y: gy, horizontal };

      // Add the light to our list so it shows on screen
      setPulses((prev) => [...prev, pulse]);

      // Remove the light after 2 seconds so it doesn't stay forever
      setTimeout(
        () => setPulses((prev) => prev.filter((p) => p.id !== pulse.id)),
        2000,
      );
    }, 600); // Create a new light every 600 milliseconds

    // Stop making lights if the user leaves the page
    return () => clearInterval(interval);
  }, []);

  // Run when the page loads to check who the user is and what worlds they have
  useEffect(() => {
    async function checkUserAndWorld() {
      // Ask Supabase if someone is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setLoggedIn(!!user);

      if (user) {
        // If they are logged in, get all the worlds they created themselves
        const { data: ownedWorlds } = await supabase
          .from("World")
          .select("*")
          .eq("owner_id", user.id);

        // Then get a list of the worlds where they are just a member
        const { data: memberData, error: memberError } = await supabase
          .from("World_Members")
          .select("world_id")
          .eq("user_id", user.id);

        if (memberError) {
          console.error("Error fetching member worlds:", memberError);
        }

        console.log("Member data found:", memberData);

        let memberWorlds: any[] = [];

        // If they belong to any worlds as a member, go get the full details of those worlds
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

        // We use a Map to make sure we don't accidentally show the same world twice
        const allWorldsMap = new Map();

        // Add the worlds they own, and mark them as the "OWNER"
        ownedWorlds?.forEach((w) => {
          allWorldsMap.set(w.id, { ...w, role: ROLES.OWNER });
        });

        // Add the worlds they are a member of, and mark them as "MEMBER"
        memberWorlds.forEach((w) => {
          if (w && !allWorldsMap.has(w.id)) {
            allWorldsMap.set(w.id, { ...w, role: ROLES.MEMBER });
          }
        });

        // Save all the worlds so we can show them on the screen
        setUserWorlds(Array.from(allWorldsMap.values()));
      }

      // Tell the page we are done loading
      setReady(true);
    }

    checkUserAndWorld();
  }, []);

  // Run when the user types a name and clicks "Create World"
  async function handleCreateWorld() {
    // If they didn't type a name, do nothing
    if (!newWorldName) return;

    // Check who is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // We give every new world some default starting options.
      // The default options are stored in lib/worldDefaults.ts
      const { data, error } = await supabase
        .from("World")
        .insert({
          name: newWorldName,
          owner_id: user.id,
          attributes: DEFAULT_ATTRIBUTES,
          rarities: DEFAULT_RARITIES,
          classes: DEFAULT_CLASSES.join(","),
        })
        .select()
        .single();

      // If it worked, hide the popup, clear the name, and send them to their new world
      if (!error && data) {
        setShowModal(false);
        setNewWorldName("");
        router.push(`/worldDashboard/${data.id}`);
      } else {
        // If it failed, show an error
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
                        world.role === ROLES.OWNER
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {world.role === ROLES.OWNER ? "Owner" : "Member"}
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
