"use client";

import { useRef, useState, type FormEvent } from "react";

export function ContactForm() {
  const busy = useRef(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    busy.current = true;
    setSending(true);
    setStatus(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
        signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your message could not be sent. Please try again.");
      setStatus({ ok: true, message: "Message sent. Thanks for reaching out!" });
      form.reset();
    } catch (error) {
      setStatus({ ok: false, message: error instanceof Error && error.name !== "TimeoutError" && error.name !== "TypeError"
        ? error.message : "We couldn't confirm delivery. Please try again shortly or email me directly." });
    } finally {
      busy.current = false;
      setSending(false);
    }
  }

  return <form className="contact-form" onSubmit={submit} aria-labelledby="contact-form-title" aria-busy={sending}>
    <div className="contact-form-heading"><h3 id="contact-form-title">Send a message</h3><span aria-hidden="true">↗</span></div>
    <p className="contact-form-note">Tell me what you have in mind. All fields are required.</p>
    <fieldset disabled={sending}>
      <div className="contact-field-row">
        <label htmlFor="contact-name">Your name<input id="contact-name" name="name" autoComplete="name" required minLength={2} maxLength={80} placeholder="Alex Chen" /></label>
        <label htmlFor="contact-email">Email address<input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="alex@example.com" /></label>
      </div>
      <label htmlFor="contact-subject">Subject<input id="contact-subject" name="subject" required minLength={3} maxLength={120} placeholder="Let's build something together" /></label>
      <label htmlFor="contact-message">Message<textarea id="contact-message" name="message" required minLength={10} maxLength={5000} rows={5} placeholder="A little about your project or opportunity…" /></label>
      <div className="contact-trap" aria-hidden="true"><label htmlFor="contact-website">Leave this empty<input id="contact-website" name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <button className="retro-button" type="submit" disabled={sending}>{sending ? "SENDING…" : "SEND MESSAGE"}<span aria-hidden="true">↗</span></button>
    </fieldset>
    <p className={`contact-form-status${status && !status.ok ? " is-error" : ""}`} role="status" aria-live="polite">{status?.message}</p>
  </form>;
}
