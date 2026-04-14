// src/app/api/save-brand-asset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { brand_id, public_url, storage_path, asset_type } = await req.json();

  if (!brand_id || !public_url || !storage_path) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: brand } = await supabaseAdmin
    .from("brands")
    .select("id")
    .eq("id", brand_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const { data: asset, error } = await supabaseAdmin
    .from("brand_assets")
    .insert({ brand_id, public_url, storage_path, asset_type: asset_type || "photo" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to save asset" }, { status: 500 });
  }

  return NextResponse.json({ asset });
}
