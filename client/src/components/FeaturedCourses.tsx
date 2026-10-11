
import Image from "next/image";
import Link from "next/link";
import styles from "./FeaturedCourses.module.css";

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

type Props = {
  locale: Locale;
};

const translations = {
  en: {
    eyebrow: "HANDPICKED LEARNING",
    title: "Courses worth exploring.",
    description:
      "Discover featured courses across different fields and find something new to learn.",
    viewAll: "Browse all courses",
    viewCourse: "View course",
    fallback: "CRESTMARK LEARNING",
    emptyTitle: "New courses are on the way.",
    emptyDescription:
      "We're preparing learning opportunities for you. Explore our catalog for more.",
    errorTitle: "Courses are temporarily unavailable.",
    errorDescription:
      "Please try again shortly.",
  },
  ar: {
    eyebrow: "دورات مختارة",
    title: "اكتشف دورتك القادمة.",
    description:
      "استكشف دورات مميزة في مجالات متنوعة، واكتشف فرصًا جديدة للتعلم وتطوير مهاراتك.",
    viewAll: "تصفح جميع الدورات",
    viewCourse: "عرض الدورة",
    fallback: "CRESTMARK LEARNING",
    emptyTitle: "دورات جديدة قريبًا.",
    emptyDescription:
      "نعمل على تجهيز المزيد من الفرص التعليمية. يمكنك استكشاف قائمة الدورات.",
    errorTitle: "تعذّر تحميل الدورات حاليًا.",
    errorDescription:
      "يرجى المحاولة مرة أخرى بعد قليل.",
  },
} as const;

function getValidImageUrl(value: string | null) {
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

async function getFeaturedCourses(): Promise<{
  courses: Course[];
  failed: boolean;
}> {
  const apiUrl =
    process.env.API_BASE_URL || "http://localhost:5299";

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/$/, "")}/api/courses`,
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

    const courses = (data as Course[])
      .filter(
        (course) =>
          course &&
          course.isFeatured === true &&
          typeof course.id === "number" &&
          typeof course.title === "string" &&
          typeof course.slug === "string"
      )
      .slice(0, 6);

    return { courses, failed: false };
  } catch {
    return { courses: [], failed: true };
  }
}

export default async function FeaturedCourses({
  locale,
}: Props) {
  const t = translations[locale];
  const { courses, failed } = await getFeaturedCourses();

  return (
    <section
      className={styles.section}
      aria-labelledby="featured-courses-heading"
    >
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.headingContent}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowLine} />
              {t.eyebrow}
            </div>

            <h2
              id="featured-courses-heading"
              className={styles.title}
            >
              {t.title}
            </h2>

            <p className={styles.description}>
              {t.description}
            </p>
          </div>

          <Link
            href={`/${locale}/courses`}
            className={styles.viewAll}
          >
            <span>{t.viewAll}</span>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </Link>
        </div>

        {failed ? (
          <div className={styles.message}>
            <h3>{t.errorTitle}</h3>
            <p>{t.errorDescription}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className={styles.message}>
            <h3>{t.emptyTitle}</h3>
            <p>{t.emptyDescription}</p>
          </div>
        ) : (
          <div className={styles.courseGrid}>
            {courses.map((course) => {
              const imageUrl = getValidImageUrl(
                course.thumbnailUrl
              );

              return (
                <article
                  key={course.id}
                  className={styles.courseCard}
                >
                  <Link
                    href={`/${locale}/courses/${encodeURIComponent(
                      course.slug
                    )}`}
                    className={styles.courseImageLink}
                    aria-label={`${t.viewCourse}: ${course.title}`}
                  >
                    <div className={styles.courseImage}>
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={course.title}
                          width={600}
                          height={360}
                          unoptimized
                          className={styles.image}
                        />
                      ) : (
                        <div
                          className={styles.imageFallback}
                          aria-hidden="true"
                        >
                          <div className={styles.fallbackSymbol}>
                            <span />
                            <span />
                            <span />
                          </div>
                          <span>{t.fallback}</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className={styles.courseContent}>
                    {course.categoryName && (
                      <span className={styles.category}>
                        {course.categoryName}
                      </span>
                    )}

                    <h3 className={styles.courseTitle}>
                      <Link
                        href={`/${locale}/courses/${encodeURIComponent(
                          course.slug
                        )}`}
                      >
                        {course.title}
                      </Link>
                    </h3>

                    {course.shortDescription && (
                      <p className={styles.courseDescription}>
                        {course.shortDescription}
                      </p>
                    )}

                    {(course.level || course.language) && (
                      <div className={styles.courseMeta}>
                        {course.level && (
                          <span>{course.level}</span>
                        )}

                        {course.level && course.language && (
                          <span
                            className={styles.metaSeparator}
                            aria-hidden="true"
                          />
                        )}

                        {course.language && (
                          <span>{course.language}</span>
                        )}
                      </div>
                    )}

                    <Link
                      href={`/${locale}/courses/${encodeURIComponent(
                        course.slug
                      )}`}
                      className={styles.courseAction}
                    >
                      <span>{t.viewCourse}</span>
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
  );
}
