
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { Suspense } from "react";
import FeaturedCourses from "@/components/FeaturedCourses";

type Props = {
  params: Promise<{ locale: string }>;
};

const content = {
  en: {
    eyebrow: "A BETTER WAY TO LEARN",
    headingStart: "Build skills.",
    headingHighlight: "Shape your future.",
    description:
      "Discover courses designed to help you learn with confidence, develop practical skills, and move forward at your own pace.",
    primaryAction: "Explore Courses",
    secondaryAction: "How CrestMark Works",
    imageLabel: "YOUR LEARNING JOURNEY",
    imageTitle: "Your next chapter starts here.",
    imageDescription:
      "Discover new ideas. Develop new abilities.",
    bottomLabel: "EXPLORE WHAT INTERESTS YOU",
    categories: [
      "Development",
      "Design",
      "Business",
      "Technology",
    ],
  },
  ar: {
    eyebrow: "تعلّم بطريقة تصنع الفرق",
    headingStart: "طوّر مهاراتك.",
    headingHighlight: "واصنع مستقبلك.",
    description:
      "اكتشف دورات تعليمية تساعدك على اكتساب المعرفة، وتطوير مهارات عملية، والتقدم بثقة وبالسرعة التي تناسبك.",
    primaryAction: "استكشف الدورات",
    secondaryAction: "كيف تعمل CrestMark؟",
    imageLabel: "رحلتك التعليمية",
    imageTitle: "خطوتك القادمة تبدأ من هنا.",
    imageDescription:
      "اكتشف أفكارًا جديدة، وطوّر قدراتك.",
    bottomLabel: "اكتشف المجالات التي تهمك",
    categories: [
      "البرمجة",
      "التصميم",
      "الأعمال",
      "التكنولوجيا",
    ],
  },
} as const;

export default async function LocalizedHome({
  params,
}: Props) {
  const { locale } = await params;

  if (locale !== "en" && locale !== "ar") {
    notFound();
  }

  const t = content[locale];

  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowLine} />
              <span>{t.eyebrow}</span>
            </div>

            <h1 className={styles.heading}>
              <span>{t.headingStart}</span>
              <span className={styles.headingHighlight}>
                {t.headingHighlight}
              </span>
            </h1>

            <p className={styles.description}>
              {t.description}
            </p>

            <div className={styles.heroActions}>
              <Link
                href={`/${locale}/courses`}
                className={styles.primaryButton}
              >
                <span>{t.primaryAction}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </Link>

              <Link
                href={`/${locale}/about`}
                className={styles.secondaryButton}
              >
                {t.secondaryAction}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            </div>
          </div>

          <div className={styles.visual}>
            <div
              className={styles.heroImage}
              role="img"
              aria-label={
                locale === "ar"
                  ? "مجموعة طلاب يتعلمون ويعملون معًا"
                  : "Students collaborating and learning together"
              }
            />

            <div className={styles.imageInfo}>
              <span className={styles.imageLabel}>
                {t.imageLabel}
              </span>

              <h2 className={styles.imageTitle}>
                {t.imageTitle}
              </h2>

              <p className={styles.imageDescription}>
                {t.imageDescription}
              </p>

              <div className={styles.imageDecoration}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroBottom}>
          <div className={styles.bottomInner}>
            <span className={styles.bottomLabel}>
              {t.bottomLabel}
            </span>

            <div className={styles.categoryLinks}>
              {t.categories.map((category, index) => (
                <Link
                  key={index}
                  href={`/${locale}/categories`}
                  className={styles.categoryLink}
                >
                  {category}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Suspense fallback={null}>
        <FeaturedCourses locale={locale} />
      </Suspense>
    </main>
  );
}
