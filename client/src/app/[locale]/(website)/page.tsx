
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import FeaturedCourses from "@/components/FeaturedCourses";
import styles from "./page.module.css";

type Locale = "en" | "ar";

type Props = {
  params: Promise<{ locale: string }>;
};

type Category = {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  parentCategoryId: number | null;
};

const copy = {
  en: {
    heroLabel: "WELCOME TO CRESTMARK ACADEMY",
    headline: "Your ambition.",
    headlineEmphasis: "Our starting point.",
    heroDescription:
      "Discover a more inspiring way to learn. Explore practical courses, build knowledge at your own pace, and turn curiosity into meaningful progress.",
    explore: "Explore courses",
    about: "Discover our story",
    photoTag: "THE FUTURE BEGINS WITH LEARNING",
    floatingLabel: "LEARN. CREATE. ADVANCE.",
    introLabel: "MADE FOR THE CURIOUS",
    introTitle: "Great things begin with the decision to learn.",
    introText:
      "Whether you're building your first skill or exploring a completely new direction, CrestMark Academy brings your next learning experience within reach.",
    discoverLabel: "DISCOVER YOUR DIRECTION",
    discoverTitle: "Where will your curiosity take you?",
    discoverText:
      "Explore learning areas available at the academy. Start with what interests you and discover what you could build next.",
    allCategories: "View all categories",
    categoryFallback: "Explore learning categories",
    featuredLabel: "EXPLORE OUR COURSES",
    learningLabel: "A LEARNING EXPERIENCE BUILT AROUND YOU",
    learningTitle: "Your next skill deserves a better way to learn.",
    learningText:
      "We bring clarity and structure to the learning experience, so you can spend more time developing skills and less time figuring out where to begin.",
    learningFeatures: [
      {
        number: "01",
        title: "Discover something new",
        text: "Explore subjects and find courses that match your interests.",
      },
      {
        number: "02",
        title: "Follow a clear path",
        text: "Move through organized sections and lessons at a pace that works for you.",
      },
      {
        number: "03",
        title: "Make progress visible",
        text: "Keep track of the lessons you've completed and return to where you left off.",
      },
    ],
    experienceLabel: "YOUR PERSONAL LEARNING SPACE",
    experienceTitle: "Pick up right where you left off.",
    experienceText:
      "Your courses stay connected to your learning journey. Revisit lessons, follow your progress, and continue when you're ready.",
    experienceItems: [
      "Your enrolled courses, in one place",
      "Continue from your last accessed lesson",
      "Track course completion",
      "Access certificates for eligible achievements",
    ],
    experienceLink: "Explore the learning experience",
    technologyLabel: "WHERE WE BEGIN",
    technologyTitle: "Built on technology. Inspired by possibility.",
    technologyText:
      "We begin with programming, software development, web technologies, and databases. And we're building an academy ready to welcome more fields in the future.",
    technologyAction: "Discover our learning areas",
    journeyLabel: "HOW LEARNING WORKS",
    journeyTitle: "A simple journey. Meaningful progress.",
    journeySteps: [
      {
        title: "Find your course",
        text: "Discover topics and choose what you want to learn.",
      },
      {
        title: "Start learning",
        text: "Join a course and explore its available lessons.",
      },
      {
        title: "Keep progressing",
        text: "Follow your lessons and return anytime.",
      },
      {
        title: "Celebrate completion",
        text: "Complete your course and access your certificate when eligible.",
      },
    ],
    closingLabel: "YOUR NEXT CHAPTER STARTS HERE",
    closingTitle: "There's more ahead of you than you imagine.",
    closingText:
      "Make time for what matters. Discover a course, learn something valuable, and take one more step toward the future you want.",
    closingAction: "Start exploring",
    closingContact: "Have a question? Contact us",
  },
  ar: {
    heroLabel: "أهلًا بك في CRESTMARK ACADEMY",
    headline: "طموحك هو البداية.",
    headlineEmphasis: "والتعلّم يصنع الفرق.",
    heroDescription:
      "اكتشف تجربة تعليمية ملهمة. استكشف دورات عملية، وطوّر معرفتك بالوتيرة التي تناسبك، وحوّل فضولك إلى تقدم حقيقي.",
    explore: "استكشف الدورات",
    about: "تعرّف على قصتنا",
    photoTag: "المستقبل يبدأ بالتعلّم",
    floatingLabel: "تعلّم. ابتكر. تقدّم.",
    introLabel: "لأصحاب الشغف والفضول",
    introTitle: "كل إنجاز كبير يبدأ بقرار التعلّم.",
    introText:
      "سواء كنت تبدأ بتطوير مهارتك الأولى أو تستكشف مجالًا جديدًا، تساعدك CrestMark Academy على الوصول إلى تجربتك التعليمية القادمة.",
    discoverLabel: "اكتشف مجالك",
    discoverTitle: "إلى أين سيأخذك فضولك؟",
    discoverText:
      "تعرّف على المجالات المتاحة في الأكاديمية، وابدأ بما يثير اهتمامك، واكتشف المهارات التي يمكنك تطويرها.",
    allCategories: "جميع التصنيفات",
    categoryFallback: "استكشف المجالات التعليمية",
    featuredLabel: "استكشف دوراتنا",
    learningLabel: "تجربة تعليمية تتمحور حولك",
    learningTitle: "مهارتك القادمة تستحق تجربة تعلّم أفضل.",
    learningText:
      "نعمل على جعل التعلّم أكثر وضوحًا وتنظيمًا، حتى تركز على تطوير مهاراتك بدلًا من البحث عن نقطة البداية.",
    learningFeatures: [
      {
        number: "01",
        title: "اكتشف شيئًا جديدًا",
        text: "استكشف المجالات واختر الدورات التي تناسب اهتماماتك.",
      },
      {
        number: "02",
        title: "اتبع مسارًا واضحًا",
        text: "انتقل بين الأقسام والدروس المنظمة وفق الوقت المناسب لك.",
      },
      {
        number: "03",
        title: "شاهد تقدمك",
        text: "تابع الدروس المكتملة وارجع إلى آخر نقطة وصلت إليها.",
      },
    ],
    experienceLabel: "مساحتك التعليمية الخاصة",
    experienceTitle: "كمّل من المكان اللي وصلت إله.",
    experienceText:
      "تظل دوراتك مرتبطة برحلتك التعليمية. ارجع إلى دروسك، وتابع تقدمك، وواصل التعلّم وقتما يناسبك.",
    experienceItems: [
      "دوراتك المسجلة في مكان واحد",
      "العودة إلى آخر درس وصلت إليه",
      "متابعة نسبة إكمال الدورة",
      "الوصول إلى شهادات الإنجازات المؤهلة",
    ],
    experienceLink: "اكتشف تجربة التعلّم",
    technologyLabel: "من أين نبدأ",
    technologyTitle: "نبدأ بالتكنولوجيا. ونطمح إلى آفاق أكبر.",
    technologyText:
      "نبدأ بالبرمجة وتطوير البرمجيات وتقنيات الويب وقواعد البيانات، ونعمل على بناء أكاديمية قادرة على استقبال مجالات أخرى مستقبلًا.",
    technologyAction: "اكتشف المجالات التعليمية",
    journeyLabel: "كيف تبدأ رحلتك؟",
    journeyTitle: "خطوات بسيطة. وتقدم له معنى.",
    journeySteps: [
      {
        title: "اختر دورتك",
        text: "استكشف المجالات وحدد المهارة التي ترغب بتعلمها.",
      },
      {
        title: "ابدأ التعلّم",
        text: "التحق بالدورة واستكشف دروسها المتاحة.",
      },
      {
        title: "واصل التقدم",
        text: "تابع الدروس وارجع إليها عندما تريد.",
      },
      {
        title: "احتفل بإنجازك",
        text: "أكمل دورتك واحصل على شهادتك عند استيفاء شروطها.",
      },
    ],
    closingLabel: "خطوتك القادمة تبدأ من هنا",
    closingTitle: "قدّامك فرص أكثر مما بتتخيل.",
    closingText:
      "خصص وقتًا لمستقبلك. اكتشف دورة جديدة، وتعلّم شيئًا قيّمًا، وخذ خطوة أخرى نحو المستقبل الذي تطمح إليه.",
    closingAction: "ابدأ الاستكشاف",
    closingContact: "عندك سؤال؟ تواصل معنا",
  },
} as const;

async function getCategories(): Promise<Category[]> {
  const baseUrl = (
    process.env.API_BASE_URL || "http://localhost:5299"
  ).replace(/\/+$/, "");

  try {
    const response = await fetch(`${baseUrl}/api/categories`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return [];

    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter(
        (item): item is Category =>
          item !== null &&
          typeof item === "object" &&
          Number.isSafeInteger(item.id) &&
          typeof item.name === "string" &&
          typeof item.slug === "string" &&
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(item.slug) &&
          item.isActive === true &&
          (item.parentCategoryId === null ||
            typeof item.parentCategoryId === "number")
      )
      .sort((a, b) => {
        if (a.parentCategoryId === null && b.parentCategoryId !== null)
          return -1;
        if (a.parentCategoryId !== null && b.parentCategoryId === null)
          return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "ar" && locale !== "en") return {};

  return {
    title:
      locale === "ar"
        ? "CrestMark Academy | تعلّم واصنع مستقبلك"
        : "CrestMark Academy | Learn. Create. Advance.",
    description:
      locale === "ar"
        ? "استكشف دورات CrestMark Academy وطوّر مهاراتك من خلال تجربة تعليمية منظمة."
        : "Discover online courses and practical learning experiences at CrestMark Academy.",
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", ar: "/ar" },
    },
  };
}

function CategoriesShowcase({
  categories,
  locale,
}: {
  categories: Category[];
  locale: Locale;
}) {
  const t = copy[locale];

  return (
    <section className={styles.categoriesSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.kicker}>
              01 / {t.discoverLabel}
            </span>
            <h2>{t.discoverTitle}</h2>
            <p>{t.discoverText}</p>
          </div>

          <Link
            href={`/${locale}/categories`}
            className={styles.inlineLink}
          >
            {t.allCategories}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className={styles.categoryCollection}>
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/${locale}/categories/${encodeURIComponent(category.slug)}`}
                className={styles.categoryTile}
              >
                <div className={styles.categoryTileTop}>
                  <span>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.categoryArrow} aria-hidden="true">
                    ↗
                  </span>
                </div>
                <strong>{category.name}</strong>
                <span className={styles.categoryTileBottom}>
                  CRESTMARK / LEARNING AREA
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <Link
            href={`/${locale}/categories`}
            className={styles.categoriesEmpty}
          >
            {t.categoryFallback} ↗
          </Link>
        )}
      </div>
    </section>
  );
}

export default async function LocalizedHome({
  params,
}: Props) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "ar") notFound();

  const locale: Locale = rawLocale;
  const t = copy[locale];
  const categories = await getCategories();

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* 01 — HERO */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroLayout}>
            <div className={styles.heroContent}>
              <div className={styles.heroEyebrow}>
                <span />
                {t.heroLabel}
              </div>

              <h1>
                <span>{t.headline}</span>
                <em>{t.headlineEmphasis}</em>
              </h1>

              <p className={styles.heroDescription}>
                {t.heroDescription}
              </p>

              <div className={styles.heroActions}>
                <Link
                  className={styles.primaryButton}
                  href={`/${locale}/courses`}
                >
                  {t.explore}
                  <span aria-hidden="true">↗</span>
                </Link>

                <Link
                  className={styles.secondaryButton}
                  href={`/${locale}/about`}
                >
                  {t.about}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className={styles.heroFootnote}>
                <span className={styles.brandIcon}>C</span>
                <span>CRESTMARK ACADEMY</span>
                <span className={styles.footnoteDivider} />
                <span>LEARN · BUILD · ADVANCE</span>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div
                className={styles.heroMainPhoto}
                role="img"
                aria-label={
                  locale === "ar"
                    ? "طلاب يدرسون ويتعاونون معًا"
                    : "Students learning and collaborating"
                }
              />
              <div
                className={styles.heroSidePhoto}
                role="img"
                aria-label={
                  locale === "ar"
                    ? "متعلم يستخدم حاسوبًا محمولًا"
                    : "Learner using a laptop"
                }
              />

              <div className={styles.heroPhotoBadge}>
                <span className={styles.badgeLine} />
                {t.photoTag}
              </div>

              <div className={styles.heroFloatingCard}>
                <span className={styles.floatingIcon}>✦</span>
                <div>
                  <strong>CRESTMARK ACADEMY</strong>
                  <span>{t.floatingLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — INTRO STATEMENT */}
      <section className={styles.introStatement}>
        <div className={styles.container}>
          <div className={styles.introLayout}>
            <span className={styles.kicker}>
              {t.introLabel}
            </span>
            <div>
              <h2>{t.introTitle}</h2>
              <p>{t.introText}</p>
            </div>
            <span className={styles.introSymbol} aria-hidden="true">
              ✳
            </span>
          </div>
        </div>
      </section>

      {/* 03 — LIVE CATEGORIES */}
      <CategoriesShowcase categories={categories} locale={locale} />

      {/* 04 — FEATURED COURSES */}
      <section className={styles.coursesArea}>
        <div className={styles.coursesAreaTop}>
          <span className={styles.kicker}>
            02 / {t.featuredLabel}
          </span>
        </div>
        <Suspense fallback={null}>
          <FeaturedCourses locale={locale} />
        </Suspense>
      </section>

      {/* 05 — EDITORIAL LEARNING SECTION */}
      <section className={styles.learningSection}>
        <div className={styles.container}>
          <div className={styles.learningLayout}>
            <div className={styles.learningGallery}>
              <div
                className={styles.learningPhotoLarge}
                role="img"
                aria-label={
                  locale === "ar"
                    ? "مساحة تعليمية حديثة"
                    : "Modern collaborative learning environment"
                }
              />
              <div
                className={styles.learningPhotoSmall}
                role="img"
                aria-label={
                  locale === "ar"
                    ? "طالب يتعلم باستخدام الحاسوب"
                    : "Student learning with a computer"
                }
              />
              <div className={styles.learningGalleryCaption}>
                <strong>LEARNING IS A JOURNEY.</strong>
                <span>CRESTMARK / ACADEMY</span>
              </div>
            </div>

            <div className={styles.learningContent}>
              <span className={styles.kicker}>
                03 / {t.learningLabel}
              </span>
              <h2>{t.learningTitle}</h2>
              <p className={styles.learningLead}>
                {t.learningText}
              </p>

              <div className={styles.learningFeatures}>
                {t.learningFeatures.map((feature) => (
                  <div
                    key={feature.number}
                    className={styles.learningFeature}
                  >
                    <span>{feature.number}</span>
                    <div>
                      <h3>{feature.title}</h3>
                      <p>{feature.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 06 — PERSONAL LEARNING EXPERIENCE */}
      <section className={styles.experienceSection}>
        <div className={styles.container}>
          <div className={styles.experienceLayout}>
            <div className={styles.experienceContent}>
              <span className={styles.kicker}>
                04 / {t.experienceLabel}
              </span>
              <h2>{t.experienceTitle}</h2>
              <p>{t.experienceText}</p>

              <ul className={styles.experienceList}>
                {t.experienceItems.map((item) => (
                  <li key={item}>
                    <span aria-hidden="true">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href={`/${locale}/about`}
                className={styles.darkButton}
              >
                {t.experienceLink}
                <span aria-hidden="true">↗</span>
              </Link>
            </div>

            <div className={styles.experienceVisual}>
              <div
                className={styles.experiencePhoto}
                role="img"
                aria-label={
                  locale === "ar"
                    ? "شخص يتعلم عبر الحاسوب المحمول"
                    : "Person learning through a laptop"
                }
              />
              <div className={styles.experienceCaption}>
                <span>01 / DISCOVER</span>
                <span>02 / LEARN</span>
                <span>03 / PROGRESS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 07 — TECHNOLOGY */}
      <section className={styles.technologySection}>
        <div className={styles.technologyVisual}>
          <div
            className={styles.technologyPhoto}
            role="img"
            aria-label={
              locale === "ar"
                ? "حواسيب وشاشات تستخدم في تطوير البرمجيات"
                : "Computer screens in a software development workspace"
            }
          />
          <span className={styles.technologyPhotoLabel}>
            DISCOVER · DEVELOP · BUILD
          </span>
        </div>

        <div className={styles.technologyContent}>
          <span className={styles.kicker}>
            05 / {t.technologyLabel}
          </span>
          <h2>{t.technologyTitle}</h2>
          <p>{t.technologyText}</p>
          <Link href={`/${locale}/categories`}>
            {t.technologyAction}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      {/* 08 — STUDENT JOURNEY */}
      <section className={styles.journeySection}>
        <div className={styles.container}>
          <div className={styles.journeyHeading}>
            <span className={styles.kicker}>
              06 / {t.journeyLabel}
            </span>
            <h2>{t.journeyTitle}</h2>
          </div>

          <div className={styles.journeySteps}>
            {t.journeySteps.map((step, index) => (
              <div className={styles.journeyStep} key={step.title}>
                <span className={styles.stepNumber}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 09 — FINAL CTA */}
      <section className={styles.closingSection}>
        <div className={styles.container}>
          <div className={styles.closingPanel}>
            <div className={styles.closingImage} aria-hidden="true" />
            <div className={styles.closingContent}>
              <span className={styles.closingEyebrow}>
                {t.closingLabel}
              </span>
              <h2>{t.closingTitle}</h2>
              <p>{t.closingText}</p>

              <div className={styles.closingActions}>
                <Link
                  href={`/${locale}/courses`}
                  className={styles.closingPrimary}
                >
                  {t.closingAction}
                  <span aria-hidden="true">↗</span>
                </Link>

                <Link
                  href={`/${locale}/contact`}
                  className={styles.closingSecondary}
                >
                  {t.closingContact}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
