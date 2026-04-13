import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

type ImageSize = "1024x1024" | "1792x1024" | "1024x1792";

export async function POST(req: NextRequest) {
  try {
    const { image_prompt, content_type, image_style } = await req.json();

    const size: ImageSize = content_type === "story" ? "1024x1792" : "1024x1024";

    const styleGuide = image_style
      ? `Photography style: ${image_style}`
      : "Premium lifestyle photography. Clean, editorial, high-end consumer brand aesthetic. Natural lighting. Real people or products, not illustrated.";

    const fullPrompt = `${image_prompt}. ${styleGuide}. No text overlays, no words, no labels, no logos in the image. Photorealistic, not illustrated or artistic. Shot on high-end camera. Instagram-ready.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: fullPrompt,
      n: 1,
      size,
      quality: "standard",
    });

    const tempUrl = response.data?.[0]?.url;
    if (!tempUrl) throw new Error("No image URL returned from DALL-E");

    const imageRes = await fetch(tempUrl);
    if (!imageRes.ok) throw new Error("Failed to download image from DALL-E");
    const imageBuffer = await imageRes.arrayBuffer();

    const filename = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filename, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) throw new Error(`Supabase upload failed: ${uploadError.message}`);

    const { data: publicUrlData } = supabase.storage
      .from("media")
      .getPublicUrl(filename);

    return NextResponse.json({ image_url: publicUrlData.publicUrl });

  } catch (err: unknown) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 500 }
    );
  }
}
