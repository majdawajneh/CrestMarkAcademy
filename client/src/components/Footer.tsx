
import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

type Locale = "en" | "ar";

type Props = {
  locale: Locale;
};

const copy = {
  en: {
    description:
      "A thoughtfully built learning platform for curious minds. Discover structured courses, build practical knowledge, and follow your progress with purpose.",
    brandNote: "LEARN / BUILD / ADVANCE",
    explore: "Explore",
    courses: "All courses",
    categories: "Categories",
    learning: "For learners",
    myLearning: "My learning",
    certificates: "My certificates",
    verify: "Verify a certificate",
    company: "Company",
    about: "About CrestMark",
    contact: "Contact us",
    legal: "Legal & policies",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    cookies: "Cookie Policy",
    refunds: "Refunds & Cancellations",
    accessibility: "Accessibility",
    copyright: "All rights reserved.",
    languages: "Languages",
    closing: "Learning has no finish line.",
  },
  ar: {
    description:
      "منصة تعليمية صُممت للعقول الطموحة. اكتشف دورات منظمة، وطوّر معرفتك العملية، وتابع تقدمك في رحلة تعليمية واضحة وهادفة.",
    brandNote: "LEARN / BUILD / ADVANCE",
    explore: "استكشف",
    courses: "جميع الدورات",
    categories: "التصنيفات",
    learning: "للمتعلمين",
    myLearning: "دوراتي",
    certificates: "شهاداتي",
    verify: "التحقق من شهادة",
    company: "الأكاديمية",
    about: "عن CrestMark",
    contact: "تواصل معنا",
    legal: "السياسات والشروط",
    privacy: "سياسة الخصوصية",
    terms: "شروط الاستخدام",
    cookies: "سياسة ملفات الارتباط",
    refunds: "الاسترجاع والإلغاء",
    accessibility: "إمكانية الوصول",
    copyright: "جميع الحقوق محفوظة.",
    languages: "اللغات",
    closing: "التعلّم رحلة لا تنتهي.",
  },
} as const;

export default function Footer({ locale }: Props) {
  const lang = locale === "ar" ? "ar" : "en";
  const t = copy[lang];

  const groups = [
    {
      title: t.explore,
      links: [
        { label: t.courses, href: `/${lang}/courses` },
        { label: t.categories, href: `/${lang}/categories` },
      ],
    },
    {
      title: t.learning,
      links: [
        { label: t.myLearning, href: `/${lang}/my-learning` },
        {
          label: t.certificates,
          href: `/${lang}/my-certificates`,
        },
        {
          label: t.verify,
          href: `/${lang}/verify-certificate`,
        },
      ],
    },
    {
      title: t.company,
      links: [
        { label: t.about, href: `/${lang}/about` },
        { label: t.contact, href: `/${lang}/contact` },
      ],
    },
    {
      title: t.legal,
      links: [
        {
          label: t.privacy,
          href: `/${lang}/legal/privacy`,
        },
        {
          label: t.terms,
          href: `/${lang}/legal/terms`,
        },
        {
          label: t.cookies,
          href: `/${lang}/legal/cookies`,
        },
        {
          label: t.refunds,
          href: `/${lang}/legal/refunds`,
        },
        {
          label: t.accessibility,
          href: `/${lang}/legal/accessibility`,
        },
      ],
    },
  ];

  return (
    <footer
      className={styles.footer}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.container}>
        <div className={styles.topLine}>
          <span>CRESTMARK ACADEMY</span>
          <span>EST. 2026</span>
        </div>

        <div className={styles.main}>
          <div className={styles.brandColumn}>
            <Link
              href={`/${lang}`}
              className={styles.brandLink}
              aria-label="CrestMark Academy"
            >
              <Image
                src="/crestmark-logo.png"
                alt="CrestMark Academy"
                width={2048}
                height={677}
                className={styles.logo}
              />
            </Link>

            <p className={styles.description}>
              {t.description}
            </p>

            <div className={styles.brandSignature}>
              <span className={styles.signatureLine} />
              <span>{t.brandNote}</span>
            </div>
          </div>

          <div className={styles.linksArea}>
            {groups.map((group) => (
              <nav
                key={group.title}
                className={styles.linkGroup}
                aria-label={group.title}
              >
                <h2>{group.title}</h2>

                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className={styles.brandStatement}>
          <span className={styles.statementAccent} />
          <p>{t.closing}</p>
          <span className={styles.statementNumber}>CM / 2026</span>
        </div>

        <div className={styles.bottom}>
          <p>
            © {new Date().getFullYear()} CrestMark Academy.
            {" "}
            {t.copyright}
          </p>

          <div className={styles.languageArea}>
            <span>{t.languages}</span>

            <div className={styles.languageLinks}>
              <Link
                href="/en"
                hrefLang="en"
                lang="en"
                aria-current={
                  lang === "en" ? "page" : undefined
                }
              >
                English
              </Link>

              <span className={styles.languageDivider} />

              <Link
                href="/ar"
                hrefLang="ar"
                lang="ar"
                aria-current={
                  lang === "ar" ? "page" : undefined
                }
              >
                العربية
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
