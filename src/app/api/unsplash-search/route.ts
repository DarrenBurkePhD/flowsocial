// src/app/api/unsplash-search/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "lifestyle photography";
  const count = Math.min(parseInt(searchParams.get("count") || "10"), 30);

  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
  if (!PEXELS_API_KEY) {
    return NextResponse.json({ photos: [] });
  }

  try {
    const params = new URLSearchParams({
      query,
      per_page: String(count),
      orientation: "square",
    });

    const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!res.ok) {
      console.error("Pexels error:", res.status);
      return NextResponse.json({ photos: [] });
    }

    const data = await res.json();
    const photos = (data.photos || []).map((photo: any) => ({
      url: photo.src.large,
      thumb: photo.src.small,
      id: photo.id,
    }));

    return NextResponse.json({ photos });
  } catch (err) {
    console.error("Pexels fetch failed:", err);
    return NextResponse.json({ photos: [] });
  }
}
