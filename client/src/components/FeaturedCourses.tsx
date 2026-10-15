
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
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

const copy = {
  en: {
    eyebrow: "DISCOVER CRESTMARK COURSES",
    title: "Find something worth learning.",
    description:
      "Explore selected courses from our catalog. Discover new ideas, develop practical knowledge, and take your next step.",
    browse: "View all courses",
    viewCourse: "Explore course",
    courseLabel: "CRESTMARK / COURSE",
    onlineCourse: "Online course",
    instructor: "Instructor",
    illustrative: "Illustrative photo",
    emptyTitle: "More learning opportunities are coming.",
    emptyText:
      "Explore the full course catalog to discover what's available.",
    errorTitle: "Courses are temporarily unavailable.",
    errorText:
      "We couldn't load the course selection right now. Please try again later.",
  },
  ar: {
    eyebrow: "اكتشف دورات CRESTMARK",
    title: "اكتشف مهارة تستحق التعلّم.",
    description:
      "استكشف دورات مختارة من الأكاديمية، واكتسب معرفة جديدة، وطوّر مهاراتك، وابدأ خطوتك التعليمية القادمة.",
    browse: "عرض جميع الدورات",
    viewCourse: "استكشف الدورة",
    courseLabel: "CRESTMARK / COURSE",
    onlineCourse: "دورة إلكترونية",
    instructor: "المدرّس",
    illustrative: "صورة توضيحية",
    emptyTitle: "المزيد من الدورات في الطريق.",
    emptyText:
      "استكشف قائمة الدورات الكاملة لمعرفة المحتوى المتاح حاليًا.",
    errorTitle: "الدورات غير متاحة مؤقتًا.",
    errorText:
      "تعذّر تحميل الدورات المختارة حاليًا. حاول مرة أخرى لاحقًا.",
  },
} as const;

// Temporary editorial images for courses without a valid thumbnail.
// Replace these with actual course thumbnails in the Admin dashboard.
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85",
];

function getValidImageUrl(value: string | null): string | null {
  if (!value || !value.trim()) return null;

  if (value.trim().toLowerCase() === "null") return null;

  try {
    const url = new URL(value);

    if (
      url.hostname === "example.com" ||
      url.hostname.endsWith(".example.com")
    ) {
      return null;
    }

    if (url.protocol === "https:") {
      return url.href;
    }

    if (
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    ) {
      return url.href;
    }

    return null;
  } catch {
    return null;
  }
}

function getCourseImage(course: Course, index: number) {
  const provided = getValidImageUrl(course.thumbnailUrl);

  if (provided) {
    return {
      src: provided,
      illustrative: false,
    };
  }

  // Deterministic choice: the same course keeps its fallback image.
  const imageIndex =
    (Math.abs(course.id) + index * 2) % FALLBACK_PHOTOS.length;

  return {
    src: FALLBACK_PHOTOS[imageIndex],
    illustrative: true,
  };
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

async function getFeaturedCourses(): Promise<{
  courses: Course[];
  failed: boolean;
}> {
  // Required in this project to resolve dynamic content correctly
  // with the enabled Next.js cacheComponents configuration.
  await connection();

  const apiUrl = (
    process.env.API_BASE_URL || "http://localhost:5299"
  ).replace(/\/+$/, "");

  try {
    const response = await fetch(`${apiUrl}/api/courses`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      return { courses: [], failed: true };
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return { courses: [], failed: true };
    }

    const courses = data
      .filter(
        (item): item is Course =>
          item !== null &&
          typeof item === "object" &&
          item.isFeatured === true &&
          Number.isSafeInteger(item.id) &&
          item.id > 0 &&
          typeof item.title === "string" &&
          item.title.trim().length > 0 &&
          typeof item.slug === "string" &&
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(item.slug)
      )
      .slice(0, 3);

    return { courses, failed: false };
  } catch {
    return { courses: [], failed: true };
  }
}

export default async function FeaturedCourses({
  locale,
}: Props) {
  const t = copy[locale];
  const { courses, failed } = await getFeaturedCourses();

  return (
    <section
      className={styles.section}
      aria-labelledby="featured-courses-heading"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.headerContent}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowLine} />
              {t.eyebrow}
            </span>

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
            {t.browse}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        {failed ? (
          <div className={styles.message} role="status">
            <h3>{t.errorTitle}</h3>
            <p>{t.errorText}</p>
            <Link href={`/${locale}/courses`}>
              {t.browse} ↗
            </Link>
          </div>
        ) : courses.length === 0 ? (
          <div className={styles.message}>
            <h3>{t.emptyTitle}</h3>
            <p>{t.emptyText}</p>
            <Link href={`/${locale}/courses`}>
              {t.browse} ↗
            </Link>
          </div>
        ) : (
          <div className={styles.courseGrid}>
            {courses.map((course, index) => {
              const image = getCourseImage(course, index);
              const featured = index === 0;

              const href = `/${locale}/courses/${encodeURIComponent(
                course.slug
              )}`;

              const category =
                optionalText(course.categoryName) ??
                t.onlineCourse;

              const description = optionalText(
                course.shortDescription
              );

              const instructor = optionalText(
                course.instructorName
              );

              const level = optionalText(course.level);
              const language = optionalText(course.language);

              return (
                <article
                  key={course.id}
                  className={`${styles.courseCard} ${
                    featured
                      ? styles.spotlightCard
                      : styles.compactCard
                  }`}
                >
                  <Link
                    href={href}
                    className={styles.cardLink}
                    aria-label={`${t.viewCourse}: ${course.title}`}
                  >
                    <div className={styles.courseMedia}>
                      <Image
                        src={image.src}
                        alt={
                          image.illustrative
                            ? locale === "ar"
                              ? `صورة تعليمية توضيحية لدورة ${course.title}`
                              : `Illustrative learning photograph for ${course.title}`
                            : course.title
                        }
                        fill
                        unoptimized
                        loading={featured ? "eager" : "lazy"}
                        sizes={
                          featured
                            ? "(max-width: 760px) 100vw, (max-width: 1050px) 60vw, 55vw"
                            : "(max-width: 760px) 100vw, (max-width: 1050px) 40vw, 25vw"
                        }
                        className={styles.coursePhoto}
                      />

                      <div
                        className={styles.photoShade}
                        aria-hidden="true"
                      />

                      <span className={styles.photoIndex}>
                        CM / {String(index + 1).padStart(2, "0")}
                      </span>

                      {image.illustrative && (
                        <span className={styles.photoNote}>
                          {t.illustrative}
                        </span>
                      )}
                    </div>

                    <div className={styles.courseBody}>
                      <div className={styles.courseCategory}>
                        <span className={styles.categoryLine} />
                        {category}
                      </div>

                      <h3 className={styles.courseTitle}>
                        {course.title}
                      </h3>

                      {description && (
                        <p className={styles.courseDescription}>
                          {description}
                        </p>
                      )}

                      {(level || language) && (
                        <div className={styles.courseMeta}>
                          {level && <span>{level}</span>}
                          {level && language && (
                            <span
                              className={styles.metaDot}
                              aria-hidden="true"
                            />
                          )}
                          {language && <span>{language}</span>}
                        </div>
                      )}

                      <div className={styles.cardFooter}>
                        <div className={styles.cardFooterInfo}>
                          {instructor ? (
                            <>
                              <span>{t.instructor}</span>
                              <strong>{instructor}</strong>
                            </>
                          ) : (
                            <span>{t.courseLabel}</span>
                          )}
                        </div>

                        <span className={styles.courseAction}>
                          {t.viewCourse}
                          <span
                            className={styles.actionArrow}
                            aria-hidden="true"
                          >
                            ↗
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        <div className={styles.bottomLine}>
          <span>CRESTMARK ACADEMY</span>
          <span>LEARN · BUILD · ADVANCE</span>
        </div>
      </div>
    </section>
  );
}
