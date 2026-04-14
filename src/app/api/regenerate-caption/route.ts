import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { brand_id, concept, content_type, content_pillar, cta, hashtags, current_caption } = await request.json();

    const { data: brand } = await supabase
      .from("brands")
      .select("brand_name, brand_description, brand_dna")
      .eq("id", brand_id)
      .eq("user_id", user.id)
      .single();

    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

    const prompt = `You are writing Instagram captions for ${brand.brand_name}.

Brand description: ${brand.brand_description}
Brand DNA: ${JSON.stringify(brand.brand_dna)}

Write a NEW caption for this post. It must be different from the current one.

Post concept: ${concept}
Content type: ${content_type}
Content pillar: ${content_pillar}
CTA to include: ${cta}

Current caption (do NOT repeat this): ${current_caption}

Rules:
- Match the brand voice exactly
- 3-5 sentences max
- Hook on the first line
- No em dashes
- No hashtags in the caption body
- End with the CTA naturally woven in

Return only the caption text, nothing else.`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const caption = (message.content[0] as { type: string; text: string }).text.trim();
    return NextResponse.json({ caption });
  } catch (error) {
    console.error("regenerate-caption error:", error);
    return NextResponse.json({ error: "Failed to regenerate caption" }, { status: 500 });
  }
}
