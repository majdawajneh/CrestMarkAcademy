
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { authenticatedFetch } from "@/lib/auth-session";
import styles from "./page.module.css";

type Course = {
  id: number;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  status: string;
  level: string | null;
  language: string | null;
  estimatedDurationHours: number | null;
  createdAt: string;
  publishedAt: string | null;
  studentsCount: number;
  enrollmentsCount: number;
  completedEnrollments: number;
  reviewsCount: number;
  averageRating: number | null;
};

type Filter = "all" | "published" | "draft";

const dictionary = {
  en: {
    eyebrow: "COURSE PORTFOLIO",
    title: "My courses",
    description: "Explore the courses assigned to you and track their performance.",
    refresh: "Refresh",
    refreshing: "Updating...",
    all: "All courses",
    published: "Published",
    draft: "Draft",
    search: "Search your courses...",
    courses: "Courses",
    students: "Students",
    enrollments: "Enrollments",
    completions: "Completed",
    reviews: "Reviews",
    rating: "Rating",
    hours: "hours",
    viewCourse: "View public course",
    courseStatus: "Status",
    noCourses: "No courses assigned yet",
    noCoursesDescription: "Courses assigned by the academy administrator will appear here.",
    noMatches: "No matching courses",
    noMatchesDescription: "Try another search or status filter.",
    error: "We couldn't load your courses.",
    retry: "Try again",
    unavailable: "Not rated yet",
    showing: "Showing",
    of: "of",
    results: "courses",
    noImage: "CrestMark Course",
  },
  ar: {
    eyebrow: "ملف الدورات",
    title: "دوراتي",
    description: "استعرض الدورات المسندة إليك وتابع أداءها وطلابها.",
    refresh: "تحديث",
    refreshing: "جارٍ التحديث...",
    all: "كل الدورات",
    published: "منشورة",
    draft: "مسودة",
    search: "ابحث في دوراتك...",
    courses: "الدورات",
    students: "الطلاب",
    enrollments: "التسجيلات",
    completions: "المكتملة",
    reviews: "التقييمات",
    rating: "التقييم",
    hours: "ساعة",
    viewCourse: "عرض الدورة على الموقع",
    courseStatus: "حالة النشر",
    noCourses: "لا توجد دورات مسندة إليك",
    noCoursesDescription: "ستظهر هنا الدورات التي تسندها إليك إدارة الأكاديمية.",
    noMatches: "لا توجد نتائج مطابقة",
    noMatchesDescription: "جرّب تغيير البحث أو حالة النشر.",
    error: "تعذّر تحميل دوراتك.",
    retry: "إعادة المحاولة",
    unavailable: "لم تُقيّم بعد",
    showing: "عرض",
    of: "من",
    results: "دورات",
    noImage: "دورة CrestMark",
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validCourse(value: unknown): value is Course {
  if (!isRecord(value)) return false;

  const integerFields = [
    "id",
    "studentsCount",
    "enrollmentsCount",
    "completedEnrollments",
    "reviewsCount",
  ];

  return (
    integerFields.every(
      (key) =>
        typeof value[key] === "number" &&
        Number.isSafeInteger(value[key]) &&
        (value[key] as number) >= 0
    ) &&
    value.id !== 0 &&
    typeof value.title === "string" &&
    typeof value.slug === "string" &&
    typeof value.status === "string" &&
    typeof value.createdAt === "string" &&
    (value.shortDescription === null || typeof value.shortDescription === "string") &&
    (value.thumbnailUrl === null || typeof value.thumbnailUrl === "string") &&
    (value.level === null || typeof value.level === "string") &&
    (value.language === null || typeof value.language === "string") &&
    (value.publishedAt === null || typeof value.publishedAt === "string") &&
    (value.estimatedDurationHours === null ||
      (typeof value.estimatedDurationHours === "number" &&
        Number.isFinite(value.estimatedDurationHours) &&
        value.estimatedDurationHours >= 0)) &&
    (value.averageRating === null ||
      (typeof value.averageRating === "number" &&
        Number.isFinite(value.averageRating) &&
        value.averageRating >= 0 &&
        value.averageRating <= 5))
  );
}

function validImageUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);

    return url.protocol === "https:" &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export default function InstructorCoursesPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale === "ar" ? "ar" : "en";
  const t = dictionary[locale];

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [refresh, setRefresh] = useState(0);


function refreshCourses() {
  setLoading(true);
  setError(false);
  setRefresh((value) => value + 1);
}

useEffect(() => {
  const controller = new AbortController();

  async function loadCourses() {
    try {
      const response = await authenticatedFetch(
        "/api/instructor/courses",
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: unknown = await response.json();

      if (
        !Array.isArray(result) ||
        !result.every(validCourse)
      ) {
        throw new Error("Invalid courses response");
      }

      if (!controller.signal.aborted) {
        setCourses(result);
        setLoaded(true);
      }
    } catch {
      if (!controller.signal.aborted) {
        setError(true);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  void loadCourses();

  return () => controller.abort();
}, [refresh]);


  const counts = useMemo(
    () => ({
      all: courses.length,
      published: courses.filter(
        (c) => c.status.toLowerCase() === "published"
      ).length,
      draft: courses.filter(
        (c) => c.status.toLowerCase() === "draft"
      ).length,
    }),
    [courses]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return courses
      .filter((course) => {
        const matchesSearch =
          course.title.toLowerCase().includes(term) ||
          (course.shortDescription ?? "").toLowerCase().includes(term);

        const matchesStatus =
          filter === "all" ||
          course.status.toLowerCase() === filter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [courses, search, filter]);

  const number = (value: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-JO" : "en-US").format(value);

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: t.all, count: counts.all },
    { id: "published", label: t.published, count: counts.published },
    { id: "draft", label: t.draft, count: counts.draft },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>{t.eyebrow}</span>
          <h2>{t.title}</h2>
          <p>{t.description}</p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          disabled={loading}
          onClick={refreshCourses}
        >
          <span aria-hidden="true">↻</span>
          {loading ? t.refreshing : t.refresh}
        </button>
      </header>

      {error && (
        <div role="alert" className={styles.error}>
          <span>{t.error}</span>
          <button type="button" onClick={refreshCourses}>
            {t.retry}
          </button>
        </div>
      )}

      {loaded && (
        <section className={styles.courseSection}>
          <div className={styles.toolbar}>
            <div className={styles.tabs} aria-label={t.courseStatus}>
              {tabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  aria-pressed={filter === tab.id}
                  className={`${styles.tab} ${
                    filter === tab.id ? styles.activeTab : ""
                  }`}
                  onClick={() => setFilter(tab.id)}
                >
                  {tab.label}
                  <span>{number(tab.count)}</span>
                </button>
              ))}
            </div>

            <div className={styles.searchBox}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 5 5" />
              </svg>
              <input
                type="search"
                aria-label={t.search}
                placeholder={t.search}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <p className={styles.resultCount}>
            {t.showing} {number(filtered.length)} {t.of}{" "}
            {number(courses.length)} {t.results}
          </p>

          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon} aria-hidden="true">▤</span>
              <h3>
                {courses.length === 0 ? t.noCourses : t.noMatches}
              </h3>
              <p>
                {courses.length === 0
                  ? t.noCoursesDescription
                  : t.noMatchesDescription}
              </p>
            </div>
          ) : (
            <div className={styles.courseList}>
              {filtered.map((course) => {
                const image = validImageUrl(course.thumbnailUrl);
                const published = course.status.toLowerCase() === "published";

                return (
                  <article className={styles.courseCard} key={course.id}>
                    <div className={styles.imageWrap}>
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt={course.title} loading="lazy" />
                      ) : (
                        <div className={styles.imageFallback}>
                          <span>C</span>
                          <small>{t.noImage}</small>
                        </div>
                      )}
                    </div>

                    <div className={styles.courseBody}>
                      <div className={styles.titleRow}>
                        <div>
                          <div className={styles.badges}>
                            <span className={`${styles.status} ${
                              published ? styles.published : styles.draft
                            }`}>
                              <span aria-hidden="true" />
                              {published
                                ? t.published
                                : course.status.toLowerCase() === "draft"
                                  ? t.draft
                                  : course.status}
                            </span>

                            {course.level && (
                              <span className={styles.metaBadge}>{course.level}</span>
                            )}
                            {course.language && (
                              <span className={styles.metaBadge}>{course.language}</span>
                            )}
                          </div>

                          <h3>{course.title}</h3>
                        </div>
                      </div>

                      {course.shortDescription && (
                        <p className={styles.description}>
                          {course.shortDescription}
                        </p>
                      )}

                      <div className={styles.courseStats}>
                        <div>
                          <span>{t.students}</span>
                          <strong>{number(course.studentsCount)}</strong>
                        </div>
                        <div>
                          <span>{t.enrollments}</span>
                          <strong>{number(course.enrollmentsCount)}</strong>
                        </div>
                        <div>
                          <span>{t.completions}</span>
                          <strong>{number(course.completedEnrollments)}</strong>
                        </div>
                        <div>
                          <span>{t.reviews}</span>
                          <strong>{number(course.reviewsCount)}</strong>
                        </div>
                        <div>
                          <span>{t.rating}</span>
                          <strong>
                            {course.averageRating === null
                              ? "—"
                              : `★ ${course.averageRating.toFixed(1)}`}
                          </strong>
                        </div>
                      </div>

                      
                  <footer className={styles.courseFooter}>
                    <span>
                      {course.estimatedDurationHours != null
                        ? `${number(course.estimatedDurationHours)} ${t.hours}`
                        : t.unavailable}
                    </span>

                    <Link
                      href={`/${locale}/instructor/courses/${course.id}/students`}
                      className={styles.viewLink}
                    >
                      {locale === "ar" ? "عرض تقدم الطلاب" : "View student progress"}
                      <span aria-hidden="true">↗</span>
                    </Link>

                    {published && (
                      <Link
                        href={`/${locale}/courses/${encodeURIComponent(course.slug)}`}
                        className={styles.viewLink}
                      >
                        {t.viewCourse}
                        <span aria-hidden="true">↗</span>
                      </Link>
                    )}
                  </footer>

                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {!loaded && loading && !error && (
        <div className={styles.loading} role="status">
          {t.refreshing}
        </div>
      )}
    </main>
  );
}
