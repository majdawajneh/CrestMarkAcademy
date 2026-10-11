
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

type Locale = "en" | "ar";

type Course = {
  id: number;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  price: number;
  discountPrice: number | null;
  language: string | null;
  level: string | null;
  categoryName: string | null;
  instructorName: string | null;
  isFeatured: boolean;
  reviewsCount: number;
  enrollmentCount: number;
};

type SearchFilters = {
  q?: string | string[];
  category?: string | string[];
  level?: string | string[];
  language?: string | string[];
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchFilters>;
};

const translations = {
  en: {
    eyebrow: "DISCOVER YOUR NEXT OPPORTUNITY",
    title: "Explore our courses.",
    description:
      "From practical skills to new interests, discover learning opportunities across a wide range of fields.",
    searchPlaceholder: "What would you like to learn?",
    searchLabel: "Search courses",
    search: "Search",
    category: "Category",
    level: "Level",
    language: "Language",
    allCategories: "All categories",
    allLevels: "All levels",
    allLanguages: "All languages",
    apply: "Apply filters",
    reset: "Clear filters",
    courses: "courses available",
    oneCourse: "course available",
    showing: "Showing",
    noResults: "No courses match your search.",
    noResultsDescription:
      "Try different keywords or change your filters.",
    emptyTitle: "Courses are coming soon.",
    emptyDescription:
      "We're preparing new learning opportunities. Check back soon.",
    errorTitle: "Unable to load courses.",
    errorDescription:
      "Please try again later.",
    viewCourse: "Explore course",
    featured: "Featured",
    fallback: "CRESTMARK ACADEMY",
    pageTitle: "Explore Courses",
    pageDescription:
      "Discover online courses across different subjects and learning levels at CrestMark Academy.",
  },
  ar: {
    eyebrow: "اكتشف فرصتك التعليمية القادمة",
    title: "استكشف دوراتنا التعليمية.",
    description:
      "من المهارات العملية إلى الاهتمامات الجديدة، اكتشف فرصًا للتعلّم في مجموعة واسعة من المجالات.",
    searchPlaceholder: "شو حابب تتعلم اليوم؟",
    searchLabel: "البحث عن الدورات",
    search: "بحث",
    category: "التصنيف",
    level: "المستوى",
    language: "اللغة",
    allCategories: "جميع التصنيفات",
    allLevels: "جميع المستويات",
    allLanguages: "جميع اللغات",
    apply: "تطبيق الفلاتر",
    reset: "مسح الفلاتر",
    courses: "دورات متاحة",
    oneCourse: "دورة متاحة",
    showing: "عرض",
    noResults: "ما لقينا دورات مطابقة لبحثك.",
    noResultsDescription:
      "جرّب كلمات بحث مختلفة أو غيّر خيارات التصفية.",
    emptyTitle: "دورات جديدة قريبًا.",
    emptyDescription:
      "نعمل على تجهيز فرص تعليمية جديدة. تابعنا قريبًا.",
    errorTitle: "تعذّر تحميل الدورات.",
    errorDescription:
      "يرجى المحاولة مرة أخرى لاحقًا.",
    viewCourse: "استكشف الدورة",
    featured: "مميزة",
    fallback: "CRESTMARK ACADEMY",
    pageTitle: "استكشف الدورات",
    pageDescription:
      "اكتشف دورات تعليمية في مختلف المجالات والمستويات عبر CrestMark Academy.",
  },
} as const;

function getLocale(value: string): Locale {
  if (value !== "en" && value !== "ar") {
    notFound();
  }

  return value;
}

function getFilterValue(
  value: string | string[] | undefined
): string {
  const result = Array.isArray(value)
    ? value[0]
    : value;

  return (result ?? "").trim().slice(0, 120);
}

function getValidImageUrl(
  value: string | null
): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (
      !["https:", "http:"].includes(url.protocol) ||
      ["example.com", "www.example.com"].includes(
        url.hostname.toLowerCase()
      )
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

async function getCourses(): Promise<{
  courses: Course[];
  failed: boolean;
}> {
  const baseUrl =
    process.env.API_BASE_URL ||
    "http://localhost:5299";

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/api/courses`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return { courses: [], failed: true };
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return { courses: [], failed: true };
    }

    const courses = (data as Course[]).filter(
      (course) =>
        course !== null &&
        typeof course.id === "number" &&
        typeof course.title === "string" &&
        typeof course.slug === "string"
    );

    return { courses, failed: false };
  } catch {
    return { courses: [], failed: true };
  }
}

function getOptions(
  courses: Course[],
  field: "categoryName" | "level" | "language"
): string[] {
  return Array.from(
    new Set(
      courses
        .map((course) => course[field])
        .filter((value): value is string =>
          typeof value === "string" &&
          value.trim().length > 0
        )
    )
  ).sort((a, b) => a.localeCompare(b));
}

export async function generateMetadata({
  params,
}: {
  params: Props["params"];
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = getLocale(rawLocale);
  const t = translations[locale];

  return {
    title: t.pageTitle,
    description: t.pageDescription,
    alternates: {
      canonical: `/${locale}/courses`,
      languages: {
        en: "/en/courses",
        ar: "/ar/courses",
        "x-default": "/en/courses",
      },
    },
  };
}

export default async function CoursesPage({
  params,
  searchParams,
}: Props) {
  const [{ locale: rawLocale }, queryParams] =
    await Promise.all([params, searchParams]);

  const locale = getLocale(rawLocale);
  const t = translations[locale];

  const search = getFilterValue(queryParams.q);
  const selectedCategory = getFilterValue(
    queryParams.category
  );
  const selectedLevel = getFilterValue(
    queryParams.level
  );
  const selectedLanguage = getFilterValue(
    queryParams.language
  );

  const hasFilters = Boolean(
    search ||
    selectedCategory ||
    selectedLevel ||
    selectedLanguage
  );

  const { courses, failed } = await getCourses();

  const categories = getOptions(
    courses,
    "categoryName"
  );

  const levels = getOptions(courses, "level");
  const languages = getOptions(courses, "language");

  const normalizedSearch = search.toLocaleLowerCase();

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      !normalizedSearch ||
      [
        course.title,
        course.shortDescription,
        course.categoryName,
        course.instructorName,
      ]
        .filter(Boolean)
        .some((value) =>
          value!
            .toLocaleLowerCase()
            .includes(normalizedSearch)
        );

    const matchesCategory =
      !selectedCategory ||
      course.categoryName === selectedCategory;

    const matchesLevel =
      !selectedLevel ||
      course.level === selectedLevel;

    const matchesLanguage =
      !selectedLanguage ||
      course.language === selectedLanguage;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLevel &&
      matchesLanguage
    );
  });

  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <div className={styles.container}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            {t.eyebrow}
          </div>

          <h1 className={styles.title}>{t.title}</h1>

          <p className={styles.introDescription}>
            {t.description}
          </p>
        </div>
      </section>

      <section
        className={styles.catalog}
        aria-label={t.pageTitle}
      >
        <div className={styles.container}>
          <form
            action={`/${locale}/courses`}
            method="GET"
            className={styles.filters}
            role="search"
          >
            <div className={styles.searchRow}>
              <div className={styles.searchField}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="10.8"
                    cy="10.8"
                    r="6.8"
                  />
                  <path d="m16 16 5 5" />
                </svg>

                <input
                  type="search"
                  name="q"
                  aria-label={t.searchLabel}
                  placeholder={t.searchPlaceholder}
                  defaultValue={search}
                  maxLength={120}
                />
              </div>

              <button
                type="submit"
                className={styles.searchButton}
              >
                {t.search}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </button>
            </div>

            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label htmlFor="course-category">
                  {t.category}
                </label>

                <select
                  id="course-category"
                  name="category"
                  defaultValue={selectedCategory}
                >
                  <option value="">
                    {t.allCategories}
                  </option>
                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterField}>
                <label htmlFor="course-level">
                  {t.level}
                </label>

                <select
                  id="course-level"
                  name="level"
                  defaultValue={selectedLevel}
                >
                  <option value="">{t.allLevels}</option>
                  {levels.map((level) => (
                    <option
                      key={level}
                      value={level}
                    >
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterField}>
                <label htmlFor="course-language">
                  {t.language}
                </label>

                <select
                  id="course-language"
                  name="language"
                  defaultValue={selectedLanguage}
                >
                  <option value="">
                    {t.allLanguages}
                  </option>
                  {languages.map((language) => (
                    <option
                      key={language}
                      value={language}
                    >
                      {language}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className={styles.applyButton}
              >
                {t.apply}
              </button>

              {hasFilters && (
                <Link
                  href={`/${locale}/courses`}
                  className={styles.resetButton}
                >
                  {t.reset}
                </Link>
              )}
            </div>
          </form>

          <div className={styles.resultsBar}>
            <p className={styles.resultsCount}>
              {t.showing}{" "}
              <strong>{filteredCourses.length}</strong>{" "}
              {filteredCourses.length === 1
                ? t.oneCourse
                : t.courses}
            </p>
          </div>

          {failed ? (
            <div className={styles.message}>
              <h2>{t.errorTitle}</h2>
              <p>{t.errorDescription}</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className={styles.message}>
              <h2>
                {courses.length === 0
                  ? t.emptyTitle
                  : t.noResults}
              </h2>
              <p>
                {courses.length === 0
                  ? t.emptyDescription
                  : t.noResultsDescription}
              </p>

              {hasFilters && (
                <Link
                  href={`/${locale}/courses`}
                  className={styles.clearLink}
                >
                  {t.reset}
                </Link>
              )}
            </div>
          ) : (
            <div className={styles.courseGrid}>
              {filteredCourses.map((course) => {
                const imageUrl = getValidImageUrl(
                  course.thumbnailUrl
                );

                const courseHref =
                  `/${locale}/courses/` +
                  encodeURIComponent(course.slug);

                return (
                  <article
                    key={course.id}
                    className={styles.courseCard}
                  >
                    <Link
                      href={courseHref}
                      className={styles.imageLink}
                      aria-label={`${t.viewCourse}: ${course.title}`}
                    >
                      <div className={styles.imageWrapper}>
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={course.title}
                            width={600}
                            height={360}
                            unoptimized
                            className={styles.courseImage}
                          />
                        ) : (
                          <div
                            className={styles.imageFallback}
                            aria-hidden="true"
                          >
                            <svg
                              viewBox="0 0 64 64"
                              fill="none"
                            >
                              <path d="M12 18c8-4 15-4 20 0 5-4 12-4 20 0v30c-8-4-15-4-20 0-5-4-12-4-20 0V18Z" />
                              <path d="M32 18v30" />
                            </svg>
                            <span>{t.fallback}</span>
                          </div>
                        )}

                        {course.isFeatured && (
                          <span className={styles.featured}>
                            {t.featured}
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className={styles.cardBody}>
                      {course.categoryName && (
                        <span className={styles.category}>
                          {course.categoryName}
                        </span>
                      )}

                      <h2 className={styles.courseTitle}>
                        <Link href={courseHref}>
                          {course.title}
                        </Link>
                      </h2>

                      {course.shortDescription && (
                        <p className={styles.courseDescription}>
                          {course.shortDescription}
                        </p>
                      )}

                      {(course.level ||
                        course.language) && (
                        <div className={styles.meta}>
                          {course.level && (
                            <span>{course.level}</span>
                          )}
                          {course.level &&
                            course.language && (
                              <span
                                className={styles.metaDot}
                                aria-hidden="true"
                              />
                            )}
                          {course.language && (
                            <span>{course.language}</span>
                          )}
                        </div>
                      )}

                      <Link
                        href={courseHref}
                        className={styles.courseLink}
                      >
                        {t.viewCourse}
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path d="M5 12h14m-6-6 6 6-6 6" />
                        </svg>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
