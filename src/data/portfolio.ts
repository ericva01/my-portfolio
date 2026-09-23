export type CaptionTrack = { src: string; srcLang: string; label: string; default?: boolean };
export type Project = {
  id: string; name: string; title: string; category: string; description: string;
  group: "academic" | "personal";
  tags: string[]; videoDemo?: boolean; videoSrc?: string; posterSrc?: string; captions?: CaptionTrack[];
  youtubeEmbedUrl?: string;
  screenshot?: { src: string; alt: string; width: number; height: number };
  repositoryUrl?: string; liveUrl?: string;
};
export type EducationProgram = { course: string; description: string; status?: string; projectId?: string; projectLabel?: string };
export type Education = { name: string; programs: EducationProgram[] };
export const introConfig = { sessionKey: "eric-va:intro-seen:v1", enabled: true };
export const technologyCategories = [
  { name: "DevOps", symbol: "[>]", topics: ["Jenkins", "K8s", "K3s", "ArgoCD", "Ansible", "Terraform", "Grafana", "Docker", "Git"] },
  { name: "Backend", symbol: "{ }", topics: ["Java", "Spring Boot"] },
  { name: "Databases", symbol: "[=]", topics: ["PostgreSQL", "MySQL", "MongoDB"] },
  { name: "Frontend", symbol: "</>", topics: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS"] },
  { name: "UI/UX", symbol: "[+]", topics: ["Figma", "Interface design", "Responsive design"] },
] as const;

export const personal = {
  name: "Eric Va",
  initials: "EV",
  role: "Software Developer",
  employer: "a private company",
  direction: "DevOps Engineering",
  introduction: "I build web applications, explore DevOps, and create tools that make everyday work easier.",
  about: "I currently work as a Software Developer at a private company while developing my knowledge of DevOps engineering. I’m interested in how thoughtful software and reliable deployment practices can make everyday work easier.",
  interests: ["Web development", "DevOps engineering", "Practical tools"],
  email: "ericva014@gmail.com",
  phone: { number: "017679097", display: "017 679 097", href: "tel:+85517679097" },
  github: "https://github.com/ericva01",
  linkedin: "",
  siteUrl: "", // Set your full https:// domain before publishing.
};

export const education: Education[] = [
  { name: "SETEC Institute", programs: [
    { course: "Management Information Systems", description: "Currently studying for a bachelor’s degree in Management Information Systems (MIS).", status: "Currently studying" },
  ] },
  { name: "ISTAD", programs: [
    { course: "Full Stack Web Development", description: "Received a 50% scholarship for the Full Stack Web Development course.", status: "50% course scholarship", projectId: "cambostack", projectLabel: "FINAL PROJECT" },
    { course: "ITP — DevOps Engineering", description: "Selected the DevOps Engineering track in ISTAD’s ITP program.", projectId: "autonomous", projectLabel: "PROJECT" },
  ] },
];

export const projects: Project[] = [
  {
    id: "cambostack", name: "CAMBOSTACK", title: "CAMBOSTACK — Khmer Q&A Community Platform",
    category: "Full Stack Web Development — Final Project",
    group: "academic", videoDemo: true,
    youtubeEmbedUrl: "https://www.youtube.com/embed/PTHQW7glYrc",
    description: "CAMBOSTACK is a collaborative forum where Khmer developers and students can learn, share knowledge, and grow together in a trusted, supportive community.",
    tags: [], // Add verified technologies here.
    // videoSrc: "/videos/cambostack-demo.mp4",
    // posterSrc: "/images/cambostack-poster.webp",
    // captions: [{ src: "/videos/cambostack-en.vtt", srcLang: "en", label: "English", default: true }],
  },
  {
    id: "autonomous", name: "Autonomous", title: "Autonomous — Self-Deployment Platform",
    category: "DevOps Engineering — ITP Project",
    group: "academic", videoDemo: true,
    youtubeEmbedUrl: "https://www.youtube.com/embed/eGKz81Da5LE",
    description: "Autonomous is a self-deployment platform designed to automate the end-to-end lifecycle of containerized applications, from source code to production. By leveraging Kubernetes, GitOps, and DevSecOps tools, it helps developers build, deploy, monitor, and secure applications while reducing infrastructure complexity.",
    tags: ["Kubernetes", "GitOps", "DevSecOps", "Containerized Applications", "Deployment Automation"],
    // videoSrc: "/videos/autonomous-demo.mp4",
  },
  {
    id: "fucuflow", name: "fucuflow", title: "fucuflow — Screen Recording with Automatic Animation",
    category: "Personal Project",
    group: "personal",
    liveUrl: "https://fucuflow.ericva.site/",
    description: "fucuflow is a personal screen-recording project that adds automatic animation to recordings.",
    tags: [], // Add features, platforms, and technologies only when confirmed.
    // screenshot: { src: "/images/fucuflow-screenshot.webp", alt: "fucuflow application screenshot", width: 1280, height: 800 },
  },
];

export const navigation = ["Home", "About", "Education", "Tech", "Projects", "Contact"] as const;
