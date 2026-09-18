"use client";

import React from "react";
import {
  SiJenkins,
  SiKubernetes,
  SiK3S,
  SiArgo,
  SiAnsible,
  SiTerraform,
  SiGrafana,
  SiDocker,
  SiGit,
  SiSpringboot,
  SiPostgresql,
  SiMysql,
  SiMongodb,
  SiHtml5,
  SiJavascript,
  SiTypescript,
  SiReact,
  SiNextdotjs,
  SiTailwindcss,
  SiFigma,
} from "react-icons/si";
import { FaJava, FaCss3Alt } from "react-icons/fa6";
import { TbDevices, TbLayoutDashboard } from "react-icons/tb";
import type { IconType } from "react-icons";

const ICON_MAP: Record<string, IconType> = {
  jenkins: SiJenkins,
  k8s: SiKubernetes,
  kubernetes: SiKubernetes,
  k3s: SiK3S,
  argocd: SiArgo,
  argo: SiArgo,
  ansible: SiAnsible,
  terraform: SiTerraform,
  grafana: SiGrafana,
  docker: SiDocker,
  git: SiGit,
  java: FaJava,
  springboot: SiSpringboot,
  spring: SiSpringboot,
  postgresql: SiPostgresql,
  postgres: SiPostgresql,
  mysql: SiMysql,
  mongodb: SiMongodb,
  mongo: SiMongodb,
  html: SiHtml5,
  html5: SiHtml5,
  css: FaCss3Alt,
  css3: FaCss3Alt,
  javascript: SiJavascript,
  js: SiJavascript,
  typescript: SiTypescript,
  ts: SiTypescript,
  react: SiReact,
  reactjs: SiReact,
  nextjs: SiNextdotjs,
  next: SiNextdotjs,
  tailwindcss: SiTailwindcss,
  tailwind: SiTailwindcss,
  figma: SiFigma,
  interfacedesign: TbLayoutDashboard,
  uidesign: TbLayoutDashboard,
  uiux: TbLayoutDashboard,
  responsivedesign: TbDevices,
  responsive: TbDevices,
};

export function TechLogo({
  name,
  className = "tech-icon",
}: {
  name: string;
  className?: string;
}) {
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const IconComponent = ICON_MAP[norm];

  if (IconComponent) {
    return <IconComponent className={className} aria-hidden="true" />;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 7l8-4 8 4M4 17l8 4 8-4M4 12l8 4 8-4" />
    </svg>
  );
}
