
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL;

  let origin: string | null = null;

  try {
    if (site) {
      const url = new URL(site);

      if (
        url.protocol === "https:" &&
        !url.username &&
        !url.password
      ) {
        origin = url.origin;
      }
    }
  } catch {
    // No verified production domain yet.
  }

  // Block indexing before the official domain is configured.
  if (!origin) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/en/admin",
        "/ar/admin",
        "/en/instructor",
        "/ar/instructor",
      ],
    },

    sitemap: `${origin}/sitemap.xml`,
  };
}
