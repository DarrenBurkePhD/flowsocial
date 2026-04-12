"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  });

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

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-xl w-full p-8">

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${s <= step ? "bg-black" : "bg-gray-200"}`}
            />
          ))}
        </div>

        {/* Step 1: Brand basics */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-gray-900">Your brand</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand name</label>
              <input
                type="text"
                value={form.brand_name}
                onChange={(e) => updateField("brand_name", e.target.value)}
                placeholder="e.g. Saltair"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                One sentence: what does your brand do?
              </label>
              <textarea
                value={form.brand_description}
                onChange={(e) => updateField("brand_description", e.target.value)}
                placeholder="e.g. We make mineral-rich body care for people who treat their skin like their face."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
              <input
                type="url"
                value={form.website_url}
                onChange={(e) => updateField("website_url", e.target.value)}
                placeholder="https://yourbrand.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!form.brand_name || !form.brand_description}
              className="w-full bg-black text-white py-3 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Audience */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-gray-900">Your audience</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age range</label>
              <select
                value={form.age_range}
                onChange={(e) => updateField("age_range", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
              >
                {["18-24", "25-34", "35-44", "45+", "Mixed"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
              >
                {["Women", "Men", "Non-binary", "All genders"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your customer's identity (pick up to 5)
              </label>
              <div className="flex flex-wrap gap-2">
                {PSYCHOGRAPHIC_OPTIONS.map((o) => (
                  <button
                    key={o}
                    onClick={() => toggleArrayItem("psychographics", o)}
                    disabled={!form.psychographics.includes(o) && form.psychographics.length >= 5}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      form.psychographics.includes(o)
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    } disabled:opacity-30`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={form.psychographics.length === 0}
                className="flex-1 bg-black text-white py-3 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Voice + references */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-gray-900">Your voice</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand voice (pick up to 3)
              </label>
              <div className="flex flex-wrap gap-2">
                {BRAND_VOICE_OPTIONS.map((o) => (
                  <button
                    key={o}
                    onClick={() => toggleArrayItem("brand_voice", o)}
                    disabled={!form.brand_voice.includes(o) && form.brand_voice.length >= 3}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      form.brand_voice.includes(o)
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    } disabled:opacity-30`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                3 Instagram accounts whose aesthetic you want to match
              </label>
              {form.reference_accounts.map((account, i) => (
                <input
                  key={i}
                  type="text"
                  value={account}
                  onChange={(e) => updateReferenceAccount(i, e.target.value)}
                  placeholder={`@handle`}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black mb-2"
                />
              ))}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || form.brand_voice.length === 0}
                className="flex-1 bg-black text-white py-3 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? "Analyzing your brand..." : "Generate my content →"}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}