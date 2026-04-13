import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const introspection = `
      query {
        __type(name: "InstagramPostMetadataInput") {
          inputFields {
            name
            type {
              name
              kind
              ofType {
                name
                kind
              }
            }
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
      body: JSON.stringify({ query: introspection }),
    });

    const data = await bufferRes.json();
    return NextResponse.json(data);

  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 500 }
    );
  }
}