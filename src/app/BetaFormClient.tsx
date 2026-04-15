"use client";

import { useState } from "react";

export default function BetaFormClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [already, setAlready] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/beta-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.already) { setAlready(true); }
      else if (data.success) { setDone(true); }
      else { setError("Something went wrong. Try again."); }
    } catch {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div style={{ background: "rgba(196,168,130,0.08)", border: "0.5px solid rgba(196,168,130,0.25)", borderRadius: "12px", padding: "24px 28px", maxWidth: "480px" }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "20px", color: "#F0EDE6", marginBottom: "8px" }}>You are on the list.</div>
        <div style={{ fontSize: "13px", color: "#9E9A93", lineHeight: 1.6 }}>
          We will review your request and send an access code to <span style={{ color: "#C4A882" }}>{email}</span> within 48 hours.
        </div>
      </div>
    );
  }

  if (already) {
    return (
      <div style={{ background: "rgba(196,168,130,0.05)", border: "0.5px solid rgba(196,168,130,0.15)", borderRadius: "12px", padding: "24px 28px", maxWidth: "480px" }}>
        <div style={{ fontSize: "13px", color: "#9E9A93", lineHeight: 1.6 }}>
          You are already on the list. We will be in touch at <span style={{ color: "#C4A882" }}>{email}</span> within 48 hours.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "12px", maxWidth: "480px", flexWrap: "wrap" }} className="fs-beta-row">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@yourbrand.com"
        required
        className="fs-beta-input"
        style={{
          flex: 1,
          minWidth: "220px",
          background: "rgba(10,10,10,0.8)",
          border: "0.5px solid rgba(240,237,230,0.15)",
          borderRadius: "100px",
          padding: "14px 24px",
          fontSize: "14px",
          color: "#F0EDE6",
          boxSizing: "border-box" as const,
        }}
      />
      <button
        type="submit"
        disabled={loading || !email}
        className="fs-beta-btn"
        style={{
          background: "#C4A882",
          color: "#0A0A0A",
          border: "none",
          borderRadius: "100px",
          padding: "14px 32px",
          fontSize: "14px",
          fontWeight: 500,
          cursor: loading || !email ? "not-allowed" : "pointer",
          opacity: loading || !email ? 0.5 : 1,
          transition: "opacity 0.2s",
          whiteSpace: "nowrap" as const,
        }}
      >
        {loading ? "Requesting..." : "Request access"}
      </button>
      {error && <div style={{ width: "100%", fontSize: "13px", color: "#FCA5A5", paddingLeft: "8px" }}>{error}</div>}
    </form>
  );
}
