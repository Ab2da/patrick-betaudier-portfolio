"use client";

import { useState, useEffect, useRef } from "react";
import Contact from "./Contact";

const SERIES_ALL = "All Work";
const VISIBLE_COUNT = 3;
const DRAG_THRESHOLD = 60;
const BUFFER = 3; // extra "peek" cards rendered on each side while dragging/gliding
const MAX_TRAVEL_STEPS = 3; // hardest flick can move at most this many pictures
const FRICTION = 0.0022; // px/ms^2 -- how quickly the glide decelerates
const VELOCITY_STOP = 0.03; // px/ms -- momentum ends once slower than this
const SETTLE_MS = 260; // final ease-out snap to the nearest picture

export default function Gallery({ meta, works }) {
  const [activeSeries, setActiveSeries] = useState(SERIES_ALL);
  const [lightboxId, setLightboxId] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselDir, setCarouselDir] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  // Arrow/dot clicks intentionally remount all 3 cards each step for a group
  // "pop" effect. A drag settling on a new picture used to do the same thing
  // across all 9 buffered cards, which showed up as a flash right as the
  // glide stopped. This flag switches the settle path to identity-stable
  // keys so already-visible cards are reused instead of remounted.
  const [dragCommitting, setDragCommitting] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef(0);
  const draggedRef = useRef(false);
  const trackRef = useRef(null);
  const cardStepRef = useRef(300);
  const velocityRef = useRef(0);
  const lastMoveRef = useRef({ x: 0, t: 0 });
  const rafRef = useRef(null);
  // React state updates aren't synchronous, so on a fast real flick several
  // mousemove events can fire before a render has applied setIsDragging(true)
  // -- those events would read a stale "isDragging = false" from the closure
  // and get silently dropped, which are exactly the fastest samples that
  // should have driven the velocity reading. These refs track drag state and
  // the latest offset synchronously so no movement sample is ever missed.
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef(0);

  const seriesList = [SERIES_ALL, ...Array.from(new Set(works.map((w) => w.series).filter(Boolean)))];
  const visibleWorks = activeSeries === SERIES_ALL ? works : works.filter((w) => w.series === activeSeries);
  const featured = works[0];
  const lightboxWork = works.find((w) => w.id === lightboxId);
  const lightboxIndex = visibleWorks.findIndex((w) => w.id === lightboxId);

  function measureStep() {
    const track = trackRef.current;
    if (!track || !track.firstElementChild) return;
    const rect = track.firstElementChild.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(track).gap) || 20;
    if (rect.width > 0) cardStepRef.current = rect.width + gap;
  }

  useEffect(() => {
    measureStep();
    window.addEventListener("resize", measureStep);
    return () => window.removeEventListener("resize", measureStep);
  }, [visibleWorks.length, activeSeries]);

  useEffect(() => {
    setCarouselIndex(0);
    cancelAnimationFrame(rafRef.current);
    setIsDragging(false);
    setIsAnimating(false);
    setDragOffset(0);
  }, [activeSeries]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  function stepLightbox(dir) {
    if (lightboxIndex === -1) return;
    const next = (lightboxIndex + dir + visibleWorks.length) % visibleWorks.length;
    setLightboxId(visibleWorks[next].id);
  }

  function stepCarousel(dir) {
    if (visibleWorks.length === 0) return;
    setCarouselDir(dir);
    setDragCommitting(false);
    setCarouselIndex((i) => (i + dir + visibleWorks.length) % visibleWorks.length);
  }

  function handleDragStart(clientX) {
    if (visibleWorks.length === 0) return;
    cancelAnimationFrame(rafRef.current);
    setIsAnimating(false);
    dragStartX.current = clientX;
    draggedRef.current = false;
    velocityRef.current = 0;
    dragOffsetRef.current = 0;
    lastMoveRef.current = { x: clientX, t: performance.now() };
    isDraggingRef.current = true;
    setIsDragging(true);
  }

  function handleDragMove(clientX) {
    if (!isDraggingRef.current) return;
    const now = performance.now();
    const delta = clientX - dragStartX.current;
    if (Math.abs(delta) > 5) draggedRef.current = true;
    dragOffsetRef.current = delta;
    setDragOffset(delta);
    const dt = now - lastMoveRef.current.t;
    if (dt > 0) {
      const instV = (clientX - lastMoveRef.current.x) / dt;
      // smooth the reading so a single jittery event doesn't dominate the flick speed
      velocityRef.current = velocityRef.current * 0.7 + instV * 0.3;
    }
    lastMoveRef.current = { x: clientX, t: now };
  }

  function handleDragEnd() {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    runMomentum(dragOffsetRef.current, velocityRef.current);
  }

  // Lets go of the picture and keeps it gliding in the direction (and at the
  // speed) it was whisked, decelerating under constant "friction" until it's
  // slow enough to settle on the nearest picture.
  function runMomentum(startOffset, startVelocity) {
    const step = cardStepRef.current || 1;
    const maxOffset = step * MAX_TRAVEL_STEPS;
    let offset = startOffset;
    let velocity = startVelocity;
    let last = performance.now();
    setIsAnimating(true);

    function frictionFrame(now) {
      const dt = Math.min(now - last, 40);
      last = now;
      // Extra "brake" as we approach the travel limit so a hard flick eases
      // into the edge instead of hitting a wall and stopping dead.
      const nearEdge = Math.abs(offset) > maxOffset * 0.6;
      const effectiveFriction = nearEdge ? FRICTION * 5 : FRICTION;
      const sign = velocity > 0 ? 1 : velocity < 0 ? -1 : 0;
      const mag = Math.max(0, Math.abs(velocity) - effectiveFriction * dt);
      velocity = sign * mag;
      offset += velocity * dt;
      if (offset > maxOffset) {
        offset = maxOffset;
        velocity = 0;
      } else if (offset < -maxOffset) {
        offset = -maxOffset;
        velocity = 0;
      }
      setDragOffset(offset);
      if (Math.abs(velocity) > VELOCITY_STOP) {
        rafRef.current = requestAnimationFrame(frictionFrame);
      } else {
        settle(offset);
      }
    }

    if (Math.abs(velocity) > VELOCITY_STOP) {
      rafRef.current = requestAnimationFrame(frictionFrame);
    } else {
      settle(offset);
    }
  }

  // Final smooth ease into whichever picture the glide ended up closest to.
  function settle(offset) {
    const step = cardStepRef.current || 1;
    let steps = Math.round(offset / step);
    steps = Math.max(-MAX_TRAVEL_STEPS, Math.min(MAX_TRAVEL_STEPS, steps));
    if (steps === 0 && Math.abs(offset) > DRAG_THRESHOLD) {
      steps = offset < 0 ? -1 : 1;
    }
    const target = steps * step;
    const start = offset;
    const startTime = performance.now();

    function easeFrame(now) {
      const t = Math.min(1, (now - startTime) / SETTLE_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      setDragOffset(start + (target - start) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(easeFrame);
      } else {
        commitSteps(steps);
      }
    }
    rafRef.current = requestAnimationFrame(easeFrame);
  }

  function commitSteps(steps) {
    if (steps !== 0) {
      const dir = steps > 0 ? -1 : 1;
      setCarouselDir(dir);
      setDragCommitting(true);
      setCarouselIndex((i) => {
        const n = visibleWorks.length;
        return (((i - steps) % n) + n) % n;
      });
    }
    setIsAnimating(false);
    setDragOffset(0);
  }

  function handleCardClick(id) {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setLightboxId(id);
  }

  const slotCount = Math.min(VISIBLE_COUNT, visibleWorks.length);
  // The buffer is always rendered (not just while dragging) so that starting
  // or ending a drag never changes how many cards exist in the DOM -- that
  // used to force React to remount the whole visible strip on every
  // mousedown/mouseup, which showed up as a flash/blink and swallowed the
  // gesture. The extra cards sit clipped outside the visible track at rest.
  const bufferCount = Math.min(BUFFER, visibleWorks.length);
  const windowStart = carouselIndex - bufferCount;
  const windowLength = slotCount + bufferCount * 2;
  const carouselSlots =
    visibleWorks.length === 0
      ? []
      : Array.from({ length: windowLength }, (_, i) => {
          const n = visibleWorks.length;
          const idx = (((windowStart + i) % n) + n) % n;
          return { work: visibleWorks[idx], idx };
        });
  const trackTransform = -bufferCount * (cardStepRef.current || 0) + dragOffset;

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
          <a href="#contact">Contact</a>
        </nav>
      </header>

      {featured && activeSeries === SERIES_ALL && (
        <div className="ap-hero" onClick={() => setLightboxId(featured.id)}>
          <img src={featured.image} alt={featured.title} />
          <div className="ap-hero-overlay">
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
        <section className="ap-carousel">
          <div className="ap-carousel-row">
            <button className="ap-carousel-arrow" onClick={() => stepCarousel(-1)} aria-label="Previous paintings">‹</button>

            <div
              className="ap-carousel-viewport"
              style={{
                cursor: isDragging ? "grabbing" : "grab",
                userSelect: isDragging ? "none" : "auto",
              }}
              onMouseDown={(e) => handleDragStart(e.clientX)}
              onMouseMove={(e) => handleDragMove(e.clientX)}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
              onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
              onTouchEnd={handleDragEnd}
              onDragStart={(e) => e.preventDefault()}
            >
              {/* The transform lives on this inner track, while the parent
                  viewport (fixed size, overflow:hidden) never moves -- keeping
                  them on the same element used to drag the clipping window
                  itself off-screen during a big flick. */}
              <div
                ref={trackRef}
                className="ap-carousel-track"
                style={{
                  transform: "translateX(" + trackTransform + "px)",
                  transition: "none",
                }}
              >
                {carouselSlots.map(({ work: w, idx }, i) => (
                  <div
                    className={
                      "ap-card ap-carousel-card " +
                      // A drag settling already has its own motion from the
                      // glide itself. Skipping the pop-in class here also
                      // avoids a separate bug: this class is shared by every
                      // card, so if it changed value on a card that persists
                      // across the commit (same key, not remounted), the
                      // browser replays the fade-in animation on it anyway --
                      // a blink with no remount involved.
                      (dragCommitting ? "" : carouselDir === 1 ? "from-right" : "from-left")
                    }
                    key={dragCommitting ? w.id + "-" + idx : w.id + "-" + (windowStart + i)}
                    onClick={() => handleCardClick(w.id)}
                  >
                    <img src={w.image} alt={w.title} draggable={false} />
                    <div className="ap-plaque">
                      <div className="t">{w.title}</div>
                      <div className="m">{[w.medium, w.dimensions, w.year].filter(Boolean).join(" · ")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="ap-carousel-arrow" onClick={() => stepCarousel(1)} aria-label="Next paintings">›</button>
          </div>

          {visibleWorks.length > 1 && (
            <div className="ap-carousel-dots">
              {visibleWorks.map((w, i) => (
                <button
                  key={w.id}
                  className={i === carouselIndex ? "active" : ""}
                  onClick={() => {
                    setCarouselDir(i > carouselIndex ? 1 : -1);
                    setDragCommitting(false);
                    setCarouselIndex(i);
                  }}
                  aria-label={"Go to " + w.title}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {meta.bio && (
        <section className="ap-section-dark">
          <div className="ap-label" style={{ color: "#b9c4b6", marginBottom: 10 }}>About</div>
          <p className="ap-display" style={{ fontSize: 20, maxWidth: 720, lineHeight: 1.5 }}>{meta.bio}</p>
        </section>
      )}

      <Contact />

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
