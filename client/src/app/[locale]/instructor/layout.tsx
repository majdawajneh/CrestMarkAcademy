
import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import ActiveAdminLink from "../admin/ActiveAdminLink";
import styles from "./layout.module.css";
export const instant = false;

type Locale = "en" | "ar";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

type AuthUser = {
  username: string;
  roles: string[];
};

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

const translations = {
  en: {
    brand: "INSTRUCTOR WORKSPACE",
    workspace: "YOUR WORKSPACE",
    overview: "Overview",
    courses: "My courses",
    students: "Students",
    reviews: "Course reviews",
    profile: "Professional profile",
    dashboard: "Instructor dashboard",
    description: "Your courses, learners and teaching insights.",
    instructor: "Instructor",
    website: "Back to website",
    denied: "403 — Access denied",
    deniedText: "This workspace is available to instructors only.",
    learning: "TEACHING",
    account: "ACCOUNT",
  },
  ar: {
    brand: "مساحة المحاضر",
    workspace: "مساحة العمل",
    overview: "نظرة عامة",
    courses: "دوراتي",
    students: "الطلاب",
    reviews: "تقييمات الدورات",
    profile: "الملف المهني",
    dashboard: "لوحة تحكم المحاضر",
    description: "تابع دوراتك وطلابك وأداء المحتوى التعليمي.",
    instructor: "محاضر",
    website: "العودة إلى الموقع",
    denied: "403 — الوصول مرفوض",
    deniedText: "مساحة العمل هذه مخصصة للمحاضرين فقط.",
    learning: "التدريس",
    account: "الحساب",
  },
} as const;

function NavIcon({
  name,
}: {
  name: "overview" | "courses" | "students" | "reviews" | "profile";
}) {
  const icons = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    courses: (
      <>
        <path d="M12 7v14" />
        <path d="M3 18V5a2 2 0 0 1 2-2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v13h-5a4 4 0 0 0-4 3 4 4 0 0 0-4-3H3Z" />
      </>
    ),
    students: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
        <path d="M17 5a3 3 0 0 1 0 6" />
        <path d="M18 15a5 5 0 0 1 3 5" />
      </>
    ),
    reviews: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
  };

  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

export default async function InstructorLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;

  if (locale !== "en" && locale !== "ar") {
    notFound();
  }

  const lang = locale as Locale;
  const t = translations[lang];

  // Authentication must run at request time.
  await connection();


const cookieStore = await cookies();

const accessToken = cookieStore.get("cm_access")?.value;
const refreshToken = cookieStore.get("cm_refresh")?.value;

if (!accessToken) {
  redirect(
    refreshToken
      ? `/${locale}/instructor-session`
      : `/${locale}/login`
  );
}

  let response: Response;

  try {
    response = await fetch(`${API_URL}/api/Auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error(
      "Authentication service is temporarily unavailable."
    );
  }

  if (response.status === 401) {
  redirect(
    refreshToken
      ? `/${locale}/instructor-session`
      : `/${locale}/login`
  );
}

  if (!response.ok) {
    throw new Error("Unable to verify instructor permissions.");
  }

  const data: unknown = await response.json();

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    throw new Error("Invalid authentication response.");
  }

  const user = data as Partial<AuthUser>;

  if (
    typeof user.username !== "string" ||
    !Array.isArray(user.roles) ||
    !user.roles.every((role) => typeof role === "string")
  ) {
    throw new Error("Invalid authentication response.");
  }

  if (!user.roles.includes("Instructor")) {
    return (
      <main className={styles.accessDenied}>
        <h1>{t.denied}</h1>
        <p>{t.deniedText}</p>
        <Link href={`/${locale}`}>{t.website}</Link>
      </main>
    );
  }

  const username = user.username.trim();
  const initial = username.charAt(0).toUpperCase() || "I";


  return (
    <div
      className={styles.shell}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <aside className={styles.sidebar}>
        <Link href={`/${locale}/instructor`} className={styles.brand}>
          <span className={styles.brandMark}>C</span>
          <span className={styles.brandText}>
            <strong>CrestMark</strong>
            <small>{t.brand}</small>
          </span>
        </Link>

        <div className={styles.sidebarContent}>
          <div className={styles.navigationGroup}>
            <span className={styles.groupLabel}>{t.workspace}</span>

            
            <nav aria-label={t.workspace}>
              <ActiveAdminLink
                href={`/${locale}/instructor`}
                exact
                className={styles.navItem}
                activeClassName={styles.navActive}
                indicatorClassName={styles.activeDot}
              >
                <NavIcon name="overview" />
                <span>{t.overview}</span>
              </ActiveAdminLink>
            </nav>

          </div>

          <div className={styles.navigationGroup}>
            <span className={styles.groupLabel}>{t.learning}</span>

            
          <div className={styles.navList}>
            <ActiveAdminLink
              href={`/${locale}/instructor/courses`}
              className={styles.navItem}
              activeClassName={styles.navActive}
              indicatorClassName={styles.activeDot}
            >
              <NavIcon name="courses" />
              <span>{t.courses}</span>
            </ActiveAdminLink>

            
            <ActiveAdminLink
              href={`/${locale}/instructor/students`}
              className={styles.navItem}
              activeClassName={styles.navActive}
              indicatorClassName={styles.activeDot}
            >
              <NavIcon name="students" />
              <span>{t.students}</span>
            </ActiveAdminLink>

            <ActiveAdminLink
              href={`/${locale}/instructor/reviews`}
              className={styles.navItem}
              activeClassName={styles.navActive}
              indicatorClassName={styles.activeDot}
            >
              <NavIcon name="reviews" />
              <span>{t.reviews}</span>
            </ActiveAdminLink>

          </div>

          </div>

          <div className={styles.navigationGroup}>
            <span className={styles.groupLabel}>{t.account}</span>

            
            <ActiveAdminLink
              href={`/${locale}/instructor/profile`}
              className={styles.navItem}
              activeClassName={styles.navActive}
              indicatorClassName={styles.activeDot}
            >
              <NavIcon name="profile" />
              <span>{t.profile}</span>
            </ActiveAdminLink>

          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <Link href={`/${locale}`} className={styles.websiteLink}>
            <span aria-hidden="true">↗</span>
            {t.website}
          </Link>

          <div className={styles.identity}>
            <span className={styles.avatar}>{initial}</span>
            <div>
              <strong>{username}</strong>
              <span>{t.instructor}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div className={styles.topbarHeading}>
            <span className={styles.eyebrow}>
              CRESTMARK / INSTRUCTOR
            </span>

            <h1>{t.dashboard}</h1>
            <p>{t.description}</p>
          </div>

          <div className={styles.topbarIdentity}>
            <span className={styles.avatar}>{initial}</span>
            <div>
              <strong>{username}</strong>
              <span>{t.instructor}</span>
            </div>
          </div>
        </header>

        <div className={styles.contentArea}>{children}</div>
      </div>
    </div>
  );
}
