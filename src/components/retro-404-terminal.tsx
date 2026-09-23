"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function Retro404Terminal() {
  const [tuning, setTuning] = useState(false);
  const [currentFreq, setCurrentFreq] = useState("404.00");
  const [signalLocked, setSignalLocked] = useState(false);
  const [logText, setLogText] = useState("TRANSMISSION OFFLINE // NO CARRIER DETECTED");
  const [staticActive, setStaticActive] = useState(true);

  const startAutoScan = () => {
    if (tuning) return;
    setTuning(true);
    setSignalLocked(false);
    setLogText("INITIALIZING FREQUENCY SCANNER...");

    const steps = [
      { freq: "404.00", text: "SEARCHING FREQUENCY: 404.00 MHz ... ERROR: VACUUM" },
      { freq: "318.45", text: "SEARCHING FREQUENCY: 318.45 MHz ... STATIC ONLY" },
      { freq: "220.10", text: "SEARCHING FREQUENCY: 220.10 MHz ... WEAK BEACON DETECTED" },
      { freq: "055.25", text: "LOCKING FREQUENCY: 055.25 MHz ... SIGNAL ACQUIRED!" },
    ];

    steps.forEach((step, i) => {
      setTimeout(() => {
        setCurrentFreq(step.freq);
        setLogText(step.text);
        if (i === steps.length - 1) {
          setTuning(false);
          setSignalLocked(true);
          setLogText("PRIMARY BROADCAST FOUND: ERIC VA PORTFOLIO [CH 01]");
        }
      }, (i + 1) * 600);
    });
  };

  return (
    <div className="terminal-404-wrapper">
      {/* ── RETRO CRT CHASSIS ──────────────────────────── */}
      <div className="terminal-crt-chassis">
        {/* Chassis Top Bar / Vents */}
        <div className="chassis-topbar">
          <div className="chassis-vents">
            <span /><span /><span /><span /><span />
          </div>
          <span className="chassis-brand">EV-CRT // MONITOR 404</span>
          <div className="chassis-leds">
            <span className={`status-led ${signalLocked ? "is-locked" : "is-lost"}`} />
            <span className="led-label">{signalLocked ? "LOCKED" : "NO SIG"}</span>
          </div>
        </div>

        {/* CRT Bezel & Screen */}
        <div className="terminal-bezel">
          <div className="terminal-screen">
            {/* Background Chunky Static Canvas */}
            <StaticNoiseCanvas active={staticActive} locked={signalLocked} />

            {/* CRT Glass & Scanline Overlays */}
            <div className="terminal-scanlines" aria-hidden="true" />
            <div className="terminal-glow" aria-hidden="true" />

            {/* On-Screen Display (OSD) Content */}
            <div className="terminal-osd">
              <div className="osd-topline">
                <span className="pixel-font osd-badge">CH. 404</span>
                <span className="osd-freq">FREQ: {currentFreq} MHz</span>
                <span className="osd-ntsc">NTSC-M • MONO</span>
              </div>

              {/* Big Chunky 404 Glitch Readout */}
              <div className="osd-center">
                <div className={`glitch-404 ${tuning ? "is-tuning" : ""} ${signalLocked ? "is-locked" : ""}`}>
                  <span className="glitch-text" data-text="404">404</span>
                </div>
                <p className="osd-subtitle">
                  {signalLocked ? ">> BROADCAST FREQUENCY RECOVERED <<" : ">> TRANSMISSION OFFLINE // PAGE NOT FOUND <<"}
                </p>
              </div>

              {/* Diagnostic Log Output */}
              <div className="osd-bottom">
                <div className="osd-log-box">
                  <span className="log-caret">&gt;</span>
                  <span className="log-msg">{logText}</span>
                  <span className="terminal-cursor">_</span>
                </div>
              </div>
            </div>
          </div>

          {/* CRT Tuning Dial & Controls Strip */}
          <div className="terminal-side-controls">
            <div className="terminal-knob-group">
              <span className="knob-label">TUNE</span>
              <button
                type="button"
                className={`knob-dial ${tuning ? "is-spinning" : ""}`}
                onClick={startAutoScan}
                disabled={tuning}
                title="Click to auto-tune frequency"
                aria-label="Auto-tune signal frequency"
              >
                <span className="knob-marker" />
              </button>
            </div>

            <div className="terminal-button-group">
              <button
                type="button"
                className={`chassis-btn ${tuning ? "active" : ""}`}
                onClick={startAutoScan}
                disabled={tuning}
              >
                {tuning ? "SCANNING..." : "AUTO-TUNE [SCAN]"}
              </button>
              <button
                type="button"
                className="chassis-btn secondary"
                onClick={() => setStaticActive((prev) => !prev)}
              >
                STATIC: {staticActive ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </div>

        {/* Chassis Bottom Speaker Grille & Channel Plate */}
        <div className="chassis-bottom">
          <div className="chassis-speaker-grille">
            <span /><span /><span /><span /><span /><span /><span /><span />
          </div>
          <div className="chassis-model">MODEL: EV-404-CRT // SERIAL: 2026-EV</div>
        </div>
      </div>

      {/* ── ACTION NAVIGATION BUTTONS ──────────────────── */}
      <div className="terminal-actions-bar">
        <p className="actions-prompt">
          <span className="status-square" /> SELECT DESTINATION VECTOR:
        </p>
        <div className="actions-button-grid">
          <Link href="/" className="retro-button primary-action">
            <span>⌂</span> RETURN TO BROADCAST ↵
          </Link>
          <Link href="/#projects" className="retro-button secondary">
            <span>▤</span> SELECTED WORK ↗
          </Link>
          <Link href="/#tech" className="retro-button secondary">
            <span>⚡</span> TECH STACK ↗
          </Link>
          <Link href="/#contact" className="retro-button secondary">
            <span>✉</span> CONTACT ME ↗
          </Link>
        </div>
      </div>
    </div>
  );
}

function StaticNoiseCanvas({ active, locked }: { active: boolean; locked: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const width = 160;
    const height = 90;
    canvas.width = width;
    canvas.height = height;

    const imgData = ctx.createImageData(width, height);
    const buf = new Uint32Array(imgData.data.buffer);
    const len = buf.length;

    let animId: number;
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const render = () => {
      // If locked onto signal, render darker scanline matrix
      const staticDensity = locked ? 0.15 : 1.0;

      for (let i = 0; i < len; i++) {
        if (Math.random() < staticDensity) {
          const val = (Math.random() * (locked ? 60 : 255)) | 0;
          if (Math.random() < 0.005) {
            buf[i] = 0xff30c060; // green burst
          } else {
            const g = Math.min(255, val + 15);
            buf[i] = 0xff000000 | (val << 16) | (g << 8) | val;
          }
        } else {
          buf[i] = 0xff0d150d; // deep phosphor backdrop
        }
      }

      ctx.putImageData(imgData, 0, 0);

      if (!reduced && active) {
        animId = requestAnimationFrame(render);
      }
    };

    if (active) {
      render();
    } else {
      // Clean static off
      buf.fill(0xff0d140d);
      ctx.putImageData(imgData, 0, 0);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [active, locked]);

  return <canvas ref={canvasRef} className="static-noise-canvas" aria-hidden="true" />;
}
