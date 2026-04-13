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
    const { image_prompt, content_type } = await req.json();

    const size: ImageSize = content_type === "story" ? "1024x1792" : "1024x1024";

    // Step 1: Generate image with DALL-E
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `${image_prompt}. Premium lifestyle photography style. No text, no words, no labels in the image. Clean, editorial, high-end F&B brand aesthetic.`,
      n: 1,
      size: size,
      quality: "standard",
    });

    const tempUrl = response.data?.[0]?.url;
    if (!tempUrl) throw new Error("No image URL returned from DALL-E");

    // Step 2: Download the image
    const imageRes = await fetch(tempUrl);
    if (!imageRes.ok) throw new Error("Failed to download image from DALL-E");
    const imageBuffer = await imageRes.arrayBuffer();

    // Step 3: Upload to Supabase Storage
    const filename = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filename, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) throw new Error(`Supabase upload failed: ${uploadError.message}`);

    // Step 4: Get permanent public URL
    const { data: publicUrlData } = supabase.storage
      .from("media")
      .getPublicUrl(filename);

    const permanentUrl = publicUrlData.publicUrl;
    if (!permanentUrl) throw new Error("Failed to get public URL from Supabase");

    return NextResponse.json({ image_url: permanentUrl });

  } catch (err: unknown) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 500 }
    );
  }
}