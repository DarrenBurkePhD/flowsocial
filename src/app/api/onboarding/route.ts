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
      brand_voice, reference_accounts, buffer_profile_id,
    } = body;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `You are a premium Food & Beverage brand strategist specializing in sports nutrition and wellness brands. Analyze this brand and produce a structured brand DNA document that will guide Instagram content creation.
Brand name: ${brand_name}
Description: ${brand_description}
Website: ${website_url}
Target audience: ${age_range}, ${gender}, interests: ${psychographics.join(", ")}
Brand voice: ${brand_voice.join(", ")}
Reference Instagram accounts: ${reference_accounts.filter(Boolean).join(", ")}
Return ONLY a valid JSON object with exactly these keys:
{
  "brand_dna": "2-3 sentence brand essence statement",
  "content_pillars": ["pillar 1", "pillar 2", "pillar 3", "pillar 4", "pillar 5"],
  "tone_guidelines": "2-3 sentences on how to write for this brand",
  "aesthetic_direction": "2-3 sentences on visual style and mood",
  "hashtag_strategy": {
    "niche": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "mid": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "broad": ["tag1", "tag2", "tag3"]
  },
  "cta_library": ["cta 1", "cta 2", "cta 3", "cta 4", "cta 5"]
}
Rules: No em dashes in any text. Be specific to this brand. No generic marketing language.`,
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
        reference_accounts: reference_accounts.filter(Boolean),
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
