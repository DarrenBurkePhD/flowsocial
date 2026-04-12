import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { package_id, content_pieces } = await req.json();

    const approvedCount = content_pieces.filter(
      (p: { status: string }) => p.status === "approved"
    ).length;

    const { error } = await supabase
      .from("content_packages")
      .update({
        content_pieces,
        approved_count: approvedCount,
      })
      .eq("id", package_id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}