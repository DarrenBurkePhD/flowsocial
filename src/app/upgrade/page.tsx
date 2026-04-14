"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function UpgradeContent() {
  const [loading, setLoading] = useState(false);
  const [brandId, setBrandId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled");
  const trialExpired = searchParams.get("trial_expired");

  useEffect(() => {
    // Get brand_id from localStorage so we can redirect back after payment
    const stored = localStorage.getItem("last_brand_id");
    if (stored) setBrandId(stored);
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
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <div
      style={{ backgroundColor: "#0A0A0A", minHeight: "100vh" }}
      className="flex items-center justify-center px-4"
    >
      <div className="max-w-lg w-full text-center">
        {/* Logo / wordmark */}
        <p className="text-sm tracking-widest uppercase mb-8" style={{ color: "#C4A882" }}>
          Flow Social
        </p>

        {trialExpired ? (
          <>
            <h1
              className="text-4xl mb-4"
              style={{ fontFamily: "DM Serif Display, serif", color: "#F0EDE6" }}
            >
              Your free trial has ended
            </h1>
            <p className="text-base mb-10" style={{ color: "#888" }}>
              You had 14 days on us. To keep generating content and scheduling
              to Instagram, upgrade to Flow Social Pro.
            </p>
          </>
        ) : (
          <>
            <h1
              className="text-4xl mb-4"
              style={{ fontFamily: "DM Serif Display, serif", color: "#F0EDE6" }}
            >
              Unlock Flow Social Pro
            </h1>
            <p className="text-base mb-10" style={{ color: "#888" }}>
              Everything you need to run a world-class Instagram presence
              without the agency price tag.
            </p>
          </>
        )}

        {/* Pricing card */}
        <div
          className="rounded-2xl p-8 mb-8 text-left"
          style={{ backgroundColor: "#111111", border: "1px solid #222" }}
        >
          <div className="flex items-end gap-2 mb-6">
            <span
              className="text-5xl font-bold"
              style={{ color: "#F0EDE6", fontFamily: "DM Serif Display, serif" }}
            >
              $97
            </span>
            <span className="text-base mb-2" style={{ color: "#888" }}>/ month</span>
          </div>

          <ul className="space-y-3 mb-0">
            {[
              "7 AI-generated posts every week",
              "DALL-E images matched to your brand",
              "Auto-scheduled to Instagram via Buffer",
              "Brand DNA that evolves with you",
              "Cancel anytime",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <span style={{ color: "#C4A882" }}>✓</span>
                <span style={{ color: "#F0EDE6" }} className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {cancelled && (
          <p className="text-sm mb-4" style={{ color: "#888" }}>
            No worries — your content is still here whenever you are ready.
          </p>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-4 rounded-xl text-base font-medium transition-opacity"
          style={{
            backgroundColor: "#C4A882",
            color: "#0A0A0A",
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Redirecting to checkout..." : "Start Flow Social Pro — $97/month"}
        </button>

        <p className="text-xs mt-4" style={{ color: "#555" }}>
          Secured by Stripe. Cancel anytime from your account settings.
        </p>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradeContent />
    </Suspense>
  );
}
