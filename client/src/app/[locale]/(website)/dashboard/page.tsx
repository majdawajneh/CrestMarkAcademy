
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

type DashboardCourse = Enrollment & {
  progress: CourseProgress | null;
};

type Status =
  | "loading"
  | "ready"
  | "unauthorized"
  | "forbidden"
  | "error";

const translations = {
  en: {
    home: "Home",
    dashboard: "Dashboard",
    eyebrow: "YOUR LEARNING DASHBOARD",
    title: "Welcome to your",
    titleAccent: "learning space.",
    subtitle:
      "See where you stand, pick up where you left off, and keep moving toward your goals.",
    explore: "Explore courses",
    learning: "My Learning",
    overview: "LEARNING OVERVIEW",
    overviewTitle: "Your progress at a glance",
    overviewDescription:
      "A simple overview of your current learning journey.",
    enrolled: "Enrolled courses",
    active: "Active courses",
    completed: "Completed courses",
    lessons: "Lessons completed",
    average: "Average course progress",
    averageNote: "Across courses with available progress",
    progressUnavailable: "Progress data is unavailable",
    learningSection: "CONTINUE YOUR JOURNEY",
    continueTitle: "Continue learning",
    continueDescription:
      "Jump back into your courses and keep building your skills.",
    viewAll: "View all courses",
    progress: "Course progress",
    continue: "Continue learning",
    review: "Review course",
    completedStatus: "Completed",
    activeStatus: "In progress",
    lessonsCount: "lessons completed",
    enrolledOn: "Enrolled",
    shortcuts: "QUICK ACCESS",
    shortcutsTitle: "Everything you need",
    shortcutsDescription:
      "Your learning tools, all within easy reach.",
    coursesTitle: "My courses",
    coursesText: "View all your enrolled courses.",
    certificatesTitle: "Certificates",
    certificatesText: "Access your earned certificates.",
    profileTitle: "My profile",
    profileText: "View and manage your account.",
    browseTitle: "Explore more",
    browseText: "Find your next course to learn.",
    emptyTitle: "Your next chapter starts here.",
    emptyText:
      "You haven't enrolled in any courses yet. Explore the catalog and find something that inspires you.",
    emptyButton: "Browse courses",
    errorTitle: "We couldn't load your dashboard.",
    errorText: "Check your connection and try again.",
    unauthorizedTitle: "Sign in to access your dashboard.",
    forbiddenTitle: "You don't have access to this dashboard.",
    login: "Log in",
    retry: "Try again",
    loading: "Preparing your dashboard...",
    fallback: "COURSE",
  },
  ar: {
    home: "الرئيسية",
    dashboard: "لوحة التحكم",
    eyebrow: "لوحتك التعليمية",
    title: "أهلًا بك في",
    titleAccent: "مساحتك التعليمية.",
    subtitle:
      "تابع إنجازاتك، وارجع لدوراتك بسهولة، وكمّل طريقك نحو أهدافك التعليمية.",
    explore: "استكشف الدورات",
    learning: "دوراتي",
    overview: "نظرة عامة على التعلم",
    overviewTitle: "رحلتك التعليمية بالأرقام",
    overviewDescription:
      "ملخص واضح لتقدمك في الدورات التي التحقت بها.",
    enrolled: "الدورات المسجلة",
    active: "الدورات النشطة",
    completed: "الدورات المكتملة",
    lessons: "الدروس المكتملة",
    average: "متوسط التقدم",
    averageNote: "للدورات المتوفرة بيانات تقدمها",
    progressUnavailable: "بيانات التقدم غير متوفرة",
    learningSection: "أكمل رحلتك",
    continueTitle: "تابع التعلم",
    continueDescription:
      "ارجع لدوراتك وكمل من المكان اللي وصلتله.",
    viewAll: "عرض جميع الدورات",
    progress: "التقدم في الدورة",
    continue: "متابعة التعلم",
    review: "مراجعة الدورة",
    completedStatus: "مكتملة",
    activeStatus: "قيد التعلم",
    lessonsCount: "دروس مكتملة",
    enrolledOn: "تاريخ التسجيل",
    shortcuts: "روابط سريعة",
    shortcutsTitle: "كل ما تحتاجه في مكان واحد",
    shortcutsDescription:
      "انتقل بسهولة إلى دوراتك وشهاداتك وملفك الشخصي.",
    coursesTitle: "دوراتي",
    coursesText: "استعرض جميع الدورات المسجل فيها.",
    certificatesTitle: "شهاداتي",
    certificatesText: "اعرض الشهادات التي حصلت عليها.",
    profileTitle: "ملفي الشخصي",
    profileText: "استعرض بيانات حسابك وأدرها.",
    browseTitle: "اكتشف المزيد",
    browseText: "ابحث عن الدورة التالية المناسبة لك.",
    emptyTitle: "رحلتك التعليمية تبدأ من هنا.",
    emptyText:
      "لسه ما التحقت بأي دورة. استكشف الدورات وابدأ بتعلّم مهارة جديدة.",
    emptyButton: "استكشف الدورات",
    errorTitle: "تعذّر تحميل لوحة التحكم.",
    errorText: "تحقق من الاتصال وحاول مرة أخرى.",
    unauthorizedTitle: "سجّل الدخول للوصول إلى لوحة التحكم.",
    forbiddenTitle: "ليس لديك صلاحية الوصول لهذه الصفحة.",
    login: "تسجيل الدخول",
    retry: "إعادة المحاولة",
    loading: "جارٍ تجهيز لوحة التحكم...",
    fallback: "الدورة",
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

function validThumbnail(src: string | null): boolean {
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

function formatDate(value: string, locale: Locale): string {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "—";

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  ).format(date);
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function CourseImage({
  course,
  locale,
}: {
  course: DashboardCourse;
  locale: Locale;
}) {
  const [failed, setFailed] = useState(false);
  const valid = validThumbnail(course.thumbnailUrl) && !failed;

  return (
    <div className={styles.courseImageWrap}>
      {valid && course.thumbnailUrl ? (
        <Image
          key={course.thumbnailUrl}
          src={course.thumbnailUrl}
          alt={course.title}
          fill
          unoptimized
          sizes="(max-width: 650px) 100vw, 210px"
          className={styles.courseImage}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={styles.courseImageFallback}>
          <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path d="M12 18c8-4 15-4 20 0 5-4 12-4 20 0v30c-8-4-15-4-20 0-5-4-12-4-20 0V18Z" />
            <path d="M32 18v30" />
          </svg>
          <span>{translations[locale].fallback}</span>
        </div>
      )}
    </div>
  );
}

function validProgress(
  value: unknown,
  course: Enrollment
): value is CourseProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const progress = value as Record<string, unknown>;

  return (
    progress.courseId === course.courseId &&
    progress.enrollmentId === course.enrollmentId &&
    typeof progress.totalLessons === "number" &&
    Number.isInteger(progress.totalLessons) &&
    progress.totalLessons >= 0 &&
    typeof progress.completedLessons === "number" &&
    Number.isInteger(progress.completedLessons) &&
    progress.completedLessons >= 0 &&
    progress.completedLessons <= progress.totalLessons &&
    typeof progress.progressPercentage === "number" &&
    Number.isFinite(progress.progressPercentage) &&
    progress.progressPercentage >= 0 &&
    progress.progressPercentage <= 100 &&
    typeof progress.isCourseCompleted === "boolean"
  );
}

export default function DashboardPage() {
  const params = useParams<{ locale: string }>();
  const router = useRouter();

  const locale: Locale = params.locale === "ar" ? "ar" : "en";
  const t = translations[locale];

  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [reload, setReload] = useState(0);

  const loadProgress = useCallback(
    async (course: Enrollment): Promise<CourseProgress | null> => {
      const request = () =>
        fetch(`/api/my-learning/${course.courseId}/progress`, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

      try {
        let response = await request();

        if (response.status === 401) {
          const session = await getCurrentSession();

          if (session.status !== "authenticated") return null;

          response = await request();
        }

        if (!response.ok) return null;

        const result: unknown = await response.json();

        return validProgress(result, course) ? result : null;
      } catch {
        return null;
      }
    },
    []
  );

  const loadDashboard = useCallback(async () => {
    const request = () =>
      fetch("/api/my-learning", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

    let response = await request();

    if (response.status === 401) {
      const session = await getCurrentSession();

      if (session.status === "authenticated") {
        response = await request();
      } else if (session.status === "guest") {
        return {
          status: "unauthorized" as const,
          courses: [] as DashboardCourse[],
        };
      } else {
        throw new Error("Session unavailable");
      }
    }

    if (response.status === 401) {
      return {
        status: "unauthorized" as const,
        courses: [] as DashboardCourse[],
      };
    }

    if (response.status === 403) {
      return {
        status: "forbidden" as const,
        courses: [] as DashboardCourse[],
      };
    }

    if (!response.ok) {
      throw new Error("Unable to load dashboard");
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid enrollment response");
    }

    const enrollments = data as Enrollment[];
    const result: DashboardCourse[] = [];

    // Keep progress requests limited to five at a time.
    for (let index = 0; index < enrollments.length; index += 5) {
      const batch = enrollments.slice(index, index + 5);

      const enriched = await Promise.all(
        batch.map(async (course) => ({
          ...course,
          progress: await loadProgress(course),
        }))
      );

      result.push(...enriched);
    }

    return {
      status: "ready" as const,
      courses: result,
    };
  }, [loadProgress]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setStatus("loading");

      try {
        const result = await loadDashboard();

        if (cancelled) return;

        setCourses(result.courses);
        setStatus(result.status);
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [loadDashboard, reload]);

  const statistics = useMemo(() => {
    const completedCourses = courses.filter(isCompleted).length;
    const activeCourses = courses.filter(isActive).length;
    const available = courses.filter(
      (course) => course.progress !== null
    );

    const completedLessons = available.reduce(
      (total, course) => total + (course.progress?.completedLessons ?? 0),
      0
    );

    const averageProgress =
      available.length > 0
        ? Math.round(
            available.reduce(
              (total, course) =>
                total + (course.progress?.progressPercentage ?? 0),
              0
            ) / available.length
          )
        : null;

    return {
      total: courses.length,
      active: activeCourses,
      completed: completedCourses,
      lessons:
        available.length > 0 ? completedLessons : null,
      average: averageProgress,
    };
  }, [courses]);

  const recentCourses = useMemo(() => {
    return [...courses]
      .sort((a, b) => {
        const activeDifference =
          Number(isActive(b)) - Number(isActive(a));

        if (activeDifference !== 0) return activeDifference;

        const aTime = new Date(a.enrolledAt).getTime();
        const bTime = new Date(b.enrolledAt).getTime();

        return (Number.isFinite(bTime) ? bTime : 0) -
          (Number.isFinite(aTime) ? aTime : 0);
      })
      .slice(0, 3);
  }, [courses]);

  function retry() {
    setStatus("loading");
    setReload((value) => value + 1);
  }

  const shortcuts = [
    {
      id: "courses",
      href: `/${locale}/my-learning`,
      title: t.coursesTitle,
      text: t.coursesText,
      icon: "book",
    },
    {
      id: "certificates",
      href: `/${locale}/my-certificates`,
      title: t.certificatesTitle,
      text: t.certificatesText,
      icon: "certificate",
    },
    {
      id: "profile",
      href: `/${locale}/profile`,
      title: t.profileTitle,
      text: t.profileText,
      icon: "profile",
    },
    {
      id: "browse",
      href: `/${locale}/courses`,
      title: t.browseTitle,
      text: t.browseText,
      icon: "search",
    },
  ];

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href={`/${locale}`}>{t.home}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{t.dashboard}</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
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

            <div className={styles.heroActions}>
              <Link
                className={styles.primaryLink}
                href={`/${locale}/my-learning`}
              >
                {t.learning}
                <ArrowIcon />
              </Link>

              <Link
                className={styles.secondaryLink}
                href={`/${locale}/courses`}
              >
                {t.explore}
              </Link>
            </div>
          </div>

            <div className={styles.heroVisual}>
                <div className={styles.heroLogoCard}>
                    <img
                    src="/Logo.png"
                    alt="CrestMark learning dashboard"
                    className={styles.heroLogo}
                    />
                </div>

                <span className={styles.heroVisualLabel}>
                    CRESTMARK / LEARNING
                </span>
            </div>
        </header>

        {status === "loading" ? (
          <div className={styles.statePanel} role="status">
            <div className={styles.spinner} aria-hidden="true" />
            <p>{t.loading}</p>
          </div>
        ) : status !== "ready" ? (
          <div className={styles.statePanel}>
            <div className={styles.stateIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v6m0 4h.01" />
              </svg>
            </div>

            <h2>
              {status === "unauthorized"
                ? t.unauthorizedTitle
                : status === "forbidden"
                  ? t.forbiddenTitle
                  : t.errorTitle}
            </h2>

            {status === "error" && <p>{t.errorText}</p>}

            {status === "error" ? (
              <button
                className={styles.primaryLink}
                type="button"
                onClick={retry}
              >
                {t.retry}
              </button>
            ) : status === "unauthorized" ? (
              <button
                className={styles.primaryLink}
                type="button"
                onClick={() => router.push(`/${locale}/login`)}
              >
                {t.login}
              </button>
            ) : (
              <Link
                className={styles.primaryLink}
                href={`/${locale}`}
              >
                {t.home}
              </Link>
            )}
          </div>
        ) : (
          <>
            <section className={styles.overview}>
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.sectionEyebrow}>
                    {t.overview}
                  </span>
                  <h2>{t.overviewTitle}</h2>
                  <p>{t.overviewDescription}</p>
                </div>
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span>{t.enrolled}</span>
                  <strong>{statistics.total}</strong>
                  <div className={styles.statLine} />
                </div>

                <div className={styles.statCard}>
                  <span>{t.active}</span>
                  <strong>{statistics.active}</strong>
                  <div className={styles.statLine} />
                </div>

                <div className={styles.statCard}>
                  <span>{t.completed}</span>
                  <strong>{statistics.completed}</strong>
                  <div className={styles.statLine} />
                </div>

                <div className={styles.statCard}>
                  <span>{t.lessons}</span>
                  <strong>
                    {statistics.lessons === null
                      ? "—"
                      : statistics.lessons}
                  </strong>
                  <div className={styles.statLine} />
                </div>
              </div>

              <div className={styles.averagePanel}>
                <div>
                  <span className={styles.averageLabel}>
                    {t.average}
                  </span>
                  <p>{t.averageNote}</p>
                </div>

                <div className={styles.averageValue}>
                  <strong>
                    {statistics.average === null
                      ? "—"
                      : `${statistics.average}%`}
                  </strong>
                </div>
              </div>

              {statistics.average !== null && (
                <div
                  className={styles.averageTrack}
                  role="progressbar"
                  aria-label={t.average}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={statistics.average}
                >
                  <div
                    className={styles.averageFill}
                    style={{ width: `${statistics.average}%` }}
                  />
                </div>
              )}

              {courses.length > 0 && statistics.average === null && (
                <p className={styles.unavailableNote}>
                  {t.progressUnavailable}
                </p>
              )}
            </section>

            <section className={styles.continueSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.sectionEyebrow}>
                    {t.learningSection}
                  </span>
                  <h2>{t.continueTitle}</h2>
                  <p>{t.continueDescription}</p>
                </div>

                {courses.length > 0 && (
                  <Link
                    href={`/${locale}/my-learning`}
                    className={styles.viewAll}
                  >
                    {t.viewAll}
                    <ArrowIcon />
                  </Link>
                )}
              </div>

              {courses.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <svg viewBox="0 0 64 64" fill="none">
                      <path d="M12 18c8-4 15-4 20 0 5-4 12-4 20 0v30c-8-4-15-4-20 0-5-4-12-4-20 0V18Z" />
                      <path d="M32 18v30" />
                    </svg>
                  </div>

                  <h3>{t.emptyTitle}</h3>
                  <p>{t.emptyText}</p>

                  <Link
                    className={styles.primaryLink}
                    href={`/${locale}/courses`}
                  >
                    {t.emptyButton}
                    <ArrowIcon />
                  </Link>
                </div>
              ) : (
                <div className={styles.courseList}>
                  {recentCourses.map((course) => {
                    const completed = isCompleted(course);
                    const progress = course.progress;
                    const href =
                      `/${locale}/learn/${encodeURIComponent(course.slug)}`;

                    return (
                      <article
                        key={course.enrollmentId}
                        className={styles.courseCard}
                      >
                        <Link
                          href={href}
                          className={styles.courseThumbLink}
                          aria-label={`${t.continue}: ${course.title}`}
                        >
                          <CourseImage
                            key={`${course.courseId}-${course.thumbnailUrl ?? ""}`}
                            course={course}
                            locale={locale}
                          />
                        </Link>

                        <div className={styles.courseDetails}>
                          <div className={styles.courseTopline}>
                            <span
                              className={`${styles.courseStatus} ${
                                completed ? styles.doneStatus : ""
                              }`}
                            >
                              {completed
                                ? t.completedStatus
                                : isActive(course)
                                  ? t.activeStatus
                                  : course.enrollmentStatus}
                            </span>

                            <span className={styles.courseDate}>
                              {t.enrolledOn} ·{" "}
                              {formatDate(course.enrolledAt, locale)}
                            </span>
                          </div>

                          <h3>
                            <Link href={href}>{course.title}</Link>
                          </h3>

                          {progress ? (
                            <div className={styles.courseProgress}>
                              <div className={styles.progressLabels}>
                                <span>{t.progress}</span>
                                <strong>
                                  {Math.round(
                                    progress.progressPercentage
                                  )}%
                                </strong>
                              </div>

                              <div
                                className={styles.progressTrack}
                                role="progressbar"
                                aria-label={`${course.title} - ${t.progress}`}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={
                                  progress.progressPercentage
                                }
                              >
                                <div
                                  className={styles.progressFill}
                                  style={{
                                    width:
                                      `${progress.progressPercentage}%`,
                                  }}
                                />
                              </div>

                              <small>
                                {progress.completedLessons} /{" "}
                                {progress.totalLessons} {t.lessonsCount}
                              </small>
                            </div>
                          ) : (
                            <p className={styles.courseUnavailable}>
                              {t.progressUnavailable}
                            </p>
                          )}
                        </div>

                        <Link
                          href={href}
                          className={styles.continueButton}
                        >
                          {completed ? t.review : t.continue}
                          <ArrowIcon />
                        </Link>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className={styles.shortcutsSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.sectionEyebrow}>
                    {t.shortcuts}
                  </span>
                  <h2>{t.shortcutsTitle}</h2>
                  <p>{t.shortcutsDescription}</p>
                </div>
              </div>

              <div className={styles.shortcutGrid}>
                {shortcuts.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={styles.shortcut}
                  >
                    <div className={styles.shortcutIcon}>
                      {item.icon === "book" && (
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M4 5c3-1.5 5.7-1.5 8 0 2.3-1.5 5-1.5 8 0v14c-3-1.5-5.7-1.5-8 0-2.3-1.5-5-1.5-8 0V5Z" />
                          <path d="M12 5v14" />
                        </svg>
                      )}

                      {item.icon === "certificate" && (
                        <svg viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="9" r="5" />
                          <path d="m8 13-1 8 5-2 5 2-1-8" />
                        </svg>
                      )}

                      {item.icon === "profile" && (
                        <svg viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21c0-4.5 3-7 8-7s8 2.5 8 7" />
                        </svg>
                      )}

                      {item.icon === "search" && (
                        <svg viewBox="0 0 24 24" fill="none">
                          <circle cx="10.5" cy="10.5" r="6.5" />
                          <path d="m16 16 5 5" />
                        </svg>
                      )}
                    </div>

                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    <span className={styles.shortcutArrow}>
                      <ArrowIcon />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
