"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import styles from "./page.module.css";

type Locale = "en" | "ar";
type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  isActive: boolean;
};

type LoadStatus = "loading" | "ready" | "not-found" | "error";

const copy = {
  en: {
    home: "Home",
    categories: "Categories",
    eyebrow: "A FIELD WORTH EXPLORING",
    subheading: "One subject. New possibilities.",
    introduction: "Explore the courses and practical skills available in this learning area.",
    parent: "Part of",
    explore: "Explore courses in this area",
    allCourses: "Browse all courses",
    allCategories: "All learning areas",
    aboutLabel: "THE OVERVIEW",
    about: "Get to know this field",
    aboutFallback: "Explore this learning area and find courses that match your goals.",
    pathwayLabel: "YOUR NEXT STEP",
    pathwayTitle: "Start with a course that moves you forward.",
    pathwayDescription: "Explore the available courses in this category, choose what interests you and build your skills at your own pace.",
    otherLabel: "KEEP EXPLORING",
    otherTitle: "There's more to discover.",
    otherDescription: "Looking for another direction? Browse all our learning categories.",
    loading: "Loading learning area...",
    error: "We couldn't load this category.",
    errorDescription: "Please check your connection and try again.",
    missing: "This learning area isn't available.",
    missingDescription: "It may have been moved or is no longer published.",
    retry: "Try again",
  },
  ar: {
    home: "الرئيسية",
    categories: "التصنيفات",
    eyebrow: "مجال يستحق الاستكشاف",
    subheading: "مجال واحد، وفرص جديدة.",
    introduction: "استكشف الدورات والمهارات العملية المتاحة في هذا المجال التعليمي.",
    parent: "تابع لـ",
    explore: "استكشف دورات هذا المجال",
    allCourses: "تصفح جميع الدورات",
    allCategories: "جميع المجالات التعليمية",
    aboutLabel: "نظرة عامة",
    about: "تعرّف على هذا المجال",
    aboutFallback: "استكشف هذا المجال واعثر على دورات تناسب أهدافك.",
    pathwayLabel: "خطوتك القادمة",
    pathwayTitle: "ابدأ بدورة تقرّبك من هدفك.",
    pathwayDescription: "تصفّح الدورات المتاحة ضمن هذا التصنيف، واختر ما يناسب اهتماماتك وطوّر مهاراتك بالوتيرة المناسبة إلك.",
    otherLabel: "واصل الاستكشاف",
    otherTitle: "في مجالات ثانية بتستاهل تكتشفها.",
    otherDescription: "حابب تتعلّم مجال مختلف؟ استكشف جميع التصنيفات التعليمية.",
    loading: "جارٍ تحميل المجال التعليمي...",
    error: "تعذّر تحميل هذا التصنيف.",
    errorDescription: "تحقق من الاتصال وحاول مرة ثانية.",
    missing: "هذا المجال غير متاح حاليًا.",
    missingDescription: "ممكن يكون التصنيف تغيّر أو لم يعد منشورًا.",
    retry: "إعادة المحاولة",
  },
} as const;

function parseCategory(value: unknown): Category | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (
    !Number.isSafeInteger(item.id) ||
    Number(item.id) <= 0 ||
    typeof item.name !== "string" ||
    !item.name.trim() ||
    typeof item.slug !== "string" ||
    !item.slug.trim() ||
    typeof item.isActive !== "boolean"
  ) return null;

  return {
    id: item.id as number,
    name: item.name.trim(),
    slug: item.slug,
    description: typeof item.description === "string" && item.description.trim() ? item.description.trim() : null,
    parentCategoryId: typeof item.parentCategoryId === "number" ? item.parentCategoryId : null,
    parentCategoryName: typeof item.parentCategoryName === "string" && item.parentCategoryName.trim() ? item.parentCategoryName.trim() : null,
    isActive: item.isActive,
  };
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function CategoryDetailsContent() {
  const params = useParams<{ locale: string; slug: string }>();
  const locale: Locale = params.locale === "ar" ? "ar" : "en";
  const t = copy[locale];
  const [category, setCategory] = useState<Category | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setCategory(null);
      setStatus("loading");
      try {
        const response = await fetch(
          `/api/catalog-categories/${encodeURIComponent(params.slug)}`,
          { cache: "no-store", signal: controller.signal }
        );
        if (response.status === 404) {
          if (!controller.signal.aborted) setStatus("not-found");
          return;
        }
        if (!response.ok) throw new Error("Category unavailable");
        const data: unknown = await response.json();
        const parsed = parseCategory(data);
        if (controller.signal.aborted) return;
        if (!parsed || !parsed.isActive || parsed.slug !== params.slug) {
          setStatus("not-found");
          return;
        }
        setCategory(parsed);
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }
    void load();
    return () => controller.abort();
  }, [params.slug, reload]);

  const coursesLink = category
    ? `/${locale}/courses?category=${encodeURIComponent(category.name)}`
    : `/${locale}/courses`;

  return (
    <main className={styles.page} dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href={`/${locale}`}>{t.home}</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/${locale}/categories`}>{t.categories}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{category?.name ?? params.slug}</span>
        </nav>
      </div>

      {status !== "ready" || !category ? (
        <div className={styles.container}>
          <section className={styles.state} role={status === "error" ? "alert" : "status"}>
            <span className={styles.stateMark} aria-hidden="true">{status === "loading" ? "…" : "!"}</span>
            <h1>{status === "loading" ? t.loading : status === "not-found" ? t.missing : t.error}</h1>
            {status !== "loading" && <p>{status === "not-found" ? t.missingDescription : t.errorDescription}</p>}
            <div className={styles.stateActions}>
              {status === "error" && (
                <button type="button" className={styles.primaryButton} onClick={() => setReload((value) => value + 1)}>
                  {t.retry}
                </button>
              )}
              {status !== "loading" && <Link href={`/${locale}/categories`} className={styles.secondaryButton}>{t.allCategories}</Link>}
            </div>
          </section>
        </div>
      ) : (
        <>
          <section className={styles.hero}>
            <div className={styles.container}>
              <div className={styles.heroGrid}>
                <div className={styles.heroCopy}>
                  <p className={styles.eyebrow}><span aria-hidden="true" />{t.eyebrow}</p>
                  <h1>{category.name}</h1>
                  <p className={styles.heroDescription}>{category.description ?? t.introduction}</p>
                  {category.parentCategoryName && (
                    <p className={styles.parentInfo}>{t.parent} <strong>{category.parentCategoryName}</strong></p>
                  )}
                  <div className={styles.heroActions}>
                    <Link href={coursesLink} className={styles.primaryButton}>{t.explore}<ArrowIcon /></Link>
                    <Link href={`/${locale}/categories`} className={styles.textLink}>{t.allCategories}</Link>
                  </div>
                </div>
                <div className={styles.heroAside} aria-hidden="true">
                  <span className={styles.heroAsideLabel}>CRESTMARK / FIELD NOTES</span>
                  <div className={styles.heroAsideRule} />
                  <p>{t.subheading}</p>
                  <span className={styles.heroAsideBottom}>LEARN · PRACTICE · GROW</span>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.content}>
            <div className={styles.container}>
              <div className={styles.contentGrid}>
                <div className={styles.aboutBlock}>
                  <p className={styles.sectionEyebrow}>{t.aboutLabel}</p>
                  <h2>{t.about}</h2>
                  <p className={styles.aboutText}>{category.description ?? t.aboutFallback}</p>
                </div>
                <aside className={styles.nextStep}>
                  <p className={styles.sectionEyebrow}>{t.pathwayLabel}</p>
                  <h2>{t.pathwayTitle}</h2>
                  <p>{t.pathwayDescription}</p>
                  <Link href={coursesLink} className={styles.primaryButton}>{t.explore}<ArrowIcon /></Link>
                </aside>
              </div>
              <div className={styles.discover}>
                <div>
                  <p className={styles.sectionEyebrow}>{t.otherLabel}</p>
                  <h2>{t.otherTitle}</h2>
                  <p>{t.otherDescription}</p>
                </div>
                <Link href={`/${locale}/categories`} className={styles.secondaryButton}>{t.allCategories}<ArrowIcon /></Link>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default function CategoryDetailsPage() {
  return (
    <Suspense fallback={<main className={styles.page}><div className={styles.loadingFallback}>Loading category...</div></main>}>
      <CategoryDetailsContent />
    </Suspense>
  );
}
