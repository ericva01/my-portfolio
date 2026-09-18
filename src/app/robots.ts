import type { MetadataRoute } from "next";
import { personal } from "@/data/portfolio";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = personal.siteUrl?.trim() || "https://ericva.dev";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
