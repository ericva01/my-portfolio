import type { MetadataRoute } from "next";
import { getBaseSiteUrl } from "@/data/portfolio";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
