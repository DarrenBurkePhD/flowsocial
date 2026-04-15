"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  carousel_urls?: string[];
  image_source?: "brand" | "unsplash" | "ai" | null;
  buffer_id?: string;
};

type Brand = {
  id: string;
  brand_name: string;
  brand_description: string;
  buffer_profile_id?: string;
  brand_dna?: {
    image_style?: string;
    image_preferences?: { color?: string; people?: string; finish?: string };
    aesthetic_direction?: string;
    content_pillars?: string[];
    products?: string[];
  };
};

type ContentPackage = {
  id: string;
  status: string;
  content_pieces: ContentPiece[];
  week_start_date: string;
};

type BrandAsset = {
  id: string;
  public_url: string;
  asset_type: string;
};

type ImageAlternative = {
  url: string;
  source: "brand" | "unsplash" | "ai";
};

// ---- helpers ----

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchPexelsImages(query: string, count: number): Promise<string[]> {
  try {
    const res = await fetch(`/api/unsplash-search?query=${encodeURIComponent(query)}&count=${count * 2}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.photos || []).slice(0, count).map((p: { url: string }) => p.url);
  } catch { return []; }
}

async function buildPexelsQuery(imagePrompt: string, concept: string, contentPillar: string, brandDna: Brand["brand_dna"]): Promise<string> {
  try {
    const res = await fetch("/api/pexels-query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_prompt: imagePrompt, concept, content_pillar: contentPillar,
        aesthetic_direction: brandDna?.aesthetic_direction || "",
        products: brandDna?.products || [],
        content_pillars: brandDna?.content_pillars || [],
        image_preferences: brandDna?.image_preferences || {},
        visual_identity: (brandDna as any)?.visual_identity || "",
      }),
    });
    if (!res.ok) throw new Error("failed");
    const data = await res.json();
    return data.query || contentPillar;
  } catch { return contentPillar; }
}

async function fetchPexelsForConcept(concept: string, contentPillar: string, brandDna: Brand["brand_dna"], count: number = 1, imagePrompt?: string): Promise<string[]> {
  let primaryQuery = contentPillar;
  if (imagePrompt) primaryQuery = await buildPexelsQuery(imagePrompt, concept, contentPillar, brandDna);
  let urls = await fetchPexelsImages(primaryQuery, count);
  if (urls.length < count) {
    const fallback = await fetchPexelsImages(contentPillar, count - urls.length);
    urls = [...urls, ...fallback];
  }
  return urls;
}

async function assignImages(pieces: ContentPiece[], brandAssets: BrandAsset[], brandDna: Brand["brand_dna"]): Promise<ContentPiece[]> {
  const hasBrandAssets = brandAssets.length > 0;
  const shuffledAssets = shuffle([...brandAssets]);
  let assetIndex = 0;
  const result: ContentPiece[] = [];
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    const isCarousel = piece.content_type === "carousel";
    if (isCarousel) {
      const carouselUrls: string[] = [];
      const carouselSources: string[] = [];
      for (let s = 0; s < 3; s++) {
        const useBrand = hasBrandAssets && Math.random() < 0.6 && assetIndex < shuffledAssets.length;
        if (useBrand) {
          carouselUrls.push(shuffledAssets[assetIndex].public_url);
          carouselSources.push("brand");
          assetIndex++;
        } else {
          const urls = await fetchPexelsForConcept(piece.concept, piece.content_pillar, brandDna, 1, piece.image_prompt);
          if (urls.length) { carouselUrls.push(urls[0]); carouselSources.push("unsplash"); }
        }
      }
      result.push({ ...piece, image_url: carouselUrls[0] || undefined, carousel_urls: carouselUrls.length > 0 ? carouselUrls : undefined, image_source: (carouselSources[0] as "brand" | "unsplash") || null });
    } else {
      const useBrand = hasBrandAssets && Math.random() < 0.6 && assetIndex < shuffledAssets.length;
      if (useBrand) { result.push({ ...piece, image_url: shuffledAssets[assetIndex].public_url, image_source: "brand" }); assetIndex++; }
      else {
        const urls = await fetchPexelsForConcept(piece.concept, piece.content_pillar, brandDna, 1, piece.image_prompt);
        result.push({ ...piece, image_url: urls[0] || piece.image_url || undefined, image_source: urls[0] ? "unsplash" : (piece.image_source || null) });
      }
    }
  }
  return result;
}

function getWeekDates(startDate: string) {
  const dates = [];
  const start = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push({ day: date.toLocaleDateString("en-US", { weekday: "short" }), date: date.getDate(), month: date.toLocaleDateString("en-US", { month: "short" }), full: date.toISOString().split("T")[0] });
  }
  return dates;
}

function formatScheduledTime(post_date: string, posting_time: string) {
  const date = new Date(`${post_date}T${posting_time}:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " at " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function getThisWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

function getNextMondayLabel(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  return next.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isThisWeeksPackage(weekStartDate: string): boolean {
  const monday = getThisWeekMonday();
  const pkgDate = new Date(weekStartDate);
  const monDate = new Date(monday);
  return Math.abs((pkgDate.getTime() - monDate.getTime()) / (1000 * 60 * 60 * 24)) < 7;
}

function sourceLabel(source?: "brand" | "unsplash" | "ai" | null) {
  if (!source) return null;
  return source === "brand" ? "Your photo" : source === "unsplash" ? "Stock" : "AI";
}

function sourceColor(source?: "brand" | "unsplash" | "ai" | null) {
  return source === "brand" ? "#C4A882" : "#4A4845";
}

// ---- Lightbox ----

function Lightbox({ urls, initialIndex, source, onClose }: { urls: string[]; initialIndex: number; source?: string; onClose: () => void }) {
  const [idx, setIdx] = useState(initialIndex);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(i => Math.min(i + 1, urls.length - 1));
      if (e.key === "ArrowLeft") setIdx(i => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [urls.length, onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "min(600px, 90vw)", width: "100%" }}>
        <img src={urls[idx]} alt="" style={{ width: "100%", borderRadius: "12px", display: "block", maxHeight: "80vh", objectFit: "contain" }} />
        {/* Close */}
        <button onClick={onClose} style={{ position: "absolute", top: "-14px", right: "-14px", width: "32px", height: "32px", borderRadius: "50%", background: "#1A1A18", border: "0.5px solid rgba(240,237,230,0.15)", color: "#F0EDE6", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>×</button>
        {/* Arrows */}
        {idx > 0 && (
          <button onClick={() => setIdx(i => i - 1)} style={{ position: "absolute", left: "-44px", top: "50%", transform: "translateY(-50%)", width: "32px", height: "32px", borderRadius: "50%", background: "#1A1A18", border: "0.5px solid rgba(240,237,230,0.15)", color: "#F0EDE6", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        )}
        {idx < urls.length - 1 && (
          <button onClick={() => setIdx(i => i + 1)} style={{ position: "absolute", right: "-44px", top: "50%", transform: "translateY(-50%)", width: "32px", height: "32px", borderRadius: "50%", background: "#1A1A18", border: "0.5px solid rgba(240,237,230,0.15)", color: "#F0EDE6", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        )}
        {/* Counter + source */}
        <div style={{ marginTop: "12px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          {urls.length > 1 && (
            <div style={{ display: "flex", gap: "6px" }}>
              {urls.map((_, i) => (
                <div key={i} onClick={() => setIdx(i)} style={{ width: "6px", height: "6px", borderRadius: "50%", background: i === idx ? "#C4A882" : "#3A3835", cursor: "pointer" }} />
              ))}
            </div>
          )}
          {source && <span style={{ fontSize: "11px", color: "#4A4845" }}>{source}</span>}
        </div>
      </div>
    </div>
  );
}

// ---- Image panel (active + alternatives) ----

function ImagePanel({
  piece, index, loading, brandAssets, brandDna,
  onSelectImage, onGenerateAI,
}: {
  piece: ContentPiece;
  index: number;
  loading: boolean;
  brandAssets: BrandAsset[];
  brandDna: Brand["brand_dna"];
  onSelectImage: (index: number, url: string, source: "brand" | "unsplash" | "ai") => void;
  onGenerateAI: (index: number) => void;
}) {
  const [lightbox, setLightbox] = useState<{ urls: string[]; idx: number } | null>(null);
  const [alts, setAlts] = useState<ImageAlternative[]>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);

  const isCarousel = piece.content_type === "carousel";
  const carouselUrls = piece.carousel_urls || (piece.image_url ? [piece.image_url] : []);

  async function fetchAlternatives() {
    setLoadingAlts(true);
    try {
      // Alt 1: another Pexels image
      const pexelsUrls = await fetchPexelsForConcept(piece.concept, piece.content_pillar, brandDna, 1, piece.image_prompt);
      // Alt 2: a brand asset if available and different from current
      const available = brandAssets.filter(a => a.public_url !== piece.image_url);
      const brandAlt = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
      const newAlts: ImageAlternative[] = [];
      if (pexelsUrls[0]) newAlts.push({ url: pexelsUrls[0], source: "unsplash" });
      if (brandAlt) newAlts.push({ url: brandAlt.public_url, source: "brand" });
      setAlts(newAlts);
    } finally {
      setLoadingAlts(false);
    }
  }

  // Load alternatives when piece loads and has an image
  useEffect(() => {
    if (piece.image_url && !isCarousel) fetchAlternatives();
  }, [piece.image_url]);

  if (isCarousel) {
    return (
      <>
        {lightbox && <Lightbox urls={lightbox.urls} initialIndex={lightbox.idx} source="Carousel" onClose={() => setLightbox(null)} />}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "3px", cursor: "pointer" }} onClick={() => carouselUrls.length && setLightbox({ urls: carouselUrls, idx: 0 })}>
            {[0, 1, 2].map((s) => (
              <div key={s} style={{ width: "40px", height: "56px", borderRadius: s === 0 ? "6px 0 0 6px" : s === 2 ? "0 6px 6px 0" : "0", background: "#1A1A18", overflow: "hidden", position: "relative", flexShrink: 0 }}>
                {loading ? <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "8px", color: "#3A3835" }}>...</span></div>
                  : carouselUrls[s] ? <img src={carouselUrls[s]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "14px", color: "#2A2825" }}>+</span></div>}
                {s === 1 && <div style={{ position: "absolute", top: "2px", right: "2px", width: "12px", height: "12px", borderRadius: "2px", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "7px", color: "#9E9A93" }}>⊞</span></div>}
              </div>
            ))}
          </div>
          <div style={{ fontSize: "9px", color: "#4A4845", marginTop: "3px", textAlign: "center" }}>tap to preview</div>
        </div>
      </>
    );
  }

  return (
    <>
      {lightbox && <Lightbox urls={lightbox.urls} initialIndex={lightbox.idx} source={sourceLabel(piece.image_source) || undefined} onClose={() => setLightbox(null)} />}
      <div className="img-col">
        {/* Active image */}
        <div className="img-thumb img-wrap" style={{ cursor: piece.image_url ? "pointer" : "default" }} onClick={() => piece.image_url && setLightbox({ urls: [piece.image_url], idx: 0 })}>
          {loading ? (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "10px", color: "#6B6760" }}>...</span>
            </div>
          ) : piece.image_url ? (
            <img src={piece.image_url} alt={piece.concept} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onGenerateAI(index); }} style={{ width: "100%", height: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", color: "#3A3835" }}>
              <span style={{ fontSize: "16px" }}>+</span>
              <span style={{ fontSize: "8px", letterSpacing: "0.5px" }}>IMAGE</span>
            </button>
          )}
        </div>

        {/* Source label */}
        {piece.image_source && (
          <div style={{ fontSize: "9px", color: sourceColor(piece.image_source), marginTop: "3px", textAlign: "center" }}>
            {sourceLabel(piece.image_source)}
          </div>
        )}

        {/* Alternatives strip */}
        {piece.image_url && (
          <div style={{ marginTop: "6px", display: "flex", gap: "3px", alignItems: "center" }}>
            {loadingAlts ? (
              <div style={{ fontSize: "8px", color: "#3A3835", width: "64px", textAlign: "center" }}>...</div>
            ) : (
              <>
                {alts.map((alt, ai) => (
                  <div key={ai}
                    onClick={() => { onSelectImage(index, alt.url, alt.source); }}
                    title={alt.source === "brand" ? "Your photo" : "Stock photo"}
                    style={{ width: "28px", height: "28px", borderRadius: "4px", overflow: "hidden", cursor: "pointer", border: "0.5px solid rgba(240,237,230,0.1)", flexShrink: 0, position: "relative" }}>
                    <img src={alt.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
                {/* AI generate button */}
                <div
                  onClick={() => onGenerateAI(index)}
                  title="Generate AI image"
                  style={{ width: "28px", height: "28px", borderRadius: "4px", background: "#1A1A18", border: "0.5px solid rgba(240,237,230,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B6760" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                {/* Refresh alts button */}
                <div
                  onClick={fetchAlternatives}
                  title="Get new options"
                  style={{ width: "28px", height: "28px", borderRadius: "4px", background: "#1A1A18", border: "0.5px solid rgba(240,237,230,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6B6760" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M8 16H3v5"/>
                  </svg>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ---- Main page ----

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const brand_id = params.brand_id as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [contentPackage, setContentPackage] = useState<ContentPackage | null>(null);
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatingImages, setGeneratingImages] = useState<number[]>([]);
  const [regeneratingCaptions, setRegeneratingCaptions] = useState<number[]>([]);
  const [approvingIndex, setApprovingIndex] = useState<number | null>(null);
  const [gridView, setGridView] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    fetchBrand();
    fetchLatestPackage();
    fetchBrandAssets();
    checkSubscription();
    if (brand_id) localStorage.setItem("last_brand_id", brand_id);
  }, [brand_id]);

  async function checkSubscription() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle();
    if (data?.status === "active") setIsSubscribed(true);
  }

  async function fetchBrand() {
    const res = await fetch(`/api/get-brand?brand_id=${brand_id}`);
    const data = await res.json();
    if (data.brand) setBrand(data.brand);
  }

  async function fetchBrandAssets() {
    try {
      const res = await fetch(`/api/get-brand-assets?brand_id=${brand_id}`);
      const data = await res.json();
      if (data.assets) setBrandAssets(data.assets);
    } catch { }
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
      const piecesWithImages = await assignImages(data.content_pieces, brandAssets, brand?.brand_dna);
      const newPackage = { id: data.package_id, status: "ready_for_review", content_pieces: piecesWithImages, week_start_date: new Date().toISOString().split("T")[0] };
      setContentPackage(newPackage);
      await persistPieces(data.package_id, piecesWithImages);
      showMessage("7 posts ready. Review and approve to schedule.", "success");
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : "Generation failed", "error");
    } finally {
      setGenerating(false);
    }
  }

  function handleSelectImage(index: number, url: string, source: "brand" | "unsplash" | "ai") {
    if (!contentPackage) return;
    const updated = [...contentPackage.content_pieces];
    updated[index] = { ...updated[index], image_url: url, image_source: source };
    setContentPackage({ ...contentPackage, content_pieces: updated });
    persistPieces(contentPackage.id, updated);
  }

  async function handleGenerateAI(index: number) {
    if (!contentPackage) return;
    setGeneratingImages((prev) => [...prev, index]);
    try {
      const piece = contentPackage.content_pieces[index];
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_prompt: piece.image_prompt, content_type: piece.content_type, image_style: brand?.brand_dna?.image_style || "", image_preferences: brand?.brand_dna?.image_preferences || {} }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updated = [...contentPackage.content_pieces];
      updated[index] = { ...updated[index], image_url: data.image_url, image_source: "ai" };
      setContentPackage({ ...contentPackage, content_pieces: updated });
      await persistPieces(contentPackage.id, updated);
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : "Image generation failed", "error");
    } finally {
      setGeneratingImages((prev) => prev.filter((i) => i !== index));
    }
  }

  async function regenerateCaption(index: number) {
    if (!contentPackage || !brand) return;
    setRegeneratingCaptions((prev) => [...prev, index]);
    try {
      const piece = contentPackage.content_pieces[index];
      const res = await fetch("/api/regenerate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id, concept: piece.concept, content_type: piece.content_type, content_pillar: piece.content_pillar, cta: piece.cta, hashtags: piece.hashtags, current_caption: piece.caption }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditingCaption(data.caption);
      showMessage("New caption ready — save to keep it.", "success");
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : "Caption regeneration failed", "error");
    } finally {
      setRegeneratingCaptions((prev) => prev.filter((i) => i !== index));
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
    setMessage(msg); setMessageType(type);
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
        const fullCaption = `${piece.caption}

${piece.cta}

${cleanHashtags}`;
        const scheduledAt = Math.floor(new Date(`${piece.post_date}T${piece.posting_time}:00-03:00`).getTime() / 1000);
        const imageUrl = piece.content_type === "carousel" && piece.carousel_urls?.length ? piece.carousel_urls[0] : piece.image_url || null;
        const res = await fetch("/api/push-single-to-buffer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_id: brand.buffer_profile_id, text: fullCaption, scheduled_at: scheduledAt, image_url: imageUrl, image_urls: piece.content_type === "carousel" ? piece.carousel_urls : undefined, content_type: piece.content_type }),
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
  const weekLocked = contentPackage ? isThisWeeksPackage(contentPackage.week_start_date) : false;
  const nextMonday = getNextMondayLabel();

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0A", color: "#F0EDE6", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        .dash-nav { padding: 14px 20px; border-bottom: 0.5px solid rgba(240,237,230,0.08); }
        .dash-nav-inner { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .nav-logo-row { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .nav-logo-text { font-family: 'DM Serif Display', serif; font-size: 17px; color: #F0EDE6; line-height: 1; }
        .nav-brand-name { font-size: 11px; color: #6B6760; margin-top: 2px; }
        .nav-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .nav-btn-settings { background: transparent; color: #6B6760; border: 0.5px solid rgba(240,237,230,0.1); border-radius: 100px; padding: 7px 13px; font-size: 12px; cursor: pointer; font-family: inherit; white-space: nowrap; }
        .nav-btn-upgrade { background: transparent; color: #C4A882; border: 0.5px solid rgba(196,168,130,0.3); border-radius: 100px; padding: 7px 13px; font-size: 12px; cursor: pointer; font-family: inherit; white-space: nowrap; }
        .nav-btn-generate { background: #F0EDE6; color: #0A0A0A; border: none; border-radius: 100px; padding: 9px 16px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; white-space: nowrap; }
        .nav-btn-generate:disabled { background: #1E1E1C; color: #4A4845; cursor: not-allowed; }
        .nav-btn-generated { background: transparent; color: #4A4845; border: 0.5px solid rgba(240,237,230,0.08); border-radius: 100px; padding: 9px 16px; font-size: 12px; font-family: inherit; white-space: nowrap; cursor: default; }
        .dash-body { max-width: 860px; margin: 0 auto; padding: 20px 16px; }
        .post-card { background: #111111; border-radius: 12px; margin-bottom: 10px; overflow: hidden; }
        .post-card-inner { padding: 16px; }
        .post-row { display: flex; align-items: flex-start; gap: 12px; }
        .day-col { text-align: center; min-width: 36px; flex-shrink: 0; }
        .day-label { font-size: 9px; color: #4A4845; text-transform: uppercase; letter-spacing: 1px; }
        .day-num { font-family: 'DM Serif Display', serif; font-size: 22px; line-height: 1; }
        .day-month { font-size: 9px; color: #4A4845; text-transform: uppercase; }
        .day-time { font-size: 9px; color: #3A3835; margin-top: 2px; }
        .img-col { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
        .img-thumb { width: 64px; height: 64px; border-radius: 8px; background: #1A1A18; overflow: hidden; position: relative; }
        .content-col { flex: 1; min-width: 0; }
        .content-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 5px; }
        .content-tag { font-size: 9px; color: #6B6760; background: rgba(240,237,230,0.05); padding: 2px 7px; border-radius: 100px; border: 0.5px solid rgba(240,237,230,0.08); text-transform: capitalize; white-space: nowrap; }
        .content-concept { font-size: 10px; color: #4A4845; font-style: italic; margin: 0 0 5px; line-height: 1.4; }
        .content-caption { font-size: 13px; color: #9E9A93; line-height: 1.5; margin: 0 0 5px; cursor: pointer; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .content-hashtags { font-size: 10px; color: #2A2825; margin: 0; }
        .action-col { flex-shrink: 0; width: 100px; }
        .btn-scheduled { width: 100%; background: rgba(34,197,94,0.08); color: #4ADE80; border: 0.5px solid rgba(34,197,94,0.25); border-radius: 8px; padding: 8px 6px; font-size: 10px; font-weight: 500; cursor: pointer; font-family: inherit; text-align: center; line-height: 1.5; }
        .btn-add-image { width: 100%; background: transparent; color: #4A4845; border: 0.5px solid rgba(240,237,230,0.08); border-radius: 8px; padding: 8px 6px; font-size: 10px; cursor: pointer; font-family: inherit; text-align: center; }
        .btn-approve { width: 100%; background: #F0EDE6; color: #0A0A0A; border: none; border-radius: 8px; padding: 8px 6px; font-size: 11px; font-weight: 500; cursor: pointer; font-family: inherit; }
        @media (max-width: 600px) {
          .post-row { flex-direction: column; gap: 0; }
          .mobile-top-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
          .day-col { text-align: left; min-width: unset; display: flex; align-items: baseline; gap: 5px; }
          .img-col { width: 100%; }
          .img-thumb { width: 100%; height: 180px; border-radius: 10px; }
          .action-col { width: 100%; margin-top: 12px; }
          .btn-scheduled, .btn-add-image, .btn-approve { padding: 12px; font-size: 13px; border-radius: 10px; }
        }
        @media (min-width: 601px) { .mobile-top-row { display: contents; } }
      `}</style>

      <nav className="dash-nav">
        <div className="dash-nav-inner">
          <div className="nav-logo-row">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
              <rect width="32" height="32" rx="8" fill="#C4A882"/>
              <path d="M8 22 C8 22 12 10 16 10 C20 10 20 16 24 12" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <circle cx="24" cy="12" r="2.5" fill="#0A0A0A"/>
              <circle cx="8" cy="22" r="2" fill="#0A0A0A"/>
            </svg>
            <div style={{ minWidth: 0 }}>
              <div className="nav-logo-text">Flow Social</div>
              {brand && <div className="nav-brand-name">{brand.brand_name}</div>}
            </div>
          </div>
          <div className="nav-actions">
            <button onClick={() => router.push(`/settings/${brand_id}`)} className="nav-btn-settings">Settings</button>
            {!isSubscribed && <button onClick={() => router.push("/upgrade")} className="nav-btn-upgrade">Upgrade</button>}
            {weekLocked ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                <button className="nav-btn-generated" disabled>✓ Generated</button>
                <span style={{ fontSize: "9px", color: "#3A3835", whiteSpace: "nowrap" }}>Next week unlocks {nextMonday}</span>
              </div>
            ) : (
              <button onClick={generateContent} disabled={generating} className="nav-btn-generate">
                {generating ? "Generating..." : "Generate →"}
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="dash-body">
        {message && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", background: messageType === "success" ? "rgba(196,168,130,0.1)" : "rgba(220,38,38,0.1)", border: `0.5px solid ${messageType === "success" ? "rgba(196,168,130,0.3)" : "rgba(220,38,38,0.3)"}`, color: messageType === "success" ? "#C4A882" : "#FCA5A5" }}>
            {message}
          </div>
        )}

        {!contentPackage && !generating && (
          <div style={{ textAlign: "center", padding: "60px 16px" }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "48px", color: "rgba(240,237,230,0.04)", marginBottom: "20px", lineHeight: 1 }}>✦</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "24px", color: "#F0EDE6", margin: "0 0 10px" }}>Ready to generate your first week</h2>
            <p style={{ fontSize: "14px", color: "#6B6760", margin: "0 0 6px", lineHeight: 1.6 }}>One click creates 7 days of premium Instagram content for {brand?.brand_name}</p>
            <p style={{ fontSize: "12px", color: "#4A4845", margin: "0 0 28px" }}>Review images and approve each post to schedule in Buffer</p>
            <button onClick={generateContent} style={{ background: "#F0EDE6", color: "#0A0A0A", border: "none", borderRadius: "100px", padding: "14px 32px", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              Generate This Week →
            </button>
          </div>
        )}

        {generating && (
          <div style={{ textAlign: "center", padding: "60px 16px" }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "48px", color: "#C4A882", marginBottom: "20px", animation: "pulse 2s ease-in-out infinite" }}>✦</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", color: "#F0EDE6", margin: "0 0 8px" }}>Crafting your content strategy...</h2>
            <p style={{ fontSize: "14px", color: "#6B6760" }}>Flow Social is writing 7 days of on-brand content.</p>
          </div>
        )}

        {contentPackage && !generating && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "20px", color: "#F0EDE6", margin: "0 0 3px" }}>Week of {contentPackage.week_start_date}</h2>
                <p style={{ fontSize: "12px", color: "#4A4845", margin: 0 }}>Tap a caption to edit. Tap an image to preview or swap.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginLeft: "12px" }}>
                <div style={{ fontSize: "12px", color: "#6B6760" }}>
                  <span style={{ color: "#C4A882", fontWeight: 500 }}>{approvedCount}</span> of {contentPackage.content_pieces.length}
                </div>
                <button onClick={() => setGridView(!gridView)}
                  style={{ background: gridView ? "rgba(196,168,130,0.1)" : "transparent", color: gridView ? "#C4A882" : "#6B6760", border: `0.5px solid ${gridView ? "rgba(196,168,130,0.3)" : "rgba(240,237,230,0.1)"}`, borderRadius: "8px", padding: "5px 10px", fontSize: "11px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  {gridView ? "✦ Grid" : "⊞ Grid"}
                </button>
              </div>
            </div>

            {gridView && (
              <div style={{ marginBottom: "24px" }}>
                <p style={{ fontSize: "11px", color: "#4A4845", marginBottom: "10px", textAlign: "center", letterSpacing: "0.5px", textTransform: "uppercase" }}>Instagram Feed Preview</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "3px", borderRadius: "10px", overflow: "hidden" }}>
                  {contentPackage.content_pieces.map((piece, index) => (
                    <div key={index} style={{ aspectRatio: "1", background: "#1A1A18", position: "relative", overflow: "hidden" }}>
                      {piece.image_url ? <img src={piece.image_url} alt={piece.concept} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" }}><span style={{ fontSize: "18px", color: "#2A2825" }}>+</span></div>}
                      {piece.content_type === "carousel" && <div style={{ position: "absolute", top: "4px", left: "4px", background: "rgba(0,0,0,0.6)", borderRadius: "3px", padding: "1px 4px", fontSize: "7px", color: "#9E9A93" }}>⊞ 3</div>}
                      {piece.status === "approved" && <div style={{ position: "absolute", top: "4px", right: "4px", width: "16px", height: "16px", borderRadius: "50%", background: "rgba(34,197,94,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "8px", color: "#fff" }}>✓</span></div>}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.6))", padding: "12px 4px 4px" }}>
                        <div style={{ fontSize: "8px", color: "rgba(240,237,230,0.6)", textAlign: "center" }}>{weekDates[(piece.day - 1) % 7]?.day} {weekDates[(piece.day - 1) % 7]?.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: "11px", color: "#3A3835", marginTop: "8px", textAlign: "center" }}>Green dot = scheduled. Tap Grid to return to edit view.</p>
              </div>
            )}

            {contentPackage.content_pieces.map((piece, index) => {
              const hasImage = !!piece.image_url;
              return (
                <div key={index} className="post-card" style={{ border: `0.5px solid ${piece.status === "approved" ? "rgba(196,168,130,0.3)" : "rgba(240,237,230,0.06)"}` }}>
                  <div className="post-card-inner">
                    <div className="post-row">
                      <div className="mobile-top-row">
                        <div className="day-col">
                          <div className="day-label">{weekDates[(piece.day - 1) % 7]?.day ?? ""}</div>
                          <div className="day-num" style={{ color: piece.status === "approved" ? "#C4A882" : "#F0EDE6" }}>{weekDates[(piece.day - 1) % 7]?.date ?? piece.day}</div>
                          <div className="day-month">{weekDates[(piece.day - 1) % 7]?.month ?? ""}</div>
                          <div className="day-time">{piece.posting_time}</div>
                        </div>
                        <ImagePanel
                          piece={piece}
                          index={index}
                          loading={generatingImages.includes(index)}
                          brandAssets={brandAssets}
                          brandDna={brand?.brand_dna}
                          onSelectImage={handleSelectImage}
                          onGenerateAI={handleGenerateAI}
                        />
                      </div>

                      <div className="content-col">
                        <div className="content-tags">
                          <span className="content-tag">{piece.content_type.replace("_", " ")}</span>
                          <span className="content-tag">{piece.content_pillar}</span>
                        </div>
                        <p className="content-concept">{piece.concept}</p>
                        {selectedPiece === index ? (
                          <div>
                            <textarea value={editingCaption} onChange={(e) => setEditingCaption(e.target.value)} rows={5}
                              style={{ width: "100%", background: "#0A0A0A", border: "0.5px solid rgba(240,237,230,0.15)", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#F0EDE6", outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                            <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                              <button onClick={() => saveCaption(index)} style={{ fontSize: "12px", background: "#F0EDE6", color: "#0A0A0A", border: "none", borderRadius: "100px", padding: "7px 16px", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Save</button>
                              <button onClick={() => regenerateCaption(index)} disabled={regeneratingCaptions.includes(index)}
                                style={{ fontSize: "12px", background: "transparent", color: "#C4A882", border: "0.5px solid rgba(196,168,130,0.3)", borderRadius: "100px", padding: "7px 16px", cursor: regeneratingCaptions.includes(index) ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: regeneratingCaptions.includes(index) ? 0.5 : 1 }}>
                                {regeneratingCaptions.includes(index) ? "Rewriting..." : "Regenerate"}
                              </button>
                              <button onClick={() => setSelectedPiece(null)} style={{ fontSize: "12px", background: "transparent", color: "#6B6760", border: "0.5px solid rgba(240,237,230,0.15)", borderRadius: "100px", padding: "7px 14px", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <p className="content-caption" onClick={() => { setSelectedPiece(index); setEditingCaption(piece.caption); }}>{piece.caption}</p>
                        )}
                        <p className="content-hashtags">
                          {piece.hashtags.slice(0, 3).map((h) => `#${h.replace(/#/g, "")}`).join(" ")}
                          {piece.hashtags.length > 3 && ` +${piece.hashtags.length - 3}`}
                        </p>
                      </div>

                      <div className="action-col">
                        {piece.status === "approved" ? (
                          <button onClick={() => toggleApprove(index)} disabled={approvingIndex === index} className="btn-scheduled">
                            <div>✓ Scheduled</div>
                            <div style={{ fontSize: "9px", opacity: 0.7, marginTop: "1px" }}>{formatScheduledTime(piece.post_date, piece.posting_time)}</div>
                          </button>
                        ) : !hasImage ? (
                          <button onClick={() => handleGenerateAI(index)} disabled={generatingImages.includes(index)} className="btn-add-image">
                            {generatingImages.includes(index) ? "..." : "+ Add image"}
                          </button>
                        ) : (
                          <button onClick={() => toggleApprove(index)} disabled={approvingIndex === index} className="btn-approve">
                            {approvingIndex === index ? "..." : "Approve →"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {weekLocked && (
              <div style={{ textAlign: "center", paddingTop: "24px", paddingBottom: "8px" }}>
                <button onClick={generateContent} disabled={generating}
                  style={{ background: "none", border: "none", color: "#3A3835", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
                  Start fresh with a new week
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
