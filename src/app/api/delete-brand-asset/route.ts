// src/app/api/delete-brand-asset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { asset_id } = await req.json();
  if (!asset_id) {
    return NextResponse.json({ error: "Missing asset_id" }, { status: 400 });
  }

  const { data: asset } = await supabaseAdmin
    .from("brand_assets")
    .select("id, brand_id")
    .eq("id", asset_id)
    .maybeSingle();

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const { data: brand } = await supabaseAdmin
    .from("brands")
    .select("id")
    .eq("id", asset.brand_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!brand) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabaseAdmin.from("brand_assets").delete().eq("id", asset_id);

  return NextResponse.json({ success: true });
}
