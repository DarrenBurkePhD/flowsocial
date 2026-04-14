import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function nthSundayOfMonth(year: number, month: number, n: number): Date {
  const d = new Date(Date.UTC(year, month, 1));
  const firstSunday = (7 - d.getUTCDay()) % 7;
  return new Date(Date.UTC(year, month, 1 + firstSunday + (n - 1) * 7));
}

function getHalifaxOffset(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const year = d.getUTCFullYear();
  const dstStart = nthSundayOfMonth(year, 2, 2); // 2nd Sunday of March
  const dstEnd = nthSundayOfMonth(year, 10, 1);  // 1st Sunday of November
  return d >= dstStart && d < dstEnd ? "-03:00" : "-04:00";
}

function toHalifaxUTC(dateStr: string, timeStr: string): string {
  const offset = getHalifaxOffset(dateStr);
  // timeStr may be "HH:MM" or "HH:MM:SS"
  const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return new Date(`${dateStr}T${time}${offset}`).toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
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

    const mutation = `
      mutation CreatePost($input: PostCreateInput!) {
        postCreate(input: $input) {
          post {
            id
            dueAt
            status
          }
          errors {
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        profileIds: [profile_id],
        text: caption,
        dueAt,
        mode: "customScheduled",
        metadata: {
          instagram: {
            type: "post",
            shouldShareToFeed: true,
          },
        },
        ...(image_url ? { assets: { images: [{ url: image_url }] } } : {}),
      },
    };

    const response = await fetch("https://api.buffer.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BUFFER_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const data = await response.json();

    if (data.errors || data.data?.postCreate?.errors?.length > 0) {
      const errors = data.errors || data.data.postCreate.errors;
      console.error("Buffer API errors:", errors);
      return NextResponse.json({ error: "Buffer API error", details: errors }, { status: 500 });
    }

    const post = data.data?.postCreate?.post;
    return NextResponse.json({ success: true, post, dueAt });
  } catch (error) {
    console.error("push-single-to-buffer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
