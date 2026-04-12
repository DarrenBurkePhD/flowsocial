import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brand_id = searchParams.get("brand_id");

    if (!brand_id) {
      return NextResponse.json({ error: "brand_id required" }, { status: 400 });
    }

    const { data: brand, error } = await supabase
      .from("brands")
      .select("id, brand_name, brand_description")
      .eq("id", brand_id)
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ brand });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}