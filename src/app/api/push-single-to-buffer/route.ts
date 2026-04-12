import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { profile_id, text, scheduled_at, image_url } = await req.json();

    const params = new URLSearchParams({
      access_token: process.env.BUFFER_ACCESS_TOKEN!,
      "profile_ids[]": profile_id,
      text: text,
      scheduled_at: scheduled_at.toString(),
    });

    if (image_url) {
      params.append("media[photo]", image_url);
    }

    const bufferRes = await fetch(
      "https://api.bufferapp.com/1/updates/create.json",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      }
    );

    const bufferData = await bufferRes.json();

    if (!bufferRes.ok) {
      throw new Error(bufferData.message || "Buffer API error");
    }

    return NextResponse.json({
      success: true,
      buffer_id: bufferData.id,
    });
  } catch (err: unknown) {
    console.error("Buffer push error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Buffer push failed" },
      { status: 500 }
    );
  }
}