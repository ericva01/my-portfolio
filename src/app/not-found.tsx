import type { Metadata } from "next";
import Link from "next/link";
import { personal } from "@/data/portfolio";
import { Retro404Terminal } from "@/components/retro-404-terminal";

export const metadata: Metadata = {
  title: "404 - Transmission Lost | Eric Va",
  description: "The requested frequency or sector does not exist. Return to the primary broadcast.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="not-found-page lcd-texture">
      <div className="hero-gridlines" aria-hidden="true" />

      {/* ── HEADER STATUS ──────────────────────────────────── */}
      <header className="not-found-header">
        <div className="container">
          <div className="lcd-status" aria-hidden="true">
            <span className="signal">
              <i /><i /><i style={{ opacity: 0.2 }} /><i style={{ opacity: 0.2 }} />
            </span>
            <Link href="/" className="brand-logo">
              {personal.initials}<span>.</span>
            </Link>
            <span className="status-label">SIGNAL LOSS // 404</span>
            <span className="status-right">
              FREQ: 404.0 MHz <span className="battery"><i /><i /><i style={{ opacity: 0.2 }} /></span>
            </span>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
      <main id="main" className="not-found-main" tabIndex={-1}>
        <div className="container">
          <Retro404Terminal />
        </div>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="not-found-footer">
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} {personal.name.toUpperCase()}</span>
          <span>404 TRANSMISSION OFFLINE // DECOMMISSIONED FREQUENCY</span>
          <Link href="/" className="footer-return">
            [ RETURN HOME ↵ ]
          </Link>
        </div>
      </footer>
    </div>
  );
}
