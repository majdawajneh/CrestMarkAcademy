import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import styles from "./page.module.css";

type Locale = "en" | "ar";

type InstructorCourse = {
  id: number;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  price: number;
  discountPrice: number | null;
  language: string | null;
  level: string | null;
  estimatedDurationHours: number | null;
  studentsCount: number;
  reviewsCount: number;
  averageRating: number | null;
};

type InstructorReview = {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  courseTitle: string;
  studentName: string;
};

type Instructor = {
  instructorId: number;
  firstName: string;
  lastName: string;
  username: string;
  profileImageUrl: string | null;
  bio: string | null;
  country: string | null;
  professionalTitle: string | null;
  expertise: string | null;
  experience: string | null;
  linkedInUrl: string | null;
  gitHubUrl: string | null;
  websiteUrl: string | null;
  youTubeUrl: string | null;
  statistics: {
    coursesCount: number;
    studentsCount: number;
    reviewsCount: number;
    averageRating: number | null;
  };
  courses: InstructorCourse[];
  reviews: InstructorReview[];
};

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

const copy = {
  en: {
    home: "Home", instructors: "Instructors", instructor: "INSTRUCTOR",
    teaching: "Teaching at CrestMark", about: "About the instructor",
    experience: "Professional experience", expertise: "Areas of expertise",
    connect: "Connect with me", courses: "Courses by", coursesLabel: "COURSES",
    reviews: "What students say", reviewsLabel: "STUDENT FEEDBACK",
    coursesCount: "Published courses", studentsCount: "Unique learners",
    averageRating: "Average rating", reviewsCount: "Course reviews",
    emptyCourses: "No published courses yet.",
    emptyCoursesText: "New courses from this instructor will appear here once published.",
    emptyReviews: "No student reviews yet.",
    emptyReviewsText: "Student feedback will appear once courses receive reviews.",
    exploreCourse: "Explore course", viewAll: "Browse all courses",
    years: "Experience", rating: "rating", reviewsWord: "reviews",
    failed: "We couldn't load this instructor profile right now.",
    returnCourses: "Explore CrestMark courses", titleSuffix: "Instructor at CrestMark",
    descriptionFallback: "Explore this instructor's expertise, courses and student feedback at CrestMark.",
  },
  ar: {
    home: "الرئيسية", instructors: "المحاضرون", instructor: "محاضر",
    teaching: "التدريس في CrestMark", about: "نبذة عن المحاضر",
    experience: "الخبرة المهنية", expertise: "مجالات التخصص",
    connect: "تواصل مع المحاضر", courses: "دورات المحاضر",
    coursesLabel: "الدورات التعليمية", reviews: "آراء الطلاب",
    reviewsLabel: "تقييمات المتعلمين", coursesCount: "الدورات المنشورة",
    studentsCount: "المتعلمون الفريدون", averageRating: "متوسط التقييم",
    reviewsCount: "تقييمات الدورات", emptyCourses: "لا توجد دورات منشورة بعد.",
    emptyCoursesText: "ستظهر دورات هذا المحاضر هنا بعد نشرها.",
    emptyReviews: "لا توجد تقييمات بعد.",
    emptyReviewsText: "ستظهر آراء المتعلمين بمجرد تقييم دورات المحاضر.",
    exploreCourse: "استكشف الدورة", viewAll: "تصفح جميع الدورات",
    years: "الخبرة", rating: "التقييم", reviewsWord: "تقييمات",
    failed: "تعذر تحميل ملف المحاضر حاليًا.",
    returnCourses: "استكشف دورات CrestMark", titleSuffix: "محاضر في CrestMark",
    descriptionFallback: "تعرف على خبرات المحاضر ودوراته وتقييمات المتعلمين في CrestMark.",
  },
} as const;

const apiBase = (process.env.API_BASE_URL ?? "http://localhost:5299").replace(/\/+$/, "");

function parseLocale(value: string): Locale {
  if (value !== "en" && value !== "ar") notFound();
  return value;
}

function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, apiBase + "/");
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function safeSocialUrl(value: string | null): string | null {
  const url = safeHttpUrl(value);
  return url?.startsWith("https://") ? url : null;
}

async function getInstructor(id: number): Promise<{ data: Instructor | null; unavailable: boolean }> {
  try {
    const response = await fetch(`${apiBase}/api/instructors/${id}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (response.status === 404) return { data: null, unavailable: false };
    if (!response.ok) return { data: null, unavailable: true };
    const data: Instructor = await response.json();
    if (!data || data.instructorId !== id || !data.statistics ||
        !Array.isArray(data.courses) || !Array.isArray(data.reviews)) {
      return { data: null, unavailable: true };
    }
    return { data, unavailable: false };
  } catch {
    return { data: null, unavailable: true };
  }
}

const fullName = (person: Instructor) => `${person.firstName} ${person.lastName}`.trim();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, id: rawId } = await params;
  const locale = parseLocale(rawLocale);
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) return { title: copy[locale].instructors, robots: { index: false } };
  const { data } = await getInstructor(id);
  if (!data) return { title: copy[locale].instructors, robots: { index: false } };
  const title = `${fullName(data)} | ${copy[locale].titleSuffix}`;
  const description = (data.bio || copy[locale].descriptionFallback).slice(0, 160);
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/instructors/${id}`,
      languages: {
        en: `/en/instructors/${id}`,
        ar: `/ar/instructors/${id}`,
        "x-default": `/en/instructors/${id}`,
      },
    },
    openGraph: { title, description, type: "profile" },
  };
}

type SocialIconName = "linkedin" | "github" | "website" | "youtube";

function SocialIcon({ name }: { name: SocialIconName }) {
  const paths: Record<SocialIconName, React.ReactNode> = {
    linkedin: (
      <>
        <path d="M4.5 9v10.5M4.5 4.5v.1M9 19.5V9h4v1.5c.7-1 1.7-1.7 3.2-1.7 2.6 0 3.3 1.6 3.3 4v6.7M9 13.5c0-2.4 1-4.7 4-4.7" />
      </>
    ),
    github: (
      <>
        <path d="M9 19c-4.5 1.4-4.5-2-6-2.5" />
        <path d="M9 22v-3.5c-4.6.9-7-1.7-7-5.9a6 6 0 0 1 1.6-4.2 5.5 5.5 0 0 1 .2-4.1s1.8-.2 4.3 2a15 15 0 0 1 7.8 0c2.5-2.2 4.3-2 4.3-2a5.5 5.5 0 0 1 .2 4.1A6 6 0 0 1 22 12.6c0 4.2-2.4 6.8-7 5.9V22" />
      </>
    ),
    website: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3 4 6 4 9s-1 6-4 9c-3-3-4-6-4-9s1-6 4-9Z" />
      </>
    ),
    youtube: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="4" />
        <path d="m10 9 5 3-5 3Z" />
      </>
    ),
  };

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

async function InstructorProfileContent({ params }: Props) {
  await connection();
  const { locale: rawLocale, id: rawId } = await params;
  const locale = parseLocale(rawLocale);
  const t = copy[locale];
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const { data: instructor, unavailable } = await getInstructor(id);
  if (!instructor && !unavailable) notFound();
  if (!instructor) {
    return (
      <main className={styles.page} dir={locale === "ar" ? "rtl" : "ltr"}>
        <div className={styles.errorState}>
          <h1>{t.failed}</h1>
          <Link href={`/${locale}/courses`}>{t.returnCourses} →</Link>
        </div>
      </main>
    );
  }

  const name = fullName(instructor);
  const initials = `${instructor.firstName[0] ?? ""}${instructor.lastName[0] ?? ""}`.toUpperCase();
  const photo = instructor.profileImageUrl ? safeHttpUrl(instructor.profileImageUrl) : null;
  const expertise = instructor.expertise?.split(/[,،\n]/).map(s => s.trim()).filter(Boolean) ?? [];
const socials = [
  {
    label: "LinkedIn",
    href: safeSocialUrl(instructor.linkedInUrl),
    icon: "linkedin",
  },
  {
    label: "GitHub",
    href: safeSocialUrl(instructor.gitHubUrl),
    icon: "github",
  },
  {
    label: "Website",
    href: safeSocialUrl(instructor.websiteUrl),
    icon: "website",
  },
  {
    label: "YouTube",
    href: safeSocialUrl(instructor.youTubeUrl),
    icon: "youtube",
  },
].filter(
  (item): item is {
    label: string;
    href: string;
    icon: SocialIconName;
  } => Boolean(item.href)
);

  const number = new Intl.NumberFormat(locale === "ar" ? "ar-JO" : "en-US");
  const rating = instructor.statistics.averageRating;

  return (
    <main className={styles.page} dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href={`/${locale}`}>{t.home}</Link><span aria-hidden>›</span>
          <span>{t.instructors}</span><span aria-hidden>›</span>
          <strong>{name}</strong>
        </nav>

        <section className={styles.hero} aria-labelledby="instructor-name">
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>{t.instructor} <span className={styles.eyebrowLine} /></span>
            <h1 id="instructor-name">{name}</h1>
            {instructor.professionalTitle && <p className={styles.jobTitle}>{instructor.professionalTitle}</p>}
            {instructor.bio && <p className={styles.heroBio}>{instructor.bio}</p>}
            {instructor.country && <p className={styles.location}><span aria-hidden>⌖</span> {instructor.country}</p>}
            {socials.length > 0 && (
              <div className={styles.heroSocials} aria-label={t.connect}>
                {socials.map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                     aria-label={s.label} title={s.label}><SocialIcon name={s.icon} /></a>
                ))}
              </div>
            )}
          </div>
          <div className={styles.heroMedia}>
            {photo ? (
              <Image src={photo} width={750} height={700} priority unoptimized alt={name} className={styles.portrait} />
            ) : (
              <div className={styles.portraitFallback} aria-label={name} role="img">
                <span>{initials || "CM"}</span>
                <small>CRESTMARK INSTRUCTOR</small>
              </div>
            )}
            <div className={styles.heroMediaAccent} aria-hidden="true" />
          </div>
        </section>

        <section className={styles.stats} aria-label="Instructor statistics">
          {[
            { value: number.format(instructor.statistics.coursesCount), label: t.coursesCount, icon: "▤" },
            { value: number.format(instructor.statistics.studentsCount), label: t.studentsCount, icon: "♙" },
            { value: rating === null ? "—" : number.format(rating), label: t.averageRating, icon: "☆" },
            { value: number.format(instructor.statistics.reviewsCount), label: t.reviewsCount, icon: "✧" },
          ].map(stat => (
            <div className={styles.stat} key={stat.label}>
              <span className={styles.statIcon} aria-hidden="true">{stat.icon}</span>
              <div><strong>{stat.value}</strong><span>{stat.label}</span></div>
            </div>
          ))}
        </section>

        <div className={styles.detailsGrid}>
          <section className={styles.aboutPanel}>
            <span className={styles.sectionKicker}>{t.teaching}</span>
            <h2>{t.about}</h2>
            <p className={styles.aboutText}>{instructor.bio || "—"}</p>
            {instructor.experience && (
              <div className={styles.experience}>
                <h3>{t.experience}</h3>
                <p>{instructor.experience}</p>
              </div>
            )}
          </section>
          <aside className={styles.sideColumn}>
            {expertise.length > 0 && (
              <section className={styles.sidePanel}>
                <h2>{t.expertise}</h2>
                <div className={styles.expertiseTags}>{expertise.map(skill => <span key={skill}>{skill}</span>)}</div>
              </section>
            )}
            {socials.length > 0 && (
              <section className={styles.sidePanel}>
                <h2>{t.connect}</h2>
                <div className={styles.socialLinks}>{socials.map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
                    <span aria-hidden="true"><span aria-hidden="true">
  <SocialIcon name={s.icon} />
</span></span>{s.label}<span aria-hidden="true">↗</span>
                  </a>
                ))}</div>
              </section>
            )}
          </aside>
        </div>

        <section className={styles.contentSection} aria-labelledby="instructor-courses">
          <div className={styles.sectionHeading}>
            <div><span className={styles.sectionKicker}>{t.coursesLabel}</span>
              <h2 id="instructor-courses">{t.courses}{locale === "en" ? ` ${name}` : ""}</h2></div>
            <Link href={`/${locale}/courses`} className={styles.sectionLink}>{t.viewAll} <span aria-hidden>→</span></Link>
          </div>
          {instructor.courses.length === 0 ? (
            <div className={styles.emptyState}><h3>{t.emptyCourses}</h3><p>{t.emptyCoursesText}</p></div>
          ) : (
            <div className={styles.courseGrid}>
              {instructor.courses.map(course => {
                const thumbnail = safeHttpUrl(course.thumbnailUrl);
                return (
                  <article className={styles.courseCard} key={course.id}>
                    <Link href={`/${locale}/courses/${encodeURIComponent(course.slug)}`} className={styles.courseImageLink}>
                      {thumbnail ? <Image src={thumbnail} width={600} height={360} unoptimized alt={course.title} className={styles.courseImage} />
                        : <div className={styles.coursePlaceholder}><span>CRESTMARK</span></div>}
                    </Link>
                    <div className={styles.courseBody}>
                      <span className={styles.courseMeta}>{[course.level, course.language].filter(Boolean).join("  ·  ")}</span>
                      <h3><Link href={`/${locale}/courses/${encodeURIComponent(course.slug)}`}>{course.title}</Link></h3>
                      {course.shortDescription && <p>{course.shortDescription}</p>}
                      <div className={styles.courseFooter}>
                        <span>{course.averageRating === null ? "☆ —" : `★ ${course.averageRating.toFixed(1)}`} <small>({number.format(course.reviewsCount)})</small></span>
                        <span>{number.format(course.studentsCount)} {t.studentsCount}</span>
                      </div>
                      <Link className={styles.courseCta} href={`/${locale}/courses/${encodeURIComponent(course.slug)}`}>
                        {t.exploreCourse} <span aria-hidden>→</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.contentSection} aria-labelledby="instructor-reviews">
          <div className={styles.sectionHeading}>
            <div><span className={styles.sectionKicker}>{t.reviewsLabel}</span><h2 id="instructor-reviews">{t.reviews}</h2></div>
          </div>
          {instructor.reviews.length === 0 ? (
            <div className={styles.emptyState}><h3>{t.emptyReviews}</h3><p>{t.emptyReviewsText}</p></div>
          ) : (
            <div className={styles.reviewGrid}>
              {instructor.reviews.map(review => (
                <article className={styles.reviewCard} key={review.id}>
                  <div className={styles.reviewHeader}>
                    <span className={styles.reviewAvatar} aria-hidden="true">{review.studentName[0]?.toUpperCase() || "S"}</span>
                    <div><strong>{review.studentName}</strong><small>{review.courseTitle}</small></div>
                  </div>
                  <div className={styles.stars} aria-label={`${review.rating} / 5`}>{"★".repeat(Math.max(0, Math.min(5, review.rating)))}</div>
                  {review.comment && <p>{review.comment}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
export default function InstructorProfilePage(props: Props) {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.container}>
            <div className={styles.profileLoading}>
              <div className={styles.loadingLine} />
              <div className={styles.loadingHero} />
              <div className={styles.loadingStats} />
            </div>
          </div>
        </main>
      }
    >
      <InstructorProfileContent {...props} />
    </Suspense>
  );
}