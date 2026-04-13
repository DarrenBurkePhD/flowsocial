import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { profile_id, text, scheduled_at, image_url, content_type } = await req.json();

    if (!image_url) {
      return NextResponse.json(
        { error: "Instagram requires an image. Please add an image before approving." },
        { status: 400 }
      );
    }

    const dueAt = new Date(scheduled_at * 1000).toISOString();
    const instagramType = content_type === "story" ? "story" : "post";

    const mutation = `
      mutation CreatePost {
        createPost(input: {
          channelId: "${profile_id}",
          text: ${JSON.stringify(text)},
          schedulingType: automatic,
          mode: customScheduled,
          dueAt: "${dueAt}",
          assets: {
            images: [
              { url: ${JSON.stringify(image_url)} }
            ]
          },
          metadata: {
            instagram: {
              type: ${instagramType},
              shouldShareToFeed: true
            }
          }
        }) {
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

    const bufferRes = await fetch("https://api.buffer.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.BUFFER_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query: mutation }),
    });

    const bufferData = await bufferRes.json();

    if (bufferData.errors) {
      return NextResponse.json(
        { error: bufferData.errors[0].message },
        { status: 400 }
      );
    }

    const result = bufferData.data?.createPost;

    if (result?.message) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      buffer_id: result?.post?.id,
      scheduled_at: result?.post?.dueAt,
    });

  } catch (err: unknown) {
    console.error("Buffer push error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Buffer push failed" },
      { status: 500 }
    );
  }
}