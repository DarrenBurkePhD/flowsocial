"use client";

import { useState, useEffect } from "react";

interface Signup {
  id: string;
  email: string;
  created_at: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      setAuthError("Incorrect password.");
    }
  }

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetch("/api/admin/signups")
      .then((r) => r.json())
      .then((data) => { setSignups(data.signups || []); setLoading(false); });
  }, [authed]);

  function copyEmail(email: string) {
    navigator.clipboard.writeText(email);
    setCopied(email);
    setTimeout(() => setCopied(null), 2000);
  }

  function copyAll() {
    const all = signups.map((s) => s.email).join("\n");
    navigator.clipboard.writeText(all);
    setCopied("all");
    setTimeout(() => setCopied(null), 2000);
  }

  function formatDate(str: string) {
    return new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  if (!authed) {
    return (
      <main style={{ fontFamily: "'DM Sans', sans-serif", background: "#0A0A0A", color: "#F0EDE6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "360px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "40px", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#C4A882"/>
              <path d="M8 22 C8 22 12 10 16 10 C20 10 20 16 24 12" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <circle cx="24" cy="12" r="2.5" fill="#0A0A0A"/>
              <circle cx="8" cy="22" r="2" fill="#0A0A0A"/>
            </svg>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "18px", color: "#F0EDE6" }}>Admin</span>
          </div>
          <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.08)", borderRadius: "16px", padding: "36px" }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", color: "#F0EDE6", margin: "0 0 24px" }}>Sign in</h1>
            {authError && (
              <div style={{ background: "rgba(220,38,38,0.1)", border: "0.5px solid rgba(220,38,38,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#FCA5A5" }}>
                {authError}
              </div>
            )}
            <form onSubmit={handleAuth}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                required
                style={{ width: "100%", background: "#0A0A0A", border: "0.5px solid rgba(240,237,230,0.15)", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", color: "#F0EDE6", outline: "none", boxSizing: "border-box" as const, marginBottom: "14px" }}
              />
              <button type="submit" style={{ width: "100%", background: "#F0EDE6", color: "#0A0A0A", border: "none", borderRadius: "100px", padding: "14px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
                Enter
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: "'DM Sans', sans-serif", background: "#0A0A0A", color: "#F0EDE6", minHeight: "100vh", padding: "48px" }}>
      <style>{`@media (max-width: 600px) { main { padding: 24px !important; } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "48px", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#C4A882"/>
            <path d="M8 22 C8 22 12 10 16 10 C20 10 20 16 24 12" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="24" cy="12" r="2.5" fill="#0A0A0A"/>
            <circle cx="8" cy="22" r="2" fill="#0A0A0A"/>
          </svg>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "20px", color: "#F0EDE6" }}>Flow Social — Admin</span>
        </div>
        <a href="/" style={{ fontSize: "13px", color: "#6B6760", textDecoration: "none" }}>← Back to site</a>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "2px", marginBottom: "48px", maxWidth: "600px" }}>
        {[
          { label: "Total signups", value: signups.length.toString() },
          { label: "Latest", value: signups.length > 0 ? formatDate(signups[0].created_at).split(",")[0] : "—" },
        ].map((stat, i) => (
          <div key={i} style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.06)", borderRadius: i === 0 ? "12px 0 0 12px" : "0 12px 12px 0", padding: "28px 28px" }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "36px", color: "#C4A882", lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: "12px", color: "#6B6760", marginTop: "6px", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" as const }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Signups table */}
      <div style={{ background: "#111111", border: "0.5px solid rgba(240,237,230,0.06)", borderRadius: "16px", overflow: "hidden", maxWidth: "760px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px", borderBottom: "0.5px solid rgba(240,237,230,0.06)" }}>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#F0EDE6" }}>Beta signups</div>
          <button
            onClick={copyAll}
            style={{ background: "rgba(196,168,130,0.1)", border: "0.5px solid rgba(196,168,130,0.2)", borderRadius: "100px", padding: "8px 18px", fontSize: "12px", color: "#C4A882", cursor: "pointer", fontWeight: 500 }}
          >
            {copied === "all" ? "Copied all" : "Copy all emails"}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "40px 28px", fontSize: "14px", color: "#6B6760" }}>Loading...</div>
        ) : signups.length === 0 ? (
          <div style={{ padding: "40px 28px", fontSize: "14px", color: "#6B6760" }}>No signups yet.</div>
        ) : (
          signups.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: i < signups.length - 1 ? "0.5px solid rgba(240,237,230,0.04)" : "none", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#F0EDE6", marginBottom: "4px" }}>{s.email}</div>
                <div style={{ fontSize: "12px", color: "#4A4845" }}>{formatDate(s.created_at)}</div>
              </div>
              <button
                onClick={() => copyEmail(s.email)}
                style={{ background: "transparent", border: "0.5px solid rgba(240,237,230,0.1)", borderRadius: "100px", padding: "7px 16px", fontSize: "12px", color: "#9E9A93", cursor: "pointer" }}
              >
                {copied === s.email ? "Copied" : "Copy email"}
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
