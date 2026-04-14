import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function nthSundayOfMonth(year: number, month: number, n: number): Date {
  const d = new Date(Date.UTC(year, month, 1));
  const firstSunday = (7 - d.getUTCDay()) % 7;
  return new Date(Date.UTC(year, month, 1 + firstSunday + (n - 1) * 7));
}

function getHalifaxOffset(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const year = d.getUTCFullYear();
  const dstStart = nthSundayOfMonth(year, 2, 2);
  const dstEnd = nthSundayOfMonth(year, 10, 1);
  return d >= dstStart && d < dstEnd ? "-03:00" : "-04:00";
}

function toHalifaxUTC(dateStr: string, timeStr: string): string {
  const offset = getHalifaxOffset(dateStr);
  const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return new Date(`${dateStr}T${time}${offset}`).toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { profile_id, caption, image_url, post_date, posting_time } = body;

    if (!profile_id || !caption || !post_date || !posting_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const scheduledAt = toHalifaxUTC(post_date, posting_time);
    const scheduledTimestamp = Math.floor(new Date(scheduledAt).getTime() / 1000);

    console.log("Scheduling to Buffer:", { profile_id, scheduledAt, scheduledTimestamp });

    // Build form data for Buffer REST API v1
    const params: Record<string, string> = {
      profile_ids[]: profile_id,
      text: caption,
      scheduled_at: scheduledAt,
    };

    if (image_url) {
      params["media[photo]"] = image_url;
    }

    const formBody = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

    const response = await fetch("https://api.bufferapp.com/1/updates/create.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${process.env.BUFFER_ACCESS_TOKEN}`,
      },
      body: formBody,
    });

    const data = await response.json();
    console.log("Buffer REST response:", JSON.stringify(data));

    if (!response.ok || data.error) {
      console.error("Buffer API error:", data);
      return NextResponse.json({ error: data.error || "Buffer API error", details: data }, { status: 500 });
    }

    const bufferId = data.updates?.[0]?.id || data.update?.id;
    return NextResponse.json({ success: true, buffer_id: bufferId, scheduledAt });

  } catch (error) {
    console.error("push-single-to-buffer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
