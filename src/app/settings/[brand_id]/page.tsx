"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

type BrandAsset = {
  id: string;
  public_url: string;
  storage_path: string;
  asset_type: string;
  label?: string;
  created_at: string;
};

type Brand = {
  id: string;
  brand_name: string;
  brand_description: string;
  website_url: string;
  buffer_profile_id: string;
  brand_voice: string[];
  target_audience: { age_range: string; gender: string; psychographics: string[] };
  brand_dna: {
    image_preferences?: { color: string; people: string; finish: string };
    image_style?: string;
  };
};

type SubStatus = "active" | "trialing" | "canceled" | "none";

function ImageOptionCard({ label, desc, selected, onClick }: { label: string; desc: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: selected ? "rgba(196,168,130,0.1)" : "transparent", border: `0.5px solid ${selected ? "#C4A882" : "rgba(240,237,230,0.1)"}`, borderRadius: "10px", padding: "12px 16px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%", transition: "all 0.15s" }}>
      <div style={{ fontSize: "13px", fontWeight: 500, color: selected ? "#C4A882" : "#F0EDE6", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "11px", color: "#6B6760" }}>{desc}</div>
    </button>
  );
}

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const brand_id = params.brand_id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [activeTab, setActiveTab] = useState<"brand" | "audience" | "images" | "assets">("brand");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [subStatus, setSubStatus] = useState<SubStatus>("none");
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [uploadingAssets, setUploadingAssets] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [form, setForm] = useState({
    brand_name: "",
    brand_description: "",
    website_url: "",
    buffer_profile_id: "",
    age_range: "25-34",
    gender: "All genders",
    psychographics: [] as string[],
    brand_voice: [] as string[],
    image_color: "full_color",
    image_people: "mix",
    image_finish: "clean_clinical",
  });

  useEffect(() => {
    loadBrand();
    loadSubStatus();
  }, [brand_id]);

  useEffect(() => {
    if (activeTab === "assets" && assets.length === 0 && !loadingAssets) {
      loadAssets();
    }
  }, [activeTab]);

  async function loadSubStatus() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("subscriptions")
      .select("status, trial_ends_at, current_period_ends_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setSubStatus(data.status as SubStatus);
      if (data.trial_ends_at) setTrialEndsAt(data.trial_ends_at);
    }
  }

  async function handleOpenPortal() {
    setOpeningPortal(true);
    try {
      const res = await fetch(`/api/stripe/portal?brand_id=${brand_id}`, { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else showMessage("Could not open billing portal", "error");
    } catch {
      showMessage("Could not open billing portal", "error");
    } finally {
      setOpeningPortal(false);
    }
  }

  async function loadBrand() {
    try {
      const res = await fetch(`/api/get-brand-full?brand_id=${brand_id}`);
      const data = await res.json();
      if (data.brand) {
        const b: Brand = data.brand;
        setForm({
          brand_name: b.brand_name || "",
          brand_description: b.brand_description || "",
          website_url: b.website_url || "",
          buffer_profile_id: b.buffer_profile_id || "",
          age_range: b.target_audience?.age_range || "25-34",
          gender: b.target_audience?.gender || "All genders",
          psychographics: b.target_audience?.psychographics || [],
          brand_voice: b.brand_voice || [],
          image_color: b.brand_dna?.image_preferences?.color || "full_color",
          image_people: b.brand_dna?.image_preferences?.people || "mix",
          image_finish: b.brand_dna?.image_preferences?.finish || "clean_clinical",
        });
        setLogoUrl(data.brand.logo_url || "");
      }
    } catch {
      showMessage("Failed to load brand settings", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadAssets() {
    setLoadingAssets(true);
    try {
      const res = await fetch(`/api/get-brand-assets?brand_id=${brand_id}`);
      const data = await res.json();
      if (data.assets) setAssets(data.assets);
    } catch {
      showMessage("Failed to load assets", "error");
    } finally {
      setLoadingAssets(false);
    }
  }

  async function handleAssetUpload(files: FileList | File[]) {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!validFiles.length) return;
    setUploadingAssets(true);
    try {
      const supabase = createClient();
      const newAssets: BrandAsset[] = [];
      for (const file of validFiles) {
        const ext = file.name.split(".").pop();
        const fileName = `brand_assets/${brand_id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("media").upload(fileName, file, { upsert: false });
        if (uploadError) { console.error("Upload error:", uploadError); continue; }
        const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
        const res = await fetch("/api/save-brand-asset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand_id, public_url: urlData.publicUrl, storage_path: fileName, asset_type: "photo" }),
        });
        if (res.ok) {
          const { asset } = await res.json();
          newAssets.push(asset);
        }
      }
      setAssets((prev) => [...newAssets, ...prev]);
      if (newAssets.length > 0) showMessage(`${newAssets.length} image${newAssets.length > 1 ? "s" : ""} uploaded`, "success");
    } catch {
      showMessage("Upload failed", "error");
    } finally {
      setUploadingAssets(false);
    }
  }

  async function handleDeleteAsset(asset: BrandAsset) {
    setDeletingAssetId(asset.id);
    try {
      const supabase = createClient();
      await supabase.storage.from("media").remove([asset.storage_path]);
      const res = await fetch("/api/delete-brand-asset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: asset.id }),
      });
      if (res.ok) setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } catch {
      showMessage("Failed to remove image", "error");
    } finally {
      setDeletingAssetId(null);
    }
  }

  function updateField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleArrayItem(field: "brand_voice" | "psychographics", item: string) {
    setForm((prev) => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item] };
    });
  }

  function showMessage(msg: string, type: "success" | "error") {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/update-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showMessage("Settings saved successfully", "success");
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerateDNA() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/regenerate-dna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showMessage("Brand DNA regenerated with your latest settings", "success");
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : "Failed to regenerate", "error");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const supabase = createClient();
      const filename = `logos/${brand_id}-${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("media").upload(filename, file, { upsert: true });
      if (error) throw new Error(error.message);
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(filename);
      setLogoUrl(urlData.publicUrl);
      await fetch("/api/update-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id, logo_url: urlData.publicUrl }),
      });
      showMessage("Logo uploaded successfully", "success");
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploadingLogo(false);
    }
  }

  const inputStyle = { width: "100%", background: "#0A0A0A", border: "0.5px solid rgba(240,237,230,0.15)", borderRadius: "8px", padding: "12px 16px", fontSize: "14px", color: "#F0EDE6", outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" };
  const labelStyle = { display: "block", fontSize: "12px", fontWeight: 500, color: "#9E9A93", marginBottom: "6px" };
  const pillActive = { padding: "6px 14px", borderRadius: "100px", fontSize: "12px", border: "0.5px solid #C4A882", cursor: "pointer" as const, fontFamily: "inherit", background: "#C4A882", color: "#0A0A0A", fontWeight: 500 };
  const pillInactive = { padding: "6px 14px", borderRadius: "100px", fontSize: "12px", border: "0.5px solid rgba(240,237,230,0.15)", cursor: "pointer" as const, fontFamily: "inherit", background: "transparent", color: "#9E9A93" };
  const tabActive = { background: "rgba(196,168,130,0.1)", color: "#C4A882", border: "0.5px solid rgba(196,168,130,0.3)", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer" as const, fontFamily: "inherit" };
  const tabInactive = { background: "transparent", color: "#6B6760", border: "0.5px solid transparent", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer" as const, fontFamily: "inherit" };

  const subLabel = subStatus === "active" ? { text: "Active", color: "#4ADE80", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)" }
    : subStatus === "trialing" ? { text: "Free trial", color: "#C4A882", bg: "rgba(196,168,130,0.08)", border: "rgba(196,168,130,0.25)" }
    : subStatus === "canceled" ? { text: "Canceled", color: "#FCA5A5", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.25)" }
    : null;

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#6B6760", fontSize: "14px", fontFamily: "'DM Sans', sans-serif" }}>Loading...</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0A", color: "#F0EDE6", fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ borderBottom: "0.5px solid rgba(240,237,230,0.08)", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#C4A882"/>
            <path d="M8 22 C8 22 12 10 16 10 C20 10 20 16 24 12" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="24" cy="12" r="2.5" fill="#0A0A0A"/>
            <circle cx="8" cy="22" r="2" fill="#0A0A0A"/>
          </svg>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "18px", color: "#F0EDE6", lineHeight: 1 }}>Flow Social</div>
            <div style={{ fontSize: "12px", color: "#6B6760", marginTop: "2px" }}>Brand Settings</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => router.push(`/dashboard/${brand_id}`)}
            style={{ background: "transparent", color: "#9E9A93", border: "0.5px solid rgba(240,237,230,0.15)", borderRadius: "100px", padding: "10px 20px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
            Back to dashboard
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ background: saving ? "#1E1E1C" : "#F0EDE6", color: saving ? "#4A4845" : "#0A0A0A", border: "none", borderRadius: "100px", padding: "10px 22px", fontSize: "13px", fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 24px" }}>
        {message && (
          <div style={{ marginBottom: "24px", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", background: messageType === "success" ? "rgba(196,168,130,0.1)" : "rgba(220,38,38,0.1)", border: `0.5px solid ${messageType === "success" ? "rgba(196,168,130,0.3)" : "rgba(220,38,38,0.3)"}`, color: messageType === "success" ? "#C4A882" : "#FCA5A5" }}>
            {message}
          </div>
        )}

        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "32px", color: "#F0EDE6", margin: "0 0 8px" }}>Brand settings</h1>
          <p style={{ fontSize: "14px", color: "#6B6760", margin: 0 }}>Update your brand profile, image style, and assets. Changes apply to all future content generations.</p>
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "32px", background: "#111111", padding: "6px", borderRadius: "10px", border: "0.5px solid rgba(240,237,230,0.06)" }}>
          {(["brand", "audience", "images", "assets"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={activeTab === tab ? tabActive : tabInactive}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "brand" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.06)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "18px", color: "#F0EDE6", margin: 0 }}>Brand basics</h3>
              <div>
                <label style={labelStyle}>Brand name</label>
                <input type="text" value={form.brand_name} onChange={(e) => updateField("brand_name", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>What does your brand do?</label>
                <textarea value={form.brand_description} onChange={(e) => updateField("brand_description", e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" }} />
              </div>
              <div>
                <label style={labelStyle}>Website URL</label>
                <input type="url" value={form.website_url} onChange={(e) => updateField("website_url", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Buffer Profile ID</label>
                <input type="text" value={form.buffer_profile_id} onChange={(e) => updateField("buffer_profile_id", e.target.value)} placeholder="e.g. 68a9f9053d2fbc20d49ad446" style={inputStyle} />
                <p style={{ fontSize: "11px", color: "#4A4845", marginTop: "4px" }}>Find this in your Buffer URL: buffer.com/channels/YOUR-ID/schedule</p>
              </div>
            </div>

            <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.06)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "18px", color: "#F0EDE6", margin: 0 }}>Brand voice</h3>
              <p style={{ fontSize: "13px", color: "#6B6760", margin: 0 }}>Pick up to 3 tones that shape how your captions are written.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {BRAND_VOICE_OPTIONS.map((o) => (
                  <button key={o} onClick={() => toggleArrayItem("brand_voice", o)} disabled={!form.brand_voice.includes(o) && form.brand_voice.length >= 3}
                    style={{ ...form.brand_voice.includes(o) ? pillActive : pillInactive, opacity: !form.brand_voice.includes(o) && form.brand_voice.length >= 3 ? 0.3 : 1 }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: "rgba(196,168,130,0.06)", border: "0.5px solid rgba(196,168,130,0.2)", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "#C4A882", marginBottom: "4px" }}>Regenerate brand DNA</div>
                <div style={{ fontSize: "12px", color: "#6B6760", lineHeight: 1.5 }}>Re-scrapes your website and rebuilds your content strategy with your latest settings.</div>
              </div>
              <button onClick={handleRegenerateDNA} disabled={regenerating}
                style={{ background: regenerating ? "#1E1E1C" : "transparent", color: regenerating ? "#4A4845" : "#C4A882", border: "0.5px solid rgba(196,168,130,0.4)", borderRadius: "100px", padding: "10px 20px", fontSize: "13px", fontWeight: 500, cursor: regenerating ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const }}>
                {regenerating ? "Regenerating..." : "Regenerate →"}
              </button>
            </div>

            {/* Billing section */}
            <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.06)", borderRadius: "12px", padding: "24px" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "18px", color: "#F0EDE6", margin: "0 0 16px" }}>Billing</h3>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", color: "#9E9A93" }}>Flow Social Pro</span>
                    {subLabel && (
                      <span style={{ fontSize: "11px", fontWeight: 500, color: subLabel.color, background: subLabel.bg, border: `0.5px solid ${subLabel.border}`, borderRadius: "100px", padding: "2px 8px" }}>
                        {subLabel.text}
                      </span>
                    )}
                  </div>
                  {subStatus === "trialing" && trialEndsAt && (
                    <div style={{ fontSize: "12px", color: "#4A4845" }}>
                      Trial ends {new Date(trialEndsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  )}
                  {subStatus === "none" && (
                    <div style={{ fontSize: "12px", color: "#4A4845" }}>No active subscription</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {subStatus === "active" || subStatus === "trialing" ? (
                    <button onClick={handleOpenPortal} disabled={openingPortal}
                      style={{ background: "transparent", color: openingPortal ? "#4A4845" : "#9E9A93", border: "0.5px solid rgba(240,237,230,0.15)", borderRadius: "100px", padding: "8px 16px", fontSize: "12px", cursor: openingPortal ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                      {openingPortal ? "Opening..." : "Manage subscription"}
                    </button>
                  ) : (
                    <button onClick={() => router.push("/upgrade")}
                      style={{ background: "#C4A882", color: "#0A0A0A", border: "none", borderRadius: "100px", padding: "8px 16px", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                      Upgrade now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "audience" && (
          <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.06)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "18px", color: "#F0EDE6", margin: 0 }}>Target audience</h3>
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
              <label style={labelStyle}>Customer identity — pick up to 5</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {PSYCHOGRAPHIC_OPTIONS.map((o) => (
                  <button key={o} onClick={() => toggleArrayItem("psychographics", o)} disabled={!form.psychographics.includes(o) && form.psychographics.length >= 5}
                    style={{ ...form.psychographics.includes(o) ? pillActive : pillInactive, opacity: !form.psychographics.includes(o) && form.psychographics.length >= 5 ? 0.3 : 1 }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "images" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.06)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "18px", color: "#F0EDE6", margin: 0 }}>Color treatment</h3>
              {COLOR_TREATMENT_OPTIONS.map((o) => (
                <ImageOptionCard key={o.id} label={o.label} desc={o.desc} selected={form.image_color === o.id} onClick={() => updateField("image_color", o.id)} />
              ))}
            </div>
            <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.06)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "18px", color: "#F0EDE6", margin: 0 }}>People in images</h3>
              {PEOPLE_OPTIONS.map((o) => (
                <ImageOptionCard key={o.id} label={o.label} desc={o.desc} selected={form.image_people === o.id} onClick={() => updateField("image_people", o.id)} />
              ))}
            </div>
            <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.06)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "18px", color: "#F0EDE6", margin: 0 }}>Overall finish</h3>
              {FINISH_OPTIONS.map((o) => (
                <ImageOptionCard key={o.id} label={o.label} desc={o.desc} selected={form.image_finish === o.id} onClick={() => updateField("image_finish", o.id)} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "assets" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.06)", borderRadius: "12px", padding: "24px" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "18px", color: "#F0EDE6", margin: "0 0 8px" }}>Brand logo</h3>
              <p style={{ fontSize: "13px", color: "#6B6760", margin: "0 0 20px", lineHeight: 1.6 }}>Your logo is used as a reference across future brand features.</p>
              {logoUrl && (
                <div style={{ marginBottom: "16px", width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", background: "#1A1A18" }}>
                  <img src={logoUrl} alt="Brand logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
              )}
              <label style={{ display: "inline-block", background: uploadingLogo ? "#1E1E1C" : "transparent", color: uploadingLogo ? "#4A4845" : "#F0EDE6", border: "0.5px solid rgba(240,237,230,0.15)", borderRadius: "100px", padding: "10px 20px", fontSize: "13px", cursor: uploadingLogo ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {uploadingLogo ? "Uploading..." : logoUrl ? "Replace logo" : "Upload logo"}
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} disabled={uploadingLogo} />
              </label>
            </div>
            <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.06)", borderRadius: "12px", padding: "24px" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "18px", color: "#F0EDE6", margin: "0 0 6px" }}>Brand image library</h3>
              <p style={{ fontSize: "13px", color: "#6B6760", margin: "0 0 20px", lineHeight: 1.6 }}>
                Upload your product shots and lifestyle photos. When you generate content, your images will make up roughly 60% of the week — the rest is filled with curated stock photography matching your brand aesthetic.
              </p>
              <div
                onClick={() => document.getElementById("asset-file-input")?.click()}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleAssetUpload(e.dataTransfer.files); }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                style={{ border: `1.5px dashed ${dragOver ? "#C4A882" : "rgba(240,237,230,0.12)"}`, borderRadius: "10px", padding: "28px 16px", textAlign: "center", cursor: "pointer", transition: "all 0.15s", background: dragOver ? "rgba(196,168,130,0.04)" : "transparent", marginBottom: "20px" }}>
                <input id="asset-file-input" type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => e.target.files && handleAssetUpload(e.target.files)} />
                {uploadingAssets ? (
                  <div style={{ color: "#C4A882", fontSize: "13px" }}>Uploading...</div>
                ) : (
                  <>
                    <div style={{ fontSize: "22px", marginBottom: "8px", color: "#3A3835" }}>+</div>
                    <div style={{ color: "#9E9A93", fontSize: "13px", marginBottom: "4px" }}>Drop images here or tap to upload</div>
                    <div style={{ color: "#4A4845", fontSize: "11px" }}>JPG, PNG, WEBP — multiple files at once</div>
                  </>
                )}
              </div>
              {loadingAssets ? (
                <div style={{ textAlign: "center", padding: "24px", color: "#4A4845", fontSize: "13px" }}>Loading...</div>
              ) : assets.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#3A3835", fontSize: "13px" }}>
                  No images uploaded yet. Your feed will use curated stock photos until you add your own.
                </div>
              ) : (
                <>
                  <div style={{ fontSize: "11px", color: "#6B6760", marginBottom: "12px" }}>
                    {assets.length} image{assets.length !== 1 ? "s" : ""} in your library
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px" }}>
                    {assets.map((asset) => (
                      <div key={asset.id}
                        style={{ position: "relative", aspectRatio: "1", borderRadius: "8px", overflow: "hidden", background: "#1A1A18" }}
                        onMouseEnter={(e) => { const o = e.currentTarget.querySelector(".asset-del") as HTMLElement; if (o) o.style.opacity = "1"; }}
                        onMouseLeave={(e) => { const o = e.currentTarget.querySelector(".asset-del") as HTMLElement; if (o) o.style.opacity = "0"; }}>
                        <img src={asset.public_url} alt="Brand asset" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div className="asset-del" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s" }}>
                          <button onClick={() => handleDeleteAsset(asset)} disabled={deletingAssetId === asset.id}
                            style={{ background: "rgba(220,38,38,0.85)", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>
                            {deletingAssetId === asset.id ? "..." : "Remove"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "0.5px solid rgba(240,237,230,0.06)", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={handleSave} disabled={saving}
            style={{ background: saving ? "#1E1E1C" : "#F0EDE6", color: saving ? "#4A4845" : "#0A0A0A", border: "none", borderRadius: "100px", padding: "14px 32px", fontSize: "15px", fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </main>
  );
}
