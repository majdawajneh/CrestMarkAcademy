"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Footer.module.css";

type Locale = "en" | "ar";

const copy = {
  en: {
    label: "CRESTMARK / THE NEXT STEP",
    titleA: "Good things start",
    titleB: "with one new skill.",
    lead: "Explore practical courses, make progress at your pace, and come back whenever you're ready for the next lesson.",
    explore: "Explore courses",
    contact: "Get in touch",
    brandText: "An independent learning platform for curious minds and practical skills.",
    navigation: "Explore",
    platform: "Learning",
    information: "Information",
    home: "Home",
    courses: "All courses",
    categories: "Learning areas",
    about: "About CrestMark",
    contactPage: "Contact us",
    verify: "Verify certificate",
    learning: "My learning",
    privacy: "Privacy policy",
    terms: "Terms of service",
    refunds: "Refund policy",
    cookies: "Cookie policy",
    rights: "All rights reserved.",
    madeFor: "DESIGNED FOR THE NEXT CHAPTER",
  },
  ar: {
    label: "CRESTMARK / الخطوة القادمة",
    titleA: "كل بداية جديدة",
    titleB: "تصنعها مهارة تتعلمها.",
    lead: "استكشف دورات عملية، وتقدّم بالوتيرة اللي بتناسبك، وارجع لدروسك وقت ما تحب.",
    explore: "استكشف الدورات",
    contact: "تواصل معنا",
    brandText: "منصة تعليمية مستقلة للمعرفة العملية وتطوير المهارات.",
    navigation: "استكشف",
    platform: "التعلّم",
    information: "معلومات مهمة",
    home: "الرئيسية",
    courses: "جميع الدورات",
    categories: "المجالات التعليمية",
    about: "عن CrestMark",
    contactPage: "تواصل معنا",
    verify: "التحقق من الشهادة",
    learning: "دوراتي",
    privacy: "سياسة الخصوصية",
    terms: "شروط الاستخدام",
    refunds: "سياسة الاسترجاع",
    cookies: "سياسة ملفات الارتباط",
    rights: "جميع الحقوق محفوظة.",
    madeFor: "صُمّمت للخطوة القادمة",
  },
} as const;

export default function Footer() {
  const pathname = usePathname();
  const locale: Locale = pathname === "/ar" || pathname.startsWith("/ar/") ? "ar" : "en";
  const t = copy[locale];
  const isHome = pathname === "/en" || pathname === "/ar";

  const groups = [
    {
      title: t.navigation,
      links: [
        { label: t.home, href: `/${locale}` },
        { label: t.courses, href: `/${locale}/courses` },
        { label: t.categories, href: `/${locale}/categories` },
        { label: t.about, href: `/${locale}/about` },
      ],
    },
    {
      title: t.platform,
      links: [
        { label: t.learning, href: `/${locale}/my-learning` },
        { label: t.verify, href: `/${locale}/verify-certificate` },
        { label: t.contactPage, href: `/${locale}/contact` },
      ],
    },
    {
      title: t.information,
      links: [
        { label: t.privacy, href: `/${locale}/legal/privacy` },
        { label: t.terms, href: `/${locale}/legal/terms` },
        { label: t.refunds, href: `/${locale}/legal/refunds` },
        { label: t.cookies, href: `/${locale}/legal/cookies` },
      ],
    },
  ];

  return (
    <footer className={styles.footer} dir={locale === "ar" ? "rtl" : "ltr"}>
      {!isHome && <div className={styles.topBand}>
        <div className={styles.container}>
          <div className={styles.ctaLayout}>
            <div className={styles.ctaContent}>
              <span className={styles.eyebrow}><span className={styles.rule} aria-hidden="true" />{t.label}</span>
              <h2>{t.titleA}<br /><em>{t.titleB}</em></h2>
              <p>{t.lead}</p>
              <div className={styles.ctaActions}>
                <Link className={styles.ctaPrimary} href={`/${locale}/courses`}>
                  {t.explore}<span aria-hidden="true">↗</span>
                </Link>
                <Link className={styles.ctaSecondary} href={`/${locale}/contact`}>
                  {t.contact}<span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            <div className={styles.ctaVisual} aria-hidden="true">
              <span className={styles.arcOne} />
              <span className={styles.arcTwo} />
              <span className={styles.arcThree} />
              <span className={styles.axisHorizontal} />
              <span className={styles.axisVertical} />
              <span className={styles.orbitDot} />
              <span className={styles.visualMark}>CM<span>.</span></span>
              <span className={styles.visualCaption}>01 / DISCOVER — 02 / LEARN — 03 / GROW</span>
            </div>
          </div>
        </div>
      </div>}

      <div className={styles.darkBase}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div className={styles.brandColumn}>
              <Link className={styles.brand} href={`/${locale}`} aria-label="CrestMark Home">
                <Image src="/crestmark-logo.png" width={2048} height={677} alt="CrestMark" className={styles.logo} />
              </Link>
              <p className={styles.brandText}>{t.brandText}</p>
              <span className={styles.brandCode}>CM / LEARN · CREATE · ADVANCE</span>
            </div>
            {groups.map((group) => (
              <nav className={styles.linkGroup} aria-label={group.title} key={group.title}>
                <h3>{group.title}</h3>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}><Link href={link.href}>{link.label}</Link></li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <div className={styles.footerWordmark} aria-hidden="true">CRESTMARK<span>®</span></div>
          <div className={styles.bottomBar}>
            <span>
              © 2026 CrestMark. {t.rights}
            </span>
            <span className={styles.bottomMotto}><span className={styles.smallDot} aria-hidden="true" />{t.madeFor}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
