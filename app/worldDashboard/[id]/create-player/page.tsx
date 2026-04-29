"use client";

import { useParams } from "next/navigation";
import CharacterForm from "@/components/CharacterForm";

// This page shows the form for making a new Player Character
export default function CreatePlayerPage() {
  // We get the world ID from the URL so the form knows where to save the player
  const params = useParams();
  const worldId = params.id as string;

  // We use the reusable CharacterForm component
  return <CharacterForm worldId={worldId} mode="create-player" />;
}
