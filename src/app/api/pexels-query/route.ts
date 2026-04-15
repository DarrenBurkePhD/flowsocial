import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const {
      image_prompt,
      concept,
      content_pillar,
      aesthetic_direction,
      products,
      content_pillars,
      image_preferences,
    } = await req.json();

    const brandContext = [
      aesthetic_direction ? `Brand aesthetic: ${aesthetic_direction}` : "",
      products?.length ? `Products: ${products.slice(0, 3).join(", ")}` : "",
      content_pillars?.length ? `Content pillars: ${content_pillars.slice(0, 3).join(", ")}` : "",
      image_preferences?.people ? `People style: ${image_preferences.people}` : "",
      image_preferences?.finish ? `Visual finish: ${image_preferences.finish}` : "",
    ].filter(Boolean).join("\n");

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 60,
      messages: [{
        role: "user",
        content: `You are a stock photo search expert for a consumer product brand. Convert this Instagram post image description into a 3-5 word Pexels search query that will return visually relevant, on-brand lifestyle photography.

BRAND CONTEXT:
${brandContext}

POST DETAILS:
Image description: ${image_prompt}
Post concept: ${concept}
Content pillar: ${content_pillar}

RULES:
- Return ONLY the search query, nothing else, no punctuation
- Use concrete visual nouns and action words specific to this brand's world
- Match the brand aesthetic and the specific sport/lifestyle context
- Prioritize the type of people, setting, and mood that fits this brand
- Avoid generic fitness cliches unless they match the brand aesthetic
- Never return abstract or negative imagery words
- Think: what would THIS brand's photographer specifically shoot for this post?

Search query:`,
      }],
    });

    const query = message.content[0].type === "text"
      ? message.content[0].text.trim().replace(/^["'`]|["'`]$/g, "").toLowerCase()
      : content_pillar;

    return NextResponse.json({ query });
  } catch (err) {
    console.error("Pexels query generation error:", err);
    return NextResponse.json({ query: null }, { status: 500 });
  }
}
