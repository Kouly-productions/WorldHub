import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_ATTRIBUTES } from "@/lib/worldDefaults";

// The shape we expect from clients when they pass in custom world attributes.
// Each attribute has a stable id (used as the JSON key in the response), a
// human readable name (shown to the AI so it can match concepts), and a max
// value the AI must not exceed.
type AttributeSpec = { id: string; name: string; max: number };

// We strip color from the shared defaults since the AI doesn't care about it.
const DEFAULT_ATTRIBUTE_SPECS: AttributeSpec[] = DEFAULT_ATTRIBUTES.map((a) => ({
  id: a.id,
  name: a.name,
  max: a.max,
}));

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 },
    );
  }

  try {
    const { prompt, attributes } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    // Sanitize the attributes coming from the client. If nothing was passed
    // (or it was malformed) fall back to the default 6 D&D-style stats.
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

    // Build a JSON snippet describing each attribute the AI must populate.
    // We include the max value so the AI knows what range to use, some
    // worlds might cap stats at 10, or go up to 100.
    const attributeFields = attrSpecs
      .map(
        (a) =>
          `    "${a.id}": number (1-${a.max}, represents the character's "${a.name}")`,
      )
      .join(",\n");

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
            content: prompt,
          },
        ],
        temperature: 0.9,
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const character = JSON.parse(content);
    return NextResponse.json(character);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
