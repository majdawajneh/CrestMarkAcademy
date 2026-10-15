
"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  FormEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./page.module.css";

type Locale = "ar" | "en";

type Certificate = {
  certificateNumber: string;
  studentName: string;
  courseTitle: string;
  issuedAt: string;
  courseCompletedAt: string | null;
};

type VerificationStatus =
  | "idle"
  | "loading"
  | "verified"
  | "not-found"
  | "invalid"
  | "error";

const content = {
  en: {
    home: "Home",
    certificates: "Certificate Verification",
    eyebrow: "CRESTMARK ACADEMY / CREDENTIALS",
    heading: "Verify a certificate.",
    intro:
      "Confirm the authenticity of a CrestMark Academy certificate using its unique certificate number.",
    formTitle: "Certificate lookup",
    formDescription:
      "Enter the certificate number exactly as shown on the issued certificate.",
    fieldLabel: "Certificate number",
    placeholder: "CMA-2026-XXXXXXXX",
    example: "Example: CMA-2026-B8EBABAF",
    verify: "Verify Certificate",
    verifying: "Checking certificate...",
    secure: "Official certificate verification",
    secureDescription:
      "Results are retrieved from CrestMark Academy records. A matching certificate number confirms that a certificate record exists.",
    resultLabel: "VERIFICATION RESULT",
    verified: "Certificate verified",
    verifiedDescription:
      "A matching certificate was found in CrestMark Academy records.",
    student: "Awarded to",
    course: "Completed course",
    completed: "Date of completion",
    issued: "Date of issue",
    number: "Certificate number",
    verifiedFooter:
      "This result confirms that the listed certificate details match an issued academy record.",
    notFound: "Certificate not found",
    notFoundDescription:
      "We couldn't find a certificate matching this number. Check the number and try again.",
    invalid: "Check the certificate number",
    invalidDescription:
      "Please enter a number in the format CMA-YYYY-XXXXXXXX.",
    error: "Verification is unavailable",
    errorDescription:
      "We couldn't complete the verification right now. Please try again shortly.",
    tryAgain: "Try again",
    privacyTitle: "Public verification",
    privacyDescription:
      "Only the details required to verify an issued certificate are displayed. Account information and private learning records remain protected.",
    footer: "CrestMark Academy",
  },
  ar: {
    home: "الرئيسية",
    certificates: "التحقق من الشهادات",
    eyebrow: "CRESTMARK ACADEMY / CREDENTIALS",
    heading: "تحقق من صحة الشهادة.",
    intro:
      "تأكد من صحة الشهادات الصادرة عن CrestMark Academy باستخدام رقم الشهادة الفريد.",
    formTitle: "البحث عن شهادة",
    formDescription:
      "أدخل رقم الشهادة كما هو موضح في الشهادة الصادرة.",
    fieldLabel: "رقم الشهادة",
    placeholder: "CMA-2026-XXXXXXXX",
    example: "مثال: CMA-2026-B8EBABAF",
    verify: "التحقق من الشهادة",
    verifying: "جارٍ التحقق من الشهادة...",
    secure: "التحقق الرسمي من الشهادات",
    secureDescription:
      "يتم جلب النتائج من سجلات CrestMark Academy. تطابق الرقم يؤكد وجود سجل للشهادة.",
    resultLabel: "نتيجة التحقق",
    verified: "تم التحقق من الشهادة",
    verifiedDescription:
      "تم العثور على شهادة مطابقة في سجلات CrestMark Academy.",
    student: "اسم الحاصل على الشهادة",
    course: "الدورة المكتملة",
    completed: "تاريخ إكمال الدورة",
    issued: "تاريخ إصدار الشهادة",
    number: "رقم الشهادة",
    verifiedFooter:
      "تؤكد هذه النتيجة أن البيانات المعروضة تطابق سجل شهادة صادرة عن الأكاديمية.",
    notFound: "لم يتم العثور على الشهادة",
    notFoundDescription:
      "لم نجد شهادة تطابق الرقم المُدخل. تحقق من الرقم وحاول مجددًا.",
    invalid: "تحقق من رقم الشهادة",
    invalidDescription:
      "يرجى إدخال رقم بالتنسيق CMA-YYYY-XXXXXXXX.",
    error: "خدمة التحقق غير متاحة",
    errorDescription:
      "تعذّر إتمام عملية التحقق حاليًا. يرجى المحاولة بعد قليل.",
    tryAgain: "إعادة المحاولة",
    privacyTitle: "التحقق العام",
    privacyDescription:
      "نعرض فقط البيانات اللازمة للتحقق من الشهادة، مع الحفاظ على خصوصية معلومات الحساب وسجلات التعلم.",
    footer: "CrestMark Academy",
  },
} as const;

const CERTIFICATE_PATTERN =
  /^CMA-[0-9]{4}-[A-Z0-9]{8}$/;

function isCertificate(value: unknown): value is Certificate {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.certificateNumber === "string" &&
    CERTIFICATE_PATTERN.test(item.certificateNumber) &&
    typeof item.studentName === "string" &&
    item.studentName.trim().length > 0 &&
    typeof item.courseTitle === "string" &&
    item.courseTitle.trim().length > 0 &&
    typeof item.issuedAt === "string" &&
    !Number.isNaN(Date.parse(item.issuedAt)) &&
    (item.courseCompletedAt === null ||
      (typeof item.courseCompletedAt === "string" &&
        !Number.isNaN(Date.parse(item.courseCompletedAt))))
  );
}

function formatDate(
  value: string | null,
  locale: Locale
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
}

function ShieldIcon({
  size = 24,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2.5 20 6v6c0 4.7-3 8.2-8 9.5C7 20.2 4 16.7 4 12V6l8-3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m8.5 12 2.5 2.5 4.7-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VerificationContent() {
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();

  const locale: Locale =
    params.locale === "ar" ? "ar" : "en";

  const t = content[locale];

  const initialNumber =
    searchParams.get("number")?.trim().toUpperCase() ?? "";

  const [number, setNumber] = useState(initialNumber);
  const [status, setStatus] =
    useState<VerificationStatus>("idle");
  const [certificate, setCertificate] =
    useState<Certificate | null>(null);

  const activeRequest = useRef<AbortController | null>(null);
  const initialCheckDone = useRef(false);

  async function verify(rawNumber: string) {
    const normalized = rawNumber.trim().toUpperCase();

    setNumber(normalized);
    setCertificate(null);

    activeRequest.current?.abort();

    if (!CERTIFICATE_PATTERN.test(normalized)) {
      setStatus("invalid");
      return;
    }

    const controller = new AbortController();
    activeRequest.current = controller;

    setStatus("loading");

    try {
      const response = await fetch(
        `/api/certificates/verify/${encodeURIComponent(normalized)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
          signal: controller.signal,
        }
      );

      if (controller.signal.aborted) return;

      if (response.status === 404) {
        setStatus("not-found");
        return;
      }

      if (!response.ok) {
        setStatus("error");
        return;
      }

      const data: unknown = await response.json();

      if (controller.signal.aborted) return;

      if (
        !isCertificate(data) ||
        data.certificateNumber !== normalized
      ) {
        setStatus("error");
        return;
      }

      setCertificate(data);
      setStatus("verified");
    } catch {
      if (!controller.signal.aborted) {
        setStatus("error");
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
      }
    }
  }

  // Enables future QR links:
  // /en/verify-certificate?number=CMA-2026-XXXXXXXX
  useEffect(() => {
    if (initialCheckDone.current) return;

    initialCheckDone.current = true;

    if (initialNumber) {
      void verify(initialNumber);
    }

    return () => {
      activeRequest.current?.abort();
    };
    // Only run on initial page mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void verify(number);
  }

  function handleNumberChange(value: string) {
    activeRequest.current?.abort();
    setNumber(value.toUpperCase());
    setCertificate(null);
    setStatus("idle");
  }

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.container}>
        <nav
          className={styles.breadcrumb}
          aria-label="Breadcrumb"
        >
          <Link href={`/${locale}`}>{t.home}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{t.certificates}</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowLine} />
              {t.eyebrow}
            </span>

            <h1>{t.heading}</h1>
            <p>{t.intro}</p>
          </div>

          <div
            className={styles.heroSymbol}
            aria-hidden="true"
          >
            <ShieldIcon size={74} />
          </div>
        </header>

        <div className={styles.contentGrid}>
          <section
            className={styles.lookupPanel}
            aria-labelledby="lookup-heading"
          >
            <div className={styles.panelHeading}>
              <span className={styles.stepNumber}>01</span>
              <div>
                <h2 id="lookup-heading">{t.formTitle}</h2>
                <p>{t.formDescription}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <label
                className={styles.inputLabel}
                htmlFor="certificate-number"
              >
                {t.fieldLabel}
              </label>

              <div className={styles.inputWrap}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M8 3h7l5 5v12a1 1 0 0 1-1 1H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M15 3v5h5M9 13h7M9 17h5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  id="certificate-number"
                  type="text"
                  value={number}
                  onChange={(event) =>
                    handleNumberChange(event.target.value)
                  }
                  placeholder={t.placeholder}
                  dir="ltr"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={32}
                  aria-invalid={status === "invalid"}
                  aria-describedby="number-help"
                />
              </div>

              <p
                id="number-help"
                className={styles.inputHelp}
              >
                {t.example}
              </p>

              <button
                className={styles.verifyButton}
                type="submit"
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <span
                    className={styles.spinner}
                    aria-hidden="true"
                  />
                ) : (
                  <ShieldIcon size={19} />
                )}
                {status === "loading"
                  ? t.verifying
                  : t.verify}
              </button>
            </form>

            <div className={styles.lookupFootnote}>
              <ShieldIcon size={21} />
              <div>
                <strong>{t.secure}</strong>
                <p>{t.secureDescription}</p>
              </div>
            </div>
          </section>

          <aside className={styles.informationPanel}>
            <div className={styles.informationIcon}>
              <ShieldIcon size={31} />
            </div>
            <h2>{t.privacyTitle}</h2>
            <p>{t.privacyDescription}</p>
            <div className={styles.informationBrand}>
              CRESTMARK
              <span>ACADEMY</span>
            </div>
          </aside>
        </div>

        {status !== "idle" && status !== "loading" && (
          <section
            className={styles.resultSection}
            aria-live="polite"
            aria-label={t.resultLabel}
          >
            <div className={styles.resultEyebrow}>
              {t.resultLabel}
            </div>

            {status === "verified" && certificate ? (
              <article className={styles.verifiedCard}>
                <div className={styles.verifiedHeader}>
                  <div className={styles.verifiedIcon}>
                    <ShieldIcon size={30} />
                  </div>
                  <div>
                    <h2>{t.verified}</h2>
                    <p>{t.verifiedDescription}</p>
                  </div>
                </div>

                <div className={styles.resultFields}>
                  <div className={styles.fullField}>
                    <span>{t.student}</span>
                    <strong>{certificate.studentName}</strong>
                  </div>

                  <div className={styles.fullField}>
                    <span>{t.course}</span>
                    <strong>{certificate.courseTitle}</strong>
                  </div>

                  <div>
                    <span>{t.completed}</span>
                    <strong>
                      {formatDate(
                        certificate.courseCompletedAt,
                        locale
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>{t.issued}</span>
                    <strong>
                      {formatDate(
                        certificate.issuedAt,
                        locale
                      )}
                    </strong>
                  </div>

                  <div className={styles.fullField}>
                    <span>{t.number}</span>
                    <strong
                      className={styles.certificateNumber}
                      dir="ltr"
                    >
                      {certificate.certificateNumber}
                    </strong>
                  </div>
                </div>

                <p className={styles.resultFooter}>
                  <ShieldIcon size={18} />
                  {t.verifiedFooter}
                </p>
              </article>
            ) : (
              <div className={styles.failureCard} role="alert">
                <div className={styles.failureIcon}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M12 7.5v5.5M12 16.5h.01"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div>
                  <h2>
                    {status === "not-found"
                      ? t.notFound
                      : status === "invalid"
                        ? t.invalid
                        : t.error}
                  </h2>
                  <p>
                    {status === "not-found"
                      ? t.notFoundDescription
                      : status === "invalid"
                        ? t.invalidDescription
                        : t.errorDescription}
                  </p>
                  <button
                    className={styles.retryButton}
                    type="button"
                    onClick={() => {
                      void verify(number);
                    }}
                  >
                    {t.tryAgain}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        <footer className={styles.pageFooter}>
          <span>© 2026 {t.footer}</span>
          <span>CRESTMARK / CREDENTIAL VERIFICATION</span>
        </footer>
      </div>
    </main>
  );
}

export default function VerifyCertificatePage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.container}>
            <div className={styles.loadingFallback}>
              <span
                className={styles.spinner}
                aria-hidden="true"
              />
            </div>
          </div>
        </main>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}
