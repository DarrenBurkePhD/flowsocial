import { NextRequest, NextResponse } from "next/server";
import { createServerClient as createSupabaseSSR } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only gate dashboard routes
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const supabase = createSupabaseSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Check subscription status
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, trial_ends_at, current_period_ends_at")
    .eq("user_id", user.id)
    .single();

  const now = new Date();

  // No subscription row yet — auto-create trial based on auth.users created_at
  if (!sub) {
    // Get user created_at from auth
    const trialEnd = new Date(user.created_at);
    trialEnd.setDate(trialEnd.getDate() + 14);

    if (now > trialEnd) {
      const url = new URL("/upgrade", request.url);
      url.searchParams.set("trial_expired", "true");
      return NextResponse.redirect(url);
    }

    // Still in trial — allow through
    return response;
  }

  // Has a subscription row
  if (sub.status === "active" || sub.status === "trialing") {
    return response;
  }

  // Canceled or past_due
  const url = new URL("/upgrade", request.url);
  url.searchParams.set("trial_expired", "true");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
