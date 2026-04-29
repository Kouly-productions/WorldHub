"use client";

import { useParams } from "next/navigation";
import CharacterForm from "@/components/CharacterForm";

export default function EditCharacterPage() {
  const params = useParams();
  const worldId = params.id as string;
  const characterId = params.characterId as string;

  return (
    <CharacterForm worldId={worldId} mode="edit" characterId={characterId} />
  );
}
