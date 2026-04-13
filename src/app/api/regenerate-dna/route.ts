import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabaseAdmin = createClient(
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
    clean_clinical: "clean clinical aesthetic, sharp focus, precise composition, scientific precision",
    bright_airy: "bright and airy feel, lots of negative space, light and optimistic mood",
    gritty_raw: "gritty and raw, unpolished, authentic, documentary-style",
    luxury_refined: "luxury and refined, aspirational, premium materials and surfaces",
    natural_organic: "natural and organic, earthy textures, wholesome and grounded",
  };
  return `${colorMap[color] || colorMap.full_color}. ${peopleMap[people] || peopleMap.mix}. ${finishMap[finish] || finishMap.clean_clinical}.`;
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const {
      brand_id,
      brand_name,
      brand_description,
      website_url,
      age_range,
      gender,
      psychographics,
      brand_voice,
      image_color,
      image_people,
      image_finish,
    } = body;

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from("brands")
      .select("id")
      .eq("id", brand_id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Scrape website
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
        content: `You are a premium brand strategist specializing in consumer product brands, food and beverage, sports nutrition, and wellness. Analyze this brand and produce a detailed brand DNA document that will guide Instagram content creation.

BRAND INFORMATION:
Brand name: ${brand_name}
Founder description: ${brand_description}
Target audience: ${age_range}, ${gender}
Customer psychographics: ${psychographics?.join(", ")}
Brand voice: ${brand_voice?.join(", ")}
Image style preferences: ${imageStylePrompt}
${websiteSection}

Return ONLY a valid JSON object with exactly these keys:
{
  "brand_dna": "2-3 sentences capturing the brand essence, specific to their actual products and mission",
  "products": ["specific product 1", "specific product 2", "specific product 3"],
  "content_pillars": ["pillar 1", "pillar 2", "pillar 3", "pillar 4", "pillar 5"],
  "tone_guidelines": "2-3 sentences on how to write captions for this brand. Be specific about sentence length, vocabulary, and emotional register.",
  "aesthetic_direction": "2-3 sentences describing the visual world of this brand.",
  "image_style": "Detailed photography direction for DALL-E incorporating these style preferences: ${imageStylePrompt} -- Describe setting, lighting, color grading, subject, mood.",
  "hashtag_strategy": {
    "niche": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "mid": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "broad": ["tag1", "tag2", "tag3"]
  },
  "cta_library": ["cta 1", "cta 2", "cta 3", "cta 4", "cta 5"]
}

Rules:
- No em dashes anywhere in the output
- Be hyper-specific to this brand. No generic marketing language.
- Products must be real products found on their website
- image_style must incorporate the founder's specific style preferences`,
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
