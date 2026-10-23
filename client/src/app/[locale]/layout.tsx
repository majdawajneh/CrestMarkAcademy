
import type { Metadata } from "next";
import { Manrope, IBM_Plex_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";

const locales = ["en", "ar"] as const;

type Locale = (typeof locales)[number];

type Props = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

// ========================================
// Fonts
// ========================================

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

// ========================================
// Site URL
// ========================================

function getSiteUrl(): URL | null {
  const value = process.env.NEXT_PUBLIC_SITE_URL;

  if (!value) return null;

  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.hostname === "localhost" ||
      url.hostname.endsWith(".example.com")
    ) {
      return null;
    }

    return new URL(url.origin);
  } catch {
    return null;
  }
}

// ========================================
// Locales
// ========================================

export function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

// ========================================
// SEO Metadata
// ========================================

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const isArabic = locale === "ar";
  const siteUrl = getSiteUrl();

  const title = isArabic
    ? "CrestMark Academy | دورات برمجة وتكنولوجيا أونلاين"
    : "CrestMark Academy | Online Programming & Technology Courses";

  const description = isArabic
    ? "تعلّم البرمجة وتطوير الويب وقواعد البيانات عبر دورات عملية منظّمة في CrestMark. استكشف الدروس، تابع تقدمك، وطوّر مهاراتك خطوة بخطوة."
    : "Learn programming, web development and databases with practical online courses. Follow structured lessons, track your progress and build new skills.";

  return {
    ...(siteUrl
      ? {
          metadataBase: siteUrl,
        }
      : {}),

    applicationName: "CrestMark Academy",

    title: {
      default: title,
      template: "%s | CrestMark Academy",
    },

    description,

    // Page-specific canonical and hreflang values
    // belong in each public page's generateMetadata.

    openGraph: {
      type: "website",
      siteName: "CrestMark Academy",
      title,
      description,
      locale: isArabic ? "ar_JO" : "en_US",
      alternateLocale: isArabic
        ? ["en_US"]
        : ["ar_JO"],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },

    // Do not request indexing while the official
    // production URL is not configured.
    ...(!siteUrl
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}

// ========================================
// Locale Root Layout
// ========================================

export default async function LocaleLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${manrope.variable} ${arabicFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
