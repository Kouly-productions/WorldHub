"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import LoadingScreen from "@/components/LoadingScreen";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.push("/worldChoice");
      } else {
        router.push("/login");
      }
    }

    checkAuth();
  }, [router]);

  return <LoadingScreen />;
}
