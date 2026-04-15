"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    router.push("/worldChoice");
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-background font-sans overflow-hidden">
      <form
        onSubmit={handleLogin}
        className="flex h-[70vh] w-[25vw] flex-col justify-between border-2 border-purple-400/20 rounded-[20px] bg-purple-700/50 shadow-[0_0_60px_10px_rgba(208,54,255,0.3)] backdrop-blur-sm p-8"
      >
        {/* Top section */}
        <div className="flex flex-col gap-2 text-center">
          <h1>Log in to account</h1>
          <p className="text-white/70 text-sm">
            Log-in to create a world, or go in as a guest to view what your
            friends have made.
          </p>
        </div>

        {/* Input Section */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-1">
            <label className="text-white/50 text-xs ml-1 uppercase font-bold tracking-wider">
              E-mail
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 bg-white/10 border border-purple-400/30 rounded-lg px-4 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-white/50 text-xs ml-1 uppercase font-bold tracking-wider">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-12 bg-white/10 border border-purple-400/30 rounded-lg px-4 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>
        </div>

        {/* Error message */}
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-button/80 rounded-[5px] hover:bg-purple-400 cursor-pointer text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <Link
            href="/createAccount"
            className="w-full h-12 border border-purple-400/30 rounded-[5px] hover:bg-white/10 cursor-pointer text-white/80 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
          >
            Create Account
          </Link>
        </div>
      </form>
    </div>
  );
}
