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

    const response = await fetch("https://api.buffer.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.BUFFER_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query }),
    });

    const httpStatus = response.status;
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Return raw response so we can see what Buffer said
      return NextResponse.json({
        error: "Buffer returned non-JSON",
        httpStatus,
        body: text
      }, { status: 500 });
    }

    if (data.errors) {
      return NextResponse.json({
        error: "Buffer GraphQL error",
        httpStatus,
        details: data.errors
      }, { status: 500 });
    }

    const result = data.data?.createPost;
    if (result?.message) {
      return NextResponse.json({
        error: result.message,
        httpStatus,
        raw: data
      }, { status: 500 });
    }

    const post = result?.post;
    return NextResponse.json({ success: true, buffer_id: post?.id, dueAt });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
