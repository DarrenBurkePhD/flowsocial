import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("beta_signups").insert({ email });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ already: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
