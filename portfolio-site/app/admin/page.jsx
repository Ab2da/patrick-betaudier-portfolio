"use client";

import { useState, useEffect, useRef } from "react";

function emptyForm() {
  return { title: "", year: "", medium: "", dimensions: "", series: "", description: "" };
}

async function compressImage(file, maxDim = 1800, quality = 0.86) {
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", quality);
  });
}

export default function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [meta, setMeta] = useState({ artistName: "", bio: "" });
  const [works, setWorks] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.authed))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [authed]);

  async function loadData() {
    setLoadingData(true);
    const res = await fetch("/api/works", { cache: "no-store" });
    const db = await res.json();
    setMeta(db.meta);
    setWorks(db.works);
    setLoadingData(false);
  }

  async function submitLogin(e) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      setPassword("");
    } else {
      setLoginError("Incorrect password.");
    }
  }

  async function signOut() {
    await fetch("/api/logout", { method: "POST" });
    setAuthed(false);
  }

  async function saveMetaField() {
    await fetch("/api/meta", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meta),
    });
  }

  function openNew() {
    setEditingId(null);
    setForm(emptyForm());
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function openEdit(work) {
    setEditingId(work.id);
    setForm({
      title: work.title,
      year: work.year,
      medium: work.medium,
      dimensions: work.dimensions,
      series: work.series,
      description: work.description,
    });
    setImageFile(null);
    setImagePreview(work.image);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setImageFile(compressed);
    setImagePreview(URL.createObjectURL(compressed));
  }

  async function submitForm(e) {
    e.preventDefault();
    if (!form.title.trim() || (!imageFile && !editingId)) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append("image", imageFile);

      const url = editingId ? `/api/works/${editingId}` : "/api/works";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, body: fd });
      if (res.ok) {
        await loadData();
        openNew();
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteWork(id) {
    await fetch(`/api/works/${id}`, { method: "DELETE" });
    setWorks((ws) => ws.filter((w) => w.id !== id));
  }

  if (checkingSession) return null;

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--canvas)" }}>
        <form onSubmit={submitLogin} style={{ width: 300 }}>
          <p className="ap-label" style={{ marginBottom: 10 }}>Admin login</p>
          <input
            className="ap-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
          />
          {loginError && <p style={{ color: "var(--sienna)", fontSize: 12, marginTop: 6 }}>{loginError}</p>}
          <button className="ap-btn ap-btn-primary" style={{ marginTop: 12 }} type="submit">
            Log in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <span className="ap-display" style={{ fontSize: 24, fontStyle: "italic" }}>Admin</span>
        <div style={{ display: "flex", gap: 10 }}>
          <a className="ap-btn ap-btn-ghost" href="/" style={{ textDecoration: "none", display: "inline-block" }}>View site</a>
          <button className="ap-btn ap-btn-ghost" onClick={signOut}>Sign out</button>
        </div>
      </div>

      {loadingData ? (
        <p className="ap-label">Loading…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <p className="ap-label" style={{ marginBottom: 8 }}>Site details</p>
            <input
              className="ap-input"
              style={{ marginBottom: 8 }}
              value={meta.artistName}
              onChange={(e) => setMeta((m) => ({ ...m, artistName: e.target.value }))}
              onBlur={saveMetaField}
              placeholder="Artist name"
            />
            <textarea
              className="ap-textarea"
              rows={3}
              value={meta.bio}
              onChange={(e) => setMeta((m) => ({ ...m, bio: e.target.value }))}
              onBlur={saveMetaField}
              placeholder="Short bio for the About section"
            />

            <p className="ap-label" style={{ margin: "20px 0 8px" }}>
              {editingId ? "Edit piece" : "Add a piece"}
            </p>
            <form onSubmit={submitForm} style={{ display: "grid", gap: 8 }}>
              <input
                className="ap-input"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input
                  className="ap-input"
                  placeholder="Year"
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                />
                <input
                  className="ap-input"
                  placeholder="Series / collection"
                  value={form.series}
                  onChange={(e) => setForm((f) => ({ ...f, series: e.target.value }))}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input
                  className="ap-input"
                  placeholder="Medium (e.g. oil on canvas)"
                  value={form.medium}
                  onChange={(e) => setForm((f) => ({ ...f, medium: e.target.value }))}
                />
                <input
                  className="ap-input"
                  placeholder="Dimensions"
                  value={form.dimensions}
                  onChange={(e) => setForm((f) => ({ ...f, dimensions: e.target.value }))}
                />
              </div>
              <textarea
                className="ap-textarea"
                rows={3}
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFile} />
              {imagePreview && (
                <img src={imagePreview} alt="preview" style={{ width: 120, borderRadius: 2, marginTop: 4 }} />
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button className="ap-btn ap-btn-primary" type="submit" disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Save changes" : "Add to gallery"}
                </button>
                {editingId && (
                  <button type="button" className="ap-btn ap-btn-ghost" onClick={openNew}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div>
            <p className="ap-label" style={{ marginBottom: 8 }}>Current works ({works.length})</p>
            <div style={{ display: "grid", gap: 8, maxHeight: 560, overflow: "auto" }}>
              {works.map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: "flex", gap: 10, alignItems: "center",
                    background: "#fff", border: "1px solid rgba(33,30,26,0.1)",
                    padding: 8, borderRadius: 2,
                  }}
                >
                  <img src={w.image} alt={w.title} style={{ width: 46, height: 56, objectFit: "cover", borderRadius: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{w.title}</div>
                    <div className="ap-mono" style={{ fontSize: 10, color: "var(--ink-soft)" }}>
                      {w.series || "—"} {w.year && `· ${w.year}`}
                    </div>
                  </div>
                  <button className="ap-btn ap-btn-ghost" onClick={() => openEdit(w)}>Edit</button>
                  <button
                    className="ap-btn ap-btn-ghost"
                    style={{ color: "var(--sienna)" }}
                    onClick={() => deleteWork(w.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
              {works.length === 0 && <p className="ap-label">No works yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
