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

    const mutation = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          ... on PostActionSuccess {
            post {
              id
              dueAt
            }
          }
          ... on MutationError {
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        channelId: profile_id,
        text: caption,
        schedulingType: "automatic",
        mode: "customScheduled",
        dueAt,
        ...(image_url ? { assets: [{ url: image_url, type: "image" }] } : {}),
      },
    };

    const requestBody = JSON.stringify({ query: mutation, variables });
    console.log("Sending to Buffer:", requestBody.substring(0, 500));

    let response: Response;
    try {
      response = await fetch("https://api.buffer.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.BUFFER_ACCESS_TOKEN}`,
        },
        body: requestBody,
      });
    } catch (fetchErr) {
      console.error("Fetch to Buffer failed:", fetchErr);
      return NextResponse.json({ error: "Could not reach Buffer API", details: String(fetchErr) }, { status: 500 });
    }

    console.log("Buffer HTTP status:", response.status);

    let data: Record<string, unknown>;
    try {
      data = await response.json();
    } catch (parseErr) {
      const text = await response.text().catch(() => "unreadable");
      console.error("Buffer response not JSON. Status:", response.status, "Body:", text);
      return NextResponse.json({ error: "Buffer returned non-JSON", status: response.status, body: text }, { status: 500 });
    }

    console.log("Buffer response:", JSON.stringify(data));

    if (data.errors) {
      console.error("Buffer GraphQL errors:", JSON.stringify(data.errors));
      return NextResponse.json({ error: "Buffer API error", details: data.errors }, { status: 500 });
    }

    const result = data.data as { createPost?: { post?: { id: string; dueAt: string }; message?: string } };
    const createPost = result?.createPost;

    if (createPost?.message) {
      console.error("Buffer mutation error:", createPost.message);
      return NextResponse.json({ error: createPost.message }, { status: 500 });
    }

    const post = createPost?.post;
    console.log("Post scheduled successfully:", post);
    return NextResponse.json({ success: true, buffer_id: post?.id, dueAt });

  } catch (error) {
    console.error("push-single-to-buffer unexpected error:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
