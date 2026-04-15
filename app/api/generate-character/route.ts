import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a fantasy RPG character generator. Given a user prompt, generate a character and return ONLY valid JSON with these exact fields:
{
  "name": "string",
  "biography": "string (2-4 sentences)",
  "class": "one of: Warrior, Mage, Rogue, Cleric, Ranger, Paladin, Bard, Necromancer, Druid, Monk",
  "gender": "one of: Male, Female, Unknown, Other",
  "age": number,
  "level": number (1-100),
  "health": number,
  "full_health": number (same or higher than health),
  "rarity": "one of: Common, Uncommon, Rare, Epic, Legendary",
  "relationship_status": "one of: Single, In relationship, Engaged, Married",
  "strength": number (1-30),
  "dexterity": number (1-30),
  "constitution": number (1-30),
  "intelligence": number (1-30),
  "wisdom": number (1-30),
  "charisma": number (1-30)
}
Return ONLY the JSON object, no markdown, no extra text.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `OpenAI error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const character = JSON.parse(content);
    return NextResponse.json(character);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
