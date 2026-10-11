
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getCurrentSession,
  type SessionUser,
} from "@/lib/auth-session";
import styles from "./Navbar.module.css";

type SessionState =
  | "loading"
  | "guest"
  | "authenticated"
  | "unavailable";

const translations = {
  en: {
    home: "Home",
    courses: "Courses",
    categories: "Categories",
    about: "About Us",
    contact: "Contact",
    search: "Search courses",
    login: "Log in",
    signup: "Sign Up",
    myLearning: "My Learning",
    dashboard: "Dashboard",
    profile: "My Profile",
    logout: "Log out",
    loggingOut: "Logging out...",
    logoutError: "Couldn't log out. Please try again.",
    sessionUnavailable: "Session temporarily unavailable",
    retry: "Try again",
    menu: "Open menu",
    close: "Close menu",
    account: "Account menu",
    language: "Switch to Arabic",
  },
  ar: {
    home: "الرئيسية",
    courses: "الدورات",
    categories: "التصنيفات",
    about: "من نحن",
    contact: "تواصل معنا",
    search: "البحث عن دورات",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    myLearning: "دوراتي",
    dashboard: "لوحة التحكم",
    profile: "ملفي الشخصي",
    logout: "تسجيل الخروج",
    loggingOut: "جارٍ تسجيل الخروج...",
    logoutError: "تعذّر تسجيل الخروج. حاول مرة أخرى.",
    sessionUnavailable: "تعذّر الاتصال مؤقتًا",
    retry: "إعادة المحاولة",
    menu: "فتح القائمة",
    close: "إغلاق القائمة",
    account: "قائمة الحساب",
    language: "التبديل إلى الإنجليزية",
  },
} as const;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const locale = pathname.startsWith("/ar") ? "ar" : "en";
  const t = translations[locale];

  const [user, setUser] = useState<SessionUser | null>(null);
  const [session, setSession] =
    useState<SessionState>("loading");

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Restore the session on page navigation and retries.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const result = await getCurrentSession();

      if (cancelled) return;

      if (result.status === "authenticated") {
        setUser(result.user);
        setSession("authenticated");
        return;
      }

      if (result.status === "unavailable") {
        setSession("unavailable");
        return;
      }

      setUser(null);
      setSession("guest");
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [pathname, retryCount]);

  const isAdmin =
    user?.roles.some(
      (role) => role.toLowerCase() === "admin"
    ) ?? false;

  const isStudent =
    user?.roles.some(
      (role) => role.toLowerCase() === "student"
    ) ?? false;

  const navLinks = [
    { label: t.home, href: `/${locale}` },
    { label: t.courses, href: `/${locale}/courses` },
    {
      label: t.categories,
      href: `/${locale}/categories`,
    },
    { label: t.about, href: `/${locale}/about` },
    { label: t.contact, href: `/${locale}/contact` },
  ];

  const otherLocale = locale === "en" ? "ar" : "en";

  const localizedPath = pathname.replace(
    /^\/(en|ar)(?=\/|$)/,
    `/${otherLocale}`
  );

  function closeMenus() {
    setMenuOpen(false);
    setAccountOpen(false);
  }

  function isActive(href: string) {
    return (
      pathname === href ||
      (href !== `/${locale}` &&
        pathname.startsWith(`${href}/`))
    );
  }

  function retrySession() {
    setSession("loading");
    setRetryCount((count) => count + 1);
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        setLogoutError(t.logoutError);
        return;
      }

      setUser(null);
      setSession("guest");
      closeMenus();

      router.replace(`/${locale}`);
      router.refresh();
    } catch {
      setLogoutError(t.logoutError);
    } finally {
      setLoggingOut(false);
    }
  }

  const accountLinks = [
    ...(isAdmin
      ? [
          {
            label: t.dashboard,
            href: `/${locale}/admin`,
          },
        ]
      : []),
    ...(isStudent
      ? [
          {
            label: t.myLearning,
            href: `/${locale}/my-learning`,
          },
        ]
      : []),
    {
      label: t.profile,
      href: `/${locale}/profile`,
    },
  ];

  const displayName = user?.username || "";

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link
          href={`/${locale}`}
          className={styles.brand}
          aria-label="CrestMark Academy"
          onClick={closeMenus}
        >
          <Image
            src="/crestmark-logo.png"
            alt="CrestMark"
            width={172}
            height={54}
            priority
            className={styles.logo}
          />
        </Link>

        <nav
          className={styles.desktopNav}
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${
                isActive(link.href) ? styles.active : ""
              }`}
              aria-current={
                pathname === link.href ? "page" : undefined
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link
            href={`/${locale}/courses`}
            className={styles.searchAction}
            aria-label={t.search}
            onClick={closeMenus}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 5 5" />
            </svg>
          </Link>

          <Link
            href={localizedPath}
            hrefLang={otherLocale}
            className={styles.languageButton}
            aria-label={t.language}
            onClick={closeMenus}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c3 3 4.5 6 4.5 9S15 18 12 21M12 3c-3 3-4.5 6-4.5 9S9 18 12 21" />
            </svg>
            <span>{otherLocale.toUpperCase()}</span>
          </Link>

          {session === "loading" ? (
            <div
              className={styles.accountSkeleton}
              aria-hidden="true"
            />
          ) : session === "unavailable" ? (
            <button
              type="button"
              className={styles.login}
              onClick={retrySession}
              title={t.retry}
              aria-label={`${t.sessionUnavailable}. ${t.retry}`}
            >
              {t.retry}
            </button>
          ) : session === "authenticated" && user ? (
            <div className={styles.accountArea}>
              <button
                type="button"
                className={styles.accountButton}
                aria-label={t.account}
                aria-expanded={accountOpen}
                aria-controls={
                  accountOpen
                    ? "cm-account-dropdown"
                    : undefined
                }
                onClick={() => {
                  setAccountOpen((value) => !value);
                  setMenuOpen(false);
                }}
              >
                <span className={styles.avatar}>
                  {displayName.charAt(0).toUpperCase()}
                </span>

                <span className={styles.accountName}>
                  {displayName}
                </span>

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {accountOpen && (
                <div
                  id="cm-account-dropdown"
                  className={styles.accountDropdown}
                >
                  <div className={styles.accountIdentity}>
                    <strong>{displayName}</strong>
                    <span>{user.email}</span>
                  </div>

                  {accountLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenus}
                      className={styles.dropdownLink}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <button
                    type="button"
                    className={styles.logoutButton}
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut
                      ? t.loggingOut
                      : t.logout}
                  </button>

                  {logoutError && (
                    <p
                      role="alert"
                      className={styles.logoutError}
                    >
                      {logoutError}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.guestActions}>
              <Link
                href={`/${locale}/login`}
                className={styles.login}
              >
                {t.login}
              </Link>

              <Link
                href={`/${locale}/register`}
                className={styles.signup}
              >
                {t.signup}
              </Link>
            </div>
          )}

          <button
            type="button"
            className={styles.menuToggle}
            aria-label={menuOpen ? t.close : t.menu}
            aria-expanded={menuOpen}
            aria-controls={
              menuOpen ? "crestmark-mobile-nav" : undefined
            }
            onClick={() => {
              setMenuOpen((value) => !value);
              setAccountOpen(false);
            }}
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 5 19 19M19 5 5 19" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="crestmark-mobile-nav"
          className={styles.mobileNav}
          aria-label="Mobile navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenus}
              className={`${styles.mobileLink} ${
                isActive(link.href)
                  ? styles.mobileActive
                  : ""
              }`}
            >
              {link.label}
            </Link>
          ))}

          {session === "authenticated" && user ? (
            <div className={styles.mobileAccount}>
              <div className={styles.mobileUser}>
                <span className={styles.avatar}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <span>{displayName}</span>
              </div>

              {accountLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.mobileLink}
                  onClick={closeMenus}
                >
                  {link.label}
                </Link>
              ))}

              <button
                type="button"
                className={styles.mobileLogout}
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut
                  ? t.loggingOut
                  : t.logout}
              </button>

              {logoutError && (
                <p
                  role="alert"
                  className={styles.logoutError}
                >
                  {logoutError}
                </p>
              )}
            </div>
          ) : session === "guest" ? (
            <div className={styles.mobileActions}>
              <Link
                href={`/${locale}/login`}
                onClick={closeMenus}
              >
                {t.login}
              </Link>

              <Link
                href={`/${locale}/register`}
                onClick={closeMenus}
              >
                {t.signup}
              </Link>
            </div>
          ) : session === "unavailable" ? (
            <div className={styles.mobileActions}>
              <button
                type="button"
                className={styles.mobileLogout}
                onClick={retrySession}
              >
                {t.sessionUnavailable} — {t.retry}
              </button>
            </div>
          ) : null}
        </nav>
      )}
    </header>
  );
}
