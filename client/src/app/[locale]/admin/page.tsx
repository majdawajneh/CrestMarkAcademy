
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Locale = "en" | "ar";

type User = {
  id: number;
  isActive: boolean;
  roles: string[];
};

type Course = {
  id: number;
  title: string;
  status: string;
};

type Enrollment = {
  id: number;
  userId: number;
  courseId: number;
  status: string;
  enrolledAt: string | null;
};

type Order = {
  id: number;
  orderNumber: string;
  userName: string;
  status: string;
  currency: string;
  totalAmount: number;
  createdAt: string | null;
};

type Payment = {
  id: number;
  status: string;
  paymentProvider: string;
};

type Coupon = {
  id: number;
  isActive: boolean;
  usedCount: number;
};

type Certificate = {
  id: number;
  certificateNumber: string;
  studentName: string;
  issuedAt: string | null;
};

type DashboardData = {
  users: User[];
  courses: Course[];
  enrollments: Enrollment[];
  orders: Order[];
  payments: Payment[];
  coupons: Coupon[];
  certificates: Certificate[];
};

type Source = keyof DashboardData;

type Activity = {
  id: string;
  label: string;
  detail: string;
  date: string;
  kind: "order" | "enrollment" | "certificate";
  href: string;
};

const SOURCES: Source[] = [
  "users",
  "courses",
  "enrollments",
  "orders",
  "payments",
  "coupons",
  "certificates",
];

const copy = {
  en: {
    eyebrow: "CRESTMARK / OPERATIONS",
    title: "Academy overview",
    subtitle:
      "Your academy's activity, commerce and learning operations in one place.",
    refresh: "Refresh",
    refreshing: "Updating...",
    fullReports: "Explore reports",
    updated: "Updated",
    sources: "sources connected",
    warning:
      "Some data sources are unavailable. Affected metrics are shown as unavailable.",
    sourceErrors: "Unavailable",
    courses: "Total courses",
    students: "Student accounts",
    enrollments: "Total enrollments",
    orders: "Total orders",
    published: "Published",
    activeAccounts: "Active accounts",
    activeLearning: "Active",
    paidOrders: "Paid orders",
    unavailable: "Unavailable",
    activityEyebrow: "01 / ACTIVITY",
    activityTitle: "Academy activity",
    activityDescription:
      "New enrollments and orders created over the last seven days.",
    enrollmentsLegend: "New enrollments",
    ordersLegend: "New orders",
    last7Days: "LAST 7 DAYS",
    noActivity: "No activity recorded over the last seven days.",
    paymentEyebrow: "02 / TRANSACTIONS",
    paymentTitle: "Payment health",
    paymentDescription:
      "Distribution of recorded payment attempts.",
    paid: "Paid",
    failed: "Failed",
    pending: "Other / pending",
    paidShare: "Paid payment records",
    testNotice:
      "TestGateway transactions are not proof of collected funds.",
    topEyebrow: "03 / COURSE DEMAND",
    topTitle: "Most enrolled courses",
    topDescription:
      "Ranked by active and completed enrollment records.",
    learners: "Enrollments",
    noCourses: "No active or completed course enrollments.",
    financialEyebrow: "04 / COMMERCE",
    financialTitle: "Commerce snapshot",
    financialDescription:
      "Recorded purchases, not verified settlement.",
    paidVolume: "Paid order volume",
    avgOrder: "Average paid order",
    currency: "Currency",
    noPaidOrders: "No paid orders recorded.",
    financialFoot:
      "Financial values are based on paid order status. Refunds and gateway settlements are not inferred.",
    achievementEyebrow: "05 / ACHIEVEMENTS",
    achievementTitle: "Learning outcomes",
    achievementDescription:
      "Current completion and certification records.",
    completed: "Completed enrollments",
    certificates: "Certificates issued",
    coupons: "Enabled coupons",
    completionRate: "Completion share",
    completionNote:
      "Completed ÷ active and completed enrollments.",
    recentEyebrow: "06 / ACTIVITY LOG",
    recentTitle: "Latest activity",
    recentDescription:
      "The latest recorded purchases, enrollments and certificates.",
    noRecent: "No recent activity is available.",
    quickEyebrow: "QUICK ACCESS",
    quickTitle: "Your workspace",
    manageCourses: "Course catalog",
    manageUsers: "Users & students",
    manageOrders: "Orders & purchases",
    manageCertificates: "Certificates",
    reports: "Detailed analytics",
    open: "Open",
    allTime: "ALL-TIME RECORDS",
    records: "records",
  },
  ar: {
    eyebrow: "CRESTMARK / العمليات",
    title: "نظرة عامة على الأكاديمية",
    subtitle:
      "متابعة نشاط الأكاديمية والمبيعات وعمليات التعلم من مكان واحد.",
    refresh: "تحديث",
    refreshing: "جارٍ التحديث...",
    fullReports: "التقارير التفصيلية",
    updated: "آخر تحديث",
    sources: "مصادر متصلة",
    warning:
      "بعض مصادر البيانات غير متاحة. لن نعرض أرقامًا غير مؤكدة.",
    sourceErrors: "المصادر غير المتاحة",
    courses: "إجمالي الدورات",
    students: "حسابات الطلاب",
    enrollments: "إجمالي الالتحاقات",
    orders: "إجمالي الطلبات",
    published: "منشورة",
    activeAccounts: "حسابات نشطة",
    activeLearning: "نشطة",
    paidOrders: "طلبات مدفوعة",
    unavailable: "غير متاح",
    activityEyebrow: "01 / النشاط",
    activityTitle: "نشاط الأكاديمية",
    activityDescription:
      "الالتحاقات والطلبات الجديدة خلال آخر سبعة أيام.",
    enrollmentsLegend: "الالتحاقات الجديدة",
    ordersLegend: "الطلبات الجديدة",
    last7Days: "آخر 7 أيام",
    noActivity: "لا يوجد نشاط مسجل خلال آخر سبعة أيام.",
    paymentEyebrow: "02 / المعاملات",
    paymentTitle: "حالة المدفوعات",
    paymentDescription:
      "توزيع محاولات الدفع المسجلة في النظام.",
    paid: "مدفوع",
    failed: "فاشل",
    pending: "أخرى / معلقة",
    paidShare: "نسبة سجلات الدفع الناجحة",
    testNotice:
      "معاملات TestGateway ليست دليلًا على تحصيل الأموال.",
    topEyebrow: "03 / إقبال الطلاب",
    topTitle: "الدورات الأكثر التحاقًا",
    topDescription:
      "الترتيب حسب الالتحاقات النشطة والمكتملة.",
    learners: "التحاقات",
    noCourses: "لا توجد التحاقات نشطة أو مكتملة.",
    financialEyebrow: "04 / المبيعات",
    financialTitle: "ملخص المبيعات",
    financialDescription:
      "المشتريات المسجلة وليس التسويات البنكية.",
    paidVolume: "قيمة الطلبات المدفوعة",
    avgOrder: "متوسط الطلب المدفوع",
    currency: "العملة",
    noPaidOrders: "لا توجد طلبات مدفوعة مسجلة.",
    financialFoot:
      "القيم المالية محسوبة من الطلبات المدفوعة، ولا تعني تحصيلًا بنكيًا أو إيرادات بعد الاستردادات.",
    achievementEyebrow: "05 / الإنجازات",
    achievementTitle: "نتائج التعلم",
    achievementDescription:
      "حالة إكمال الدورات والشهادات الحالية.",
    completed: "الالتحاقات المكتملة",
    certificates: "الشهادات الصادرة",
    coupons: "الكوبونات المفعّلة",
    completionRate: "نسبة الإكمال",
    completionNote:
      "المكتملة ÷ مجموع الالتحاقات النشطة والمكتملة.",
    recentEyebrow: "06 / أحدث العمليات",
    recentTitle: "آخر النشاطات",
    recentDescription:
      "أحدث الطلبات والالتحاقات والشهادات المسجلة.",
    noRecent: "لا توجد أنشطة حديثة متاحة.",
    quickEyebrow: "وصول سريع",
    quickTitle: "مساحة العمل",
    manageCourses: "إدارة الدورات",
    manageUsers: "المستخدمون والطلاب",
    manageOrders: "الطلبات والمشتريات",
    manageCertificates: "الشهادات",
    reports: "التحليلات التفصيلية",
    open: "فتح",
    allTime: "جميع السجلات",
    records: "سجلات",
  },
} as const;

// ==========================================
// Parsing API responses
// ==========================================

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function validId(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function numberValue(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function dateValue(value: unknown): string | null {
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(value)
    ? value
    : null;
}

function arrayResponse(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;

  if (!isObject(value)) return null;

  for (const key of [
    "items",
    "data",
    "results",
    ...SOURCES,
  ]) {
    const candidate = value[key];

    if (Array.isArray(candidate)) return candidate;

    if (
      isObject(candidate) &&
      Array.isArray(candidate.items)
    ) {
      return candidate.items;
    }
  }

  return null;
}

function parseUser(value: unknown): User | null {
  if (
    !isObject(value) ||
    !validId(value.id) ||
    typeof value.isActive !== "boolean" ||
    !Array.isArray(value.roles) ||
    !value.roles.every((role) => typeof role === "string")
  ) {
    return null;
  }

  return {
    id: value.id,
    isActive: value.isActive,
    roles: value.roles as string[],
  };
}

function parseCourse(value: unknown): Course | null {
  if (
    !isObject(value) ||
    !validId(value.id) ||
    typeof value.title !== "string" ||
    typeof value.status !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    title: value.title,
    status: value.status,
  };
}

function parseEnrollment(value: unknown): Enrollment | null {
  if (
    !isObject(value) ||
    !validId(value.id) ||
    !validId(value.userId) ||
    !validId(value.courseId) ||
    typeof value.status !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    userId: value.userId,
    courseId: value.courseId,
    status: value.status,
    enrolledAt: dateValue(value.enrolledAt),
  };
}

function parseOrder(value: unknown): Order | null {
  if (
    !isObject(value) ||
    !validId(value.id) ||
    typeof value.orderNumber !== "string" ||
    typeof value.currency !== "string" ||
    typeof value.status !== "string" ||
    !numberValue(value.totalAmount)
  ) {
    return null;
  }

  return {
    id: value.id,
    orderNumber: value.orderNumber,
    userName: stringValue(value.userName),
    status: value.status,
    currency: value.currency,
    totalAmount: value.totalAmount,
    createdAt: dateValue(value.createdAt),
  };
}

function parsePayment(value: unknown): Payment | null {
  if (
    !isObject(value) ||
    !validId(value.id) ||
    typeof value.status !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    status: value.status,
    paymentProvider: stringValue(value.paymentProvider),
  };
}

function parseCoupon(value: unknown): Coupon | null {
  if (
    !isObject(value) ||
    !validId(value.id) ||
    typeof value.isActive !== "boolean" ||
    !numberValue(value.usedCount)
  ) {
    return null;
  }

  return {
    id: value.id,
    isActive: value.isActive,
    usedCount: value.usedCount,
  };
}

function parseCertificate(
  value: unknown
): Certificate | null {
  if (
    !isObject(value) ||
    !validId(value.id) ||
    typeof value.certificateNumber !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    certificateNumber: value.certificateNumber,
    studentName: stringValue(value.studentName),
    issuedAt: dateValue(value.issuedAt),
  };
}

async function fetchRecords<T>(
  url: string,
  parser: (value: unknown) => T | null,
  signal: AbortSignal
): Promise<T[]> {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload: unknown = await response.json();
  const items = arrayResponse(payload);

  if (!items) {
    throw new Error("Unexpected API response.");
  }

  const parsed = items.map(parser);

  if (parsed.some((item) => item === null)) {
    throw new Error("Invalid API record.");
  }

  return parsed as T[];
}

function initialData(): DashboardData {
  return {
    users: [],
    courses: [],
    enrollments: [],
    orders: [],
    payments: [],
    coupons: [],
    certificates: [],
  };
}

// ==========================================
// Helpers
// ==========================================

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function dayKey(value: string | null): string {
  return value?.slice(0, 10) ?? "";
}

function localDay(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function shortDate(
  value: string | null,
  locale: Locale
): string {
  if (!value) return "—";

  const date = new Date(`${dayKey(value)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

function amount(
  value: number,
  currency: string,
  locale: Locale
): string {
  return `${new Intl.NumberFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(value)} ${currency}`;
}

function count(value: number, locale: Locale): string {
  return new Intl.NumberFormat(
    locale === "ar" ? "ar-JO" : "en-US"
  ).format(value);
}

function hasRole(user: User, role: string): boolean {
  return user.roles.some(
    (value) => normalize(value) === normalize(role)
  );
}

// ==========================================
// Dashboard
// ==========================================

export default function AdminOverviewPage() {
  const params = useParams<{ locale: string }>();
  const locale: Locale = params.locale === "ar" ? "ar" : "en";
  const t = copy[locale];

  const [data, setData] = useState<DashboardData>(initialData);
  const [errors, setErrors] = useState<
    Partial<Record<Source, string>>
  >({});
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [currencyChoice, setCurrencyChoice] = useState("");

  // ======================================
  // Load real academy data
  // ======================================

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);

      const results = await Promise.allSettled([
        fetchRecords(
          "/api/admin/users",
          parseUser,
          controller.signal
        ),
        fetchRecords(
          "/api/admin/courses",
          parseCourse,
          controller.signal
        ),
        fetchRecords(
          "/api/admin/enrollments",
          parseEnrollment,
          controller.signal
        ),
        fetchRecords(
          "/api/admin/orders",
          parseOrder,
          controller.signal
        ),
        fetchRecords(
          "/api/admin/payments",
          parsePayment,
          controller.signal
        ),
        fetchRecords(
          "/api/admin/coupons",
          parseCoupon,
          controller.signal
        ),
        fetchRecords(
          "/api/admin/certificates",
          parseCertificate,
          controller.signal
        ),
      ]);

      if (controller.signal.aborted) return;

      const next = initialData();
      const failures: Partial<Record<Source, string>> = {};

      const [
        usersResult,
        coursesResult,
        enrollmentsResult,
        ordersResult,
        paymentsResult,
        couponsResult,
        certificatesResult,
      ] = results;

      if (usersResult.status === "fulfilled") {
        next.users = usersResult.value;
      } else {
        failures.users = String(usersResult.reason);
      }

      if (coursesResult.status === "fulfilled") {
        next.courses = coursesResult.value;
      } else {
        failures.courses = String(coursesResult.reason);
      }

      if (enrollmentsResult.status === "fulfilled") {
        next.enrollments = enrollmentsResult.value;
      } else {
        failures.enrollments = String(enrollmentsResult.reason);
      }

      if (ordersResult.status === "fulfilled") {
        next.orders = ordersResult.value;
      } else {
        failures.orders = String(ordersResult.reason);
      }

      if (paymentsResult.status === "fulfilled") {
        next.payments = paymentsResult.value;
      } else {
        failures.payments = String(paymentsResult.reason);
      }

      if (couponsResult.status === "fulfilled") {
        next.coupons = couponsResult.value;
      } else {
        failures.coupons = String(couponsResult.reason);
      }

      if (certificatesResult.status === "fulfilled") {
        next.certificates = certificatesResult.value;
      } else {
        failures.certificates = String(
          certificatesResult.reason
        );
      }

      setData(next);
      setErrors(failures);
      setLoaded(true);
      setUpdatedAt(new Date());
      setLoading(false);
    }

    void load();

    return () => controller.abort();
  }, [refreshIndex]);

  const available = (source: Source): boolean =>
    loaded && !errors[source];

  const connectedSources = SOURCES.filter(available).length;

  // ======================================
  // Main statistics
  // ======================================

  const totalStudents = data.users.filter((user) =>
    hasRole(user, "Student")
  ).length;

  const activeStudents = data.users.filter(
    (user) => user.isActive && hasRole(user, "Student")
  ).length;

  const publishedCourses = data.courses.filter(
    (course) => normalize(course.status) === "published"
  ).length;

  const activeEnrollments = data.enrollments.filter(
    (enrollment) => normalize(enrollment.status) === "active"
  ).length;

  const completedEnrollments = data.enrollments.filter(
    (enrollment) => normalize(enrollment.status) === "completed"
  ).length;

  const paidOrders = data.orders.filter(
    (order) => normalize(order.status) === "paid"
  );

  const mainMetrics = [
    {
      id: "01",
      label: t.courses,
      value: available("courses")
        ? count(data.courses.length, locale)
        : "—",
      secondary: available("courses")
        ? `${count(publishedCourses, locale)} ${t.published}`
        : t.unavailable,
      href: `/${locale}/admin/courses`,
      accent: "blue",
    },
    {
      id: "02",
      label: t.students,
      value: available("users")
        ? count(totalStudents, locale)
        : "—",
      secondary: available("users")
        ? `${count(activeStudents, locale)} ${t.activeAccounts}`
        : t.unavailable,
      href: `/${locale}/admin/students`,
      accent: "teal",
    },
    {
      id: "03",
      label: t.enrollments,
      value: available("enrollments")
        ? count(data.enrollments.length, locale)
        : "—",
      secondary: available("enrollments")
        ? `${count(activeEnrollments, locale)} ${t.activeLearning}`
        : t.unavailable,
      href: `/${locale}/admin/enrollments`,
      accent: "violet",
    },
    {
      id: "04",
      label: t.orders,
      value: available("orders")
        ? count(data.orders.length, locale)
        : "—",
      secondary: available("orders")
        ? `${count(paidOrders.length, locale)} ${t.paidOrders}`
        : t.unavailable,
      href: `/${locale}/admin/orders`,
      accent: "gold",
    },
  ];

  // ======================================
  // Seven-day activity
  // ======================================

  const dailyActivity = useMemo(() => {
    const today = updatedAt ?? new Date();

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 6 + index
      );

      const key = localDay(date);

      return {
        key,
        label: new Intl.DateTimeFormat(
          locale === "ar" ? "ar-JO" : "en-US",
          { weekday: "short" }
        ).format(date),
        orders: data.orders.filter(
          (order) => dayKey(order.createdAt) === key
        ).length,
        enrollments: data.enrollments.filter(
          (enrollment) => dayKey(enrollment.enrolledAt) === key
        ).length,
      };
    });
  }, [data.orders, data.enrollments, updatedAt, locale]);

  const chartMaximum = Math.max(
    1,
    ...dailyActivity.map((day) =>
      Math.max(day.orders, day.enrollments)
    )
  );

  const hasWeeklyActivity = dailyActivity.some(
    (day) => day.orders > 0 || day.enrollments > 0
  );

  // ======================================
  // Payment health
  // ======================================

  const paymentPaid = data.payments.filter(
    (payment) => normalize(payment.status) === "paid"
  ).length;

  const paymentFailed = data.payments.filter((payment) =>
    ["failed", "rejected", "declined"].includes(
      normalize(payment.status)
    )
  ).length;

  const paymentOther =
    data.payments.length - paymentPaid - paymentFailed;

  const paymentRate = data.payments.length
    ? (paymentPaid / data.payments.length) * 100
    : 0;

  const paidDegrees = data.payments.length
    ? (paymentPaid / data.payments.length) * 360
    : 0;

  const failedDegrees = data.payments.length
    ? (paymentFailed / data.payments.length) * 360
    : 0;

  const donutBackground = data.payments.length
    ? `conic-gradient(
        #2d9a82 0deg ${paidDegrees}deg,
        #d78275 ${paidDegrees}deg ${paidDegrees + failedDegrees}deg,
        #d8b46f ${paidDegrees + failedDegrees}deg 360deg
      )`
    : "#e7edf3";

  const hasTestPayments = data.payments.some((payment) =>
    payment.paymentProvider.toLowerCase().includes("test")
  );

  // ======================================
  // Course demand
  // ======================================

  const popularCourses = useMemo(() => {
    const totals = new Map<number, number>();

    for (const enrollment of data.enrollments) {
      const state = normalize(enrollment.status);

      if (state !== "active" && state !== "completed") {
        continue;
      }

      totals.set(
        enrollment.courseId,
        (totals.get(enrollment.courseId) ?? 0) + 1
      );
    }

    const titles = new Map(
      data.courses.map((course) => [course.id, course.title])
    );

    return [...totals.entries()]
      .map(([id, value]) => ({
        id,
        title: titles.get(id) ?? `Course #${id}`,
        value,
      }))
      .sort(
        (a, b) =>
          b.value - a.value || a.title.localeCompare(b.title)
      )
      .slice(0, 5);
  }, [data.courses, data.enrollments]);

  // ======================================
  // Commerce
  // ======================================

  const currencies = useMemo(
    () =>
      [
        ...new Set(
          data.orders.map((order) => order.currency).filter(Boolean)
        ),
      ].sort(),
    [data.orders]
  );

  const selectedCurrency = currencies.includes(currencyChoice)
    ? currencyChoice
    : currencies[0] ?? "";

  const currencyPaidOrders = paidOrders.filter(
    (order) => order.currency === selectedCurrency
  );

  const paidVolume = currencyPaidOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );

  const averageOrder = currencyPaidOrders.length
    ? paidVolume / currencyPaidOrders.length
    : 0;

  const completionDenominator =
    activeEnrollments + completedEnrollments;

  const completionRate = completionDenominator
    ? Math.round(
        (completedEnrollments / completionDenominator) * 100
      )
    : 0;

  // ======================================
  // Latest activity across modules
  // ======================================

  const recentActivity = useMemo(() => {
    const events: Activity[] = [];

    for (const order of data.orders) {
      if (!order.createdAt) continue;

      events.push({
        id: `order-${order.id}`,
        label: order.orderNumber,
        detail:
          order.userName ||
          `Order #${order.id}`,
        date: order.createdAt,
        kind: "order",
        href: `/${locale}/admin/orders`,
      });
    }

    for (const enrollment of data.enrollments) {
      if (!enrollment.enrolledAt) continue;

      const course = data.courses.find(
        (item) => item.id === enrollment.courseId
      );

      events.push({
        id: `enrollment-${enrollment.id}`,
        label:
          course?.title ??
          `Course #${enrollment.courseId}`,
        detail: `Enrollment #${enrollment.id}`,
        date: enrollment.enrolledAt,
        kind: "enrollment",
        href: `/${locale}/admin/enrollments`,
      });
    }

    for (const certificate of data.certificates) {
      if (!certificate.issuedAt) continue;

      events.push({
        id: `certificate-${certificate.id}`,
        label: certificate.certificateNumber,
        detail: certificate.studentName,
        date: certificate.issuedAt,
        kind: "certificate",
        href: `/${locale}/admin/certificates`,
      });
    }

    return events
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }, [
    data.orders,
    data.enrollments,
    data.certificates,
    data.courses,
    locale,
  ]);

  const quickLinks = [
    { label: t.manageCourses, href: `/${locale}/admin/courses`, n: "01" },
    { label: t.manageUsers, href: `/${locale}/admin/students`, n: "02" },
    { label: t.manageOrders, href: `/${locale}/admin/orders`, n: "03" },
    {
      label: t.manageCertificates,
      href: `/${locale}/admin/certificates`,
      n: "04",
    },
    { label: t.reports, href: `/${locale}/admin/reports`, n: "05" },
  ];

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* Header */}

      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>{t.eyebrow}</span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>

        <div className={styles.headingActions}>
          <span className={styles.connection}>
            <span className={styles.connectionDot} />
            {loaded
              ? `${connectedSources}/${SOURCES.length} ${t.sources}`
              : t.refreshing}
          </span>

          <button
            type="button"
            className={styles.refreshButton}
            disabled={loading}
            onClick={() =>
              setRefreshIndex((previous) => previous + 1)
            }
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M20 8a8 8 0 1 0 1 6" />
              <path d="M20 3v5h-5" />
            </svg>
            {loading ? t.refreshing : t.refresh}
          </button>

          <Link
            className={styles.reportsButton}
            href={`/${locale}/admin/reports`}
          >
            {t.fullReports}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      {loaded && Object.keys(errors).length > 0 && (
        <div className={styles.warning} role="alert">
          <strong>{t.warning}</strong>
          <span>
            {t.sourceErrors}:{" "}
            {SOURCES.filter((source) => errors[source]).join(", ")}
          </span>
        </div>
      )}

      {/* Primary metrics */}

      <div className={styles.metricsGrid}>
        {mainMetrics.map((metric) => (
          <Link
            href={metric.href}
            key={metric.id}
            className={`${styles.metricCard} ${
              styles[`metric_${metric.accent}`]
            }`}
          >
            <div className={styles.metricHeader}>
              <span>{metric.label}</span>
              <small>{metric.id}</small>
            </div>

            <strong className={styles.metricValue}>
              {loaded ? metric.value : "—"}
            </strong>

            <div className={styles.metricFooter}>
              <span>{loaded ? metric.secondary : "—"}</span>
              <span className={styles.metricArrow}>↗</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Activity chart and payment health */}

      <div className={styles.mainAnalytics}>
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.sectionEyebrow}>
                {t.activityEyebrow}
              </span>
              <h3>{t.activityTitle}</h3>
              <p>{t.activityDescription}</p>
            </div>
            <span className={styles.periodLabel}>
              {t.last7Days}
            </span>
          </div>

          {!available("orders") &&
          !available("enrollments") ? (
            <p className={styles.emptyState}>{t.unavailable}</p>
          ) : (
            <>
              <div className={styles.chartLegend}>
                {available("enrollments") && (
                  <span>
                    <i className={styles.legendEnrollment} />
                    {t.enrollmentsLegend}
                  </span>
                )}
                {available("orders") && (
                  <span>
                    <i className={styles.legendOrders} />
                    {t.ordersLegend}
                  </span>
                )}
              </div>

              <div className={styles.barChart}>
                <div className={styles.gridLines}>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                {dailyActivity.map((day) => (
                  <div
                    className={styles.dayColumn}
                    key={day.key}
                  >
                    <div className={styles.barPair}>
                      {available("enrollments") && (
                        <span
                          className={styles.enrollmentBar}
                          style={{
                            height: `${
                              (day.enrollments / chartMaximum) * 100
                            }%`,
                          }}
                          title={`${t.enrollmentsLegend}: ${day.enrollments}`}
                        />
                      )}

                      {available("orders") && (
                        <span
                          className={styles.orderBar}
                          style={{
                            height: `${
                              (day.orders / chartMaximum) * 100
                            }%`,
                          }}
                          title={`${t.ordersLegend}: ${day.orders}`}
                        />
                      )}
                    </div>

                    <span className={styles.dayLabel}>
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>

              {!hasWeeklyActivity && (
                <p className={styles.chartFootnote}>
                  {t.noActivity}
                </p>
              )}
            </>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.sectionEyebrow}>
                {t.paymentEyebrow}
              </span>
              <h3>{t.paymentTitle}</h3>
              <p>{t.paymentDescription}</p>
            </div>
          </div>

          {!available("payments") ? (
            <p className={styles.emptyState}>{t.unavailable}</p>
          ) : (
            <>
              <div className={styles.paymentVisual}>
                <div
                  className={styles.donut}
                  style={{ background: donutBackground }}
                  role="img"
                  aria-label={`${t.paid}: ${paymentPaid}, ${t.failed}: ${paymentFailed}, ${t.pending}: ${paymentOther}`}
                >
                  <div className={styles.donutCenter}>
                    <strong>
                      {Math.round(paymentRate)}%
                    </strong>
                    <span>{t.paidShare}</span>
                  </div>
                </div>

                <div className={styles.paymentLegend}>
                  {[
                    {
                      label: t.paid,
                      count: paymentPaid,
                      className: styles.dotPaid,
                    },
                    {
                      label: t.failed,
                      count: paymentFailed,
                      className: styles.dotFailed,
                    },
                    {
                      label: t.pending,
                      count: paymentOther,
                      className: styles.dotPending,
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <span className={item.className} />
                      <span>{item.label}</span>
                      <strong>{count(item.count, locale)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {hasTestPayments && (
                <p className={styles.paymentNote}>
                  {t.testNotice}
                </p>
              )}
            </>
          )}
        </section>
      </div>

      {/* Course demand + financial snapshot */}

      <div className={styles.insightsGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.sectionEyebrow}>
                {t.topEyebrow}
              </span>
              <h3>{t.topTitle}</h3>
              <p>{t.topDescription}</p>
            </div>
          </div>

          {!available("enrollments") ? (
            <p className={styles.emptyState}>{t.unavailable}</p>
          ) : popularCourses.length === 0 ? (
            <p className={styles.emptyState}>{t.noCourses}</p>
          ) : (
            <div className={styles.courseRanking}>
              {popularCourses.map((course, index) => (
                <div className={styles.courseRow} key={course.id}>
                  <span className={styles.rankIndex}>
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className={styles.rankDetails}>
                    <div className={styles.rankHeader}>
                      <strong>{course.title}</strong>
                      <span>
                        {count(course.value, locale)}{" "}
                        {t.learners}
                      </span>
                    </div>

                    <div className={styles.rankTrack}>
                      <span
                        style={{
                          width: `${
                            (course.value / popularCourses[0].value) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.sectionEyebrow}>
                {t.financialEyebrow}
              </span>
              <h3>{t.financialTitle}</h3>
              <p>{t.financialDescription}</p>
            </div>
          </div>

          {!available("orders") ? (
            <p className={styles.emptyState}>{t.unavailable}</p>
          ) : (
            <div className={styles.financialBody}>
              <div className={styles.currencyRow}>
                <label htmlFor="overview-currency">
                  {t.currency}
                </label>

                <select
                  id="overview-currency"
                  disabled={currencies.length < 2}
                  value={selectedCurrency}
                  onChange={(event) =>
                    setCurrencyChoice(event.target.value)
                  }
                >
                  {currencies.length ? (
                    currencies.map((currency) => (
                      <option value={currency} key={currency}>
                        {currency}
                      </option>
                    ))
                  ) : (
                    <option value="">—</option>
                  )}
                </select>
              </div>

              <span className={styles.financialLabel}>
                {t.paidVolume}
              </span>

              <strong className={styles.financialValue}>
                {selectedCurrency
                  ? amount(paidVolume, selectedCurrency, locale)
                  : "—"}
              </strong>

              <div className={styles.financialSeparator} />

              <div className={styles.financialLine}>
                <span>{t.paidOrders}</span>
                <strong>
                  {count(currencyPaidOrders.length, locale)}
                </strong>
              </div>

              <div className={styles.financialLine}>
                <span>{t.avgOrder}</span>
                <strong>
                  {selectedCurrency
                    ? amount(averageOrder, selectedCurrency, locale)
                    : "—"}
                </strong>
              </div>

              {paidOrders.length === 0 && (
                <p className={styles.financialEmpty}>
                  {t.noPaidOrders}
                </p>
              )}

              <p className={styles.financialNote}>
                {t.financialFoot}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Learning outcomes */}

      <section className={styles.outcomesPanel}>
        <div className={styles.panelHeading}>
          <div>
            <span className={styles.sectionEyebrow}>
              {t.achievementEyebrow}
            </span>
            <h3>{t.achievementTitle}</h3>
            <p>{t.achievementDescription}</p>
          </div>
        </div>

        <div className={styles.outcomesGrid}>
          {[
            {
              label: t.completed,
              value: available("enrollments")
                ? count(completedEnrollments, locale)
                : "—",
            },
            {
              label: t.certificates,
              value: available("certificates")
                ? count(data.certificates.length, locale)
                : "—",
            },
            {
              label: t.coupons,
              value: available("coupons")
                ? count(
                    data.coupons.filter((coupon) => coupon.isActive)
                      .length,
                    locale
                  )
                : "—",
            },
            {
              label: t.completionRate,
              value: available("enrollments")
                ? `${completionRate}%`
                : "—",
              hint: t.completionNote,
            },
          ].map((item) => (
            <div key={item.label} className={styles.outcomeItem}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              {"hint" in item && item.hint && (
                <small>{item.hint}</small>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Recent activity + quick access */}

      <div className={styles.bottomGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.sectionEyebrow}>
                {t.recentEyebrow}
              </span>
              <h3>{t.recentTitle}</h3>
              <p>{t.recentDescription}</p>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <p className={styles.emptyState}>
              {loaded ? t.noRecent : t.refreshing}
            </p>
          ) : (
            <div className={styles.activityList}>
              {recentActivity.map((activity) => (
                <Link
                  href={activity.href}
                  className={styles.activityRow}
                  key={activity.id}
                >
                  <span
                    className={`${styles.activitySymbol} ${
                      styles[`activity_${activity.kind}`]
                    }`}
                  >
                    {activity.kind === "order"
                      ? "↗"
                      : activity.kind === "enrollment"
                        ? "+"
                        : "✓"}
                  </span>

                  <div className={styles.activityInfo}>
                    <strong>{activity.label}</strong>
                    <small>{activity.detail}</small>
                  </div>

                  <span className={styles.activityDate}>
                    {shortDate(activity.date, locale)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className={styles.quickPanel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.sectionEyebrow}>
                {t.quickEyebrow}
              </span>
              <h3>{t.quickTitle}</h3>
            </div>
          </div>

          <nav className={styles.quickLinks} aria-label={t.quickTitle}>
            {quickLinks.map((link) => (
              <Link
                href={link.href}
                className={styles.quickLink}
                key={link.href}
              >
                <span>{link.n}</span>
                <strong>{link.label}</strong>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>

          {updatedAt && (
            <div className={styles.lastUpdated}>
              <span>{t.updated}</span>
              <strong>
                {new Intl.DateTimeFormat(
                  locale === "ar" ? "ar-JO" : "en-US",
                  {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                ).format(updatedAt)}
              </strong>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
