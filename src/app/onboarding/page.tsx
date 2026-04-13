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

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    brand_name: "",
    brand_description: "",
    website_url: "",
    age_range: "25-34",
    gender: "All genders",
    psychographics: [] as string[],
    brand_voice: [] as string[],
    reference_accounts: ["", "", ""],
    buffer_profile_id: "",
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

  function updateReferenceAccount(index: number, value: string) {
    const updated = [...form.reference_accounts];
    updated[index] = value;
    updateField("reference_accounts", updated);
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
      <main style={{ minHeight: "100vh", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#6B7280", fontSize: "14px" }}>Loading...</div>
      </main>
    );
  }

  const inputStyle = { width: "100%", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", color: "#111827", outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" };
  const labelStyle = { display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" };
  const btnPrimary = { width: "100%", background: "#000", color: "#fff", border: "none", borderRadius: "100px", padding: "14px", fontSize: "15px", fontWeight: 500, cursor: "pointer", transition: "opacity 0.2s", fontFamily: "inherit" };
  const btnSecondary = { flex: 1, background: "#fff", color: "#4B5563", border: "1px solid #E5E7EB", borderRadius: "100px", padding: "14px", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" };

  return (
    <main style={{ minHeight: "100vh", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #F3F4F6", maxWidth: "560px", width: "100%", padding: "40px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>

        {/* Progress */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ height: "4px", flex: 1, borderRadius: "100px", background: s <= step ? "#000" : "#E5E7EB" }} />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: 0 }}>Your brand</h2>
            <div>
              <label style={labelStyle}>Brand name</label>
              <input type="text" value={form.brand_name} onChange={(e) => updateField("brand_name", e.target.value)} placeholder="e.g. Headstrong" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>One sentence: what does your brand do?</label>
              <textarea value={form.brand_description} onChange={(e) => updateField("brand_description", e.target.value)} placeholder="e.g. We make brain-first supplements for contact sport athletes." rows={3} style={{ ...inputStyle, resize: "none" }} />
            </div>
            <div>
              <label style={labelStyle}>Website URL</label>
              <input type="url" value={form.website_url} onChange={(e) => updateField("website_url", e.target.value)} placeholder="https://yourbrand.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Buffer Profile ID</label>
              <input type="text" value={form.buffer_profile_id} onChange={(e) => updateField("buffer_profile_id", e.target.value)} placeholder="e.g. 68a9f9053d2fbc20d49ad446" style={inputStyle} />
              <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>Find this in your Buffer URL: buffer.com/channels/YOUR-ID/schedule</p>
            </div>
            <button onClick={() => setStep(2)} disabled={!form.brand_name || !form.brand_description} style={{ ...btnPrimary, opacity: !form.brand_name || !form.brand_description ? 0.3 : 1 }}>Continue</button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: 0 }}>Your audience</h2>
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
              <label style={labelStyle}>Your customer identity (pick up to 5)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {PSYCHOGRAPHIC_OPTIONS.map((o) => (
                  <button key={o} onClick={() => toggleArrayItem("psychographics", o)} disabled={!form.psychographics.includes(o) && form.psychographics.length >= 5}
                    style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "13px", border: "1px solid", cursor: "pointer", fontFamily: "inherit", background: form.psychographics.includes(o) ? "#000" : "#fff", color: form.psychographics.includes(o) ? "#fff" : "#4B5563", borderColor: form.psychographics.includes(o) ? "#000" : "#E5E7EB", opacity: !form.psychographics.includes(o) && form.psychographics.length >= 5 ? 0.3 : 1 }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setStep(1)} style={btnSecondary}>Back</button>
              <button onClick={() => setStep(3)} disabled={form.psychographics.length === 0} style={{ ...btnPrimary, flex: 1, width: "auto", opacity: form.psychographics.length === 0 ? 0.3 : 1 }}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: 0 }}>Your voice</h2>
            <div>
              <label style={labelStyle}>Brand voice (pick up to 3)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {BRAND_VOICE_OPTIONS.map((o) => (
                  <button key={o} onClick={() => toggleArrayItem("brand_voice", o)} disabled={!form.brand_voice.includes(o) && form.brand_voice.length >= 3}
                    style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "13px", border: "1px solid", cursor: "pointer", fontFamily: "inherit", background: form.brand_voice.includes(o) ? "#000" : "#fff", color: form.brand_voice.includes(o) ? "#fff" : "#4B5563", borderColor: form.brand_voice.includes(o) ? "#000" : "#E5E7EB", opacity: !form.brand_voice.includes(o) && form.brand_voice.length >= 3 ? 0.3 : 1 }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>3 Instagram accounts whose aesthetic you want to match</label>
              {form.reference_accounts.map((account, i) => (
                <input key={i} type="text" value={account} onChange={(e) => updateReferenceAccount(i, e.target.value)} placeholder="@handle" style={{ ...inputStyle, marginBottom: "8px" }} />
              ))}
            </div>
            {error && <p style={{ color: "#EF4444", fontSize: "14px", margin: 0 }}>{error}</p>}
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setStep(2)} style={btnSecondary}>Back</button>
              <button onClick={handleSubmit} disabled={loading || form.brand_voice.length === 0} style={{ ...btnPrimary, flex: 1, width: "auto", opacity: loading || form.brand_voice.length === 0 ? 0.3 : 1 }}>
                {loading ? "Analyzing your brand..." : "Generate my content →"}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
