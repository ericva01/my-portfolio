import { personal, education, projects } from "@/data/portfolio";
import { Navigation } from "@/components/navigation";
import { Motion } from "@/components/motion";
import { Panel, RetroButton, SectionHeading } from "@/components/ui";
import { EducationEntry, ProjectSection } from "@/components/content";
import { ContactLinks } from "@/components/contact-links";
import { ContactForm } from "@/components/contact-form";
import { RetroTVIntro, ReplayIntro } from "@/components/retro-tv-intro";
import { WaveTechShowcase } from "@/components/wave-tech-showcase";
import { RetroTVRemoteCursor } from "@/components/retro-tv-remote-cursor";

export default function Home() {
  return (
    <Motion>
      <RetroTVIntro />
      <Navigation />
      <main id="main" tabIndex={-1}>
        {/* ── HERO ──────────────────────────────────────────────── */}
        <section id="home" className="hero lcd-texture">
          <div className="hero-gridlines" aria-hidden="true" />
          <div className="container">
            <div className="lcd-status" aria-hidden="true">
              <span className="signal"><i /><i /><i /><i /></span>
              <span>ERIC VA</span>
              <span className="status-right">PORTFOLIO V.01 <span className="battery"><i /><i /><i /></span></span>
            </div>
            <div className="hero-grid">
              <div className="hero-copy">
                <p className="eyebrow hero-reveal"><span className="status-square" /> HELLO, WORLD.</p>
                <h1 className="hero-reveal">I&apos;m Eric Va<span className="hero-period">.</span></h1>
                <p className="hero-role hero-reveal">SOFTWARE DEVELOPER</p>
                <p className="hero-direction hero-reveal"><span aria-hidden="true">↳</span> Exploring {personal.direction}</p>
                <p className="hero-introduction hero-reveal">{personal.introduction}</p>
                <div className="hero-actions hero-reveal">
                  <RetroButton href="#projects">VIEW PROJECTS</RetroButton>
                  <RetroButton href="#contact" secondary>CONTACT ME</RetroButton>
                </div>
              </div>
              <aside className="hero-work" aria-labelledby="hero-work-title">
                <div className="hero-work-heading"><h2 id="hero-work-title">A FEW THINGS I&apos;VE BUILT</h2><span aria-hidden="true">↗</span></div>
                {projects.map((project, index) => (
                  <a className="hero-work-link" href={`#${project.id}`} key={project.id}>
                    <span className="hero-work-number">0{index + 1}</span>
                    <span><strong>{project.name}</strong><small>{project.title.split(" — ")[1]}</small></span>
                    <span className="hero-work-arrow" aria-hidden="true">↗</span>
                  </a>
                ))}
                <p className="hero-work-note"><span className="status-square" /> From ideas to working software.</p>
              </aside>
            </div>
            <div className="hero-bottom">
              <span>BUILD · LEARN · REPEAT</span>
              <a href="#about">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a>
              <span aria-hidden="true">[ SELECT ]</span>
            </div>
          </div>
        </section>

        {/* ── ABOUT ─────────────────────────────────────────────── */}
        <section id="about" className="section-space about-section">
          <div className="container about-grid">
            <div>
              <SectionHeading number="01" label="ABOUT ME" title="PROFILE &amp; DIRECTION." />
              <p className="about-text">{personal.about}</p>
              <p className="about-note"><span aria-hidden="true">↳</span> Always learning. Always building.</p>
            </div>
            <Panel className="profile-panel">
              <div className="panel-title"><span>USER PROFILE</span><span aria-hidden="true">[ EV ]</span></div>
              <dl>
                <div><dt>PROFILE</dt><dd>{personal.name}</dd></div>
                <div><dt>CURRENT ROLE</dt><dd>{personal.role}<small>at {personal.employer}</small></dd></div>
                <div><dt>EDUCATION</dt><dd>MIS student<small>SETEC Institute</small></dd></div>
                <div><dt>INTERESTS</dt><dd>{personal.interests.join(" / ")}</dd></div>
              </dl>
              <div className="profile-bottom"><span className="status-square" /> LEARNING MODE: ALWAYS ON</div>
            </Panel>
          </div>
        </section>

        {/* ── EDUCATION ─────────────────────────────────────────── */}
        <section id="education" className="section-space education-section">
          <div className="container">
            <div className="section-title-row">
              <SectionHeading number="02" label="EDUCATION" title="EDUCATION &amp; TRAINING." />
              <p>A foundation in software.<br />A direction toward DevOps.</p>
            </div>
            <div className="education-grid">
              <div className="timeline-track" aria-hidden="true"><span className="timeline-fill" /></div>
              {education.map((entry) => <EducationEntry key={entry.name} entry={entry} />)}
            </div>
          </div>
        </section>

        {/* ── TECH STACK ────────────────────────────────────────── */}
        <WaveTechShowcase />

        {/* ── PROJECTS ──────────────────────────────────────────── */}
        <section id="projects" className="section-space projects-section projects-remote-active">
          <RetroTVRemoteCursor />
          <div className="container">
            <div className="section-title-row">
              <SectionHeading number="05" label="SELECTED PROJECTS" title="SELECTED WORK." />
              <p><span className="pixel-font">{String(projects.length).padStart(2, "0")}</span> PROJECTS<br />SOFTWARE / SYSTEMS</p>
            </div>
            {(["academic", "personal"] as const).map((group) => (
              <div className="project-group" key={group} role="group" aria-labelledby={`${group}-projects-title`}>
                <h3 className="project-group-title" id={`${group}-projects-title`}>
                  {group === "academic" ? "Academic Projects" : "Personal Projects"}
                </h3>
                {projects.filter((p) => p.group === group).map((p) => (
                  <ProjectSection key={p.id} project={p} index={projects.indexOf(p)} />
                ))}
              </div>
            ))}
            <div className="projects-end" aria-hidden="true">[ END OF TRANSMISSION ] <span>▪ ▪ ▪</span></div>
          </div>
        </section>

        {/* ── CONTACT ───────────────────────────────────────────── */}
        <section id="contact" className="section-space contact-section lcd-texture">
          <div className="container contact-grid">
            <div>
              <p className="eyebrow"><span>06</span> / CONTACT</p>
              <h2 data-reveal>LET&apos;S CONNECT<span aria-hidden="true">.</span></h2>
              <p>Have a software project in mind or an opportunity to share?<br className="desktop-break" /> I&apos;d love to start a conversation.</p>
              <ContactLinks />
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer-top">
          <a className="footer-brand" href="#home">EV<span>.</span></a>
          <p className="pixel-font">ERIC VA / PORTFOLIO</p>
          <ReplayIntro />
          <a href="#home" className="back-top">BACK TO TOP <span aria-hidden="true">↑</span></a>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} {personal.name.toUpperCase()}</span>
          <span>SOFTWARE DEVELOPMENT / DEVOPS ENGINEERING</span>
          <span aria-hidden="true">[ END ]</span>
        </div>
      </footer>
    </Motion>
  );
}
