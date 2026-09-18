"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Project } from "@/data/portfolio";

gsap.registerPlugin(useGSAP);

export function RetroTV({ project, channel }: { project: Project; channel: number }) {
  const scope = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const { contextSafe } = useGSAP({ scope });
  const onPlay = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    document.querySelectorAll<HTMLVideoElement>("video[data-project-video]").forEach((video) => { if (video !== event.currentTarget) video.pause(); });
    setPlaying(true);
    if (!started.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      contextSafe(() => gsap.fromTo(".power-light", { opacity: 0.4 }, { opacity: 1, duration: 0.45, ease: "steps(5)" }))();
    }
    started.current = true;
  };
  return <div ref={scope} className="tv" data-reveal>
    <div className="tv-topline"><span>EV / VISUAL SYSTEMS</span><span>CH. 0{channel}</span></div>
    <div className="tv-body">
      <div className="tv-bezel"><div className="tv-screen aspect-video">
        {project.youtubeEmbedUrl ? <iframe
          src={`${project.youtubeEmbedUrl}${project.youtubeEmbedUrl.includes("?") ? "&" : "?"}autoplay=0&playsinline=1`}
          title={`${project.name} project demo`}
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        /> : project.videoSrc && !failed ? <video data-project-video controls playsInline preload="none" poster={project.posterSrc} aria-label={`${project.name} project demo`} onPlay={onPlay} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false); }}>
          <source src={project.videoSrc} />
          {project.captions?.map((track) => <track key={track.src} kind="captions" {...track} />)}
          Your browser does not support video playback.
        </video> : <div className="tape-placeholder">
          <svg viewBox="0 0 72 48" className="tape-icon" aria-hidden="true" shapeRendering="crispEdges"><path d="M4 4h64v40H4zM0 8h4v32H0zM68 8h4v32h-4z" fill="currentColor"/><path d="M10 10h52v20H10zM18 35h36v9H18z" fill="#263020"/><path d="M16 15h10v10H16zM46 15h10v10H46zM26 19h20v3H26z" fill="currentColor"/></svg>
          <span className="pixel-font">{failed ? "TAPE UNAVAILABLE" : "DEMO TAPE COMING SOON"}</span>
          <p role={failed ? "status" : undefined}>{failed ? "The demo could not be loaded." : "Video will be added later."}</p>
        </div>}
        {!project.youtubeEmbedUrl && (!project.videoSrc || failed) && <div className="crt-overlay" aria-hidden="true" />}
      </div></div>
      <div className="tv-controls" aria-hidden="true"><div className="dial"><i /></div><div className="dial small"><i /></div><div className="speaker" /><span className={`power-light ${project.youtubeEmbedUrl || playing ? "on" : ""}`} /><span className="power-label">POWER</span></div>
    </div>
    <div className="tv-bottom"><span>{project.name.toUpperCase()}</span><span>STEREO ▪ CRT</span></div>
    <div className="tv-feet" aria-hidden="true" />
  </div>;
}
