"use client";

import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);

  const sendTestData = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("Profiles")
        .insert([
          {
            username: "Hello World User",
            email: "test@worldhub.dk",
          },
        ])
        .select();

      if (error) throw error;

      alert("Success!");
    } catch (error: any) {
      alert("Fejl: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-background font-sans overflow-hidden">
      <button
        onClick={sendTestData}
        disabled={loading}
        className="w-64 h-12 border border-purple-400/30 rounded-[5px] hover:bg-white/10 cursor-pointer text-white/80 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? "Sender data..." : 'Send test Data "Hello World"'}
      </button>
    </div>
  );
}
