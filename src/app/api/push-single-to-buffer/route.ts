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

    const dueAt = toHalifaxUTC(post_date, posting_time);
    console.log("Scheduling to Buffer:", { profile_id, dueAt });

    // Use inline query with enum values (not variables) to avoid type issues
    const imageAssets = image_url
      ? `assets: { images: [{ url: "${image_url}" }] }`
      : "";

    const query = `
      mutation {
        createPost(input: {
          channelId: "${profile_id}",
          text: ${JSON.stringify(caption)},
          schedulingType: automatic,
          mode: customScheduled,
          dueAt: "${dueAt}"
          ${imageAssets}
        }) {
          ... on PostActionSuccess {
            post { id dueAt }
          }
          ... on MutationError {
            message
          }
        }
      }
    `;

    console.log("Query preview:", query.substring(0, 300));

    const response = await fetch("https://api.buffer.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.BUFFER_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query }),
    });

    console.log("Buffer HTTP status:", response.status, response.statusText);

    const text = await response.text();
    console.log("Buffer raw response:", text.substring(0, 500));

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Buffer returned non-JSON", body: text }, { status: 500 });
    }

    if (data.errors) {
      console.error("Buffer errors:", JSON.stringify(data.errors));
      return NextResponse.json({ error: "Buffer API error", details: data.errors }, { status: 500 });
    }

    const result = data.data?.createPost;
    if (result?.message) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    const post = result?.post;
    console.log("Scheduled successfully:", JSON.stringify(post));
    return NextResponse.json({ success: true, buffer_id: post?.id, dueAt });

  } catch (error) {
    console.error("push-single-to-buffer error:", String(error));
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
