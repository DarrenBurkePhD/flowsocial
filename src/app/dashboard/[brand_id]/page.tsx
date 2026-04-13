"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

type ContentPiece = {
  day: number;
  post_date: string;
  content_type: string;
  content_pillar: string;
  concept: string;
  caption: string;
  hashtags: string[];
  cta: string;
  image_prompt: string;
  posting_time: string;
  status: string;
  image_url?: string;
  buffer_id?: string;
};

type Brand = {
  id: string;
  brand_name: string;
  brand_description: string;
  buffer_profile_id?: string;
  brand_dna?: { image_style?: string };
};

type ContentPackage = {
  id: string;
  status: string;
  content_pieces: ContentPiece[];
  week_start_date: string;
};

function getWeekDates(startDate: string) {
  const dates = [];
  const start = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push({
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      date: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      full: date.toISOString().split("T")[0],
    });
  }
  return dates;
}

function formatScheduledTime(post_date: string, posting_time: string) {
  const date = new Date(`${post_date}T${posting_time}:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " at " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const brand_id = params.brand_id as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [contentPackage, setContentPackage] = useState<ContentPackage | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingImages, setGeneratingImages] = useState<number[]>([]);
  const [approvingIndex, setApprovingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState("");

  useEffect(() => {
    fetchBrand();
    fetchLatestPackage();
  }, [brand_id]);

  async function fetchBrand() {
    const res = await fetch(`/api/get-brand?brand_id=${brand_id}`);
    const data = await res.json();
    if (data.brand) setBrand(data.brand);
  }

  async function fetchLatestPackage() {
    const res = await fetch(`/api/get-package?brand_id=${brand_id}`);
    const data = await res.json();
    if (data.package) setContentPackage(data.package);
  }

  async function generateContent() {
    setGenerating(true);
    setMessage("");
    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContentPackage({
        id: data.package_id,
        status: "ready_for_review",
        content_pieces: data.content_pieces,
        week_start_date: new Date().toISOString().split("T")[0],
      });
      showMessage("7 posts generated. Add images and approve to schedule.", "success");
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : "Generation failed", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function generateImage(index: number) {
    if (!contentPackage) return;
    setGeneratingImages((prev) => [...prev, index]);
    try {
      const piece = contentPackage.content_pieces[index];
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_prompt: piece.image_prompt,
          content_type: piece.content_type,
          image_style: brand?.brand_dna?.image_style || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updated = [...contentPackage.content_pieces];
      updated[index] = { ...updated[index], image_url: data.image_url };
      setContentPackage({ ...contentPackage, content_pieces: updated });
      await persistPieces(contentPackage.id, updated);
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : "Image generation failed", "error");
    } finally {
      setGeneratingImages((prev) => prev.filter((i) => i !== index));
    }
  }

  async function persistPieces(packageId: string, pieces: ContentPiece[]) {
    await fetch("/api/update-package", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ package_id: packageId, content_pieces: pieces }),
    });
  }

  function showMessage(msg: string, type: "success" | "error") {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  }

  async function toggleApprove(index: number) {
    if (!contentPackage || approvingIndex === index) return;

    const piece = contentPackage.content_pieces[index];

    if (piece.status !== "approved" && !piece.image_url) {
      showMessage("Add an image first — Instagram requires one.", "error");
      return;
    }

    setApprovingIndex(index);
    const updated = [...contentPackage.content_pieces];
    const newStatus = updated[index].status === "approved" ? "pending" : "approved";
    updated[index] = { ...updated[index], status: newStatus };
    setContentPackage({ ...contentPackage, content_pieces: updated });
    await persistPieces(contentPackage.id, updated);

    if (newStatus === "approved") {
      if (!brand?.buffer_profile_id) {
        showMessage("Approved locally. Add your Buffer Profile ID in settings to auto-schedule.", "error");
        setApprovingIndex(null);
        return;
      }
      try {
        const cleanHashtags = piece.hashtags.map((h) => `#${h.replace(/#/g, "")}`).join(" ");
        const fullCaption = `${piece.caption}\n\n${piece.cta}\n\n${cleanHashtags}`;
        const scheduledAt = new Date(`${piece.post_date}T${piece.posting_time}:00`);
        const scheduledTimestamp = Math.floor(scheduledAt.getTime() / 1000);

        const res = await fetch("/api/push-single-to-buffer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile_id: brand.buffer_profile_id,
            text: fullCaption,
            scheduled_at: scheduledTimestamp,
            image_url: piece.image_url || null,
            content_type: piece.content_type,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        updated[index] = { ...updated[index], buffer_id: data.buffer_id };
        setContentPackage({ ...contentPackage, content_pieces: updated });
        await persistPieces(contentPackage.id, updated);
        showMessage(`Scheduled for ${formatScheduledTime(piece.post_date, piece.posting_time)}`, "success");
      } catch (err: unknown) {
        showMessage(err instanceof Error ? err.message : "Buffer scheduling failed", "error");
      }
    } else {
      showMessage("Post removed from schedule.", "success");
    }

    setApprovingIndex(null);
  }

  function saveCaption(index: number) {
    if (!contentPackage) return;
    const updated = [...contentPackage.content_pieces];
    updated[index] = { ...updated[index], caption: editingCaption };
    setContentPackage({ ...contentPackage, content_pieces: updated });
    persistPieces(contentPackage.id, updated);
    setSelectedPiece(null);
  }

  const approvedCount = contentPackage?.content_pieces.filter((p) => p.status === "approved").length ?? 0;
  const weekDates = contentPackage ? getWeekDates(contentPackage.week_start_date) : [];

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0A", color: "#F0EDE6", fontFamily: "'DM Sans', sans-serif" }}>

      <nav style={{ background: "#0A0A0A", borderBottom: "0.5px solid rgba(240,237,230,0.08)", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#C4A882"/>
            <path d="M8 22 C8 22 12 10 16 10 C20 10 20 16 24 12" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="24" cy="12" r="2.5" fill="#0A0A0A"/>
            <circle cx="8" cy="22" r="2" fill="#0A0A0A"/>
          </svg>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "18px", color: "#F0EDE6", lineHeight: 1 }}>Flow Social</div>
            {brand && <div style={{ fontSize: "12px", color: "#6B6760", marginTop: "2px" }}>{brand.brand_name}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => router.push(`/settings/${brand_id}`)}
            style={{ background: "transparent", color: "#6B6760", border: "0.5px solid rgba(240,237,230,0.1)", borderRadius: "100px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
            Settings
          </button>
          <button onClick={generateContent} disabled={generating}
            style={{ background: generating ? "#1E1E1C" : "#F0EDE6", color: generating ? "#4A4845" : "#0A0A0A", border: "none", borderRadius: "100px", padding: "10px 22px", fontSize: "13px", fontWeight: 500, cursor: generating ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {generating ? "Generating..." : "Generate This Week →"}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px" }}>

        {message && (
          <div style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", background: messageType === "success" ? "rgba(196,168,130,0.1)" : "rgba(220,38,38,0.1)", border: `0.5px solid ${messageType === "success" ? "rgba(196,168,130,0.3)" : "rgba(220,38,38,0.3)"}`, color: messageType === "success" ? "#C4A882" : "#FCA5A5" }}>
            {message}
          </div>
        )}

        {!contentPackage && !generating && (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "64px", color: "rgba(240,237,230,0.04)", marginBottom: "24px", lineHeight: 1 }}>✦</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#F0EDE6", margin: "0 0 12px" }}>Ready to generate your first week</h2>
            <p style={{ fontSize: "15px", color: "#6B6760", margin: "0 0 6px", lineHeight: 1.6 }}>One click creates 7 days of premium Instagram content for {brand?.brand_name}</p>
            <p style={{ fontSize: "13px", color: "#4A4845", margin: "0 0 32px" }}>Add an image to each post then approve to schedule in Buffer</p>
            <button onClick={generateContent} style={{ background: "#F0EDE6", color: "#0A0A0A", border: "none", borderRadius: "100px", padding: "16px 36px", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              Generate This Week →
            </button>
          </div>
        )}

        {generating && (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }`}</style>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "48px", color: "#C4A882", marginBottom: "24px", animation: "pulse 2s ease-in-out infinite" }}>✦</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "24px", color: "#F0EDE6", margin: "0 0 8px" }}>Crafting your content strategy...</h2>
            <p style={{ fontSize: "14px", color: "#6B6760" }}>Flow Social is writing 7 days of on-brand content. About 20 seconds.</p>
          </div>
        )}

        {contentPackage && !generating && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", color: "#F0EDE6", margin: "0 0 4px" }}>Week of {contentPackage.week_start_date}</h2>
                <p style={{ fontSize: "13px", color: "#4A4845", margin: 0 }}>Add an image then approve to schedule in Buffer</p>
              </div>
              <div style={{ fontSize: "13px", color: "#6B6760" }}>
                <span style={{ color: "#C4A882", fontWeight: 500 }}>{approvedCount}</span> of {contentPackage.content_pieces.length} scheduled
              </div>
            </div>

            {contentPackage.content_pieces.map((piece, index) => (
              <div key={index} style={{ background: "#111111", border: `0.5px solid ${piece.status === "approved" ? "rgba(196,168,130,0.3)" : "rgba(240,237,230,0.06)"}`, borderRadius: "12px", marginBottom: "10px", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>

                    <div style={{ textAlign: "center", minWidth: "44px" }}>
                      <div style={{ fontSize: "10px", color: "#4A4845", textTransform: "uppercase", letterSpacing: "1px" }}>{weekDates[(piece.day - 1) % 7]?.day ?? ""}</div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "26px", color: piece.status === "approved" ? "#C4A882" : "#F0EDE6", lineHeight: 1 }}>{weekDates[(piece.day - 1) % 7]?.date ?? piece.day}</div>
                      <div style={{ fontSize: "10px", color: "#4A4845", textTransform: "uppercase" }}>{weekDates[(piece.day - 1) % 7]?.month ?? ""}</div>
                      <div style={{ fontSize: "10px", color: "#3A3835", marginTop: "2px" }}>{piece.posting_time}</div>
                    </div>

                    <div style={{ width: "76px", height: "76px", borderRadius: "8px", background: "#1A1A18", flexShrink: 0, overflow: "hidden" }}>
                      {piece.image_url ? (
                        <img src={piece.image_url} alt={piece.concept} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <button onClick={() => generateImage(index)} disabled={generatingImages.includes(index)}
                          style={{ width: "100%", height: "100%", background: "none", border: "none", cursor: generatingImages.includes(index) ? "default" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", color: "#3A3835" }}>
                          {generatingImages.includes(index) ? (
                            <span style={{ fontSize: "10px", color: "#6B6760" }}>...</span>
                          ) : (
                            <>
                              <span style={{ fontSize: "18px" }}>+</span>
                              <span style={{ fontSize: "9px", letterSpacing: "0.5px" }}>IMAGE</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "10px", color: "#6B6760", background: "rgba(240,237,230,0.05)", padding: "2px 8px", borderRadius: "100px", border: "0.5px solid rgba(240,237,230,0.08)", textTransform: "capitalize" }}>{piece.content_type.replace("_", " ")}</span>
                        <span style={{ fontSize: "10px", color: "#6B6760", background: "rgba(240,237,230,0.05)", padding: "2px 8px", borderRadius: "100px", border: "0.5px solid rgba(240,237,230,0.08)" }}>{piece.content_pillar}</span>
                      </div>

                      <p style={{ fontSize: "11px", color: "#4A4845", fontStyle: "italic", margin: "0 0 6px", lineHeight: 1.4 }}>{piece.concept}</p>

                      {selectedPiece === index ? (
                        <div>
                          <textarea value={editingCaption} onChange={(e) => setEditingCaption(e.target.value)} rows={4}
                            style={{ width: "100%", background: "#0A0A0A", border: "0.5px solid rgba(240,237,230,0.15)", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#F0EDE6", outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                            <button onClick={() => saveCaption(index)} style={{ fontSize: "12px", background: "#F0EDE6", color: "#0A0A0A", border: "none", borderRadius: "100px", padding: "6px 16px", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Save</button>
                            <button onClick={() => setSelectedPiece(null)} style={{ fontSize: "12px", background: "transparent", color: "#6B6760", border: "0.5px solid rgba(240,237,230,0.15)", borderRadius: "100px", padding: "6px 16px", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p onClick={() => { setSelectedPiece(index); setEditingCaption(piece.caption); }}
                          style={{ fontSize: "13px", color: "#9E9A93", lineHeight: 1.5, margin: "0 0 6px", cursor: "pointer", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                          {piece.caption}
                        </p>
                      )}

                      <p style={{ fontSize: "11px", color: "#2A2825", margin: 0 }}>
                        {piece.hashtags.slice(0, 4).map((h) => `#${h.replace(/#/g, "")}`).join(" ")}
                        {piece.hashtags.length > 4 && ` +${piece.hashtags.length - 4} more`}
                      </p>
                    </div>

                    <div style={{ flexShrink: 0, minWidth: "110px" }}>
                      {piece.status === "approved" ? (
                        <button onClick={() => toggleApprove(index)} disabled={approvingIndex === index}
                          style={{ width: "100%", background: "rgba(34,197,94,0.08)", color: "#4ADE80", border: "0.5px solid rgba(34,197,94,0.25)", borderRadius: "8px", padding: "8px 10px", fontSize: "11px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", textAlign: "center", lineHeight: 1.5 }}>
                          <div>✓ Scheduled</div>
                          <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "1px" }}>{formatScheduledTime(piece.post_date, piece.posting_time)}</div>
                        </button>
                      ) : !piece.image_url ? (
                        <button onClick={() => generateImage(index)} disabled={generatingImages.includes(index)}
                          style={{ width: "100%", background: "transparent", color: "#4A4845", border: "0.5px solid rgba(240,237,230,0.08)", borderRadius: "8px", padding: "8px 10px", fontSize: "11px", cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
                          {generatingImages.includes(index) ? "Generating..." : "+ Add image"}
                        </button>
                      ) : (
                        <button onClick={() => toggleApprove(index)} disabled={approvingIndex === index}
                          style={{ width: "100%", background: "#F0EDE6", color: "#0A0A0A", border: "none", borderRadius: "8px", padding: "8px 10px", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                          {approvingIndex === index ? "Scheduling..." : "Approve →"}
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
