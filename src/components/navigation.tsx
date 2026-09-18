"use client";

import { useEffect, useRef, useState } from "react";
import { navigation, personal } from "@/data/portfolio";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function Navigation() {
  const [active, setActive] = useState("home");
  const menu = useRef<HTMLDetailsElement>(null);
  const header = useRef<HTMLElement>(null);
  const indicatorPosition = useRef({ x: 0, width: 0 });
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = "home";
      document.querySelectorAll<HTMLElement>("main section[id]").forEach((section) => {
        if (section.getBoundingClientRect().top <= window.innerHeight * 0.35) current = section.id;
      });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = "contact";
      setActive(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, []);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)", reduced: "(prefers-reduced-motion: reduce)" }, ({ conditions }) => {
      const link = header.current?.querySelector<HTMLElement>(".desktop-nav a[aria-current]");
      if (conditions?.desktop && link) {
        const next = { x: link.offsetLeft, width: link.offsetWidth };
        gsap.fromTo(".nav-indicator", indicatorPosition.current, { ...next, duration: conditions.reduced ? 0 : 0.25, ease: "power2.out" });
        indicatorPosition.current = next;
      }
    }, header);
    return () => media.revert();
  }, { scope: header, dependencies: [active], revertOnUpdate: true });
  const links = navigation.map((name, index) => <a key={name} href={`#${name.toLowerCase()}`} aria-current={active === name.toLowerCase() ? "location" : undefined} onClick={() => { setActive(name.toLowerCase()); if (menu.current) menu.current.open = false; }}><span className="nav-number" aria-hidden="true">0{index + 1}</span>{name}</a>);
  return <header ref={header} className="site-header">
    <div className="container nav-inner">
      <a href="#home" aria-label="Eric Va home" className="logo">{personal.initials}<span aria-hidden="true">.</span></a>
      <nav aria-label="Main navigation" className="desktop-nav">{links}<span className="nav-indicator" aria-hidden="true" /></nav>
      <span className="nav-note" aria-hidden="true">PERSONAL PORTFOLIO</span>
      <details ref={menu} className="mobile-menu" onKeyDown={(event) => { if (event.key === "Escape" && menu.current) { menu.current.open = false; menu.current.querySelector("summary")?.focus(); } }}>
        <summary>{active.toUpperCase()} / MENU <span aria-hidden="true">☰</span></summary>
        <nav aria-label="Mobile navigation">{links}</nav>
      </details>
    </div>
    <div className="scroll-progress" aria-hidden="true" />
  </header>;
}
