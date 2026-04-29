"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import LoadingScreen from "@/components/LoadingScreen";

export default function Home() {
  // router helps us move to different pages
  const router = useRouter();

  // useEffect runs this code right when the page starts up
  useEffect(() => {
    // We create a function to check if the user is already logged in
    async function checkAuth() {
      // We ask our database (Supabase) if there is a logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // If we found a user, send them to the world choice page
      if (user) {
        router.push("/worldChoice");
      } else {
        // If there is no user, send them to the login page so they can log in
        router.push("/login");
      }
    }

    // Run the check we just made
    checkAuth();
  }, [router]);

  // Show a loading screen while we wait for the check to finish
  return <LoadingScreen />;
}
