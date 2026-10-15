
"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./page.module.css";

type Certificate = {
  id: number;
  certificateNumber: string;
  certificateUrl: string | null;
  issuedAt: string;
  courseId: number;
  courseTitle: string;
  studentName: string;
  courseCompletedAt: string | null;
};

type Status =
  | "loading"
  | "ready"
  | "error"
  | "unauthorized"
  | "forbidden"
  | "not-found";

const translations = {
  en: {
    home: "Home",
    certificates: "My Certificates",
    heading: "Your certificate",
    subtitle:
      "An official record of your learning achievement.",
    back: "Back to certificates",
    loading: "Preparing your certificate...",
    error: "We couldn't load your certificate.",
    unauthorized:
      "Please sign in to view your certificate.",
    forbidden:
      "You don't have access to this certificate.",
    missing: "Certificate not found.",
    retry: "Try again",
    signIn: "Log in",

    certificate: "Certificate of Completion",
    presented:
      "THIS CERTIFICATE IS PROUDLY PRESENTED TO",
    completed:
      "FOR SUCCESSFULLY COMPLETING THE COURSE",
    completionDate: "DATE OF COMPLETION",
    issuedDate: "DATE OF ISSUE",
    certificateId: "CERTIFICATE ID",
    issuedBy: "ISSUED BY",

    authentic: "Official learning achievement",
    verification:
      "This certificate can be verified through CrestMark Academy using its unique certificate number.",

    download: "Download PDF",
    downloading: "Preparing PDF...",
    downloadError:
      "We couldn't download your certificate. Please try again.",
    downloadUnauthorized:
      "Your session has expired. Please sign in again.",
    downloadForbidden:
      "You don't have permission to download this certificate.",
    downloadNotFound:
      "The requested certificate could not be found.",
    downloadSuccess: "Your download has started.",
  },

  ar: {
    home: "الرئيسية",
    certificates: "شهاداتي",
    heading: "شهادتك",
    subtitle: "سجل رسمي لإنجازك التعليمي.",
    back: "العودة إلى الشهادات",
    loading: "جارٍ تجهيز شهادتك...",
    error: "تعذّر تحميل بيانات الشهادة.",
    unauthorized:
      "يرجى تسجيل الدخول لعرض شهادتك.",
    forbidden:
      "ليس لديك صلاحية الوصول لهذه الشهادة.",
    missing: "لم يتم العثور على الشهادة.",
    retry: "إعادة المحاولة",
    signIn: "تسجيل الدخول",

    certificate: "Certificate of Completion",
    presented:
      "THIS CERTIFICATE IS PROUDLY PRESENTED TO",
    completed:
      "FOR SUCCESSFULLY COMPLETING THE COURSE",
    completionDate: "DATE OF COMPLETION",
    issuedDate: "DATE OF ISSUE",
    certificateId: "CERTIFICATE ID",
    issuedBy: "ISSUED BY",

    authentic: "إنجاز تعليمي رسمي",
    verification:
      "يمكن التحقق من صحة هذه الشهادة لدى CrestMark Academy باستخدام رقمها الفريد.",

    download: "تنزيل الشهادة PDF",
    downloading: "جارٍ تجهيز الشهادة...",
    downloadError:
      "تعذّر تنزيل الشهادة. يرجى المحاولة مجددًا.",
    downloadUnauthorized:
      "انتهت صلاحية جلستك. يرجى تسجيل الدخول مجددًا.",
    downloadForbidden:
      "ليس لديك صلاحية لتنزيل هذه الشهادة.",
    downloadNotFound:
      "لم يتم العثور على الشهادة المطلوبة.",
    downloadSuccess: "بدأ تنزيل الشهادة.",
  },
} as const;

function validId(value: string) {
  return (
    /^[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value))
  );
}

function validCertificate(
  data: unknown,
  id: number
): data is Certificate {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return false;
  }

  const value = data as Record<string, unknown>;

  return (
    value.id === id &&
    typeof value.certificateNumber === "string" &&
    value.certificateNumber.trim().length > 0 &&
    typeof value.courseTitle === "string" &&
    value.courseTitle.trim().length > 0 &&
    typeof value.studentName === "string" &&
    value.studentName.trim().length > 0 &&
    typeof value.issuedAt === "string" &&
    !Number.isNaN(Date.parse(value.issuedAt)) &&
    (value.courseCompletedAt === null ||
      (typeof value.courseCompletedAt === "string" &&
        !Number.isNaN(
          Date.parse(value.courseCompletedAt)
        )))
  );
}

function certificateDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function CertificatePageContent() {
  const params = useParams<{
    locale: string;
    id: string;
  }>();

  const locale = params.locale === "ar" ? "ar" : "en";
  const t = translations[locale];

  const [certificate, setCertificate] =
    useState<Certificate | null>(null);

  const [status, setStatus] =
    useState<Status>("loading");

  const [attempt, setAttempt] = useState(0);

  const [isDownloading, setIsDownloading] =
    useState(false);

  const [downloadMessage, setDownloadMessage] =
    useState("");

  const [downloadSucceeded, setDownloadSucceeded] =
    useState(false);

  // =========================================
  // Load certificate details
  // =========================================

  const loadCertificate = useCallback(async () => {
    if (!validId(params.id)) {
      return {
        status: "not-found" as const,
        data: null,
      };
    }

    const request = () =>
      fetch(`/api/certificates/my/${params.id}`, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

    let response = await request();

    if (response.status === 401) {
      const session = await getCurrentSession();

      if (session.status === "authenticated") {
        response = await request();
      } else if (session.status === "guest") {
        return {
          status: "unauthorized" as const,
          data: null,
        };
      } else {
        throw new Error("Session unavailable");
      }
    }

    if (response.status === 401) {
      return {
        status: "unauthorized" as const,
        data: null,
      };
    }

    if (response.status === 403) {
      return {
        status: "forbidden" as const,
        data: null,
      };
    }

    if (response.status === 404) {
      return {
        status: "not-found" as const,
        data: null,
      };
    }

    if (!response.ok) {
      throw new Error("Certificate unavailable");
    }

    const data: unknown = await response.json();

    if (!validCertificate(data, Number(params.id))) {
      throw new Error(
        "Invalid certificate response"
      );
    }

    return {
      status: "ready" as const,
      data,
    };
  }, [params.id]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await loadCertificate();

        if (cancelled) return;

        setCertificate(result.data);
        setStatus(result.status);
      } catch {
        if (!cancelled) {
          setCertificate(null);
          setStatus("error");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [loadCertificate, attempt]);

  function retry() {
    setStatus("loading");
    setAttempt((value) => value + 1);
  }

  // =========================================
  // Download certificate PDF
  // =========================================

  async function downloadCertificate() {
    if (!certificate || isDownloading) {
      return;
    }

    setIsDownloading(true);
    setDownloadMessage("");
    setDownloadSucceeded(false);

    try {
      const request = () =>
        fetch(
          `/api/certificates/my/${certificate.id}/download`,
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
              Accept: "application/pdf",
            },
          }
        );

      let response = await request();

      // Refresh expired session once.
      if (response.status === 401) {
        const session = await getCurrentSession();

        if (session.status === "authenticated") {
          response = await request();
        } else if (session.status === "guest") {
          setDownloadMessage(
            t.downloadUnauthorized
          );
          return;
        } else {
          throw new Error(
            "Unable to refresh session"
          );
        }
      }

      if (response.status === 401) {
        setDownloadMessage(
          t.downloadUnauthorized
        );
        return;
      }

      if (response.status === 403) {
        setDownloadMessage(
          t.downloadForbidden
        );
        return;
      }

      if (response.status === 404) {
        setDownloadMessage(
          t.downloadNotFound
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Certificate PDF unavailable"
        );
      }

      const contentType =
        response.headers.get("content-type") || "";

      if (
        !contentType
          .toLowerCase()
          .includes("application/pdf")
      ) {
        throw new Error("Invalid PDF content type");
      }

      const blob = await response.blob();

      // Verify the PDF header before saving.
      const header = await blob
        .slice(0, 5)
        .text();

      if (header !== "%PDF-") {
        throw new Error("Invalid PDF file");
      }

      // Use the actual certificate number.
      const safeCertificateNumber =
        /^[A-Za-z0-9-]+$/.test(
          certificate.certificateNumber
        )
          ? certificate.certificateNumber
          : String(certificate.id);

      const fileName =
        `CrestMark-Certificate-${safeCertificateNumber}.pdf`;

      const objectUrl =
        URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = fileName;
      link.style.display = "none";

      document.body.appendChild(link);

      try {
        link.click();
      } finally {
        link.remove();

        // Allow the browser to consume the URL.
        window.setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 1000);
      }

      setDownloadSucceeded(true);
      setDownloadMessage(
        t.downloadSuccess
      );
    } catch {
      setDownloadSucceeded(false);
      setDownloadMessage(
        t.downloadError
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.container}>
        {/* Breadcrumb */}

        <nav
          className={styles.breadcrumb}
          aria-label="Breadcrumb"
        >
          <Link href={`/${locale}`}>
            {t.home}
          </Link>

          <span aria-hidden="true">/</span>

          <Link
            href={`/${locale}/my-certificates`}
          >
            {t.certificates}
          </Link>

          <span aria-hidden="true">/</span>

          <span aria-current="page">
            {t.heading}
          </span>
        </nav>

        {/* Page Header */}

        <div className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>
              CRESTMARK / ACHIEVEMENTS
            </span>

            <h1>{t.heading}</h1>

            <p>{t.subtitle}</p>
          </div>

          <Link
            href={`/${locale}/my-certificates`}
            className={styles.backLink}
          >
            {t.back}
          </Link>
        </div>

        {status !== "ready" || !certificate ? (
          <section
            className={styles.statePanel}
            role="status"
          >
            {status === "loading" ? (
              <>
                <div
                  className={styles.spinner}
                  aria-hidden="true"
                />

                <p>{t.loading}</p>
              </>
            ) : (
              <>
                <h2>
                  {status === "unauthorized"
                    ? t.unauthorized
                    : status === "forbidden"
                      ? t.forbidden
                      : status === "not-found"
                        ? t.missing
                        : t.error}
                </h2>

                {status === "error" ? (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={retry}
                  >
                    {t.retry}
                  </button>
                ) : status === "unauthorized" ? (
                  <Link
                    href={`/${locale}/login`}
                    className={styles.primaryButton}
                  >
                    {t.signIn}
                  </Link>
                ) : (
                  <Link
                    href={`/${locale}/my-certificates`}
                    className={styles.primaryButton}
                  >
                    {t.back}
                  </Link>
                )}
              </>
            )}
          </section>
        ) : (
          <>
            {/* Certificate Preview */}

            <section
              className={styles.certificateStage}
              aria-label={t.certificate}
            >
              <article
                className={styles.certificate}
                dir="ltr"
              >
                <div className={styles.innerFrame}>
                  <header
                    className={styles.certificateHeader}
                  >
                    <div
                      className={styles.brandLogoWrap}
                    >
                      <Image
                        src="/crestmark-logo-certificate.png"
                        alt="CrestMark Academy"
                        width={315}
                        height={96}
                        className={
                          styles.brandLogoImage
                        }
                        priority
                      />
                    </div>
                  </header>

                  <div
                    className={styles.certificateBody}
                  >
                    <p
                      className={styles.documentType}
                    >
                      OFFICIAL LEARNING ACHIEVEMENT
                    </p>

                    <h2>{t.certificate}</h2>

                    <div
                      className={styles.goldRule}
                    />

                    <p
                      className={styles.presentedText}
                    >
                      {t.presented}
                    </p>

                    <p
                      className={styles.studentName}
                    >
                      {certificate.studentName}
                    </p>

                    <div
                      className={styles.nameRule}
                    />

                    <p
                      className={styles.completedText}
                    >
                      {t.completed}
                    </p>

                    <h3
                      className={styles.courseTitle}
                    >
                      {certificate.courseTitle}
                    </h3>

                    <p
                      className={
                        styles.achievementNote
                      }
                    >
                      CRESTMARK ACADEMY
                    </p>
                  </div>

                  {/* Certificate Metadata */}

                  <footer
                    className={
                      styles.certificateFooter
                    }
                  >
                    <div
                      className={styles.footerColumn}
                    >
                      <span>
                        {t.completionDate}
                      </span>

                      <strong>
                        {certificateDate(
                          certificate.courseCompletedAt
                        )}
                      </strong>
                    </div>

                    <div
                      className={styles.footerColumn}
                    >
                      <span>
                        {t.certificateId}
                      </span>

                      <strong
                        className={
                          styles.certificateId
                        }
                      >
                        {
                          certificate.certificateNumber
                        }
                      </strong>
                    </div>

                    <div
                      className={styles.footerColumn}
                    >
                      <span>
                        {t.issuedDate}
                      </span>

                      <strong>
                        {certificateDate(
                          certificate.issuedAt
                        )}
                      </strong>
                    </div>
                  </footer>

                  <div
                    className={styles.documentFooter}
                  >
                    <span>
                      {t.issuedBy} CRESTMARK ACADEMY
                    </span>

                    <span>
                      CRESTMARKACADEMY
                    </span>
                  </div>
                </div>
              </article>
            </section>

            {/* Verification Information */}

            <div
              className={styles.verificationPanel}
            >
              <div
                className={styles.verificationIcon}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m12 2 8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />

                  <path
                    d="m8.5 12 2.4 2.4 4.8-5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <strong>{t.authentic}</strong>
                <p>{t.verification}</p>
              </div>
            </div>

            {/* Actions */}

            <div className={styles.actionBar}>
              <Link
                href={`/${locale}/my-certificates`}
                className={styles.secondaryButton}
              >
                {t.back}
              </Link>

              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  void downloadCertificate();
                }}
                disabled={isDownloading}
                aria-busy={isDownloading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  opacity: isDownloading ? 0.7 : 1,
                  cursor: isDownloading
                    ? "wait"
                    : "pointer",
                }}
              >
                {isDownloading ? (
                  <>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 15,
                        height: 15,
                        border:
                          "2px solid rgba(255,255,255,0.35)",
                        borderTopColor: "#ffffff",
                        borderRadius: "50%",
                      }}
                    />

                    {t.downloading}
                  </>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v3h16v-3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    {t.download}
                  </>
                )}
              </button>
            </div>

            {downloadMessage && (
              <div
                role={
                  downloadSucceeded
                    ? "status"
                    : "alert"
                }
                aria-live="polite"
                style={{
                  marginTop: "14px",
                  textAlign:
                    locale === "ar"
                      ? "left"
                      : "right",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: downloadSucceeded
                    ? "#24734d"
                    : "#b54747",
                }}
              >
                {downloadMessage}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function CertificateViewerPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.container}>
            <div className={styles.statePanel}>
              Loading certificate...
            </div>
          </div>
        </main>
      }
    >
      <CertificatePageContent />
    </Suspense>
  );
}
