import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { profile_id, text, scheduled_at, image_url } = await req.json();

    const dueAt = new Date(scheduled_at * 1000).toISOString();

    const mutation = `
      mutation CreatePost {
        createPost(input: {
          channelId: "${profile_id}",
          text: ${JSON.stringify(text)},
          schedulingType: automatic,
          mode: customScheduled,
          dueAt: "${dueAt}"
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
      // MutationError
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