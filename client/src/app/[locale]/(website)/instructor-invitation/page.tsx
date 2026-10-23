
"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import styles from "./page.module.css";

const translations = {
  en: {
    eyebrow: "CRESTMARK INSTRUCTOR ACCESS",
    title: "Your next chapter starts here.",
    description:
      "Set up your secure instructor account and get ready to share your knowledge with learners.",
    sectionLabel: "ACCOUNT ACTIVATION",
    formTitle: "Create your password",
    formDescription:
      "Choose a secure password to complete your invitation.",
    password: "New password",
    confirmPassword: "Confirm password",
    passwordPlaceholder: "Enter a secure password",
    confirmPlaceholder: "Enter your password again",
    show: "Show",
    hide: "Hide",
    hint: "Use at least 8 characters.",
    submit: "Activate my account",
    loading: "Activating account...",
    invalidToken: "This invitation link is invalid or missing.",
    invalidTokenHelp:
      "Please open your original invitation email or request a new invitation from the CrestMark administrator.",
    passwordShort: "Your password must contain at least 8 characters.",
    passwordMismatch: "The passwords do not match.",
    failed:
      "We couldn't activate your account. Your invitation may have expired or already been used.",
    successEyebrow: "ACCOUNT ACTIVATED",
    successTitle: "Welcome to CrestMark.",
    successDescription:
      "Your instructor account is ready. You can now sign in with your email and new password.",
    signIn: "Continue to sign in",
    back: "Back to sign in",
    visualEyebrow: "TEACH WITH CRESTMARK",
    visualTitle: "Knowledge moves us forward.",
    visualDescription:
      "An inspiring teaching experience begins with a space built for educators and learners.",
    visualDetail: "Create impact through education.",
  },
  ar: {
    eyebrow: "حساب المحاضر في CRESTMARK",
    title: "فصل جديد من رحلتك يبدأ هنا.",
    description:
      "فعّل حسابك كمحاضر واستعد لمشاركة خبراتك ومعرفتك مع المتعلمين.",
    sectionLabel: "تفعيل الحساب",
    formTitle: "أنشئ كلمة المرور",
    formDescription:
      "اختر كلمة مرور آمنة لإكمال تفعيل حسابك.",
    password: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    passwordPlaceholder: "أدخل كلمة مرور آمنة",
    confirmPlaceholder: "أعد إدخال كلمة المرور",
    show: "إظهار",
    hide: "إخفاء",
    hint: "استخدم 8 أحرف على الأقل.",
    submit: "تفعيل حسابي",
    loading: "جارٍ تفعيل الحساب...",
    invalidToken: "رابط الدعوة غير صالح أو لا يحتوي على رمز التفعيل.",
    invalidTokenHelp:
      "افتح الرابط الموجود في رسالة الدعوة الأصلية، أو اطلب دعوة جديدة من إدارة CrestMark.",
    passwordShort: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    failed:
      "تعذّر تفعيل الحساب. قد تكون الدعوة منتهية الصلاحية أو مستخدمة مسبقًا.",
    successEyebrow: "تم تفعيل الحساب",
    successTitle: "أهلًا بك في CrestMark.",
    successDescription:
      "أصبح حساب المحاضر جاهزًا. يمكنك تسجيل الدخول ببريدك الإلكتروني وكلمة المرور الجديدة.",
    signIn: "الانتقال لتسجيل الدخول",
    back: "العودة لتسجيل الدخول",
    visualEyebrow: "درّس مع CRESTMARK",
    visualTitle: "المعرفة تصنع المستقبل.",
    visualDescription:
      "تبدأ تجربة التعليم الملهمة من مساحة تجمع المحاضرين والمتعلمين.",
    visualDetail: "شارك معرفتك واصنع أثرًا.",
  },
} as const;

function InvitationContent() {
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const locale = params.locale === "ar" ? "ar" : "en";
  const t = translations[locale];

  const [token] = useState(() => searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      // Avoid retaining the invitation token in the visible URL
      // once the client has captured it.
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname
      );
    }
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || success || !token) return;

    if (password.length < 8) {
      setError(t.passwordShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/auth/instructor-invitation/accept",
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, password }),
        }
      );

      if (!response.ok) {
        setError(t.failed);
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch {
      setError(t.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.formPanel}>
          <div className={styles.formInner}>
            <Link href={`/${locale}`} className={styles.brand}>
              CrestMark<span>.</span>
            </Link>

            {success ? (
              <div className={styles.result} role="status">
                <span className={styles.successIcon} aria-hidden="true">
                  ✓
                </span>

                <span className={styles.eyebrow}>
                  {t.successEyebrow}
                </span>

                <h1 className={styles.title}>
                  {t.successTitle}
                </h1>

                <p className={styles.description}>
                  {t.successDescription}
                </p>

                <Link
                  href={`/${locale}/login`}
                  className={styles.submitButton}
                >
                  {t.signIn}
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
            ) : !token ? (
              <div className={styles.result} role="alert">
                <span className={styles.errorIcon} aria-hidden="true">
                  !
                </span>

                <h1 className={styles.title}>
                  {t.invalidToken}
                </h1>

                <p className={styles.description}>
                  {t.invalidTokenHelp}
                </p>

                <Link
                  href={`/${locale}/login`}
                  className={styles.submitButton}
                >
                  {t.back}
                </Link>
              </div>
            ) : (
              <>
                <span className={styles.eyebrow}>
                  {t.eyebrow}
                </span>

                <h1 className={styles.title}>
                  {t.title}
                </h1>

                <p className={styles.description}>
                  {t.description}
                </p>

                <div className={styles.formHeading}>
                  <span className={styles.sectionLabel}>
                    {t.sectionLabel}
                  </span>

                  <h2>{t.formTitle}</h2>
                  <p>{t.formDescription}</p>
                </div>

                <form
                  className={styles.form}
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <div className={styles.field}>
                    <label htmlFor="instructor-password">
                      {t.password}
                    </label>

                    <div className={styles.passwordField}>
                      <input
                        id="instructor-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder={t.passwordPlaceholder}
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setError("");
                        }}
                        disabled={loading}
                        minLength={8}
                        required
                      />

                      <button
                        type="button"
                        className={styles.togglePassword}
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        aria-label={showPassword ? t.hide : t.show}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? t.hide : t.show}
                      </button>
                    </div>

                    <span className={styles.hint}>{t.hint}</span>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="instructor-confirm-password">
                      {t.confirmPassword}
                    </label>

                    <div className={styles.passwordField}>
                      <input
                        id="instructor-confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder={t.confirmPlaceholder}
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          setError("");
                        }}
                        disabled={loading}
                        required
                      />

                      <button
                        type="button"
                        className={styles.togglePassword}
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        disabled={loading}
                        aria-label={
                          showConfirmPassword ? t.hide : t.show
                        }
                        aria-pressed={showConfirmPassword}
                      >
                        {showConfirmPassword ? t.hide : t.show}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className={styles.error} role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    className={styles.submitButton}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? t.loading : t.submit}
                    {!loading && (
                      <span aria-hidden="true">↗</span>
                    )}
                  </button>
                </form>

                <Link
                  href={`/${locale}/login`}
                  className={styles.backLink}
                >
                  {t.back}
                </Link>
              </>
            )}
          </div>
        </section>

        <aside className={styles.visualPanel}>
          <div className={styles.visualContent}>
            <span className={styles.visualEyebrow}>
              <span className={styles.visualDot} />
              {t.visualEyebrow}
            </span>

            <div className={styles.visualCenter}>
              <div className={styles.visualEmblem} aria-hidden="true">
                <div className={styles.emblemInner}>CM</div>
                <span className={styles.emblemArcOne} />
                <span className={styles.emblemArcTwo} />
              </div>

              <h2>{t.visualTitle}</h2>
              <p>{t.visualDescription}</p>
            </div>

            <div className={styles.visualFooter}>
              <span className={styles.footerLine} />
              <span>{t.visualDetail}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function InstructorInvitationPage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <InvitationContent />
    </Suspense>
  );
}
