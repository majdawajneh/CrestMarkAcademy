
import type { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
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

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale === "ar" ? "ar" : "en";
  const ar = lang === "ar";
  const origin = getSiteOrigin();

  const title = ar
    ? "تصنيفات الدورات التعليمية"
    : "Explore Learning Categories";

  const description = ar
    ? "استكشف تصنيفات CrestMark التعليمية واكتشف مجالات البرمجة وتطوير الويب وقواعد البيانات، واختر المجال المناسب لتطوير مهاراتك."
    : "Explore learning categories at CrestMark, including programming, web development and databases. Find the right subject to develop your skills.";

  const path = `/${lang}/categories`;

  return {
    title,
    description,

    ...(origin
      ? {
          alternates: {
            canonical: `${origin}${path}`,
            languages: {
              en: `${origin}/en/categories`,
              ar: `${origin}/ar/categories`,
              "x-default": `${origin}/en/categories`,
            },
          },
        }
      : {}),

    openGraph: {
      type: "website",
      siteName: "CrestMark",
      title: `${title} | CrestMark`,
      description,
      ...(origin ? { url: `${origin}${path}` } : {}),
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

export default function CategoriesLayout({
  children,
}: Props) {
  return children;
}
