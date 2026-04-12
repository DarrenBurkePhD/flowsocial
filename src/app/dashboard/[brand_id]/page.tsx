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
};

type Brand = {
  id: string;
  brand_name: string;
  brand_description: string;
};

type ContentPackage = {
  id: string;
  status: string;
  content_pieces: ContentPiece[];
  week_start_date: string;
};

export default function DashboardPage() {
  const params = useParams();
  const brand_id = params.brand_id as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [contentPackage, setContentPackage] = useState<ContentPackage | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingImages, setGeneratingImages] = useState<number[]>([]);
  const [pushing, setPushing] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState("");
  const [bufferProfileId, setBufferProfileId] = useState("");
  const [showBufferInput, setShowBufferInput] = useState(false);

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
      setMessage("Content generated successfully");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Generation failed");
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
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Image generation failed");
    } finally {
      setGeneratingImages((prev) => prev.filter((i) => i !== index));
    }
  }

  function toggleApprove(index: number) {
    if (!contentPackage) return;
    const updated = [...contentPackage.content_pieces];
    updated[index] = {
      ...updated[index],
      status: updated[index].status === "approved" ? "pending" : "approved",
    };
    setContentPackage({ ...contentPackage, content_pieces: updated });
  }

  function saveCaption(index: number) {
    if (!contentPackage) return;
    const updated = [...contentPackage.content_pieces];
    updated[index] = { ...updated[index], caption: editingCaption };
    setContentPackage({ ...contentPackage, content_pieces: updated });
    setSelectedPiece(null);
  }

  async function pushToBuffer() {
    if (!contentPackage || !bufferProfileId) return;
    setPushing(true);
    setMessage("");
    try {
      const res = await fetch("/api/push-to-buffer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: contentPackage.id,
          profile_id: bufferProfileId,
          content_pieces: contentPackage.content_pieces,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(`Successfully pushed ${data.pushed} posts to Buffer`);
      setShowBufferInput(false);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Buffer push failed");
    } finally {
      setPushing(false);
    }
  }

  const approvedCount = contentPackage?.content_pieces.filter(
    (p) => p.status === "approved"
  ).length ?? 0;

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

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">FlowSocial</h1>
            {brand && (
              <p className="text-sm text-gray-500">{brand.brand_name}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {contentPackage && approvedCount > 0 && (
              <button
                onClick={() => setShowBufferInput(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Push {approvedCount} to Buffer →
              </button>
            )}
            <button
              onClick={generateContent}
              disabled={generating}
              className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate This Week →"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Status message */}
        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
            {message}
          </div>
        )}

        {/* Buffer profile input */}
        {showBufferInput && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              Enter your Buffer Profile ID
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Find this in Buffer → Settings → your Instagram profile URL
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={bufferProfileId}
                onChange={(e) => setBufferProfileId(e.target.value)}
                placeholder="e.g. 5c8e9f7a3b4d2e1f0a9b8c7d"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                onClick={pushToBuffer}
                disabled={pushing || !bufferProfileId}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {pushing ? "Pushing..." : "Confirm Push"}
              </button>
              <button
                onClick={() => setShowBufferInput(false)}
                className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!contentPackage && !generating && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">✦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ready to generate your first week
            </h2>
            <p className="text-gray-500 mb-8">
              One click to create 7 days of premium F&B Instagram content
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
            <div className="text-5xl mb-4 animate-spin">✦</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Analyzing your brand...
            </h2>
            <p className="text-gray-500">
              Claude is crafting your content strategy. Takes about 15 seconds.
            </p>
          </div>
        )}

        {/* Content calendar */}
        {contentPackage && !generating && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Week of {contentPackage.week_start_date}
              </h2>
              <p className="text-sm text-gray-500">
                {approvedCount} of {contentPackage.content_pieces.length} approved
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {contentPackage.content_pieces.map((piece, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-xl border transition-all ${
                    piece.status === "approved"
                      ? "border-green-300 shadow-sm"
                      : "border-gray-100"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Day indicator */}
<div className="text-center min-w-12">
  <div className="text-xs text-gray-400 uppercase">
    {contentPackage
      ? getWeekDates(contentPackage.week_start_date)[
          (piece.day - 1) % 7
        ]?.day
      : ""}
  </div>
  <div className="text-2xl font-bold text-gray-900">
    {contentPackage
      ? getWeekDates(contentPackage.week_start_date)[
          (piece.day - 1) % 7
        ]?.date
      : piece.day}
  </div>
  <div className="text-xs text-gray-400 uppercase">
    {contentPackage
      ? getWeekDates(contentPackage.week_start_date)[
          (piece.day - 1) % 7
        ]?.month
      : ""}
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
                              <span>Generating...</span>
                            ) : (
                              <>
                                <span className="text-2xl">+</span>
                                <span>Generate image</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {piece.content_type.replace("_", " ")}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {piece.content_pillar}
                          </span>
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
                          {piece.hashtags.slice(0, 5).map((h) => `#${h}`).join(" ")}
                          {piece.hashtags.length > 5 && ` +${piece.hashtags.length - 5} more`}
                        </p>
                      </div>

                      {/* Approve button */}
                      <button
                        onClick={() => toggleApprove(index)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          piece.status === "approved"
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "border border-gray-200 text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {piece.status === "approved" ? "✓ Approved" : "Approve"}
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