"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { introConfig, personal } from "@/data/portfolio";
import { loadYouTubeAPI, type YouTubePlayer } from "./youtube-api";

gsap.registerPlugin(useGSAP);

export function RetroTVIntro() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => { document.documentElement.dataset.intro = "show"; setOpen(true); };
    // Cancel the first Strict Mode pass; read session storage after hydration.
    const frame = requestAnimationFrame(() => {
      let seen = false;
      try { seen = sessionStorage.getItem(introConfig.sessionKey) === "1"; } catch { /* storage unavailable */ }
      if (introConfig.enabled && !seen) show();
      else {
        document.documentElement.dataset.intro = "skip";
        window.dispatchEvent(new Event("portfolio:entered"));
      }
    });
    const replay = () => { window.scrollTo({ top: 0, behavior: "instant" }); show(); };
    window.addEventListener("portfolio:replay-intro", replay);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("portfolio:replay-intro", replay); };
  }, []);
  return open ? <IntroDialog onFinish={() => setOpen(false)} /> : null;
}

function IntroDialog({ onFinish }: { onFinish: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const stopPlayer = useRef<() => void>(() => {});
  const busy = useRef(false);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState("Loading music controls. You can enter the portfolio at any time.");
  const { contextSafe } = useGSAP({ scope: dialog });

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    element.querySelector<HTMLButtonElement>(".intro-enter")?.focus();
    return () => { document.body.style.overflow = overflow; element.close(); };
  }, []);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let disposed = false;
    let instance: YouTubePlayer | null = null;
    let syncMute: number | undefined;
    const iframe = document.createElement("iframe");
    iframe.title = "Eric Va portfolio intro music - YouTube video player";
    iframe.src = `https://www.youtube.com/embed/cT68Dz1jO94?enablejsapi=1&autoplay=0&controls=1&playsinline=1&fs=1&origin=${encodeURIComponent(window.location.origin)}`;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    container.appendChild(iframe);
    const fallback = () => {
      if (disposed) return;
      setReady(false);
      setStatus("Intro music is unavailable. Try the YouTube controls, or enter the portfolio.");
    };
    const timeout = window.setTimeout(fallback, 20000);
    const destroy = () => {
      if (disposed) return;
      disposed = true;
      window.clearTimeout(timeout);
      window.clearInterval(syncMute);
      try { instance?.mute(); } catch { /* detached player */ }
      try { instance?.stopVideo(); } catch { /* not ready */ }
      try { instance?.destroy(); } catch { /* already removed */ }
      container.replaceChildren();
      player.current = null;
    };
    stopPlayer.current = destroy;
    void loadYouTubeAPI().then((api) => {
      if (disposed) return;
      instance = new api.Player(iframe, { events: {
        onReady: (event) => {
          if (disposed) return;
          window.clearTimeout(timeout);
          player.current = event.target;
          setReady(true);
          setMuted(event.target.isMuted());
          setStatus("Music is optional. Press PLAY INTRO MUSIC or use the YouTube controls.");
          // Keep the label in sync with YouTube's native mute control too.
          syncMute = window.setInterval(() => {
            if (!disposed && player.current) setMuted(player.current.isMuted());
          }, 500);
        },
        onStateChange: (event) => {
          if (disposed) return;
          if (event.data === 1) setStatus("Intro music is playing. Enter the portfolio whenever you're ready.");
          if (event.data === 2) setStatus("Music paused. Use PLAY INTRO MUSIC to resume.");
          if (event.data === 0) setStatus("Music finished. Replay it or enter the portfolio.");
          setMuted(event.target.isMuted());
        },
        onError: () => { window.clearTimeout(timeout); fallback(); },
        onAutoplayBlocked: () => {
          if (!disposed) setStatus("Your browser blocked playback. Press Play in the YouTube player, or enter the portfolio.");
        },
      } });
    }).catch(fallback);
    return destroy;
  }, []);

  const play = () => {
    if (!ready || busy.current || !player.current) return;
    try {
      setStatus("Starting music. If it doesn't start, press Play in the YouTube player.");
      // Synchronous calls preserve the visitor's click gesture.
      player.current.unMute();
      player.current.setVolume(70);
      player.current.playVideo();
      setMuted(false);
    } catch { setStatus("Press Play in the YouTube player to start music."); }
  };
  const toggleMute = () => {
    if (!ready || busy.current || !player.current) return;
    const next = !player.current.isMuted();
    if (next) player.current.mute(); else player.current.unMute();
    setMuted(next);
  };
  const finish = () => {
    try { sessionStorage.setItem(introConfig.sessionKey, "1"); } catch { /* storage unavailable */ }
    document.documentElement.dataset.intro = "skip";
    dialog.current?.close();
    onFinish();
    document.querySelector<HTMLElement>("#main")?.focus({ preventScroll: true });
    window.dispatchEvent(new Event("portfolio:entered"));
  };
  const dismiss = () => {
    if (busy.current) return;
    busy.current = true;
    stopPlayer.current();
    contextSafe(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const tl = gsap.timeline({ onComplete: finish });
      if (!reduced) {
        tl.to(".intro-tv-topbar", { x: 3, duration: 0.06, repeat: 3, yoyo: true, ease: "none" })
          .to(".intro-screen", { scaleY: 0.015, opacity: 0.6, duration: 0.3, ease: "power3.in" })
          .to(".intro-screen", { opacity: 0, duration: 0.12 });
      }
      tl.to(dialog.current, { opacity: 0, duration: reduced ? 0 : 0.3 });
    })();
  };

  return <dialog ref={dialog} className="tv-intro" aria-labelledby="intro-title" aria-describedby="intro-description"
    onCancel={(event) => { event.preventDefault(); dismiss(); }}>
    <div className="intro-stage">
      <div className="intro-tv">
        <div className="intro-tv-topbar">
          <span className="intro-scanlines" aria-hidden="true" /><span className="intro-noise" aria-hidden="true" />
          <span id="intro-title">{personal.name.toUpperCase()} / INTRO</span><span aria-hidden="true">EV / 01</span>
        </div>
        <div className="intro-tv-bezel"><div className="intro-screen"><div className="intro-player" ref={host} /></div></div>
        <div className="intro-music-controls">
          <button type="button" className="intro-play" onClick={play} disabled={!ready}>PLAY INTRO MUSIC</button>
          <button type="button" className="intro-mute" onClick={toggleMute} disabled={!ready}>{muted ? "UNMUTE MUSIC" : "MUTE MUSIC"}</button>
        </div>
        <p className="intro-music-status" id="intro-description" role="status" aria-live="polite">{status}</p>
        <div className="intro-tv-controls" aria-hidden="true">
          <div className="intro-speaker" /><div className="intro-dials"><div className="intro-dial"><i /></div><div className="intro-dial small"><i /></div></div><span className="intro-power-light on" />
        </div>
        <div className="intro-tv-bottom"><button type="button" className="intro-enter" onClick={dismiss}>ENTER PORTFOLIO<span aria-hidden="true"> &crarr;</span></button></div>
      </div>
      <a className="intro-skip" href="#main" onClick={(event) => { event.preventDefault(); dismiss(); }}>Skip intro</a>
    </div>
  </dialog>;
}

export function ReplayIntro() {
  return <button className="replay-intro" type="button" onClick={() => window.dispatchEvent(new Event("portfolio:replay-intro"))}>REPLAY INTRO</button>;
}
