"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

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

export default function DashboardPage() {
  const params = useParams();
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
      showMessage("Content generated. Review and approve each post to schedule it.", "success");
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
      body: JSON.stringify({
        package_id: packageId,
        content_pieces: pieces,
      }),
    });
  }

  function showMessage(msg: string, type: "success" | "error") {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  }

  async function toggleApprove(index: number) {
    if (!contentPackage || approvingIndex === index) return;
    setApprovingIndex(index);

    const updated = [...contentPackage.content_pieces];
    const newStatus = updated[index].status === "approved" ? "pending" : "approved";
    updated[index] = { ...updated[index], status: newStatus };
    setContentPackage({ ...contentPackage, content_pieces: updated });

    // Persist to Supabase
    await persistPieces(contentPackage.id, updated);

    // Auto-schedule in Buffer on approval
    if (newStatus === "approved") {
      if (!brand?.buffer_profile_id) {
        showMessage("Approved locally. Add your Buffer Profile ID to auto-schedule.", "error");
        setApprovingIndex(null);
        return;
      }

      try {
        const piece = updated[index];
        const cleanHashtags = piece.hashtags
          .map((h: string) => `#${h.replace(/#/g, "")}`)
          .join(" ");
        const fullCaption = `${piece.caption}\n\n${piece.cta}\n\n${cleanHashtags}`;

        // Use the post_date and posting_time assigned by Claude
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
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Save buffer_id back to the piece
        updated[index] = { ...updated[index], buffer_id: data.buffer_id };
        setContentPackage({ ...contentPackage, content_pieces: updated });
        await persistPieces(contentPackage.id, updated);

        showMessage(
          `Scheduled for ${piece.post_date} at ${piece.posting_time}`,
          "success"
        );
      } catch (err: unknown) {
        showMessage(
          err instanceof Error ? err.message : "Buffer scheduling failed",
          "error"
        );
      }
    } else {
      showMessage("Post unapproved and removed from schedule", "success");
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

  const approvedCount =
    contentPackage?.content_pieces.filter((p) => p.status === "approved").length ?? 0;

  const weekDates = contentPackage
    ? getWeekDates(contentPackage.week_start_date)
    : [];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">FlowSocial</h1>
            {brand && (
              <p className="text-sm text-gray-500">{brand.brand_name}</p>
            )}
          </div>
          <button
            onClick={generateContent}
            disabled={generating}
            className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate This Week →"}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Status message */}
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg text-sm border ${
              messageType === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {/* Empty state */}
        {!contentPackage && !generating && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">✦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ready to generate your first week
            </h2>
            <p className="text-gray-500 mb-2">
              One click creates 7 days of premium Instagram content for{" "}
              {brand?.brand_name}
            </p>
            <p className="text-sm text-gray-400 mb-8">
              Approve each post to automatically schedule it in Buffer
            </p>
            <button
              onClick={generateContent}
              className="bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Generate This Week →
            </button>
          </div>
        )}

        {/* Generating state */}
        {generating && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4 animate-pulse">✦</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Crafting your content strategy...
            </h2>
            <p className="text-gray-500">
              Claude is writing 7 days of on-brand content. About 15 seconds.
            </p>
          </div>
        )}

        {/* Content calendar */}
        {contentPackage && !generating && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Week of {contentPackage.week_start_date}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Approve a post to automatically schedule it in Buffer
                </p>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {approvedCount} of {contentPackage.content_pieces.length} scheduled
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {contentPackage.content_pieces.map((piece, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-xl border transition-all ${
                    piece.status === "approved"
                      ? "border-green-300"
                      : "border-gray-100"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">

                      {/* Day indicator */}
                      <div className="text-center min-w-12">
                        <div className="text-xs text-gray-400 uppercase">
                          {weekDates[(piece.day - 1) % 7]?.day ?? ""}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {weekDates[(piece.day - 1) % 7]?.date ?? piece.day}
                        </div>
                        <div className="text-xs text-gray-400 uppercase">
                          {weekDates[(piece.day - 1) % 7]?.month ?? ""}
                        </div>
                        <div className="text-xs text-gray-400">
                          {piece.posting_time}
                        </div>
                      </div>

                      {/* Image */}
                      <div className="w-24 h-24 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        {piece.image_url ? (
                          <img
                            src={piece.image_url}
                            alt={piece.concept}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <button
                            onClick={() => generateImage(index)}
                            disabled={generatingImages.includes(index)}
                            className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors text-xs gap-1"
                          >
                            {generatingImages.includes(index) ? (
                              <span className="animate-pulse">Generating...</span>
                            ) : (
                              <>
                                <span className="text-2xl">+</span>
                                <span>Add image</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                            {piece.content_type.replace("_", " ")}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {piece.content_pillar}
                          </span>
                          {piece.buffer_id && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              In Buffer queue
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 italic mb-1">
                          {piece.concept}
                        </p>

                        {selectedPiece === index ? (
                          <div>
                            <textarea
                              value={editingCaption}
                              onChange={(e) => setEditingCaption(e.target.value)}
                              rows={4}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => saveCaption(index)}
                                className="text-xs bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setSelectedPiece(null)}
                                className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p
                            className="text-sm text-gray-700 line-clamp-3 cursor-pointer hover:text-gray-900"
                            onClick={() => {
                              setSelectedPiece(index);
                              setEditingCaption(piece.caption);
                            }}
                          >
                            {piece.caption}
                          </p>
                        )}

                        <p className="text-xs text-gray-400 mt-1">
                          {piece.hashtags
                            .slice(0, 5)
                            .map((h) => `#${h.replace(/#/g, "")}`)
                            .join(" ")}
                          {piece.hashtags.length > 5 &&
                            ` +${piece.hashtags.length - 5} more`}
                        </p>
                      </div>

                      {/* Approve button */}
                      <button
                        onClick={() => toggleApprove(index)}
                        disabled={approvingIndex === index}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          piece.status === "approved"
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "border border-gray-200 text-gray-600 hover:border-gray-400"
                        } disabled:opacity-50`}
                      >
                        {approvingIndex === index
                          ? "Scheduling..."
                          : piece.status === "approved"
                          ? "✓ Scheduled"
                          : "Approve"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}