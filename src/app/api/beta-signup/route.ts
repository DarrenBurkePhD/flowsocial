import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  // Notify you
  await resend.emails.send({
    from: "Flow Social <onboarding@resend.dev>",
    to: "db@doctorburke.net",
    subject: "New beta signup — " + email,
    html: `
      <div style="font-family: sans-serif; padding: 32px; background: #0A0A0A; color: #F0EDE6; max-width: 480px;">
        <div style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #C4A882;">Flow Social</div>
        <div style="font-size: 16px; margin-bottom: 8px;">New beta access request:</div>
        <div style="font-size: 22px; color: #C4A882; margin-bottom: 24px;">${email}</div>
        <a href="https://flowsocial.ai/admin" style="background: #F0EDE6; color: #0A0A0A; padding: 12px 24px; border-radius: 100px; text-decoration: none; font-size: 14px; font-weight: 500;">
          View admin panel
        </a>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
