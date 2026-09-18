import type { Metadata, Viewport } from "next";
import { Press_Start_2P, IBM_Plex_Mono } from "next/font/google";
import { personal } from "@/data/portfolio";
import "./globals.css";

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
  fallback: ["Courier New", "monospace"],
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  fallback: ["Courier New", "monospace"],
});

const siteUrl = personal.siteUrl?.trim() || "https://ericva.dev";

export const viewport: Viewport = {
  themeColor: "#0e110e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${personal.name} | Software Developer & DevOps Explorer`,
    template: `%s | ${personal.name}`,
  },
  description: personal.about,
  applicationName: `${personal.name} Portfolio`,
  authors: [{ name: personal.name, url: personal.github }],
  generator: "Next.js",
  keywords: [
    "Eric Va",
    "Software Developer",
    "DevOps Engineer",
    "Full Stack Developer",
    "Next.js Portfolio",
    "Kubernetes",
    "K8s",
    "K3s",
    "Docker",
    "ArgoCD",
    "Jenkins",
    "Ansible",
    "Terraform",
    "Grafana",
    "Spring Boot",
    "React",
    "TypeScript",
    "Tailwind CSS",
  ],
  creator: personal.name,
  publisher: personal.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${personal.name} — Software Developer & DevOps Explorer`,
    description: personal.about,
    url: siteUrl,
    siteName: `${personal.name} Portfolio`,
    locale: "en_US",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: `${personal.name} — Software Developer`,
    description: personal.about,
    creator: "@ericva",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD structured data for Google & search engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name: personal.name,
        jobTitle: personal.role,
        description: personal.about,
        email: personal.email,
        telephone: personal.phone.href,
        url: siteUrl,
        sameAs: [personal.github].filter(Boolean),
        knowsAbout: [
          "DevOps Engineering",
          "Kubernetes",
          "Docker",
          "ArgoCD",
          "Jenkins",
          "Terraform",
          "Next.js",
          "TypeScript",
          "Software Engineering",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: `${personal.name} Portfolio`,
        publisher: {
          "@id": `${siteUrl}/#person`,
        },
        inLanguage: "en-US",
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${pixel.variable} ${mono.variable}`}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
