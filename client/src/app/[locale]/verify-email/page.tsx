
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import styles from "./page.module.css";

type Status =
  | "ready"
  | "submitting"
  | "success"
  | "error";

const translations = {
  en: {
    eyebrow: "ACCOUNT VERIFICATION",
    title: "Verify your email address.",
    description:
      "One more step before you can access your CrestMark Academy account.",
    verify: "Verify my email",
    verifying: "Verifying your email...",
    success: "Your email is verified!",
    successDescription:
      "Your account has been activated. You can now sign in and start exploring courses.",
    login: "Continue to login",
    invalid: "Verification link unavailable",
    invalidDescription:
      "Your verification link is missing or invalid. Please request a new confirmation email.",
    failed: "We couldn't verify your email.",
    failedDescription:
      "The link may be expired or already used. Please request a new confirmation email if needed.",
    retry: "Try again",
    courses: "Explore courses",
    note: "Your verification link is private. Please don't share it.",
  },
  ar: {
    eyebrow: "تفعيل الحساب",
    title: "فعّل بريدك الإلكتروني.",
    description:
      "باقي خطوة واحدة حتى تتمكن من الدخول إلى حسابك في CrestMark Academy.",
    verify: "تفعيل حسابي",
    verifying: "جارٍ تفعيل الحساب...",
    success: "تم تفعيل بريدك الإلكتروني!",
    successDescription:
      "تم تفعيل حسابك بنجاح. يمكنك الآن تسجيل الدخول واستكشاف الدورات.",
    login: "الانتقال لتسجيل الدخول",
    invalid: "رابط التفعيل غير متاح",
    invalidDescription:
      "رابط التفعيل مفقود أو غير صالح. يرجى طلب رسالة تفعيل جديدة.",
    failed: "تعذّر تفعيل بريدك الإلكتروني.",
    failedDescription:
      "قد يكون الرابط منتهي الصلاحية أو مستخدمًا مسبقًا. يمكنك طلب رسالة تفعيل جديدة عند الحاجة.",
    retry: "المحاولة مرة أخرى",
    courses: "استكشف الدورات",
    note: "رابط التفعيل خاص بحسابك، فلا تشاركه مع الآخرين.",
  },
} as const;

export default function VerifyEmailPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale === "ar" ? "ar" : "en";
  const t = translations[locale];

  const [status, setStatus] = useState<Status>("ready");
  const [errorMessage, setErrorMessage] = useState("");

  async function verifyEmail() {
    if (status === "submitting" || status === "success") {
      return;
    }

    // Read the token only when the user clicks Verify.
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token")?.trim() ?? "";

    if (!token) {
      setStatus("error");
      setErrorMessage(t.invalidDescription);
      return;
    }

    // Remove the token from browser history.
    url.searchParams.delete("token");

    window.history.replaceState(
      window.history.state,
      "",
      url.pathname + url.search + url.hash
    );

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/auth/confirm-email",
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
          cache: "no-store",
        }
      );

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(t.failedDescription);
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(t.failedDescription);
    }
  }

  const isSuccess = status === "success";
  const isSubmitting = status === "submitting";
  const isError = status === "error";

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div
          className={`${styles.statusIcon} ${
            isSuccess ? styles.successIcon : ""
          } ${isError ? styles.errorIcon : ""}`}
          aria-hidden="true"
        >
          {isSuccess ? (
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 3 3 5-6" />
            </svg>
          ) : isError ? (
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v6M12 17h.01" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="3"
              />
              <path d="m4 7 8 6 8-6" />
            </svg>
          )}
        </div>

        <span className={styles.eyebrow}>
          {t.eyebrow}
        </span>

        <h1 className={styles.title}>
          {isSuccess
            ? t.success
            : isError
              ? t.invalid
              : t.title}
        </h1>

        <p
          className={styles.description}
          role="status"
        >
          {isSuccess
            ? t.successDescription
            : isError
              ? errorMessage
              : isSubmitting
                ? t.verifying
                : t.description}
        </p>

        {status === "ready" && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={verifyEmail}
          >
            {t.verify}
          </button>
        )}

        {isSubmitting && (
          <button
            type="button"
            className={styles.primaryButton}
            disabled
          >
            {t.verifying}
          </button>
        )}

        {isSuccess && (
          <Link
            href={`/${locale}/login`}
            className={styles.primaryButton}
          >
            {t.login}
          </Link>
        )}

        <Link
          href={`/${locale}/courses`}
          className={styles.secondaryLink}
        >
          {t.courses}
        </Link>

        <div className={styles.footer}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>

          <span>{t.note}</span>
        </div>
      </section>
    </main>
  );
}
