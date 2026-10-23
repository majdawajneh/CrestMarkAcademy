
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./page.module.css";

type Locale = "en" | "ar";
type Status = "loading" | "ready" | "guest" | "error";

type ProfileSummary = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  emailConfirmed: boolean;
};

type PasswordForm = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const emptyPassword: PasswordForm = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const copy = {
  en: {
    home: "Home",
    dashboard: "Dashboard",
    settings: "Settings",
    eyebrow: "ACCOUNT SETTINGS",
    title: "Account & security.",
    subtitle:
      "Manage your account information and keep your CrestMark experience secure.",
    account: "Account overview",
    accountDesc:
      "Your registered account details.",
    name: "Full name",
    email: "Email address",
    username: "Username",
    emailVerified: "Verified",
    emailUnverified: "Not verified",
    manageProfile: "Edit profile",
    security: "Password & security",
    securityDesc:
      "Change your password to help protect your account.",
    oldPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    passwordHint:
      "Your new password must contain between 8 and 100 characters.",
    matchHint: "Both new password fields must match.",
    passwordRules:
      "Choose a unique password that you do not use on other websites.",
    show: "Show",
    hide: "Hide",
    changePassword: "Update password",
    changingPassword: "Updating password...",
    passwordSuccess:
      "Your password was changed successfully. Please sign in again.",
    passwordError:
      "Unable to change your password. Check your current password and try again.",
    invalidLength:
      "Your new password must contain 8–100 characters.",
    mismatch:
      "The new password and confirmation do not match.",
    samePassword:
      "Choose a new password different from your current password.",
    required:
      "Complete all password fields before continuing.",
    loading: "Loading your account settings...",
    loadError: "Couldn't load your account details.",
    guest: "Sign in to access your account settings.",
    retry: "Try again",
    login: "Sign in",
    back: "Back to dashboard",
    signedOutNote:
      "For your security, sign out of your existing session before signing in with the new password.",
  },

  ar: {
    home: "الرئيسية",
    dashboard: "لوحة التحكم",
    settings: "الإعدادات",
    eyebrow: "إعدادات الحساب",
    title: "الحساب والأمان.",
    subtitle:
      "إدارة معلومات حسابك والمحافظة على أمان تجربتك التعليمية في CrestMark.",
    account: "معلومات الحساب",
    accountDesc:
      "المعلومات المرتبطة بحسابك المسجّل.",
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    username: "اسم المستخدم",
    emailVerified: "موثّق",
    emailUnverified: "غير موثّق",
    manageProfile: "تعديل الملف الشخصي",
    security: "كلمة المرور والأمان",
    securityDesc:
      "غيّر كلمة مرورك للمساعدة في حماية حسابك.",
    oldPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور الجديدة",
    passwordHint:
      "يجب أن تتكون كلمة المرور الجديدة من 8 إلى 100 حرف.",
    matchHint:
      "يجب أن تتطابق كلمة المرور الجديدة مع التأكيد.",
    passwordRules:
      "اختار كلمة مرور فريدة ما بتستخدمها في مواقع ثانية.",
    show: "إظهار",
    hide: "إخفاء",
    changePassword: "تحديث كلمة المرور",
    changingPassword: "جارٍ تحديث كلمة المرور...",
    passwordSuccess:
      "تم تغيير كلمة المرور بنجاح. يُرجى تسجيل الدخول مرة أخرى.",
    passwordError:
      "تعذّر تغيير كلمة المرور. تحقق من كلمة المرور الحالية وحاول مجددًا.",
    invalidLength:
      "يجب أن تتكون كلمة المرور الجديدة من 8 إلى 100 حرف.",
    mismatch:
      "كلمة المرور الجديدة وتأكيدها غير متطابقين.",
    samePassword:
      "اختار كلمة مرور جديدة مختلفة عن الحالية.",
    required:
      "يرجى تعبئة جميع حقول كلمة المرور.",
    loading: "جارٍ تحميل إعدادات الحساب...",
    loadError: "تعذّر تحميل معلومات الحساب.",
    guest: "سجّل الدخول للوصول إلى إعدادات الحساب.",
    retry: "إعادة المحاولة",
    login: "تسجيل الدخول",
    back: "العودة إلى لوحة التحكم",
    signedOutNote:
      "لحماية حسابك، سجّل الخروج من الجلسة الحالية قبل الدخول بكلمة المرور الجديدة.",
  },
} as const;

function isProfileSummary(
  value: unknown
): value is ProfileSummary {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.firstName === "string" &&
    typeof data.lastName === "string" &&
    typeof data.username === "string" &&
    typeof data.email === "string" &&
    typeof data.emailConfirmed === "boolean"
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  showLabel,
  hideLabel,
  autoComplete,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
  autoComplete: string;
  disabled: boolean;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>

      <div className={styles.passwordInput}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          required
          disabled={disabled}
          spellCheck={false}
          autoCapitalize="off"
          maxLength={100}
        />

        <button
          type="button"
          className={styles.visibilityButton}
          onClick={onToggle}
          disabled={disabled}
          aria-label={
            visible
              ? `${hideLabel}: ${label}`
              : `${showLabel}: ${label}`
          }
          aria-pressed={visible}
        >
          {visible ? hideLabel : showLabel}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const params = useParams<{ locale: string }>();

  const locale: Locale =
    params.locale === "ar" ? "ar" : "en";

  const t = copy[locale];

  const [status, setStatus] =
    useState<Status>("loading");

  const [profile, setProfile] =
    useState<ProfileSummary | null>(null);

  const [retry, setRetry] = useState(0);

  const [form, setForm] =
    useState<PasswordForm>({ ...emptyPassword });

  const [visible, setVisible] = useState({
    old: false,
    next: false,
    confirm: false,
  });

  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);
  const [error, setError] = useState("");

  const loadSettings = useCallback(
    async (signal: AbortSignal) => {
      try {
        const session = await getCurrentSession();

        if (signal.aborted) return;

        if (session.status === "guest") {
          setStatus("guest");
          return;
        }

        if (session.status !== "authenticated") {
          setStatus("error");
          return;
        }

        const request = () =>
          fetch("/api/profile", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            signal,
          });

        let response = await request();

        if (response.status === 401) {
          const renewed = await getCurrentSession();

          if (signal.aborted) return;

          if (renewed.status !== "authenticated") {
            setStatus(
              renewed.status === "guest"
                ? "guest"
                : "error"
            );
            return;
          }

          response = await request();
        }

        if (!response.ok) {
          throw new Error("Unable to load profile");
        }

        const data: unknown = await response.json();

        if (!isProfileSummary(data)) {
          throw new Error("Invalid profile response");
        }

        if (signal.aborted) return;

        setProfile(data);
        setStatus("ready");
      } catch {
        if (!signal.aborted) {
          setStatus("error");
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();

    async function initialize() {
      await Promise.resolve();

      if (!controller.signal.aborted) {
        await loadSettings(controller.signal);
      }
    }

    void initialize();

    return () => {
      controller.abort();
    };
  }, [loadSettings, retry]);

  function updateField(
    key: keyof PasswordForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setError("");
  }

  async function changePassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving || changed || status !== "ready") {
      return;
    }

    const {
      oldPassword,
      newPassword,
      confirmPassword,
    } = form;

    if (
      !oldPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setError(t.required);
      return;
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 100
    ) {
      setError(t.invalidLength);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.mismatch);
      return;
    }

    if (oldPassword === newPassword) {
      setError(t.samePassword);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        oldPassword,
        newPassword,
        confirmPassword,
      };

      const request = () =>
        fetch("/api/auth/change-password", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

      let response = await request();

      if (response.status === 401) {
        const session = await getCurrentSession();

        if (session.status !== "authenticated") {
          throw new Error("Session expired");
        }

        response = await request();
      }

      if (!response.ok) {
        throw new Error("Password change failed");
      }

      // Never keep a successful password in form state.
      setForm({ ...emptyPassword });
      setVisible({
        old: false,
        next: false,
        confirm: false,
      });

      setChanged(true);
    } catch {
      setError(t.passwordError);
    } finally {
      setSaving(false);
    }
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
          <Link href={`/${locale}`}>
            {t.home}
          </Link>

          <span aria-hidden="true">/</span>

          <Link href={`/${locale}/dashboard`}>
            {t.dashboard}
          </Link>

          <span aria-hidden="true">/</span>

          <span aria-current="page">
            {t.settings}
          </span>
        </nav>

        <header className={styles.heading}>
          <span className={styles.eyebrow}>
            {t.eyebrow}
          </span>

          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </header>

        {status === "loading" ? (
          <div className={styles.state} role="status">
            <span
              className={styles.spinner}
              aria-hidden="true"
            />
            <p>{t.loading}</p>
          </div>
        ) : status !== "ready" || !profile ? (
          <div className={styles.state}>
            <h2>
              {status === "guest"
                ? t.guest
                : t.loadError}
            </h2>

            {status === "guest" ? (
              <Link
                className={styles.primaryButton}
                href={`/${locale}/login`}
              >
                {t.login}
              </Link>
            ) : (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  setStatus("loading");
                  setRetry((value) => value + 1);
                }}
              >
                {t.retry}
              </button>
            )}
          </div>
        ) : (
          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <div className={styles.accountHeading}>
                <span className={styles.sectionEyebrow}>
                  {t.account}
                </span>
                <h2>{t.account}</h2>
                <p>{t.accountDesc}</p>
              </div>

              <div className={styles.accountRow}>
                <span>{t.name}</span>
                <strong>
                  {profile.firstName} {profile.lastName}
                </strong>
              </div>

              <div className={styles.accountRow}>
                <span>{t.username}</span>
                <strong>{profile.username}</strong>
              </div>

              <div className={styles.accountRow}>
                <span>{t.email}</span>
                <strong className={styles.email}>
                  {profile.email}
                </strong>
                <span
                  className={
                    profile.emailConfirmed
                      ? styles.verified
                      : styles.unverified
                  }
                >
                  {profile.emailConfirmed
                    ? t.emailVerified
                    : t.emailUnverified}
                </span>
              </div>

              <Link
                href={`/${locale}/profile`}
                className={styles.profileLink}
              >
                {t.manageProfile}
                <span aria-hidden="true">
                  {locale === "ar" ? "←" : "→"}
                </span>
              </Link>
            </aside>

            <section className={styles.security}>
              <div className={styles.securityHeader}>
                <div className={styles.securityIcon}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="11"
                      rx="2"
                    />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    <path d="M12 14v3" />
                  </svg>
                </div>

                <div>
                  <span className={styles.sectionEyebrow}>
                    SECURITY
                  </span>
                  <h2>{t.security}</h2>
                  <p>{t.securityDesc}</p>
                </div>
              </div>

              {changed ? (
                <div
                  className={styles.successPanel}
                  role="status"
                >
                  <div
                    className={styles.successIcon}
                    aria-hidden="true"
                  >
                    ✓
                  </div>
                  <h3>{t.passwordSuccess}</h3>
                  <p>{t.signedOutNote}</p>

                  <Link
                    href={`/${locale}/login`}
                    className={styles.primaryButton}
                  >
                    {t.login}
                  </Link>
                </div>
              ) : (
                <form
                  className={styles.form}
                  onSubmit={changePassword}
                >
                  <PasswordField
                    id="cm-old-password"
                    label={t.oldPassword}
                    value={form.oldPassword}
                    onChange={(value) =>
                      updateField("oldPassword", value)
                    }
                    visible={visible.old}
                    onToggle={() =>
                      setVisible((previous) => ({
                        ...previous,
                        old: !previous.old,
                      }))
                    }
                    showLabel={t.show}
                    hideLabel={t.hide}
                    autoComplete="current-password"
                    disabled={saving}
                  />

                  <div className={styles.formDivider} />

                  <PasswordField
                    id="cm-new-password"
                    label={t.newPassword}
                    value={form.newPassword}
                    onChange={(value) =>
                      updateField("newPassword", value)
                    }
                    visible={visible.next}
                    onToggle={() =>
                      setVisible((previous) => ({
                        ...previous,
                        next: !previous.next,
                      }))
                    }
                    showLabel={t.show}
                    hideLabel={t.hide}
                    autoComplete="new-password"
                    disabled={saving}
                  />

                  <p className={styles.hint}>
                    {t.passwordHint}
                  </p>

                  <PasswordField
                    id="cm-confirm-password"
                    label={t.confirmPassword}
                    value={form.confirmPassword}
                    onChange={(value) =>
                      updateField("confirmPassword", value)
                    }
                    visible={visible.confirm}
                    onToggle={() =>
                      setVisible((previous) => ({
                        ...previous,
                        confirm: !previous.confirm,
                      }))
                    }
                    showLabel={t.show}
                    hideLabel={t.hide}
                    autoComplete="new-password"
                    disabled={saving}
                  />

                  <p className={styles.hint}>
                    {t.matchHint}
                  </p>

                  <div className={styles.securityNote}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 11v5M12 8h.01" />
                    </svg>
                    <p>{t.passwordRules}</p>
                  </div>

                  {error && (
                    <p
                      className={styles.error}
                      role="alert"
                    >
                      {error}
                    </p>
                  )}

                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={saving}
                    >
                      {saving
                        ? t.changingPassword
                        : t.changePassword}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        )}

        <Link
          href={`/${locale}/dashboard`}
          className={styles.backLink}
        >
          <span aria-hidden="true">
            {locale === "ar" ? "→" : "←"}
          </span>
          {t.back}
        </Link>
      </div>
    </main>
  );
}
