
import styles from "./EnrollmentCard.module.css";

type Locale = "en" | "ar";

type Props = {
  locale: Locale;
  price: number;
  discountPrice: number | null;
  hasCertificate: boolean;
  estimatedDurationHours: number | null;
};

const translations = {
  en: {
    eyebrow: "COURSE ENROLLMENT",
    free: "Free",
    off: "OFF",
    enroll: "Enroll in this course",
    comingSoon: "Enrollment coming soon",
    notice:
      "Online enrollment is being prepared. Please check back soon.",
    includes: "What's included",
    curriculum: "Structured course curriculum",
    progress: "Learning progress tracking",
    certificate: "Certificate when eligible",
    duration: "Estimated course duration",
    hours: "hours",
    secure: "Payments are not being collected yet.",
  },
  ar: {
    eyebrow: "التسجيل في الدورة",
    free: "مجانية",
    off: "خصم",
    enroll: "سجّل في هذه الدورة",
    comingSoon: "التسجيل متاح قريبًا",
    notice:
      "نعمل على تجهيز التسجيل الإلكتروني. يرجى العودة قريبًا.",
    includes: "ماذا تتضمن الدورة؟",
    curriculum: "منهج تعليمي منظم",
    progress: "متابعة التقدم التعليمي",
    certificate: "شهادة عند استيفاء شروط الإكمال",
    duration: "المدة التقديرية للدورة",
    hours: "ساعة",
    secure: "لا يتم تحصيل أي مدفوعات حاليًا.",
  },
} as const;

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function EnrollmentCard({
  locale,
  price,
  discountPrice,
  hasCertificate,
  estimatedDurationHours,
}: Props) {
  const t = translations[locale];

  const validPrice =
    typeof price === "number" &&
    Number.isFinite(price) &&
    price >= 0;

  const regularPrice = validPrice ? price : null;

  const hasDiscount =
    regularPrice !== null &&
    regularPrice > 0 &&
    typeof discountPrice === "number" &&
    Number.isFinite(discountPrice) &&
    discountPrice >= 0 &&
    discountPrice < regularPrice;

  const finalPrice =
    hasDiscount && discountPrice !== null
      ? discountPrice
      : regularPrice;

  const isFree = finalPrice === 0;

  const discountPercentage =
    hasDiscount &&
    regularPrice !== null &&
    discountPrice !== null
      ? Math.round(
          ((regularPrice - discountPrice) /
            regularPrice) *
            100
        )
      : 0;

  const benefits = [
    {
      key: "curriculum",
      label: t.curriculum,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 5.5c3-1.5 6.5-1.5 9 0.5 2.5-2 6-2 9-0.5v13c-3-1.5-6.5-1.5-9 0.5-2.5-2-6-2-9-0.5v-13Z" />
          <path d="M12 6v13" />
        </svg>
      ),
    },
    {
      key: "progress",
      label: t.progress,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 19V5M4 19h16" />
          <path d="m8 15 4-4 3 2 5-7" />
        </svg>
      ),
    },
    ...(hasCertificate
      ? [
          {
            key: "certificate",
            label: t.certificate,
            icon: (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path d="M7 3h10v11H7z" />
                <path d="m9 14-2 7 5-3 5 3-2-7" />
                <path d="m10 8 2-2 2 2-2 2-2-2Z" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  return (
    <section
      className={styles.card}
      aria-labelledby="enrollment-heading"
    >
      <div className={styles.topLine}>
        <h2
          id="enrollment-heading"
          className={styles.eyebrow}
        >
          {t.eyebrow}
        </h2>

        <div className={styles.topIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="m2 9 10-5 10 5-10 5L2 9Z" />
            <path d="M6 11v6c3.5 3 8.5 3 12 0v-6" />
            <path d="M22 9v8" />
          </svg>
        </div>
      </div>

      <div className={styles.priceSection}>
        {finalPrice === null ? (
          <span className={styles.unavailablePrice}>
            —
          </span>
        ) : (
          <>
            <div className={styles.priceRow}>
              <span className={styles.currentPrice}>
                {isFree
                  ? t.free
                  : usdFormatter.format(finalPrice)}
              </span>

              {hasDiscount &&
                regularPrice !== null &&
                discountPercentage > 0 && (
                  <span className={styles.originalPrice}>
                    {usdFormatter.format(regularPrice)}
                  </span>
                )}
            </div>

            {hasDiscount && discountPercentage > 0 && (
              <span className={styles.discountBadge}>
                {locale === "ar"
                  ? `${t.off} ${discountPercentage}%`
                  : `${discountPercentage}% ${t.off}`}
              </span>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        className={styles.enrollButton}
        disabled
        aria-describedby="enrollment-notice"
      >
        <span>{t.comingSoon}</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      </button>

      <p
        id="enrollment-notice"
        className={styles.notice}
      >
        {t.notice}
      </p>

      <div className={styles.separator} />

      <div className={styles.benefits}>
        <h3>{t.includes}</h3>

        <ul className={styles.benefitsList}>
          {benefits.map((benefit) => (
            <li key={benefit.key}>
              <span className={styles.benefitIcon}>
                {benefit.icon}
              </span>

              <span>{benefit.label}</span>
            </li>
          ))}

          {typeof estimatedDurationHours === "number" &&
            Number.isFinite(estimatedDurationHours) &&
            estimatedDurationHours > 0 && (
              <li>
                <span className={styles.benefitIcon}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </span>

                <span>
                  {t.duration}:{" "}
                  <strong>
                    {estimatedDurationHours} {t.hours}
                  </strong>
                </span>
              </li>
            )}
        </ul>
      </div>

      <div className={styles.footerNotice}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 7.5h.01" />
        </svg>

        <span>{t.secure}</span>
      </div>
    </section>
  );
}
