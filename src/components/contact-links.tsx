"use client";

import { useState } from "react";
import { personal } from "@/data/portfolio";

export function ContactLinks() {
  const [feedback, setFeedback] = useState("");
  async function copyEmail() {
    try { await navigator.clipboard.writeText(personal.email); setFeedback("Email copied to clipboard."); }
    catch { setFeedback(`Copy manually: ${personal.email}`); }
  }
  return <div className="contact-links">
    {personal.email && <><a className="retro-button contact-email" href={`mailto:${personal.email}`}><ContactIcon kind="email" />{personal.email}</a><button className="retro-button secondary" onClick={copyEmail}><ContactIcon kind="copy" />COPY EMAIL</button></>}
    {personal.phone.href && <a className="retro-button secondary" href={personal.phone.href}><ContactIcon kind="phone" />{personal.phone.display}</a>}
    {personal.github && <a className="retro-button secondary" href={personal.github} target="_blank" rel="noopener noreferrer"><ContactIcon kind="github" />GITHUB<span className="sr-only"> (opens in a new tab)</span></a>}
    {personal.linkedin && <a className="retro-button secondary" href={personal.linkedin}>LINKEDIN <span aria-hidden="true">↗</span></a>}
    {!personal.email && !personal.phone.href && !personal.github && !personal.linkedin && <p className="contact-pending"><span aria-hidden="true">[ + ]</span> Contact links coming soon.</p>}
    <p className="copy-feedback" role="status" aria-live="polite">{feedback}</p>
  </div>;
}

function ContactIcon({ kind }: { kind: "email" | "phone" | "github" | "copy" }) {
  const paths = {
    email: "M2 4h16v12H2z M2 5l8 6 8-6",
    phone: "M3 2h4v5H5v3l5 5h3v-2h5v4h-3v1h-5l-8-8V5h1z",
    github: "M5 2l3 2h4l3-2v4l2 2v5l-3 3v3 M6 19v-3l-3-3V8l2-2z M6 16H3l-2-3",
    copy: "M7 7h10v11H7z M4 13H2V2h10v2",
  };
  return <svg className="contact-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" shapeRendering="crispEdges" aria-hidden="true"><path d={paths[kind]} /></svg>;
}
