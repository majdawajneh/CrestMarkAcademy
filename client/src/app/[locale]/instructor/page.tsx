
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { authenticatedFetch } from "@/lib/auth-session";
import styles from "./page.module.css";

type Statistics = {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  uniqueStudents: number;
  completedEnrollments: number;
  totalReviews: number;
  averageRating: number | null;
};

type DashboardResponse = {
  instructorId: number;
  statistics: Statistics;
};

const translations = {
  en: {
    eyebrow: "TEACHING OVERVIEW",
    title: "Your teaching at a glance",
    description:
      "Track your courses, learners, and teaching performance.",
    refresh: "Refresh data",
    refreshing: "Updating...",
    courses: "Assigned courses",
    published: "Published",
    drafts: "Drafts",
    students: "Unique students",
    enrollments: "Total enrollments",
    completions: "Completed enrollments",
    reviews: "Student reviews",
    rating: "Average rating",
    noRating: "No ratings yet",
    activityTitle: "Teaching performance",
    activityDescription:
      "A quick breakdown of your current course activity.",
    courseCompletion: "Enrollment completion",
    publishedShare: "Published courses",
    noData: "No records yet",
    unavailable: "We couldn't load your dashboard.",
    retry: "Try again",
    updated: "Last updated",
  },
  ar: {
    eyebrow: "نظرة عامة على التدريس",
    title: "ملخص نشاطك التعليمي",
    description:
      "تابع دوراتك وطلابك وأداء المحتوى التعليمي من مكان واحد.",
    refresh: "تحديث البيانات",
    refreshing: "جارٍ التحديث...",
    courses: "الدورات المسندة",
    published: "منشورة",
    drafts: "مسودات",
    students: "الطلاب الفريدون",
    enrollments: "إجمالي التسجيلات",
    completions: "التسجيلات المكتملة",
    reviews: "تقييمات الطلاب",
    rating: "متوسط التقييم",
    noRating: "لا توجد تقييمات بعد",
    activityTitle: "أداء الدورات",
    activityDescription:
      "ملخص لحالة الدورات والتسجيلات الحالية.",
    courseCompletion: "نسبة إكمال التسجيلات",
    publishedShare: "نسبة الدورات المنشورة",
    noData: "لا توجد بيانات بعد",
    unavailable: "تعذّر تحميل لوحة المحاضر.",
    retry: "إعادة المحاولة",
    updated: "آخر تحديث",
  },
} as const;

function isDashboardData(value: unknown): value is DashboardResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const data = value as Record<string, unknown>;
  const stats = data.statistics;

  if (
    typeof data.instructorId !== "number" ||
    !Number.isSafeInteger(data.instructorId) ||
    !stats ||
    typeof stats !== "object" ||
    Array.isArray(stats)
  ) {
    return false;
  }

  const values = stats as Record<string, unknown>;
  const fields = [
    "totalCourses",
    "publishedCourses",
    "draftCourses",
    "totalEnrollments",
    "uniqueStudents",
    "completedEnrollments",
    "totalReviews",
  ];

  return (
    fields.every(
      (field) =>
        typeof values[field] === "number" &&
        Number.isSafeInteger(values[field]) &&
        (values[field] as number) >= 0
    ) &&
    (values.averageRating === null ||
      (typeof values.averageRating === "number" &&
        Number.isFinite(values.averageRating) &&
        values.averageRating >= 0 &&
        values.averageRating <= 5))
  );
}

export default function InstructorOverviewPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale === "ar" ? "ar" : "en";
  const t = translations[locale];

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);


function refreshDashboard() {
  setLoading(true);
  setError(false);
  setRefreshIndex((value) => value + 1);
}

useEffect(() => {
  const controller = new AbortController();

  async function loadDashboard() {
    try {
      const response = await authenticatedFetch(
        "/api/instructor/dashboard",
        {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: unknown = await response.json();

      if (!isDashboardData(result)) {
        throw new Error("Invalid dashboard response");
      }

      if (!controller.signal.aborted) {
        setData(result);
        setUpdatedAt(new Date());
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

  void loadDashboard();

  return () => {
    controller.abort();
  };
}, [refreshIndex]);


  const stats = data?.statistics;

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(
      locale === "ar" ? "ar-JO" : "en-US"
    ).format(value);

  const completionRate =
    stats && stats.totalEnrollments > 0
      ? Math.min(
          100,
          (stats.completedEnrollments / stats.totalEnrollments) * 100
        )
      : 0;

  const publishedRate =
    stats && stats.totalCourses > 0
      ? Math.min(
          100,
          (stats.publishedCourses / stats.totalCourses) * 100
        )
      : 0;

  const cards = stats
    ? [
        {
          label: t.courses,
          value: stats.totalCourses,
          detail: `${formatNumber(stats.publishedCourses)} ${t.published}`,
          number: "01",
        },
        {
          label: t.students,
          value: stats.uniqueStudents,
          detail: `${formatNumber(stats.totalEnrollments)} ${t.enrollments}`,
          number: "02",
        },
        {
          label: t.completions,
          value: stats.completedEnrollments,
          detail: `${Math.round(completionRate)}%`,
          number: "03",
        },
        {
          label: t.reviews,
          value: stats.totalReviews,
          detail:
            stats.averageRating !== null
              ? `${stats.averageRating.toFixed(1)} / 5`
              : t.noRating,
          number: "04",
        },
      ]
    : [];

  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>{t.eyebrow}</span>
          <h2>{t.title}</h2>
          <p>{t.description}</p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          disabled={loading}
          onClick={refreshDashboard}
        >
          <span aria-hidden="true">↻</span>
          {loading ? t.refreshing : t.refresh}
        </button>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          <span>{t.unavailable}</span>
          <button
            type="button"
            onClick={refreshDashboard}
          >
            {t.retry}
          </button>
        </div>
      )}

      {!data && loading && !error && (
        <div className={styles.loading} role="status">
          {t.refreshing}
        </div>
      )}

      {stats && (
        <>
          <section className={styles.metrics} aria-label={t.title}>
            {cards.map((card) => (
              <div className={styles.metric} key={card.number}>
                <div className={styles.metricTop}>
                  <span>{card.label}</span>
                  <small>{card.number}</small>
                </div>
                <strong>{formatNumber(card.value)}</strong>
                <div className={styles.metricBottom}>
                  {card.detail}
                </div>
              </div>
            ))}
          </section>

          <section className={styles.performance}>
            <div className={styles.sectionHeading}>
              <span className={styles.eyebrow}>01 / INSIGHTS</span>
              <h3>{t.activityTitle}</h3>
              <p>{t.activityDescription}</p>
            </div>

            <div className={styles.performanceRows}>
              <div className={styles.performanceRow}>
                <div className={styles.rowHeading}>
                  <span>{t.publishedShare}</span>
                  <strong>{Math.round(publishedRate)}%</strong>
                </div>
                <div className={styles.track}>
                  <span
                    style={{ width: `${publishedRate}%` }}
                  />
                </div>
                <small>
                  {formatNumber(stats.publishedCourses)} /{" "}
                  {formatNumber(stats.totalCourses)}
                </small>
              </div>

              <div className={styles.performanceRow}>
                <div className={styles.rowHeading}>
                  <span>{t.courseCompletion}</span>
                  <strong>{Math.round(completionRate)}%</strong>
                </div>
                <div className={styles.track}>
                  <span
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <small>
                  {formatNumber(stats.completedEnrollments)} /{" "}
                  {formatNumber(stats.totalEnrollments)}
                </small>
              </div>
            </div>

            <div className={styles.summary}>
              <div>
                <span>{t.drafts}</span>
                <strong>{formatNumber(stats.draftCourses)}</strong>
              </div>
              <div>
                <span>{t.enrollments}</span>
                <strong>{formatNumber(stats.totalEnrollments)}</strong>
              </div>
              <div>
                <span>{t.rating}</span>
                <strong>
                  {stats.averageRating === null
                    ? "—"
                    : stats.averageRating.toFixed(1)}
                </strong>
              </div>
            </div>
          </section>

          {updatedAt && (
            <p className={styles.updated}>
              {t.updated}:{" "}
              {new Intl.DateTimeFormat(
                locale === "ar" ? "ar-JO" : "en-US",
                {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              ).format(updatedAt)}
            </p>
          )}
        </>
      )}
    </main>
  );
}
