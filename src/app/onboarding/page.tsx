"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const BRAND_VOICE_OPTIONS = [
  "Warm & nurturing", "Cool & minimal", "Playful & witty",
  "Premium & aspirational", "Educational & expert",
  "Raw & authentic", "Community-first", "Bold & direct",
  "Science-backed", "Sustainable & earnest"
];

const PSYCHOGRAPHIC_OPTIONS = [
  "Wellness-obsessed", "Design-conscious", "Clean beauty devotee",
  "Ingredient-educated", "Sustainability-driven", "Luxury seeker",
  "Health-first parent", "Active lifestyle", "Self-care ritualist",
  "Early adopter", "Community-oriented"
];

const COLOR_TREATMENT_OPTIONS = [
  { id: "full_color", label: "Full color", desc: "Vibrant and true to life" },
  { id: "muted_film", label: "Muted / film", desc: "Soft, slightly faded" },
  { id: "black_white", label: "Black & white", desc: "Timeless, high contrast" },
  { id: "warm_golden", label: "Warm & golden", desc: "Rich, sun-kissed tones" },
  { id: "dark_dramatic", label: "Dark & dramatic", desc: "Deep shadows, moody" },
];

const PEOPLE_OPTIONS = [
  { id: "no_people", label: "No people", desc: "Product and lifestyle only" },
  { id: "athletes", label: "Athletes", desc: "Active, performance-focused" },
  { id: "lifestyle_people", label: "Lifestyle", desc: "Real people, everyday moments" },
  { id: "mix", label: "Mix of both", desc: "People and product alternating" },
];

const FINISH_OPTIONS = [
  { id: "clean_clinical", label: "Clean & clinical", desc: "Sharp, precise" },
  { id: "bright_airy", label: "Bright & airy", desc: "Light, optimistic" },
  { id: "gritty_raw", label: "Gritty & raw", desc: "Unpolished, authentic" },
  { id: "luxury_refined", label: "Luxury & refined", desc: "Premium, aspirational" },
  { id: "natural_organic", label: "Natural & organic", desc: "Earthy, wholesome" },
];

const LOADING_STEPS = [
  "Visiting your website...",
  "Reading your products...",
  "Analyzing your brand voice...",
  "Understanding your customers...",
  "Building your brand DNA...",
  "Crafting your content strategy...",
  "Almost ready...",
];

const BUFFER_STEPS = [
  { step: "1", text: "Go to buffer.com and create a free account" },
  { step: "2", text: "Connect your Instagram Business account under Channels" },
  { step: "3", text: "Click your Instagram channel — copy the ID from the URL: buffer.com/channels/YOUR-ID/schedule" },
  { step: "4", text: "Paste that ID into the field above" },
];

function OptionPill({ label, desc, selected, onClick }: { label: string; desc: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: selected ? "rgba(196,168,130,0.1)" : "transparent", border: `0.5px solid ${selected ? "#C4A882" : "rgba(240,237,230,0.1)"}`, borderRadius: "10px", padding: "12px 14px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%", transition: "all 0.15s" }}>
      <div style={{ fontSize: "13px", fontWeight: 500, color: selected ? "#C4A882" : "#F0EDE6", marginBottom: "1px" }}>{label}</div>
      <div style={{ fontSize: "11px", color: "#6B6760" }}>{desc}</div>
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [bufferGuideOpen, setBufferGuideOpen] = useState(false);

  const [form, setForm] = useState({
    brand_name: "",
    brand_description: "",
    website_url: "",
    age_range: "25-34",
    gender: "All genders",
    psychographics: [] as string[],
    brand_voice: [] as string[],
    buffer_profile_id: "",
    image_color: "full_color",
    image_people: "mix",
    image_finish: "clean_clinical",
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/auth");
      else setChecking(false);
    });
  }, [router]);

  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep(prev => prev >= LOADING_STEPS.length - 1 ? prev : prev + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, [loading]);

  function updateField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleArrayItem(field: "brand_voice" | "psychographics", item: string) {
    setForm((prev) => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item] };
    });
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push(`/dashboard/${data.brand_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const inputStyle = { width: "100%", background: "#0A0A0A", border: "0.5px solid rgba(240,237,230,0.15)", borderRadius: "8px", padding: "14px 16px", fontSize: "15px", color: "#F0EDE6", outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" };
  const labelStyle = { display: "block", fontSize: "12px", fontWeight: 500, color: "#9E9A93", marginBottom: "8px", textTransform: "uppercase" as const, letterSpacing: "0.8px" };
  const pillActive = { padding: "8px 16px", borderRadius: "100px", fontSize: "13px", border: "0.5px solid #C4A882", cursor: "pointer" as const, fontFamily: "inherit", background: "#C4A882", color: "#0A0A0A", fontWeight: 500 };
  const pillInactive = { padding: "8px 16px", borderRadius: "100px", fontSize: "13px", border: "0.5px solid rgba(240,237,230,0.12)", cursor: "pointer" as const, fontFamily: "inherit", background: "transparent", color: "#6B6760" };
  const btnPrimary = (disabled: boolean) => ({ background: disabled ? "#1A1A18" : "#F0EDE6", color: disabled ? "#3A3835" : "#0A0A0A", border: "none", borderRadius: "100px", padding: "16px", fontSize: "15px", fontWeight: 600, cursor: disabled ? "not-allowed" as const : "pointer" as const, fontFamily: "inherit", width: "100%", transition: "all 0.2s" });
  const btnBack = { background: "transparent", color: "#6B6760", border: "0.5px solid rgba(240,237,230,0.1)", borderRadius: "100px", padding: "16px", fontSize: "15px", cursor: "pointer" as const, fontFamily: "inherit", flex: "0 0 80px" };

  if (checking) {
    return (
      <main style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#3A3835", fontSize: "14px", fontFamily: "'DM Sans', sans-serif" }}>Loading...</div>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: "360px", width: "100%" }}>
          <svg width="44" height="44" viewBox="0 0 32 32" fill="none" style={{ margin: "0 auto 40px", display: "block" }}>
            <rect width="32" height="32" rx="8" fill="#C4A882"/>
            <path d="M8 22 C8 22 12 10 16 10 C20 10 20 16 24 12" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="24" cy="12" r="2.5" fill="#0A0A0A"/>
            <circle cx="8" cy="22" r="2" fill="#0A0A0A"/>
          </svg>
          <div style={{ marginBottom: "40px" }}>
            {LOADING_STEPS.map((s, i) => (
              <div key={i} style={{ fontSize: "14px", fontWeight: i === loadingStep ? 500 : 300, color: i === loadingStep ? "#F0EDE6" : i < loadingStep ? "#4A4845" : "#222", marginBottom: "16px", transition: "all 0.5s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                {i < loadingStep && <span style={{ color: "#C4A882", fontSize: "11px" }}>✓</span>}
                {i === loadingStep && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#C4A882", display: "inline-block", flexShrink: 0 }} />}
                {i > loadingStep && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#1E1E1C", display: "inline-block", flexShrink: 0 }} />}
                {s}
              </div>
            ))}
          </div>
          <p style={{ fontSize: "12px", color: "#3A3835", lineHeight: 1.6 }}>
            Analyzing your brand and building your content strategy. About 30 seconds.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif", padding: "24px 16px 48px" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", marginBottom: "32px", paddingTop: "8px" }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#C4A882"/>
            <path d="M8 22 C8 22 12 10 16 10 C20 10 20 16 24 12" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="24" cy="12" r="2.5" fill="#0A0A0A"/>
            <circle cx="8" cy="22" r="2" fill="#0A0A0A"/>
          </svg>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "17px", color: "#F0EDE6" }}>Flow Social</span>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: "5px", marginBottom: "32px" }}>
          {[1, 2, 3, 4].map((s) => (
            <div key={s} style={{ height: "3px", flex: 1, borderRadius: "100px", background: s <= step ? "#C4A882" : "#1A1A18", transition: "background 0.3s" }} />
          ))}
        </div>

        {/* Card */}
        <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.07)", borderRadius: "16px", padding: "28px 24px" }}>

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "10px" }}>Step 1 of 4</div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "26px", color: "#F0EDE6", margin: "0 0 6px", lineHeight: 1.25 }}>Tell us about your brand</h2>
                <p style={{ fontSize: "14px", color: "#4A4845", margin: 0, lineHeight: 1.6 }}>We visit your website and analyze everything so your content is truly on-brand.</p>
              </div>
              <div>
                <label style={labelStyle}>Brand name</label>
                <input type="text" value={form.brand_name} onChange={(e) => updateField("brand_name", e.target.value)} placeholder="Your brand name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>What does your brand do?</label>
                <textarea value={form.brand_description} onChange={(e) => updateField("brand_description", e.target.value)} placeholder="What do you make or sell?" rows={3} style={{ ...inputStyle, resize: "none" }} />
              </div>
              <div>
                <label style={labelStyle}>Website URL</label>
                <input type="url" value={form.website_url} onChange={(e) => updateField("website_url", e.target.value)} placeholder="https://yourbrand.com" style={inputStyle} />
                <p style={{ fontSize: "12px", color: "#3A3835", marginTop: "6px" }}>We scan your site to understand your products and voice.</p>
              </div>
              <div>
                <label style={labelStyle}>Buffer Profile ID <span style={{ color: "#3A3835", fontSize: "10px", textTransform: "none", letterSpacing: 0 }}>(optional — add later in settings)</span></label>
                <input type="text" value={form.buffer_profile_id} onChange={(e) => updateField("buffer_profile_id", e.target.value)} placeholder="e.g. 68a9f9053d2fbc20d49ad446" style={inputStyle} />
                <button onClick={() => setBufferGuideOpen(!bufferGuideOpen)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "6px 0 0", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ fontSize: "12px", color: "#C4A882" }}>{bufferGuideOpen ? "▾" : "▸"} How to get your Buffer Profile ID</span>
                </button>
                {bufferGuideOpen && (
                  <div style={{ marginTop: "10px", background: "#0A0A0A", border: "0.5px solid rgba(196,168,130,0.12)", borderRadius: "10px", padding: "16px" }}>
                    <p style={{ fontSize: "12px", color: "#4A4845", margin: "0 0 12px", lineHeight: 1.6 }}>Buffer is the free tool Flow Social uses to schedule posts to Instagram. Setup takes 2 minutes.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {BUFFER_STEPS.map((s) => (
                        <div key={s.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                          <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(196,168,130,0.1)", border: "0.5px solid rgba(196,168,130,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                            <span style={{ fontSize: "10px", color: "#C4A882", fontWeight: 600 }}>{s.step}</span>
                          </div>
                          <p style={{ fontSize: "13px", color: "#6B6760", margin: 0, lineHeight: 1.5 }}>{s.text}</p>
                        </div>
                      ))}
                    </div>
                    <a href="https://buffer.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: "14px", fontSize: "12px", color: "#C4A882", textDecoration: "none", border: "0.5px solid rgba(196,168,130,0.25)", borderRadius: "100px", padding: "6px 14px" }}>Open Buffer →</a>
                  </div>
                )}
              </div>
              <button onClick={() => setStep(2)} disabled={!form.brand_name || !form.brand_description} style={btnPrimary(!form.brand_name || !form.brand_description)}>Continue</button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "10px" }}>Step 2 of 4</div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "26px", color: "#F0EDE6", margin: "0 0 6px", lineHeight: 1.25 }}>Who buys your product?</h2>
                <p style={{ fontSize: "14px", color: "#4A4845", margin: 0, lineHeight: 1.6 }}>Every post speaks directly to your customer when we know who they are.</p>
              </div>
              <div>
                <label style={labelStyle}>Age range</label>
                <select value={form.age_range} onChange={(e) => updateField("age_range", e.target.value)} style={inputStyle}>
                  {["18-24", "25-34", "35-44", "45+", "Mixed"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Gender</label>
                <select value={form.gender} onChange={(e) => updateField("gender", e.target.value)} style={inputStyle}>
                  {["Women", "Men", "Non-binary", "All genders"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Customer identity <span style={{ color: "#3A3835", fontSize: "10px", textTransform: "none", letterSpacing: 0 }}>— pick up to 5</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {PSYCHOGRAPHIC_OPTIONS.map((o) => (
                    <button key={o} onClick={() => toggleArrayItem("psychographics", o)} disabled={!form.psychographics.includes(o) && form.psychographics.length >= 5}
                      style={{ ...form.psychographics.includes(o) ? pillActive : pillInactive, opacity: !form.psychographics.includes(o) && form.psychographics.length >= 5 ? 0.25 : 1 }}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setStep(1)} style={btnBack}>Back</button>
                <button onClick={() => setStep(3)} disabled={form.psychographics.length === 0} style={{ ...btnPrimary(form.psychographics.length === 0), flex: 1, width: "auto" }}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "10px" }}>Step 3 of 4</div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "26px", color: "#F0EDE6", margin: "0 0 6px", lineHeight: 1.25 }}>What is your brand voice?</h2>
                <p style={{ fontSize: "14px", color: "#4A4845", margin: 0, lineHeight: 1.6 }}>This shapes how every caption sounds. Pick the tones that feel most like you.</p>
              </div>
              <div>
                <label style={labelStyle}>Brand voice <span style={{ color: "#3A3835", fontSize: "10px", textTransform: "none", letterSpacing: 0 }}>— pick up to 3</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {BRAND_VOICE_OPTIONS.map((o) => (
                    <button key={o} onClick={() => toggleArrayItem("brand_voice", o)} disabled={!form.brand_voice.includes(o) && form.brand_voice.length >= 3}
                      style={{ ...form.brand_voice.includes(o) ? pillActive : pillInactive, opacity: !form.brand_voice.includes(o) && form.brand_voice.length >= 3 ? 0.25 : 1 }}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p style={{ color: "#EF4444", fontSize: "13px", margin: 0 }}>{error}</p>}
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setStep(2)} style={btnBack}>Back</button>
                <button onClick={() => setStep(4)} disabled={form.brand_voice.length === 0} style={{ ...btnPrimary(form.brand_voice.length === 0), flex: 1, width: "auto" }}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "10px" }}>Step 4 of 4</div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "26px", color: "#F0EDE6", margin: "0 0 6px", lineHeight: 1.25 }}>How should your images look?</h2>
                <p style={{ fontSize: "14px", color: "#4A4845", margin: 0, lineHeight: 1.6 }}>These preferences shape every image in your feed.</p>
              </div>

              <div>
                <label style={labelStyle}>Color treatment</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {COLOR_TREATMENT_OPTIONS.map((o) => (
                    <OptionPill key={o.id} label={o.label} desc={o.desc} selected={form.image_color === o.id} onClick={() => updateField("image_color", o.id)} />
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>People in images</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {PEOPLE_OPTIONS.map((o) => (
                    <OptionPill key={o.id} label={o.label} desc={o.desc} selected={form.image_people === o.id} onClick={() => updateField("image_people", o.id)} />
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Overall finish</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {FINISH_OPTIONS.map((o) => (
                    <OptionPill key={o.id} label={o.label} desc={o.desc} selected={form.image_finish === o.id} onClick={() => updateField("image_finish", o.id)} />
                  ))}
                </div>
              </div>

              {error && <p style={{ color: "#EF4444", fontSize: "13px", margin: 0 }}>{error}</p>}

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setStep(3)} style={btnBack}>Back</button>
                <button onClick={handleSubmit} disabled={loading} style={{ ...btnPrimary(false), flex: 1, width: "auto" }}>
                  Build my brand DNA →
                </button>
              </div>
            </div>
          )}

        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#2A2825", marginTop: "20px" }}>
          14-day free trial. No credit card required.
        </p>

      </div>
    </main>
  );
}
