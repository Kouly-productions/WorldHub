"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login"); // Send brugeren til login efter logout
    router.refresh(); // Genindlæs siden for at opdatere auth state
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center text-white">
        Loader...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center font-sans text-white p-6">
      <div className="max-w-md w-full bg-[#1a1a1a] border border-purple-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.1)]">
        <h1 className="text-3xl font-bold mb-2 bg-linear-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
          Din Profil
        </h1>

        {user ? (
          <div className="space-y-6">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <p className="text-sm text-white/50 mb-1">Email</p>
              <p className="font-mono">{user.email}</p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 font-bold rounded-lg transition-all"
            >
              Log ud
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="mb-4">Du er ikke logget ind.</p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition-colors"
            >
              Gå til login
            </Link>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <Link
            href="/worldChoice"
            className="text-white/50 hover:text-white transition-colors text-sm"
          >
            ← Tilbage til verdensoversigt
          </Link>
        </div>
      </div>
    </div>
  );
}
