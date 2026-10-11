
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import styles from "./page.module.css";

const translations = {
  en: {
    eyebrow: "WELCOME BACK",
    title: "Your learning journey continues here.",
    description:
      "Sign in to access your courses, track your progress, and keep moving forward.",
    identifier: "Email or username",
    identifierPlaceholder: "Enter your email or username",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    show: "Show",
    hide: "Hide",
    forgot: "Forgot password?",
    submit: "Log in",
    loading: "Signing in...",
    noAccount: "New to CrestMark?",
    createAccount: "Create an account",
    invalid: "Please enter your email or username and password.",
    failed: "Unable to sign in. Check your details and try again.",
    benefitsTitle: "A better place to keep learning.",
    benefits:
      "Access your learning experience in one place, from courses to progress tracking.",
  },
  ar: {
    eyebrow: "أهلًا بعودتك",
    title: "رحلتك التعليمية مستمرة معنا.",
    description:
      "سجّل دخولك للوصول إلى دوراتك ومتابعة تقدمك ومواصلة تطوير مهاراتك.",
    identifier: "البريد الإلكتروني أو اسم المستخدم",
    identifierPlaceholder: "أدخل بريدك الإلكتروني أو اسم المستخدم",
    password: "كلمة المرور",
    passwordPlaceholder: "أدخل كلمة المرور",
    show: "إظهار",
    hide: "إخفاء",
    forgot: "نسيت كلمة المرور؟",
    submit: "تسجيل الدخول",
    loading: "جارٍ تسجيل الدخول...",
    noAccount: "جديد على CrestMark؟",
    createAccount: "أنشئ حسابًا",
    invalid: "يرجى إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور.",
    failed: "تعذّر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.",
    benefitsTitle: "مكان واحد لمواصلة تعلّمك.",
    benefits:
      "تابع دوراتك وتقدمك التعليمي واستكمل رحلتك من مكان واحد.",
  },
} as const;

export default function LoginPage() {
  const params = useParams<{ locale: string }>();
  const router = useRouter();

  const locale = params.locale === "ar" ? "ar" : "en";
  const t = translations[locale];

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    if (!identifier.trim() || !password) {
      setError(t.invalid);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      if (!response.ok) {
        setError(t.failed);
        return;
      }

      
      // Authentication succeeded.
      // Session tokens are stored in HttpOnly cookies.

      setIdentifier("");
      setPassword("");
      setShowPassword(false);
      setError("");

      router.replace(`/${locale}`);
      router.refresh();

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
            <span className={styles.eyebrow}>
              {t.eyebrow}
            </span>

            <h1 className={styles.title}>
              {t.title}
            </h1>

            <p className={styles.description}>
              {t.description}
            </p>

            <form
              onSubmit={handleSubmit}
              className={styles.form}
              noValidate
            >
              <div className={styles.field}>
                <label htmlFor="identifier">
                  {t.identifier}
                </label>

                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder={t.identifierPlaceholder}
                  value={identifier}
                  onChange={(event) =>
                    setIdentifier(event.target.value)
                  }
                  disabled={loading}
                  required
                />
              </div>

              <div className={styles.field}>
                <div className={styles.passwordHeader}>
                  <label htmlFor="password">
                    {t.password}
                  </label>

                  <Link
                    href={`/${locale}/forgot-password`}
                    className={styles.forgotLink}
                  >
                    {t.forgot}
                  </Link>
                </div>

                <div className={styles.passwordField}>
                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword ? "text" : "password"
                    }
                    autoComplete="current-password"
                    placeholder={t.passwordPlaceholder}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    disabled={loading}
                    required
                  />

                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    aria-label={
                      showPassword ? t.hide : t.show
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? t.hide : t.show}
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
              </button>
            </form>

            <p className={styles.registerText}>
              {t.noAccount}{" "}
              <Link href={`/${locale}/register`}>
                {t.createAccount}
              </Link>
            </p>
          </div>
        </section>

        <aside className={styles.visualPanel}>
          <div className={styles.visualContent}>
            <div className={styles.visualMark}>
              CM<span>.</span>
            </div>

            <span className={styles.visualLine} />

            <h2>{t.benefitsTitle}</h2>
            <p>{t.benefits}</p>

            <div className={styles.visualPattern}>
              <span />
              <span />
              <span />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
