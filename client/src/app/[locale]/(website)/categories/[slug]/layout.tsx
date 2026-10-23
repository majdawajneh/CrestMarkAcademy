
import type { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

type CategorySeo = {
  name: string;
  description: string | null;
  isActive: boolean;
};

function getSiteOrigin(): string | null {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");

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


async function getCategory(
  slug: string
): Promise<CategorySeo | null> {
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug) ||
    slug.length > 120
  ) {
    return null;
  }

  const baseUrl = (
    process.env.API_BASE_URL || "http://localhost:5299"
  ).replace(/\/+$/, "");

  try {
    const response = await fetch(
      `${baseUrl}/api/categories/${encodeURIComponent(slug)}`,
      {
        headers: {
          Accept: "application/json",
        },
        next: {
          revalidate: 300,
        },
        signal: AbortSignal.timeout(12000),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return null;
    }

    const category = data as Record<string, unknown>;

    if (
      typeof category.name !== "string" ||
      !category.name.trim() ||
      category.isActive !== true ||
      category.slug !== slug
    ) {
      return null;
    }

    return {
      name: category.name.trim(),
      description:
        typeof category.description === "string"
          ? category.description
          : null,
      isActive: true,
    };
  } catch {
    return null;
  }
}


export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale, slug } = await params;

  const lang = locale === "ar" ? "ar" : "en";
  const ar = lang === "ar";

  const category = await getCategory(slug);
  const origin = getSiteOrigin();

  if (!category) {
    return {
      title: ar ? "التصنيف غير متاح" : "Category Unavailable",
      description: ar
        ? "هذا التصنيف غير متاح حاليًا."
        : "This category is currently unavailable.",
      alternates: {},
      openGraph: {},
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = category.name;

  
const fallbackDescription = ar
  ? `استكشف دورات ${title} على CrestMark. تعرّف على المحتوى التعليمي والمهارات التي يمكنك تطويرها في هذا المجال.`
  : `Explore ${title} courses at CrestMark and discover practical learning opportunities.`;

const description = (
  ar
    ? fallbackDescription
    : category.description || fallbackDescription
)
  .replace(/<[^>]*>/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, 160);


  const encodedSlug = encodeURIComponent(slug);
  const coursePath = `/categories/${encodedSlug}`;
  const pagePath = `/${lang}${coursePath}`;

  return {
    title,
    description,

    ...(origin
      ? {
          alternates: {
            canonical: `${origin}${pagePath}`,
            languages: {
              en: `${origin}/en${coursePath}`,
              ar: `${origin}/ar${coursePath}`,
              "x-default": `${origin}/en${coursePath}`,
            },
          },
        }
      : { alternates: {} }),

    openGraph: {
      type: "website",
      siteName: "CrestMark",
      title: `${title} | CrestMark`,
      description,
      ...(origin ? { url: `${origin}${pagePath}` } : {}),
      locale: ar ? "ar_JO" : "en_US",
      alternateLocale: ar ? ["en_US"] : ["ar_JO"],
    },

    twitter: {
      card: "summary",
      title: `${title} | CrestMark`,
      description,
    },

    robots: {
      index: Boolean(origin),
      follow: Boolean(origin),
    },
  };
}

export default function CategoryDetailsLayout({
  children,
}: Props) {
  return children;
}
