
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCurrentSession } from "@/lib/auth-session";
import styles from "./EnrollmentCard.module.css";

type Locale = "en" | "ar";

type Props = {
  locale: Locale;
  courseId: number;
  slug: string;
  price: number;
  discountPrice: number | null;
  hasCertificate: boolean;
  estimatedDurationHours: number | null;
};

type EnrollmentState =
  | "checking"
  | "guest"
  | "not-owned"
  | "active"
  | "completed"
  | "error";

type MyEnrollment = {
  courseId: number;
  enrollmentStatus: string;
  slug?: string;
};

const translations = {
  en: {
    eyebrow: "COURSE ENROLLMENT",
    free: "Free",
    off: "OFF",
    enroll: "Enroll in this course",
    continueLearning: "Continue learning",
    reviewCourse: "Review course",
    checking: "Checking enrollment...",
    checkingNotice:
      "Checking your current access to this course.",
    activeNotice:
      "You're already enrolled in this course. Continue where you left off.",
    completedNotice:
      "You've completed this course. You can revisit its lessons anytime.",
    guestNotice:
      "Sign in at checkout to continue your enrollment.",
    enrollNotice:
      "Review your order and apply an eligible coupon at checkout.",
    unavailable: "Enrollment unavailable",
    freeSoon: "Free enrollment coming soon",
    freeNotice:
      "Free course enrollment is being prepared.",
    unavailableNotice:
      "Enrollment is currently unavailable for this course.",
    retry: "Retry enrollment check",
    checkError:
      "We couldn't verify your enrollment. Please retry before purchasing.",
    includes: "What's included",
    curriculum: "Structured course curriculum",
    progress: "Learning progress tracking",
    certificate: "Certificate when eligible",
    duration: "Estimated course duration",
    hours: "hours",
    secure:
      "Course access is managed securely by CrestMark Academy.",
  },
  ar: {
    eyebrow: "التسجيل في الدورة",
    free: "مجانية",
    off: "خصم",
    enroll: "سجّل في هذه الدورة",
    continueLearning: "متابعة التعلّم",
    reviewCourse: "مراجعة الدورة",
    checking: "جارٍ التحقق من التسجيل...",
    checkingNotice:
      "نتحقق من صلاحية وصولك الحالية لهذه الدورة.",
    activeNotice:
      "أنت مسجّل بالفعل في هذه الدورة. تابع من حيث توقفت.",
    completedNotice:
      "لقد أكملت هذه الدورة، ويمكنك مراجعة دروسها في أي وقت.",
    guestNotice:
      "سجّل الدخول عند إتمام الشراء للمتابعة.",
    enrollNotice:
      "راجع طلبك وأدخل كوبونًا مؤهلًا عند إتمام الشراء.",
    unavailable: "التسجيل غير متاح",
    freeSoon: "التسجيل المجاني قريبًا",
    freeNotice:
      "نعمل على تجهيز التسجيل في الدورات المجانية.",
    unavailableNotice:
      "التسجيل في هذه الدورة غير متاح حاليًا.",
    retry: "إعادة التحقق من التسجيل",
    checkError:
      "تعذّر التحقق من التحاقك. أعد المحاولة قبل الشراء.",
    includes: "ماذا تتضمن الدورة؟",
    curriculum: "منهج تعليمي منظم",
    progress: "متابعة التقدم التعليمي",
    certificate: "شهادة عند استيفاء شروط الإكمال",
    duration: "المدة التقديرية للدورة",
    hours: "ساعة",
    secure:
      "تُدار صلاحيات الوصول للدورات بأمان من خلال CrestMark Academy.",
  },
} as const;


const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  currencyDisplay: "symbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});


function isEnrollmentList(
  value: unknown
): value is MyEnrollment[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        typeof item.courseId === "number" &&
        Number.isSafeInteger(item.courseId) &&
        item.courseId > 0 &&
        typeof item.enrollmentStatus === "string"
    )
  );
}

export default function EnrollmentCard({
  locale,
  courseId,
  slug,
  price,
  discountPrice,
  hasCertificate,
  estimatedDurationHours,
}: Props) {
  const t = translations[locale];

  const [enrollmentState, setEnrollmentState] =
    useState<EnrollmentState>("checking");

  const [retryIndex, setRetryIndex] = useState(0);

  // =====================================
  // Check real student enrollment
  // =====================================

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function requestEnrollments() {
      return fetch("/api/my-learning", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      });
    }

    async function checkEnrollment() {
      setEnrollmentState("checking");

      try {
        let response = await requestEnrollments();

        // The existing auth helper may restore
        // an expired access session.
        if (response.status === 401) {
          const session = await getCurrentSession();

          if (cancelled) return;

          if (session.status === "guest") {
            setEnrollmentState("guest");
            return;
          }

          if (session.status !== "authenticated") {
            setEnrollmentState("error");
            return;
          }

          response = await requestEnrollments();
        }

        if (!response.ok) {
          throw new Error(
            `Enrollment request failed: ${response.status}`
          );
        }

        const payload: unknown = await response.json();

        if (!isEnrollmentList(payload)) {
          throw new Error("Unexpected enrollment response.");
        }

        // Match by immutable course ID.
        const matching = payload.filter(
          (item) => item.courseId === courseId
        );

        const isCompleted = matching.some(
          (item) =>
            item.enrollmentStatus.toLowerCase() ===
            "completed"
        );

        const isActive = matching.some(
          (item) =>
            item.enrollmentStatus.toLowerCase() ===
            "active"
        );

        if (cancelled) return;

        if (isCompleted) {
          setEnrollmentState("completed");
        } else if (isActive) {
          setEnrollmentState("active");
        } else {
          // Cancelled enrollments do not
          // provide active course access.
          setEnrollmentState("not-owned");
        }
      } catch {
        if (!cancelled) {
          setEnrollmentState("error");
        }
      }
    }

    void checkEnrollment();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [courseId, retryIndex]);

  // =====================================
  // Course price
  // =====================================

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

  const validSlug =
    /^[a-zA-Z0-9-]{1,200}$/.test(slug);

  const ownsCourse =
    enrollmentState === "active" ||
    enrollmentState === "completed";

  const canCheckout =
    validSlug &&
    finalPrice !== null &&
    finalPrice > 0;

  const checkoutUrl = `/${locale}/checkout/${encodeURIComponent(
    slug
  )}`;

  const learningUrl = `/${locale}/learn/${encodeURIComponent(
    slug
  )}`;

  // =====================================
  // Button description
  // =====================================

  let enrollmentNotice: string;

  switch (enrollmentState) {
    case "checking":
      enrollmentNotice = t.checkingNotice;
      break;

    case "active":
      enrollmentNotice = t.activeNotice;
      break;

    case "completed":
      enrollmentNotice = t.completedNotice;
      break;

    case "guest":
      enrollmentNotice = t.guestNotice;
      break;

    case "error":
      enrollmentNotice = t.checkError;
      break;

    default:
      enrollmentNotice = canCheckout
        ? t.enrollNotice
        : isFree
          ? t.freeNotice
          : t.unavailableNotice;
  }

  // =====================================
  // Benefits
  // =====================================

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
              </svg>
            ),
          },
        ]
      : []),
  ];

  // =====================================
  // Enrollment action
  // =====================================

  function renderAction() {
    if (enrollmentState === "checking") {
      return (
        <button
          type="button"
          className={styles.enrollButton}
          disabled
        >
          {t.checking}
        </button>
      );
    }

    if (enrollmentState === "error") {
      return (
        <button
          type="button"
          className={styles.enrollButton}
          onClick={() =>
            setRetryIndex((previous) => previous + 1)
          }
        >
          <span>{t.retry}</span>
        </button>
      );
    }

    if (ownsCourse && validSlug) {
      return (
        <Link
          href={learningUrl}
          className={`${styles.enrollButton} ${styles.ownedButton}`}
          aria-describedby="enrollment-notice"
        >
          <span>
            {enrollmentState === "completed"
              ? t.reviewCourse
              : t.continueLearning}
          </span>

          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </Link>
      );
    }

    if (canCheckout && !ownsCourse) {
      return (
        <Link
          href={checkoutUrl}
          className={styles.enrollButton}
          aria-describedby="enrollment-notice"
        >
          <span>{t.enroll}</span>

          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </Link>
      );
    }

    return (
      <button
        type="button"
        className={styles.enrollButton}
        disabled
      >
        {isFree ? t.freeSoon : t.unavailable}
      </button>
    );
  }

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

      {/* Price */}

      <div className={styles.priceSection}>
        {finalPrice === null ? (
          <span className={styles.unavailablePrice}>—</span>
        ) : (
          <>
            <div className={styles.priceRow}>
              <span className={styles.currentPrice}>
                {isFree
                  ? t.free
                  : priceFormatter.format(finalPrice)}
              </span>

              {hasDiscount &&
                regularPrice !== null &&
                discountPercentage > 0 && (
                  <span className={styles.originalPrice}>
                    {priceFormatter.format(regularPrice)}
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

      {/* Enrollment button */}

      {renderAction()}

      <p id="enrollment-notice" className={styles.notice}>
        {enrollmentNotice}
      </p>

      <div className={styles.separator} />

      {/* Benefits */}

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
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
