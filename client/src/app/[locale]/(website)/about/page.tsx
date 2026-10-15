
import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

type Props = {
  params: Promise<{ locale: string }>;
};

const messages = {
  en: {
    breadcrumb: "About us",
    eyebrow: "THE CRESTMARK STORY",
    heroTitleOne: "Knowledge opens doors.",
    heroTitleTwo: "Skills move you forward.",
    heroDescription:
      "CrestMark Academy is an online learning platform built for people who want to learn with direction, develop meaningful skills, and take ownership of their progress.",
    heroAction: "Explore courses",
    heroSecondary: "Discover our approach",
    heroCaption: "A space for ambitious learners.",
    introLabel: "01 / OUR STORY",
    introKicker: "MORE THAN A COLLECTION OF COURSES",
    introTitle: "Learning deserves a clearer direction.",
    introBodyOne:
      "The internet offers more information than ever before. But finding a clear path through it can still be difficult.",
    introBodyTwo:
      "CrestMark Academy brings learning into one organized experience: discover courses, follow structured lessons, return to where you left off, and see how far you've come.",
    introQuote:
      "We believe learning should feel like progress, not just consumption.",
    approachLabel: "02 / OUR APPROACH",
    approachTitle: "Designed around the way people learn.",
    approachDescription:
      "A thoughtful learning experience is built from the details. We focus on clarity, consistency, and giving learners room to develop at their own pace.",
    pillars: [
      {
        number: "01",
        title: "Clarity before complexity",
        description:
          "Organized courses and lessons make it easier to understand where to begin and what comes next.",
      },
      {
        number: "02",
        title: "Progress with purpose",
        description:
          "Follow your learning journey with completed lessons, course progress, and a place to return.",
      },
      {
        number: "03",
        title: "Freedom to keep learning",
        description:
          "Build your knowledge at a pace that works with your commitments, interests, and goals.",
      },
    ],
    directionLabel: "03 / WHERE WE'RE HEADED",
    directionEyebrow: "OUR DIRECTION",
    directionTitle: "Rooted in technology. Open to possibility.",
    directionDescription:
      "Our journey begins with software development and technology: practical subjects that help people understand, create, and solve problems.",
    directionDescriptionTwo:
      "As CrestMark Academy grows, our aim is to welcome new disciplines, learning paths, and opportunities to explore.",
    focusTitle: "Our starting areas",
    focusAreas: [
      "Programming",
      "Web development",
      "APIs and backend systems",
      "Databases",
    ],
    experienceLabel: "04 / THE EXPERIENCE",
    experienceTitle: "One learning journey. Four simple steps.",
    steps: [
      {
        number: "01",
        title: "Discover",
        description: "Explore subjects and find a course that interests you.",
      },
      {
        number: "02",
        title: "Begin",
        description: "Enroll and access your available learning materials.",
      },
      {
        number: "03",
        title: "Progress",
        description: "Follow lessons, track completion, and keep going.",
      },
      {
        number: "04",
        title: "Achieve",
        description:
          "Finish your learning path and access a certificate when eligible.",
      },
    ],
    statementLabel: "OUR AMBITION",
    statementTitle: "Build a place where curiosity becomes capability.",
    statementDescription:
      "We are developing CrestMark Academy step by step, with the ambition to create a dependable and welcoming home for learners across different fields.",
    statementSignature: "CRESTMARK ACADEMY",
    ctaLabel: "YOUR NEXT CHAPTER",
    ctaTitle: "Where could learning take you?",
    ctaDescription:
      "Explore what is available today and take your next step with CrestMark Academy.",
    ctaPrimary: "Browse courses",
    ctaSecondary: "Explore categories",
    home: "Home",
    imageAlt:
      "Students learning together in a bright collaborative study environment",
    studyAlt:
      "A modern desk with a laptop in a focused learning workspace",
  },
  ar: {
    breadcrumb: "من نحن",
    eyebrow: "قصة CRESTMARK",
    heroTitleOne: "المعرفة تفتح الأبواب.",
    heroTitleTwo: "والمهارات تصنع الفرق.",
    heroDescription:
      "CrestMark Academy منصة تعليم إلكتروني صُممت لكل شخص يسعى للتعلّم بوضوح، وتطوير مهارات حقيقية، ومتابعة تقدمه خطوة بخطوة.",
    heroAction: "استكشف الدورات",
    heroSecondary: "تعرّف على منهجيتنا",
    heroCaption: "مساحة للمتعلمين الطموحين.",
    introLabel: "01 / قصتنا",
    introKicker: "أكثر من مجرد مجموعة دورات",
    introTitle: "التعلّم يستحق مسارًا أوضح.",
    introBodyOne:
      "المعرفة متاحة اليوم أكثر من أي وقت مضى، لكن الوصول إلى مسار تعليمي واضح ومناسب ليس دائمًا سهلًا.",
    introBodyTwo:
      "في CrestMark Academy نعمل على جمع رحلة التعلّم في تجربة منظمة: استكشف الدورات، وتابع الدروس، وارجع إلى آخر نقطة وصلت إليها، وشاهد تقدمك بوضوح.",
    introQuote:
      "نؤمن أن التعلّم الحقيقي يجب أن يقود إلى التقدم، لا إلى استهلاك المعلومات فقط.",
    approachLabel: "02 / منهجيتنا",
    approachTitle: "تجربة مصممة حول احتياجات المتعلم.",
    approachDescription:
      "التجربة التعليمية الجيدة تبدأ من التفاصيل. لهذا نركز على الوضوح والتنظيم والمرونة، حتى يتعلم كل شخص بالوتيرة المناسبة له.",
    pillars: [
      {
        number: "01",
        title: "الوضوح قبل التعقيد",
        description:
          "دورات ودروس منظمة تساعدك على معرفة نقطة البداية والخطوة التالية.",
      },
      {
        number: "02",
        title: "تقدم له معنى",
        description:
          "تابع الدروس التي أكملتها، ونسبة تقدمك، وارجع إلى تعلمك بسهولة.",
      },
      {
        number: "03",
        title: "مرونة في التعلّم",
        description:
          "طوّر معرفتك في الوقت الذي يناسب التزاماتك واهتماماتك وأهدافك.",
      },
    ],
    directionLabel: "03 / توجهنا",
    directionEyebrow: "توجهنا التعليمي",
    directionTitle: "نبدأ بالتكنولوجيا. ونفتح المجال للمستقبل.",
    directionDescription:
      "تنطلق رحلتنا من البرمجة وتطوير البرمجيات والتكنولوجيا، وهي مجالات تساعد المتعلم على الفهم والبناء وحل المشكلات.",
    directionDescriptionTwo:
      "ومع تطور CrestMark Academy، نطمح إلى إضافة تخصصات ومسارات تعليمية جديدة تخدم اهتمامات متنوعة.",
    focusTitle: "مجالات البداية",
    focusAreas: [
      "البرمجة",
      "تطوير الويب",
      "واجهات API والأنظمة الخلفية",
      "قواعد البيانات",
    ],
    experienceLabel: "04 / رحلة التعلّم",
    experienceTitle: "رحلة تعليمية واحدة. أربع خطوات واضحة.",
    steps: [
      {
        number: "01",
        title: "اكتشف",
        description: "استكشف المجالات واختر الدورة التي تناسب اهتمامك.",
      },
      {
        number: "02",
        title: "ابدأ",
        description: "التحق بالدورة وادخل إلى المحتوى المتاح لك.",
      },
      {
        number: "03",
        title: "تقدّم",
        description: "تابع دروسك، وسجّل إنجازاتك، وواصل التعلّم.",
      },
      {
        number: "04",
        title: "أنجز",
        description:
          "أكمل مسارك واحصل على شهادة عند استيفاء شروط إصدارها.",
      },
    ],
    statementLabel: "طموحنا",
    statementTitle: "بناء مساحة تتحول فيها الرغبة بالتعلّم إلى مهارات.",
    statementDescription:
      "نطوّر CrestMark Academy تدريجيًا، بطموح بناء وجهة تعليمية موثوقة ومرحّبة بالمتعلمين من مختلف المجالات.",
    statementSignature: "CRESTMARK ACADEMY",
    ctaLabel: "خطوتك القادمة",
    ctaTitle: "إلى أين يمكن أن يقودك التعلّم؟",
    ctaDescription:
      "استكشف الدورات المتاحة اليوم، وابدأ خطوتك التالية مع CrestMark Academy.",
    ctaPrimary: "تصفح الدورات",
    ctaSecondary: "استكشف التصنيفات",
    home: "الرئيسية",
    imageAlt: "طلاب يتعلّمون معًا داخل مساحة دراسية حديثة ومضيئة",
    studyAlt: "مساحة دراسة حديثة تحتوي على حاسوب محمول",
  },
} as const;

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = raw === "ar" ? "ar" : "en";

  return {
    title:
      locale === "ar"
        ? "من نحن | CrestMark Academy"
        : "About Us | CrestMark Academy",
    description:
      locale === "ar"
        ? "تعرّف على CrestMark Academy، منصتنا للتعليم الإلكتروني ورؤيتنا لتجربة تعلم أكثر تنظيمًا ومرونة."
        : "Explore the story, learning approach, and ambition behind CrestMark Academy.",
    alternates: {
      canonical: `/${locale}/about`,
      languages: {
        en: "/en/about",
        ar: "/ar/about",
      },
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = raw === "ar" ? "ar" : "en";
  const t = messages[locale];

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href={`/${locale}`}>{t.home}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{t.breadcrumb}</span>
        </nav>

        {/* HERO */}
        <header className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>
              <span className={styles.eyebrowLine} />
              {t.eyebrow}
            </span>

            <h1>
              <span>{t.heroTitleOne}</span>
              <em>{t.heroTitleTwo}</em>
            </h1>

            <p className={styles.heroDescription}>
              {t.heroDescription}
            </p>

            <div className={styles.heroActions}>
              <Link
                href={`/${locale}/courses`}
                className={styles.primaryButton}
              >
                {t.heroAction}
                <span aria-hidden="true">↗</span>
              </Link>

              <a
                href="#our-approach"
                className={styles.outlineButton}
              >
                {t.heroSecondary}
                <span aria-hidden="true">↓</span>
              </a>
            </div>

            <div className={styles.heroFootnote}>
              <span className={styles.footnoteSquare}>C</span>
              <span>{t.heroCaption}</span>
            </div>
          </div>

          <div className={styles.heroMedia}>
            <div
              className={styles.heroPhoto}
              role="img"
              aria-label={t.imageAlt}
            />
            <div className={styles.mediaTopLabel}>
              <span>CRESTMARK</span>
              <span>ACADEMY / EST. 2026</span>
            </div>
            <div className={styles.mediaBottomLabel}>
              <span>LEARN.</span>
              <span>BUILD.</span>
              <span>ADVANCE.</span>
            </div>
          </div>
        </header>

        {/* INTRODUCTION */}
        <section className={styles.introduction}>
          <div className={styles.sectionMarker}>
            <span>{t.introLabel}</span>
          </div>

          <div className={styles.introductionBody}>
            <span className={styles.overline}>{t.introKicker}</span>
            <h2>{t.introTitle}</h2>

            <div className={styles.introColumns}>
              <p>{t.introBodyOne}</p>
              <p>{t.introBodyTwo}</p>
            </div>

            <blockquote className={styles.quote}>
              <span aria-hidden="true">“</span>
              <p>{t.introQuote}</p>
            </blockquote>
          </div>
        </section>

        {/* APPROACH */}
        <section className={styles.approach} id="our-approach">
          <div className={styles.sectionMarker}>
            <span>{t.approachLabel}</span>
          </div>

          <div className={styles.approachContent}>
            <div className={styles.approachHeading}>
              <h2>{t.approachTitle}</h2>
              <p>{t.approachDescription}</p>
            </div>

            <div className={styles.pillars}>
              {t.pillars.map((pillar) => (
                <article className={styles.pillar} key={pillar.number}>
                  <span className={styles.pillarIndex}>
                    {pillar.number}
                  </span>
                  <div>
                    <h3>{pillar.title}</h3>
                    <p>{pillar.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* DIRECTION */}
        <section className={styles.direction}>
          <div className={styles.directionPhoto}>
            <div
              className={styles.studyPhoto}
              role="img"
              aria-label={t.studyAlt}
            />
            <span className={styles.photoCredit}>
              CRESTMARK / LEARNING & DEVELOPMENT
            </span>
          </div>

          <div className={styles.directionContent}>
            <span className={styles.sectionLabel}>
              {t.directionLabel}
            </span>
            <span className={styles.directionOverline}>
              {t.directionEyebrow}
            </span>
            <h2>{t.directionTitle}</h2>
            <p>{t.directionDescription}</p>
            <p>{t.directionDescriptionTwo}</p>

            <div className={styles.focusList}>
              <h3>{t.focusTitle}</h3>

              {t.focusAreas.map((area, index) => (
                <div className={styles.focusItem} key={area}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{area}</strong>
                  <span aria-hidden="true">↗</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STUDENT JOURNEY */}
        <section className={styles.experience}>
          <div className={styles.experienceIntro}>
            <span className={styles.sectionLabel}>
              {t.experienceLabel}
            </span>
            <h2>{t.experienceTitle}</h2>
          </div>

          <div className={styles.steps}>
            {t.steps.map((step) => (
              <article className={styles.step} key={step.number}>
                <span className={styles.stepNumber}>
                  {step.number}
                </span>
                <div className={styles.stepContent}>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* BRAND STATEMENT */}
        <section className={styles.statement}>
          <div className={styles.statementContent}>
            <span className={styles.statementLabel}>
              {t.statementLabel}
            </span>
            <h2>{t.statementTitle}</h2>
            <p>{t.statementDescription}</p>
            <div className={styles.signature}>
              <span className={styles.signatureIcon}>C</span>
              <span>{t.statementSignature}</span>
            </div>
          </div>
          <div className={styles.statementWatermark} aria-hidden="true">
            C
          </div>
        </section>

        {/* FINAL CTA */}
        <section className={styles.finalCta}>
          <div>
            <span className={styles.overline}>
              {t.ctaLabel}
            </span>
            <h2>{t.ctaTitle}</h2>
            <p>{t.ctaDescription}</p>
          </div>

          <div className={styles.finalActions}>
            <Link
              className={styles.primaryButton}
              href={`/${locale}/courses`}
            >
              {t.ctaPrimary}
              <span aria-hidden="true">↗</span>
            </Link>

            <Link
              className={styles.finalSecondary}
              href={`/${locale}/categories`}
            >
              {t.ctaSecondary}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
