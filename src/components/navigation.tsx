"use client";

import { useEffect, useRef, useState } from "react";
import { navigation, personal } from "@/data/portfolio";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function Navigation() {
  const [active, setActive] = useState("home");
  const [hovered, setHovered] = useState<string | null>(null);
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

  const currentTarget = hovered || active;

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)", reduced: "(prefers-reduced-motion: reduce)" }, ({ conditions }) => {
      const link = header.current?.querySelector<HTMLElement>(`.desktop-nav a[href="#${currentTarget}"]`);
      if (conditions?.desktop && link) {
        const next = { x: link.offsetLeft, width: link.offsetWidth };
        if (indicatorPosition.current.width === 0) {
          gsap.set(".nav-indicator", next);
        } else {
          gsap.to(".nav-indicator", {
            ...next,
            duration: conditions.reduced ? 0 : 0.38,
            ease: "power3.out",
            overwrite: "auto",
          });
        }
        indicatorPosition.current = next;
      }
    }, header);
    return () => media.revert();
  }, { scope: header, dependencies: [currentTarget], revertOnUpdate: true });

  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();
    const section = document.getElementById(targetId);
    if (section) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        section.scrollIntoView({ behavior: "instant" });
      } else {
        const navHeight = header.current?.offsetHeight || 74;
        const targetY = section.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({
          top: targetY,
          behavior: "smooth",
        });
      }
    }
    window.history.pushState(null, "", `#${targetId}`);
    setActive(targetId);
    setHovered(null);
    if (menu.current) menu.current.open = false;
  };

  const links = navigation.map((name, index) => {
    const id = name.toLowerCase();
    return (
      <a
        key={name}
        href={`#${id}`}
        aria-current={active === id ? "location" : undefined}
        onClick={(e) => handleNavClick(e, id)}
        onMouseEnter={() => setHovered(id)}
      >
        <span className="nav-number" aria-hidden="true">0{index + 1}</span>
        {name}
      </a>
    );
  });

  return <header ref={header} className="site-header">
    <div className="container nav-inner">
      <a href="#home" aria-label="Eric Va home" className="logo" onClick={(e) => handleNavClick(e, "home")}>
        {personal.initials}<span aria-hidden="true">.</span>
      </a>
      <nav
        aria-label="Main navigation"
        className="desktop-nav"
        onMouseLeave={() => setHovered(null)}
      >
        {links}
        <span className="nav-indicator" aria-hidden="true" />
      </nav>
      <span className="nav-note" aria-hidden="true">PERSONAL PORTFOLIO</span>
      <details ref={menu} className="mobile-menu" onKeyDown={(event) => { if (event.key === "Escape" && menu.current) { menu.current.open = false; menu.current.querySelector("summary")?.focus(); } }}>
        <summary>{active.toUpperCase()} / MENU <span aria-hidden="true">☰</span></summary>
        <nav aria-label="Mobile navigation">{links}</nav>
      </details>
    </div>
    <div className="scroll-progress" aria-hidden="true" />
  </header>;
}
