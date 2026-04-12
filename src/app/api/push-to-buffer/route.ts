import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { package_id, profile_id } = await req.json();

    // Fetch content package
    const { data: pkg, error } = await supabase
      .from("content_packages")
      .select("*")
      .eq("id", package_id)
      .single();

    if (error || !pkg) throw new Error("Content package not found");

    const pieces = pkg.content_pieces as Array<{
      status: string;
      caption: string;
      hashtags: string[];
      cta: string;
      image_url?: string;
      post_date: string;
      posting_time: string;
      content_type: string;
    }>;

    const approved = pieces.filter((p) => p.status === "approved");

    if (approved.length === 0) {
      return NextResponse.json({ error: "No approved content to push" }, { status: 400 });
    }

    const results = [];
    const failures = [];

    for (const piece of approved) {
      try {
        // Build the full caption with hashtags and CTA
        const fullCaption = `${piece.caption}\n\n${piece.cta}\n\n${piece.hashtags.map((h) => `#${h.replace("#", "")}`).join(" ")}`;

        // Schedule datetime
        const scheduledAt = new Date(`${piece.post_date}T${piece.posting_time}:00`);
        const scheduledTimestamp = Math.floor(scheduledAt.getTime() / 1000);

        // Push to Buffer
        const bufferRes = await fetch(
          "https://api.bufferapp.com/1/updates/create.json",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              access_token: process.env.BUFFER_ACCESS_TOKEN!,
              profile_ids: profile_id,
              text: fullCaption,
              scheduled_at: scheduledTimestamp.toString(),
              ...(piece.image_url ? { media: JSON.stringify({ photo: piece.image_url }) } : {}),
            }),
          }
        );

        const bufferData = await bufferRes.json();

        if (!bufferRes.ok) throw new Error(bufferData.message || "Buffer error");

        results.push({ post_date: piece.post_date, buffer_id: bufferData.id });
      } catch (err) {
        failures.push({
          post_date: piece.post_date,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // Update package status in Supabase
    await supabase
      .from("content_packages")
      .update({ status: failures.length === 0 ? "scheduled" : "partial" })
      .eq("id", package_id);

    return NextResponse.json({
      pushed: results.length,
      failed: failures.length,
      results,
      failures,
    });
  } catch (err: unknown) {
    console.error("Buffer push error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}