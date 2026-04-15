import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  try {
    const { name, biography } = await req.json();

    const textToCheck = [name, biography].filter(Boolean).join("\n");
    if (!textToCheck.trim()) {
      return NextResponse.json({ flagged: false });
    }

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

    if (result?.flagged) {
      const flaggedCategories = Object.entries(result.categories)
        .filter(([, v]) => v === true)
        .map(([k]) => k.replace(/\//g, " / "))
        .join(", ");

      return NextResponse.json({
        flagged: true,
        reason: `Content flagged for: ${flaggedCategories}`,
      });
    }

    return NextResponse.json({ flagged: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Moderation check failed" }, { status: 500 });
  }
}
