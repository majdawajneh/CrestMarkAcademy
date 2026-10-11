
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "./page.module.css";

type FieldName =
  | "firstName"
  | "lastName"
  | "username"
  | "email"
  | "phoneNumber"
  | "password"
  | "confirmPassword";

type FormData = Record<FieldName, string>;

const initialForm: FormData = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

const translations = {
  en: {
    eyebrow: "JOIN CRESTMARK ACADEMY",
    title: "Your next chapter starts here.",
    description:
      "Create your account and take the first step toward new skills and learning opportunities.",
    firstName: "First name",
    lastName: "Last name",
    username: "Username",
    email: "Email address",
    phoneNumber: "Phone number",
    password: "Password",
    confirmPassword: "Confirm password",
    show: "Show",
    hide: "Hide",
    submit: "Create account",
    loading: "Creating account...",
    hasAccount: "Already have an account?",
    login: "Log in",
    required: "Please complete all fields.",
    passwordMismatch: "Passwords do not match.",
    passwordLength: "Password must be at least 8 characters.",
    failed: "Unable to create your account. Please review your details and try again.",
    successTitle: "Account created!",
    successText:
      "Your registration was accepted. Check your email for any confirmation instructions before signing in.",
    goLogin: "Continue to login",
    visualTitle: "Learn something extraordinary.",
    visualText:
      "Explore courses across different subjects and build skills that matter to you.",
  },
  ar: {
    eyebrow: "انضم إلى CRESTMARK ACADEMY",
    title: "رحلتك التعليمية تبدأ من هون.",
    description:
      "أنشئ حسابك واكتشف فرصًا جديدة للتعلّم وتطوير مهاراتك في مختلف المجالات.",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    username: "اسم المستخدم",
    email: "البريد الإلكتروني",
    phoneNumber: "رقم الهاتف",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    show: "إظهار",
    hide: "إخفاء",
    submit: "إنشاء الحساب",
    loading: "جارٍ إنشاء الحساب...",
    hasAccount: "عندك حساب بالفعل؟",
    login: "تسجيل الدخول",
    required: "يرجى تعبئة جميع الحقول.",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    passwordLength: "يجب ألا تقل كلمة المرور عن 8 أحرف.",
    failed: "تعذّر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.",
    successTitle: "تم إنشاء الحساب!",
    successText:
      "تم قبول طلب التسجيل. راجع بريدك الإلكتروني لمعرفة إذا كانت هناك خطوات لتأكيد الحساب قبل تسجيل الدخول.",
    goLogin: "الانتقال لتسجيل الدخول",
    visualTitle: "اكتشف قدرات جديدة.",
    visualText:
      "استكشف دورات تعليمية في مجالات متنوعة، وطوّر المهارات التي تهمك.",
  },
} as const;

export default function RegisterPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale === "ar" ? "ar" : "en";
  const t = translations[locale];

  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function update(field: FieldName, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    if (loading) return;

    setError("");

    if (Object.values(form).some((value) => !value.trim())) {
      setError(t.required);
      return;
    }

    if (form.password.length < 8) {
      setError(t.passwordLength);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      const {
        confirmPassword: _confirmPassword,
        ...registrationData
      } = form;

      const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        setError(t.failed);
        return;
      }

      setForm(initialForm);
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
            {success ? (
              <div className={styles.successPanel} role="status">
                <div className={styles.successIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8 12 3 3 5-6" />
                  </svg>
                </div>

                <h1>{t.successTitle}</h1>
                <p>{t.successText}</p>

                <Link
                  href={`/${locale}/login`}
                  className={styles.submitButton}
                >
                  {t.goLogin}
                </Link>
              </div>
            ) : (
              <>
                <span className={styles.eyebrow}>
                  {t.eyebrow}
                </span>

                <h1 className={styles.title}>{t.title}</h1>
                <p className={styles.description}>
                  {t.description}
                </p>

                <form
                  onSubmit={handleSubmit}
                  className={styles.form}
                >
                  <div className={styles.nameRow}>
                    <div className={styles.field}>
                      <label htmlFor="firstName">{t.firstName}</label>
                      <input
                        id="firstName"
                        autoComplete="given-name"
                        value={form.firstName}
                        onChange={(e) =>
                          update("firstName", e.target.value)
                        }
                        maxLength={100}
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="lastName">{t.lastName}</label>
                      <input
                        id="lastName"
                        autoComplete="family-name"
                        value={form.lastName}
                        onChange={(e) =>
                          update("lastName", e.target.value)
                        }
                        maxLength={100}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="username">{t.username}</label>
                    <input
                      id="username"
                      autoComplete="username"
                      value={form.username}
                      onChange={(e) =>
                        update("username", e.target.value)
                      }
                      maxLength={100}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="email">{t.email}</label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) =>
                        update("email", e.target.value)
                      }
                      maxLength={254}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="phoneNumber">
                      {t.phoneNumber}
                    </label>
                    <input
                      id="phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      dir="ltr"
                      value={form.phoneNumber}
                      onChange={(e) =>
                        update("phoneNumber", e.target.value)
                      }
                      maxLength={40}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className={styles.nameRow}>
                    <div className={styles.field}>
                      <label htmlFor="password">
                        {t.password}
                      </label>
                      <div className={styles.passwordWrapper}>
                        <input
                          id="password"
                          type={
                            showPassword ? "text" : "password"
                          }
                          autoComplete="new-password"
                          value={form.password}
                          onChange={(e) =>
                            update("password", e.target.value)
                          }
                          disabled={loading}
                          minLength={8}
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((value) => !value)
                          }
                          aria-label={
                            showPassword ? t.hide : t.show
                          }
                        >
                          {showPassword ? t.hide : t.show}
                        </button>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="confirmPassword">
                        {t.confirmPassword}
                      </label>
                      <input
                        id="confirmPassword"
                        type={
                          showPassword ? "text" : "password"
                        }
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={(e) =>
                          update("confirmPassword", e.target.value)
                        }
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <p className={styles.error} role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.submitButton}
                  >
                    {loading ? t.loading : t.submit}
                  </button>
                </form>

                <p className={styles.loginText}>
                  {t.hasAccount}{" "}
                  <Link href={`/${locale}/login`}>
                    {t.login}
                  </Link>
                </p>
              </>
            )}
          </div>
        </section>

        <aside className={styles.visualPanel}>
          <div className={styles.visualContent}>
            <span className={styles.visualEyebrow}>
              CRESTMARK ACADEMY
            </span>
            <h2>{t.visualTitle}</h2>
            <p>{t.visualText}</p>
            <span className={styles.visualRule} />
          </div>
        </aside>
      </div>
    </main>
  );
}
