"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import LoadingScreen from "@/components/LoadingScreen";

// Profile page where the user can see their details and log out
export default function ProfilePage() {
  // router helps us move the user to another page
  const router = useRouter();

  // Rmember the logged-in user's information
  const [user, setUser] = useState<any>(null);

  // Remember if we are still checking the user's information
  const [loading, setLoading] = useState(true);

  // Run exactly once when the profile page opens
  useEffect(() => {
    // Check who is currently logged in
    async function getUser() {
      // Ask Supabase for the user details
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Save the user details and stop the loading screen
      setUser(user);
      setLoading(false);
    }

    // Run the check
    getUser();
  }, []);

  // Run when the user clicks "Log out"
  async function handleLogout() {
    // Tell Supabase to sign the user out
    await supabase.auth.signOut();

    // Send the user back to the login page and refresh
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return <LoadingScreen message="Loading profile..." />;
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center font-sans text-white p-6">
      <div className="max-w-md w-full bg-[#1a1a1a] border border-purple-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.1)]">
        <h1 className="text-3xl font-bold mb-2 bg-linear-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
          Your Profile
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
              Log out
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="mb-4">You are not logged in.</p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition-colors"
            >
              Go to login
            </Link>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <Link
            href="/worldChoice"
            className="text-white/50 hover:text-white transition-colors text-sm"
          >
            ← Back to world overview
          </Link>
        </div>
      </div>
    </div>
  );
}
