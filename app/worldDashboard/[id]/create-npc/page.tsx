"use client";

import { useParams } from "next/navigation";
import CharacterForm from "@/components/CharacterForm";

// Page shows the form for making a new Non Player Character (NPC)
export default function CreateNPCPage() {
  // Get the world ID from the URL so the form knows where to save the NPC
  const params = useParams();
  const worldId = params.id as string;

  // Use the reusable CharacterForm component
  return <CharacterForm worldId={worldId} mode="create-npc" />;
}
