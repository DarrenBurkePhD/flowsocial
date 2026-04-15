import Link from "next/link";
import BetaFormClient from "./BetaFormClient";

export default function Home() {
  return (
    <main style={{ fontFamily: "'DM Sans', sans-serif", background: "#0A0A0A", color: "#F0EDE6", minHeight: "100vh" }}>

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .fs-ticker { display: flex; gap: 64px; animation: ticker 20s linear infinite; white-space: nowrap; }
        .fs-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2px; margin-top: 48px; }
        .fs-proof { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .fs-proof-quote { font-family: "DM Serif Display", serif; font-size: 22px; line-height: 1.4; color: #D4C9B8; font-style: italic; }
        .fs-footer { display: flex; align-items: center; justify-content: space-between; }
        .fs-footer-copy { font-size: 12px; color: #4A4845; }
        .fs-beta-input::placeholder { color: #4A4845; }
        .fs-beta-input:focus { outline: none; border-color: rgba(196,168,130,0.4) !important; }
        @media (max-width: 600px) {
          .fs-nav { padding: 14px 20px !important; }
          .fs-nav-icon { width: 22px !important; height: 22px !important; }
          .fs-nav-wordmark { font-size: 15px !important; }
          .fs-nav-signin { padding: 7px 12px !important; font-size: 11px !important; }
          .fs-nav-trial { padding: 7px 14px !important; font-size: 11px !important; }
          .fs-nav-gap { gap: 8px !important; }
          .fs-hero { padding: 60px 24px 48px !important; }
          .fs-section { padding: 60px 24px !important; }
          .fs-section-notop { padding: 0 24px 60px !important; }
          .fs-pain { padding: 60px 24px !important; }
          .fs-proof { grid-template-columns: 1fr !important; gap: 32px !important; padding: 32px 24px !important; }
          .fs-proof-quote { font-size: 15px !important; line-height: 1.5 !important; }
          .fs-pain-grid { grid-template-columns: 1fr !important; }
          .fs-step-first { border-radius: 12px 12px 0 0 !important; }
          .fs-step-last { border-radius: 0 0 12px 12px !important; }
          .fs-footer { flex-direction: column !important; gap: 6px !important; padding: 24px !important; align-items: flex-start !important; }
          .fs-footer-copy { font-size: 11px !important; }
          .fs-beta-row { flex-direction: column !important; }
          .fs-beta-btn { width: 100% !important; text-align: center !important; }
        }
      `}</style>

      {/* Nav */}
      <nav className="fs-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 48px", borderBottom: "0.5px solid rgba(240,237,230,0.1)" }}>
        <div className="fs-nav-gap" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg className="fs-nav-icon" width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#C4A882"/>
            <path d="M8 22 C8 22 12 10 16 10 C20 10 20 16 24 12" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="24" cy="12" r="2.5" fill="#0A0A0A"/>
            <circle cx="8" cy="22" r="2" fill="#0A0A0A"/>
          </svg>
          <span className="fs-nav-wordmark" style={{ fontFamily: "'DM Serif Display', serif", fontSize: "20px", color: "#F0EDE6", letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>Flow Social</span>
        </div>
        <div className="fs-nav-gap" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/auth" className="fs-nav-signin" style={{ background: "transparent", color: "#9E9A93", padding: "10px 18px", borderRadius: "100px", fontSize: "13px", fontWeight: 400, textDecoration: "none", border: "0.5px solid rgba(240,237,230,0.15)", whiteSpace: "nowrap" }}>
            Sign in
          </Link>
          <Link href="#beta" className="fs-nav-trial" style={{ background: "#C4A882", color: "#0A0A0A", padding: "10px 22px", borderRadius: "100px", fontSize: "13px", fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap" }}>
            Request access
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="fs-hero" style={{ padding: "100px 48px 80px", maxWidth: "960px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(196,168,130,0.08)", border: "0.5px solid rgba(196,168,130,0.2)", borderRadius: "100px", padding: "6px 16px", marginBottom: "32px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#C4A882", display: "inline-block" }} />
          <span style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase", color: "#C4A882" }}>Beta access now open</span>
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(42px, 6vw, 80px)", lineHeight: 1.0, color: "#F0EDE6", margin: "0 0 12px" }}>
          The creative agency<br />
          <em style={{ fontStyle: "italic", color: "#C4A882" }}>is over.</em>
        </h1>
        <p style={{ fontSize: "18px", fontWeight: 300, color: "#9E9A93", lineHeight: 1.7, maxWidth: "600px", margin: "28px 0 0" }}>
          Flow Social is the AI brand engine that replaces your social media agency. Strategy, content, images, captions, hashtags — generated in seconds, scheduled automatically, on-brand every time. Built for consumer product founders who are done paying $3,000 a month for mediocre content.
        </p>
      </div>

      {/* Ticker */}
      <div style={{ borderTop: "0.5px solid rgba(240,237,230,0.08)", borderBottom: "0.5px solid rgba(240,237,230,0.08)", padding: "16px 0", overflow: "hidden" }}>
        <div className="fs-ticker">
          {[
            "Brand DNA engine", "7 posts in 30 seconds", "Auto-scheduled to Instagram", "On-brand every time",
            "Your photos and curated imagery", "No agency needed", "No freelancer needed", "No retainer. Ever.",
            "Brand DNA engine", "7 posts in 30 seconds", "Auto-scheduled to Instagram", "On-brand every time",
            "Your photos and curated imagery", "No agency needed", "No freelancer needed", "No retainer. Ever.",
          ].map((item, i) => (
            <span key={i} style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "rgba(240,237,230,0.25)", flexShrink: 0 }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* The agency problem */}
      <div className="fs-pain" style={{ padding: "80px 48px" }}>
        <div style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "20px" }}>The agency problem</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 1.1, color: "#F0EDE6", margin: "0 0 48px", maxWidth: "700px" }}>
          Agencies charge like partners.<br />
          <em style={{ color: "#C4A882" }}>They deliver like vendors.</em>
        </h2>
        <div className="fs-pain-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px" }}>
          {[
            {
              num: "01",
              title: "$2,000–$8,000/month retainers",
              desc: "For content that takes a junior account manager 3 hours to produce. You're paying for overhead, not output. And you're locked in for 6 months before you realize it."
            },
            {
              num: "02",
              title: "Your brand voice. Diluted.",
              desc: "Agencies manage 30 clients at once. Your brand becomes a template. The nuance, the edge, the thing that makes your product distinct — smoothed out to fit their process."
            },
            {
              num: "03",
              title: "Slow, approval-heavy, reactive",
              desc: "Weekly calls. Revision rounds. Missed cultural moments. By the time your agency posts about a trend, it's already dead. The algorithm doesn't wait for your approval process."
            },
          ].map((pain, i) => (
            <div key={i} style={{
              background: "#0F0F0F",
              padding: "36px 32px",
              border: "0.5px solid rgba(240,237,230,0.06)",
              borderRadius: i === 0 ? "12px 0 0 12px" : i === 2 ? "0 12px 12px 0" : "0"
            }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "42px", color: "rgba(196,168,130,0.12)", lineHeight: 1, marginBottom: "20px" }}>{pain.num}</div>
              <div style={{ fontSize: "15px", fontWeight: 500, color: "#F0EDE6", marginBottom: "10px" }}>{pain.title}</div>
              <div style={{ fontSize: "13px", fontWeight: 300, color: "#6B6760", lineHeight: 1.7 }}>{pain.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "48px", background: "rgba(196,168,130,0.05)", border: "0.5px solid rgba(196,168,130,0.15)", borderRadius: "14px", padding: "40px", maxWidth: "760px" }}>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(18px, 2.5vw, 26px)", color: "#D4C9B8", lineHeight: 1.5, margin: "0 0 8px" }}>
            Flow Social knows your brand at a DNA level. It writes in your voice, sources images that match your aesthetic, and publishes on your schedule — automatically, every week, forever.
          </p>
          <p style={{ fontSize: "14px", color: "#6B6760", margin: "16px 0 0", lineHeight: 1.7 }}>
            Not a template tool. Not a prompt box. A living brand engine that gets sharper the more you use it.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="fs-section" style={{ padding: "80px 48px" }}>
        <div style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "20px" }}>How it works</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.1, color: "#F0EDE6", margin: "0 0 16px" }}>
          Your agency replacement.<br /><em style={{ color: "#C4A882" }}>Set up in three minutes.</em>
        </h2>
        <div className="fs-steps">
          {[
            { num: "01", title: "Train it on your brand", desc: "Enter your brand name and website. Flow Social reads your site, extracts your voice, your products, your audience, and builds a Brand DNA profile automatically. Three minutes, once.", cls: "fs-step-first" },
            { num: "02", title: "Generate a full week", desc: "One click. Seven days of on-brand captions, hashtags, CTAs, and matched imagery — feed posts, stories, carousels — ready for review in under 30 seconds.", cls: "" },
            { num: "03", title: "Approve and it ships", desc: "Review each post, swap an image, tweak a caption. Hit approve and Flow Social schedules everything to Instagram automatically. Done.", cls: "fs-step-last" },
          ].map((step, i) => (
            <div key={i} className={step.cls} style={{
              background: "#111111",
              padding: "36px 32px",
              border: "0.5px solid rgba(240,237,230,0.06)",
              borderRadius: i === 0 ? "12px 0 0 12px" : i === 2 ? "0 12px 12px 0" : "0"
            }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "48px", color: "rgba(240,237,230,0.06)", lineHeight: 1, marginBottom: "20px" }}>{step.num}</div>
              <div style={{ fontSize: "15px", fontWeight: 500, color: "#F0EDE6", marginBottom: "10px" }}>{step.title}</div>
              <div style={{ fontSize: "13px", fontWeight: 300, color: "#6B6760", lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live case study */}
      <div className="fs-section-notop" style={{ padding: "0 48px 80px" }}>
        <div style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "20px" }}>Live case study</div>
        <div className="fs-proof" style={{ background: "#0F0F0F", border: "0.5px solid rgba(240,237,230,0.08)", borderRadius: "16px", padding: "48px" }}>
          <div>
            <div className="fs-proof-quote">
              "We went from posting twice a month to every single day — with content that actually sounds like us. No agency, no freelancer, no brief. Just Flow Social."
            </div>
            <div style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase", color: "#8B7355", marginTop: "20px" }}>
              Headstrong — Brain-first sports nutrition for contact sport athletes
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              { num: "7", label: "Posts generated in under 30 seconds" },
              { num: "$0", label: "Spent on agency or freelance content" },
              { num: "100%", label: "On-brand, zero editing required" },
            ].map((stat, i) => (
              <div key={i} style={{ borderLeft: "1px solid rgba(196,168,130,0.3)", paddingLeft: "20px" }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "36px", color: "#C4A882", lineHeight: 1 }}>{stat.num}</div>
                <div style={{ fontSize: "12px", fontWeight: 400, color: "#6B6760", marginTop: "4px" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What is coming */}
      <div className="fs-section-notop" style={{ padding: "0 48px 80px" }}>
        <div style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "20px" }}>On the roadmap</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.1, color: "#F0EDE6", margin: "0 0 12px" }}>
          Instagram is just the start.<br />
          <em style={{ color: "#C4A882" }}>We are building the full stack.</em>
        </h2>
        <p style={{ fontSize: "15px", fontWeight: 300, color: "#6B6760", lineHeight: 1.7, maxWidth: "560px", marginBottom: "40px" }}>
          Beta users shape what gets built. TikTok, email, LinkedIn, performance analytics, multi-channel scheduling — it is all coming. Get in early and help us build it.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2px" }}>
          {[
            { label: "TikTok content engine", status: "Coming soon" },
            { label: "Email newsletter generation", status: "Coming soon" },
            { label: "LinkedIn brand presence", status: "Coming soon" },
            { label: "ROI and growth analytics", status: "Coming soon" },
          ].map((item, i, arr) => (
            <div key={i} style={{
              background: "#0F0F0F",
              padding: "28px 28px",
              border: "0.5px solid rgba(240,237,230,0.06)",
              borderRadius: i === 0 ? "12px 0 0 12px" : i === arr.length - 1 ? "0 12px 12px 0" : "0"
            }}>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "#F0EDE6", marginBottom: "8px" }}>{item.label}</div>
              <div style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase", color: "#8B7355" }}>{item.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Beta CTA */}
      <div id="beta" className="fs-section-notop" style={{ padding: "0 48px 100px" }}>
        <div style={{ background: "linear-gradient(135deg, rgba(196,168,130,0.07) 0%, rgba(196,168,130,0.03) 100%)", border: "0.5px solid rgba(196,168,130,0.2)", borderRadius: "20px", padding: "64px 56px", maxWidth: "760px" }}>
          <div style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "20px" }}>Beta access</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 1.1, color: "#F0EDE6", margin: "0 0 16px" }}>
            Fire your agency.<br />
            <em style={{ color: "#C4A882" }}>Join the beta.</em>
          </h2>
          <p style={{ fontSize: "15px", fontWeight: 300, color: "#9E9A93", lineHeight: 1.7, maxWidth: "480px", margin: "0 0 36px" }}>
            We are opening Flow Social to a small group of consumer product founders. No credit card. No retainer. Just your brand, running on autopilot from day one.
          </p>
          <BetaForm />
          <p style={{ fontSize: "12px", color: "#4A4845", marginTop: "20px", lineHeight: 1.6 }}>
            We review every application. Selected founders receive an access code by email within 48 hours.
          </p>
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

function BetaForm() {
  return <BetaFormClient />;
}
