jsx
"use client";

import { useState } from "react";

export default function SiteLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/site-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        setError("Incorrect password.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--canvas, #e7e0d2)",
      }}
    >
      <form onSubmit={submit} style={{ width: 300, textAlign: "center" }}>
        <p className="ap-display" style={{ fontSize: 20, fontStyle: "italic", marginBottom: 16 }}>
          This site is under construction
        </p>
        <input
          className="ap-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
        />
        {error && <p style={{ color: "var(--sienna, #a6512e)", fontSize: 12, marginTop: 6 }}>{error}</p>}
        <button className="ap-btn ap-btn-primary" style={{ marginTop: 12 }} type="submit" disabled={loading}>
          {loading ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
