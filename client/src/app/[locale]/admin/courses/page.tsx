"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { useParams } from "next/navigation";

import { getCurrentSession } from "@/lib/auth-session";

import styles from "./page.module.css";

type Course = {

  id: number;

  title: string;

  slug: string;

  shortDescription: string | null;

  thumbnailUrl: string | null;

  price: number;

  discountPrice: number | null;

  language: string;

  level: string;

  status: "Draft" | "Published" | "Archived";

  categoryName: string | null;

  instructorName: string | null;

  isFeatured: boolean;

  reviewsCount: number;

  enrollmentCount: number;

};

type CourseAction = "publish" | "unpublish" | "archive" | "restore";
type PendingAction = { course: Course; action: CourseAction };

type ActionResult = { kind: "success" | "error"; message: string };

function extractError(value: unknown, fallback: string): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const data = value as Record<string, unknown>;
  if (typeof data.message === "string" && data.message.trim()) return data.message;
  if (typeof data.detail === "string" && data.detail.trim()) return data.detail;
  if (typeof data.title === "string" && data.title.trim()) return data.title;
  if (data.errors && typeof data.errors === "object" && !Array.isArray(data.errors)) {
    const details = Object.values(data.errors as Record<string, unknown>)
      .flatMap((entry) => Array.isArray(entry) ? entry : [])
      .filter((item): item is string => typeof item === "string");
    if (details.length) return details.slice(0, 3).join(" ");
  }
  return fallback;
}

type LoadStatus = "loading" | "ready" | "unauthorized" | "forbidden" | "error";

const copy = {

  en: {

    eyebrow: "COURSE MANAGEMENT",

    title: "All courses",

    subtitle: "Review and organize your academy's course catalog.",

    total: "Total courses",

    featured: "Featured courses",

    enrollments: "Total enrollments",

    catalog: "Course catalog",

    catalogDescription: "All courses managed by CrestMark Academy.",

    search: "Search courses by title or description...",

    allCategories: "All categories",

    allLanguages: "All languages",

    course: "Course",

    category: "Category",

    price: "Price",

    students: "Enrollments",

    language: "Language",

    status: "Status",

    draft: "Draft",

    published: "Published",

    archived: "Archived",

    featuredLabel: "Featured",

    noInstructor: "No instructor assigned",

    empty: "No courses match your filters.",

    loading: "Loading courses...",

    error: "We couldn't load the course catalog.",

    unauthorized: "Your session has expired. Please log in.",

    forbidden: "You don't have permission to view these courses.",

    retry: "Try again",

    login: "Log in",

    clear: "Clear filters",

    view: "View public page",

    edit: "Edit course",
    manageContent: "Manage content",

    create: "Create Course",

    actions: "Actions",

    showing: "Showing",

    of: "of",

    courses: "courses",

    free: "Free",

    refresh: "Refresh",
    publish: "Publish",
    unpublish: "Unpublish",
    archive: "Archive",
    restore: "Restore",
    confirmTitle: "Confirm course action",
    confirm: "Confirm",
    cancel: "Cancel",
    processing: "Processing...",
    actionQuestion: "Are you sure you want to {action} this course?",
    archiveWarning: "Archiving removes the course from the public catalog until it is restored and published again.",
    unpublishWarning: "Students will no longer see this course in the public catalog.",
    publishWarning: "The course will become visible in the public catalog if it passes the publishing requirements.",
    successMessage: "Course status updated successfully.",
    failureMessage: "Unable to update course status.",
    refreshError: "The action succeeded, but the course list could not be refreshed. Press Refresh to reload it.",

  },

  ar: {

    eyebrow: "إدارة الدورات",

    title: "جميع الدورات",

    subtitle: "استعرض ونظّم الدورات التعليمية داخل الأكاديمية.",

    total: "إجمالي الدورات",

    featured: "الدورات المميزة",

    enrollments: "إجمالي التسجيلات",

    catalog: "قائمة الدورات",

    catalogDescription: "جميع الدورات التي تديرها CrestMark Academy.",

    search: "ابحث باسم الدورة أو وصفها...",

    allCategories: "جميع التصنيفات",

    allLanguages: "جميع اللغات",

    course: "الدورة",

    category: "التصنيف",

    price: "السعر",

    students: "التسجيلات",

    language: "اللغة",

    status: "الحالة",

    draft: "مسودة",

    published: "منشورة",

    archived: "مؤرشفة",

    featuredLabel: "مميزة",

    noInstructor: "لا يوجد مدرّس معيّن",

    empty: "لا توجد دورات تطابق خيارات البحث.",

    loading: "جارٍ تحميل الدورات...",

    error: "تعذّر تحميل قائمة الدورات.",

    unauthorized: "انتهت صلاحية الجلسة. يرجى تسجيل الدخول.",

    forbidden: "ليس لديك صلاحية عرض هذه الدورات.",

    retry: "إعادة المحاولة",

    login: "تسجيل الدخول",

    clear: "مسح الفلاتر",

    view: "عرض صفحة الدورة العامة",

    edit: "تعديل الدورة",

    manageContent: "إدارة المحتوى",

    create: "إنشاء دورة",

    actions: "الإجراءات",

    showing: "عرض",

    of: "من",

    courses: "دورات",

    free: "مجانية",

    refresh: "تحديث",
    publish: "نشر",
    unpublish: "إلغاء النشر",
    archive: "أرشفة",
    restore: "استعادة",
    confirmTitle: "تأكيد الإجراء",
    confirm: "تأكيد",
    cancel: "إلغاء",
    processing: "جارٍ التنفيذ...",
    actionQuestion: "هل تريد تنفيذ الإجراء ({action}) على هذه الدورة؟",
    archiveWarning: "الأرشفة تُخفي الدورة من القائمة العامة إلى حين استعادتها ونشرها مجددًا.",
    unpublishWarning: "لن تظهر الدورة بعد ذلك ضمن القائمة العامة للطلاب.",
    publishWarning: "ستظهر الدورة ضمن القائمة العامة إذا استوفت متطلبات النشر.",
    successMessage: "تم تحديث حالة الدورة بنجاح.",
    failureMessage: "تعذّر تحديث حالة الدورة.",
    refreshError: "نجح الإجراء، لكن تعذّر تحديث القائمة. اضغط تحديث لإعادة تحميلها.",

  },

} as const;

function validCourse(value: unknown): value is Course {

  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const data = value as Record<string, unknown>;

  return (

    Number.isSafeInteger(data.id) &&

    (data.id as number) > 0 &&

    typeof data.title === "string" &&

    typeof data.slug === "string" &&

    (data.shortDescription === null || typeof data.shortDescription === "string") &&

    (data.thumbnailUrl === null || typeof data.thumbnailUrl === "string") &&

    typeof data.price === "number" &&

    Number.isFinite(data.price) &&

    data.price >= 0 &&

    (data.discountPrice === null ||

      (typeof data.discountPrice === "number" &&

        Number.isFinite(data.discountPrice) && data.discountPrice >= 0)) &&

    typeof data.language === "string" &&

    typeof data.level === "string" &&

    (data.status === "Draft" || data.status === "Published" || data.status === "Archived") &&

    (data.categoryName === null || typeof data.categoryName === "string") &&

    (data.instructorName === null || typeof data.instructorName === "string") &&

    typeof data.isFeatured === "boolean" &&

    Number.isSafeInteger(data.reviewsCount) &&

    Number.isSafeInteger(data.enrollmentCount) &&

    (data.enrollmentCount as number) >= 0

  );

}

function formatPrice(value: number) {

  return new Intl.NumberFormat("en-US", {

    style: "currency",

    currency: "USD",

  }).format(value);

}

export default function AdminCoursesPage() {

  const params = useParams<{ locale: string }>();

  const locale = params.locale === "ar" ? "ar" : "en";

  const t = copy[locale];

  const [courses, setCourses] = useState<Course[]>([]);

  const [status, setStatus] = useState<LoadStatus>("loading");

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("all");

  const [language, setLanguage] = useState("all");

  const [reload, setReload] = useState(0);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  const loadCourses = useCallback(async () => {

    const requestCourses = () => fetch("/api/admin/courses", {

      method: "GET",

      credentials: "same-origin",

      cache: "no-store",

    });

    let response = await requestCourses();

    if (response.status === 401) {

      const session = await getCurrentSession();

      if (session.status === "authenticated") {

        if (!session.user.roles.includes("Admin")) {

          return { status: "forbidden" as const, courses: [] };

        }

        response = await requestCourses();

      } else if (session.status === "guest") {

        return { status: "unauthorized" as const, courses: [] };

      } else {

        throw new Error("Session temporarily unavailable");

      }

    }

    if (response.status === 401) return { status: "unauthorized" as const, courses: [] };

    if (response.status === 403) return { status: "forbidden" as const, courses: [] };

    if (!response.ok) throw new Error("Unable to load courses");

    const data: unknown = await response.json();

    if (!Array.isArray(data) || !data.every(validCourse)) {

      throw new Error("Invalid course response");

    }

    return { status: "ready" as const, courses: data as Course[] };

  }, []);

  useEffect(() => {

    let cancelled = false;

    async function load() {

      try {

        const result = await loadCourses();

        if (cancelled) return;

        setCourses(result.courses);

        setStatus(result.status);

      } catch {

        if (!cancelled) setStatus("error");

      }

    }

    void load();

    return () => { cancelled = true; };

  }, [loadCourses, reload]);

  const categories = useMemo(() => Array.from(new Set(

    courses.map((course) => course.categoryName)

      .filter((value): value is string => Boolean(value))

  )).sort(), [courses]);

  const languages = useMemo(() => Array.from(new Set(

    courses.map((course) => course.language).filter(Boolean)

  )).sort(), [courses]);

  const filteredCourses = useMemo(() => {

    const query = search.trim().toLocaleLowerCase();

    return courses.filter((course) => (

      (!query || course.title.toLocaleLowerCase().includes(query) ||

        (course.shortDescription ?? "").toLocaleLowerCase().includes(query)) &&

      (category === "all" || course.categoryName === category) &&

      (language === "all" || course.language === language)

    ));

  }, [courses, search, category, language]);

  const featuredCount = courses.filter((course) => course.isFeatured).length;

  const totalEnrollments = courses.reduce((sum, course) => sum + course.enrollmentCount, 0);

  async function executeAction() {
    if (!pendingAction || isProcessing) return;
    const { course, action } = pendingAction;
    setIsProcessing(true);
    setActionResult(null);

    const requestAction = () => fetch(
      `/api/admin/courses/${course.id}/${action}`,
      { method: "PATCH", credentials: "same-origin", cache: "no-store" }
    );

    try {
      let response = await requestAction();
      if (response.status === 401) {
        const session = await getCurrentSession();
        if (session.status !== "authenticated" || !session.user.roles.includes("Admin")) {
          setActionResult({ kind: "error", message: t.unauthorized });
          return;
        }
        response = await requestAction();
      }

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setActionResult({ kind: "error", message: extractError(data, t.failureMessage) });
        return;
      }

      // Operation succeeded on the backend. Close the dialog, then read authoritative data.
      setPendingAction(null);
      try {
        const result = await loadCourses();
        if (result.status === "ready") {
          setCourses(result.courses);
          setStatus("ready");
          setActionResult({ kind: "success", message: t.successMessage });
        } else {
          setActionResult({ kind: "error", message: t.refreshError });
        }
      } catch {
        setActionResult({ kind: "error", message: t.refreshError });
      }
    } catch {
      setActionResult({ kind: "error", message: t.failureMessage });
    } finally {
      setIsProcessing(false);
    }
  }

  function openAction(course: Course, action: CourseAction) {
    setActionResult(null);
    setPendingAction({ course, action });
  }

  function refresh() {

    setStatus("loading");

    setReload((value) => value + 1);

  }

  function clearFilters() {

    setSearch("");

    setCategory("all");

    setLanguage("all");

  }

  return (

    <main className={styles.page} dir={locale === "ar" ? "rtl" : "ltr"}>

      <div className={styles.pageHeading}>

        <div>

          <span className={styles.eyebrow}>{t.eyebrow}</span>

          <h2>{t.title}</h2>

          <p>{t.subtitle}</p>

        </div>

        <div className={styles.headingActions}>

          <button type="button" onClick={refresh} disabled={status === "loading"}

            className={styles.refreshButton}>

            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"

              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"

              strokeLinejoin="round" aria-hidden="true">

              <path d="M20 7v5h-5" />

              <path d="M4 17v-5h5" />

              <path d="M5.5 9a7 7 0 0 1 12-3l2.5 2" />

              <path d="M18.5 15a7 7 0 0 1-12 3L4 16" />

            </svg>

            {t.refresh}

          </button>

          <Link href={`/${locale}/admin/courses/create`} className={styles.createButton}>

            + {t.create}

          </Link>

        </div>

      </div>

      {actionResult && (
        <div role={actionResult.kind === "error" ? "alert" : "status"}
          className={`${styles.actionNotice} ${actionResult.kind === "error" ? styles.actionNoticeError : styles.actionNoticeSuccess}`}>
          <span>{actionResult.message}</span>
          <button type="button" onClick={() => setActionResult(null)} aria-label={t.cancel}>×</button>
        </div>
      )}

      {status !== "ready" ? (

        <section className={styles.messagePanel} role="status">

          {status === "loading" ? <p>{t.loading}</p> : (

            <>

              <h3>{status === "unauthorized" ? t.unauthorized :

                status === "forbidden" ? t.forbidden : t.error}</h3>

              {status === "unauthorized" ? (

                <Link href={`/${locale}/login`} className={styles.actionButton}>{t.login}</Link>

              ) : status === "error" ? (

                <button type="button" onClick={refresh} className={styles.actionButton}>{t.retry}</button>

              ) : null}

            </>

          )}

        </section>

      ) : (

        <>

          <section className={styles.stats}>

            <article className={styles.statCard}><span>{t.total}</span><strong>{courses.length}</strong></article>

            <article className={styles.statCard}><span>{t.featured}</span><strong>{featuredCount}</strong></article>

            <article className={styles.statCard}><span>{t.enrollments}</span><strong>{totalEnrollments}</strong></article>

          </section>

          <section className={styles.catalog}>

            <div className={styles.catalogHeader}>

              <div><h3>{t.catalog}</h3><p>{t.catalogDescription}</p></div>

              <span className={styles.resultCount}>

                {t.showing} {filteredCourses.length} {t.of} {courses.length} {t.courses}

              </span>

            </div>

            <div className={styles.filters}>

              <div className={styles.searchField}>

                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"

                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">

                  <circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" />

                </svg>

                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}

                  placeholder={t.search} aria-label={t.search} />

              </div>

              <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label={t.category}>

                <option value="all">{t.allCategories}</option>

                {categories.map((value) => <option key={value} value={value}>{value}</option>)}

              </select>

              <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={t.language}>

                <option value="all">{t.allLanguages}</option>

                {languages.map((value) => <option key={value} value={value}>{value}</option>)}

              </select>

            </div>

            {filteredCourses.length === 0 ? (

              <div className={styles.emptyState}>

                <p>{t.empty}</p>

                <button type="button" onClick={clearFilters}>{t.clear}</button>

              </div>

            ) : (

              <div className={styles.tableScroll}>

                <table className={styles.courseTable}>

                  <thead><tr>

                    <th scope="col">{t.course}</th>

                    <th scope="col">{t.category}</th>

                    <th scope="col">{t.price}</th>

                    <th scope="col">{t.students}</th>

                    <th scope="col">{t.language}</th>

                    <th scope="col">{t.status}</th>

                    <th scope="col">{t.actions}</th>

                  </tr></thead>

                  <tbody>

                    {filteredCourses.map((course) => {

                      const hasDiscount = course.discountPrice !== null && course.discountPrice < course.price;

                      const currentPrice = hasDiscount ? course.discountPrice! : course.price;

                      return (

                        <tr key={course.id}>

                          <td>

                            <div className={styles.courseCell}>

                              <div className={styles.courseThumbnail} aria-hidden="true">

                                <svg width="25" height="25" viewBox="0 0 24 24" fill="none"

                                  stroke="currentColor" strokeWidth="1.5">

                                  <path d="m12 3-10 5 10 5 10-5-10-5Z" />

                                  <path d="M5 10v7c4 3 10 3 14 0v-7" />

                                </svg>

                              </div>

                              <div className={styles.courseDetails}>

                                <strong>{course.title}</strong>

                                <span className={styles.courseId}>ID #{course.id} · {course.level}</span>

                                {course.instructorName && (

                                  <span className={styles.courseId}>{course.instructorName}</span>

                                )}

                                {course.isFeatured && <span className={styles.featuredBadge}>{t.featuredLabel}</span>}

                              </div>

                            </div>

                          </td>

                          <td><span className={styles.categoryText}>{course.categoryName ?? "—"}</span></td>

                          <td>

                            <div className={styles.priceCell}>

                              <strong>{currentPrice === 0 ? t.free : formatPrice(currentPrice)}</strong>

                              {hasDiscount && <del>{formatPrice(course.price)}</del>}

                            </div>

                          </td>

                          <td><span className={styles.enrollmentNumber}>{course.enrollmentCount}</span></td>

                          <td>{course.language}</td>

                          <td>

                            <span className={`${styles.statusBadge} ${

                              course.status === "Published"

                                ? styles.statusPublished

                                : course.status === "Archived"

                                  ? styles.statusArchived

                                  : styles.statusDraft

                            }`}>

                              {course.status === "Published"

                                ? t.published

                                : course.status === "Archived"

                                  ? t.archived

                                  : t.draft}

                            </span>

                          </td>

                          <td>

                            <div className={styles.rowActions}>

                              
                                <Link
                                  className={styles.editCourse}
                                  href={`/${locale}/admin/courses/${course.id}/edit`}
                                  aria-label={`${t.edit}: ${course.title}`}
                                >
                                  {t.edit}
                                </Link>

                                <Link
                                  className={styles.editCourse}
                                  href={`/${locale}/admin/courses/${course.id}/content`}
                                  aria-label={`${t.manageContent}: ${course.title}`}
                                >
                                  {t.manageContent}
                                </Link>


                              {course.status === "Draft" && (
                                <button type="button" className={`${styles.courseAction} ${styles.courseActionPrimary}`}
                                  onClick={() => openAction(course, "publish")} disabled={isProcessing}>
                                  {t.publish}
                                </button>
                              )}
                              {course.status === "Published" && (
                                <button type="button" className={styles.courseAction}
                                  onClick={() => openAction(course, "unpublish")} disabled={isProcessing}>
                                  {t.unpublish}
                                </button>
                              )}
                              {course.status !== "Archived" ? (
                                <button type="button" className={`${styles.courseAction} ${styles.courseActionDanger}`}
                                  onClick={() => openAction(course, "archive")} disabled={isProcessing}>
                                  {t.archive}
                                </button>
                              ) : (
                                <button type="button" className={styles.courseAction}
                                  onClick={() => openAction(course, "restore")} disabled={isProcessing}>
                                  {t.restore}
                                </button>
                              )}
                              {course.status === "Published" && (

                              <Link className={styles.viewCourse}

                                href={`/${locale}/courses/${encodeURIComponent(course.slug)}`}

                                title={t.view} aria-label={`${t.view}: ${course.title}`}>

                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none"

                                  stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"

                                  strokeLinejoin="round" aria-hidden="true">

                                  <path d="M5 12h14m-6-6 6 6-6 6" />

                                </svg>

                              </Link>

                              )}

                            </div>

                          </td>

                        </tr>

                      );

                    })}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        </>

      )}

      {pendingAction && (
        <div className={styles.confirmBackdrop} onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isProcessing) setPendingAction(null);
        }}>
          <section className={styles.confirmDialog} role="alertdialog" aria-modal="true"
            aria-labelledby="course-action-title" aria-describedby="course-action-description">
            <h3 id="course-action-title">{t.confirmTitle}</h3>
            <p className={styles.confirmCourseName}>{pendingAction.course.title}</p>
            <p id="course-action-description">
              {t.actionQuestion.replace("{action}", t[pendingAction.action])}
            </p>
            {pendingAction.action === "archive" && <p className={styles.confirmWarning}>{t.archiveWarning}</p>}
            {pendingAction.action === "unpublish" && <p className={styles.confirmWarning}>{t.unpublishWarning}</p>}
            {pendingAction.action === "publish" && <p className={styles.confirmWarning}>{t.publishWarning}</p>}
            <div className={styles.confirmButtons}>
              <button type="button" className={styles.confirmCancel} disabled={isProcessing}
                onClick={() => setPendingAction(null)}>{t.cancel}</button>
              <button type="button" className={styles.confirmProceed} disabled={isProcessing}
                onClick={() => void executeAction()} autoFocus>
                {isProcessing ? t.processing : `${t.confirm}: ${t[pendingAction.action]}`}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>

  );

}
