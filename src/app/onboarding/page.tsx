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
  { id: "muted_film", label: "Muted / film", desc: "Soft, slightly faded, editorial" },
  { id: "black_white", label: "Black and white", desc: "Timeless, high contrast" },
  { id: "warm_golden", label: "Warm and golden", desc: "Rich, sun-kissed tones" },
  { id: "dark_dramatic", label: "Dark and dramatic", desc: "Deep shadows, moody" },
];

const PEOPLE_OPTIONS = [
  { id: "no_people", label: "No people", desc: "Product and lifestyle only" },
  { id: "athletes", label: "Athletes", desc: "Active, performance-focused" },
  { id: "lifestyle_people", label: "Lifestyle", desc: "Real people, everyday moments" },
  { id: "mix", label: "Mix of both", desc: "People and product alternating" },
];

const FINISH_OPTIONS = [
  { id: "clean_clinical", label: "Clean and clinical", desc: "Sharp, precise, scientific" },
  { id: "bright_airy", label: "Bright and airy", desc: "Light, open, optimistic" },
  { id: "gritty_raw", label: "Gritty and raw", desc: "Unpolished, authentic, real" },
  { id: "luxury_refined", label: "Luxury and refined", desc: "Premium, aspirational" },
  { id: "natural_organic", label: "Natural and organic", desc: "Earthy, wholesome, real" },
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
      if (!session) {
        router.push("/auth");
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev >= LOADING_STEPS.length - 1) return prev;
        return prev + 1;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [loading]);

  function updateField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleArrayItem(field: "brand_voice" | "psychographics", item: string) {
    setForm((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item],
      };
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

  if (checking) {
    return (
      <main style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#6B6760", fontSize: "14px", fontFamily: "'DM Sans', sans-serif" }}>Loading...</div>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none" style={{ margin: "0 auto 32px", display: "block" }}>
            <rect width="32" height="32" rx="8" fill="#C4A882"/>
            <path d="M8 22 C8 22 12 10 16 10 C20 10 20 16 24 12" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="24" cy="12" r="2.5" fill="#0A0A0A"/>
            <circle cx="8" cy="22" r="2" fill="#0A0A0A"/>
          </svg>
          <div style={{ marginBottom: "48px" }}>
            {LOADING_STEPS.map((s, i) => (
              <div key={i} style={{ fontSize: "15px", fontWeight: i === loadingStep ? 500 : 300, color: i === loadingStep ? "#F0EDE6" : "#2A2825", marginBottom: "14px", transition: "all 0.5s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                {i < loadingStep && <span style={{ color: "#C4A882", fontSize: "12px" }}>✓</span>}
                {i === loadingStep && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#C4A882", display: "inline-block" }} />}
                {i > loadingStep && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1E1E1C", display: "inline-block" }} />}
                {s}
              </div>
            ))}
          </div>
          <p style={{ fontSize: "13px", color: "#4A4845", lineHeight: 1.6 }}>
            Analyzing your brand and building a custom content strategy. This takes about 30 seconds.
          </p>
        </div>
      </main>
    );
  }

  const inputStyle = { width: "100%", background: "#0A0A0A", border: "0.5px solid rgba(240,237,230,0.15)", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", color: "#F0EDE6", outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" };
  const labelStyle = { display: "block", fontSize: "13px", fontWeight: 500, color: "#9E9A93", marginBottom: "8px" };
  const btnPrimary = (disabled: boolean) => ({ background: disabled ? "#1E1E1C" : "#F0EDE6", color: disabled ? "#4A4845" : "#0A0A0A", border: "none", borderRadius: "100px", padding: "16px", fontSize: "15px", fontWeight: 500, cursor: disabled ? "not-allowed" as const : "pointer" as const, fontFamily: "inherit", transition: "all 0.2s", width: "100%" });
  const btnBack = { flex: 1, background: "transparent", color: "#9E9A93", border: "0.5px solid rgba(240,237,230,0.15)", borderRadius: "100px", padding: "14px", fontSize: "15px", cursor: "pointer" as const, fontFamily: "inherit" };
  const pillActive = { padding: "8px 16px", borderRadius: "100px", fontSize: "13px", border: "0.5px solid #C4A882", cursor: "pointer" as const, fontFamily: "inherit", background: "#C4A882", color: "#0A0A0A", fontWeight: 500 };
  const pillInactive = { padding: "8px 16px", borderRadius: "100px", fontSize: "13px", border: "0.5px solid rgba(240,237,230,0.15)", cursor: "pointer" as const, fontFamily: "inherit", background: "transparent", color: "#9E9A93", fontWeight: 400 };

  function ImageOptionCard({ id, label, desc, selected, onClick }: { id: string, label: string, desc: string, selected: boolean, onClick: () => void }) {
    return (
      <button onClick={onClick} style={{ background: selected ? "rgba(196,168,130,0.1)" : "transparent", border: `0.5px solid ${selected ? "#C4A882" : "rgba(240,237,230,0.1)"}`, borderRadius: "10px", padding: "14px 16px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%", transition: "all 0.15s" }}>
        <div style={{ fontSize: "14px", fontWeight: 500, color: selected ? "#C4A882" : "#F0EDE6", marginBottom: "3px" }}>{label}</div>
        <div style={{ fontSize: "12px", color: "#6B6760" }}>{desc}</div>
      </button>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "520px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "40px", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#C4A882"/>
            <path d="M8 22 C8 22 12 10 16 10 C20 10 20 16 24 12" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="24" cy="12" r="2.5" fill="#0A0A0A"/>
            <circle cx="8" cy="22" r="2" fill="#0A0A0A"/>
          </svg>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "18px", color: "#F0EDE6" }}>Flow Social</span>
        </div>

        <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.08)", borderRadius: "16px", padding: "40px" }}>
          <div style={{ display: "flex", gap: "6px", marginBottom: "32px" }}>
            {[1, 2, 3, 4].map((s) => (
              <div key={s} style={{ height: "3px", flex: 1, borderRadius: "100px", background: s <= step ? "#C4A882" : "#1E1E1C", transition: "background 0.3s" }} />
            ))}
          </div>

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "8px" }}>Step 1 of 4</div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#F0EDE6", margin: "0 0 4px" }}>Tell us about your brand</h2>
                <p style={{ fontSize: "14px", color: "#6B6760", margin: 0, lineHeight: 1.6 }}>We will visit your website and analyze everything so your content is truly on-brand.</p>
              </div>
              <div>
                <label style={labelStyle}>Brand name</label>
                <input type="text" value={form.brand_name} onChange={(e) => updateField("brand_name", e.target.value)} placeholder="Your brand name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>What does your brand do?</label>
                <textarea value={form.brand_description} onChange={(e) => updateField("brand_description", e.target.value)} placeholder="What does your brand make or do?" rows={3} style={{ ...inputStyle, resize: "none" }} />
              </div>
              <div>
                <label style={labelStyle}>Website URL</label>
                <input type="url" value={form.website_url} onChange={(e) => updateField("website_url", e.target.value)} placeholder="https://yourbrand.com" style={inputStyle} />
                <p style={{ fontSize: "12px", color: "#4A4845", marginTop: "6px" }}>We will scan your site to understand your products and brand voice.</p>
              </div>
              <div>
                <label style={labelStyle}>Buffer Profile ID</label>
                <input type="text" value={form.buffer_profile_id} onChange={(e) => updateField("buffer_profile_id", e.target.value)} placeholder="Paste your Buffer Profile ID here" style={inputStyle} />
                <button
                  onClick={() => setBufferGuideOpen(!bufferGuideOpen)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "6px 0 0", display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <span style={{ fontSize: "12px", color: "#C4A882" }}>
                    {bufferGuideOpen ? "▾" : "▸"} How to set up Buffer and get your Profile ID
                  </span>
                </button>
                {bufferGuideOpen && (
                  <div style={{ marginTop: "10px", background: "#0A0A0A", border: "0.5px solid rgba(196,168,130,0.15)", borderRadius: "10px", padding: "16px 18px" }}>
                    <p style={{ fontSize: "12px", color: "#6B6760", margin: "0 0 12px", lineHeight: 1.5 }}>
                      Buffer is the free tool Flow Social uses to schedule your posts to Instagram. Setup takes about 2 minutes.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {BUFFER_STEPS.map((s) => (
                        <div key={s.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                          <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(196,168,130,0.15)", border: "0.5px solid rgba(196,168,130,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                            <span style={{ fontSize: "10px", color: "#C4A882", fontWeight: 600 }}>{s.step}</span>
                          </div>
                          <p style={{ fontSize: "13px", color: "#9E9A93", margin: 0, lineHeight: 1.5 }}>{s.text}</p>
                        </div>
                      ))}
                    </div>
                    
                    <a
                      href="https://buffer.com"
                      rel="noopener noreferrer"
                      style={{ display: "inline-block", marginTop: "14px", fontSize: "12px", color: "#C4A882", textDecoration: "none", border: "0.5px solid rgba(196,168,130,0.3)", borderRadius: "100px", padding: "6px 14px" }}
                    >
                      Open Buffer
                    </a>
                  </div>
                )}
              </div>
              <button onClick={() => setStep(2)} disabled={!form.brand_name || !form.brand_description} style={btnPrimary(!form.brand_name || !form.brand_description)}>Continue</button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "8px" }}>Step 2 of 4</div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#F0EDE6", margin: "0 0 4px" }}>Who buys your product?</h2>
                <p style={{ fontSize: "14px", color: "#6B6760", margin: 0, lineHeight: 1.6 }}>Help us understand your customer so every post speaks directly to them.</p>
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
                <label style={labelStyle}>Your customer identity — pick up to 5</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {PSYCHOGRAPHIC_OPTIONS.map((o) => (
                    <button key={o} onClick={() => toggleArrayItem("psychographics", o)} disabled={!form.psychographics.includes(o) && form.psychographics.length >= 5}
                      style={{ ...form.psychographics.includes(o) ? pillActive : pillInactive, opacity: !form.psychographics.includes(o) && form.psychographics.length >= 5 ? 0.3 : 1 }}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => setStep(1)} style={btnBack}>Back</button>
                <button onClick={() => setStep(3)} disabled={form.psychographics.length === 0} style={{ ...btnPrimary(form.psychographics.length === 0), width: "auto", flex: 1 }}>Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "8px" }}>Step 3 of 4</div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#F0EDE6", margin: "0 0 4px" }}>What is your brand voice?</h2>
                <p style={{ fontSize: "14px", color: "#6B6760", margin: 0, lineHeight: 1.6 }}>This shapes how every caption is written. Pick the tones that feel most like your brand.</p>
              </div>
              <div>
                <label style={labelStyle}>Brand voice — pick up to 3</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {BRAND_VOICE_OPTIONS.map((o) => (
                    <button key={o} onClick={() => toggleArrayItem("brand_voice", o)} disabled={!form.brand_voice.includes(o) && form.brand_voice.length >= 3}
                      style={{ ...form.brand_voice.includes(o) ? pillActive : pillInactive, opacity: !form.brand_voice.includes(o) && form.brand_voice.length >= 3 ? 0.3 : 1 }}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p style={{ color: "#EF4444", fontSize: "14px", margin: 0 }}>{error}</p>}
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => setStep(2)} style={btnBack}>Back</button>
                <button onClick={() => setStep(4)} disabled={form.brand_voice.length === 0} style={{ ...btnPrimary(form.brand_voice.length === 0), width: "auto", flex: 1 }}>Continue</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "8px" }}>Step 4 of 4</div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#F0EDE6", margin: "0 0 4px" }}>How should your images look?</h2>
                <p style={{ fontSize: "14px", color: "#6B6760", margin: 0, lineHeight: 1.6 }}>These preferences shape every image we generate for your brand.</p>
              </div>
              <div>
                <label style={labelStyle}>Color treatment</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {COLOR_TREATMENT_OPTIONS.map((o) => (
                    <ImageOptionCard key={o.id} id={o.id} label={o.label} desc={o.desc} selected={form.image_color === o.id} onClick={() => updateField("image_color", o.id)} />
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>People in images</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {PEOPLE_OPTIONS.map((o) => (
                    <ImageOptionCard key={o.id} id={o.id} label={o.label} desc={o.desc} selected={form.image_people === o.id} onClick={() => updateField("image_people", o.id)} />
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Overall finish</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {FINISH_OPTIONS.map((o) => (
                    <ImageOptionCard key={o.id} id={o.id} label={o.label} desc={o.desc} selected={form.image_finish === o.id} onClick={() => updateField("image_finish", o.id)} />
                  ))}
                </div>
              </div>
              {error && <p style={{ color: "#EF4444", fontSize: "14px", margin: 0 }}>{error}</p>}
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => setStep(3)} style={btnBack}>Back</button>
                <button onClick={handleSubmit} disabled={loading} style={{ ...btnPrimary(false), width: "auto", flex: 1 }}>Build my brand DNA</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
