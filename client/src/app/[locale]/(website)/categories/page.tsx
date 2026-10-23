
"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./page.module.css";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  isActive: boolean;
};

const copy = {
  en: {
    eyebrow: "EXPLORE BY SUBJECT",
    title: "Explore what you can learn.",
    intro:
      "Browse our learning categories and find the skills you want to build next.",
    search: "Search categories...",
    all: "All categories",
    subjects: "Learning areas",
    subjectsDescription:
      "Browse the subjects currently available at CrestMark.",
    view: "View category",
    child: "Subcategory",
    subcategories: "Subcategories",
    loading: "Loading categories...",
    error: "We couldn't load the categories.",
    retry: "Try again",
    noCategories: "No categories are available yet.",
    noResults: "No categories match your search.",
    clear: "Clear search",
    browseCourses: "Browse all courses",
    home: "Home",
    categoryLabel: "Category",
    resultLabel: "areas found",
    guidance: "Choose a subject. Go deeper.",
    searchHint: "Explore courses within every subject",
  },
  ar: {
    eyebrow: "استكشف المجالات التعليمية",
    title: "استكشف مجالات التعلّم.",
    intro:
      "اكتشف المجال المناسب إلك واستكشف المواضيع والمهارات اللي حابب تتعلمها.",
    search: "ابحث عن تصنيف...",
    all: "جميع التصنيفات",
    subjects: "المجالات التعليمية",
    subjectsDescription:
      "تعرّف على المجالات المتاحة حاليًا في CrestMark.",
    view: "استكشاف التصنيف",
    child: "تصنيف فرعي",
    subcategories: "التصنيفات الفرعية",
    loading: "جارٍ تحميل التصنيفات...",
    error: "تعذّر تحميل التصنيفات.",
    retry: "إعادة المحاولة",
    noCategories: "لا توجد تصنيفات متاحة حاليًا.",
    noResults: "لا توجد تصنيفات تطابق البحث.",
    clear: "مسح البحث",
    browseCourses: "تصفح جميع الدورات",
    home: "الرئيسية",
    categoryLabel: "تصنيف",
    resultLabel: "مجال متاح",
    guidance: "اختار مجال، وتعمّق فيه.",
    searchHint: "استكشف دورات كل مجال",
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

  const item = value as Record<string, unknown>;

  if (
    !Number.isSafeInteger(item.id) ||
    Number(item.id) <= 0 ||
    typeof item.name !== "string" ||
    typeof item.slug !== "string" ||
    !item.slug.trim() ||
    typeof item.isActive !== "boolean"
  ) {
    return null;
  }

  return {
    id: item.id as number,
    name: item.name,
    slug: item.slug,
    description:
      typeof item.description === "string"
        ? item.description
        : null,
    imageUrl:
      typeof item.imageUrl === "string" &&
      item.imageUrl.trim().toLowerCase() !== "null" &&
      item.imageUrl.trim()
        ? item.imageUrl
        : null,
    parentCategoryId:
      typeof item.parentCategoryId === "number"
        ? item.parentCategoryId
        : null,
    parentCategoryName:
      typeof item.parentCategoryName === "string"
        ? item.parentCategoryName
        : null,
    isActive: item.isActive,
  };
}

export default function CategoriesPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale === "ar" ? "ar" : "en";
  const t = copy[locale];

  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] =
    useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    const response = await fetch("/api/catalog-categories", {
      cache: "no-store",
    });

    if (!response.ok) throw new Error("Categories unavailable");

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid categories response");
    }

    const parsed = data.map(parseCategory);

    if (parsed.some((item) => item === null)) {
      throw new Error("Unexpected category format");
    }

    return (parsed as Category[]).filter((item) => item.isActive);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatus("loading");

      try {
        const result = await load();

        if (!cancelled) {
          setCategories(result);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [load, reload]);

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return categories.filter((item) =>
      `${item.name} ${item.description ?? ""} ${item.parentCategoryName ?? ""}`
        .toLocaleLowerCase()
        .includes(query)
    );
  }, [categories, search]);

  const sorted = useMemo(() => {
    return [...visible].sort((a, b) => {
      if (a.parentCategoryId === null && b.parentCategoryId !== null)
        return -1;
      if (a.parentCategoryId !== null && b.parentCategoryId === null)
        return 1;
      return a.name.localeCompare(b.name);
    });
  }, [visible]);

  return (
    <main className={styles.page} dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href={`/${locale}`}>{t.home}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{t.all}</span>
          </nav>

          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}><span className={styles.eyebrowLine} />{t.eyebrow}</p>
              <h1>{t.title}</h1>
              <p className={styles.heroIntro}>{t.intro}</p>
              <Link href={`/${locale}/courses`} className={styles.heroLink}>
                {t.browseCourses}
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
              </Link>
            </div>

            
<div className={styles.heroVisual}>
  <div className={styles.heroImageWrap}>
    
        <Image
          src="/categories-hero.jpg"
          alt={
            locale === "ar"
              ? "طلاب يستكشفون مجالات البرمجة والتكنولوجيا"
              : "Students exploring programming and technology"
          }
          fill
          sizes="(max-width: 800px) 100vw, 520px"
          className={styles.heroImage}
          priority
        />


    <div className={styles.heroBadge}>
      <span>
        {locale === "ar" ? "مسارات التعلّم" : "Learning paths"}
      </span>
      <strong>{categories.length}</strong>
    </div>
  </div>
</div>

          </div>
        </div>
      </section>

      <section className={styles.content} aria-labelledby="category-list-heading">
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionEyebrow}>{t.guidance}</p>
              <h2 id="category-list-heading">{t.subjects}</h2>
              <p>{t.subjectsDescription}</p>
            </div>
            <span className={styles.resultCount} aria-live="polite">
              <strong>{status === "ready" ? sorted.length : "—"}</strong> {t.resultLabel}
            </span>
          </div>

          {status === "ready" && categories.length > 0 && (
            <div className={styles.toolbar}>
              <label className={styles.searchBox}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <circle cx="11" cy="11" r="7"/><path d="m16 16 5 5" />
                </svg>
                <input
                  type="search"
                  value={search}
                  placeholder={t.search}
                  aria-label={t.search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <span className={styles.searchHint}>{t.searchHint}</span>
            </div>
          )}

          {status === "loading" ? (
            <div className={styles.state} role="status">{t.loading}</div>
          ) : status === "error" ? (
            <div className={styles.state} role="alert">
              <p>{t.error}</p>
              <button type="button" className={styles.actionButton} onClick={() => setReload((v) => v + 1)}>{t.retry}</button>
            </div>
          ) : categories.length === 0 ? (
            <div className={styles.state}>{t.noCategories}</div>
          ) : sorted.length === 0 ? (
            <div className={styles.state}>
              <p>{t.noResults}</p>
              <button type="button" className={styles.actionButton} onClick={() => setSearch("")}>{t.clear}</button>
            </div>
          ) : (
            <div className={styles.categoryList}>
              {sorted.map((category, index) => {
                const children = categories.filter((item) => item.parentCategoryId === category.id);
                return (
                  <article className={styles.category} key={category.id} style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}>
                    <div className={styles.categoryIndex}>{String(index + 1).padStart(2, "0")}</div>
                    <div className={styles.categoryInformation}>
                      {category.parentCategoryId !== null && (
                        <span className={styles.parentLabel}>
                          {t.child}{category.parentCategoryName ? ` · ${category.parentCategoryName}` : ""}
                        </span>
                      )}
                      <h3><Link href={`/${locale}/categories/${encodeURIComponent(category.slug)}`}>{category.name}</Link></h3>
                      {category.description && <p>{category.description}</p>}
                      {children.length > 0 && (
                        <div className={styles.children}>
                          <span>{t.subcategories}:</span>
                          {children.map((child) => (
                            <Link key={child.id} href={`/${locale}/categories/${encodeURIComponent(child.slug)}`}>{child.name}</Link>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link className={styles.categoryAction} href={`/${locale}/categories/${encodeURIComponent(category.slug)}`} aria-label={`${t.view}: ${category.name}`}>
                      <span>{t.view}</span>
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
