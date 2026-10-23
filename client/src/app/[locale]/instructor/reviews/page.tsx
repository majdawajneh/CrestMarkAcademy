
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { authenticatedFetch } from "@/lib/auth-session";
import styles from "./page.module.css";

type Review = {
  id: number;
  courseId: number;
  courseTitle: string;
  studentName: string;
  rating: number;
  comment: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type Filter = "all" | "5" | "4" | "3" | "2" | "1";

const dictionary = {
  en: {
    eyebrow: "STUDENT FEEDBACK",
    title: "Course reviews",
    description: "See what your students think about your courses.",
    refresh: "Refresh",
    refreshing: "Updating...",
    reviews: "Total reviews",
    average: "Average rating",
    ratedCourses: "Reviewed courses",
    distribution: "Rating distribution",
    feedback: "Student feedback",
    search: "Search reviews...",
    all: "All ratings",
    stars: "stars",
    noReviews: "No reviews yet",
    noReviewsDescription:
      "When students review your courses, their feedback will appear here.",
    noResults: "No matching reviews",
    noResultsDescription: "Try changing the search or rating filter.",
    error: "Unable to load reviews.",
    retry: "Try again",
    course: "Course",
    student: "Student",
    updated: "Updated",
    lastUpdated: "Last updated",
    viewCourse: "View course",
    rating: "Rating",
    emptyComment: "The student left a rating without a written comment.",
  },
  ar: {
    eyebrow: "آراء الطلاب",
    title: "تقييمات الدورات",
    description: "تعرّف على آراء الطلاب وتقييماتهم لدوراتك التعليمية.",
    refresh: "تحديث",
    refreshing: "جارٍ التحديث...",
    reviews: "إجمالي التقييمات",
    average: "متوسط التقييم",
    ratedCourses: "الدورات المُقيّمة",
    distribution: "توزيع التقييمات",
    feedback: "آراء الطلاب",
    search: "ابحث في التقييمات...",
    all: "كل التقييمات",
    stars: "نجوم",
    noReviews: "لا توجد تقييمات بعد",
    noReviewsDescription:
      "عندما يقيّم الطلاب دوراتك، ستظهر آراؤهم هنا.",
    noResults: "لا توجد تقييمات مطابقة",
    noResultsDescription: "جرّب تغيير البحث أو فلتر النجوم.",
    error: "تعذّر تحميل التقييمات.",
    retry: "إعادة المحاولة",
    course: "الدورة",
    student: "الطالب",
    updated: "تم التعديل",
    lastUpdated: "آخر تحديث",
    viewCourse: "عرض الدورة",
    rating: "التقييم",
    emptyComment: "أضاف الطالب تقييمًا دون كتابة تعليق.",
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validReview(value: unknown): value is Review {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "number" &&
    Number.isSafeInteger(value.id) &&
    value.id > 0 &&
    typeof value.courseId === "number" &&
    Number.isSafeInteger(value.courseId) &&
    value.courseId > 0 &&
    typeof value.courseTitle === "string" &&
    typeof value.studentName === "string" &&
    typeof value.rating === "number" &&
    Number.isSafeInteger(value.rating) &&
    value.rating >= 1 &&
    value.rating <= 5 &&
    (value.comment === null || typeof value.comment === "string") &&
    (value.createdAt === null || validDate(value.createdAt)) &&
    (value.updatedAt === null || validDate(value.updatedAt))
  );
}

function Stars({
  rating,
}: {
  rating: number;
}) {
  return (
    <span
      className={styles.stars}
      aria-label={`${rating} / 5`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={index < rating ? styles.starActive : styles.starInactive}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function InstructorReviewsPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale === "ar" ? "ar" : "en";
  const t = dictionary[locale];

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  function refreshReviews() {
    setLoading(true);
    setError(false);
    setRefreshIndex((value) => value + 1);
  }

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await authenticatedFetch("/api/instructor/reviews", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result: unknown = await response.json();

        if (!Array.isArray(result) || !result.every(validReview)) {
          throw new Error("Invalid reviews response");
        }

        if (!controller.signal.aborted) {
          setReviews(result);
          setLoaded(true);
          setUpdatedAt(new Date());
        }
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();

    return () => controller.abort();
  }, [refreshIndex]);

  const number = (value: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-JO" : "en-US").format(value);

  const date = (value: string | null) => {
    if (!value) return "—";
    return new Intl.DateTimeFormat(
      locale === "ar" ? "ar-JO" : "en-US",
      { year: "numeric", month: "short", day: "numeric" }
    ).format(new Date(value));
  };

  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) /
      reviews.length
    : null;

  const ratedCourses = new Set(reviews.map((review) => review.courseId)).size;

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.rating === stars).length,
  }));

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return reviews
      .filter((review) => {
        const matchesSearch =
          review.studentName.toLowerCase().includes(term) ||
          review.courseTitle.toLowerCase().includes(term) ||
          (review.comment ?? "").toLowerCase().includes(term);

        const matchesRating =
          filter === "all" || review.rating === Number(filter);

        return matchesSearch && matchesRating;
      })
      .sort((a, b) =>
        (b.updatedAt ?? b.createdAt ?? "").localeCompare(
          a.updatedAt ?? a.createdAt ?? ""
        )
      );
  }, [reviews, search, filter]);

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
          onClick={refreshReviews}
        >
          <span aria-hidden="true">↻</span>
          {loading ? t.refreshing : t.refresh}
        </button>
      </header>

      {error && (
        <div className={styles.error} role="alert">
          <span>{t.error}</span>
          <button type="button" onClick={refreshReviews}>
            {t.retry}
          </button>
        </div>
      )}

      {!loaded && loading && !error && (
        <div className={styles.loading} role="status">
          {t.refreshing}
        </div>
      )}

      {loaded && (
        <>
          <section className={styles.analytics}>
            <div className={styles.summary}>
              <div className={styles.summaryMetric}>
                <span>{t.reviews}</span>
                <strong>{number(reviews.length)}</strong>
              </div>
              <div className={styles.summaryMetric}>
                <span>{t.average}</span>
                <strong>{average === null ? "—" : average.toFixed(1)}</strong>
                <small>{average === null ? "—" : "★ / 5"}</small>
              </div>
              <div className={styles.summaryMetric}>
                <span>{t.ratedCourses}</span>
                <strong>{number(ratedCourses)}</strong>
              </div>
            </div>

            <div className={styles.distribution}>
              <div className={styles.sectionHeader}>
                <span className={styles.eyebrow}>01 / RATINGS</span>
                <h3>{t.distribution}</h3>
              </div>

              {distribution.map((item) => {
                const percentage = reviews.length
                  ? (item.count / reviews.length) * 100
                  : 0;

                return (
                  <div className={styles.ratingRow} key={item.stars}>
                    <span className={styles.ratingLabel}>
                      {item.stars} <span aria-hidden="true">★</span>
                    </span>
                    <div
                      className={styles.track}
                      role="progressbar"
                      aria-label={`${item.stars} ${t.stars}`}
                      aria-valuenow={item.count}
                      aria-valuemin={0}
                      aria-valuemax={reviews.length}
                    >
                      <span style={{ width: `${percentage}%` }} />
                    </div>
                    <strong>{number(item.count)}</strong>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.feedbackSection}>
            <div className={styles.feedbackHeader}>
              <div>
                <span className={styles.eyebrow}>02 / FEEDBACK</span>
                <h3>{t.feedback}</h3>
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
                  value={search}
                  placeholder={t.search}
                  aria-label={t.search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            {reviews.length > 0 && (
              <div className={styles.filters}>
                {(["all", "5", "4", "3", "2", "1"] as Filter[]).map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={filter === value}
                      className={`${styles.filterButton} ${
                        filter === value ? styles.filterActive : ""
                      }`}
                      onClick={() => setFilter(value)}
                    >
                      {value === "all" ? t.all : `${value} ★`}
                    </button>
                  )
                )}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon} aria-hidden="true">☆</div>
                <h4>{reviews.length === 0 ? t.noReviews : t.noResults}</h4>
                <p>
                  {reviews.length === 0
                    ? t.noReviewsDescription
                    : t.noResultsDescription}
                </p>
              </div>
            ) : (
              <div className={styles.reviewList}>
                {filtered.map((review) => (
                  <article className={styles.reviewCard} key={review.id}>
                    <div className={styles.reviewTop}>
                      <div className={styles.studentInfo}>
                        <span className={styles.avatar}>
                          {review.studentName.trim().charAt(0).toUpperCase() || "S"}
                        </span>

                        <div>
                          <strong>{review.studentName}</strong>
                          <small>{date(review.createdAt)}</small>
                        </div>
                      </div>

                      <Stars rating={review.rating} />
                    </div>

                    <div className={styles.courseTitle}>
                      <span>{t.course}:</span>
                      <strong>{review.courseTitle}</strong>
                    </div>

                    <p className={styles.comment}>
                      {review.comment?.trim() || t.emptyComment}
                    </p>

                    {review.updatedAt &&
                      review.updatedAt !== review.createdAt && (
                        <small className={styles.updatedReview}>
                          {t.updated}: {date(review.updatedAt)}
                        </small>
                      )}
                  </article>
                ))}
              </div>
            )}
          </section>

          {updatedAt && (
            <p className={styles.updated}>
              {t.lastUpdated}:{" "}
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
