
"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./page.module.css";

type Locale = "en" | "ar";

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
    home: "Home",
    eyebrow: "YOUR LEARNING SPACE",
    title: "Your learning,",
    titleAccent: "your pace.",
    subtitle:
      "A clear view of every course you're taking. Track your progress, stay focused, and keep building your skills.",
    browse: "Explore courses",
    overviewLabel: "YOUR LEARNING AT A GLANCE",
    overviewTitle: "Make every lesson count.",
    overviewText:
      "A little progress today adds up to something remarkable.",
    total: "Enrolled courses",
    active: "In progress",
    completed: "Completed",
    library: "Your course library",
    libraryText:
      "Continue your courses or revisit what you've completed.",
    all: "All courses",
    activeFilter: "In progress",
    completedFilter: "Completed",
    courseLabel: "YOUR COURSE",
    enrolled: "Enrolled",
    completedOn: "Completed",
    openCourse: "Continue learning",
    reviewCourse: "Review course",
    progress: "Learning progress",
    lessonsCompleted: "lessons completed",
    progressUnavailable: "Progress temporarily unavailable",
    statusActive: "In progress",
    statusCompleted: "Completed",
    statusNotStarted: "Not started",
    emptyTitle: "Your learning journey starts here.",
    emptyText:
      "Browse our courses and find something you'd love to learn.",
    noResults: "No courses match this filter.",
    noResultsText:
      "Choose another tab to see your enrolled courses.",
    loading: "Preparing your learning space...",
    errorTitle: "We couldn't load your courses.",
    errorText: "Check your connection and try again.",
    retry: "Try again",
    unauthorized: "Sign in to see your learning space.",
    signIn: "Log in",
    forbidden: "You don't have access to this page.",
    fallback: "COURSE PREVIEW",
  },
  ar: {
    home: "الرئيسية",
    eyebrow: "مساحتك التعليمية",
    title: "تعلّم بطريقتك،",
    titleAccent: "وتقدّم كل يوم.",
    subtitle:
      "كل دوراتك في مكان واحد. تابع تقدمك، وكمّل دروسك، وطوّر مهاراتك خطوة بخطوة.",
    browse: "استكشف الدورات",
    overviewLabel: "ملخص رحلتك التعليمية",
    overviewTitle: "كل درس يقربك من هدفك.",
    overviewText:
      "خطوات صغيرة اليوم تصنع فرقًا كبيرًا مع الوقت.",
    total: "الدورات المسجلة",
    active: "قيد التعلم",
    completed: "المكتملة",
    library: "مكتبة دوراتك",
    libraryText:
      "تابع دوراتك الحالية أو ارجع للدورات التي أكملتها.",
    all: "جميع الدورات",
    activeFilter: "قيد التعلم",
    completedFilter: "المكتملة",
    courseLabel: "دورتك التعليمية",
    enrolled: "تاريخ التسجيل",
    completedOn: "تاريخ الإكمال",
    openCourse: "متابعة التعلم",
    reviewCourse: "مراجعة الدورة",
    progress: "التقدم في التعلم",
    lessonsCompleted: "دروس مكتملة",
    progressUnavailable: "تعذّر عرض التقدم مؤقتًا",
    statusActive: "قيد التعلم",
    statusCompleted: "مكتملة",
    statusNotStarted: "لم تبدأ بعد",
    emptyTitle: "رحلتك التعليمية تبدأ من هون.",
    emptyText:
      "استكشف دورات CrestMark واختر المهارات اللي حابب تطوّرها.",
    noResults: "ما في دورات ضمن هذا الفلتر.",
    noResultsText: "اختار تبويب ثاني لعرض دوراتك.",
    loading: "جارٍ تجهيز مساحتك التعليمية...",
    errorTitle: "تعذّر تحميل دوراتك.",
    errorText: "تحقق من الاتصال وحاول مرة ثانية.",
    retry: "إعادة المحاولة",
    unauthorized: "سجّل الدخول لعرض دوراتك.",
    signIn: "تسجيل الدخول",
    forbidden: "ليس لديك صلاحية الوصول لهذه الصفحة.",
    fallback: "صورة الدورة",
  },
} as const;

function isCompleted(course: Enrollment): boolean {
  return (
    course.enrollmentStatus?.toLowerCase() === "completed" ||
    course.completedAt !== null
  );
}

function isActive(course: Enrollment): boolean {
  return (
    course.enrollmentStatus?.toLowerCase() === "active" &&
    !isCompleted(course)
  );
}

function formatDate(value: string, locale: Locale): string {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
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

function isValidImage(src: string | null): boolean {
  if (!src) return false;

  try {
    const url = new URL(src);

    return (
      ["https:", "http:"].includes(url.protocol) &&
      url.hostname !== "example.com" &&
      !url.hostname.endsWith(".example.com")
    );
  } catch {
    return false;
  }
}

function CourseThumbnail({
  title,
  src,
  locale,
}: {
  title: string;
  src: string | null;
  locale: Locale;
}) {
  const [failed, setFailed] = useState(false);
  const valid = isValidImage(src) && !failed;

  return (
    <div className={styles.thumbnail}>
      {valid && src ? (
        <Image
          key={src}
          src={src}
          alt={title}
          fill
          sizes="(max-width: 700px) 100vw, (max-width: 1050px) 240px, 270px"
          unoptimized
          className={styles.courseImage}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={styles.thumbnailFallback}>
          <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path d="M12 18c8-4 15-4 20 0 5-4 12-4 20 0v30c-8-4-15-4-20 0-5-4-12-4-20 0V18Z" />
            <path d="M32 18v30" />
          </svg>
          <span>{copy[locale].fallback}</span>
        </div>
      )}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

export default function MyLearningPage() {
  const params = useParams<{ locale: string }>();
  const router = useRouter();

  const locale: Locale = params.locale === "ar" ? "ar" : "en";
  const t = copy[locale];

  const [courses, setCourses] = useState<EnrollmentWithProgress[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [filter, setFilter] = useState<Filter>("all");
  const [reload, setReload] = useState(0);

  const loadProgress = useCallback(
    async (course: Enrollment): Promise<CourseProgress | null> => {
      const requestProgress = () =>
        fetch(`/api/my-learning/${course.courseId}/progress`, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

      try {
        let response = await requestProgress();

        if (response.status === 401) {
          const session = await getCurrentSession();

          if (session.status !== "authenticated") {
            return null;
          }

          response = await requestProgress();
        }

        if (!response.ok) return null;

        const progress: CourseProgress = await response.json();

        if (
          progress.courseId !== course.courseId ||
          progress.enrollmentId !== course.enrollmentId ||
          !Number.isInteger(progress.totalLessons) ||
          !Number.isInteger(progress.completedLessons) ||
          progress.totalLessons < 0 ||
          progress.completedLessons < 0 ||
          progress.completedLessons > progress.totalLessons ||
          !Number.isFinite(progress.progressPercentage) ||
          progress.progressPercentage < 0 ||
          progress.progressPercentage > 100 ||
          typeof progress.isCourseCompleted !== "boolean"
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
    const requestCourses = () =>
      fetch("/api/my-learning", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

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
        throw new Error("Session temporarily unavailable");
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
      throw new Error("Unable to load enrolled courses");
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid enrollment response");
    }

    const enrollments = data as Enrollment[];
    const enriched: EnrollmentWithProgress[] = [];

    // Preserve the existing five-request concurrency limit.
    for (let index = 0; index < enrollments.length; index += 5) {
      const batch = enrollments.slice(index, index + 5);

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
      setStatus("loading");

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

  const completedCount = useMemo(
    () => courses.filter(isCompleted).length,
    [courses]
  );

  const activeCount = useMemo(
    () => courses.filter(isActive).length,
    [courses]
  );

  const filteredCourses = useMemo(() => {
    if (filter === "completed") {
      return courses.filter(isCompleted);
    }

    if (filter === "active") {
      return courses.filter(isActive);
    }

    return courses;
  }, [courses, filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t.all },
    { id: "active", label: t.activeFilter },
    { id: "completed", label: t.completedFilter },
  ];

  function retry() {
    setStatus("loading");
    setReload((value) => value + 1);
  }

  function getStatusLabel(course: Enrollment): string {
    if (isCompleted(course)) return t.statusCompleted;
    if (isActive(course)) return t.statusActive;

    return course.enrollmentStatus || t.statusNotStarted;
  }

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href={`/${locale}`}>{t.home}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{locale === "ar" ? "دوراتي" : "My Learning"}</span>
        </nav>

        <header className={styles.pageHeader}>
          <div className={styles.headerCopy}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowLine} />
              {t.eyebrow}
            </span>

            <h1>
              {t.title}
              <br />
              <span>{t.titleAccent}</span>
            </h1>

            <p>{t.subtitle}</p>
          </div>

          <Link
            href={`/${locale}/courses`}
            className={styles.exploreLink}
          >
            {t.browse}
            <ArrowIcon />
          </Link>
        </header>

        {status === "loading" ? (
          <div className={styles.messagePanel} role="status">
            <div className={styles.spinner} aria-hidden="true" />
            <p>{t.loading}</p>
          </div>
        ) : status !== "ready" ? (
          <div className={styles.messagePanel}>
            <div className={styles.messageIcon} aria-hidden="true">
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

            {status === "error" && <p>{t.errorText}</p>}

            {status === "unauthorized" ? (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => router.push(`/${locale}/login`)}
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
              <Link href={`/${locale}`} className={styles.primaryButton}>
                {t.home}
              </Link>
            )}
          </div>
        ) : (
          <>
            <section className={styles.overview} aria-label={t.overviewLabel}>
              <div className={styles.overviewIntro}>
                <span className={styles.overviewLabel}>{t.overviewLabel}</span>
                <h2>{t.overviewTitle}</h2>
                <p>{t.overviewText}</p>
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
                <div className={styles.emptyGraphic} aria-hidden="true">
                  <svg viewBox="0 0 64 64" fill="none">
                    <path d="M12 18c8-4 15-4 20 0 5-4 12-4 20 0v30c-8-4-15-4-20 0-5-4-12-4-20 0V18Z" />
                    <path d="M32 18v30" />
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
                <div className={styles.libraryHeader}>
                  <div>
                    <span className={styles.sectionLabel}>
                      {t.overviewLabel}
                    </span>
                    <h2>{t.library}</h2>
                    <p>{t.libraryText}</p>
                  </div>

                  <div className={styles.filters} role="group" aria-label={t.library}>
                    {filters.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`${styles.filterButton} ${
                          filter === item.id ? styles.selectedFilter : ""
                        }`}
                        onClick={() => setFilter(item.id)}
                        aria-pressed={filter === item.id}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredCourses.length === 0 ? (
                  <div className={styles.noResults}>
                    <h3>{t.noResults}</h3>
                    <p>{t.noResultsText}</p>
                  </div>
                ) : (
                  <div className={styles.courseList}>
                    {filteredCourses.map((course) => {
                      const completed = isCompleted(course);
                      const progress = course.progress;
                      const courseUrl =
                        `/${locale}/learn/${encodeURIComponent(course.slug)}`;

                      return (
                        <article
                          key={course.enrollmentId}
                          className={styles.courseRow}
                        >
                          <Link
                            href={courseUrl}
                            className={styles.thumbnailLink}
                            aria-label={`${t.openCourse}: ${course.title}`}
                          >
                            <CourseThumbnail
                              key={`${course.courseId}-${course.thumbnailUrl ?? ""}`}
                              title={course.title}
                              src={course.thumbnailUrl}
                              locale={locale}
                            />
                          </Link>

                          <div className={styles.courseInfo}>
                            <div className={styles.courseMeta}>
                              <span>{t.courseLabel}</span>
                              <span
                                className={`${styles.statusBadge} ${
                                  completed
                                    ? styles.completedBadge
                                    : styles.activeBadge
                                }`}
                              >
                                <span className={styles.statusDot} />
                                {getStatusLabel(course)}
                              </span>
                            </div>

                            <h3>
                              <Link href={courseUrl}>{course.title}</Link>
                            </h3>

                            {progress ? (
                              <div className={styles.progressSection}>
                                <div className={styles.progressHeader}>
                                  <span>{t.progress}</span>
                                  <strong>
                                    {Math.round(progress.progressPercentage)}%
                                  </strong>
                                </div>

                                <div
                                  className={styles.progressTrack}
                                  role="progressbar"
                                  aria-label={`${course.title} - ${t.progress}`}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-valuenow={progress.progressPercentage}
                                >
                                  <div
                                    className={styles.progressFill}
                                    style={{
                                      width: `${progress.progressPercentage}%`,
                                    }}
                                  />
                                </div>

                                <p className={styles.lessonCount}>
                                  {progress.completedLessons} /{" "}
                                  {progress.totalLessons} {t.lessonsCompleted}
                                </p>
                              </div>
                            ) : (
                              <p className={styles.progressUnavailable}>
                                {t.progressUnavailable}
                              </p>
                            )}

                            <p className={styles.enrollmentDate}>
                              {completed && course.completedAt
                                ? t.completedOn
                                : t.enrolled}
                              {" · "}
                              {formatDate(
                                completed && course.completedAt
                                  ? course.completedAt
                                  : course.enrolledAt,
                                locale
                              )}
                            </p>
                          </div>

                          <Link
                            href={courseUrl}
                            className={styles.openCourse}
                          >
                            {completed ? t.reviewCourse : t.openCourse}
                            <ArrowIcon />
                          </Link>
                        </article>
                      );
                    })}
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
