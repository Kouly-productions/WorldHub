"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  // Vi opretter state-variabler til at holde styr på hvad brugeren skriver ✍️
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); // Forhindrer siden i at genindlæse
    setLoading(true);
    setMessage(null);

    try {
      // Trin 1: Opret brugeren i Supabase Auth 🔐
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Trin 2: Gem brugernavnet i vores 'Profiles' tabel 📊
        // Vi bruger brugerens unikke ID fra Auth-delen som ID i Profiles
        const { error: profileError } = await supabase.from("Profiles").insert([
          {
            id: authData.user.id, // Her kobler vi de to ting sammen
            username: username,
            email: email,
          },
        ]);

        if (profileError) throw profileError;

        setMessage({
          type: "success",
          text: "User created successfully!",
        });
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Der skete en fejl under oprettelsen. ❌",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-background font-sans overflow-hidden">
      <form
        onSubmit={handleSignUp}
        className="flex h-[75vh] min-h-[550px] w-[90vw] md:w-[25vw] flex-col justify-between border-2 border-purple-400/20 rounded-[20px] bg-purple-700/50 shadow-[0_0_60px_10px_rgba(208,54,255,0.3)] backdrop-blur-sm p-8"
      >
        {/* Top sektion */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold text-white">Create an account</h1>
          <p className="text-white/70 text-sm">
            Create an account to start creating your own world.
          </p>
        </div>

        {/* Feedback besked */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm text-center ${message.type === "success" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}
          >
            {message.text}
          </div>
        )}

        {/* Input Section */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-1">
            <label className="text-white/50 text-xs ml-1 uppercase font-bold tracking-wider">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full h-12 bg-white/10 border border-purple-400/30 rounded-lg px-4 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-white/50 text-xs ml-1 uppercase font-bold tracking-wider">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full h-12 bg-white/10 border border-purple-400/30 rounded-lg px-4 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-white/50 text-xs ml-1 uppercase font-bold tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-12 bg-white/10 border border-purple-400/30 rounded-lg px-4 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-purple-600/80 rounded-[5px] hover:bg-purple-500 cursor-pointer text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

          <Link
            href="/login"
            className="w-full h-12 border border-purple-400/30 rounded-[5px] hover:bg-white/10 cursor-pointer text-white/80 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
          >
            Already have an account? Login
          </Link>
        </div>
      </form>
    </div>
  );
}
