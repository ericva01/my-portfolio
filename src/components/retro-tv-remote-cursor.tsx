"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export function RetroTVRemoteCursor({
  targetRef,
  targetId = "projects",
}: {
  targetRef?: RefObject<HTMLElement | null>;
  targetId?: string;
} = {}) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [visible, setVisible] = useState(false);
  const [activeTarget, setActiveTarget] = useState<string | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  useEffect(() => {
    const container =
      targetRef?.current ||
      (targetId ? document.getElementById(targetId) : null) ||
      cursorRef.current?.closest<HTMLElement>("#projects");
    if (!container) return;

    const onMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);

      const target = (e.target as HTMLElement) || document.elementFromPoint(e.clientX, e.clientY);
      const tv = target?.closest<HTMLElement>(".tv");
      const button = target?.closest<HTMLElement>("a, button, .retro-btn");
      const row = target?.closest<HTMLElement>(".project-row");

      if (tv) {
        const ch = tv.querySelector(".tv-topline span:last-child")?.textContent?.trim() || "CH 01";
        setActiveTarget(`${ch} • CRT DISPLAY`);
      } else if (button) {
        const text = button.textContent?.trim().slice(0, 16);
        setActiveTarget(`KEY: ${text || "SELECT"}`);
      } else if (row) {
        const title = row.querySelector("h4")?.textContent?.trim() || "PROJECT";
        const cat = row.querySelector(".project-category span")?.textContent?.trim() || "01";
        setActiveTarget(`CH ${cat} • ${title}`);
      } else {
        setActiveTarget(null);
      }
    };

    const onMouseEnter = () => setVisible(true);
    const onMouseLeave = () => {
      setVisible(false);
      setActiveTarget(null);
    };

    const onMouseDown = () => {
      setIsPressing(true);
      setTimeout(() => setIsPressing(false), 240);
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseenter", onMouseEnter);
    container.addEventListener("mouseleave", onMouseLeave);
    container.addEventListener("mousedown", onMouseDown);

    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseenter", onMouseEnter);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("mousedown", onMouseDown);
    };
  }, [targetRef, targetId]);

  return (
    <div
      ref={cursorRef}
      className={`tv-remote-cursor ${visible ? "is-visible" : ""} ${activeTarget ? "is-aiming" : ""} ${isPressing ? "is-pressing" : ""}`}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
      }}
      aria-hidden="true"
    >
      <div className="remote-wrap">
        {/* Infrared signal wave blast when clicking */}
        <div className="remote-ir-blast">
          <span className="ir-wave wave-1" />
          <span className="ir-wave wave-2" />
          <span className="ir-wave wave-3" />
        </div>

        {/* Vintage Old TV Controller SVG */}
        <svg
          viewBox="0 0 38 88"
          className="remote-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="tvRemoteBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#252e25" />
              <stop offset="40%" stopColor="#172017" />
              <stop offset="100%" stopColor="#0d140d" />
            </linearGradient>
            <radialGradient id="irLedGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff6b6b" />
              <stop offset="60%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </radialGradient>
            <linearGradient id="dpadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2e3d2e" />
              <stop offset="100%" stopColor="#151d15" />
            </linearGradient>
          </defs>

          {/* Top Infrared LED emitter tip - cursor hotspot at (19, 4) */}
          <ellipse cx="19" cy="4" rx="3.5" ry="3.5" fill="url(#irLedGlow)" className="remote-ir-diode" />
          <circle cx="18" cy="3" r="1.2" fill="#fff" opacity="0.65" />

          {/* Main Remote Body (Chunky retro TV clicker with beveled casing) */}
          <rect x="2" y="6" width="34" height="78" rx="6" ry="6" fill="url(#tvRemoteBody)" stroke="#3a4b3a" strokeWidth="1.2" />
          <rect x="3.5" y="7.5" width="31" height="75" rx="5" ry="5" fill="none" stroke="#101710" strokeWidth="0.8" />

          {/* Brand Badge */}
          <rect x="6" y="10" width="26" height="6.5" rx="2" fill="#0d150d" stroke="#253525" strokeWidth="0.8" />
          <text x="19" y="14.6" fill="#7ec860" fontSize="3" fontFamily="monospace" fontWeight="bold" textAnchor="middle" letterSpacing="0.8">CRT-REMOTE</text>

          {/* Top Row: Power & Mute */}
          <circle cx="9" cy="21" r="2.8" fill="#e11d48" className="remote-btn-power" />
          <text x="9" y="22" fill="#ffffff" fontSize="2.4" textAnchor="middle" fontWeight="bold">⏻</text>
          <circle cx="29" cy="21" r="2.4" fill="#334155" className="remote-btn" />
          <text x="29" y="21.8" fill="#94a3b8" fontSize="2" textAnchor="middle">🔇</text>

          {/* D-Pad rocker circle (CH ▲/▼, VOL ◄/►) */}
          <circle cx="19" cy="36" r="9.5" fill="url(#dpadGrad)" stroke="#3a4b3a" strokeWidth="0.9" />
          {/* CH UP */}
          <path d="M 19 28.5 L 16.5 31.5 L 21.5 31.5 Z" fill="#7ec860" />
          {/* CH DOWN */}
          <path d="M 19 43.5 L 16.5 40.5 L 21.5 40.5 Z" fill="#7ec860" />
          {/* VOL LEFT */}
          <path d="M 11.5 36 L 14.5 33.5 L 14.5 38.5 Z" fill="#94a3b8" />
          {/* VOL RIGHT */}
          <path d="M 26.5 36 L 23.5 33.5 L 23.5 38.5 Z" fill="#94a3b8" />
          {/* OK Center Button */}
          <circle cx="19" cy="36" r="2.8" fill="#1b261b" stroke="#7ec860" strokeWidth="0.8" />

          {/* Numeric Keypad grid (1-9) */}
          {/* Row 1 */}
          <rect x="7" y="49" width="6.5" height="4" rx="1" fill="#243224" />
          <rect x="15.8" y="49" width="6.5" height="4" rx="1" fill="#243224" />
          <rect x="24.5" y="49" width="6.5" height="4" rx="1" fill="#243224" />

          {/* Row 2 */}
          <rect x="7" y="55" width="6.5" height="4" rx="1" fill="#243224" />
          <rect x="15.8" y="55" width="6.5" height="4" rx="1" fill="#243224" />
          <rect x="24.5" y="55" width="6.5" height="4" rx="1" fill="#243224" />

          {/* Row 3 */}
          <rect x="7" y="61" width="6.5" height="4" rx="1" fill="#243224" />
          <rect x="15.8" y="61" width="6.5" height="4" rx="1" fill="#243224" />
          <rect x="24.5" y="61" width="6.5" height="4" rx="1" fill="#243224" />

          {/* Row 4: AV 0 TV */}
          <rect x="7" y="67" width="6.5" height="4" rx="1" fill="#182318" />
          <text x="10.2" y="69.8" fill="#7ec860" fontSize="2" textAnchor="middle">AV</text>
          <rect x="15.8" y="67" width="6.5" height="4" rx="1" fill="#243224" />
          <text x="19" y="69.8" fill="#94a3b8" fontSize="2" textAnchor="middle">0</text>
          <rect x="24.5" y="67" width="6.5" height="4" rx="1" fill="#182318" />
          <text x="27.8" y="69.8" fill="#7ec860" fontSize="2" textAnchor="middle">TV</text>

          {/* Bottom grip grooves */}
          <line x1="10" y1="75" x2="28" y2="75" stroke="#1d271d" strokeWidth="1" strokeLinecap="round" />
          <line x1="12" y1="77.5" x2="26" y2="77.5" stroke="#1d271d" strokeWidth="1" strokeLinecap="round" />
          <line x1="14" y1="80" x2="24" y2="80" stroke="#1d271d" strokeWidth="1" strokeLinecap="round" />
        </svg>

        {/* Remote Floating HUD Tag */}
        <div className="remote-hud">
          <div className="remote-hud-header">
            <span className="remote-hud-ir">● IR</span>
            <span className="remote-hud-mode">{isPressing ? "TX SIGNAL" : "REMOTE"}</span>
          </div>
          <div className="remote-hud-val">
            {activeTarget ? activeTarget.toUpperCase() : "CH 01 • STANDBY"}
          </div>
        </div>
      </div>
    </div>
  );
}
