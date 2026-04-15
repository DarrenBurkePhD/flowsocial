import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brand_id = searchParams.get("brand_id");
    if (!brand_id) {
      return NextResponse.json({ error: "brand_id required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: brand, error } = await supabase
      .from("brands")
      .select("id, brand_name, brand_description, website_url, buffer_profile_id, brand_voice, target_audience, brand_dna, logo_url")
      .eq("id", brand_id)
      .eq("user_id", user.id)
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
