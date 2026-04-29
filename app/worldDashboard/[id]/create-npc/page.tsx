"use client";

import { useParams } from "next/navigation";
import CharacterForm from "@/components/CharacterForm";

export default function CreateNPCPage() {
  const params = useParams();
  const worldId = params.id as string;

  return <CharacterForm worldId={worldId} mode="create-npc" />;
}
