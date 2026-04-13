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
      brand_name, brand_description, website_url,
      age_range, gender, psychographics,
      brand_voice, buffer_profile_id,
    } = body;

    let websiteContent = "";
    if (website_url) {
      websiteContent = await scrapeWebsite(website_url);
    }

    const websiteSection = websiteContent
      ? `\nWebsite content scraped from ${website_url}:\n${websiteContent}\n`
      : `\nWebsite: ${website_url} (could not be scraped)\n`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `You are a premium brand strategist specializing in consumer product brands, food and beverage, sports nutrition, and wellness. Your job is to deeply analyze this brand and produce a detailed brand DNA document that will guide Instagram content creation for the next 12 months.

BRAND INFORMATION:
Brand name: ${brand_name}
Founder description: ${brand_description}
Target audience: ${age_range}, ${gender}
Customer psychographics: ${psychographics.join(", ")}
Brand voice: ${brand_voice.join(", ")}
${websiteSection}

Using ALL of the above especially the scraped website content, identify:
- The actual products and what makes them unique
- The real brand language and tone from the website copy
- The specific customer problems being solved
- The brand values and mission

Then return ONLY a valid JSON object with exactly these keys:
{
  "brand_dna": "2-3 sentences capturing the brand essence, specific to their actual products and mission",
  "products": ["specific product 1", "specific product 2", "specific product 3"],
  "content_pillars": ["pillar 1", "pillar 2", "pillar 3", "pillar 4", "pillar 5"],
  "tone_guidelines": "2-3 sentences on how to write captions for this brand. Be specific about sentence length, vocabulary, and emotional register.",
  "aesthetic_direction": "2-3 sentences describing the visual world of this brand. Include lighting, color palette, subject matter, and mood. Be specific enough to guide AI image generation.",
  "image_style": "One paragraph describing the exact photography style for this brand. Include: setting, lighting, color grading, subject, mood, and what to avoid.",
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
- Products must be real products found on their website, not invented ones
- image_style must be detailed enough to produce consistent, realistic lifestyle photography via DALL-E`,
      }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const brandAnalysis = JSON.parse(cleanedResponse);

    const { data: brand, error } = await supabaseAdmin
      .from("brands")
      .insert({
        user_id: user.id,
        brand_name, brand_description, website_url,
        target_audience: { age_range, gender, psychographics },
        brand_voice,
        reference_accounts: [],
        brand_dna: brandAnalysis,
        content_pillars: brandAnalysis.content_pillars,
        tone_guidelines: brandAnalysis.tone_guidelines,
        hashtag_strategy: brandAnalysis.hashtag_strategy,
        buffer_profile_id: buffer_profile_id || null,
        onboarding_complete: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ brand_id: brand.id });

  } catch (err: unknown) {
    console.error("Onboarding error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
