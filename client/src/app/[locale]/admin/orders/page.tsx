
"use client";

import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./page.module.css";

type Locale = "en" | "ar";

type OrderItem = {
  id: number;
  courseId: number;
  courseTitle: string;
  unitPrice: number;
  discountAmount: number;
  finalPrice: number;
};

type Order = {
  id: number;
  orderNumber: string;
  userId: number;
  userName: string;
  userEmail: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  status: string;
  couponCode: string | null;
  createdAt: string | null;
  paidAt: string | null;
  items: OrderItem[];
};

type Payment = {
  id: number;
  orderId: number;
  orderNumber: string;
  userId: number;
  userEmail: string;
  paymentProvider: string;
  transactionId: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string | null;
  paidAt: string | null;
  failedAt: string | null;
};

const PAGE_SIZE = 10;

const translations = {
  en: {
    eyebrow: "ACADEMY / COMMERCE",
    title: "Orders management",
    subtitle:
      "Review purchases, inspect payments and manage order records.",
    total: "Total orders",
    paid: "Paid orders",
    open: "In progress",
    cancelled: "Cancelled orders",
    revenue: "Paid order volume",
    revenueHint:
      "Calculated from paid orders, not a settlement report.",
    directory: "Order directory",
    directoryHint:
      "All purchase records retrieved from the academy API.",
    search: "Search orders, students, emails or courses...",
    allStatuses: "All statuses",
    allCurrencies: "All currencies",
    from: "From",
    to: "To",
    clear: "Clear filters",
    refresh: "Refresh",
    order: "Order",
    customer: "Customer",
    courses: "Courses",
    amount: "Amount",
    placed: "Placed",
    status: "Status",
    actions: "Actions",
    details: "View details",
    loading: "Loading orders...",
    empty: "No orders yet",
    emptyFiltered: "No matching orders",
    emptyHint: "Try changing your search or filters.",
    error: "Could not load the orders.",
    paymentsError:
      "Payment records could not be loaded. Order details are still available.",
    retry: "Try again",
    showing: "Showing",
    of: "of",
    previous: "Previous",
    next: "Next",
    page: "Page",
    detailsTitle: "Order details",
    detailsHint: "Purchase, billing and payment information.",
    orderNumber: "Order number",
    orderId: "Order ID",
    userId: "Customer ID",
    email: "Email",
    createdAt: "Created on",
    paidAt: "Paid on",
    coupon: "Coupon code",
    none: "None",
    orderItems: "Purchased courses",
    unitPrice: "Original price",
    itemDiscount: "Discount",
    itemTotal: "Final price",
    subtotal: "Subtotal",
    discount: "Total discount",
    total: "Order total",
    payments: "Payment records",
    paymentCount: "Payment records",
    noPayments: "No payment records for this order.",
    paymentProvider: "Provider",
    transaction: "Transaction ID",
    paymentStatus: "Payment status",
    paymentAmount: "Payment amount",
    paymentId: "Payment ID",
    paymentCreated: "Payment created",
    failedAt: "Failed on",
    unavailable: "Not available",
    close: "Close",
    cancelOrder: "Cancel order",
    confirmCancel: "Cancel this order?",
    confirmWarning:
      "This action changes the order status. It does not automatically refund a payment.",
    confirmButton: "Confirm cancellation",
    goBack: "Go back",
    processing: "Processing...",
    cancelSuccess: "Order cancelled successfully.",
    actionError: "The request could not be completed.",
    paidProtection:
      "Paid orders cannot be cancelled from this panel until the refund and payment reconciliation rules are reviewed.",
    cancelUnavailable:
      "This order status is not currently eligible for cancellation.",
  },
  ar: {
    eyebrow: "الأكاديمية / المبيعات",
    title: "إدارة الطلبات",
    subtitle:
      "راجع مشتريات الطلاب وتفاصيل الفواتير وسجلات الدفع وحالات الطلبات.",
    total: "إجمالي الطلبات",
    paid: "الطلبات المدفوعة",
    open: "قيد المعالجة",
    cancelled: "الطلبات الملغاة",
    revenue: "إجمالي الطلبات المدفوعة",
    revenueHint:
      "محسوب من الطلبات المدفوعة، وليس تقرير تسوية بنكية.",
    directory: "سجل الطلبات",
    directoryHint:
      "جميع عمليات الشراء المسجلة في الأكاديمية.",
    search: "ابحث برقم الطلب أو الطالب أو البريد أو الدورة...",
    allStatuses: "جميع الحالات",
    allCurrencies: "جميع العملات",
    from: "من تاريخ",
    to: "إلى تاريخ",
    clear: "إزالة الفلاتر",
    refresh: "تحديث",
    order: "الطلب",
    customer: "العميل",
    courses: "الدورات",
    amount: "المبلغ",
    placed: "تاريخ الطلب",
    status: "الحالة",
    actions: "الإجراءات",
    details: "التفاصيل",
    loading: "جارٍ تحميل الطلبات...",
    empty: "لا توجد طلبات بعد",
    emptyFiltered: "لا توجد طلبات مطابقة",
    emptyHint: "جرّب تعديل البحث أو الفلاتر.",
    error: "تعذّر تحميل الطلبات.",
    paymentsError:
      "تعذّر تحميل سجلات الدفع. ما زالت تفاصيل الطلبات متاحة.",
    retry: "إعادة المحاولة",
    showing: "عرض",
    of: "من أصل",
    previous: "السابق",
    next: "التالي",
    page: "صفحة",
    detailsTitle: "تفاصيل الطلب",
    detailsHint: "معلومات الشراء والفاتورة والمدفوعات.",
    orderNumber: "رقم الطلب",
    orderId: "معرّف الطلب",
    userId: "معرّف العميل",
    email: "البريد الإلكتروني",
    createdAt: "تاريخ الإنشاء",
    paidAt: "تاريخ الدفع",
    coupon: "كود الخصم",
    none: "لا يوجد",
    orderItems: "الدورات المشتراة",
    unitPrice: "السعر الأصلي",
    itemDiscount: "الخصم",
    itemTotal: "السعر النهائي",
    subtotal: "الإجمالي قبل الخصم",
    discount: "إجمالي الخصم",
    total: "الإجمالي النهائي",
    payments: "سجلات الدفع",
    paymentCount: "عدد عمليات الدفع",
    noPayments: "لا توجد سجلات دفع مرتبطة بهذا الطلب.",
    paymentProvider: "بوابة الدفع",
    transaction: "رقم العملية",
    paymentStatus: "حالة الدفع",
    paymentAmount: "المبلغ",
    paymentId: "معرّف الدفع",
    paymentCreated: "تاريخ إنشاء الدفع",
    failedAt: "تاريخ فشل الدفع",
    unavailable: "غير متوفر",
    close: "إغلاق",
    cancelOrder: "إلغاء الطلب",
    confirmCancel: "هل تريد إلغاء هذا الطلب؟",
    confirmWarning:
      "هذا الإجراء يغيّر حالة الطلب ولا يعيد المبلغ المدفوع تلقائيًا.",
    confirmButton: "تأكيد الإلغاء",
    goBack: "رجوع",
    processing: "جارٍ التنفيذ...",
    cancelSuccess: "تم إلغاء الطلب بنجاح.",
    actionError: "تعذّر تنفيذ العملية.",
    paidProtection:
      "لا يمكن إلغاء الطلبات المدفوعة من هذه الواجهة قبل مراجعة قواعد الاسترداد وتسوية المدفوعات.",
    cancelUnavailable:
      "حالة هذا الطلب لا تسمح بالإلغاء من الواجهة حاليًا.",
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function extractArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return null;

  for (const key of ["items", "data", "orders", "payments", "results"]) {
    if (Array.isArray(value[key])) return value[key] as unknown[];

    const nested = value[key];

    if (isRecord(nested) && Array.isArray(nested.items)) {
      return nested.items;
    }
  }

  return null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

function positiveId(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
    ? value
    : null;
}

function parseOrderItem(value: unknown): OrderItem | null {
  if (!isRecord(value)) return null;

  const id = positiveId(value.id);
  const courseId = positiveId(value.courseId);
  const unitPrice = numberValue(value.unitPrice);
  const discountAmount = numberValue(value.discountAmount);
  const finalPrice = numberValue(value.finalPrice);

  if (
    !id ||
    !courseId ||
    typeof value.courseTitle !== "string" ||
    unitPrice === null ||
    discountAmount === null ||
    finalPrice === null
  ) {
    return null;
  }

  return {
    id,
    courseId,
    courseTitle: value.courseTitle,
    unitPrice,
    discountAmount,
    finalPrice,
  };
}

function parseOrder(value: unknown): Order | null {
  if (!isRecord(value)) return null;

  const id = positiveId(value.id);
  const userId = positiveId(value.userId);
  const subtotal = numberValue(value.subtotal);
  const discountAmount = numberValue(value.discountAmount);
  const totalAmount = numberValue(value.totalAmount);

  if (
    !id ||
    !userId ||
    typeof value.orderNumber !== "string" ||
    typeof value.userName !== "string" ||
    typeof value.userEmail !== "string" ||
    typeof value.currency !== "string" ||
    typeof value.status !== "string" ||
    subtotal === null ||
    discountAmount === null ||
    totalAmount === null ||
    !Array.isArray(value.items)
  ) {
    return null;
  }

  const items = value.items.map(parseOrderItem);

  // Reject incomplete financial records rather than silently
  // dropping purchased course line items.
  if (items.some((item) => item === null)) return null;

  return {
    id,
    userId,
    orderNumber: value.orderNumber,
    userName: value.userName,
    userEmail: value.userEmail,
    subtotal,
    discountAmount,
    totalAmount,
    currency: value.currency,
    status: value.status,
    couponCode:
      typeof value.couponCode === "string"
        ? value.couponCode
        : null,
    createdAt:
      typeof value.createdAt === "string"
        ? value.createdAt
        : null,
    paidAt:
      typeof value.paidAt === "string"
        ? value.paidAt
        : null,
    items: items as OrderItem[],
  };
}

function parsePayment(value: unknown): Payment | null {
  if (!isRecord(value)) return null;

  const id = positiveId(value.id);
  const orderId = positiveId(value.orderId);
  const userId = positiveId(value.userId);
  const amount = numberValue(value.amount);

  if (
    !id ||
    !orderId ||
    !userId ||
    amount === null ||
    typeof value.orderNumber !== "string" ||
    typeof value.userEmail !== "string" ||
    typeof value.paymentProvider !== "string" ||
    typeof value.currency !== "string" ||
    typeof value.status !== "string"
  ) {
    return null;
  }

  return {
    id,
    orderId,
    userId,
    amount,
    orderNumber: value.orderNumber,
    userEmail: value.userEmail,
    paymentProvider: value.paymentProvider,
    currency: value.currency,
    status: value.status,
    transactionId:
      typeof value.transactionId === "string"
        ? value.transactionId
        : null,
    createdAt:
      typeof value.createdAt === "string"
        ? value.createdAt
        : null,
    paidAt:
      typeof value.paidAt === "string"
        ? value.paidAt
        : null,
    failedAt:
      typeof value.failedAt === "string"
        ? value.failedAt
        : null,
  };
}

async function readResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 400) };
  }
}

function responseError(data: unknown, fallback: string): string {
  if (!isRecord(data)) return fallback;

  for (const key of ["message", "Message", "title"]) {
    if (typeof data[key] === "string" && data[key]) {
      return data[key] as string;
    }
  }

  return fallback;
}

async function fetchList(
  url: string,
  fallback: string
): Promise<unknown[]> {
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(responseError(data, fallback));
  }

  const items = extractArray(data);

  if (!items) throw new Error(`Unexpected API response: ${url}`);

  return items;
}

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase();
}

function isPaid(status: string): boolean {
  return normalizeStatus(status) === "paid";
}

function isCancelled(status: string): boolean {
  return ["cancelled", "canceled"].includes(
    normalizeStatus(status)
  );
}

// Conservative allowlist until the backend cancellation
// and refund rules have been reviewed.
function canCancelOrder(order: Order): boolean {
  return [
    "pending",
    "created",
    "placed",
    "unpaid",
    "failed",
    "paymentpending",
    "awaitingpayment",
  ].includes(
    normalizeStatus(order.status).replace(/[\s_-]/g, "")
  );
}

function money(
  amount: number,
  currency: string,
  locale: Locale
): string {
  const formatted = new Intl.NumberFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }
  ).format(amount);

  return `${formatted} ${currency}`;
}

function dateLabel(
  value: string | null,
  locale: Locale
): string {
  if (!value) return "—";

  // The API provides timestamps without an explicit timezone.
  // Display their calendar date without converting timezone.
  const datePart = value.slice(0, 10);
  const date = new Date(`${datePart}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  ).format(date);
}

function StatusPill({
  status,
}: {
  status: string;
}) {
  const normalized = normalizeStatus(status);

  const className = isPaid(status)
    ? styles.statusPaid
    : isCancelled(status)
      ? styles.statusCancelled
      : ["failed", "rejected"].includes(normalized)
        ? styles.statusFailed
        : styles.statusPending;

  return (
    <span className={`${styles.statusPill} ${className}`}>
      <span aria-hidden="true" />
      {status}
    </span>
  );
}

export default function AdminOrdersPage() {
  const params = useParams<{ locale: string }>();
  const locale: Locale = params.locale === "ar" ? "ar" : "en";
  const t = translations[locale];

  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [paymentsError, setPaymentsError] = useState("");
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const [detailId, setDetailId] = useState<number | null>(null);
  const [details, setDetails] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  // ======================================
  // Load orders and payment records
  // ======================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setOrdersError("");
    setPaymentsError("");

    const results = await Promise.allSettled([
      fetchList("/api/admin/orders", t.error),
      fetchList("/api/admin/payments", t.paymentsError),
    ]);

    const [ordersResult, paymentsResult] = results;

    if (ordersResult.status === "fulfilled") {
      const parsed = ordersResult.value.map(parseOrder);

      if (parsed.some((order) => order === null)) {
        setOrdersError("Unexpected order data received from the API.");
      } else {
        setOrders(
          (parsed as Order[]).sort(
            (a, b) =>
              (b.createdAt ?? "").localeCompare(a.createdAt ?? "") ||
              b.id - a.id
          )
        );
      }
    } else {
      setOrdersError(
        ordersResult.reason instanceof Error
          ? ordersResult.reason.message
          : t.error
      );
    }

    if (paymentsResult.status === "fulfilled") {
      const parsed = paymentsResult.value.map(parsePayment);

      if (parsed.some((payment) => payment === null)) {
        setPaymentsLoaded(false);
        setPaymentsError("Unexpected payment data received.");
      } else {
        setPayments(parsed as Payment[]);
        setPaymentsLoaded(true);
      }
    } else {
      setPaymentsLoaded(false);
      setPaymentsError(
        paymentsResult.reason instanceof Error
          ? paymentsResult.reason.message
          : t.paymentsError
      );
    }

    setLoading(false);
  }, [t.error, t.paymentsError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ======================================
  // Load full details from GET /orders/{id}
  // ======================================

  useEffect(() => {
    if (detailId === null) {
      setDetails(null);
      setDetailError("");
      return;
    }

    const controller = new AbortController();

    async function loadDetails() {
      setDetails(null);
      setDetailError("");
      setDetailLoading(true);

      try {
        const response = await fetch(
          `/api/admin/orders/${detailId}`,
          {
            cache: "no-store",
            credentials: "same-origin",
            signal: controller.signal,
          }
        );

        const data = await readResponse(response);

        if (controller.signal.aborted) return;

        if (!response.ok) {
          throw new Error(
            responseError(data, t.actionError)
          );
        }

        const parsed = parseOrder(data);

        if (!parsed || parsed.id !== detailId) {
          throw new Error("Unexpected order details response.");
        }

        setDetails(parsed);
      } catch (error) {
        if (controller.signal.aborted) return;

        setDetailError(
          error instanceof Error
            ? error.message
            : t.actionError
        );
      } finally {
        if (!controller.signal.aborted) {
          setDetailLoading(false);
        }
      }
    }

    void loadDetails();

    return () => controller.abort();
  }, [detailId, t.actionError]);

  useEffect(() => {
    if (detailId === null && cancelTarget === null) return;

    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || actionBusy) return;

      if (cancelTarget) {
        setCancelTarget(null);
      } else {
        setDetailId(null);
      }
    }

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [detailId, cancelTarget, actionBusy]);

  // ======================================
  // Statistics
  // ======================================

  const stats = useMemo(() => {
    const paidOrders = orders.filter((o) => isPaid(o.status));

    const volumes = new Map<string, number>();

    for (const order of paidOrders) {
      volumes.set(
        order.currency,
        (volumes.get(order.currency) ?? 0) + order.totalAmount
      );
    }

    return {
      total: orders.length,
      paid: paidOrders.length,
      open: orders.filter(
        (o) => !isPaid(o.status) && !isCancelled(o.status) &&
          normalizeStatus(o.status) !== "refunded"
      ).length,
      cancelled: orders.filter((o) => isCancelled(o.status)).length,
      volumes: [...volumes.entries()].map(
        ([currency, total]) => money(total, currency, locale)
      ),
    };
  }, [orders, locale]);

  // ======================================
  // Filtering and pagination
  // ======================================

  const availableStatuses = useMemo(
    () => [...new Set(orders.map((order) => order.status))].sort(),
    [orders]
  );

  const availableCurrencies = useMemo(
    () => [...new Set(orders.map((order) => order.currency))].sort(),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      const searchText = [
        order.id,
        order.orderNumber,
        order.userId,
        order.userName,
        order.userEmail,
        order.couponCode,
        ...order.items.map((item) => item.courseTitle),
      ]
        .filter((part) => part !== null && part !== undefined)
        .join(" ")
        .toLowerCase();

      const statusMatches =
        statusFilter === "all" ||
        normalizeStatus(order.status) ===
          normalizeStatus(statusFilter);

      const currencyMatches =
        currencyFilter === "all" ||
        order.currency === currencyFilter;

      const day = order.createdAt?.slice(0, 10) ?? "";

      const dateMatches =
        (!fromDate || (day !== "" && day >= fromDate)) &&
        (!toDate || (day !== "" && day <= toDate));

      return (
        (!term || searchText.includes(term)) &&
        statusMatches &&
        currencyMatches &&
        dateMatches
      );
    });
  }, [
    orders,
    search,
    statusFilter,
    currencyFilter,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, currencyFilter, fromDate, toDate]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / PAGE_SIZE)
  );
  const currentPage = Math.min(page, totalPages);

  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const detailPayments = useMemo(
    () =>
      details
        ? payments
            .filter((payment) => payment.orderId === details.id)
            .sort((a, b) => b.id - a.id)
        : [],
    [details, payments]
  );

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setCurrencyFilter("all");
    setFromDate("");
    setToDate("");
  }

  function openDetails(id: number) {
    setNotice("");
    setDetailId(id);
  }

  function openCancel(order: Order) {
    if (!canCancelOrder(order)) return;

    setCancelTarget(order);
    setActionError("");
  }

  // ======================================
  // Cancel eligible unpaid order
  // ======================================

  async function confirmCancellation() {
    if (!cancelTarget || actionBusy) return;
    if (!canCancelOrder(cancelTarget)) return;

    const target = cancelTarget;

    setActionBusy(true);
    setActionError("");

    try {
      const response = await fetch(
        `/api/admin/orders/${target.id}/cancel`,
        {
          method: "PATCH",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(responseError(data, t.actionError));
      }

      setCancelTarget(null);
      setDetailId(null);
      setNotice(t.cancelSuccess);
      await loadData();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : t.actionError
      );
    } finally {
      setActionBusy(false);
    }
  }

  const summaryCards = [
    { number: "01", title: t.total, value: stats.total },
    { number: "02", title: t.paid, value: stats.paid },
    { number: "03", title: t.open, value: stats.open },
    { number: "04", title: t.cancelled, value: stats.cancelled },
  ];

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>{t.eyebrow}</span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          disabled={loading || actionBusy}
          onClick={() => void loadData()}
        >
          <span aria-hidden="true">↻</span>
          {t.refresh}
        </button>
      </header>

      {/* Real statistics from the orders endpoint */}
      <section className={styles.stats} aria-label={t.title}>
        {summaryCards.map((card) => (
          <div className={styles.statCard} key={card.number}>
            <div className={styles.statTop}>
              <span>{card.title}</span>
              <small>{card.number}</small>
            </div>
            <strong>{loading || ordersError ? "—" : card.value}</strong>
          </div>
        ))}
      </section>

      <div className={styles.revenueStrip}>
        <div>
          <span className={styles.revenueLabel}>{t.revenue}</span>
          <strong>
            {loading || ordersError
              ? "—"
              : stats.volumes.length > 0
                ? stats.volumes.join("  ·  ")
                : "—"}
          </strong>
        </div>
        <p>{t.revenueHint}</p>
      </div>

      <section className={styles.workspace}>
        <div className={styles.workspaceHeader}>
          <div>
            <h3>{t.directory}</h3>
            <p>{t.directoryHint}</p>
          </div>
          <span className={styles.recordCount}>
            {loading || ordersError ? "—" : orders.length}
          </span>
        </div>

        {notice && (
          <div className={styles.successMessage} role="status">
            {notice}
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label={t.close}
            >
              ×
            </button>
          </div>
        )}

        {ordersError && (
          <div className={styles.errorMessage} role="alert">
            <span>{ordersError}</span>
            <button type="button" onClick={() => void loadData()}>
              {t.retry}
            </button>
          </div>
        )}

        {paymentsError && !loading && (
          <div className={styles.warningMessage} role="status">
            {t.paymentsError}
          </div>
        )}

        {/* Search and filters */}
        <div className={styles.filterBar}>
          <div className={styles.searchField}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.search}
              aria-label={t.search}
            />
          </div>

          <select
            aria-label={t.status}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">{t.allStatuses}</option>
            {availableStatuses.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            aria-label={t.allCurrencies}
            value={currencyFilter}
            onChange={(event) => setCurrencyFilter(event.target.value)}
          >
            <option value="all">{t.allCurrencies}</option>
            {availableCurrencies.map((currency) => (
              <option value={currency} key={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.dateFilters}>
          <label>
            <span>{t.from}</span>
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>
          <label>
            <span>{t.to}</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>

          {(search ||
            statusFilter !== "all" ||
            currencyFilter !== "all" ||
            fromDate ||
            toDate) && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={clearFilters}
            >
              {t.clear}
            </button>
          )}
        </div>

        {/* Orders table */}
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t.order}</th>
                <th>{t.customer}</th>
                <th>{t.courses}</th>
                <th>{t.amount}</th>
                <th>{t.placed}</th>
                <th>{t.status}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    {t.loading}
                  </td>
                </tr>
              ) : ordersError && orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    {t.error}
                  </td>
                </tr>
              ) : visibleOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    <strong>
                      {orders.length === 0
                        ? t.empty
                        : t.emptyFiltered}
                    </strong>
                    <p>{t.emptyHint}</p>
                  </td>
                </tr>
              ) : (
                visibleOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className={styles.orderCell}>
                        <strong>{order.orderNumber}</strong>
                        <small>#{order.id}</small>
                      </div>
                    </td>

                    <td>
                      <div className={styles.customerCell}>
                        <span className={styles.avatar}>
                          {order.userName.charAt(0).toUpperCase() || "U"}
                        </span>
                        <div>
                          <strong>{order.userName}</strong>
                          <small>{order.userEmail}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className={styles.courseCell}>
                        <strong>
                          {order.items[0]?.courseTitle || "—"}
                        </strong>
                        {order.items.length > 1 && (
                          <small>
                            +{order.items.length - 1}{" "}
                            {t.courses.toLowerCase()}
                          </small>
                        )}
                      </div>
                    </td>

                    <td>
                      <strong className={styles.amountText}>
                        {money(order.totalAmount, order.currency, locale)}
                      </strong>
                    </td>

                    <td className={styles.dateText}>
                      {dateLabel(order.createdAt, locale)}
                    </td>

                    <td>
                      <StatusPill status={order.status} />
                    </td>

                    <td>
                      <div className={styles.tableActions}>
                        <button
                          type="button"
                          className={styles.viewButton}
                          onClick={() => openDetails(order.id)}
                        >
                          {t.details}
                        </button>

                        {canCancelOrder(order) && (
                          <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={() => openCancel(order)}
                          >
                            {t.cancelOrder}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <span>
            {t.showing} {ordersError ? "—" : filteredOrders.length}{" "}
            {t.of} {ordersError ? "—" : orders.length}
          </span>

          <div className={styles.pagination}>
            <button
              type="button"
              disabled={currentPage === 1 || loading}
              onClick={() => setPage(currentPage - 1)}
            >
              {t.previous}
            </button>

            <span>
              {t.page} {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setPage(currentPage + 1)}
            >
              {t.next}
            </button>
          </div>
        </div>
      </section>

      {/* Order details side panel */}
      {detailId !== null && (
        <div className={styles.panelOverlay}>
          <button
            type="button"
            className={styles.backdrop}
            aria-label={t.close}
            onClick={() => setDetailId(null)}
          />

          <aside
            className={styles.detailPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-details-title"
          >
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  CRESTMARK / ORDER #{detailId}
                </span>
                <h2 id="order-details-title">{t.detailsTitle}</h2>
                <p>{t.detailsHint}</p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setDetailId(null)}
                aria-label={t.close}
              >
                ×
              </button>
            </div>

            <div className={styles.panelBody}>
              {detailLoading ? (
                <p className={styles.loadingDetails}>{t.loading}</p>
              ) : detailError ? (
                <div className={styles.errorMessage} role="alert">
                  <span>{detailError}</span>
                </div>
              ) : details ? (
                <>
                  <div className={styles.detailHeading}>
                    <span className={styles.detailLabel}>
                      {t.orderNumber}
                    </span>
                    <strong>{details.orderNumber}</strong>
                    <StatusPill status={details.status} />
                  </div>

                  <div className={styles.infoGrid}>
                    <div>
                      <span>{t.customer}</span>
                      <strong>{details.userName}</strong>
                    </div>
                    <div>
                      <span>{t.email}</span>
                      <strong>{details.userEmail}</strong>
                    </div>
                    <div>
                      <span>{t.userId}</span>
                      <strong>#{details.userId}</strong>
                    </div>
                    <div>
                      <span>{t.createdAt}</span>
                      <strong>
                        {dateLabel(details.createdAt, locale)}
                      </strong>
                    </div>
                    <div>
                      <span>{t.paidAt}</span>
                      <strong>
                        {dateLabel(details.paidAt, locale)}
                      </strong>
                    </div>
                    <div>
                      <span>{t.coupon}</span>
                      <strong>{details.couponCode || t.none}</strong>
                    </div>
                  </div>

                  <section className={styles.panelSection}>
                    <h3>
                      {t.orderItems}
                      <span>{details.items.length}</span>
                    </h3>

                    <div className={styles.itemsList}>
                      {details.items.map((item) => (
                        <div className={styles.itemRow} key={item.id}>
                          <div className={styles.itemTitle}>
                            <strong>{item.courseTitle}</strong>
                            <small>Course #{item.courseId}</small>
                          </div>

                          <div className={styles.itemPrices}>
                            <div>
                              <span>{t.unitPrice}</span>
                              <strong>
                                {money(
                                  item.unitPrice,
                                  details.currency,
                                  locale
                                )}
                              </strong>
                            </div>
                            <div>
                              <span>{t.itemDiscount}</span>
                              <strong>
                                −{money(
                                  item.discountAmount,
                                  details.currency,
                                  locale
                                )}
                              </strong>
                            </div>
                            <div>
                              <span>{t.itemTotal}</span>
                              <strong>
                                {money(
                                  item.finalPrice,
                                  details.currency,
                                  locale
                                )}
                              </strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.billSummary}>
                      <div>
                        <span>{t.subtotal}</span>
                        <strong>
                          {money(details.subtotal, details.currency, locale)}
                        </strong>
                      </div>
                      <div>
                        <span>{t.discount}</span>
                        <strong>
                          −{money(
                            details.discountAmount,
                            details.currency,
                            locale
                          )}
                        </strong>
                      </div>
                      <div className={styles.billTotal}>
                        <span>{t.total}</span>
                        <strong>
                          {money(
                            details.totalAmount,
                            details.currency,
                            locale
                          )}
                        </strong>
                      </div>
                    </div>
                  </section>

                  <section className={styles.panelSection}>
                    <h3>
                      {t.payments}
                      <span>
                        {paymentsLoaded ? detailPayments.length : "—"}
                      </span>
                    </h3>

                    {!paymentsLoaded ? (
                      <p className={styles.paymentNote}>
                        {t.paymentsError}
                      </p>
                    ) : detailPayments.length === 0 ? (
                      <p className={styles.paymentNote}>
                        {t.noPayments}
                      </p>
                    ) : (
                      <div className={styles.paymentList}>
                        {detailPayments.map((payment) => (
                          <div
                            className={styles.paymentCard}
                            key={payment.id}
                          >
                            <div className={styles.paymentHeader}>
                              <strong>
                                {t.paymentId} #{payment.id}
                              </strong>
                              <StatusPill status={payment.status} />
                            </div>

                            <dl className={styles.paymentFields}>
                              <div>
                                <dt>{t.paymentProvider}</dt>
                                <dd>{payment.paymentProvider}</dd>
                              </div>
                              <div>
                                <dt>{t.transaction}</dt>
                                <dd>
                                  {payment.transactionId || t.unavailable}
                                </dd>
                              </div>
                              <div>
                                <dt>{t.paymentAmount}</dt>
                                <dd>
                                  {money(
                                    payment.amount,
                                    payment.currency,
                                    locale
                                  )}
                                </dd>
                              </div>
                              <div>
                                <dt>{t.paymentCreated}</dt>
                                <dd>
                                  {dateLabel(
                                    payment.createdAt,
                                    locale
                                  )}
                                </dd>
                              </div>
                              {payment.paidAt && (
                                <div>
                                  <dt>{t.paidAt}</dt>
                                  <dd>
                                    {dateLabel(
                                      payment.paidAt,
                                      locale
                                    )}
                                  </dd>
                                </div>
                              )}
                              {payment.failedAt && (
                                <div>
                                  <dt>{t.failedAt}</dt>
                                  <dd>
                                    {dateLabel(
                                      payment.failedAt,
                                      locale
                                    )}
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <div className={styles.bottomActions}>
                    {canCancelOrder(details) ? (
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => openCancel(details)}
                      >
                        {t.cancelOrder}
                      </button>
                    ) : (
                      <p className={styles.paymentNote}>
                        {isPaid(details.status)
                          ? t.paidProtection
                          : t.cancelUnavailable}
                      </p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </aside>
        </div>
      )}

      {/* Explicit cancellation confirmation */}
      {cancelTarget && (
        <div className={styles.confirmOverlay}>
          <div
            className={styles.confirmDialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
            aria-describedby="cancel-description"
          >
            <span className={styles.warningIcon}>!</span>

            <h2 id="cancel-title">{t.confirmCancel}</h2>
            <strong className={styles.confirmOrderNumber}>
              {cancelTarget.orderNumber}
            </strong>

            <p id="cancel-description">{t.confirmWarning}</p>

            {actionError && (
              <div className={styles.errorMessage} role="alert">
                {actionError}
              </div>
            )}

            <div className={styles.confirmActions}>
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => setCancelTarget(null)}
              >
                {t.goBack}
              </button>

              <button
                type="button"
                className={styles.confirmCancelButton}
                disabled={actionBusy}
                onClick={() => void confirmCancellation()}
              >
                {actionBusy ? t.processing : t.confirmButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
