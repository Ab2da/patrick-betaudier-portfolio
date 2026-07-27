jsx
"use client";

import { useState } from "react";

const FORM_ENDPOINT = "https://formspree.io/f/mrenrrbl";

export default function Contact() {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    const form = e.target;
    const data = new FormData(form);
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setStatus("sent");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="ap-section-dark" id="contact">
      <div className="ap-label" style={{ color: "#b9c4b6", marginBottom: 10 }}>Get in Touch</div>
      <p className="ap-display" style={{ fontSize: 20, maxWidth: 560, lineHeight: 1.5, marginBottom: 24 }}>
        Contact the Artist
      </p>

      {status === "sent" ? (
        <p style={{ maxWidth: 480, fontSize: 14 }}>
          Thank you — your message has been sent. I&rsquo;ll get back to you soon.
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 480 }}>
          <input className="ap-input" type="text" name="name" placeholder="Your name" required />
          <input className="ap-input" type="email" name="email" placeholder="Your email" required />
          <textarea className="ap-textarea" name="message" placeholder="Your message" rows={5} required />
          <button className="ap-btn ap-btn-primary" type="submit" disabled={status === "sending"} style={{ justifySelf: "start" }}>
            {status === "sending" ? "Sending…" : "Send Message"}
          </button>
          {status === "error" && (
            <p style={{ fontSize: 12, color: "#e0a0a0" }}>
              Something went wrong — please try again, or email directly.
            </p>
          )}
        </form>
      )}
    </section>
  );
}
