"use client";

import { useState } from "react";

const SERIES_ALL = "All Work";

export default function Gallery({ meta, works }) {
  const [activeSeries, setActiveSeries] = useState(SERIES_ALL);
  const [lightboxId, setLightboxId] = useState(null);

  const seriesList = [SERIES_ALL, ...Array.from(new Set(works.map((w) => w.series).filter(Boolean)))];
  const visibleWorks = activeSeries === SERIES_ALL ? works : works.filter((w) => w.series === activeSeries);
  const featured = works[0];
  const lightboxWork = works.find((w) => w.id === lightboxId);
  const lightboxIndex = visibleWorks.findIndex((w) => w.id === lightboxId);

  function stepLightbox(dir) {
    if (lightboxIndex === -1) return;
    const next = (lightboxIndex + dir + visibleWorks.length) % visibleWorks.length;
    setLightboxId(visibleWorks[next].id);
  }

  return (
    <div>
      <header className="ap-header">
        <span className="ap-display" style={{ fontSize: 22, fontStyle: "italic" }}>
          {meta.artistName}
        </span>
        <nav className="ap-nav" style={{ display: "flex", gap: 4 }}>
          {seriesList.map((s) => (
            <button key={s} className={activeSeries === s ? "active" : ""} onClick={() => setActiveSeries(s)}>
              {s}
            </button>
          ))}
        </nav>
      </header>

      {featured && activeSeries === SERIES_ALL && (
        <div className="ap-hero" onClick={() => setLightboxId(featured.id)}>
          <img src={featured.image} alt={featured.title} />
          <div className="ap-hero-overlay">
            <div className="ap-label" style={{ color: "#c9bfa4" }}>Featured Work</div>
            <div className="ap-hero-title">{featured.title}</div>
            <div className="ap-hero-meta ap-mono" style={{ fontSize: 12 }}>
              {[featured.medium, featured.dimensions, featured.year].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>
      )}

      {visibleWorks.length === 0 && (
        <div style={{ padding: "80px 32px", textAlign: "center" }}>
          <p className="ap-display" style={{ fontSize: 24, fontStyle: "italic", color: "var(--ink-soft)" }}>
            The gallery is empty for now.
          </p>
          <p className="ap-label" style={{ marginTop: 8 }}>Check back soon.</p>
        </div>
      )}

      {visibleWorks.length > 0 && (
        <section className="ap-grid">
          {visibleWorks.map((w) => (
            <div className="ap-card" key={w.id} onClick={() => setLightboxId(w.id)}>
              <img src={w.image} alt={w.title} />
              <div className="ap-plaque">
                <div className="t">{w.title}</div>
                <div className="m">{[w.medium, w.dimensions, w.year].filter(Boolean).join(" · ")}</div>
              </div>
            </div>
          ))}
        </section>
      )}

      {meta.bio && (
        <section className="ap-section-dark">
          <div className="ap-label" style={{ color: "#b9c4b6", marginBottom: 10 }}>About</div>
          <p className="ap-display" style={{ fontSize: 20, maxWidth: 720, lineHeight: 1.5 }}>{meta.bio}</p>
        </section>
      )}

      <footer className="ap-footer">
        <span className="ap-label">{meta.artistName} — Portfolio</span>
        <a className="ap-admin-link ap-mono" href="/admin">Admin</a>
      </footer>

      {lightboxWork && (
        <div className="ap-modal-backdrop" onClick={() => setLightboxId(null)}>
          <div style={{ position: "relative", maxWidth: 1000, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightboxId(null)} style={closeBtnStyle}>✕</button>
            <button onClick={() => stepLightbox(-1)} style={{ ...navBtnStyle, left: -50 }}>‹</button>
            <button onClick={() => stepLightbox(1)} style={{ ...navBtnStyle, right: -50 }}>›</button>
            <img src={lightboxWork.image} alt={lightboxWork.title} style={{ width: "100%", maxHeight: "72vh", objectFit: "contain", background: "#000" }} />
            <div style={{ background: "#e9dcb8", border: "1px solid #c08a32", padding: "14px 20px", marginTop: 2 }}>
              <div className="ap-display" style={{ fontStyle: "italic", fontSize: 20 }}>{lightboxWork.title}</div>
              <div className="ap-mono" style={{ fontSize: 12, color: "#55504a", marginTop: 4 }}>
                {[lightboxWork.medium, lightboxWork.dimensions, lightboxWork.year].filter(Boolean).join(" · ")}
              </div>
              {lightboxWork.description && <p style={{ marginTop: 10, fontSize: 14 }}>{lightboxWork.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const closeBtnStyle = { position: "absolute", top: -40, right: 0, color: "#fff", background: "none", border: "none", cursor: "pointer", fontSize: 20 };
const navBtnStyle = { position: "absolute", top: "50%", transform: "translateY(-50%)", color: "#fff", background: "none", border: "none", cursor: "pointer", fontSize: 34 };
