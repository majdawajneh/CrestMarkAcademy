
import styles from "./CourseReviews.module.css";
import ReviewActions from "./ReviewActions";

type Locale = "en" | "ar";

type Review = {
  id: number;
  userId: number;
  userName: string;
  courseId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string | null;
};

type Props = {
  courseId: number;
  locale: Locale;
};

const copy = {
  en: {
    title: "Student reviews",
    description: "See what learners think about this course.",
    reviews: "reviews",
    review: "review",
    noReviews: "No reviews yet",
    noReviewsText:
      "Be the first to share your experience with this course.",
    unavailable: "Reviews are temporarily unavailable.",
    edited: "Edited",
    outOf: "out of 5",
  },
  ar: {
    title: "تقييمات الطلاب",
    description: "تعرّف على آراء الطلاب وتجاربهم مع هذه الدورة.",
    reviews: "تقييمات",
    review: "تقييم",
    noReviews: "لا توجد تقييمات بعد",
    noReviewsText:
      "كن أول من يشارك تجربته مع هذه الدورة.",
    unavailable: "التقييمات غير متاحة مؤقتًا.",
    edited: "تم التعديل",
    outOf: "من 5",
  },
} as const;

function Stars({
  rating,
  locale,
}: {
  rating: number;
  locale: Locale;
}) {
  const value = Math.max(0, Math.min(5, rating));

  return (
    <span
      className={styles.stars}
      role="img"
      aria-label={`${value} ${copy[locale].outOf}`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={
            index < value ? styles.starFilled : styles.starEmpty
          }
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}

function formatDate(value: string, locale: Locale) {
  // ASP.NET may serialize UTC DateTime without a timezone suffix.
  const normalized =
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
      ? value
      : `${value}Z`;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
}

async function getReviews(courseId: number): Promise<Review[] | null> {
  const baseUrl =
    process.env.API_BASE_URL || "http://localhost:5299";

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/api/reviews/courses/${courseId}`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }
    );

    if (!response.ok) return null;

    const data: unknown = await response.json();

    if (!Array.isArray(data)) return null;

    return data.filter(
      (item): item is Review =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "number" &&
        item.courseId === courseId &&
        typeof item.userId === "number" &&
        typeof item.userName === "string" &&
        typeof item.rating === "number" &&
        Number.isInteger(item.rating) &&
        item.rating >= 1 &&
        item.rating <= 5 &&
        (item.comment === null ||
          typeof item.comment === "string") &&
        typeof item.createdAt === "string"
    );
  } catch {
    return null;
  }
}

export default async function CourseReviews({
  courseId,
  locale,
}: Props) {
  const t = copy[locale];
  const reviews = await getReviews(courseId);

  if (reviews === null) {
    return (
      <section className={styles.section}>
        <div className={styles.heading}>
          <span className={styles.headingLine} />
          <h2>{t.title}</h2>
        </div>
        <p className={styles.message} role="status">
          {t.unavailable}
        </p>
      </section>
    );
  }

  const total = reviews.length;

  const average = total
    ? reviews.reduce((sum, review) => sum + review.rating, 0) /
      total
    : 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter(
      (review) => review.rating === star
    ).length;

    return {
      star,
      count,
      percent: total ? (count / total) * 100 : 0,
    };
  });

  return (
    <section
      className={styles.section}
      aria-labelledby="course-reviews"
    >
      <div className={styles.heading}>
        <span className={styles.headingLine} />
        <h2 id="course-reviews">{t.title}</h2>
        <p>{t.description}</p>
      </div>

    <ReviewActions
        courseId={courseId}
        locale={locale}
        reviews={reviews.map((review) => ({
            id: review.id,
            userId: review.userId,
            rating: review.rating,
            comment: review.comment,
        }))}
    />
      {total === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">
            ☆
          </span>
          <h3>{t.noReviews}</h3>
          <p>{t.noReviewsText}</p>
        </div>
      ) : (
        <>
          <div className={styles.summary}>
            <div className={styles.average}>
              <strong>{average.toFixed(1)}</strong>
              <Stars
                rating={Math.round(average)}
                locale={locale}
              />
              <span>
                {total} {total === 1 ? t.review : t.reviews}
              </span>
            </div>

            <div className={styles.distribution}>
              {distribution.map((item) => (
                <div className={styles.barRow} key={item.star}>
                  <span className={styles.barLabel}>
                    {item.star} ★
                  </span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <span className={styles.barCount}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.reviewList}>
            {reviews.map((review) => (
              <article className={styles.review} key={review.id}>
                <div className={styles.reviewTop}>
                  <div className={styles.person}>
                    <div
                      className={styles.avatar}
                      aria-hidden="true"
                    >
                      {review.userName.trim().charAt(0).toUpperCase() ||
                        "S"}
                    </div>

                    <div className={styles.personInfo}>
                      <h3>{review.userName || "Student"}</h3>
                      <span>
                        {formatDate(review.createdAt, locale)}
                      </span>
                    </div>
                  </div>

                  <Stars rating={review.rating} locale={locale} />
                </div>

                {review.comment && (
                  <p className={styles.comment}>
                    {review.comment}
                  </p>
                )}

                {review.updatedAt && (
                  <span className={styles.edited}>
                    {t.edited}
                  </span>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
