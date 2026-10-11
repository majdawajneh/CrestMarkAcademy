
import type { Metadata } from "next";
import { Manrope, IBM_Plex_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import Navbar from "@/components/Navbar";
import { Suspense } from "react";

const locales = ["en", "ar"] as const;

type Locale = (typeof locales)[number];

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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

type Props = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const isArabic = locale === "ar";

  const title = isArabic
    ? "CrestMark | تعلّم، طوّر، وتقدّم"
    : "CrestMark | Learn. Build. Advance.";

  const description = isArabic
    ? "اكتشف دورات تعليمية عبر الإنترنت، وطوّر مهاراتك وابدأ رحلتك التعليمية مع CrestMark."
    : "Discover online courses, build valuable skills, and advance your learning journey with CrestMark.";

  return {
    metadataBase: new URL(siteUrl),

    applicationName: "CrestMark",

    title,

    description,

    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        ar: "/ar",
        "x-default": "/en",
      },
    },

    openGraph: {
      type: "website",
      siteName: "CrestMark",
      title,
      description,
      url: `/${locale}`,
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
  };
}

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
      <body>
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        {children}
        </body>
    </html>
  );
}
