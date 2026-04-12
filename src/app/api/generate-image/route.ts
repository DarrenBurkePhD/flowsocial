import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type ImageSize = "1024x1024" | "1792x1024" | "1024x1792";

export async function POST(req: NextRequest) {
  try {
    const { image_prompt, content_type } = await req.json();

    const size: ImageSize = content_type === "story" ? "1024x1792" : "1024x1024";

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `${image_prompt}. Premium lifestyle photography style. No text, no words, no labels in the image. Clean, editorial, high-end F&B brand aesthetic.`,
      n: 1,
      size: size,
      quality: "standard",
    });

    const items = response.data;
    const url = items && items.length > 0 ? items[0]?.url : null;

    if (!url) {
      throw new Error("No image URL returned from DALL-E");
    }

    return NextResponse.json({ image_url: url });

  } catch (err: unknown) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 500 }
    );
  }
}