import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { brand_id } = await req.json();

    // Fetch brand from Supabase
    const { data: brand, error } = await supabase
      .from("brands")
      .select("*")
      .eq("id", brand_id)
      .single();

    if (error || !brand) throw new Error("Brand not found");

    const brandDna = brand.brand_dna;
    const today = new Date();
    const weekStart = today.toISOString().split("T")[0];

    // Create content package record immediately
    const { data: pkg, error: pkgError } = await supabase
      .from("content_packages")
      .insert({
        brand_id,
        week_start_date: weekStart,
        status: "generating",
        content_pieces: [],
        total_pieces: 0,
      })
      .select()
      .single();

    if (pkgError) throw new Error(pkgError.message);

    // Call Claude to generate the full week plan
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `You are a premium Food & Beverage Instagram content strategist. Generate a full week of Instagram content for this brand.

BRAND PROFILE:
Name: ${brand.brand_name}
Description: ${brand.brand_description}
Brand DNA: ${JSON.stringify(brandDna)}
Content Pillars: ${JSON.stringify(brand.content_pillars)}
Tone: ${brand.tone_guidelines}
Target Audience: ${JSON.stringify(brand.target_audience)}
Brand Voice: ${brand.brand_voice?.join(", ")}
Reference Accounts: ${brand.reference_accounts?.join(", ")}

CONTENT RULES FOR F&B BRANDS:
- Lead with feeling and ritual, not product features
- Athlete and community stories outperform product shots
- Captions should sound like a founder talking to a friend
- Never use: "game changer", "must-have", "self-care", "glow up"
- Never use em dashes (—) in captions, use simple punctuation instead
- Hashtags must be single words or joined words with no spaces, no # symbol included
- First caption line must hook without mentioning product name
- Sensory language wins: taste, feel, smell, texture, energy
- For brain/performance brands: lead with the outcome not the ingredient

Generate exactly 7 content pieces (mix of feed posts and stories).

Return ONLY a valid JSON array with exactly this structure for each piece:
[
  {
    "day": 1,
    "post_date": "YYYY-MM-DD",
    "content_type": "feed_post or story",
    "content_pillar": "which pillar this serves",
    "concept": "one sentence visual concept",
    "caption": "full ready-to-post caption",
    "hashtags": ["tag1", "tag2"],
    "cta": "specific call to action",
    "image_prompt": "detailed DALL-E prompt for a premium F&B lifestyle photo, no text in image, photorealistic",
    "posting_time": "HH:MM",
    "status": "pending"
  }
]

Start post_date from ${weekStart}. Space posts across the week. Best times for F&B: 7am, 12pm, 6pm.`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";
    
    // Robust JSON extraction - handles markdown fences and trailing content
    let cleaned = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Extract just the JSON array if there's extra text around it
    const arrayStart = cleaned.indexOf("[");
    const arrayEnd = cleaned.lastIndexOf("]");
    if (arrayStart !== -1 && arrayEnd !== -1) {
      cleaned = cleaned.substring(arrayStart, arrayEnd + 1);
    }

    let contentPieces;
    try {
      contentPieces = JSON.parse(cleaned);
    } catch {
      // If still failing, ask Claude again with stricter instructions
      throw new Error("Content generation failed — please try again");
    }

    // Update content package with generated pieces
    await supabase
      .from("content_packages")
      .update({
        status: "ready_for_review",
        content_pieces: contentPieces,
        total_pieces: contentPieces.length,
      })
      .eq("id", pkg.id);

    return NextResponse.json({
      package_id: pkg.id,
      content_pieces: contentPieces,
    });
  } catch (err: unknown) {
    console.error("Content generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}