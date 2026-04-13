"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const errorParam = searchParams.get("error");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase
          .from("brands")
          .select("id")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
          .then(({ data: brand }) => {
            if (brand) {
              router.push(`/dashboard/${brand.id}`);
            } else {
              router.push("/onboarding");
            }
          });
      }
    });
  }, [router]);

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <main style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#0A0A0A",
      color: "#F0EDE6",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px"
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px", justifyContent: "center" }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#C4A882"/>
            <path d="M8 22 C8 22 12 10 16 10 C20 10 20 16 24 12" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="24" cy="12" r="2.5" fill="#0A0A0A"/>
            <circle cx="8" cy="22" r="2" fill="#0A0A0A"/>
          </svg>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "20px", color: "#F0EDE6" }}>Flow Social</span>
        </div>

        {!sent ? (
          <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.08)", borderRadius: "16px", padding: "40px" }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#F0EDE6", margin: "0 0 8px", lineHeight: 1.2 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: "14px", color: "#6B6760", margin: "0 0 32px", lineHeight: 1.6 }}>
              Enter your email and we will send you a magic link to sign in instantly. No password needed.
            </p>

            {(error || errorParam) && (
              <div style={{ background: "rgba(220,38,38,0.1)", border: "0.5px solid rgba(220,38,38,0.3)", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#FCA5A5" }}>
                {error || errorParam}
              </div>
            )}

            <form onSubmit={handleSendLink}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#9E9A93", marginBottom: "8px", fontWeight: 500 }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourbrand.com"
                  required
                  style={{ width: "100%", background: "#0A0A0A", border: "0.5px solid rgba(240,237,230,0.15)", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", color: "#F0EDE6", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                style={{ width: "100%", background: "#F0EDE6", color: "#0A0A0A", border: "none", borderRadius: "100px", padding: "16px", fontSize: "15px", fontWeight: 500, cursor: loading || !email ? "not-allowed" : "pointer", opacity: loading || !email ? 0.5 : 1, transition: "opacity 0.2s" }}
              >
                {loading ? "Sending..." : "Send magic link"}
              </button>
            </form>

            <p style={{ fontSize: "12px", color: "#4A4845", marginTop: "24px", textAlign: "center", lineHeight: 1.6 }}>
              New here? Enter your email above to create your account and start your 14-day free trial.
            </p>
          </div>
        ) : (
          <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.08)", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "20px" }}>✦</div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "24px", color: "#F0EDE6", margin: "0 0 12px" }}>
              Check your inbox
            </h1>
            <p style={{ fontSize: "14px", color: "#6B6760", lineHeight: 1.6, margin: "0 0 24px" }}>
              We sent a magic link to <span style={{ color: "#C4A882" }}>{email}</span>. Click it to sign in instantly.
            </p>
            <button
              onClick={() => setSent(false)}
              style={{ background: "none", border: "0.5px solid rgba(240,237,230,0.15)", borderRadius: "100px", padding: "10px 24px", fontSize: "13px", color: "#9E9A93", cursor: "pointer" }}
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
