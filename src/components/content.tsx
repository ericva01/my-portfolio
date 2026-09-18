import Image from "next/image";
import { projects, type Education, type Project } from "@/data/portfolio";
import { Panel } from "./ui";
import { RetroTV } from "./retro-tv";

export function EducationEntry({ entry }: { entry: Education }) {
  return <article className="education-entry" data-reveal><Panel>
    <div className="education-icon" aria-hidden="true">▤</div>
    <h3>{entry.name}</h3>
    {entry.programs.map((program) => {
      const project = projects.find((item) => item.id === program.projectId);
      return <div className="education-program" key={program.course}>
        <h4 className="course">{program.course}</h4><p>{program.description}</p>
        {program.status && <span className="status-tag">{program.status}</span>}
        {project && <div className="education-project"><span className="small-label">{program.projectLabel}</span><p className="education-project-name">{project.title}</p><p>{project.description}</p></div>}
      </div>;
    })}
  </Panel></article>;
}

export function ProjectSection({ project, index }: { project: Project; index: number }) {
  return <article id={project.id} className="project-row" aria-labelledby={`${project.id}-title`}>
    {project.videoDemo === true ? <RetroTV project={project} channel={index + 1} /> : <SoftwareWindow project={project} />}
    <div className="project-copy"><p className="project-category"><span>0{index + 1}</span> {project.category}</p><h4 id={`${project.id}-title`}>{project.name}</h4>
      <p className="project-subtitle">{project.title.split(" — ")[1]}</p><p className="project-description">{project.description}</p>
      {project.tags.length > 0 && <ul className="tags" aria-label="Project topics">{project.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
      {(project.repositoryUrl || project.liveUrl) && <div className="project-links">{project.repositoryUrl && <a href={project.repositoryUrl}>REPOSITORY ↗</a>}{project.liveUrl && <a href={project.liveUrl}>LIVE DEMO ↗</a>}</div>}
      {project.videoDemo === true && <p className="project-record"><span aria-hidden="true">▪</span> {project.youtubeEmbedUrl || project.videoSrc ? "DEMO READY TO PLAY" : "DEMO IN THE WORKS"}</p>}
    </div>
  </article>;
}

function SoftwareWindow({ project }: { project: Project }) {
  return <div className="software-window" data-reveal>
    <div className="software-titlebar"><span>{project.name.toUpperCase()}</span><span aria-hidden="true">─ □ ×</span></div>
    <div className="software-content">
      {project.screenshot ? <Image src={project.screenshot.src} alt={project.screenshot.alt} width={project.screenshot.width} height={project.screenshot.height} sizes="(max-width: 767px) 90vw, 50vw" className="software-screenshot" /> : <div className="software-art" aria-hidden="true"><svg viewBox="0 0 96 80" shapeRendering="crispEdges"><path d="M8 8h80v56H8z" fill="none" stroke="currentColor" strokeWidth="4"/><path d="M10 20h76M34 72h28M48 64v8" stroke="currentColor" strokeWidth="4"/><path d="M17 13h4v4h-4zm8 0h4v4h-4zm8 0h4v4h-4zM39 30h18v4H39zm-5 4h28v18H34zm5 18h18v4H39z" fill="currentColor"/></svg><span>{project.name.toUpperCase()}</span></div>}
    </div>
    <div className="software-status">PERSONAL PROJECT <span aria-hidden="true">[ EV ]</span></div>
  </div>;
}
