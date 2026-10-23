"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  getCurrentSession,
  type SessionUser,
} from "@/lib/auth-session";
import NotificationBell from "./NotificationBell";
import styles from "./Navbar.module.css";
type SessionState =
  | "loading"
  | "guest"
  | "authenticated"
  | "unavailable";
type Locale = "en" | "ar";
// ========================================
// Translations
// ========================================
const translations = {
  en: {
    home: "Home",
    courses: "Courses",
    categories: "Categories",
    about: "About Us",
    contact: "Contact",
    myCertificates: "My Certificates",
    verifyCertificate: "Verify Certificate",
    search: "Search courses",
    login: "Log in",
    signup: "Sign Up",
    myLearning: "My Learning",
    savedCourses: "Saved Courses",
    myOrders: "My Orders",
    dashboard: "Dashboard",
    instructorDashboard: "Instructor Dashboard",
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
    myCertificates: "شهاداتي",
    verifyCertificate: "التحقق من الشهادات",
    search: "البحث عن دورات",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    myLearning: "دوراتي",
    savedCourses: "الدورات المحفوظة",
    myOrders: "طلباتي",
    dashboard: "لوحة التحكم",
    instructorDashboard: "لوحة تحكم المحاضر",
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
// ========================================
// Icons
// ========================================
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 5 5" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 4.5 6 4.5 9S15 18 12 21M12 3c-3 3-4.5 6-4.5 9S9 18 12 21" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
// ========================================
// Navbar
// ========================================
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const accountRef = useRef<HTMLDivElement>(null);
  // ========================================
  // Locale
  // ========================================
  const locale: Locale =
    pathname === "/ar" || pathname.startsWith("/ar/")
      ? "ar"
      : "en";
  const t = translations[locale];
  // ========================================
  // State
  // ========================================
  const [user, setUser] = useState<SessionUser | null>(
    null
  );
  const [session, setSession] =
    useState<SessionState>("loading");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [avatarState, setAvatarState] = useState<{
    userId: number | string;
    hasImage: boolean;
    version: number;
  } | null>(null);
  // ========================================
  // Restore Authentication Session
  // ========================================
  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      try {
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
      } catch {
        if (!cancelled) {
          setSession("unavailable");
        }
      }
    }
    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [pathname, retryCount]);
  // ========================================
  // Profile Photo - sync with Profile page
  // ========================================
  useEffect(() => {
    if (session !== "authenticated" || !user) return;
    let active = true;
    let requestId = 0;
    const userId = user.id;
    async function loadAvatar() {
      const id = ++requestId;
      try {
        const send = () => fetch("/api/profile", {
          credentials: "same-origin",
          cache: "no-store",
        });
        let response = await send();
        if (response.status === 401) {
          const restored = await getCurrentSession();
          if (!active || restored.status !== "authenticated") return;
          response = await send();
        }
        if (!response.ok) return;
        const data: unknown = await response.json();
        if (!data || typeof data !== "object") return;
        const profile = data as Record<string, unknown>;
        if (Number(profile.userId) !== Number(userId)) return;
        if (!active || id !== requestId) return;
        const hasImage =
          typeof profile.profileImageUrl === "string" &&
          profile.profileImageUrl.trim().length > 0;
        setAvatarState((previous) => ({
          userId,
          hasImage,
          version: (previous?.version ?? 0) + 1,
        }));
      } catch {
        // Keep the fallback avatar when the API is unavailable.
      }
    }
    function onProfileUpdated() {
      void loadAvatar();
    }
    void loadAvatar();
    window.addEventListener("crestmark:profile-updated", onProfileUpdated);
    return () => {
      active = false;
      window.removeEventListener("crestmark:profile-updated", onProfileUpdated);
    };
  }, [session, user?.id]);
  // ========================================
  // Close Menus
  // ========================================
  useEffect(() => {
    if (!accountOpen && !menuOpen) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMenuOpen(false);
      }
    }
    function handleOutsideClick(event: PointerEvent) {
      if (
        accountOpen &&
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );
    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );
    };
  }, [accountOpen, menuOpen]);
  // ========================================
  // Roles
  // ========================================
  const isAdmin =
    user?.roles.some(
      (role) => role.toLowerCase() === "admin"
    ) ?? false;
  const isStudent =
    user?.roles.some(
      (role) => role.toLowerCase() === "student"
    ) ?? false;
  const isInstructor =
    user?.roles.some(
      (role) => role.toLowerCase() === "instructor"
    ) ?? false;
  // ========================================
  // Main Navigation
  // ========================================
  const navLinks = [
    {
      label: t.home,
      href: `/${locale}`,
    },
    {
      label: t.courses,
      href: `/${locale}/courses`,
    },
    {
      label: t.categories,
      href: `/${locale}/categories`,
    },
    {
      label: t.about,
      href: `/${locale}/about`,
    },
    {
      label: t.verifyCertificate,
      href: `/${locale}/verify-certificate`,
    },
    {
      label: t.contact,
      href: `/${locale}/contact`,
    },
  ];
  // ========================================
  // Account Navigation
  // ========================================
const accountLinks = [
  ...(isAdmin
    ? [
        {
          label: t.dashboard,
          href: `/${locale}/admin`,
        },
      ]
    : []),
  ...(isInstructor
    ? [
        {
          label: t.instructorDashboard,
          href: `/${locale}/instructor`,
        },
      ]
    : []),
  ...(isStudent
    ? [
        {
          label: t.myLearning,
          href: `/${locale}/my-learning`,
        },
        {
          label: t.savedCourses,
          href: `/${locale}/saved-courses`,
        },
        {
          label: t.myOrders,
          href: `/${locale}/my-orders`,
        },
        {
          label: t.myCertificates,
          href: `/${locale}/my-certificates`,
        },
      ]
    : []),
  {
    label: t.profile,
    href: `/${locale}/profile`,
  },
];
  // ========================================
  // Language Switching
  // ========================================
  const otherLocale =
    locale === "en" ? "ar" : "en";
  const localizedPath =
    pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${otherLocale}`) ||
    `/${otherLocale}`;
  const displayName = user?.username || "";
  // ========================================
  // Helpers
  // ========================================
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
  // ========================================
  // Logout
  // ========================================
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
  // ========================================
  // Render
  // ========================================
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Brand */}
        <Link
          href={`/${locale}`}
          className={styles.brand}
          aria-label="CrestMark Academy"
          onClick={closeMenus}
        >
          <Image
            src="/crestmark-logo.png?v=2"
            alt="CrestMark"
            width={1993}
            height={453}
            unoptimized
            priority
            className={styles.navbarLogo}
          />
        </Link>
        {/* Desktop Navigation */}
        <nav
          className={styles.desktopNav}
          aria-label={
            locale === "ar"
              ? "التنقل الرئيسي"
              : "Main navigation"
          }
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${
                isActive(link.href)
                  ? styles.active
                  : ""
              }`}
              aria-current={
                pathname === link.href
                  ? "page"
                  : undefined
              }
              onClick={closeMenus}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {/* Search, Language, Account */}
        <div className={styles.actions}>
          {/* Search */}
            {session === "authenticated" && user && (
            <NotificationBell
              key={user.id}
              locale={locale}
              userId={user.id}
            />
          )}
          <Link
            href={`/${locale}/courses`}
            className={styles.searchAction}
            aria-label={t.search}
            title={t.search}
            onClick={closeMenus}
          >
            <SearchIcon />
          </Link>
          {/* Language Switch */}
          <Link
            href={localizedPath}
            hrefLang={otherLocale}
            className={styles.languageButton}
            aria-label={t.language}
            title={t.language}
            onClick={closeMenus}
          >
            <GlobeIcon />
            <span>{otherLocale.toUpperCase()}</span>
          </Link>
          {/* Authentication */}
          {session === "loading" ? (
            <div
              className={styles.accountSkeleton}
              aria-hidden="true"
            />
          ) : session === "unavailable" ? (
            <button
              type="button"
              className={styles.retryButton}
              onClick={retrySession}
              title={t.sessionUnavailable}
            >
              {t.retry}
            </button>
          ) : session === "authenticated" && user ? (
            <div
              className={styles.accountArea}
              ref={accountRef}
            >
              <button
                type="button"
                className={styles.accountButton}
                aria-label={t.account}
                aria-haspopup="menu"
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
                    {avatarState?.userId === user.id && avatarState.hasImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/profile/image?v=${avatarState.version}`}
                        alt={displayName}
                        onError={() =>
                          setAvatarState((previous) =>
                            previous && previous.userId === user.id
                              ? { ...previous, hasImage: false }
                              : previous
                          )
                        }
                      />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </span>
                <span className={styles.accountName}>
                  {displayName}
                </span>
                <ChevronIcon />
              </button>
              {/* Account Dropdown */}
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
                      className={styles.dropdownLink}
                      onClick={closeMenus}
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
                      className={styles.logoutError}
                      role="alert"
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
                onClick={closeMenus}
              >
                {t.login}
              </Link>
              <Link
                href={`/${locale}/register`}
                className={styles.signup}
                onClick={closeMenus}
              >
                {t.signup}
              </Link>
            </div>
          )}
          {/* Mobile Toggle */}
          <button
            type="button"
            className={styles.menuToggle}
            aria-label={
              menuOpen ? t.close : t.menu
            }
            aria-expanded={menuOpen}
            aria-controls={
              menuOpen
                ? "crestmark-mobile-nav"
                : undefined
            }
            onClick={() => {
              setMenuOpen((value) => !value);
              setAccountOpen(false);
            }}
          >
            {menuOpen ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path d="M5 5 19 19M19 5 5 19" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {/* Mobile Navigation */}
      {menuOpen && (
        <nav
          id="crestmark-mobile-nav"
          className={styles.mobileNav}
          aria-label={
            locale === "ar"
              ? "قائمة الجوال"
              : "Mobile navigation"
          }
        >
          {/* Public Links */}
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
              aria-current={
                pathname === link.href
                  ? "page"
                  : undefined
              }
            >
              {link.label}
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
          {/* Mobile Account */}
          {session === "authenticated" && user ? (
            <div className={styles.mobileAccount}>
              <div className={styles.mobileUser}>
                <span className={styles.avatar}>
                    {avatarState?.userId === user.id && avatarState.hasImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/profile/image?v=${avatarState.version}`}
                        alt={displayName}
                        onError={() =>
                          setAvatarState((previous) =>
                            previous && previous.userId === user.id
                              ? { ...previous, hasImage: false }
                              : previous
                          )
                        }
                      />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </span>
                <div className={styles.mobileUserDetails}>
                  <strong>{displayName}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
              {/* Account Links */}
              {accountLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.mobileLink}
                  onClick={closeMenus}
                >
                  {link.label}
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
              {/* Logout */}
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
                  className={styles.logoutError}
                  role="alert"
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
            <div className={styles.mobileAccount}>
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
