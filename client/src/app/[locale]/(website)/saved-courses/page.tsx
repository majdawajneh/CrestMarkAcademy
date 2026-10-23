
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import {
  SavedCoursesList,
  WishlistProvider,
  type SavedCourse,
} from "../courses/WishlistControls";

import styles from "../courses/page.module.css";

export const instant = false;

type Locale = "en" | "ar";

type Props = {
  params: Promise<{ locale: string }>;
};

const copy = {
  en: {
    eyebrow: "YOUR LEARNING SHORTLIST",
    title: "Saved courses.",
    description:
      "Keep track of the courses you want to explore next. Your list is linked to your CrestMark account.",
    back: "Browse all courses",
  },
  ar: {
    eyebrow: "قائمتك التعليمية",
    title: "دوراتي المحفوظة.",
    description:
      "كل الدورات اللي حابب ترجع إلها بتلاقيها بمكان واحد، ومحفوظة بحسابك على CrestMark.",
    back: "استكشف جميع الدورات",
  },
} as const;

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;

  if (locale !== "ar" && locale !== "en") {
    notFound();
  }

  return {
    title: copy[locale].title,
    description: copy[locale].description,
    robots: {
      index: false,
      follow: false,
    },
  };
}

async function getCatalog(): Promise<{
  courses: SavedCourse[];
  failed: boolean;
}> {
  const base = (
    process.env.API_BASE_URL ||
    "http://localhost:5299"
  ).replace(/\/+$/, "");

  try {
    const response = await fetch(
      `${base}/api/courses`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      return { courses: [], failed: true };
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return { courses: [], failed: true };
    }

    const courses = data.filter(
      (item): item is SavedCourse =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "number" &&
        typeof item.title === "string" &&
        typeof item.slug === "string"
    );

    return { courses, failed: false };
  } catch {
    return { courses: [], failed: true };
  }
}

export default async function SavedCoursesPage({
  params,
}: Props) {
  const { locale: rawLocale } = await params;

  if (rawLocale !== "ar" && rawLocale !== "en") {
    notFound();
  }

  const locale: Locale = rawLocale;
  const t = copy[locale];

  // Render with request-time data instead of prerendering.
await connection();

const { courses, failed } = await getCatalog();

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <section className={styles.intro}>
        <div className={styles.container}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            {t.eyebrow}
          </div>

          <h1 className={styles.title}>
            {t.title}
          </h1>

          <p className={styles.introDescription}>
            {t.description}
          </p>
        </div>
      </section>

      <section
        className={styles.savedCatalog}
        aria-label={t.title}
      >
        <div className={styles.container}>
          <div className={styles.resultsBar}>
            <Link
              className={styles.savedBackLink}
              href={`/${locale}/courses`}
            >
              <span aria-hidden="true">
                {locale === "ar" ? "→" : "←"}
              </span>
              {t.back}
            </Link>
          </div>

          <WishlistProvider locale={locale}>
            <SavedCoursesList
              courses={courses}
              failed={failed}
            />
          </WishlistProvider>
        </div>
      </section>
    </main>
  );
}
