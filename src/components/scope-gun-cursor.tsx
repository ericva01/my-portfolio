"use client";

import { useEffect, useState, type RefObject } from "react";

export function ScopeGunCursor({ targetRef }: { targetRef: RefObject<HTMLElement | null> }) {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [visible, setVisible] = useState(false);
  const [lockedTarget, setLockedTarget] = useState<string | null>(null);
  const [isFiring, setIsFiring] = useState(false);

  useEffect(() => {
    const container = targetRef.current;
    if (!container) return;

    const onMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);

      const target = (e.target as HTMLElement) || document.elementFromPoint(e.clientX, e.clientY);
      const card = target?.closest<HTMLElement>(".wave-card");
      const button = target?.closest<HTMLElement>("button, a, .tech-filter-btn");
      if (card) {
        const title = card.querySelector("strong")?.textContent;
        setLockedTarget(title || "TARGET ACQUIRED");
      } else if (button) {
        const text = button.textContent?.trim();
        setLockedTarget(text || "CONTROL");
      } else {
        setLockedTarget(null);
      }
    };

    const onMouseEnter = () => setVisible(true);
    const onMouseLeave = () => {
      setVisible(false);
      setLockedTarget(null);
    };

    const onMouseDown = () => {
      setIsFiring(true);
      setTimeout(() => setIsFiring(false), 220);
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
  }, [targetRef]);

  return (
    <div
      className={`scope-gun-cursor ${visible ? "is-visible" : ""} ${lockedTarget ? "is-locked" : ""} ${isFiring ? "is-firing" : ""}`}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
      }}
      aria-hidden="true"
    >
      <div className="scope-reticle-wrap">
        <svg
          viewBox="0 0 100 100"
          className="scope-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Lens Ring */}
          <circle cx="50" cy="50" r="42" className="scope-ring-outer" />
          <circle cx="50" cy="50" r="32" className="scope-ring-inner" />

          {/* Tactical Corner Brackets */}
          <path d="M 28 35 L 28 28 L 35 28" className="scope-bracket" />
          <path d="M 72 35 L 72 28 L 65 28" className="scope-bracket" />
          <path d="M 28 65 L 28 72 L 35 72" className="scope-bracket" />
          <path d="M 72 65 L 72 72 L 65 72" className="scope-bracket" />

          {/* Crosshairs */}
          {/* Top crosshair with degree mark */}
          <line x1="50" y1="8" x2="50" y2="38" className="scope-crosshair" />
          <line x1="47" y1="20" x2="53" y2="20" className="scope-tick" />
          
          {/* Bottom crosshair with ballistic drop elevation ticks (mil-dots) */}
          <line x1="50" y1="62" x2="50" y2="92" className="scope-crosshair" />
          <line x1="47" y1="68" x2="53" y2="68" className="scope-tick" />
          <line x1="45" y1="74" x2="55" y2="74" className="scope-tick wide" />
          <line x1="44" y1="80" x2="56" y2="80" className="scope-tick wider" />
          <line x1="42" y1="86" x2="58" y2="86" className="scope-tick widest" />

          {/* Left crosshair with windage ticks */}
          <line x1="8" y1="50" x2="38" y2="50" className="scope-crosshair" />
          <line x1="22" y1="47" x2="22" y2="53" className="scope-tick" />
          <line x1="30" y1="48" x2="30" y2="52" className="scope-tick" />

          {/* Right crosshair with windage ticks */}
          <line x1="62" y1="50" x2="92" y2="50" className="scope-crosshair" />
          <line x1="78" y1="47" x2="78" y2="53" className="scope-tick" />
          <line x1="70" y1="48" x2="70" y2="52" className="scope-tick" />

          {/* Center Crosshair Pinpoint */}
          <circle cx="50" cy="50" r="2.2" className="scope-center-dot" />
        </svg>

        {/* Firing muzzle flash ring */}
        <div className="scope-muzzle-flash" />

        {/* Tactical HUD Data Tag */}
        <div className="scope-hud">
          <div className="scope-hud-title">
            <span className="scope-hud-mode">{lockedTarget ? "LOCK" : "SCAN"}</span>
            <span className="scope-hud-zoom">8x50</span>
          </div>
          <div className="scope-hud-target">
            {lockedTarget ? `TGT: ${lockedTarget.toUpperCase()}` : "ACQUIRING..."}
          </div>
        </div>
      </div>
    </div>
  );
}
