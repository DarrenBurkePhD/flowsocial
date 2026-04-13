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

    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", brand_id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const brandDna = brand.brand_dna || {};
    const imageStyle = brandDna.image_style || "";
    const products = brandDna.products || [];
    const contentPillars = brand.content_pillars || [];
    const toneGuidelines = brand.tone_guidelines || "";
    const hashtagStrategy = brand.hashtag_strategy || {};
    const ctaLibrary = brandDna.cta_library || [];
    const targetAudience = brand.target_audience || {};

    const today = new Date();
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d.toISOString().split("T")[0];
    });

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 6000,
      messages: [{
        role: "user",
        content: `You are a world-class Instagram content strategist for consumer product brands. Create 7 days of Instagram content for this brand.

BRAND: ${brand.brand_name}
BRAND DNA: ${brandDna.brand_dna || brand.brand_description}
PRODUCTS: ${products.join(", ")}
TARGET AUDIENCE: ${targetAudience.age_range}, ${targetAudience.gender}, ${targetAudience.psychographics?.join(", ")}
CONTENT PILLARS: ${contentPillars.join(", ")}
TONE GUIDELINES: ${toneGuidelines}
IMAGE STYLE: ${imageStyle}
HASHTAG STRATEGY: ${JSON.stringify(hashtagStrategy)}
CTA LIBRARY: ${ctaLibrary.join(", ")}

WEEK DATES: ${weekDates.join(", ")}

Create exactly 7 posts, one for each date above. Each post must use a different content pillar and content type.

CRITICAL IMAGE PROMPT RULES:
- Never include supplement bottles, product packaging, branded containers, or generic product shots in image prompts
- All image prompts must be lifestyle, environmental, athletic, or human-focused
- Think: athletes training, hands gripping equipment, locker rooms, early morning routines, recovery moments, nature, texture, emotion
- The brand's products should NEVER appear in the generated images

CAPTION RULES:
- Short punchy sentences. Maximum 3-4 sentences for the main caption.
- No em dashes anywhere
- Write like a human founder, not a marketing team
- Be specific to the brand and audience, never generic

Return ONLY a valid JSON array of exactly 7 objects with this structure:
[
  {
    "day": 1,
    "post_date": "${weekDates[0]}",
    "content_type": "feed_post",
    "content_pillar": "pillar name",
    "concept": "one sentence describing the post concept",
    "caption": "the full caption text",
    "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
    "cta": "single call to action sentence",
    "image_prompt": "detailed lifestyle photography prompt with NO product packaging or bottles",
    "posting_time": "09:00"
  }
]

Vary posting times across the week. Use a mix of: feed_post, story, carousel. Day 1 date must be ${weekDates[0]}, day 2 must be ${weekDates[1]}, etc.`,
      }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const contentPieces = JSON.parse(cleanedResponse);

    const { data: contentPackage, error: packageError } = await supabase
      .from("content_packages")
      .insert({
        brand_id,
        week_start_date: weekDates[0],
        status: "ready_for_review",
        content_pieces: contentPieces,
        total_pieces: 7,
        approved_count: 0,
      })
      .select()
      .single();

    if (packageError) throw new Error(packageError.message);

    return NextResponse.json({
      package_id: contentPackage.id,
      content_pieces: contentPieces,
    });

  } catch (err: unknown) {
    console.error("Content generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Content generation failed" },
      { status: 500 }
    );
  }
}
