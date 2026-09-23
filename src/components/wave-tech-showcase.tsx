"use client";

import { useRef, useState, type CSSProperties } from "react";
import { technologyCategories } from "@/data/portfolio";
import { TechLogo } from "@/components/tech-icons";
import { ScopeGunCursor } from "@/components/scope-gun-cursor";

type Category = (typeof technologyCategories)[number]["name"];
const technologies = technologyCategories.flatMap((category) =>
  category.topics.map((name) => ({ name, category: category.name }))
);

export function WaveTechShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<Category | "All">("All");
  const visible = technologies.filter((tech) => filter === "All" || tech.category === filter);
  const rowCount = filter === "All" ? 3 : 1;
  const rows = Array.from({ length: rowCount }, (_, row) => visible.filter((_, index) => index % rowCount === row));

  return (
    <section ref={sectionRef} id="tech" className="section-space wave-section tech-scope-active" aria-labelledby="tech-title">
      <ScopeGunCursor targetRef={sectionRef} />
      <div className="container">
        <div className="section-title-row">
          <div className="section-heading">
            <p className="eyebrow"><span>04</span> / TECH STACK</p>
            <h2 id="tech-title">SKILLS &amp; TOOLS.</h2>
          </div>
          <p>From interface to infrastructure.<br />The tools behind my work.</p>
        </div>
        <div className="wave-controls">
          <div className="tech-filters" role="group" aria-label="Filter technologies">
            {(["All", ...technologyCategories.map((category) => category.name)] as const).map((category) => (
              <button key={category} type="button" className="tech-filter-btn"
                aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}</button>
            ))}
          </div>
          <button type="button" className="wave-pause" aria-pressed={paused}
            onClick={() => setPaused((value) => !value)} aria-controls="technology-waves">
            {paused ? "Resume motion" : "Pause motion"}
          </button>
        </div>
        <div id="technology-waves" className={`wave-stage${paused ? " is-paused" : ""}`} key={filter}>
          {rows.map((row, rowIndex) => (
            <div className="wave-row" key={rowIndex}>
              <div className="wave-track" style={{ "--slide-duration": `${row.length * 5}s` } as CSSProperties}>
                {[0, 1].map((copy) => (
                  <ul className="wave-group" key={copy} aria-hidden={copy === 1 ? true : undefined} aria-label={copy === 0 ? `Technology row ${rowIndex + 1}` : undefined}>
                    {row.map((tech, index) => (
                      <li className="wave-card" key={tech.name} style={{ "--wave-delay": `${index * -0.55}s` } as CSSProperties}>
                        <TechLogo name={tech.name} className="wave-icon" />
                        <span><strong>{tech.name}</strong><small>{tech.category}</small></span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="wave-caption">{visible.length} technologies <span aria-hidden="true">/</span> {filter === "All" ? "Across 5 disciplines" : filter}</p>
      </div>
    </section>
  );
}
