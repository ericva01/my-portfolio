"use client";

import { useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Motion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const heroAnimated = useRef(false);

  useGSAP(() => {
    const media = gsap.matchMedia();
    let disposed = false;
    let enteredListener: (() => void) | undefined;

    const runHeroEntrance = (conditions: Record<string, boolean> | undefined) => {
      if (heroAnimated.current || conditions?.reduced) return;
      heroAnimated.current = true;
      const desktop = conditions?.desktop;
      gsap.fromTo(".hero-copy .hero-reveal", { y: 24, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: "power2.out" });
      gsap.to(".hero-gridlines", { y: desktop ? 55 : 20, ease: "none", scrollTrigger: { trigger: "#home", start: "top top", end: "bottom top", scrub: 0.8 } });
    };

    try {
      media.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)", reduced: "(prefers-reduced-motion: reduce)" }, ({ conditions }) => {
        if (conditions?.reduced) return;
        const desktop = conditions?.desktop;
        const distance = desktop ? 38 : 22;
        const entrance = (trigger: Element | string) => gsap.timeline({
          defaults: { duration: 0.85, ease: "power2.out" },
          scrollTrigger: { trigger, start: "clamp(top 82%)", toggleActions: "restart none restart none" },
        });
        const reveal = (timeline: gsap.core.Timeline, targets: gsap.TweenTarget) => {
          timeline.fromTo(targets, { y: distance, opacity: 0.25 }, { y: 0, opacity: 1, stagger: 0.12, immediateRender: false });
        };

        // Hero entrance fires after the TV intro completes, or immediately if no intro.
        const alreadyEntered = document.documentElement.dataset.intro === "skip";
        if (alreadyEntered) {
          runHeroEntrance(conditions);
        } else {
          if (enteredListener) window.removeEventListener("portfolio:entered", enteredListener);
          enteredListener = () => { runHeroEntrance(conditions); ScrollTrigger.refresh(); };
          window.addEventListener("portfolio:entered", enteredListener, { once: true });
        }

        reveal(entrance(".about-grid"), ".about-section .section-heading, .about-text, .about-note, .profile-panel");
        reveal(entrance("#education .section-heading"), "#education .section-heading");
        gsap.fromTo(".timeline-fill", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".education-grid", start: "top 70%", end: "bottom 65%", scrub: 0.4 } });
        gsap.utils.toArray<HTMLElement>(".education-entry").forEach((entry) => {
          reveal(entrance(entry), entry);
          entry.querySelectorAll(".education-program").forEach((program) => reveal(entrance(program), program));
        });
        // Technology section
        reveal(entrance("#tech .section-heading"), "#tech .section-heading");
        reveal(entrance(".wave-controls"), ".wave-controls");
        reveal(entrance("#projects .section-heading"), "#projects .section-heading");
        gsap.utils.toArray<HTMLElement>(".project-row").forEach((row) => {
          const frame = row.querySelector(".tv, .software-window");
          const copy = row.querySelectorAll(".project-copy > *");
          const timeline = entrance(row);
          timeline.fromTo(frame, { x: desktop ? -30 : 0, y: desktop ? 0 : 22, opacity: 0.3 }, { x: 0, y: 0, opacity: 1, immediateRender: false }, 0);
          timeline.fromTo(copy, { x: desktop ? 26 : 0, y: desktop ? 0 : 18, opacity: 0.25 }, { x: 0, y: 0, opacity: 1, stagger: 0.1, immediateRender: false }, 0.15);
        });
        reveal(entrance("#contact"), "#contact .eyebrow, #contact h2, #contact h2 + p, .contact-links > a, .contact-links > button");
        reveal(entrance("footer"), ".footer-top, .footer-bottom");
        gsap.fromTo(".scroll-progress", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: scope.current, start: "top top", end: "bottom bottom", scrub: 0.15 } });
      }, scope);
    } catch (error) {
      media.revert();
      console.error("Portfolio animation initialization failed", error);
    }
    const refresh = () => { if (!disposed) ScrollTrigger.refresh(); };
    void document.fonts.ready.then(refresh);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("hashchange", refresh);
    return () => {
      disposed = true;
      if (enteredListener) window.removeEventListener("portfolio:entered", enteredListener);
      heroAnimated.current = false;
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("hashchange", refresh);
      media.revert();
    };
  }, { scope, dependencies: [pathname], revertOnUpdate: true });
  return <div ref={scope}>{children}</div>;
}
