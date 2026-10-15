
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../page.module.css";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  isActive: boolean;
};

const copy = {
  en: {
    home: "Home",
    categories: "Categories",
    label: "LEARNING CATEGORY",
    explore: "Explore courses",
    allCategories: "All categories",
    about: "About this category",
    related: "Explore other learning areas",
    loading: "Loading category...",
    error: "We couldn't load this category.",
    notFound: "This category is unavailable.",
    retry: "Try again",
    browse: "Browse available courses",
    note:
      "Browse the course catalog to explore available training. Category-specific course filtering will be connected separately.",
    parent: "Parent category",
  },
  ar: {
    home: "الرئيسية",
    categories: "التصنيفات",
    label: "تصنيف تعليمي",
    explore: "استكشاف الدورات",
    allCategories: "كل التصنيفات",
    about: "عن هذا التصنيف",
    related: "استكشف المجالات الأخرى",
    loading: "جارٍ تحميل التصنيف...",
    error: "تعذّر تحميل التصنيف.",
    notFound: "هذا التصنيف غير متاح.",
    retry: "إعادة المحاولة",
    browse: "تصفح الدورات المتاحة",
    note:
      "تقدر تستكشف الدورات المتاحة من الكتالوج. رح نربط تصفية الدورات حسب التصنيف بشكل منفصل.",
    parent: "التصنيف الرئيسي",
  },
} as const;

function parseCategory(value: unknown): Category | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const data = value as Record<string, unknown>;

  if (
    !Number.isSafeInteger(data.id) ||
    Number(data.id) <= 0 ||
    typeof data.name !== "string" ||
    typeof data.slug !== "string" ||
    typeof data.isActive !== "boolean"
  ) {
    return null;
  }

  return {
    id: data.id as number,
    name: data.name,
    slug: data.slug,
    description:
      typeof data.description === "string"
        ? data.description
        : null,
    parentCategoryId:
      typeof data.parentCategoryId === "number"
        ? data.parentCategoryId
        : null,
    parentCategoryName:
      typeof data.parentCategoryName === "string"
        ? data.parentCategoryName
        : null,
    isActive: data.isActive,
  };
}

export default function CategoryDetailsPage() {
  const params = useParams<{
    locale: string;
    slug: string;
  }>();

  const locale = params.locale === "ar" ? "ar" : "en";
  const t = copy[locale];

  const [category, setCategory] = useState<Category | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "not-found" | "error"
  >("loading");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setCategory(null);

      try {
        const response = await fetch(
          `/api/catalog-categories/${encodeURIComponent(params.slug)}`,
          { cache: "no-store" }
        );

        if (cancelled) return;

        if (response.status === 404) {
          setStatus("not-found");
          return;
        }

        if (!response.ok) {
          throw new Error("Category unavailable");
        }

        const data: unknown = await response.json();
        const parsed = parseCategory(data);

        if (!parsed || !parsed.isActive) {
          setStatus("not-found");
          return;
        }

        setCategory(parsed);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [params.slug, reload]);

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href={`/${locale}`}>{t.home}</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/${locale}/categories`}>{t.categories}</Link>
          <span aria-hidden="true">/</span>
          <span>
            {category?.name ?? params.slug}
          </span>
        </nav>

        {status !== "ready" || !category ? (
          <div className={styles.state} role="status">
            <p>
              {status === "loading"
                ? t.loading
                : status === "not-found"
                  ? t.notFound
                  : t.error}
            </p>

            {status === "error" && (
              <button
                className={styles.actionButton}
                type="button"
                onClick={() => setReload((value) => value + 1)}
              >
                {t.retry}
              </button>
            )}

            {status === "not-found" && (
              <Link
                className={styles.actionButton}
                href={`/${locale}/categories`}
              >
                {t.allCategories}
              </Link>
            )}
          </div>
        ) : (
          <>
            <header className={styles.detailHeader}>
              <span className={styles.sectionEyebrow}>
                {t.label}
              </span>

              <h1>{category.name}</h1>

              {category.description && (
                <p>{category.description}</p>
              )}

              {category.parentCategoryName && (
                <p>
                  <strong>{t.parent}:</strong>{" "}
                  {category.parentCategoryName}
                </p>
              )}
            </header>

            <section className={styles.detailBody}>
              <h2>{t.about}</h2>

              <p>
                {category.description || category.name}
              </p>

              <h2 style={{ marginTop: 30 }}>{t.browse}</h2>
              <p>{t.note}</p>

              <div className={styles.detailActions}>
                <Link
                  className={styles.heroLink}
                  href={`/${locale}/courses`}
                >
                  {t.explore}
                  <span aria-hidden="true">↗</span>
                </Link>

                <Link
                  className={styles.categoryAction}
                  href={`/${locale}/categories`}
                >
                  {t.allCategories}
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
