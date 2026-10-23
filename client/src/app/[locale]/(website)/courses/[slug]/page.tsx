import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import CoursePreview from "@/components/CoursePreview";
import CourseCurriculum from "@/components/CourseCurriculum";
import CourseReviews from "@/components/CourseReviews";
import EnrollmentCard from "@/components/EnrollmentCard";
import {
  SaveCourseButton,
  WishlistProvider,
} from "../WishlistControls";
import styles from "./page.module.css";
type Locale = "en" | "ar";
type Requirement = {
  id: number;
  courseId: number;
  requirement: string;
  orderIndex: number;
};
type LearningOutcome = {
  id: number;
  courseId: number;
  outcome: string;
  orderIndex: number;
};
type Course = {
  id: number;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  categoryName: string | null;
  instructorName: string | null;
  thumbnailUrl: string | null;
  previewVideoUrl: string | null;
  price: number;
  discountPrice: number | null;
  language: string | null;
  level: string | null;
  status: string;
  isFeatured: boolean;
  hasCertificate: boolean;
  estimatedDurationHours: number | null;
  requirements: Requirement[];
  learningOutcomes: LearningOutcome[];
};
type Props = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};
type CourseResult = {
  course: Course | null;
  missing: boolean;
};
const translations = {
  en: {
    courses: "Courses",
    overview: "COURSE OVERVIEW",
    about: "About this course",
    outcomes: "What you'll learn",
    outcomesDescription:
      "The knowledge and skills you'll work toward in this course.",
    requirements: "Course requirements",
    requirementsDescription:
      "What you should know before getting started.",
    information: "Course information",
    category: "Category",
    level: "Level",
    language: "Language",
    instructor: "Instructor",
    duration: "Estimated duration",
    hours: "hours",
    certificate: "Certificate",
    certificateYes: "Available upon completion",
    certificateNo: "Not included",
    notSpecified: "Not specified",
    featured: "Featured course",
    preview: "Course preview",
    discover: "Keep exploring",
    discoverText:
      "Discover more learning opportunities across different fields.",
    viewAll: "Browse all courses",
    error: "Course temporarily unavailable",
    errorText:
      "We couldn't load this course. Please try again shortly.",
    loading: "Loading course details...",
  },
  ar: {
    courses: "الدورات",
    overview: "نظرة عامة على الدورة",
    about: "عن هذه الدورة",
    outcomes: "ماذا ستتعلم؟",
    outcomesDescription:
      "المعارف والمهارات التي ستعمل على اكتسابها خلال الدورة.",
    requirements: "متطلبات الدورة",
    requirementsDescription:
      "المعارف أو المهارات المطلوبة قبل البدء بالدورة.",
    information: "معلومات الدورة",
    category: "التصنيف",
    level: "المستوى",
    language: "لغة الدورة",
    instructor: "المدرب",
    duration: "المدة التقديرية",
    hours: "ساعة",
    certificate: "الشهادة",
    certificateYes: "متاحة عند استيفاء شروط الإكمال",
    certificateNo: "غير متوفرة",
    notSpecified: "غير محدد",
    featured: "دورة مميزة",
    preview: "معاينة الدورة",
    discover: "واصل الاستكشاف",
    discoverText:
      "اكتشف المزيد من الفرص التعليمية في مجالات متنوعة.",
    viewAll: "تصفح جميع الدورات",
    error: "الدورة غير متاحة مؤقتًا",
    errorText:
      "تعذّر تحميل بيانات الدورة. يرجى المحاولة لاحقًا.",
    loading: "جارٍ تحميل تفاصيل الدورة...",
  },
} as const;
function getLocale(value: string): Locale {
  if (value !== "en" && value !== "ar") {
    notFound();
  }
  return value;
}
function validMediaUrl(
  value: string | null
): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      hostname === "example.com" ||
      hostname.endsWith(".example.com")
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}
// Public course information only.
// Never cache private lesson or enrollment data here.
async function getCourse(
  slug: string
): Promise<CourseResult> {
  "use cache";
  cacheLife({
    stale: 60,
    revalidate: 300,
    expire: 3600,
  });
  if (!/^[a-zA-Z0-9-]{1,200}$/.test(slug)) {
    return {
      course: null,
      missing: true,
    };
  }
  const baseUrl =
    process.env.API_BASE_URL ||
    "http://localhost:5299";
  try {
    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/api/courses/${encodeURIComponent(slug)}`,
      {
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(12000),
      }
    );
    if (response.status === 404) {
      return {
        course: null,
        missing: true,
      };
    }
    if (!response.ok) {
      return {
        course: null,
        missing: false,
      };
    }
    const data: unknown = await response.json();
    if (
      !data ||
      typeof data !== "object" ||
      !("slug" in data) ||
      !("title" in data) ||
      typeof data.slug !== "string" ||
      typeof data.title !== "string" ||
      data.slug !== slug
    ) {
      return {
        course: null,
        missing: false,
      };
    }
    const course = data as Course;
    return {
      course: {
        ...course,
        requirements: Array.isArray(course.requirements)
          ? course.requirements
          : [],
        learningOutcomes: Array.isArray(
          course.learningOutcomes
        )
          ? course.learningOutcomes
          : [],
      },
      missing: false,
    };
  } catch {
    return {
      course: null,
      missing: false,
    };
  }
}
// SEO metadata for the public course page.
export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = getLocale(rawLocale);
  const isArabic = locale === "ar";
  const siteValue = process.env.NEXT_PUBLIC_SITE_URL;
  let origin: string | null = null;
  try {
    if (siteValue) {
      const url = new URL(siteValue);
      if (
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        url.hostname !== "localhost" &&
        !url.hostname.endsWith(".example.com")
      ) {
        origin = url.origin;
      }
    }
  } catch {
    // Production URL is not configured.
  }
  const { course } = await getCourse(slug);
  // Never index missing or unavailable courses.
  if (!course) {
    return {
      title: isArabic
        ? "الدورة غير متاحة"
        : "Course Unavailable",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
  const title = course.title.trim();
  const rawDescription =
    course.shortDescription?.trim() ||
    course.description?.trim() ||
    "";
  // Convert rich-text descriptions into plain text.
  const cleanDescription = rawDescription
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
  const fallbackDescription = isArabic
    ? `اكتشف دورة ${title} على CrestMark، وتعرّف على محتواها ومتطلباتها والمهارات التي يمكنك تعلمها.`
    : `Explore the ${title} course on CrestMark. Discover its lessons, requirements and learning outcomes.`;
  const description =
    (cleanDescription || fallbackDescription).slice(0, 160);
  const coursePath =
    `/courses/${encodeURIComponent(slug)}`;
  const pagePath = `/${locale}${coursePath}`;
  const canonicalUrl = origin
    ? `${origin}${pagePath}`
    : undefined;
  const imageValue =
    typeof course.thumbnailUrl === "string"
      ? course.thumbnailUrl
      : "";
  let imageUrl: string | undefined;
  try {
    if (imageValue) {
      const parsed = new URL(imageValue);
      if (
        parsed.protocol === "https:" &&
        !parsed.username &&
        !parsed.password
      ) {
        imageUrl = parsed.toString();
      }
    }
  } catch {
    // Ignore invalid image URLs.
  }
  return {
    title,
    description,
    ...(origin
      ? {
          alternates: {
            canonical: canonicalUrl,
            languages: {
              en: `${origin}/en${coursePath}`,
              ar: `${origin}/ar${coursePath}`,
              "x-default": `${origin}/en${coursePath}`,
            },
          },
        }
      : {}),
    openGraph: {
      type: "website",
      siteName: "CrestMark",
      title: `${title} | CrestMark`,
      description,
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      locale: isArabic ? "ar_JO" : "en_US",
      ...(imageUrl
        ? {
            images: [
              {
                url: imageUrl,
                alt: title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: imageUrl
        ? "summary_large_image"
        : "summary",
      title: `${title} | CrestMark`,
      description,
      ...(imageUrl
        ? { images: [imageUrl] }
        : {}),
    },
    robots: {
      index: Boolean(origin),
      follow: Boolean(origin),
    },
  };
}
type CourseSeoData = {
  title: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  status?: string | null;
};
function CourseStructuredData({
  course,
  locale,
}: {
  course: CourseSeoData;
  locale: "en" | "ar";
}) {
  const siteValue = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteValue) return null;
  let origin: string;
  try {
    const parsed = new URL(siteValue);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.hostname === "localhost" ||
      parsed.hostname.endsWith(".example.com")
    ) {
      return null;
    }
    origin = parsed.origin;
  } catch {
    return null;
  }
  // Only published courses should receive Course markup.
  // Adjust this check to match the actual backend status.
  if (
    typeof course.status !== "string" ||
    course.status.toLowerCase() !== "published"
  ) {
    return null;
  }
  const title = course.title.trim();
  if (!title) return null;
  const rawDescription =
    course.shortDescription ||
    course.description ||
    "";
  const description = rawDescription
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (!description) return null;
  const courseUrl =
    `${origin}/${locale}/courses/` +
    encodeURIComponent(course.slug);
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${courseUrl}#course`,
    name: title,
    description,
    url: courseUrl,
    inLanguage: locale,
    provider: {
      "@type": "Organization",
      name: "CrestMark",
      url: `${origin}/${locale}`,
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "ar" ? "الرئيسية" : "Home",
        item: `${origin}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "ar" ? "الدورات" : "Courses",
        item: `${origin}/${locale}/courses`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: courseUrl,
      },
    ],
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [courseSchema, breadcrumbSchema],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd)
          .replace(/</g, "\\u003c"),
      }}
    />
  );
}
// Dynamic content is rendered inside Suspense.
async function CourseDetailsContent({
  params,
}: Props) {
  const { locale: rawLocale, slug } = await params;
  const locale = getLocale(rawLocale);
  const t = translations[locale];
  const { course, missing } = await getCourse(slug);
  if (missing) {
    notFound();
  }
  if (!course) {
    return (
      <main className={styles.errorPage}>
        <div className={styles.container}>
          <div className={styles.errorContent}>
            <h1>{t.error}</h1>
            <p>{t.errorText}</p>
            <Link
              href={`/${locale}/courses`}
              className={styles.primaryButton}
            >
              {t.viewAll}
            </Link>
          </div>
        </div>
      </main>
    );
  }
  const outcomes = course.learningOutcomes
    .filter(
      (item) =>
        item &&
        typeof item.outcome === "string" &&
        item.outcome.trim().length > 0
    )
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const requirements = course.requirements
    .filter(
      (item) =>
        item &&
        typeof item.requirement === "string" &&
        item.requirement.trim().length > 0
    )
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const imageUrl = validMediaUrl(course.thumbnailUrl);
  const videoUrl = validMediaUrl(course.previewVideoUrl);
  const information = [
    {
      label: t.category,
      value: course.categoryName,
    },
    {
      label: t.level,
      value: course.level,
    },
    {
      label: t.language,
      value: course.language,
    },
    {
      label: t.instructor,
      value: course.instructorName,
    },
    {
      label: t.duration,
      value:
        typeof course.estimatedDurationHours ===
          "number" &&
        course.estimatedDurationHours > 0
          ? `${course.estimatedDurationHours} ${t.hours}`
          : null,
    },
    {
      label: t.certificate,
      value: course.hasCertificate
        ? t.certificateYes
        : t.certificateNo,
    },
  ];
  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.container}>
          <nav
            className={styles.breadcrumbs}
            aria-label="Breadcrumb"
          >
            <Link href={`/${locale}/courses`}>
              {t.courses}
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">
              {course.title}
            </span>
          </nav>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowLine} />
                {t.overview}
              </div>
              <h1 className={styles.title}>
                {course.title}
              </h1>
              {course.shortDescription && (
                <p className={styles.subtitle}>
                  {course.shortDescription}
                </p>
              )}
              <div className={styles.heroMeta}>
                {course.categoryName && (
                  <span>{course.categoryName}</span>
                )}
                {course.level && (
                  <span>{course.level}</span>
                )}
                {course.language && (
                  <span>{course.language}</span>
                )}
              </div>
              {course.isFeatured && (
                <div className={styles.featured}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="m12 2 3.1 6.3 7 1-5.1 5 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5.1-5 7-1L12 2Z" />
                  </svg>
                  <span>{t.featured}</span>
                </div>
              )}
            </div>
            <div className={styles.heroMedia}>
  <WishlistProvider locale={locale}>
    <SaveCourseButton courseId={course.id} />
  </WishlistProvider>
  {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={course.title}
                  className={styles.heroImage}
                />
              ) : (
                <div
                  className={styles.imageFallback}
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 80 80"
                    fill="none"
                  >
                    <path d="M15 22c10-5 19-5 25 0 6-5 15-5 25 0v37c-10-5-19-5-25 0-6-5-15-5-25 0V22Z" />
                    <path d="M40 22v37" />
                  </svg>
                  <span>CRESTMARK ACADEMY</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className={styles.details}>
        <div className={styles.container}>
          <div className={styles.detailsGrid}>
            <div className={styles.mainContent}>
              {outcomes.length > 0 && (
                <section
                  className={styles.outcomes}
                  aria-labelledby="learning-outcomes"
                >
                  <div className={styles.sectionHeading}>
                    <span className={styles.sectionLine} />
                    <h2 id="learning-outcomes">
                      {t.outcomes}
                    </h2>
                    <p>{t.outcomesDescription}</p>
                  </div>
                  <ul className={styles.outcomesGrid}>
                    {outcomes.map((item) => (
                      <li
                        key={item.id}
                        className={styles.outcomeItem}
                      >
                        <span
                          className={styles.checkIcon}
                          aria-hidden="true"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path d="m5 12 4 4L19 6" />
                          </svg>
                        </span>
                        <span>{item.outcome}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section
                className={styles.about}
                aria-labelledby="course-about"
              >
                <div className={styles.sectionHeading}>
                  <span className={styles.sectionLine} />
                  <h2 id="course-about">
                    {t.about}
                  </h2>
                </div>
                <p>
                  {course.description ||
                    course.shortDescription ||
                    t.notSpecified}
                </p>
              </section>
              {videoUrl && (
                <section className={styles.preview}>
                  <div className={styles.sectionHeading}>
                    <span className={styles.sectionLine} />
                    <h2>{t.preview}</h2>
                  </div>
                  <CoursePreview
                    key={videoUrl}
                    videoUrl={videoUrl}
                    posterUrl={imageUrl}
                    locale={locale}
                  />
                </section>
              )}
              <CourseCurriculum
                locale={locale}
                slug={course.slug}
              />
              {requirements.length > 0 && (
                <section
                  className={styles.requirements}
                  aria-labelledby="course-requirements"
                >
                  <div className={styles.sectionHeading}>
                    <span className={styles.sectionLine} />
                    <h2 id="course-requirements">
                      {t.requirements}
                    </h2>
                    <p>{t.requirementsDescription}</p>
                  </div>
                  <ul className={styles.requirementsList}>
                    {requirements.map((item) => (
                      <li key={item.id}>
                        <span
                          className={styles.requirementDot}
                          aria-hidden="true"
                        />
                        <span>{item.requirement}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <CourseReviews
                courseId={course.id}
                locale={locale}
              />
              <div className={styles.discover}>
                <h2>{t.discover}</h2>
                <p>{t.discoverText}</p>
                <Link
                  href={`/${locale}/courses`}
                  className={styles.primaryButton}
                >
                  {t.viewAll}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </div>
            <div className={styles.sidebarColumn}>
              <EnrollmentCard
                locale={locale}
                courseId={course.id}
                slug={course.slug}
                price={course.price}
                discountPrice={course.discountPrice}
                hasCertificate={course.hasCertificate}
                estimatedDurationHours={course.estimatedDurationHours}
              />
              <aside className={styles.sidebar}>
                <h2>{t.information}</h2>
                <dl className={styles.infoList}>
                  {information.map((item) => (
                    <div
                      className={styles.infoItem}
                      key={item.label}
                    >
                      <dt>{item.label}</dt>
                      <dd>
                        {item.value || t.notSpecified}
                      </dd>
                    </div>
                  ))}
                </dl>
              </aside>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
// Outer page does not read request-time params.
// The inner async component resolves them
// within the Suspense boundary.
export default function CourseDetailsPage(props: Props) {
  return (
    <Suspense
      fallback={
        <main className={styles.errorPage}>
          <div className={styles.container}>
            <div
              className={styles.errorContent}
              role="status"
            >
              <p>Loading course details...</p>
            </div>
          </div>
        </main>
      }
    >
      <CourseDetailsContent {...props} />
    </Suspense>
  );
}
