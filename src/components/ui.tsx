import type { ReactNode } from "react";

export function RetroButton({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <a className={`retro-button ${secondary ? "secondary" : ""}`} href={href}>{children}<span aria-hidden="true">↗</span></a>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`retro-panel ${className}`}>{children}</div>;
}

export function SectionHeading({ number, label, title, children }: { number: string; label: string; title: string; children?: ReactNode }) {
  return <div className="section-heading"><p className="eyebrow"><span>{number}</span> / {label}</p><h2 data-reveal>{title}</h2>{children}</div>;
}
