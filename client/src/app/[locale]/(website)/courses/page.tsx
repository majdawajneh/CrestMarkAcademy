import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  SaveCourseButton,
  SavedCoursesLink,
  WishlistProvider,
} from "./WishlistControls";
import styles from "./page.module.css";

export const instant = false;

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
type SearchFilters = {
  q?: string | string[];
  category?: string | string[];
  level?: string | string[];
  language?: string | string[];
};
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchFilters>;
};

const copy = {
  en: {
    eyebrow: "CRESTMARK / COURSE LIBRARY",
    titleTop: "Find your next",
    titleAccent: "breakthrough.",
    intro: "A curated space for curious minds. Discover practical courses, find your direction, and turn learning into something you can build on.",
    heroIndex: "01 / DISCOVER",
    heroAside: "EXPLORE  /  LEARN  /  BUILD",
    formTitle: "Make your next move.",
    formHint: "Search the library, then refine your results.",
    searchPlaceholder: "What would you like to learn?",
    searchLabel: "Search courses",
    search: "Search courses",
    category: "Category",
    level: "Level",
    language: "Language",
    allCategories: "All categories",
    allLevels: "All levels",
    allLanguages: "All languages",
    apply: "Apply filters",
    reset: "Clear filters",
    libraryEyebrow: "THE LEARNING LIBRARY",
    libraryTitle: "Explore what's possible.",
    libraryDescription: "Choose a course and start moving from curiosity to capability.",
    showing: "Showing",
    oneCourse: "course",
    courses: "courses",
    noResults: "No courses match your search.",
    noResultsDescription: "Try a different keyword or remove some filters.",
    emptyTitle: "New courses are on their way.",
    emptyDescription: "We're preparing more learning opportunities. Explore again soon.",
    errorTitle: "We couldn't load the library.",
    errorDescription: "The courses are temporarily unavailable. Please try again shortly.",
    viewCourse: "Discover course",
    featured: "EDITOR'S PICK",
    fallback: "CRESTMARK / LEARNING",
    cardEyebrow: "ONLINE COURSE",
    footerNote: "LEARN WITH INTENTION. BUILD WITH CONFIDENCE.",
    pageTitle: "Online Courses in Programming & Technology",
    pageDescription: "Explore practical online courses in programming, web development and databases at CrestMark. Browse topics, filter by level and learn at your own pace.",
  },
  ar: {
    eyebrow: "CRESTMARK / مكتبة الدورات",
    titleTop: "اكتشف مهارتك",
    titleAccent: "القادمة.",
    intro: "مساحة لكل شخص عنده فضول يتعلّم. اكتشف دورات عملية، وحدّد طريقك، وحوّل كل درس لخطوة حقيقية نحو أهدافك.",
    heroIndex: "01 / اكتشف",
    heroAside: "اكتشف / تعلّم / اصنع",
    formTitle: "ابدأ خطوتك الجاية.",
    formHint: "ابحث بين الدورات، وبعدها حدّد النتائج اللي بتناسبك.",
    searchPlaceholder: "شو حابب تتعلم اليوم؟",
    searchLabel: "ابحث عن دورة",
    search: "ابحث عن الدورات",
    category: "التصنيف",
    level: "المستوى",
    language: "اللغة",
    allCategories: "جميع التصنيفات",
    allLevels: "جميع المستويات",
    allLanguages: "جميع اللغات",
    apply: "تطبيق الفلاتر",
    reset: "مسح الفلاتر",
    libraryEyebrow: "مكتبة التعلّم",
    libraryTitle: "فرص أكثر لتتعلّم.",
    libraryDescription: "اختَر دورتك وابدأ بتحويل الفضول لمهارة حقيقية.",
    showing: "عرض",
    oneCourse: "دورة",
    courses: "دورات",
    noResults: "ما لقينا دورات مطابقة لبحثك.",
    noResultsDescription: "جرّب كلمة ثانية أو خفّف خيارات التصفية.",
    emptyTitle: "دورات جديدة قريبًا.",
    emptyDescription: "نعمل على تجهيز فرص تعليمية جديدة. ارجع واستكشف قريبًا.",
    errorTitle: "تعذّر تحميل الدورات.",
    errorDescription: "الدورات غير متاحة مؤقتًا. جرّب مرة ثانية بعد قليل.",
    viewCourse: "استكشف الدورة",
    featured: "دورة مميزة",
    fallback: "CRESTMARK / LEARNING",
    cardEyebrow: "دورة أونلاين",
    footerNote: "تعلّم بهدف. واصنع بثقة.",
    pageTitle: "دورات أونلاين في البرمجة والتكنولوجيا",
    pageDescription: "استكشف دورات عملية في البرمجة وتطوير الويب وقواعد البيانات عبر CrestMark. ابحث حسب المجال والمستوى، وتعلّم بالوتيرة المناسبة إلك.",
  },
} as const;

function getLocale(value: string): Locale {
  if (value !== "en" && value !== "ar") notFound();
  return value;
}
function filterValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value ?? "").trim().slice(0, 120);
}
function validImageUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    if (["example.com", "www.example.com"].includes(url.hostname.toLowerCase())) return null;
    return url.toString();
  } catch { return null; }
}
async function getCourses(): Promise<{ courses: Course[]; failed: boolean }> {
  const base = (process.env.API_BASE_URL || "http://localhost:5299").replace(/\/+$/, "");
  try {
    const response = await fetch(`${base}/api/courses`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return { courses: [], failed: true };
    const data: unknown = await response.json();
    if (!Array.isArray(data)) return { courses: [], failed: true };
    return {
      courses: (data as Course[]).filter(c => c && typeof c.id === "number" && typeof c.title === "string" && typeof c.slug === "string"),
      failed: false,
    };
  } catch { return { courses: [], failed: true }; }
}
function options(courses: Course[], key: "categoryName" | "level" | "language") {
  return [...new Set(courses.map(c => c[key]).filter((x): x is string => typeof x === "string" && !!x.trim()))].sort((a,b) => a.localeCompare(b));
}
function siteOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.hostname === "localhost" || url.hostname.endsWith(".example.com")) return null;
    return url.origin;
  } catch { return null; }
}
export async function generateMetadata({ params }: { params: Props["params"] }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = getLocale(raw);
  const t = copy[locale];
  const origin = siteOrigin();
  const path = `/${locale}/courses`;
  return {
    title: t.pageTitle,
    description: t.pageDescription,
    ...(origin ? {
      alternates: {
        canonical: `${origin}${path}`,
        languages: { en: `${origin}/en/courses`, ar: `${origin}/ar/courses`, "x-default": `${origin}/en/courses` },
      },
    } : {}),
    openGraph: {
      type: "website",
      siteName: "CrestMark",
      title: `${t.pageTitle} | CrestMark`,
      description: t.pageDescription,
      locale: locale === "ar" ? "ar_JO" : "en_US",
      ...(origin ? { url: `${origin}${path}` } : {}),
    },
    twitter: { card: "summary_large_image", title: `${t.pageTitle} | CrestMark`, description: t.pageDescription },
    robots: { index: !!origin, follow: !!origin },
  };
}

export default async function CoursesPage({ params, searchParams }: Props) {
  const [{ locale: raw }, filters] = await Promise.all([params, searchParams]);
  const locale = getLocale(raw);
  const t = copy[locale];
  const search = filterValue(filters.q);
  const category = filterValue(filters.category);
  const level = filterValue(filters.level);
  const language = filterValue(filters.language);
  const hasFilters = !!(search || category || level || language);
  const { courses, failed } = await getCourses();
  const categories = options(courses, "categoryName");
  const levels = options(courses, "level");
  const languages = options(courses, "language");
  const needle = search.toLocaleLowerCase();
  const results = courses.filter(course => {
    const searchMatches = !needle || [course.title, course.shortDescription, course.categoryName, course.instructorName]
      .filter((v): v is string => typeof v === "string")
      .some(v => v.toLocaleLowerCase().includes(needle));
    return searchMatches && (!category || course.categoryName === category)
      && (!level || course.level === level) && (!language || course.language === language);
  });

  return (
    <main className={styles.page} dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className={styles.hero} aria-labelledby="courses-title">
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <span className={styles.eyebrow}><span className={styles.eyebrowLine}/>{t.eyebrow}</span>
              <h1 id="courses-title" className={styles.title}>
                <span>{t.titleTop}</span><strong>{t.titleAccent}</strong>
              </h1>
              <p className={styles.heroDescription}>{t.intro}</p>
              <div className={styles.heroBottom}><span>{t.heroIndex}</span><span className={styles.heroRule}/><span>{t.heroAside}</span></div>
            </div>
            <div className={styles.heroArtwork} aria-hidden="true">
              <div className={styles.artFrame}>
                <span className={styles.artCorner}>CM / 01</span>
                <div className={styles.artOrbit}><div className={styles.artOrbitInner}/><span className={styles.artSpark}>✳</span></div>
                <div className={styles.artCaption}><span>CRESTMARK</span><strong>THE NEXT<br/>CHAPTER</strong><span>IS YOURS ↗</span></div>
                <div className={styles.artNumber}>01<span>—</span>26</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.catalog} aria-label={t.pageTitle}>
        <div className={styles.container}>
          <form action={`/${locale}/courses`} method="GET" className={styles.filters} role="search">
            <div className={styles.formHeading}><div><span className={styles.micro}>CRESTMARK / FIND YOUR COURSE</span><h2>{t.formTitle}</h2><p>{t.formHint}</p></div><span className={styles.formDecoration} aria-hidden="true">↘</span></div>
            <div className={styles.searchRow}>
              <div className={styles.searchField}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>
                <input type="search" name="q" aria-label={t.searchLabel} placeholder={t.searchPlaceholder} defaultValue={search} maxLength={120}/>
              </div>
              <button type="submit" className={styles.searchButton}>{t.search}<span aria-hidden="true">↗</span></button>
            </div>
            <div className={styles.filterRow}>
              <div className={styles.filterField}><label htmlFor="course-category">{t.category}</label><select id="course-category" name="category" defaultValue={category}><option value="">{t.allCategories}</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className={styles.filterField}><label htmlFor="course-level">{t.level}</label><select id="course-level" name="level" defaultValue={level}><option value="">{t.allLevels}</option>{levels.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
              <div className={styles.filterField}><label htmlFor="course-language">{t.language}</label><select id="course-language" name="language" defaultValue={language}><option value="">{t.allLanguages}</option>{languages.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
              <button type="submit" className={styles.applyButton}>{t.apply} <span aria-hidden="true">↗</span></button>
              {hasFilters && <Link href={`/${locale}/courses`} className={styles.resetButton}>{t.reset}</Link>}
            </div>
          </form>

          <div className={styles.catalogHeading}><div><span className={styles.sectionEyebrow}><span/> {t.libraryEyebrow}</span><h2>{t.libraryTitle}</h2><p>{t.libraryDescription}</p></div><span className={styles.sectionIndex}>02 / CRESTMARK</span></div>

          <WishlistProvider locale={locale}>
            <div className={styles.resultsBar}><p className={styles.resultsCount}>{t.showing} <strong>{results.length}</strong> {results.length === 1 ? t.oneCourse : t.courses}</p><SavedCoursesLink/></div>
            {failed ? <div className={styles.message}><h2>{t.errorTitle}</h2><p>{t.errorDescription}</p></div>
            : results.length === 0 ? <div className={styles.message}><h2>{courses.length === 0 ? t.emptyTitle : t.noResults}</h2><p>{courses.length === 0 ? t.emptyDescription : t.noResultsDescription}</p>{hasFilters && <Link href={`/${locale}/courses`} className={styles.clearLink}>{t.reset} ↗</Link>}</div>
            : <div className={styles.courseGrid}>
                {results.map((course, index) => {
                  const image = validImageUrl(course.thumbnailUrl);
                  const href = `/${locale}/courses/${encodeURIComponent(course.slug)}`;
                  return <article key={course.id} className={styles.courseCard} style={{ animationDelay: `${Math.min(index, 8) * 75}ms` }}>
                    <div className={styles.imageWrapper}>
                      <Link href={href} className={styles.imageLink} aria-label={`${t.viewCourse}: ${course.title}`}>
                        {image ? <Image src={image} alt={course.title} width={600} height={360} unoptimized className={styles.courseImage}/> : <div className={styles.imageFallback} aria-hidden="true"><span className={styles.fallbackSymbol}>✳</span><span>{t.fallback}</span></div>}
                      </Link>
                      <span className={styles.imageCounter} aria-hidden="true">CM / {String(index + 1).padStart(2,"0")}</span>
                      {course.isFeatured && <span className={styles.featured}>{t.featured}</span>}
                      <SaveCourseButton courseId={course.id}/>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTopLine}><span className={styles.category}>{course.categoryName || t.cardEyebrow}</span><span className={styles.cardSerial}>/ {String(index + 1).padStart(2,"0")}</span></div>
                      <h3 className={styles.courseTitle}><Link href={href}>{course.title}</Link></h3>
                      {course.shortDescription && <p className={styles.courseDescription}>{course.shortDescription}</p>}
                      {(course.level || course.language) && <div className={styles.meta}>{course.level && <span>{course.level}</span>}{course.level && course.language && <span className={styles.metaDot} aria-hidden="true"/>}{course.language && <span>{course.language}</span>}</div>}
                      <Link href={href} className={styles.courseLink}>{t.viewCourse}<span aria-hidden="true">↗</span></Link>
                    </div>
                  </article>;
                })}
              </div>
            }
          </WishlistProvider>
          <div className={styles.catalogFooter}><span className={styles.footerRule}/><span>{t.footerNote}</span></div>
        </div>
      </section>
    </main>
  );
}
