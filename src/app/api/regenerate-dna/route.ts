import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function scrapeWebsite(url: string): Promise<string> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://flowsocial.ai"}/api/scrape-website`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    return data.content || "";
  } catch {
    return "";
  }
}

function buildImageStylePrompt(color: string, people: string, finish: string): string {
  const colorMap: Record<string, string> = {
    full_color: "vibrant, true-to-life full color photography",
    muted_film: "muted, slightly faded film photography with soft tones and grain",
    black_white: "black and white photography with strong contrast",
    warm_golden: "warm golden-hour tones, rich amber and honey hues",
    dark_dramatic: "dark and dramatic lighting, deep shadows, high contrast moody tones",
  };
  const peopleMap: Record<string, string> = {
    no_people: "no people — product and lifestyle objects only, no human figures",
    athletes: "featuring athletes and active people in training or sport environments",
    lifestyle_people: "featuring real people in everyday lifestyle moments",
    mix: "alternating between product-focused shots and lifestyle shots with people",
  };
  const finishMap: Record<string, string> = {
    clean_clinical: "clean clinical aesthetic, sharp focus, precise composition",
    bright_airy: "bright and airy feel, lots of negative space, light and optimistic mood",
    gritty_raw: "gritty and raw, unpolished, authentic, documentary-style",
    luxury_refined: "luxury and refined, aspirational, premium materials",
    natural_organic: "natural and organic, earthy textures, wholesome and grounded",
  };
  return `${colorMap[color] || colorMap.full_color}. ${peopleMap[people] || peopleMap.mix}. ${finishMap[finish] || finishMap.clean_clinical}.`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const {
      brand_id, brand_name, brand_description, website_url,
      age_range, gender, psychographics, brand_voice,
      image_color, image_people, image_finish,
    } = body;

    const { data: existing } = await supabaseAdmin
      .from("brands")
      .select("id")
      .eq("id", brand_id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    let websiteContent = "";
    if (website_url) {
      websiteContent = await scrapeWebsite(website_url);
    }

    const websiteSection = websiteContent
      ? `\nWebsite content scraped from ${website_url}:\n${websiteContent}\n`
      : `\nWebsite: ${website_url} (could not be scraped)\n`;

    const imageStylePrompt = buildImageStylePrompt(
      image_color || "full_color",
      image_people || "mix",
      image_finish || "clean_clinical"
    );

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `You are a premium brand strategist. Analyze this brand and produce a brand DNA document for Instagram content creation.

Brand name: ${brand_name}
Description: ${brand_description}
Audience: ${age_range}, ${gender}, ${psychographics?.join(", ")}
Brand voice: ${brand_voice?.join(", ")}
Image style: ${imageStylePrompt}
${websiteSection}

Return ONLY valid JSON:
{
  "brand_dna": "2-3 sentence brand essence",
  "products": ["product 1", "product 2", "product 3"],
  "content_pillars": ["pillar 1", "pillar 2", "pillar 3", "pillar 4", "pillar 5"],
  "tone_guidelines": "2-3 sentences on caption writing style",
  "aesthetic_direction": "2-3 sentences on visual direction",
  "image_style": "Detailed DALL-E photography direction incorporating: ${imageStylePrompt}",
  "hashtag_strategy": { "niche": ["tag1","tag2","tag3","tag4","tag5"], "mid": ["tag1","tag2","tag3","tag4","tag5"], "broad": ["tag1","tag2","tag3"] },
  "cta_library": ["cta 1", "cta 2", "cta 3", "cta 4", "cta 5"]
}
Rules: No em dashes. Be specific to this brand.`,
      }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const brandAnalysis = JSON.parse(cleanedResponse);
    const imagePreferences = { color: image_color, people: image_people, finish: image_finish };

    const { error } = await supabaseAdmin
      .from("brands")
      .update({
        brand_dna: { ...brandAnalysis, image_preferences: imagePreferences },
        content_pillars: brandAnalysis.content_pillars,
        tone_guidelines: brandAnalysis.tone_guidelines,
        hashtag_strategy: brandAnalysis.hashtag_strategy,
      })
      .eq("id", brand_id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    console.error("Regenerate DNA error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
