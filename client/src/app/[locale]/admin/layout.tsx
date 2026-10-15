

import type { ReactNode } from "react";

import Link from "next/link";

import { cookies } from "next/headers";
import { connection } from "next/server";
import ActiveAdminLink from "./ActiveAdminLink";

import { notFound, redirect } from "next/navigation";

import styles from "./layout.module.css";



type Props = {

  children: ReactNode;

  params: Promise<{ locale: string }>;

};



type AdminUser = {

  userId: string | number;

  username: string;

  email: string;

  roles: string[];

};



const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

const dictionary = {

  en: {

    workspace: "ADMIN WORKSPACE",

    overview: "Overview",

    management: "MANAGEMENT",

    courses: "Courses",

    categories: "Categories",

    students: "Users",

    enrollments: "Enrollments",

    commerce: "COMMERCE",

    orders: "Orders",

    coupons: "Coupons",

    insights: "INSIGHTS",

    certificates: "Certificates",

    reports: "Reports",

    comingSoon: "Soon",

    dashboard: "Dashboard",

    dashboardDescription:

      "Manage your academy from one organized workspace.",

    administrator: "Administrator",

    connected: "Connected",

    website: "Back to website",

    accessDenied: "403 — Access Denied",

    deniedDescription:

      "You do not have permission to access this workspace.",
    payments: "Payments",

  },

  ar: {

    workspace: "مساحة الإدارة",

    overview: "نظرة عامة",

    management: "الإدارة",

    courses: "الدورات",

    categories: "التصنيفات",

    students: "المستخدمون",

    enrollments: "التسجيلات",

    commerce: "الطلبات والمبيعات",

    orders: "الطلبات",

    coupons: "الكوبونات",

    insights: "المتابعة والتقارير",

    certificates: "الشهادات",

    reports: "التقارير",

    comingSoon: "قريبًا",

    dashboard: "لوحة التحكم",

    dashboardDescription:

      "أدر أكاديميتك من مساحة عمل منظمة ومتكاملة.",

    administrator: "مسؤول النظام",

    connected: "متصل",

    website: "العودة للموقع",

    accessDenied: "403 — الوصول مرفوض",

    deniedDescription:

      "ليس لديك صلاحية الوصول إلى مساحة الإدارة.",
    payments: "المدفوعات",

  },

} as const;



type AdminSection = {

  label: string;

  items: {

    label: string;

    icon: string;

  }[];

};



function SidebarIcon({ name }: { name: string }) {

  const paths: Record<string, ReactNode> = {

    dashboard: (

      <>

        <rect x="3" y="3" width="7" height="7" rx="1.5" />

        <rect x="14" y="3" width="7" height="7" rx="1.5" />

        <rect x="3" y="14" width="7" height="7" rx="1.5" />

        <rect x="14" y="14" width="7" height="7" rx="1.5" />

      </>

    ),

    book: (

      <>

        <path d="M12 7v14" />

        <path d="M3 18V5a2 2 0 0 1 2-2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v13h-5a4 4 0 0 0-4 3 4 4 0 0 0-4-3H3Z" />

      </>

    ),

    grid: (

      <>

        <rect x="3" y="3" width="7" height="7" rx="1" />

        <rect x="14" y="3" width="7" height="7" rx="1" />

        <rect x="3" y="14" width="7" height="7" rx="1" />

        <rect x="14" y="14" width="7" height="7" rx="1" />

      </>

    ),

    users: (

      <>

        <circle cx="9" cy="8" r="3" />

        <path d="M3 20v-2a6 6 0 0 1 12 0v2" />

        <path d="M17 5a3 3 0 0 1 0 6" />

        <path d="M18 15a5 5 0 0 1 3 5" />

      </>

    ),

    check: (

      <>

        <rect x="4" y="4" width="16" height="16" rx="3" />

        <path d="m8 12 3 3 5-6" />

      </>

    ),

    receipt: (

      <>

        <path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" />

        <path d="M9 8h6M9 12h6" />

      </>

    ),

    tag: (

      <>

        <path d="M20 13 13 20 3 10V3h7l10 10Z" />

        <circle cx="7.5" cy="7.5" r="1" />

      </>

    ),

    award: (

      <>

        <circle cx="12" cy="8" r="5" />

        <path d="m8.5 12-2 9 5.5-3 5.5 3-2-9" />

      </>

    ),

    chart: (

      <>

        <path d="M4 20V4M4 20h16" />

        <path d="m7 15 4-4 3 2 6-7" />

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

      {paths[name] ?? paths.grid}

    </svg>

  );

}



export default async function AdminLayout({

  children,

  params,

}: Props) {

  const { locale } = await params;



  if (locale !== "en" && locale !== "ar") {

    notFound();

  }



  const lang = locale as "en" | "ar";

  const t = dictionary[lang];



  // Admin authentication always runs per request, never during prerender.
  await connection();

  const cookieStore = await cookies();

  const accessToken = cookieStore.get("cm_access")?.value;

  const refreshToken = cookieStore.get("cm_refresh")?.value;



  if (!accessToken) {

    if (refreshToken) {

      redirect(`/${locale}/admin-session`);

    }



    redirect(`/${locale}/login`);

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

    if (refreshToken) {

      redirect(`/${locale}/admin-session`);

    }



    redirect(`/${locale}/login`);

  }



  if (!response.ok) {

    throw new Error(

      "Unable to verify administrator permissions."

    );

  }



  let data: unknown;



  try {

    data = await response.json();

  } catch {

    throw new Error("Invalid authentication response.");

  }



  if (

    !data ||

    typeof data !== "object" ||

    Array.isArray(data)

  ) {

    throw new Error("Invalid authentication response.");

  }



  const user = data as Partial<AdminUser>;



  if (

    typeof user.username !== "string" ||

    !Array.isArray(user.roles) ||

    !user.roles.every(

      (role) => typeof role === "string"

    )

  ) {

    throw new Error("Invalid administrator response.");

  }



  if (!user.roles.includes("Admin")) {

    return (

      <main className={styles.accessDenied}>

        <h1>{t.accessDenied}</h1>

        <p>{t.deniedDescription}</p>

        <Link href={`/${locale}`}>

          {t.website}

        </Link>

      </main>

    );

  }



  const sections: AdminSection[] = [

    {

      label: t.management,

      items: [

        { label: t.courses, icon: "book" },

        { label: t.categories, icon: "grid" },

        { label: t.students, icon: "users" },

        { label: t.enrollments, icon: "check" },

      ],

    },

    {

      label: t.commerce,

      items: [

        { label: t.orders, icon: "receipt" },

        { label: t.payments, icon: "receipt" },

        { label: t.coupons, icon: "tag" },

      ],

    },

    {

      label: t.insights,

      items: [

        { label: t.certificates, icon: "award" },

        { label: t.reports, icon: "chart" },

      ],

    },

  ];



  const initial =

    user.username.trim().charAt(0).toUpperCase() || "A";



  return (

    <div

      className={styles.adminShell}

      dir={lang === "ar" ? "rtl" : "ltr"}

    >

      <aside className={styles.sidebar}>

        <div className={styles.sidebarBrand}>

          <div className={styles.brandSymbol}>C</div>

          <div className={styles.brandCopy}>

            <strong>CrestMark</strong>

            <span>ACADEMY ADMIN</span>

          </div>

        </div>



        <div className={styles.sidebarContent}>

          <div className={styles.navigationGroup}>

            <span className={styles.groupLabel}>

              {t.workspace}

            </span>



            <nav aria-label={t.workspace}>

              <ActiveAdminLink
                href={`/${locale}/admin`}
                exact
                className={styles.navItem}
                activeClassName={styles.navActive}
                indicatorClassName={styles.activeIndicator}
              >
                <SidebarIcon name="dashboard" />
                <span>{t.overview}</span>
              </ActiveAdminLink>

            </nav>

          </div>



          {sections.map((section) => (

            <div

              className={styles.navigationGroup}

              key={section.label}

            >

              <span className={styles.groupLabel}>

                {section.label}

              </span>



              <div className={styles.navList}>                                          
                
                {section.items.map((item) =>
                  ["book", "grid", "users", "check", "receipt"].includes(
                    item.icon
                  ) ? (
                    <ActiveAdminLink
                      key={item.label}
                      href={
                              item.label === t.payments
                                ? `/${locale}/admin/payments`
                                : item.icon === "book"
                                  ? `/${locale}/admin/courses`
                                  : item.icon === "grid"
                                    ? `/${locale}/admin/categories`
                                    : item.icon === "users"
                                      ? `/${locale}/admin/students`
                                      : item.icon === "check"
                                        ? `/${locale}/admin/enrollments`
                                        : `/${locale}/admin/orders`
                            }
                      className={styles.navItem}
                      activeClassName={styles.navActive}
                      indicatorClassName={styles.activeIndicator}
                    >
                      <SidebarIcon name={item.icon} />
                      <span>{item.label}</span>
                    </ActiveAdminLink>
                  ) : (
                    <div
                      key={item.label}
                      className={`${styles.navItem} ${styles.navDisabled}`}
                      title={t.comingSoon}
                    >
                      <SidebarIcon name={item.icon} />
                      <span>{item.label}</span>
                      <small>{t.comingSoon}</small>
                    </div>
                  )
                )}

              </div>

            </div>

          ))}

        </div>



        <div className={styles.sidebarFooter}>

          <Link

            href={`/${locale}`}

            className={styles.websiteLink}

          >

            <span aria-hidden="true">↗</span>

            {t.website}

          </Link>



          <div className={styles.sidebarIdentity}>

            <div className={styles.identityAvatar}>

              {initial}

            </div>



            <div className={styles.identityText}>

              <strong>{user.username}</strong>

              <span>{t.administrator}</span>

            </div>

          </div>

        </div>

      </aside>



      <div className={styles.mainArea}>

        <header className={styles.topbar}>

          <div className={styles.topbarTitle}>

            <span className={styles.topbarEyebrow}>

              CRESTMARK / ADMIN

            </span>

            <h1>{t.dashboard}</h1>

            <p>{t.dashboardDescription}</p>

          </div>



          <div className={styles.topbarActions}>

            <div className={styles.connectionStatus}>

              <span className={styles.connectionDot} />

              {t.connected}

            </div>



            <div className={styles.topbarProfile}>

              <div className={styles.topbarAvatar}>

                {initial}

              </div>

              <div>

                <strong>{user.username}</strong>

                <span>{t.administrator}</span>

              </div>

            </div>

          </div>

        </header>



        <div className={styles.contentArea}>

          {children}

        </div>

      </div>

    </div>

  );

}
