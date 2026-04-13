import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brand_id = searchParams.get("brand_id");

    if (!brand_id) {
      return NextResponse.json({ error: "brand_id required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

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
