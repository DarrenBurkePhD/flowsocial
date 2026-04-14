import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const {
      brand_id, brand_name, brand_description, website_url,
      buffer_profile_id, brand_voice, age_range, gender,
      psychographics, image_color, image_people, image_finish, logo_url,
    } = body;

    const { data: existing } = await supabaseAdmin
      .from("brands")
      .select("id, brand_dna, target_audience")
      .eq("id", brand_id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (brand_name !== undefined) updates.brand_name = brand_name;
    if (brand_description !== undefined) updates.brand_description = brand_description;
    if (website_url !== undefined) updates.website_url = website_url;
    if (buffer_profile_id !== undefined) updates.buffer_profile_id = buffer_profile_id;
    if (brand_voice !== undefined) updates.brand_voice = brand_voice;
    if (logo_url !== undefined) updates.logo_url = logo_url;

    if (age_range !== undefined || gender !== undefined || psychographics !== undefined) {
      updates.target_audience = {
        ...existing.target_audience,
        ...(age_range !== undefined && { age_range }),
        ...(gender !== undefined && { gender }),
        ...(psychographics !== undefined && { psychographics }),
      };
    }

    if (image_color !== undefined || image_people !== undefined || image_finish !== undefined) {
      const currentDna = existing.brand_dna || {};
      updates.brand_dna = {
        ...currentDna,
        image_preferences: {
          ...currentDna.image_preferences,
          ...(image_color !== undefined && { color: image_color }),
          ...(image_people !== undefined && { people: image_people }),
          ...(image_finish !== undefined && { finish: image_finish }),
        },
      };
    }

    const { error } = await supabaseAdmin
      .from("brands")
      .update(updates)
      .eq("id", brand_id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    console.error("Update brand error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
