// Server-side memo generation. The API key never touches the client.
// Docs: https://docs.claude.com/en/api/overview
import { NextResponse } from "next/server";

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI personalization is not configured." },
      { status: 503 }
    );
  }

  const profile = await request.json();

  const prompt = `You are the diagnostic engine inside TUNNL ("The Tunnel"), a strategy operating system for builders, creators, and community leaders. The core metaphor: focus is a tunnel — the engine tells the user where to point it. Voice: blunt, staccato, second person, street-economics register. No fluff, no hedging, no emojis.

User profile:
${JSON.stringify(profile, null, 2)}

Scores are calibrated 0-92 per module. A score of 92 is the ceiling; 75+ means Holding, 55-74 Exposed, 35-54 Gap, and under 35 Critical. Most operators land in the 40s and 50s. Treat anything under 55 as a live problem worth naming.

Two fields matter most:
- twelve_month_destination: their declared win condition. Aim every priority and action at it. If it is "undefined destination", name that as the first problem — a tunnel with no exit is a hole.
- self_diagnosed_blocker: what THEY believe is holding them back. Compare it against the actual weakest modules. If belief and data diverge, open the verdict with the confrontation (e.g. "You said discipline. The board says distribution."). If they align, confirm it and sharpen it. If "Honestly, not sure", tell them plainly what it is.

Respond with ONLY valid JSON, no markdown fences, no preamble, exactly this shape:
{
  "verdict": "one blunt sentence naming their core imbalance",
  "memo": ["4 short blunt diagnosis lines, each a standalone observation about their position"],
  "priorities": [
    {"module": "one of: leverage|systems|strategy|building|ownership|network|economy|focus|forces", "diagnosis": "1-2 blunt sentences on why this is the gap", "actions": ["3 concrete next actions, each starting with a verb, each doable within 14 days and aimed at their stated destination"]}
  ],
  "risks": ["2 hidden risks or bottlenecks they likely can't see, specific to this profile"]
}
Priorities must be exactly the 3 modules with the lowest scores, ordered weakest first. Keep total response under 700 tokens.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const memo = JSON.parse(text.replace(/```json|```/g, "").trim());
    return NextResponse.json(memo);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
