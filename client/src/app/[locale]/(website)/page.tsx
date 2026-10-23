import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import FeaturedCourses from "@/components/FeaturedCourses";
import HomeMotion from "./HomeMotion";
import { HeroCanvas, LearningConsole } from "./HomeInteractive";
import styles from "./page.module.css";

export const instant = false;

type Locale = "en" | "ar";
type Props = { params: Promise<{ locale: string }> };
type Category = {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  parentCategoryId: number | null;
};

const messages = {
  en: {
    eyebrow: "CRESTMARK / THE LEARNING PLATFORM",
    lead: "Learn the skill.",
    emphasis: "Build what’s next.",
    heroText: "Not another place to collect videos. A better place to start, stay curious, and turn every lesson into momentum.",
    courses: "Explore courses",
    story: "The CrestMark approach",
    heroAside: "START WITH CURIOSITY / LEAVE WITH CAPABILITY",
    scroll: "SCROLL TO EXPLORE",
    ticker: ["DESIGN YOUR DIRECTION", "LEARN BY DOING", "KEEP MOVING", "BUILD SOMETHING REAL"],
    philosophyKicker: "01 / OUR POINT OF VIEW",
    philosophyStart: "Nobody builds a future",
    philosophyEmphasis: "by standing still.",
    philosophyCopy: "Small lessons. Clear direction. Skills you can come back to. We make room for the part of learning that matters most: actually doing it.",
    philosophySide: "LESS SCROLLING. MORE MAKING.",
    catalogKicker: "02 / FIND YOUR FIELD",
    catalogTitle: "Choose a direction.\nMake it yours.",
    catalogCopy: "Follow an interest into something useful. These are the areas available to explore on CrestMark today.",
    catalogLink: "All learning areas",
    catalogEmpty: "Explore our learning areas",
    exploreArea: "EXPLORE FIELD",
    featuredKicker: "03 / SELECTED FOR YOUR NEXT MOVE",
    featuredTitle: "Something worth\nlearning next.",
    featuredCopy: "Real courses from our catalog. Find one that changes what you can do.",
    consoleKicker: "04 / THE LEARNING ROOM",
    consoleTitle: "Learning should\nfeel like progress.",
    consoleText: "Explore the stages of a learning journey. Choose a chapter and see how each step connects to the next.",
    showcaseKicker: "05 / BUILT FOR THE PROCESS",
    showcaseTitle: "A place to return to,\nnot just pass through.",
    showcaseText: "Find your lessons, see what you’ve finished, pick up where you stopped, and work toward your next milestone — in one learning space.",
    showcaseButton: "Discover our story",
    journeyKicker: "06 / HOW IT WORKS",
    journeyTitle: "Three moves. Your direction.",
    steps: [
      {num:"01", title:"Find your interest", description:"Explore fields and choose a course that feels right for you."},
      {num:"02", title:"Get into the work", description:"Learn through organized sections and focused lessons."},
      {num:"03", title:"Keep the momentum", description:"Return to your progress, complete your lessons, and unlock an eligible certificate."},
    ],
    endEyebrow: "THE NEXT CHAPTER IS YOURS",
    endTitle: "You don’t have to\nknow everything.",
    endHighlight: "You just have to begin.",
    endCopy: "The best next step is the one you actually take.",
    endAction: "Discover your first course",
    contact: "Have a question? Get in touch",
    imageAlt: "A creative professional working at a laptop",
  },
  ar: {
    eyebrow: "CRESTMARK / منصتك للتعلّم",
    lead: "تعلّم المهارة.",
    emphasis: "وابنِ خطوتك الجاية.",
    heroText: "مش مجرد مكان تجمع فيه فيديوهات. مساحة تبدأ منها، وتكتشف فيها الجديد، وتحول كل درس لخطوة حقيقية لقدّام.",
    courses: "استكشف الدورات",
    story: "تعرّف على CrestMark",
    heroAside: "ابدأ بالفضول / وكمّل بالمهارة",
    scroll: "انزل واستكشف",
    ticker: ["اصنع اتجاهك", "تعلّم بالتطبيق", "كمّل طريقك", "ابنِ شيئًا حقيقيًا"],
    philosophyKicker: "01 / رؤيتنا للتعلّم",
    philosophyStart: "المستقبل ما بينبنى",
    philosophyEmphasis: "وإنت واقف مكانك.",
    philosophyCopy: "دروس واضحة، وخطوات منظمة، ومهارات ترجع تطورها في أي وقت. بنهتم بالجزء الأهم من التعلّم: إنك تطبّق اللي بتتعلمه.",
    philosophySide: "أقل تصفّح. أكثر إنجاز.",
    catalogKicker: "02 / اكتشف مجالك",
    catalogTitle: "اختَر اتجاهك.\nوخليه إلك.",
    catalogCopy: "ابدأ من مجال بشدّ اهتمامك، وخليه يتحول لمهارة مفيدة. هاي المجالات المتاحة حاليًا في CrestMark.",
    catalogLink: "كل التصنيفات",
    catalogEmpty: "استكشف المجالات التعليمية",
    exploreArea: "استكشف المجال",
    featuredKicker: "03 / دورات تستحق وقتك",
    featuredTitle: "في إشي جديد\nممكن تتعلمه.",
    featuredCopy: "دورات حقيقية من مكتبتنا. اختَر اللي يضيف لقدراتك خطوة جديدة.",
    consoleKicker: "04 / مساحة التعلّم",
    consoleTitle: "التعلّم لازم\nتحس فيه بالتقدّم.",
    consoleText: "استكشف مراحل رحلة التعلّم. اختَر مرحلة وشوف كيف كل خطوة بتوصلك للّي بعدها.",
    showcaseKicker: "05 / تجربة بتكمل معك",
    showcaseTitle: "مكان ترجع إله،\nمش مجرد صفحة تمرّ عليها.",
    showcaseText: "دروسك وتقدمك وآخر نقطة وصلت إلها ومراحل إنجازك، كلها بمساحة تعليمية واحدة ومنظمة.",
    showcaseButton: "تعرّف على قصتنا",
    journeyKicker: "06 / كيف تبدأ",
    journeyTitle: "ثلاث خطوات. وإنت بتحدد الطريق.",
    steps: [
      {num:"01", title:"اكتشف اهتمامك", description:"استكشف المجالات واختَر دورة بتناسب الهدف اللي بدك توصله."},
      {num:"02", title:"ادخل بالتجربة", description:"تعلّم من أقسام منظمة ودروس واضحة خطوة بخطوة."},
      {num:"03", title:"كمّل التقدّم", description:"ارجع لدروسك، وتابع إنجازك، واحصل على شهادة عند استيفاء شروطها."},
    ],
    endEyebrow: "الفصل الجاي بإيدك",
    endTitle: "مش لازم تعرف\nكل إشي من البداية.",
    endHighlight: "المهم إنك تبدأ.",
    endCopy: "أفضل خطوة جاية هي الخطوة اللي بتقرر تاخذها اليوم.",
    endAction: "استكشف أول دورة إلك",
    contact: "عندك سؤال؟ احكي معنا",
    imageAlt: "شخص يعمل على حاسوب محمول في مساحة إبداعية",
  },
} as const;

async function getCategories(): Promise<Category[]> {
  const baseUrl = (process.env.API_BASE_URL || "http://localhost:5299").replace(/\/+$/, "");
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
      .filter((entry): entry is Category =>
        entry !== null && typeof entry === "object" &&
        Number.isSafeInteger(entry.id) && entry.id > 0 &&
        typeof entry.name === "string" &&
        typeof entry.slug === "string" &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(entry.slug) &&
        entry.isActive === true &&
        (entry.parentCategoryId === null || typeof entry.parentCategoryId === "number")
      )
      .sort((a, b) => {
        if (a.parentCategoryId === null && b.parentCategoryId !== null) return -1;
        if (a.parentCategoryId !== null && b.parentCategoryId === null) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  } catch { return []; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en" && locale !== "ar") return {};
  return {
title:
  locale === "ar"
    ? "دورات برمجة وتكنولوجيا أونلاين"
    : "Online Programming & Technology Courses",    
description:
  locale === "ar"
    ? "تعلّم البرمجة وتطوير الويب وقواعد البيانات عبر دورات عملية في CrestMark. تابع دروسك، راقب تقدمك، وطوّر مهاراتك خطوة بخطوة."
    : "Learn programming, web development and databases through practical online courses at CrestMark. Follow structured lessons, track progress and build real skills.",

    alternates: { canonical: `/${locale}`, languages: { en: "/en", ar: "/ar" } },
  };
}

export default async function LocalizedHome({ params }: Props) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "en" && rawLocale !== "ar") notFound();
  const locale: Locale = rawLocale;
  const t = messages[locale];
  const categories = await getCategories();

  return (
    <HomeMotion locale={locale}>
      {/* HERO: fully independent and scoped. */}
      <section className={styles.hero} aria-labelledby="home-hero-heading">
        <div className={styles.heroAmbient} aria-hidden="true" />
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrowLight}><span className={styles.blueDash} />{t.eyebrow}</p>
            <h1 id="home-hero-heading" className={styles.heroTitle}>
              <span>{t.lead}</span><em>{t.emphasis}</em>
            </h1>
            <p className={styles.heroDescription}>{t.heroText}</p>
            <div className={styles.heroButtons}>
              <Link href={`/${locale}/courses`} className={styles.heroPrimary}>{t.courses}<span aria-hidden="true">↗</span></Link>
              <Link href={`/${locale}/about`} className={styles.heroSecondary}>{t.story}<span aria-hidden="true">↗</span></Link>
            </div>
            <div className={styles.heroBottom}><span>CM—001 / 026</span><span>{t.heroAside}</span></div>
          </div>
          <HeroCanvas locale={locale} />
        </div>
        <div className={styles.heroScroll}><span aria-hidden="true" />{t.scroll}</div>
      </section>

      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.marqueeTrack}>
          {[0, 1].map((loop) => (
            <div className={styles.marqueeSet} key={loop}>
              {t.ticker.map((phrase) => <span key={`${loop}-${phrase}`}>{phrase}<b>✳</b></span>)}
            </div>
          ))}
        </div>
      </div>

      {/* Editorial manifesto */}
      <section className={styles.manifesto}>
        <div className={styles.container}>
          <div className={styles.sectionOverline} data-cm-reveal><span>{t.philosophyKicker}</span><span>CRESTMARK / MANIFESTO</span></div>
          <div className={styles.manifestoGrid}>
            <h2 className={styles.manifestoTitle} data-cm-reveal>{t.philosophyStart}<em>{t.philosophyEmphasis}</em></h2>
            <div className={styles.manifestoAside} data-cm-reveal>
              <div className={styles.asterisk} aria-hidden="true">✳</div>
              <p>{t.philosophyCopy}</p><small>{t.philosophySide}</small>
            </div>
          </div>
        </div>
      </section>

      {/* Categories: true API-backed data, no fake topics. */}
      <section className={styles.categories} id="home-fields">
        <div className={styles.container}>
          <div className={styles.categoryIntro} data-cm-reveal>
            <div><p className={styles.eyebrow}>{t.catalogKicker}</p><h2 className={styles.sectionHeading}>{t.catalogTitle}</h2></div>
            <div className={styles.categoryIntroAside}><p>{t.catalogCopy}</p><Link href={`/${locale}/categories`} className={styles.textLink}>{t.catalogLink}<span aria-hidden="true">↗</span></Link></div>
          </div>
          {categories.length ? (
            <div className={styles.categoryList}>
              {categories.map((category, index) => (
                <Link key={category.id} href={`/${locale}/categories/${encodeURIComponent(category.slug)}`} className={styles.categoryRow} data-cm-reveal>
                  <span className={styles.categoryIndex}>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{category.name}</strong>
                  <span className={styles.categoryCaption}>{t.exploreArea}</span>
                  <span className={styles.categoryArrow} aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          ) : (
            <Link href={`/${locale}/categories`} className={styles.categoryEmpty}>{t.catalogEmpty}<span aria-hidden="true">↗</span></Link>
          )}
        </div>
      </section>

      {/* Existing live course component stays intact. */}
      <section className={styles.featured}>
        <div className={styles.container}>
          <div className={styles.featuredHeading} data-cm-reveal><div><p className={styles.eyebrow}>{t.featuredKicker}</p><h2 className={styles.sectionHeading}>{t.featuredTitle}</h2></div><p>{t.featuredCopy}</p></div>
        </div>
        <div className={styles.featuredContent}>
          <Suspense fallback={<div className={styles.featuredLoading} aria-hidden="true" />}><FeaturedCourses locale={locale} /></Suspense>
        </div>
      </section>

      <section className={styles.consoleSection}>
        <div className={styles.container}>
          <div className={styles.consoleIntro} data-cm-reveal><div><p className={styles.eyebrowLight}>{t.consoleKicker}</p><h2 className={styles.sectionHeading}>{t.consoleTitle}</h2></div><p>{t.consoleText}</p></div>
          <LearningConsole locale={locale} />
        </div>
      </section>

      {/* Photo/text pair with explicit grid dimensions; fixes broken half-panel. */}
      <section className={styles.showcase}>
        <div className={styles.showcaseImage} role="img" aria-label={t.imageAlt}><div className={styles.showcaseImageTag}>CRESTMARK / ON YOUR TERMS</div></div>
        <div className={styles.showcaseCopy} data-cm-reveal>
          <p className={styles.eyebrow}>{t.showcaseKicker}</p>
          <h2 className={styles.sectionHeading}>{t.showcaseTitle}</h2>
          <p>{t.showcaseText}</p>
          <Link href={`/${locale}/about`} className={styles.darkLink}>{t.showcaseButton}<span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className={styles.journey}>
        <div className={styles.container}>
          <div className={styles.journeyIntro} data-cm-reveal><p className={styles.eyebrow}>{t.journeyKicker}</p><h2 className={styles.sectionHeading}>{t.journeyTitle}</h2></div>
          <div className={styles.journeyGrid}>
            {t.steps.map((step) => <div key={step.num} className={styles.journeyStep} data-cm-reveal><span className={styles.journeyNumber}>{step.num}</span><div className={styles.journeyRule} aria-hidden="true"/><h3>{step.title}</h3><p>{step.description}</p></div>)}
          </div>
        </div>
      </section>

      {/* Independent full-width outro. No overlap with showcase image. */}
      <section className={styles.outro}>
        <div className={styles.outroPattern} aria-hidden="true" />
        <div className={`${styles.container} ${styles.outroInner}`} data-cm-reveal>
          <span className={styles.outroKicker}>{t.endEyebrow}</span>
          <h2>{t.endTitle}<em>{t.endHighlight}</em></h2>
          <p>{t.endCopy}</p>
          <div className={styles.outroActions}><Link href={`/${locale}/courses`} className={styles.outroPrimary}>{t.endAction}<span aria-hidden="true">↗</span></Link><Link href={`/${locale}/contact`} className={styles.outroSecondary}>{t.contact}</Link></div>
        </div>
      </section>
    </HomeMotion>
  );
}
