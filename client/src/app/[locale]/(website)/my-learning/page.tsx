
"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./page.module.css";

type Enrollment = {
  enrollmentId: number;
  courseId: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  enrollmentStatus: string;
  enrolledAt: string;
  completedAt: string | null;
};

type CourseProgress = {
  courseId: number;
  enrollmentId: number;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  isCourseCompleted: boolean;
};

type EnrollmentWithProgress = Enrollment & {
  progress: CourseProgress | null;
};

type LoadStatus =
  | "loading"
  | "ready"
  | "error"
  | "unauthorized"
  | "forbidden";

type Filter = "all" | "active" | "completed";

const copy = {
  en: {
    eyebrow: "YOUR LEARNING SPACE",
    title: "My Learning",
    subtitle:
      "Everything you've enrolled in, organized in one place.",
    library: "Your course library",
    libraryText:
      "Pick up where you left off or revisit a course.",
    total: "Enrolled courses",
    active: "Active courses",
    completed: "Completed courses",
    all: "All",
    activeFilter: "In progress",
    completedFilter: "Completed",
    courseLabel: "COURSE",
    enrolled: "Enrolled",
    completedOn: "Completed",
    openCourse: "Continue Learning",
    emptyTitle: "Your learning starts here.",
    emptyText:
      "Explore courses and find something worth learning.",
    noResults: "No courses in this category.",
    browse: "Explore courses",
    loading: "Loading your learning space...",
    errorTitle: "We couldn't load your courses.",
    errorText:
      "Please check your connection and try again.",
    retry: "Try again",
    unauthorized: "Sign in to view your courses.",
    signIn: "Log in",
    forbidden: "You don't have access to this page.",
    progress: "Course progress",
    lessonsCompleted: "lessons completed",
    progressUnavailable:
      "Progress temporarily unavailable",
    statusActive: "Active",
    statusCompleted: "Completed",
    reviewCourse: "Review Course",
  },
  ar: {
    eyebrow: "مساحتك التعليمية",
    title: "دوراتي",
    subtitle:
      "كل الدورات التي التحقت بها، مرتبة في مكان واحد.",
    library: "مكتبة دوراتك",
    libraryText:
      "ارجع إلى دوراتك واستكمل رحلتك التعليمية.",
    total: "الدورات المسجلة",
    active: "الدورات النشطة",
    completed: "الدورات المكتملة",
    all: "الكل",
    activeFilter: "قيد التعلم",
    completedFilter: "المكتملة",
    courseLabel: "دورة تعليمية",
    enrolled: "تاريخ التسجيل",
    completedOn: "تاريخ الإكمال",
    openCourse: "متابعة التعلم",
    emptyTitle: "رحلتك التعليمية تبدأ من هنا.",
    emptyText:
      "استكشف الدورات واختر ما يناسب أهدافك.",
    noResults: "لا توجد دورات في هذا التصنيف.",
    browse: "استكشف الدورات",
    loading: "جارٍ تحميل دوراتك...",
    errorTitle: "تعذّر تحميل دوراتك.",
    errorText:
      "تحقق من الاتصال وحاول مرة أخرى.",
    retry: "إعادة المحاولة",
    unauthorized: "سجّل الدخول لعرض دوراتك.",
    signIn: "تسجيل الدخول",
    forbidden: "ليس لديك صلاحية الوصول لهذه الصفحة.",
    progress: "التقدم في الدورة",
    lessonsCompleted: "دروس مكتملة",
    progressUnavailable:
      "تعذّر عرض التقدم مؤقتًا",
    statusActive: "نشطة",
    statusCompleted: "مكتملة",
    reviewCourse: "مراجعة الدورة",
  },
} as const;

function isCompleted(enrollment: Enrollment) {
  return (
    enrollment.enrollmentStatus.toLowerCase() ===
      "completed" ||
    enrollment.completedAt !== null
  );
}

function formatDate(
  value: string,
  locale: "en" | "ar"
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

function CourseThumbnail({
  title,
  src,
}: {
  title: string;
  src: string | null;
}) {
  const [failed, setFailed] = useState(false);

  const validImage =
    !!src &&
    /^https?:\/\//i.test(src) &&
    !src.includes("example.com") &&
    !failed;

  return (
    <div className={styles.thumbnail}>
      {validImage ? (
        <Image
          src={src}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, 230px"
          unoptimized
          className={styles.courseImage}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={styles.thumbnailFallback}>
          <svg
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
          >
            <path d="M32 14 9 26l23 12 23-12-23-12Z" />
            <path d="M17 31v14c9 8 21 8 30 0V31" />
            <path d="M55 26v16" />
          </svg>

          <span>CRESTMARK ACADEMY</span>
        </div>
      )}
    </div>
  );
}

export default function MyLearningPage() {
  const params = useParams<{ locale: string }>();
  const router = useRouter();

  const locale = params.locale === "ar" ? "ar" : "en";
  const t = copy[locale];

  const [courses, setCourses] = useState<
    EnrollmentWithProgress[]
  >([]);

  const [status, setStatus] =
    useState<LoadStatus>("loading");

  const [filter, setFilter] =
    useState<Filter>("all");

  const [reload, setReload] = useState(0);

  const loadProgress = useCallback(
    async (
      course: Enrollment
    ): Promise<CourseProgress | null> => {
      async function requestProgress() {
        return fetch(
          `/api/my-learning/${course.courseId}/progress`,
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          }
        );
      }

      try {
        let response = await requestProgress();

        if (response.status === 401) {
          const session = await getCurrentSession();

          if (session.status !== "authenticated") {
            return null;
          }

          response = await requestProgress();
        }

        if (!response.ok) {
          return null;
        }

        const progress: CourseProgress =
          await response.json();

        if (
          progress.courseId !== course.courseId ||
          progress.enrollmentId !==
            course.enrollmentId ||
          !Number.isInteger(progress.totalLessons) ||
          !Number.isInteger(
            progress.completedLessons
          ) ||
          progress.totalLessons < 0 ||
          progress.completedLessons < 0 ||
          progress.completedLessons >
            progress.totalLessons ||
          !Number.isFinite(
            progress.progressPercentage
          ) ||
          progress.progressPercentage < 0 ||
          progress.progressPercentage > 100 ||
          typeof progress.isCourseCompleted !==
            "boolean"
        ) {
          return null;
        }

        return progress;
      } catch {
        return null;
      }
    },
    []
  );

  const loadCourses = useCallback(async () => {
    async function requestCourses() {
      return fetch("/api/my-learning", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
    }

    let response = await requestCourses();

    if (response.status === 401) {
      const session = await getCurrentSession();

      if (session.status === "authenticated") {
        response = await requestCourses();
      } else if (session.status === "guest") {
        return {
          status: "unauthorized" as const,
          courses: [] as EnrollmentWithProgress[],
        };
      } else {
        throw new Error("Session unavailable");
      }
    }

    if (response.status === 401) {
      return {
        status: "unauthorized" as const,
        courses: [] as EnrollmentWithProgress[],
      };
    }

    if (response.status === 403) {
      return {
        status: "forbidden" as const,
        courses: [] as EnrollmentWithProgress[],
      };
    }

    if (!response.ok) {
      throw new Error("Unable to load courses");
    }

    const data: Enrollment[] =
      await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid response");
    }

    const enriched: EnrollmentWithProgress[] = [];

    // Limit concurrent progress calls to five courses.
    for (
      let index = 0;
      index < data.length;
      index += 5
    ) {
      const batch = data.slice(index, index + 5);

      const results = await Promise.all(
        batch.map(async (course) => ({
          ...course,
          progress: await loadProgress(course),
        }))
      );

      enriched.push(...results);
    }

    return {
      status: "ready" as const,
      courses: enriched,
    };
  }, [loadProgress]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await loadCourses();

        if (cancelled) return;

        setCourses(result.courses);
        setStatus(result.status);
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [loadCourses, reload]);

  const completedCount =
    courses.filter(isCompleted).length;

  const activeCount = courses.filter(
    (course) =>
      course.enrollmentStatus.toLowerCase() ===
        "active" &&
      !isCompleted(course)
  ).length;

  const filteredCourses = courses.filter(
    (course) => {
      if (filter === "completed") {
        return isCompleted(course);
      }

      if (filter === "active") {
        return (
          course.enrollmentStatus.toLowerCase() ===
            "active" &&
          !isCompleted(course)
        );
      }

      return true;
    }
  );

  const filters: {
    id: Filter;
    label: string;
  }[] = [
    { id: "all", label: t.all },
    { id: "active", label: t.activeFilter },
    {
      id: "completed",
      label: t.completedFilter,
    },
  ];

  function retry() {
    setStatus("loading");
    setReload((count) => count + 1);
  }

  function getStatusLabel(course: Enrollment) {
    if (isCompleted(course)) {
      return t.statusCompleted;
    }

    if (
      course.enrollmentStatus.toLowerCase() ===
      "active"
    ) {
      return t.statusActive;
    }

    return course.enrollmentStatus;
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href={`/${locale}`}>
            {locale === "ar" ? "الرئيسية" : "Home"}
          </Link>

          <span aria-hidden="true">/</span>
          <span>{t.title}</span>
        </div>

        <header className={styles.pageHeader}>
          <div className={styles.headerCopy}>
            <span className={styles.eyebrow}>
              <span
                className={styles.eyebrowLine}
              />
              {t.eyebrow}
            </span>

            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>

          <Link
            href={`/${locale}/courses`}
            className={styles.exploreLink}
          >
            {t.browse}

            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </Link>
        </header>

        {status === "loading" ? (
          <div
            className={styles.messagePanel}
            role="status"
          >
            <div className={styles.spinner} />
            <p>{t.loading}</p>
          </div>
        ) : status !== "ready" ? (
          <div className={styles.messagePanel}>
            <div className={styles.messageIcon}>
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v6m0 4h.01" />
              </svg>
            </div>

            <h2>
              {status === "unauthorized"
                ? t.unauthorized
                : status === "forbidden"
                  ? t.forbidden
                  : t.errorTitle}
            </h2>

            {status === "error" && (
              <p>{t.errorText}</p>
            )}

            {status === "unauthorized" ? (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() =>
                  router.push(`/${locale}/login`)
                }
              >
                {t.signIn}
              </button>
            ) : status === "error" ? (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={retry}
              >
                {t.retry}
              </button>
            ) : (
              <Link
                href={`/${locale}`}
                className={styles.primaryButton}
              >
                {locale === "ar"
                  ? "الرئيسية"
                  : "Home"}
              </Link>
            )}
          </div>
        ) : (
          <>
            <section
              className={styles.overview}
              aria-label={t.title}
            >
              <div
                className={styles.overviewIntro}
              >
                <span
                  className={styles.overviewLabel}
                >
                  CRESTMARK / LEARNING
                </span>

                <h2>{t.library}</h2>
                <p>{t.libraryText}</p>
              </div>

              <div className={styles.statistics}>
                <div className={styles.stat}>
                  <strong>{courses.length}</strong>
                  <span>{t.total}</span>
                </div>

                <div className={styles.stat}>
                  <strong>{activeCount}</strong>
                  <span>{t.active}</span>
                </div>

                <div className={styles.stat}>
                  <strong>{completedCount}</strong>
                  <span>{t.completed}</span>
                </div>
              </div>
            </section>

            {courses.length === 0 ? (
              <div className={styles.emptyState}>
                <div
                  className={styles.emptyGraphic}
                >
                  <svg
                    viewBox="0 0 64 64"
                    fill="none"
                  >
                    <path d="M32 12 8 24l24 12 24-12-24-12Z" />
                    <path d="M15 30v15c10 9 24 9 34 0V30" />
                    <path d="M56 24v16" />
                  </svg>
                </div>

                <h2>{t.emptyTitle}</h2>
                <p>{t.emptyText}</p>

                <Link
                  href={`/${locale}/courses`}
                  className={styles.primaryButton}
                >
                  {t.browse}
                </Link>
              </div>
            ) : (
              <section className={styles.library}>
                <div
                  className={styles.libraryHeader}
                >
                  <div>
                    <h2>{t.library}</h2>
                    <p>{t.libraryText}</p>
                  </div>

                  <div
                    className={styles.filters}
                    aria-label={t.library}
                  >
                    {filters.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`${
                          styles.filterButton
                        } ${
                          filter === item.id
                            ? styles.selectedFilter
                            : ""
                        }`}
                        onClick={() =>
                          setFilter(item.id)
                        }
                        aria-pressed={
                          filter === item.id
                        }
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredCourses.length === 0 ? (
                  <div
                    className={styles.noResults}
                  >
                    {t.noResults}
                  </div>
                ) : (
                  <div
                    className={styles.courseList}
                  >
                    {filteredCourses.map(
                      (course) => {
                        const completed =
                          isCompleted(course);

                        const progress =
                          course.progress;

                        return (
                          <article
                            key={
                              course.enrollmentId
                            }
                            className={
                              styles.courseRow
                            }
                          >
                            <CourseThumbnail
                              title={course.title}
                              src={
                                course.thumbnailUrl
                              }
                            />

                            <div
                              className={
                                styles.courseInfo
                              }
                            >
                              <div
                                className={
                                  styles.courseMeta
                                }
                              >
                                <span>
                                  {t.courseLabel}
                                </span>

                                <span
                                  className={`${
                                    styles.statusBadge
                                  } ${
                                    completed
                                      ? styles.completedBadge
                                      : styles.activeBadge
                                  }`}
                                >
                                  <span
                                    className={
                                      styles.statusDot
                                    }
                                  />

                                  {getStatusLabel(
                                    course
                                  )}
                                </span>
                              </div>

                              <h3>
                                <Link
                                  href={`/${locale}/learn/${course.slug}`}
                                >
                                  {course.title}
                                </Link>
                              </h3>

                              {progress ? (
                                <div
                                  className={
                                    styles.progressSection
                                  }
                                >
                                  <div
                                    className={
                                      styles.progressHeader
                                    }
                                  >
                                    <span>
                                      {t.progress}
                                    </span>

                                    <strong>
                                      {Math.round(
                                        progress.progressPercentage
                                      )}
                                      %
                                    </strong>
                                  </div>

                                  <div
                                    className={
                                      styles.progressTrack
                                    }
                                    role="progressbar"
                                    aria-label={`${course.title} - ${t.progress}`}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={
                                      progress.progressPercentage
                                    }
                                  >
                                    <div
                                      className={
                                        styles.progressFill
                                      }
                                      style={{
                                        width: `${progress.progressPercentage}%`,
                                      }}
                                    />
                                  </div>

                                  <p
                                    className={
                                      styles.lessonCount
                                    }
                                  >
                                    {
                                      progress.completedLessons
                                    }{" "}
                                    /{" "}
                                    {
                                      progress.totalLessons
                                    }{" "}
                                    {
                                      t.lessonsCompleted
                                    }
                                  </p>
                                </div>
                              ) : (
                                <p
                                  className={
                                    styles.progressUnavailable
                                  }
                                >
                                  {
                                    t.progressUnavailable
                                  }
                                </p>
                              )}

                              <p
                                className={
                                  styles.enrollmentDate
                                }
                              >
                                {completed &&
                                course.completedAt
                                  ? t.completedOn
                                  : t.enrolled}

                                {" · "}

                                {formatDate(
                                  completed &&
                                    course.completedAt
                                    ? course.completedAt
                                    : course.enrolledAt,
                                  locale
                                )}
                              </p>
                            </div>

                            <Link
                              href={`/${locale}/learn/${course.slug}`}
                              className={
                                styles.openCourse
                              }
                            >
                              {completed ? t.reviewCourse : t.openCourse}

                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                              >
                                <path d="M5 12h14m-6-6 6 6-6 6" />
                              </svg>
                            </Link>
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
