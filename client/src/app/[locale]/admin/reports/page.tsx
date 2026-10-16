
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "./page.module.css";

type Locale = "en" | "ar";
type Period = "7d" | "30d" | "90d" | "year" | "all";

type SourceKey =
  | "users"
  | "courses"
  | "categories"
  | "enrollments"
  | "orders"
  | "payments"
  | "coupons"
  | "certificates";

type User = {
  id: number;
  roles: string[];
  isActive: boolean;
  createdAt: string | null;
};

type Course = {
  id: number;
  title: string;
  status: string;
  categoryName: string | null;
};

type Category = {
  id: number;
  name: string;
};

type Enrollment = {
  id: number;
  userId: number;
  courseId: number;
  status: string;
  enrolledAt: string | null;
};

type OrderItem = {
  courseId: number;
  courseTitle: string;
  finalPrice: number;
};

type Order = {
  id: number;
  orderNumber: string;
  userName: string;
  status: string;
  currency: string;
  totalAmount: number;
  createdAt: string | null;
  items: OrderItem[];
};

type Payment = {
  id: number;
  orderId: number;
  paymentProvider: string;
  status: string;
  currency: string;
  amount: number;
  createdAt: string | null;
};

type Coupon = {
  id: number;
  code: string;
  usedCount: number;
  usageLimit: number | null;
  isActive: boolean;
  startDate: string;
  endDate: string;
};

type Certificate = {
  id: number;
  userId: number;
  courseId: number;
  certificateNumber: string;
  studentName: string;
  courseTitle: string;
  issuedAt: string | null;
};

type ReportsData = {
  users: User[];
  courses: Course[];
  categories: Category[];
  enrollments: Enrollment[];
  orders: Order[];
  payments: Payment[];
  coupons: Coupon[];
  certificates: Certificate[];
};

type SeriesPoint = {
  label: string;
  value: number;
  count: number;
};

const SOURCE_KEYS: SourceKey[] = [
  "users",
  "courses",
  "categories",
  "enrollments",
  "orders",
  "payments",
  "coupons",
  "certificates",
];

const initialData = (): ReportsData => ({
  users: [],
  courses: [],
  categories: [],
  enrollments: [],
  orders: [],
  payments: [],
  coupons: [],
  certificates: [],
});

const copy = {
  en: {
    eyebrow: "CRESTMARK ACADEMY / INTELLIGENCE",
    title: "Reports & analytics",
    subtitle:
      "A clear view of learning activity, commerce and growth — built from your live academy records.",
    sync: "Refresh data",
    syncing: "Updating...",
    updated: "Last updated",
    sources: "data sources available",
    partial:
      "Some sources could not be loaded. Affected metrics are marked unavailable.",
    period: "Reporting period",
    period7: "Last 7 days",
    period30: "Last 30 days",
    period90: "Last 90 days",
    periodYear: "This year",
    periodAll: "All time",
    currency: "Currency",
    paidVolume: "Paid order volume",
    paidVolumeNote:
      "Recorded paid orders · not verified bank settlement",
    paidOrders: "Paid orders",
    newEnrollments: "New enrollments",
    certificatesIssued: "Certificates issued",
    periodHint: "Within selected period",
    activeStudents: "Active student accounts",
    published: "Published courses",
    averageOrder: "Average paid order",
    couponUses: "Coupon uses (lifetime)",
    snapshot: "Current snapshot",
    lifetime: "Lifetime count",
    noData: "Unavailable",
    empty: "No records for this period",
    noSource: "Source unavailable",
    loading: "Loading live reports...",
    revenueTitle: "Purchase volume over time",
    revenueDesc:
      "Paid orders grouped by date of creation; no refunds or bank settlements are inferred.",
    revenueLegend: "Paid order volume",
    ordersLegend: "Paid orders",
    noRevenue: "No paid orders in this period.",
    ordersTitle: "Order pipeline",
    ordersDesc:
      "Order status distribution for the selected period",
    paymentsTitle: "Payment health",
    paymentsDesc:
      "Payment attempts created during the selected period",
    paid: "Paid",
    pending: "Pending / other",
    cancelled: "Cancelled",
    failed: "Failed",
    other: "Other",
    paymentShare: "Paid share of payment records",
    testNote:
      "TestGateway entries may be test transactions, not collected funds.",
    topCourses: "Highest-value courses",
    topCoursesDesc:
      "Ranked by paid order item value in the selected currency and period.",
    value: "Recorded value",
    orderItems: "Items sold",
    noTopCourses: "No paid course items for this period.",
    catalogTitle: "Catalog composition",
    categoriesLabel: "categories",
    catalogDesc: "Current published catalog by category",
    noCategories: "No published courses to categorize.",
    usersTitle: "Audience & access",
    usersDesc: "Current account roles and enrollment states",
    accounts: "Total accounts",
    students: "Students",
    instructors: "Instructors",
    admins: "Admins",
    activeEnrollments: "Active enrollments",
    completedEnrollments: "Completed enrollments",
    rolesNote:
      "Role totals can overlap when an account has multiple roles.",
    couponsTitle: "Coupon intelligence",
    couponsDesc: "Current promotions and cumulative usage",
    totalCoupons: "Total codes",
    activeCoupons: "Enabled codes",
    noCoupons: "No coupons available.",
    uses: "uses",
    recentTitle: "Recent orders",
    recentDesc:
      "Latest orders created within the reporting period",
    recentPayments: "Recent payment attempts",
    recentCertificates: "Recently issued certificates",
    details: "Open management",
    viewAll: "View all",
    noOrders: "No orders in this period.",
    noPayments: "No payment records in this period.",
    noCertificates: "No certificates issued in this period.",
    sourceErrors: "Unavailable sources",
    analyticsNote: "Reporting methodology",
    method1:
      "Period-based figures use record creation or issuance dates. Existing account and catalog snapshots are all-time.",
    method2:
      "Paid order volume is based on order status, and is not a bank settlement or refund-adjusted revenue figure.",
    method3:
      "Coupon usage counters have no redemption timestamps, so they are shown as lifetime totals.",
    method4:
      "Amounts from different currencies are never added together.",
  },

  ar: {
    eyebrow: "CRESTMARK ACADEMY / التحليلات",
    title: "التقارير والتحليلات",
    subtitle:
      "نظرة شاملة على نشاط التعلّم والمبيعات ونمو الأكاديمية باستخدام بياناتها الفعلية.",
    sync: "تحديث البيانات",
    syncing: "جارٍ التحديث...",
    updated: "آخر تحديث",
    sources: "مصادر بيانات متاحة",
    partial:
      "تعذر تحميل بعض المصادر. الإحصائيات المتأثرة معروضة على أنها غير متاحة.",
    period: "الفترة الزمنية",
    period7: "آخر 7 أيام",
    period30: "آخر 30 يومًا",
    period90: "آخر 90 يومًا",
    periodYear: "هذه السنة",
    periodAll: "كل الفترات",
    currency: "العملة",
    paidVolume: "قيمة الطلبات المدفوعة",
    paidVolumeNote:
      "طلبات مسجلة كمدفوعة · ليست تسوية بنكية",
    paidOrders: "الطلبات المدفوعة",
    newEnrollments: "الالتحاقات الجديدة",
    certificatesIssued: "الشهادات الصادرة",
    periodHint: "ضمن الفترة المحددة",
    activeStudents: "حسابات الطلاب النشطة",
    published: "الدورات المنشورة",
    averageOrder: "متوسط الطلب المدفوع",
    couponUses: "استخدامات الكوبونات (إجمالي)",
    snapshot: "الحالة الحالية",
    lifetime: "إجمالي تراكمي",
    noData: "غير متاح",
    empty: "لا توجد سجلات لهذه الفترة",
    noSource: "المصدر غير متاح",
    loading: "جارٍ تحميل التقارير الفعلية...",
    revenueTitle: "حركة الطلبات المدفوعة",
    revenueDesc:
      "تجميع الطلبات المدفوعة حسب تاريخ الإنشاء، دون افتراض التسويات أو المبالغ المستردة.",
    revenueLegend: "قيمة الطلبات المدفوعة",
    ordersLegend: "عدد الطلبات المدفوعة",
    noRevenue: "لا توجد طلبات مدفوعة خلال هذه الفترة.",
    ordersTitle: "حالات الطلبات",
    ordersDesc: "توزيع حالات الطلبات خلال الفترة المحددة",
    paymentsTitle: "حالة المدفوعات",
    paymentsDesc: "عمليات الدفع المنشأة خلال الفترة المحددة",
    paid: "مدفوع",
    pending: "معلّق / أخرى",
    cancelled: "ملغى",
    failed: "فاشل",
    other: "أخرى",
    paymentShare:
      "نسبة السجلات المدفوعة من محاولات الدفع",
    testNote:
      "عمليات TestGateway قد تكون تجريبية وليست مبالغ محصّلة.",
    topCourses: "أعلى الدورات قيمة",
    topCoursesDesc:
      "مرتبة حسب قيمة بنود الطلبات المدفوعة للعملة والفترة المحددتين.",
    value: "القيمة المسجلة",
    orderItems: "بنود مباعة",
    noTopCourses:
      "لا توجد بنود دورات مدفوعة لهذه الفترة.",
    catalogTitle: "توزيع الدورات",
    categoriesLabel: "تصنيفًا",
    catalogDesc: "تصنيف الدورات المنشورة حاليًا",
    noCategories: "لا توجد دورات منشورة للتوزيع.",
    usersTitle: "المستخدمون والالتحاقات",
    usersDesc: "توزيع الأدوار وحالات الالتحاق حاليًا",
    accounts: "إجمالي الحسابات",
    students: "طلاب",
    instructors: "مدربون",
    admins: "مديرون",
    activeEnrollments: "التحاقات نشطة",
    completedEnrollments: "التحاقات مكتملة",
    rolesNote:
      "قد يُحسب المستخدم بأكثر من دور إذا امتلك أدوارًا متعددة.",
    couponsTitle: "أداء الكوبونات",
    couponsDesc:
      "العروض الحالية وإجمالي الاستخدام التراكمي",
    totalCoupons: "إجمالي الكوبونات",
    activeCoupons: "كوبونات مفعّلة",
    noCoupons: "لا توجد كوبونات.",
    uses: "استخدامات",
    recentTitle: "أحدث الطلبات",
    recentDesc:
      "آخر الطلبات المنشأة ضمن الفترة المختارة",
    recentPayments: "أحدث محاولات الدفع",
    recentCertificates: "أحدث الشهادات الصادرة",
    details: "فتح الإدارة",
    viewAll: "عرض الكل",
    noOrders: "لا توجد طلبات لهذه الفترة.",
    noPayments: "لا توجد سجلات دفع لهذه الفترة.",
    noCertificates: "لا توجد شهادات خلال هذه الفترة.",
    sourceErrors: "المصادر غير المتاحة",
    analyticsNote: "كيف تُحسب التقارير؟",
    method1:
      "الإحصائيات الزمنية مبنية على تاريخ إنشاء السجل أو إصدار الشهادة؛ أما الحسابات والدورات فهي لقطة للحالة الحالية.",
    method2:
      "قيمة الطلبات المدفوعة محسوبة من حالة الطلب، وليست تسوية بنكية أو إيرادات بعد الاستردادات.",
    method3:
      "عداد استخدام الكوبون لا يحتوي على تاريخ كل استخدام، لذلك يظهر كإجمالي تراكمي.",
    method4:
      "لا نجمع مبالغ من عملات مختلفة.",
  },
} as const;

// ==================================
// Response parsing
// ==================================

function obj(v: unknown): v is Record<string, unknown> {
  return (
    v !== null &&
    typeof v === "object" &&
    !Array.isArray(v)
  );
}

function pid(v: unknown): number | null {
  return typeof v === "number" &&
    Number.isSafeInteger(v) &&
    v > 0
    ? v
    : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v)
    ? v
    : null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function nullableDate(v: unknown): string | null {
  return typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(v)
    ? v
    : null;
}

function parseUser(v: unknown): User | null {
  if (
    !obj(v) ||
    !pid(v.id) ||
    !Array.isArray(v.roles) ||
    typeof v.isActive !== "boolean"
  ) {
    return null;
  }

  return {
    id: v.id as number,
    roles: v.roles.filter(
      (r): r is string => typeof r === "string"
    ),
    isActive: v.isActive,
    createdAt: nullableDate(v.createdAt),
  };
}

function parseCourse(v: unknown): Course | null {
  if (
    !obj(v) ||
    !pid(v.id) ||
    typeof v.title !== "string" ||
    typeof v.status !== "string"
  ) {
    return null;
  }

  return {
    id: v.id as number,
    title: v.title,
    status: v.status,
    categoryName:
      typeof v.categoryName === "string"
        ? v.categoryName
        : null,
  };
}

function parseCategory(v: unknown): Category | null {
  if (
    !obj(v) ||
    !pid(v.id) ||
    typeof v.name !== "string"
  ) {
    return null;
  }

  return {
    id: v.id as number,
    name: v.name,
  };
}

function parseEnrollment(v: unknown): Enrollment | null {
  if (
    !obj(v) ||
    !pid(v.id) ||
    !pid(v.userId) ||
    !pid(v.courseId) ||
    typeof v.status !== "string"
  ) {
    return null;
  }

  return {
    id: v.id as number,
    userId: v.userId as number,
    courseId: v.courseId as number,
    status: v.status,
    enrolledAt: nullableDate(v.enrolledAt),
  };
}

function parseOrder(v: unknown): Order | null {
  if (
    !obj(v) ||
    !pid(v.id) ||
    typeof v.orderNumber !== "string" ||
    typeof v.status !== "string" ||
    typeof v.currency !== "string" ||
    num(v.totalAmount) === null ||
    !Array.isArray(v.items)
  ) {
    return null;
  }

  const items = v.items.map((i: unknown) => {
    if (
      !obj(i) ||
      !pid(i.courseId) ||
      typeof i.courseTitle !== "string" ||
      num(i.finalPrice) === null
    ) {
      return null;
    }

    return {
      courseId: i.courseId,
      courseTitle: i.courseTitle,
      finalPrice: i.finalPrice,
    } as OrderItem;
  });

  if (items.some((i) => !i)) return null;

  return {
    id: v.id as number,
    orderNumber: v.orderNumber,
    userName: str(v.userName),
    status: v.status,
    currency: v.currency,
    totalAmount: v.totalAmount as number,
    createdAt: nullableDate(v.createdAt),
    items: items as OrderItem[],
  };
}

function parsePayment(v: unknown): Payment | null {
  if (
    !obj(v) ||
    !pid(v.id) ||
    !pid(v.orderId) ||
    typeof v.status !== "string" ||
    typeof v.currency !== "string" ||
    num(v.amount) === null
  ) {
    return null;
  }

  return {
    id: v.id as number,
    orderId: v.orderId as number,
    paymentProvider: str(v.paymentProvider),
    status: v.status,
    currency: v.currency,
    amount: v.amount as number,
    createdAt: nullableDate(v.createdAt),
  };
}

function parseCoupon(v: unknown): Coupon | null {
  if (
    !obj(v) ||
    !pid(v.id) ||
    typeof v.code !== "string" ||
    num(v.usedCount) === null ||
    typeof v.isActive !== "boolean"
  ) {
    return null;
  }

  return {
    id: v.id as number,
    code: v.code,
    usedCount: v.usedCount as number,
    usageLimit: num(v.usageLimit),
    isActive: v.isActive,
    startDate: str(v.startDate),
    endDate: str(v.endDate),
  };
}

function parseCertificate(v: unknown): Certificate | null {
  if (
    !obj(v) ||
    !pid(v.id) ||
    !pid(v.userId) ||
    !pid(v.courseId) ||
    typeof v.certificateNumber !== "string"
  ) {
    return null;
  }

  return {
    id: v.id as number,
    userId: v.userId as number,
    courseId: v.courseId as number,
    certificateNumber: v.certificateNumber,
    studentName: str(v.studentName),
    courseTitle: str(v.courseTitle),
    issuedAt: nullableDate(v.issuedAt),
  };
}

function extractRows(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!obj(value)) return null;

  for (const key of [
    "items",
    "data",
    "results",
    ...SOURCE_KEYS,
  ]) {
    const candidate = value[key];

    if (Array.isArray(candidate)) return candidate;

    if (
      obj(candidate) &&
      Array.isArray(candidate.items)
    ) {
      return candidate.items;
    }
  }

  return null;
}

async function readCollection<T>(
  path: string,
  parser: (item: unknown) => T | null,
  signal: AbortSignal
): Promise<T[]> {
  const res = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const response: unknown = await res.json();
  const rows = extractRows(response);

  if (!rows) {
    throw new Error("Unexpected response format");
  }

  const parsed = rows.map(parser);

  if (parsed.some((item) => item === null)) {
    throw new Error("Unexpected record fields");
  }

  return parsed as T[];
}

// ==================================
// Formatting and date utilities
// ==================================

function dayKey(v: string | null): string {
  return v?.slice(0, 10) ?? "";
}

function localKey(d: Date): string {
  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, n: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + n
  );
}

function periodStart(period: Period, today: Date): string {
  if (period === "all") return "0000-01-01";

  if (period === "year") {
    return `${today.getFullYear()}-01-01`;
  }

  const days =
    period === "7d"
      ? 7
      : period === "30d"
        ? 30
        : 90;

  return localKey(addDays(today, 1 - days));
}

function inPeriod(
  value: string | null,
  start: string,
  end: string
): boolean {
  const day = dayKey(value);
  return !!day && day >= start && day <= end;
}

function money(
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

function nfmt(value: number, locale: Locale): string {
  return new Intl.NumberFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    { maximumFractionDigits: 0 }
  ).format(value);
}

function dateFmt(
  value: string | null,
  locale: Locale
): string {
  if (!value) return "—";

  const dt = new Date(`${dayKey(value)}T12:00:00`);

  return Number.isNaN(dt.getTime())
    ? "—"
    : new Intl.DateTimeFormat(
        locale === "ar" ? "ar-JO" : "en-US",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      ).format(dt);
}

function status(v: string): string {
  return v.trim().toLowerCase();
}

function isCancelled(v: string): boolean {
  return ["cancelled", "canceled"].includes(status(v));
}

function isFailed(v: string): boolean {
  return ["failed", "declined", "rejected"].includes(
    status(v)
  );
}

function shortLabel(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    { month: "short", day: "numeric" }
  ).format(d);
}

function monthLabel(
  y: number,
  m: number,
  locale: Locale
): string {
  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    { month: "short", year: "2-digit" }
  ).format(new Date(y, m, 1));
}

// ==================================
// Revenue trend calculation
// ==================================

function makeTrend(
  orders: Order[],
  period: Period,
  today: Date,
  locale: Locale
): SeriesPoint[] {
  const points: Array<
    SeriesPoint & {
      from: string;
      to: string;
    }
  > = [];

  if (
    period === "7d" ||
    period === "30d" ||
    period === "90d"
  ) {
    const days =
      period === "7d"
        ? 7
        : period === "30d"
          ? 30
          : 90;

    const step =
      period === "7d"
        ? 1
        : period === "30d"
          ? 3
          : 7;

    const beginning = addDays(today, 1 - days);

    for (
      let offset = 0;
      offset < days;
      offset += step
    ) {
      const first = addDays(beginning, offset);

      const last = addDays(
        beginning,
        Math.min(days - 1, offset + step - 1)
      );

      points.push({
        label: shortLabel(first, locale),
        value: 0,
        count: 0,
        from: localKey(first),
        to: localKey(last),
      });
    }
  } else {
    const earliest = orders
      .map((order) => dayKey(order.createdAt))
      .filter(Boolean)
      .sort()[0];

    const baseline =
      period === "year"
        ? new Date(today.getFullYear(), 0, 1)
        : earliest
          ? new Date(`${earliest}T12:00:00`)
          : new Date(
              today.getFullYear(),
              today.getMonth() - 5,
              1
            );

    const startMonth =
      period === "all"
        ? new Date(
            Math.min(
              baseline.getFullYear(),
              today.getFullYear()
            ),
            baseline.getMonth(),
            1
          )
        : baseline;

    const actualStart =
      period === "all" && earliest
        ? new Date(
            Math.min(
              startMonth.getTime(),
              new Date(
                today.getFullYear(),
                today.getMonth() - 5,
                1
              ).getTime()
            )
          )
        : startMonth;

    let cursor = new Date(
      actualStart.getFullYear(),
      actualStart.getMonth(),
      1
    );

    while (cursor <= today) {
      const next = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        1
      );

      points.push({
        label: monthLabel(
          cursor.getFullYear(),
          cursor.getMonth(),
          locale
        ),
        value: 0,
        count: 0,
        from: localKey(cursor),
        to: localKey(addDays(next, -1)),
      });

      cursor = next;
    }
  }

  for (const order of orders) {
    const date = dayKey(order.createdAt);

    const bucket = points.find(
      (point) =>
        date &&
        date >= point.from &&
        date <= point.to
    );

    if (bucket) {
      bucket.value += order.totalAmount;
      bucket.count += 1;
    }
  }

  return points.map(({ label, value, count }) => ({
    label,
    value,
    count,
  }));
}

// ==================================
// SVG revenue chart
// ==================================

function TrendChart({
  series,
  currency,
  locale,
}: {
  series: SeriesPoint[];
  currency: string;
  locale: Locale;
}) {
  const w = 820;
  const h = 258;
  const left = 64;
  const right = 18;
  const top = 18;
  const bottom = 43;

  const iw = w - left - right;
  const ih = h - top - bottom;

  const max = Math.max(
    1,
    ...series.map((v) => v.value)
  );

  const x = (i: number) =>
    left +
    (series.length <= 1
      ? iw / 2
      : (i / (series.length - 1)) * iw);

  const y = (v: number) =>
    top + ih - (v / max) * ih;

  const path = series
    .map(
      (p, i) =>
        `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(
          p.value
        ).toFixed(1)}`
    )
    .join(" ");

  const area = series.length
    ? `${path} L ${x(series.length - 1)} ${
        top + ih
      } L ${x(0)} ${top + ih} Z`
    : "";

  const nf = new Intl.NumberFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    }
  );

  return (
    <div className={styles.chartFrame}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={
          locale === "ar"
            ? "رسم قيمة الطلبات المدفوعة عبر الوقت"
            : "Paid order value over time"
        }
        className={styles.trendSvg}
      >
        <defs>
          <linearGradient
            id="reportsArea"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#5d9ec6"
              stopOpacity="0.25"
            />
            <stop
              offset="100%"
              stopColor="#5d9ec6"
              stopOpacity="0.01"
            />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map(
          (portion) => {
            const yy = top + ih * (1 - portion);

            return (
              <g key={portion}>
                <line
                  x1={left}
                  x2={w - right}
                  y1={yy}
                  y2={yy}
                  stroke="#e8eff5"
                  strokeDasharray="4 5"
                />
                <text
                  x={left - 12}
                  y={yy + 4}
                  textAnchor="end"
                  fill="#8ba0b4"
                  fontSize="11"
                >
                  {nf.format(max * portion)}
                </text>
              </g>
            );
          }
        )}

        <path
          d={area}
          fill="url(#reportsArea)"
        />

        <path
          d={path}
          fill="none"
          stroke="#2779ae"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {series.map((point, i) => {
          const labelStep = Math.max(
            1,
            Math.ceil(series.length / 6)
          );

          return (
            <g key={`${point.label}-${i}`}>
              <circle
                cx={x(i)}
                cy={y(point.value)}
                r="4"
                fill="#fff"
                stroke="#287bad"
                strokeWidth="2"
              >
                <title>
                  {`${point.label}: ${money(
                    point.value,
                    currency,
                    locale
                  )} · ${point.count} ${
                    locale === "ar"
                      ? "طلب"
                      : "orders"
                  }`}
                </title>
              </circle>

              {(i % labelStep === 0 ||
                i === series.length - 1) && (
                <text
                  x={x(i)}
                  y={h - 13}
                  textAnchor="middle"
                  fill="#8ba0b4"
                  fontSize="11"
                >
                  {point.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ==================================
// Reusable visual elements
// ==================================

function BarRow({
  label,
  value,
  max,
  valueLabel,
}: {
  label: string;
  value: number;
  max: number;
  valueLabel: string;
}) {
  return (
    <div className={styles.barRow}>
      <div className={styles.barRowText}>
        <span title={label}>{label}</span>
        <strong>{valueLabel}</strong>
      </div>

      <div className={styles.barTrack}>
        <span
          style={{
            width: `${
              max > 0
                ? (value / max) * 100
                : 0
            }%`,
          }}
        />
      </div>
    </div>
  );
}

function StatusBreakdown({
  rows,
  empty,
}: {
  rows: {
    label: string;
    value: number;
    tone: string;
  }[];
  empty: string;
}) {
  const sum = rows.reduce(
    (a, v) => a + v.value,
    0
  );

  if (!sum) {
    return (
      <p className={styles.emptyMini}>
        {empty}
      </p>
    );
  }

  return (
    <>
      <div
        className={styles.statusStrip}
        aria-label={rows
          .map((r) => `${r.label}: ${r.value}`)
          .join(", ")}
      >
        {rows
          .filter((r) => r.value > 0)
          .map((r) => (
            <span
              key={r.label}
              className={styles[r.tone]}
              style={{
                width: `${
                  (r.value / sum) * 100
                }%`,
              }}
              title={`${r.label}: ${r.value}`}
            />
          ))}
      </div>

      <div className={styles.statusLegend}>
        {rows.map((r) => (
          <div key={r.label}>
            <span
              className={`${styles.legendDot} ${
                styles[r.tone]
              }`}
            />
            <span>{r.label}</span>
            <strong>{r.value}</strong>
          </div>
        ))}
      </div>
    </>
  );
}

// ==================================
// Main dashboard
// ==================================

export default function AdminReportsPage() {
  const params = useParams<{
    locale: string;
  }>();

  const locale: Locale =
    params.locale === "ar" ? "ar" : "en";

  const t = copy[locale];

  const [data, setData] =
    useState<ReportsData>(initialData);

  const [errors, setErrors] = useState<
    Partial<Record<SourceKey, string>>
  >({});

  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(true);
  const [reload, setReload] = useState(0);

  const [lastUpdate, setLastUpdate] =
    useState<Date | null>(null);

  const [today, setToday] = useState<Date>(
    () => new Date()
  );

  const [period, setPeriod] =
    useState<Period>("30d");

  const [chosenCurrency, setChosenCurrency] =
    useState("");

  // ==================================
  // Fetch eight existing API sources
  // ==================================

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setBusy(true);

      const results = await Promise.allSettled([
        readCollection(
          "/api/admin/users",
          parseUser,
          controller.signal
        ),
        readCollection(
          "/api/admin/courses",
          parseCourse,
          controller.signal
        ),
        readCollection(
          "/api/admin/categories",
          parseCategory,
          controller.signal
        ),
        readCollection(
          "/api/admin/enrollments",
          parseEnrollment,
          controller.signal
        ),
        readCollection(
          "/api/admin/orders",
          parseOrder,
          controller.signal
        ),
        readCollection(
          "/api/admin/payments",
          parsePayment,
          controller.signal
        ),
        readCollection(
          "/api/admin/coupons",
          parseCoupon,
          controller.signal
        ),
        readCollection(
          "/api/admin/certificates",
          parseCertificate,
          controller.signal
        ),
      ]);

      if (controller.signal.aborted) return;

      const next = initialData();

      const failed: Partial<
        Record<SourceKey, string>
      > = {};

      const [
        u,
        c,
        cat,
        en,
        o,
        p,
        cp,
        cert,
      ] = results;

      if (u.status === "fulfilled") {
        next.users = u.value;
      } else {
        failed.users = String(u.reason);
      }

      if (c.status === "fulfilled") {
        next.courses = c.value;
      } else {
        failed.courses = String(c.reason);
      }

      if (cat.status === "fulfilled") {
        next.categories = cat.value;
      } else {
        failed.categories = String(cat.reason);
      }

      if (en.status === "fulfilled") {
        next.enrollments = en.value;
      } else {
        failed.enrollments = String(en.reason);
      }

      if (o.status === "fulfilled") {
        next.orders = o.value;
      } else {
        failed.orders = String(o.reason);
      }

      if (p.status === "fulfilled") {
        next.payments = p.value;
      } else {
        failed.payments = String(p.reason);
      }

      if (cp.status === "fulfilled") {
        next.coupons = cp.value;
      } else {
        failed.coupons = String(cp.reason);
      }

      if (cert.status === "fulfilled") {
        next.certificates = cert.value;
      } else {
        failed.certificates = String(cert.reason);
      }

      setData(next);
      setErrors(failed);
      setLoaded(true);
      setBusy(false);
      setLastUpdate(new Date());
      setToday(new Date());
    }

    void run();

    return () => controller.abort();
  }, [reload]);

  // ==================================
  // Source status
  // ==================================

  const available = (key: SourceKey) =>
    loaded && !errors[key];

  const sourceCount = SOURCE_KEYS.filter(
    (key) => available(key)
  ).length;

  // ==================================
  // Date / currency selection
  // ==================================

  const currencies = useMemo(
    () =>
      [
        ...new Set(
          [
            ...data.orders.map(
              (o) => o.currency
            ),
            ...data.payments.map(
              (p) => p.currency
            ),
          ].filter(Boolean)
        ),
      ].sort(),
    [data.orders, data.payments]
  );

  const currency = currencies.includes(
    chosenCurrency
  )
    ? chosenCurrency
    : currencies[0] ?? "JOD";

  const start = periodStart(period, today);
  const end = localKey(today);

  const currentOrders = data.orders.filter(
    (o) =>
      inPeriod(o.createdAt, start, end)
  );

  const currentPayments =
    data.payments.filter((p) =>
      inPeriod(p.createdAt, start, end)
    );

  const currencyOrders =
    currentOrders.filter(
      (o) => o.currency === currency
    );

  const paidOrders =
    currencyOrders.filter(
      (o) => status(o.status) === "paid"
    );

  const paidVolume = paidOrders.reduce(
    (s, o) => s + o.totalAmount,
    0
  );

  const newEnrollments =
    data.enrollments.filter((e) =>
      inPeriod(e.enrolledAt, start, end)
    );

  const issued =
    data.certificates.filter((c) =>
      inPeriod(c.issuedAt, start, end)
    );

  // ==================================
  // Revenue chart data
  // ==================================

  const trend = useMemo(
    () =>
      makeTrend(
        paidOrders,
        period,
        today,
        locale
      ),
    [paidOrders, period, today, locale]
  );

  // ==================================
  // Top-selling courses
  // ==================================

  const topCourses = useMemo(() => {
    const map = new Map<
      number,
      {
        id: number;
        title: string;
        value: number;
        sold: number;
      }
    >();

    for (const order of paidOrders) {
      for (const item of order.items) {
        const existing = map.get(
          item.courseId
        ) ?? {
          id: item.courseId,
          title: item.courseTitle,
          value: 0,
          sold: 0,
        };

        existing.value += item.finalPrice;
        existing.sold += 1;

        map.set(item.courseId, existing);
      }
    }

    return [...map.values()]
      .sort(
        (a, b) =>
          b.value - a.value ||
          b.sold - a.sold
      )
      .slice(0, 5);
  }, [paidOrders]);

  // ==================================
  // Published courses by category
  // ==================================

  const categoryRows = useMemo(() => {
    const map = new Map<
      string,
      number
    >();

    for (const c of data.courses.filter(
      (c) =>
        status(c.status) === "published"
    )) {
      const key =
        c.categoryName ||
        (locale === "ar"
          ? "غير مصنّف"
          : "Uncategorized");

      map.set(
        key,
        (map.get(key) ?? 0) + 1
      );
    }

    return [...map.entries()]
      .map(([label, value]) => ({
        label,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data.courses, locale]);

  // ==================================
  // Order and payment status
  // ==================================

  const orderStatus = [
    {
      label: t.paid,
      value: currentOrders.filter(
        (o) => status(o.status) === "paid"
      ).length,
      tone: "toneTeal",
    },
    {
      label: t.cancelled,
      value: currentOrders.filter(
        (o) => isCancelled(o.status)
      ).length,
      tone: "toneMuted",
    },
    {
      label: t.pending,
      value: currentOrders.filter(
        (o) =>
          status(o.status) !== "paid" &&
          !isCancelled(o.status)
      ).length,
      tone: "toneGold",
    },
  ];

  const paidPayments =
    currentPayments.filter(
      (p) => status(p.status) === "paid"
    ).length;

  const paymentStatus = [
    {
      label: t.paid,
      value: paidPayments,
      tone: "toneTeal",
    },
    {
      label: t.failed,
      value: currentPayments.filter(
        (p) => isFailed(p.status)
      ).length,
      tone: "toneRed",
    },
    {
      label: t.other,
      value: currentPayments.filter(
        (p) =>
          status(p.status) !== "paid" &&
          !isFailed(p.status)
      ).length,
      tone: "toneGold",
    },
  ];

  const roleCount = (role: string) =>
    data.users.filter((u) =>
      u.roles.some(
        (r) =>
          r.toLowerCase() === role.toLowerCase()
      )
    ).length;

  const liveCouponCount =
    data.coupons.filter(
      (c) =>
        c.isActive &&
        dayKey(c.startDate) <= end &&
        dayKey(c.endDate) >= end &&
        (c.usageLimit === null ||
          c.usedCount < c.usageLimit)
    ).length;

  const popularCoupons = [
    ...data.coupons,
  ]
    .sort(
      (a, b) =>
        b.usedCount - a.usedCount
    )
    .slice(0, 4);

  const recentOrders = [
    ...currentOrders,
  ]
    .sort((a, b) =>
      (b.createdAt ?? "").localeCompare(
        a.createdAt ?? ""
      )
    )
    .slice(0, 4);

  const recentPayments = [
    ...currentPayments,
  ]
    .sort((a, b) =>
      (b.createdAt ?? "").localeCompare(
        a.createdAt ?? ""
      )
    )
    .slice(0, 4);

  const recentCertificates = [
    ...issued,
  ]
    .sort((a, b) =>
      (b.issuedAt ?? "").localeCompare(
        a.issuedAt ?? ""
      )
    )
    .slice(0, 4);

  // ==================================
  // Main KPI cards
  // ==================================

  const kpis = [
    {
      label: t.paidVolume,
      value:
        available("orders") &&
        currencies.length
          ? money(
              paidVolume,
              currency,
              locale
            )
          : t.noData,
      note: t.paidVolumeNote,
      accent: true,
    },
    {
      label: t.paidOrders,
      value: available("orders")
        ? nfmt(
            paidOrders.length,
            locale
          )
        : t.noData,
      note: `${t.periodHint} · ${currency}`,
      accent: false,
    },
    {
      label: t.newEnrollments,
      value: available("enrollments")
        ? nfmt(
            newEnrollments.length,
            locale
          )
        : t.noData,
      note: t.periodHint,
      accent: false,
    },
    {
      label: t.certificatesIssued,
      value: available("certificates")
        ? nfmt(
            issued.length,
            locale
          )
        : t.noData,
      note: t.periodHint,
      accent: false,
    },
  ];

  const secondary = [
    {
      label: t.activeStudents,
      value: available("users")
        ? nfmt(
            data.users.filter(
              (u) =>
                u.isActive &&
                u.roles.some(
                  (r) =>
                    r.toLowerCase() ===
                    "student"
                )
            ).length,
            locale
          )
        : t.noData,
      hint: t.snapshot,
    },
    {
      label: t.published,
      value: available("courses")
        ? nfmt(
            data.courses.filter(
              (c) =>
                status(c.status) ===
                "published"
            ).length,
            locale
          )
        : t.noData,
      hint: t.snapshot,
    },
    {
      label: t.averageOrder,
      value:
        available("orders") &&
        currencies.length
          ? money(
              paidOrders.length
                ? paidVolume /
                    paidOrders.length
                : 0,
              currency,
              locale
            )
          : t.noData,
      hint: t.periodHint,
    },
    {
      label: t.couponUses,
      value: available("coupons")
        ? nfmt(
            data.coupons.reduce(
              (s, c) =>
                s + c.usedCount,
              0
            ),
            locale
          )
        : t.noData,
      hint: t.lifetime,
    },
  ];

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* Header */}

      <div className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            {t.eyebrow}
          </p>
          <h1>{t.title}</h1>
          <p className={styles.subtitle}>
            {t.subtitle}
          </p>
        </div>

        <div className={styles.headActions}>
          <span className={styles.syncIndicator}>
            <i
              className={
                busy ? styles.pulsing : ""
              }
            />
            {busy
              ? t.syncing
              : `${sourceCount}/${SOURCE_KEYS.length} ${t.sources}`}
          </span>

          <button
            className={styles.refresh}
            type="button"
            disabled={busy}
            onClick={() =>
              setReload((v) => v + 1)
            }
          >
            ↻ &nbsp;{t.sync}
          </button>
        </div>
      </div>

      {/* Period and currency filters */}

      <div className={styles.toolbar}>
        <div
          className={styles.periodControls}
          aria-label={t.period}
        >
          {(
            [
              "7d",
              "30d",
              "90d",
              "year",
              "all",
            ] as Period[]
          ).map((p) => (
            <button
              type="button"
              key={p}
              className={
                period === p
                  ? styles.periodActive
                  : ""
              }
              onClick={() => setPeriod(p)}
            >
              {p === "7d"
                ? t.period7
                : p === "30d"
                  ? t.period30
                  : p === "90d"
                    ? t.period90
                    : p === "year"
                      ? t.periodYear
                      : t.periodAll}
            </button>
          ))}
        </div>

        <div className={styles.toolbarMeta}>
          <label>
            {t.currency}
            <select
              value={currency}
              onChange={(e) =>
                setChosenCurrency(
                  e.target.value
                )
              }
              disabled={!currencies.length}
            >
              {currencies.length ? (
                currencies.map((cur) => (
                  <option
                    key={cur}
                    value={cur}
                  >
                    {cur}
                  </option>
                ))
              ) : (
                <option value="JOD">—</option>
              )}
            </select>
          </label>

          {lastUpdate && (
            <small>
              {t.updated}:{" "}
              {new Intl.DateTimeFormat(
                locale === "ar"
                  ? "ar-JO"
                  : "en-US",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              ).format(lastUpdate)}
            </small>
          )}
        </div>
      </div>

      {!loaded && (
        <div className={styles.loadingState}>
          {t.loading}
        </div>
      )}

      {loaded &&
        Object.keys(errors).length > 0 && (
          <div
            role="alert"
            className={styles.sourceWarning}
          >
            <strong>{t.partial}</strong>
            <span>
              {t.sourceErrors}:{" "}
              {SOURCE_KEYS.filter(
                (k) => errors[k]
              ).join(", ")}
            </span>
          </div>
        )}

      {/* Primary metrics */}

      <section
        className={styles.primaryGrid}
        aria-label={t.title}
      >
        {kpis.map((kpi, i) => (
          <div
            className={`${styles.primaryCard} ${
              kpi.accent
                ? styles.primaryAccent
                : ""
            }`}
            key={kpi.label}
          >
            <div className={styles.kpiLabel}>
              <span>{kpi.label}</span>
              <small>
                {String(i + 1).padStart(
                  2,
                  "0"
                )}
              </small>
            </div>

            <strong
              className={styles.kpiValue}
            >
              {!loaded
                ? "—"
                : kpi.value}
            </strong>

            <p>{kpi.note}</p>
          </div>
        ))}
      </section>

      {/* Secondary metrics */}

      <section
        className={styles.secondaryGrid}
        aria-label={t.snapshot}
      >
        {secondary.map((card) => (
          <div
            key={card.label}
            className={styles.secondaryCard}
          >
            <span>{card.label}</span>
            <strong>
              {!loaded
                ? "—"
                : card.value}
            </strong>
            <small>{card.hint}</small>
          </div>
        ))}
      </section>

      {/* Revenue Trend */}

      <section
        className={styles.trendPanel}
      >
        <div className={styles.sectionHead}>
          <div>
            <span
              className={styles.sectionIndex}
            >
              01 / COMMERCE TREND
            </span>
            <h2>{t.revenueTitle}</h2>
            <p>{t.revenueDesc}</p>
          </div>

          <span className={styles.panelTag}>
            {currency}
          </span>
        </div>

        {!available("orders") ? (
          <p className={styles.emptyMini}>
            {t.noSource}
          </p>
        ) : paidOrders.length ? (
          <>
            <TrendChart
              series={trend}
              currency={currency}
              locale={locale}
            />

            <div
              className={styles.chartLegend}
            >
              <span
                className={styles.chartDot}
              />
              {t.revenueLegend}
              <span
                className={
                  styles.chartSeparator
                }
              />
              {paidOrders.length}{" "}
              {t.ordersLegend}
            </div>
          </>
        ) : (
          <p className={styles.emptyChart}>
            {t.noRevenue}
          </p>
        )}
      </section>

      {/* Orders + Payments */}

      <div className={styles.splitGrid}>
        <section className={styles.panel}>
          <div
            className={styles.sectionHead}
          >
            <div>
              <span
                className={
                  styles.sectionIndex
                }
              >
                02 / ORDER FLOW
              </span>

              <h2>{t.ordersTitle}</h2>
              <p>{t.ordersDesc}</p>
            </div>
          </div>

          {available("orders") ? (
            <StatusBreakdown
              rows={orderStatus}
              empty={t.empty}
            />
          ) : (
            <p className={styles.emptyMini}>
              {t.noSource}
            </p>
          )}
        </section>

        <section className={styles.panel}>
          <div
            className={styles.sectionHead}
          >
            <div>
              <span
                className={
                  styles.sectionIndex
                }
              >
                03 / PAYMENT SIGNAL
              </span>

              <h2>{t.paymentsTitle}</h2>
              <p>{t.paymentsDesc}</p>
            </div>
          </div>

          {available("payments") ? (
            <>
              <StatusBreakdown
                rows={paymentStatus}
                empty={t.empty}
              />

              {currentPayments.length >
                0 && (
                <div
                  className={
                    styles.paymentFoot
                  }
                >
                  <strong>
                    {nfmt(
                      (paidPayments /
                        currentPayments.length) *
                        100,
                      locale
                    )}
                    %
                  </strong>
                  <span>
                    {t.paymentShare}
                  </span>
                </div>
              )}

              {currentPayments.some(
                (p) =>
                  p.paymentProvider
                    .toLowerCase()
                    .includes("test")
              ) && (
                <p className={styles.testNote}>
                  {t.testNote}
                </p>
              )}
            </>
          ) : (
            <p className={styles.emptyMini}>
              {t.noSource}
            </p>
          )}
        </section>
      </div>

      {/* Course performance + catalog */}

      <div
        className={styles.performanceGrid}
      >
        <section className={styles.panel}>
          <div
            className={styles.sectionHead}
          >
            <div>
              <span
                className={
                  styles.sectionIndex
                }
              >
                04 / COURSE PERFORMANCE
              </span>

              <h2>{t.topCourses}</h2>
              <p>{t.topCoursesDesc}</p>
            </div>
          </div>

          {!available("orders") ? (
            <p className={styles.emptyMini}>
              {t.noSource}
            </p>
          ) : topCourses.length ? (
            <div className={styles.rankList}>
              {topCourses.map(
                (course, i) => (
                  <div
                    className={
                      styles.rankItem
                    }
                    key={course.id}
                  >
                    <span
                      className={
                        styles.rankNumber
                      }
                    >
                      {String(
                        i + 1
                      ).padStart(2, "0")}
                    </span>

                    <div
                      className={
                        styles.rankContent
                      }
                    >
                      <div
                        className={
                          styles.rankText
                        }
                      >
                        <strong
                          title={course.title}
                        >
                          {course.title}
                        </strong>

                        <span>
                          {money(
                            course.value,
                            currency,
                            locale
                          )}
                        </span>
                      </div>

                      <div
                        className={
                          styles.barTrack
                        }
                      >
                        <span
                          style={{
                            width: `${
                              topCourses[0]
                                .value
                                ? (course.value /
                                    topCourses[0]
                                      .value) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      <small>
                        {course.sold}{" "}
                        {t.orderItems}
                      </small>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className={styles.emptyMini}>
              {t.noTopCourses}
            </p>
          )}
        </section>

        <section className={styles.panel}>
          <div
            className={styles.sectionHead}
          >
            <div>
              <span
                className={
                  styles.sectionIndex
                }
              >
                05 / CATALOG MIX
              </span>

              <h2>{t.catalogTitle}</h2>
              <p>{t.catalogDesc}</p>
            </div>

            {available("categories") && (
              <span
                className={styles.panelTag}
              >
                {data.categories.length}{" "}
                {t.categoriesLabel}
              </span>
            )}
          </div>

          {!available("courses") ? (
            <p className={styles.emptyMini}>
              {t.noSource}
            </p>
          ) : categoryRows.length ? (
            <div className={styles.barList}>
              {categoryRows.map((cat) => (
                <BarRow
                  key={cat.label}
                  label={cat.label}
                  value={cat.value}
                  max={
                    categoryRows[0].value
                  }
                  valueLabel={nfmt(
                    cat.value,
                    locale
                  )}
                />
              ))}
            </div>
          ) : (
            <p className={styles.emptyMini}>
              {t.noCategories}
            </p>
          )}
        </section>
      </div>

      {/* Users and coupons */}

      <div className={styles.splitGrid}>
        <section className={styles.panel}>
          <div
            className={styles.sectionHead}
          >
            <div>
              <span
                className={
                  styles.sectionIndex
                }
              >
                06 / LEARNER BASE
              </span>

              <h2>{t.usersTitle}</h2>
              <p>{t.usersDesc}</p>
            </div>
          </div>

          {!available("users") ? (
            <p className={styles.emptyMini}>
              {t.noSource}
            </p>
          ) : (
            <>
              <div
                className={
                  styles.audienceTotal
                }
              >
                <strong>
                  {nfmt(
                    data.users.length,
                    locale
                  )}
                </strong>

                <span>{t.accounts}</span>
              </div>

              <div
                className={styles.barList}
              >
                {[
                  {
                    label: t.students,
                    value:
                      roleCount("Student"),
                  },
                  {
                    label: t.instructors,
                    value:
                      roleCount("Instructor"),
                  },
                  {
                    label: t.admins,
                    value:
                      roleCount("Admin"),
                  },
                ].map((r) => (
                  <BarRow
                    key={r.label}
                    label={r.label}
                    value={r.value}
                    max={Math.max(
                      data.users.length,
                      1
                    )}
                    valueLabel={nfmt(
                      r.value,
                      locale
                    )}
                  />
                ))}
              </div>

              <p
                className={
                  styles.finePrint
                }
              >
                {t.rolesNote}
              </p>
            </>
          )}

          {available(
            "enrollments"
          ) && (
            <div
              className={
                styles.enrollmentStrip
              }
            >
              <div>
                <strong>
                  {
                    data.enrollments.filter(
                      (e) =>
                        status(
                          e.status
                        ) ===
                        "active"
                    ).length
                  }
                </strong>

                <span>
                  {t.activeEnrollments}
                </span>
              </div>

              <div>
                <strong>
                  {
                    data.enrollments.filter(
                      (e) =>
                        status(
                          e.status
                        ) ===
                        "completed"
                    ).length
                  }
                </strong>

                <span>
                  {t.completedEnrollments}
                </span>
              </div>
            </div>
          )}
        </section>

        <section className={styles.panel}>
          <div
            className={styles.sectionHead}
          >
            <div>
              <span
                className={
                  styles.sectionIndex
                }
              >
                07 / PROMOTIONS
              </span>

              <h2>{t.couponsTitle}</h2>
              <p>{t.couponsDesc}</p>
            </div>
          </div>

          {!available("coupons") ? (
            <p className={styles.emptyMini}>
              {t.noSource}
            </p>
          ) : (
            <>
              <div
                className={
                  styles.couponSummary
                }
              >
                <div>
                  <strong>
                    {data.coupons.length}
                  </strong>
                  <span>
                    {t.totalCoupons}
                  </span>
                </div>

                <div>
                  <strong>
                    {liveCouponCount}
                  </strong>
                  <span>
                    {t.activeCoupons}
                  </span>
                </div>
              </div>

              {popularCoupons.length ? (
                <div
                  className={
                    styles.couponList
                  }
                >
                  {popularCoupons.map(
                    (coupon) => (
                      <div key={coupon.id}>
                        <code>
                          {coupon.code}
                        </code>

                        <div>
                          <strong>
                            {nfmt(
                              coupon.usedCount,
                              locale
                            )}
                          </strong>
                          <span>
                            {t.uses}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p
                  className={
                    styles.emptyMini
                  }
                >
                  {t.noCoupons}
                </p>
              )}
            </>
          )}
        </section>
      </div>

      {/* Recent activity */}

      <section
        className={styles.activityPanel}
      >
        <div className={styles.sectionHead}>
          <div>
            <span
              className={styles.sectionIndex}
            >
              08 / RECENT ACTIVITY
            </span>

            <h2>{t.recentTitle}</h2>
            <p>{t.recentDesc}</p>
          </div>

          <Link
            href={`/${locale}/admin/orders`}
            className={
              styles.linkAction
            }
          >
            {t.viewAll} ↗
          </Link>
        </div>

        <div className={styles.activityGrid}>
          {/* Recent orders */}

          <div
            className={
              styles.activityColumn
            }
          >
            <h3>{t.recentTitle}</h3>

            {!available("orders") ? (
              <p
                className={
                  styles.emptyMini
                }
              >
                {t.noSource}
              </p>
            ) : recentOrders.length ? (
              recentOrders.map(
                (order) => (
                  <div
                    className={
                      styles.activityItem
                    }
                    key={order.id}
                  >
                    <div>
                      <strong>
                        {order.orderNumber}
                      </strong>

                      <small>
                        {order.userName ||
                          `#${order.id}`}{" "}
                        ·{" "}
                        {dateFmt(
                          order.createdAt,
                          locale
                        )}
                      </small>
                    </div>

                    <div>
                      <b>
                        {money(
                          order.totalAmount,
                          order.currency,
                          locale
                        )}
                      </b>

                      <span
                        className={
                          status(
                            order.status
                          ) === "paid"
                            ? styles.goodText
                            : styles.mutedText
                        }
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                )
              )
            ) : (
              <p
                className={
                  styles.emptyMini
                }
              >
                {t.noOrders}
              </p>
            )}
          </div>

          {/* Recent payments */}

          <div
            className={
              styles.activityColumn
            }
          >
            <h3>{t.recentPayments}</h3>

            {!available("payments") ? (
              <p
                className={
                  styles.emptyMini
                }
              >
                {t.noSource}
              </p>
            ) : recentPayments.length ? (
              recentPayments.map((p) => (
                <div
                  className={
                    styles.activityItem
                  }
                  key={p.id}
                >
                  <div>
                    <strong>
                      #{p.id} ·{" "}
                      {p.paymentProvider}
                    </strong>
                    <small>
                      Order #{p.orderId} ·{" "}
                      {dateFmt(
                        p.createdAt,
                        locale
                      )}
                    </small>
                  </div>

                  <div>
                    <b>
                      {money(
                        p.amount,
                        p.currency,
                        locale
                      )}
                    </b>

                    <span
                      className={
                        status(p.status) ===
                        "paid"
                          ? styles.goodText
                          : styles.mutedText
                      }
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p
                className={
                  styles.emptyMini
                }
              >
                {t.noPayments}
              </p>
            )}
          </div>

          {/* Recent certificates */}

          <div
            className={
              styles.activityColumn
            }
          >
            <h3>{t.recentCertificates}</h3>

            {!available(
              "certificates"
            ) ? (
              <p
                className={
                  styles.emptyMini
                }
              >
                {t.noSource}
              </p>
            ) : recentCertificates.length ? (
              recentCertificates.map(
                (c) => (
                  <div
                    className={
                      styles.activityItem
                    }
                    key={c.id}
                  >
                    <div>
                      <strong>
                        {
                          c.certificateNumber
                        }
                      </strong>
                      <small>
                        {c.studentName}
                      </small>
                    </div>

                    <div>
                      <b>
                        {dateFmt(
                          c.issuedAt,
                          locale
                        )}
                      </b>
                      <span
                        className={
                          styles.mutedText
                        }
                      >
                        {c.courseTitle}
                      </span>
                    </div>
                  </div>
                )
              )
            ) : (
              <p
                className={
                  styles.emptyMini
                }
              >
                {t.noCertificates}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Data methodology */}

      <footer
        className={styles.methodology}
      >
        <div>
          <span
            className={styles.sectionIndex}
          >
            DATA INTEGRITY
          </span>

          <h2>
            {t.analyticsNote}
          </h2>
        </div>

        <ul>
          <li>{t.method1}</li>
          <li>{t.method2}</li>
          <li>{t.method3}</li>
          <li>{t.method4}</li>
        </ul>
      </footer>
    </main>
  );
}
