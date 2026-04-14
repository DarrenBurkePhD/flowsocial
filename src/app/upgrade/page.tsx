"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function UpgradeContent() {
  const [loading, setLoading] = useState(false);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled");
  const trialExpired = searchParams.get("trial_expired");

  useEffect(() => {
    const stored = localStorage.getItem("last_brand_id");
    if (stored) {
      setBrandId(stored);
      fetch(`/api/get-brand?brand_id=${stored}`)
        .then((r) => r.json())
        .then((d) => { if (d.brand?.brand_name) setBrandName(d.brand.brand_name); })
        .catch(() => {});
    }
  }, []);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0A", color: "#F0EDE6", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px" }}>
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#C4A882"/>
          <path d="M8 22 C8 22 12 10 16 10 C20 10 20 16 24 12" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <circle cx="24" cy="12" r="2.5" fill="#0A0A0A"/>
          <circle cx="8" cy="22" r="2" fill="#0A0A0A"/>
        </svg>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "18px", color: "#F0EDE6" }}>Flow Social</span>
      </div>

      <div style={{ width: "100%", maxWidth: "440px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          {trialExpired ? (
            <>
              {brandName && (
                <div style={{ fontSize: "12px", color: "#C4A882", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "16px", fontWeight: 500 }}>
                  {brandName} is ready to grow
                </div>
              )}
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "32px", color: "#F0EDE6", margin: "0 0 12px", lineHeight: 1.2 }}>
                Your free trial has ended
              </h1>
              <p style={{ fontSize: "15px", color: "#6B6760", margin: 0, lineHeight: 1.6 }}>
                Your brand DNA, content strategy, and posts are all saved. Pick up exactly where you left off.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "32px", color: "#F0EDE6", margin: "0 0 12px", lineHeight: 1.2 }}>
                One plan. Everything included.
              </h1>
              <p style={{ fontSize: "15px", color: "#6B6760", margin: 0, lineHeight: 1.6 }}>
                A world-class Instagram presence without the agency price tag.
              </p>
            </>
          )}
        </div>

        {/* Pricing card */}
        <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.08)", borderRadius: "16px", padding: "28px", marginBottom: "16px" }}>

          {/* Price */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", marginBottom: "24px", paddingBottom: "24px", borderBottom: "0.5px solid rgba(240,237,230,0.06)" }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "52px", color: "#F0EDE6", lineHeight: 1 }}>$97</span>
            <span style={{ fontSize: "14px", color: "#4A4845", marginBottom: "8px" }}>/ month</span>
          </div>

          {/* Features */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              ["7 posts generated every week", "Captions, hashtags, CTAs — all on-brand"],
              ["Your images mixed with curated stock", "Brand assets + Pexels photography"],
              ["Auto-scheduled via Buffer", "Posts go out without you lifting a finger"],
              ["Brand DNA that learns your voice", "Gets sharper every week"],
              ["Cancel anytime", "No contracts, no catch"],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ color: "#C4A882", fontSize: "14px", marginTop: "1px", flexShrink: 0 }}>✓</span>
                <div>
                  <div style={{ fontSize: "14px", color: "#F0EDE6", fontWeight: 500, marginBottom: "1px" }}>{title}</div>
                  <div style={{ fontSize: "12px", color: "#4A4845" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison nudge */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span style={{ fontSize: "12px", color: "#3A3835" }}>Less than one hour of agency time. Cancel anytime.</span>
        </div>

        {cancelled && (
          <div style={{ background: "rgba(196,168,130,0.06)", border: "0.5px solid rgba(196,168,130,0.15)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "#6B6760", margin: 0 }}>No worries — your content is saved and ready whenever you are.</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{ width: "100%", background: loading ? "#1E1E1C" : "#C4A882", color: loading ? "#4A4845" : "#0A0A0A", border: "none", borderRadius: "100px", padding: "18px", fontSize: "16px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "opacity 0.2s", letterSpacing: "0.2px" }}>
          {loading ? "Redirecting to checkout..." : trialExpired ? "Continue with Flow Social — $97/month" : "Start Flow Social Pro — $97/month"}
        </button>

        <p style={{ fontSize: "12px", color: "#3A3835", textAlign: "center", marginTop: "14px" }}>
          Secured by Stripe. Cancel anytime from your account settings.
        </p>

      </div>
    </main>
  );
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradeContent />
    </Suspense>
  );
}
