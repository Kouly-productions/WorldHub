import { NextRequest, NextResponse } from "next/server";

// Check the character's name and biography to make sure they don't contain bad or offensive words.
export async function POST(req: NextRequest) {
  // First, get our secret key so we are allowed to talk to OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  try {
    // Get the name and biography the user typed
    const { name, biography } = await req.json();

    // Put them together into one piece of text to check
    const textToCheck = [name, biography].filter(Boolean).join("\n");
    
    // If they are empty, don't check anything
    if (!textToCheck.trim()) {
      return NextResponse.json({ flagged: false });
    }

    // Ask OpenAI moderation system to read the text and see if it's bad
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: textToCheck }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Moderation error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const result = data.results?.[0];

    // If OpenAI says it's bad, figure out why
    if (result?.flagged) {
      // Find out exactly which rules were broken (like hate speech or violence)
      const flaggedCategories = Object.entries(result.categories)
        .filter(([, v]) => v === true)
        .map(([k]) => k.replace(/\//g, " / "))
        .join(", ");

      // Send the error back so the user knows they can't use those words
      return NextResponse.json({
        flagged: true,
        reason: `Content flagged for: ${flaggedCategories}`,
      });
    }

    // If everything is okay, tell the app it's safe to continue
    return NextResponse.json({ flagged: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Moderation check failed" }, { status: 500 });
  }
}
