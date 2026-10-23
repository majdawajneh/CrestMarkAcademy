
import type { MetadataRoute } from "next";

const API_BASE_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type CatalogItem = {
  slug: string;
  status?: string;
  isActive?: boolean;
};

function getSiteOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;

  if (!configured) return null;

  try {
    const url = new URL(configured);

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.hostname === "localhost" ||
      url.hostname.endsWith(".example.com")
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function isValidSlug(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(value) &&
    value.length <= 200
  );
}

async function fetchList(endpoint: string): Promise<unknown[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        headers: {
          Accept: "application/json",
        },
        next: {
          revalidate: 3600,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) return [];

    const data: unknown = await response.json();

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();

  // No real production domain configured yet.
  if (!origin) {
    return [];
  }

  // Public, indexable pages only.
  const paths = new Set<string>([
    "",
    "courses",
    "categories",
    "about",
    "contact",
    "verify-certificate",
    "legal/privacy",
    "legal/terms",
    "legal/refunds",
    "legal/cookies",
    "legal/accessibility",
  ]);

  const [courses, categories] = await Promise.all([
    fetchList("/api/courses"),
    fetchList("/api/categories"),
  ]);

  // Only published courses.
  for (const item of courses) {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      continue;
    }

    const course = item as CatalogItem;

    if (
      isValidSlug(course.slug) &&
      course.status?.toLowerCase() === "published"
    ) {
      paths.add(`courses/${course.slug}`);
    }
  }

  // Only active categories.
  for (const item of categories) {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      continue;
    }

    const category = item as CatalogItem;

    if (
      isValidSlug(category.slug) &&
      category.isActive === true
    ) {
      paths.add(`categories/${category.slug}`);
    }
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const path of paths) {
    const suffix = path ? `/${path}` : "";

    const enUrl = `${origin}/en${suffix}`;
    const arUrl = `${origin}/ar${suffix}`;

    const languages = {
      en: enUrl,
      ar: arUrl,
      "x-default": enUrl,
    };

    entries.push({
      url: enUrl,
      alternates: {
        languages,
      },
    });

    entries.push({
      url: arUrl,
      alternates: {
        languages,
      },
    });
  }

  return entries;
}
