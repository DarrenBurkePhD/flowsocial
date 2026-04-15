import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { image_prompt, concept, content_pillar } = await req.json();

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 50,
      messages: [{
        role: "user",
        content: `You are a stock photo search expert. Convert this Instagram post image description into a 3-5 word Pexels search query that will return relevant, positive lifestyle photography.

Image description: ${image_prompt}
Post concept: ${concept}
Content pillar: ${content_pillar}

Rules:
- Return ONLY the search query, nothing else
- Use concrete visual nouns and adjectives
- Focus on people, actions, settings — not abstract concepts
- Avoid medical, institutional, or negative imagery words
- Think: what would a lifestyle brand photographer shoot?
- Examples of good queries: "athlete training gym", "runner morning sunrise", "sports team huddle", "healthy meal prep kitchen"

Search query:`,
      }],
    });

    const query = message.content[0].type === "text"
      ? message.content[0].text.trim().replace(/^["']|["']$/g, "")
      : content_pillar;

    return NextResponse.json({ query });
  } catch (err) {
    console.error("Pexels query generation error:", err);
    return NextResponse.json({ query: null }, { status: 500 });
  }
}
