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

    // Return full Buffer response so we can see exactly what's failing
    return NextResponse.json({
      success: bufferRes.ok,
      status: bufferRes.status,
      buffer_response: bufferData,
      debug: {
        profile_id_used: profile_id,
        scheduled_at_used: scheduled_at,
        text_length: text?.length,
        has_image: !!image_url,
        has_token: !!process.env.BUFFER_ACCESS_TOKEN,
      }
    });

  } catch (err: unknown) {
    console.error("Buffer push error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Buffer push failed" },
      { status: 500 }
    );
  }
}