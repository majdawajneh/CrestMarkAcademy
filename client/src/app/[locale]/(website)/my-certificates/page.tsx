
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./page.module.css";

type Certificate = {
  id: number;
  enrollmentId: number;
  certificateNumber: string;
  certificateUrl: string | null;
  issuedAt: string;
};

type LoadStatus =
  | "loading"
  | "ready"
  | "error"
  | "unauthorized"
  | "forbidden";

const copy = {
  en: {
    home: "Home",
    learning: "My Learning",
    eyebrow: "YOUR LEARNING ACHIEVEMENTS",
    title: "My Certificates",
    subtitle:
      "A permanent record of the milestones you've earned through learning.",
    collection: "Certificate collection",
    collectionDescription:
      "Your issued certificates, organized in one place.",
    total: "Certificates earned",
    latest: "Most recent award",
    archive: "YOUR ACHIEVEMENTS",
    count: "Issued certificates",
    number: "Certificate number",
    issued: "Issued",
    awarded: "Certificate of Completion",
    copyNumber: "Copy number",
    copied: "Copied!",
    view: "View Certificate",
    download: "Download PDF",
    downloading: "Preparing PDF...",
    emptyTitle: "Your first achievement is waiting.",
    emptyText:
      "Complete an eligible course to earn your first CrestMark Academy certificate.",
    explore: "Explore courses",
    back: "Back to My Learning",
    loading: "Loading your certificates...",
    errorTitle: "We couldn't load your certificates.",
    errorText:
      "Please check your connection and try again.",
    unauthorized: "Sign in to see your certificates.",
    forbidden: "You don't have access to this page.",
    signIn: "Log in",
    retry: "Try again",
    refresh: "Refresh",
    downloadError:
      "Unable to download the certificate. Please try again.",
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
    learning: "دوراتي",
    eyebrow: "إنجازاتك التعليمية",
    title: "شهاداتي",
    subtitle:
      "سجل إنجازاتك التعليمية والشهادات التي حصلت عليها.",
    collection: "مكتبة الشهادات",
    collectionDescription:
      "جميع شهاداتك الصادرة، مرتبة في مكان واحد.",
    total: "الشهادات المكتسبة",
    latest: "آخر شهادة",
    archive: "سجل إنجازاتك",
    count: "الشهادات الصادرة",
    number: "رقم الشهادة",
    issued: "تم إصدارها",
    awarded: "شهادة إتمام",
    copyNumber: "نسخ الرقم",
    copied: "تم النسخ!",
    view: "عرض الشهادة",
    download: "تنزيل PDF",
    downloading: "جارٍ تجهيز الشهادة...",
    emptyTitle: "إنجازك الأول بانتظارك.",
    emptyText:
      "أكمل دورة مؤهلة للحصول على أول شهادة من CrestMark Academy.",
    explore: "استكشف الدورات",
    back: "العودة إلى دوراتي",
    loading: "جارٍ تحميل شهاداتك...",
    errorTitle: "تعذّر تحميل شهاداتك.",
    errorText:
      "تحقق من اتصالك بالإنترنت وحاول مجددًا.",
    unauthorized: "سجّل الدخول لعرض شهاداتك.",
    forbidden: "ليس لديك صلاحية الوصول لهذه الصفحة.",
    signIn: "تسجيل الدخول",
    retry: "إعادة المحاولة",
    refresh: "تحديث",
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

function formatDate(
  value: string,
  locale: "ar" | "en"
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

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

function validCertificate(
  value: unknown
): value is Certificate {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "number" &&
    Number.isSafeInteger(item.id) &&
    item.id > 0 &&
    typeof item.enrollmentId === "number" &&
    Number.isSafeInteger(item.enrollmentId) &&
    item.enrollmentId > 0 &&
    typeof item.certificateNumber === "string" &&
    item.certificateNumber.trim().length > 0 &&
    (item.certificateUrl === null ||
      typeof item.certificateUrl === "string") &&
    typeof item.issuedAt === "string" &&
    !Number.isNaN(Date.parse(item.issuedAt))
  );
}

function AwardIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="25"
        r="16"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle
        cx="32"
        cy="25"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M23 39 17 58l15-7 15 7-6-19"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="m27 25 3.5 3.5L38 21"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MyCertificatesContent() {
  const params = useParams<{ locale: string }>();

  const locale = params.locale === "ar" ? "ar" : "en";
  const t = copy[locale];

  const [certificates, setCertificates] = useState<
    Certificate[]
  >([]);

  const [status, setStatus] =
    useState<LoadStatus>("loading");

  const [reload, setReload] = useState(0);

  const [copiedId, setCopiedId] =
    useState<number | null>(null);

  const [downloadingId, setDownloadingId] =
    useState<number | null>(null);

  const downloadInProgress = useRef(false);

  const [downloadFeedback, setDownloadFeedback] =
    useState<{
      id: number;
      message: string;
      success: boolean;
    } | null>(null);

  // =====================================
  // Load Certificates
  // =====================================

  const loadCertificates = useCallback(async () => {
    async function request() {
      return fetch("/api/certificates/my", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
    }

    let response = await request();

    if (response.status === 401) {
      const session = await getCurrentSession();

      if (session.status === "authenticated") {
        response = await request();
      } else if (session.status === "guest") {
        return {
          status: "unauthorized" as const,
          certificates: [] as Certificate[],
        };
      } else {
        throw new Error("Session unavailable");
      }
    }

    if (response.status === 401) {
      return {
        status: "unauthorized" as const,
        certificates: [] as Certificate[],
      };
    }

    if (response.status === 403) {
      return {
        status: "forbidden" as const,
        certificates: [] as Certificate[],
      };
    }

    if (!response.ok) {
      throw new Error("Unable to load certificates");
    }

    const data: unknown = await response.json();

    if (
      !Array.isArray(data) ||
      !data.every(validCertificate)
    ) {
      throw new Error("Invalid certificate response");
    }

    const sorted: Certificate[] = [...data].sort(
      (a, b) =>
        new Date(b.issuedAt).getTime() -
        new Date(a.issuedAt).getTime()
    );

    return {
      status: "ready" as const,
      certificates: sorted,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await loadCertificates();

        if (cancelled) return;

        setCertificates(result.certificates);
        setStatus(result.status);
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [loadCertificates, reload]);

  function retry() {
    setStatus("loading");
    setDownloadFeedback(null);
    setReload((value) => value + 1);
  }

  // =====================================
  // Copy Certificate Number
  // =====================================

  async function copyCertificateNumber(
    certificate: Certificate
  ) {
    try {
      await navigator.clipboard.writeText(
        certificate.certificateNumber
      );

      setCopiedId(certificate.id);
    } catch {
      setCopiedId(null);
    }
  }

  // =====================================
  // Download Certificate PDF
  // =====================================

  async function downloadCertificate(
    certificate: Certificate
  ) {
    if (downloadInProgress.current) return;

    downloadInProgress.current = true;
    setDownloadingId(certificate.id);
    setDownloadFeedback(null);

    function feedback(
      message: string,
      success = false
    ) {
      setDownloadFeedback({
        id: certificate.id,
        message,
        success,
      });
    }

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

      if (response.status === 401) {
        const session = await getCurrentSession();

        if (session.status === "authenticated") {
          response = await request();
        } else if (session.status === "guest") {
          feedback(t.downloadUnauthorized);
          return;
        } else {
          throw new Error("Session unavailable");
        }
      }

      if (response.status === 401) {
        feedback(t.downloadUnauthorized);
        return;
      }

      if (response.status === 403) {
        feedback(t.downloadForbidden);
        return;
      }

      if (response.status === 404) {
        feedback(t.downloadNotFound);
        return;
      }

      if (!response.ok) {
        throw new Error("PDF download failed");
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

      const header = await blob.slice(0, 5).text();

      if (header !== "%PDF-") {
        throw new Error("Invalid PDF content");
      }

      const safeNumber =
        /^[A-Za-z0-9-]+$/.test(
          certificate.certificateNumber
        )
          ? certificate.certificateNumber
          : String(certificate.id);

      const fileName =
        `CrestMark-Certificate-${safeNumber}.pdf`;

      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = fileName;
      link.style.display = "none";

      document.body.appendChild(link);

      try {
        link.click();

        feedback(t.downloadSuccess, true);
      } finally {
        link.remove();

        window.setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 10000);
      }
    } catch {
      feedback(t.downloadError);
    } finally {
      downloadInProgress.current = false;
      setDownloadingId(null);
    }
  }

  const latestCertificate = certificates[0] ?? null;

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

          <Link href={`/${locale}/my-learning`}>
            {t.learning}
          </Link>

          <span aria-hidden="true">/</span>

          <span aria-current="page">
            {t.title}
          </span>
        </nav>

        {/* Header */}

        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowLine} />
              {t.eyebrow}
            </span>

            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>

          <div
            className={styles.headerEmblem}
            aria-hidden="true"
          >
            <AwardIcon />
          </div>
        </header>

        {/* Loading / Errors */}

        {status === "loading" ? (
          <div
            className={styles.messagePanel}
            role="status"
          >
            <span
              className={styles.spinner}
              aria-hidden="true"
            />
            <p>{t.loading}</p>
          </div>
        ) : status !== "ready" ? (
          <div className={styles.messagePanel}>
            <div className={styles.messageSymbol}>
              !
            </div>

            <h2>
              {status === "unauthorized"
                ? t.unauthorized
                : status === "forbidden"
                  ? t.forbidden
                  : t.errorTitle}
            </h2>

            {status === "error" && (
              <p>{t.errorText}</p>
            )}

            {status === "unauthorized" ? (
              <Link
                href={`/${locale}/login`}
                className={styles.primaryButton}
              >
                {t.signIn}
              </Link>
            ) : status === "error" ? (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={retry}
              >
                {t.retry}
              </button>
            ) : (
              <Link
                href={`/${locale}/my-learning`}
                className={styles.primaryButton}
              >
                {t.back}
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Overview */}

            <section
              className={styles.overview}
              aria-label={t.collection}
            >
              <div className={styles.overviewIntro}>
                <span className={styles.overviewLabel}>
                  CRESTMARK / ACHIEVEMENTS
                </span>

                <h2>{t.collection}</h2>
                <p>{t.collectionDescription}</p>
              </div>

              <div className={styles.overviewStats}>
                <div className={styles.stat}>
                  <strong>{certificates.length}</strong>
                  <span>{t.total}</span>
                </div>

                <div className={styles.stat}>
                  <strong className={styles.latestDate}>
                    {latestCertificate
                      ? formatDate(
                          latestCertificate.issuedAt,
                          locale
                        )
                      : "—"}
                  </strong>
                  <span>{t.latest}</span>
                </div>
              </div>
            </section>

            {/* Empty State */}

            {certificates.length === 0 ? (
              <section className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <AwardIcon />
                </div>

                <h2>{t.emptyTitle}</h2>
                <p>{t.emptyText}</p>

                <Link
                  href={`/${locale}/courses`}
                  className={styles.primaryButton}
                >
                  {t.explore}
                </Link>
              </section>
            ) : (
              <section
                className={styles.collection}
                aria-labelledby="certificate-list-title"
              >
                <div className={styles.sectionHeader}>
                  <div>
                    <span className={styles.sectionEyebrow}>
                      {t.archive}
                    </span>

                    <h2 id="certificate-list-title">
                      {t.count}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className={styles.refreshButton}
                    onClick={retry}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M20 8a8 8 0 1 0 1 5M20 3v5h-5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    {t.refresh}
                  </button>
                </div>

                {/* Certificate List */}

                <div className={styles.certificateList}>
                  {certificates.map((certificate) => (
                    <article
                      key={certificate.id}
                      className={styles.certificateRow}
                    >
                      <div className={styles.certificateMark}>
                        <AwardIcon />
                      </div>

                      <div className={styles.certificateInfo}>
                        <div className={styles.certificateMeta}>
                          <span className={styles.certificateType}>
                            CRESTMARK ACADEMY
                          </span>

                          <span className={styles.issuedBadge}>
                            <span
                              className={styles.statusDot}
                            />
                            {t.issued}
                          </span>
                        </div>

                        <h3>{t.awarded}</h3>

                        <div className={styles.certificateDetails}>
                          <div>
                            <span>{t.number}</span>

                            <strong
                              className={styles.certificateNumber}
                              dir="ltr"
                            >
                              {certificate.certificateNumber}
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
                        </div>

                        {/* Copy and Feedback */}

                        <div className={styles.certificateFooter}>
                          <button
                            type="button"
                            className={styles.copyButton}
                            onClick={() => {
                              void copyCertificateNumber(
                                certificate
                              );
                            }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                            >
                              <rect
                                x="8"
                                y="8"
                                width="12"
                                height="12"
                                rx="2"
                                stroke="currentColor"
                                strokeWidth="1.7"
                              />
                              <path
                                d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
                                stroke="currentColor"
                                strokeWidth="1.7"
                              />
                            </svg>

                            {copiedId === certificate.id
                              ? t.copied
                              : t.copyNumber}
                          </button>
                        </div>

                        {downloadFeedback?.id ===
                          certificate.id && (
                          <p
                            role={
                              downloadFeedback.success
                                ? "status"
                                : "alert"
                            }
                            className={
                              downloadFeedback.success
                                ? styles.downloadSuccess
                                : styles.downloadError
                            }
                          >
                            {downloadFeedback.message}
                          </p>
                        )}
                      </div>

                      {/* View and Download */}

                      <div
                        className={styles.certificateActions}
                      >
                        <Link
                          href={`/${locale}/my-certificates/${certificate.id}`}
                          className={styles.viewCertificateButton}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="3"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                          </svg>

                          {t.view}
                        </Link>

                        <button
                          type="button"
                          className={styles.downloadCertificateButton}
                          disabled={downloadingId !== null}
                          aria-busy={
                            downloadingId === certificate.id
                          }
                          onClick={() => {
                            void downloadCertificate(
                              certificate
                            );
                          }}
                        >
                          {downloadingId === certificate.id ? (
                            <span
                              className={styles.buttonSpinner}
                              aria-hidden="true"
                            />
                          ) : (
                            <svg
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
                          )}

                          {downloadingId === certificate.id
                            ? t.downloading
                            : t.download}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <div className={styles.bottomNavigation}>
          <Link href={`/${locale}/my-learning`}>
            <span aria-hidden="true">←</span>
            {t.back}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function MyCertificatesPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.container}>
            <div
              className={styles.messagePanel}
              role="status"
            >
              <p>Loading certificates...</p>
            </div>
          </div>
        </main>
      }
    >
      <MyCertificatesContent />
    </Suspense>
  );
}
