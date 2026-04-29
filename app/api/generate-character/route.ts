import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_ATTRIBUTES } from "@/lib/worldDefaults";

//  the app what an "attribute" (like Strength or Speed) looks like.
type AttributeSpec = { id: string; name: string; max: number };

// We take the default attributes but remove the color, because the AI doesn't need to know the colors to make a character.
const DEFAULT_ATTRIBUTE_SPECS: AttributeSpec[] = DEFAULT_ATTRIBUTES.map((a) => ({
  id: a.id,
  name: a.name,
  max: a.max,
}));

// Run when our app asks the AI to create a character
export async function POST(req: NextRequest) {
  // First, get our secret key to talk to OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 },
    );
  }

  try {
    // Read what the user typed in the prompt box
    const { prompt, attributes } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    // Clean up the attributes (stats) got from the world settings.
    // If there are none, just use the default ones (Strength, Agility, etc.)
    const attrSpecs: AttributeSpec[] = (() => {
      if (!Array.isArray(attributes) || attributes.length === 0) {
        return DEFAULT_ATTRIBUTE_SPECS;
      }
      const cleaned = attributes
        .filter(
          (a: any) =>
            a && typeof a.id === "string" && typeof a.name === "string",
        )
        .map((a: any) => ({
          id: a.id.trim(),
          name: a.name.trim(),
          max:
            typeof a.max === "number" && a.max > 0
              ? Math.min(999, Math.floor(a.max))
              : 30,
        }));
      return cleaned.length > 0 ? cleaned : DEFAULT_ATTRIBUTE_SPECS;
    })();

    // Make a list of all the stats the AI needs to come up with numbers for
    const attributeFields = attrSpecs
      .map(
        (a) =>
          `    "${a.id}": number (1-${a.max}, represents the character's "${a.name}")`,
      )
      .join(",\n");

    // Now send the request to the OpenAI AI
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
  "attribute_values": {
${attributeFields}
  }
}
Return ONLY the JSON object, no markdown, no extra text. The attribute_values object must contain ALL the listed attribute keys with values clamped to the given range.`,
          },
          {
            role: "user",
            content: prompt, // What the user typed
          },
        ],
        temperature: 0.9, // This makes the AI a bit more creative/random
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `OpenAI error: ${err}` },
        { status: 500 },
      );
    }

    // Read the answer from the AI
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Turn the text the AI sent back into an object
    const character = JSON.parse(content);
    return NextResponse.json(character);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
