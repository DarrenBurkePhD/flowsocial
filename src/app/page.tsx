import Link from "next/link";

export default function Home() {
  return (
    <main style={{ fontFamily: "'DM Sans', sans-serif", background: "#0A0A0A", color: "#F0EDE6", minHeight: "100vh" }}>

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .fs-ticker { display: flex; gap: 64px; animation: ticker 20s linear infinite; white-space: nowrap; }
        .fs-proof { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .fs-proof-quote { font-family: 'DM Serif Display', serif; font-size: 22px; line-height: 1.4; color: #D4C9B8; font-style: italic; }
        .fs-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2px; margin-top: 48px; }
        .fs-footer { display: flex; align-items: center; justify-content: space-between; }
        .fs-footer-copy { font-size: 12px; color: #4A4845; }
        @media (max-width: 600px) {
          .fs-nav { padding: 20px 24px !important; }
          .fs-hero { padding: 60px 24px 48px !important; }
          .fs-section { padding: 60px 24px !important; }
          .fs-section-notop { padding: 0 24px 60px !important; }
          .fs-proof { grid-template-columns: 1fr !important; gap: 32px !important; padding: 32px 24px !important; }
          .fs-proof-quote { font-size: 15px !important; line-height: 1.5 !important; }
          .fs-step-first { border-radius: 12px 12px 0 0 !important; }
          .fs-step-last { border-radius: 0 0 12px 12px !important; }
          .fs-footer { flex-direction: column !important; gap: 6px !important; padding: 24px !important; align-items: flex-start !important; }
          .fs-footer-copy { font-size: 11px !important; }
        }
      `}</style>

      {/* Nav */}
      <nav className="fs-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 48px", borderBottom: "0.5px solid rgba(240,237,230,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#C4A882"/>
            <path d="M8 22 C8 22 12 10 16 10 C20 10 20 16 24 12" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="24" cy="12" r="2.5" fill="#0A0A0A"/>
            <circle cx="8" cy="22" r="2" fill="#0A0A0A"/>
          </svg>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "20px", color: "#F0EDE6", letterSpacing: "-0.3px" }}>Flow Social</span>
        </div>
        <Link
          href="/onboarding"
          style={{ background: "#F0EDE6", color: "#0A0A0A", padding: "10px 22px", borderRadius: "100px", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
        >
          Start free trial
        </Link>
      </nav>

      {/* Hero */}
      <div className="fs-hero" style={{ padding: "100px 48px 80px", maxWidth: "900px" }}>
        <div style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "28px" }}>
          AI-powered Instagram engine
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(42px, 6vw, 72px)", lineHeight: 1.05, color: "#F0EDE6", margin: "0 0 12px" }}>
          Your brand deserves<br />
          to be <em style={{ fontStyle: "italic", color: "#C4A882" }}>seen.</em>
        </h1>
        <p style={{ fontSize: "18px", fontWeight: 300, color: "#9E9A93", lineHeight: 1.6, maxWidth: "540px", margin: "24px 0 48px" }}>
          Flow Social turns your brand story into a full week of premium Instagram content, written, designed, and scheduled automatically. No agency. No freelancer. No time wasted.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <Link
            href="/onboarding"
            style={{ background: "#F0EDE6", color: "#0A0A0A", padding: "16px 36px", borderRadius: "100px", fontSize: "15px", fontWeight: 500, textDecoration: "none" }}
          >
            Start 14-day free trial
          </Link>
          <Link
            href="/onboarding"
            style={{ color: "#9E9A93", fontSize: "14px", fontWeight: 400, textDecoration: "none" }}
          >
            See how it works →
          </Link>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ borderTop: "0.5px solid rgba(240,237,230,0.08)", borderBottom: "0.5px solid rgba(240,237,230,0.08)", padding: "16px 0", margin: "60px 0 0", overflow: "hidden" }}>
        <div className="fs-ticker">
          {["Brand DNA analysis", "7 posts in 30 seconds", "Auto-scheduled to Instagram", "AI-generated imagery", "On-brand every time", "No agency needed",
            "Brand DNA analysis", "7 posts in 30 seconds", "Auto-scheduled to Instagram", "AI-generated imagery", "On-brand every time", "No agency needed"
          ].map((item, i) => (
            <span key={i} style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "rgba(240,237,230,0.3)", flexShrink: 0 }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="fs-section" style={{ padding: "80px 48px" }}>
        <div style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "20px" }}>How it works</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.1, color: "#F0EDE6", margin: "0 0 16px" }}>
          Three steps to a full <em style={{ color: "#C4A882" }}>Instagram presence</em>
        </h2>
        <div className="fs-steps">
          {[
            { num: "01", title: "Tell us your brand", desc: "Share your brand name, voice, audience, and a few reference accounts. Takes 3 minutes.", cls: "fs-step-first" },
            { num: "02", title: "Generate your week", desc: "One click. Flow Social creates 7 days of on-brand posts ready for your review.", cls: "" },
            { num: "03", title: "Approve and schedule", desc: "Review each post, generate images, hit approve. Your posts gets scheduled.", cls: "fs-step-last" },
          ].map((step, i) => (
            <div
              key={i}
              className={step.cls}
              style={{
                background: "#111111",
                padding: "36px 32px",
                border: "0.5px solid rgba(240,237,230,0.06)",
                borderRadius: i === 0 ? "12px 0 0 12px" : i === 2 ? "0 12px 12px 0" : "0"
              }}
            >
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "48px", color: "rgba(240,237,230,0.08)", lineHeight: 1, marginBottom: "20px" }}>{step.num}</div>
              <div style={{ fontSize: "15px", fontWeight: 500, color: "#F0EDE6", marginBottom: "10px" }}>{step.title}</div>
              <div style={{ fontSize: "13px", fontWeight: 300, color: "#6B6760", lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Case study */}
      <div className="fs-section-notop" style={{ padding: "0 48px 80px" }}>
        <div style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "20px" }}>Live case study</div>
        <div
          className="fs-proof"
          style={{
            background: "#0F0F0F",
            border: "0.5px solid rgba(240,237,230,0.08)",
            borderRadius: "16px",
            padding: "48px",
          }}
        >
          <div>
            <div className="fs-proof-quote">
              "We went from posting twice a month to every day, and with curated, on brand, engaging content."
            </div>
            <div style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase", color: "#8B7355", marginTop: "20px" }}>
              Headstrong — Brain first sports nutrition for athletes
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              { num: "7", label: "Posts created in under 30 seconds" },
              { num: "100%", label: "On-brand, no editing required" },
              { num: "$0", label: "Spent on a social media manager" },
            ].map((stat, i) => (
              <div key={i} style={{ borderLeft: "1px solid rgba(196,168,130,0.3)", paddingLeft: "20px" }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "36px", color: "#C4A882", lineHeight: 1 }}>{stat.num}</div>
                <div style={{ fontSize: "12px", fontWeight: 400, color: "#6B6760", marginTop: "4px" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="fs-section-notop" style={{ padding: "0 48px 80px", textAlign: "center" }}>
        <div style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "20px" }}>Pricing</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.1, color: "#F0EDE6", marginBottom: "40px" }}>
          Simple, founder-friendly <em style={{ color: "#C4A882" }}>pricing</em>
        </h2>
        <div style={{
          background: "#111111",
          border: "0.5px solid rgba(240,237,230,0.08)",
          borderRadius: "16px",
          padding: "48px",
          maxWidth: "480px",
          margin: "0 auto",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355" }}>Everything included</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "64px", color: "#F0EDE6", lineHeight: 1, margin: "24px 0 8px" }}>
            $97<span style={{ fontSize: "20px", color: "#6B6760" }}>/mo</span>
          </div>
          <div style={{ fontSize: "14px", color: "#6B6760", marginBottom: "32px" }}>14-day free trial, no credit card required</div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 36px", textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              "7 posts for each week",
              "AI powered image per post",
              "Auto-scheduling to IG via Buffer",
              "Your brands DNA every post",
              "Caption editing and regeneration",
              "Unlimited content packages",
            ].map((f, i) => (
              <li key={i} style={{ fontSize: "14px", color: "#9E9A93", paddingLeft: "20px", position: "relative", fontWeight: 300 }}>
                <span style={{ position: "absolute", left: 0, top: "7px", width: "6px", height: "6px", borderRadius: "50%", background: "#C4A882", display: "block" }} />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/onboarding"
            style={{ display: "block", background: "#F0EDE6", color: "#0A0A0A", padding: "18px", borderRadius: "100px", fontSize: "15px", fontWeight: 500, textDecoration: "none" }}
          >
            Start free trial
          </Link>
          <div style={{ fontSize: "12px", color: "#6B6760", marginTop: "16px" }}>No credit card. Cancel anytime.</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="fs-footer" style={{ borderTop: "0.5px solid rgba(240,237,230,0.08)", padding: "32px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#C4A882"/>
            <path d="M8 22 C8 22 12 10 16 10 C20 10 20 16 24 12" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="24" cy="12" r="2.5" fill="#0A0A0A"/>
            <circle cx="8" cy="22" r="2" fill="#0A0A0A"/>
          </svg>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "14px", color: "#4A4845" }}>Flow Social</span>
        </div>
        <div className="fs-footer-copy">© 2026 Flow Social. Built for founders.</div>
      </footer>

    </main>
  );
}