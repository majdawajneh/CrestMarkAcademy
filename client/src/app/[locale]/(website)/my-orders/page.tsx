
"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./MyOrders.module.css";

// ========================================
// Types
// ========================================

type Locale = "en" | "ar";

// Keep off until PayTabs configuration, merchant USD support,
// and the server-side payment feature flag are verified.
const PAYMENTS_ENABLED = false;

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
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  status: string;
  couponCode: string | null;
  createdAt: string;
  paidAt: string | null;
  items: OrderItem[];
};

type Payment = {
  id: number;
  orderId: number;
  paymentProvider: string;
  transactionId: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  failedAt: string | null;
};

type ViewState =
  | "loading"
  | "ready"
  | "guest"
  | "error";

type OrderFilter =
  | "all"
  | "pending"
  | "paid"
  | "cancelled";

type PaymentLoad = {
  state: "loading" | "ready" | "error";
  payments: Payment[];
};

// ========================================
// Translations
// ========================================

const translations = {
  en: {
    eyebrow: "YOUR ACCOUNT / PURCHASE HISTORY",
    title: "My orders",
    description:
      "Keep track of your course purchases, invoices and payment activity in one place.",

    back: "Back to My Learning",
    refresh: "Refresh",

    totalOrders: "Total orders",
    paidOrders: "Paid orders",
    pendingOrders: "Awaiting payment",

    history: "Order history",
    historyDescription:
      "A complete record of your course orders.",

    search: "Search orders or course names...",

    all: "All orders",
    pending: "Pending",
    paid: "Paid",
    cancelled: "Cancelled",
    failed: "Failed",
    refunded: "Refunded",

    created: "Placed",
    total: "Order total",
    order: "Order",

    details: "View details",
    hideDetails: "Hide details",

    courses: "Courses in this order",
    oneCourse: "course",
    manyCourses: "courses",

    subtotal: "Subtotal",
    discount: "Coupon discount",
    grandTotal: "Total",

    coupon: "Coupon applied",
    noCoupon: "No coupon applied",

    orderBreakdown: "Order summary",
    paymentActivity: "Payment activity",

    paymentLoading: "Loading payment activity...",
    paymentError: "Couldn't load payment activity.",
    noPayments: "No payment attempts recorded yet.",

    reference: "Transaction reference",

    learning: "Go to My Learning",

    pendingInfo:
      "This order is awaiting payment. Online checkout is temporarily unavailable while payment integration is being verified.",

    emptyTitle: "No orders yet",
    emptyText:
      "When you purchase a course, its order will appear here.",

    explore: "Explore courses",

    noResults: "No matching orders",
    noResultsText:
      "Try another search or change the selected filter.",

    clearFilters: "Clear filters",
    loading: "Loading your orders...",
    retry: "Try again",

    errorTitle: "We couldn't load your orders",
    errorText:
      "Please try again. Your existing orders are not affected.",

    guestTitle: "Sign in to view your orders",
    guestText:
      "Your order history is private and available only when you're signed in.",

    signIn: "Sign in",

    cancelOrder: "Cancel order",
    cancelTitle: "Cancel this pending order?",
    cancelDescription:
      "This order will be marked as cancelled. You can then create a new order and apply a different coupon. The existing order will remain in your purchase history.",

    keepOrder: "Keep order",
    confirmCancel: "Yes, cancel order",
    cancelling: "Cancelling...",

    cancelSuccess:
      "Your order was cancelled successfully. You can now create a new order.",

    cancelError:
      "We couldn't cancel this order. Please refresh and try again.",

    cancelBlocked:
      "This order has a recorded payment attempt. Automatic cancellation is unavailable. Please contact support if you need assistance.",

    failedPaymentTitle: "Previous payment attempt failed",
    failedPaymentInfo:
      "Your order is still pending. You can retry payment on the same order once secure payments are available.",
    retryPayment: "Retry payment",
    retryingPayment: "Opening secure payment...",
    retryDisabled:
      "Payment retries are temporarily disabled while PayTabs is being configured.",
    retryUnavailable:
      "Payment retry isn't available for this order. Refresh the payment activity or contact support.",
    pendingAttempt:
      "A payment attempt is still pending or needs verification. Please wait for confirmation before trying again.",
    retryError:
      "Couldn't confirm the payment retry. Check the latest payment status before another attempt.",
  },

  ar: {
    eyebrow: "حسابك / سجل المشتريات",
    title: "طلباتي",
    description:
      "تابع مشتريات دوراتك وتفاصيل الطلبات وحالات الدفع من مكان واحد.",

    back: "العودة إلى دوراتي",
    refresh: "تحديث",

    totalOrders: "إجمالي الطلبات",
    paidOrders: "الطلبات المدفوعة",
    pendingOrders: "بانتظار الدفع",

    history: "سجل الطلبات",
    historyDescription:
      "جميع طلبات دوراتك في مكان واحد.",

    search: "ابحث برقم الطلب أو اسم الدورة...",

    all: "جميع الطلبات",
    pending: "قيد الانتظار",
    paid: "مدفوع",
    cancelled: "ملغي",
    failed: "فشل",
    refunded: "مسترد",

    created: "تاريخ الطلب",
    total: "إجمالي الطلب",
    order: "طلب",

    details: "عرض التفاصيل",
    hideDetails: "إخفاء التفاصيل",

    courses: "الدورات الموجودة في الطلب",
    oneCourse: "دورة",
    manyCourses: "دورات",

    subtotal: "المجموع الفرعي",
    discount: "خصم الكوبون",
    grandTotal: "الإجمالي",

    coupon: "الكوبون المستخدم",
    noCoupon: "لم يُستخدم كوبون",

    orderBreakdown: "ملخص الطلب",
    paymentActivity: "سجل المدفوعات",

    paymentLoading: "جاري تحميل سجل المدفوعات...",
    paymentError: "تعذر تحميل سجل المدفوعات.",
    noPayments: "لا توجد محاولات دفع مسجلة حتى الآن.",

    reference: "الرقم المرجعي للمعاملة",

    learning: "الانتقال إلى دوراتي",

    pendingInfo:
      "هذا الطلب بانتظار الدفع. الدفع الإلكتروني متوقف مؤقتًا لحين اكتمال التحقق من بوابة الدفع.",

    emptyTitle: "ما عندك طلبات بعد",
    emptyText:
      "أول ما تشتري دورة، رح تظهر تفاصيل طلبك هون.",

    explore: "استكشف الدورات",

    noResults: "ما لقينا طلبات مطابقة",
    noResultsText:
      "جرّب كلمة بحث ثانية أو غيّر فلتر الطلبات.",

    clearFilters: "إزالة الفلاتر",
    loading: "جاري تحميل طلباتك...",
    retry: "إعادة المحاولة",

    errorTitle: "تعذر تحميل طلباتك",
    errorText:
      "حاول مرة ثانية. طلباتك الموجودة لم تتأثر.",

    guestTitle: "سجّل دخولك لعرض طلباتك",
    guestText:
      "سجل طلباتك خاص فيك، وبيظهر بعد تسجيل الدخول.",

    signIn: "تسجيل الدخول",

    cancelOrder: "إلغاء الطلب",
    cancelTitle: "هل تريد إلغاء هذا الطلب؟",
    cancelDescription:
      "سيتم تحويل حالة الطلب إلى ملغي. بعدها يمكنك إنشاء طلب جديد واستخدام كوبون مختلف. سيبقى الطلب القديم محفوظًا في سجل مشترياتك.",

    keepOrder: "الاحتفاظ بالطلب",
    confirmCancel: "نعم، إلغاء الطلب",
    cancelling: "جاري الإلغاء...",

    cancelSuccess:
      "تم إلغاء الطلب بنجاح. يمكنك الآن إنشاء طلب جديد.",

    cancelError:
      "تعذر إلغاء الطلب. يرجى تحديث الصفحة والمحاولة مرة أخرى.",

    cancelBlocked:
      "توجد محاولة دفع مسجلة لهذا الطلب، لذلك لا يمكن إلغاؤه تلقائيًا. يرجى التواصل مع الدعم للمساعدة.",

    failedPaymentTitle: "فشلت محاولة دفع سابقة",
    failedPaymentInfo:
      "طلبك ما زال معلّقًا. يمكنك إعادة الدفع على نفس الطلب بعد تفعيل الدفع الآمن.",
    retryPayment: "إعادة محاولة الدفع",
    retryingPayment: "جارٍ فتح بوابة الدفع...",
    retryDisabled:
      "إعادة المحاولة متوقفة مؤقتًا لحين تجهيز بوابة PayTabs.",
    retryUnavailable:
      "لا يمكن إعادة الدفع لهذا الطلب حاليًا. حدّث سجل المدفوعات أو تواصل مع الدعم.",
    pendingAttempt:
      "هناك محاولة دفع معلّقة أو تحتاج للتحقق. انتظر تأكيد نتيجتها قبل المحاولة مجددًا.",
    retryError:
      "تعذّر التأكد من نتيجة محاولة الدفع. تحقّق من أحدث حالة للدفع قبل بدء أي محاولة أخرى.",
  },
} as const;

// ========================================
// Formatting Helpers
// ========================================

function formatMoney(
  amount: number,
  currency: string,
  locale: Locale
) {
  if (!Number.isFinite(amount)) {
    return "—";
  }

  if (!currency) {
    return amount.toFixed(2);
  }

  try {
    return new Intl.NumberFormat(
      locale === "ar" ? "ar-JO" : "en-US",
      {
        style: "currency",
        currency: currency.toUpperCase(),
        currencyDisplay: "symbol",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(
  value: string | null,
  locale: Locale
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "paid") {
    return styles.statusPaid;
  }

  if (normalized === "pending") {
    return styles.statusPending;
  }

  return styles.statusNeutral;
}

function translatedStatus(
  status: string,
  locale: Locale
) {
  const labels: Record<
    string,
    { en: string; ar: string }
  > = {
    paid: {
      en: "Paid",
      ar: "مدفوع",
    },
    pending: {
      en: "Pending",
      ar: "قيد الانتظار",
    },
    cancelled: {
      en: "Cancelled",
      ar: "ملغي",
    },
    failed: {
      en: "Failed",
      ar: "فشل",
    },
    refunded: {
      en: "Refunded",
      ar: "مسترد",
    },
    completed: {
      en: "Completed",
      ar: "مكتمل",
    },
  };

  return (
    labels[status.toLowerCase()]?.[locale] ??
    status
  );
}

// ========================================
// My Orders Content
// ========================================

function MyOrdersContent() {
  const params = useParams<{ locale: string }>();

  const locale: Locale =
    params.locale === "ar" ? "ar" : "en";

  const t = translations[locale];

  // ========================================
  // State
  // ========================================

  const [view, setView] =
    useState<ViewState>("loading");

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [filter, setFilter] =
    useState<OrderFilter>("all");

  const [search, setSearch] =
    useState("");

  const [expandedId, setExpandedId] =
    useState<number | null>(null);

  const [paymentsByOrder, setPaymentsByOrder] =
    useState<Record<number, PaymentLoad>>({});

  const [reloadIndex, setReloadIndex] =
    useState(0);

  // Cancellation state

  const [confirmCancelId, setConfirmCancelId] =
    useState<number | null>(null);

  const [cancellingId, setCancellingId] =
    useState<number | null>(null);

  const [cancelError, setCancelError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [retryingId, setRetryingId] =
    useState<number | null>(null);

  const [retryErrors, setRetryErrors] =
    useState<Record<number, string>>({});

  // Synchronous protection against double-clicks.
  const retryInFlight = useRef(false);

  // ========================================
  // Load Orders
  // ========================================

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      setView("loading");

      try {
        const requestOrders = () =>
          fetch("/api/orders/my", {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          });

        let response = await requestOrders();

        if (response.status === 401) {
          const session =
            await getCurrentSession();

          if (controller.signal.aborted) return;

          if (session.status === "guest") {
            setView("guest");
            return;
          }

          if (
            session.status !== "authenticated"
          ) {
            throw new Error(
              "Session unavailable"
            );
          }

          response = await requestOrders();
        }

        if (controller.signal.aborted) return;

        if (response.status === 401) {
          setView("guest");
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Orders request failed"
          );
        }

        const data: unknown =
          await response.json();

        if (
          !Array.isArray(data) ||
          !data.every(
            (entry) =>
              entry !== null &&
              typeof entry === "object" &&
              typeof entry.id === "number" &&
              typeof entry.orderNumber === "string" &&
              typeof entry.status === "string" &&
              Array.isArray(entry.items)
          )
        ) {
          throw new Error(
            "Invalid orders response"
          );
        }

        if (controller.signal.aborted) return;

        setOrders(data as Order[]);
        setPaymentsByOrder({});
        setExpandedId(null);

        setConfirmCancelId(null);
        setCancelError("");

        setView("ready");
      } catch {
        if (!controller.signal.aborted) {
          setView("error");
        }
      }
    }

    void loadOrders();

    return () => controller.abort();
  }, [reloadIndex]);

  // ========================================
  // Load Order Payments
  // ========================================

  async function fetchPayments(orderId: number): Promise<Payment[]> {
    const requestPayments = () =>
      fetch(`/api/payments/orders/${orderId}`, {
        credentials: "same-origin",
        cache: "no-store",
      });

    let response = await requestPayments();

    if (response.status === 401) {
      const session = await getCurrentSession();

      if (session.status === "guest") {
        setView("guest");
        throw new Error("Authentication required");
      }

      if (session.status !== "authenticated") {
        throw new Error("Session unavailable");
      }

      response = await requestPayments();
    }

    if (!response.ok) {
      throw new Error("Payments request failed");
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data) || !data.every((entry) =>
      entry !== null &&
      typeof entry === "object" &&
      typeof entry.id === "number" &&
      typeof entry.orderId === "number" &&
      typeof entry.paymentProvider === "string" &&
      typeof entry.status === "string" &&
      typeof entry.amount === "number" &&
      typeof entry.currency === "string"
    )) {
      throw new Error("Invalid payments response");
    }

    return data as Payment[];
  }

  async function loadPayments(orderId: number) {
    setPaymentsByOrder((previous) => ({
      ...previous,
      [orderId]: {
        state: "loading",
        payments: [],
      },
    }));

    try {
      const payments = await fetchPayments(orderId);

      setPaymentsByOrder((previous) => ({
        ...previous,
        [orderId]: {
          state: "ready",
          payments,
        },
      }));
    } catch {
      setPaymentsByOrder((previous) => ({
        ...previous,
        [orderId]: {
          state: "error",
          payments: [],
        },
      }));
    }
  }

  // ========================================
  // Toggle Order Details
  // ========================================

  function toggleDetails(orderId: number) {
    if (expandedId === orderId) {
      setExpandedId(null);
      setConfirmCancelId(null);
      setCancelError("");
      return;
    }

    setExpandedId(orderId);
    setConfirmCancelId(null);
    setCancelError("");

    if (!paymentsByOrder[orderId]) {
      void loadPayments(orderId);
    }
  }

  // ========================================
  // Cancel Pending Order
  // ========================================

  async function cancelOrder(orderId: number) {
    if (cancellingId !== null) {
      return;
    }

    const currentOrder = orders.find(
      (order) => order.id === orderId
    );

    const paymentLoad = paymentsByOrder[orderId];

    if (
      !currentOrder ||
      currentOrder.status.toLowerCase() !== "pending" ||
      paymentLoad?.state !== "ready" ||
      paymentLoad.payments.length !== 0
    ) {
      return;
    }

    setCancellingId(orderId);
    setCancelError("");
    setSuccessMessage("");

    try {
      const requestCancellation = () =>
        fetch(`/api/orders/${orderId}/cancel`, {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });

      let response = await requestCancellation();

      if (response.status === 401) {
        const session =
          await getCurrentSession();

        if (session.status === "guest") {
          setView("guest");
          return;
        }

        if (
          session.status !== "authenticated"
        ) {
          throw new Error(
            "Session unavailable"
          );
        }

        response = await requestCancellation();
      }

      if (!response.ok) {
        throw new Error(
          "Cancellation failed"
        );
      }

      const data: unknown =
        await response.json();

      if (
        !data ||
        typeof data !== "object" ||
        !("id" in data) ||
        !("status" in data) ||
        data.id !== orderId ||
        data.status !== "Cancelled"
      ) {
        throw new Error(
          "Invalid cancellation response"
        );
      }

      // Update the cancelled order locally.
      // No need to reload the entire page.

      setOrders((previous) =>
        previous.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: "Cancelled",
              }
            : order
        )
      );

      setConfirmCancelId(null);
      setCancelError("");
      setSuccessMessage(t.cancelSuccess);
    } catch {
      setCancelError(t.cancelError);
    } finally {
      setCancellingId(null);
    }
  }

  // ========================================
  // Safe payment retry eligibility
  // ========================================

  function eligibleForRetry(order: Order, payments: Payment[]) {
    if (
      order.status.toLowerCase() !== "pending" ||
      order.currency.toUpperCase() !== "USD" ||
      order.totalAmount <= 0 ||
      payments.length === 0 ||
      payments.some((payment) =>
        payment.orderId !== order.id ||
        payment.status.toLowerCase() !== "failed" ||
        payment.amount !== order.totalAmount ||
        payment.currency.toUpperCase() !== "USD"
      )
    ) {
      return false;
    }

    // Only PayTabs payment failures are handled by this retry flow.
    // This also blocks unknown, pending and paid attempts.
    return payments.every((payment) =>
      payment.paymentProvider.toLowerCase() === "paytabs"
    );
  }

  async function retryPayment(orderId: number) {
    if (!PAYMENTS_ENABLED || retryInFlight.current) {
      return;
    }

    const order = orders.find((entry) => entry.id === orderId);
    const paymentLoad = paymentsByOrder[orderId];

    if (
      !order ||
      paymentLoad?.state !== "ready" ||
      !eligibleForRetry(order, paymentLoad.payments)
    ) {
      return;
    }

    retryInFlight.current = true;
    setRetryingId(orderId);
    setRetryErrors((previous) => ({ ...previous, [orderId]: "" }));

    try {
      // Re-check gateway attempts: the UI may have stale data.
      const latestPayments = await fetchPayments(orderId);

      setPaymentsByOrder((previous) => ({
        ...previous,
        [orderId]: { state: "ready", payments: latestPayments },
      }));

      if (!eligibleForRetry(order, latestPayments)) {
        throw new Error(t.retryUnavailable);
      }

      const requestRetry = () => fetch("/api/checkout/paytabs", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      let response = await requestRetry();

      if (response.status === 401) {
        const session = await getCurrentSession();
        if (session.status !== "authenticated") {
          if (session.status === "guest") setView("guest");
          throw new Error(t.retryError);
        }
        response = await requestRetry();
      }

      if (!response.ok) throw new Error(t.retryError);

      const data: unknown = await response.json();
      if (
        !data ||
        typeof data !== "object" ||
        !("redirectUrl" in data) ||
        typeof data.redirectUrl !== "string"
      ) {
        throw new Error(t.retryError);
      }

      const redirect = new URL(data.redirectUrl);
      if (
        redirect.protocol !== "https:" ||
        redirect.hostname.toLowerCase() !== "secure-jordan.paytabs.com" ||
        redirect.username ||
        redirect.password
      ) {
        throw new Error(t.retryError);
      }

      window.location.assign(redirect.href);
    } catch (error) {
      setRetryErrors((previous) => ({
        ...previous,
        [orderId]: error instanceof Error && error.message === t.retryUnavailable
          ? t.retryUnavailable
          : t.retryError,
      }));
      // Avoid a second attempt without checking payment status again.
      await loadPayments(orderId);
    } finally {
      retryInFlight.current = false;
      setRetryingId(null);
    }
  }

  // ========================================
  // Filter And Search
  // ========================================

  const visibleOrders = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return orders
      .filter((order) => {
        if (
          filter !== "all" &&
          order.status.toLowerCase() !== filter
        ) {
          return false;
        }

        if (!query) return true;

        return (
          order.orderNumber
            .toLowerCase()
            .includes(query) ||
          (order.items ?? []).some((item) =>
            item.courseTitle
              .toLowerCase()
              .includes(query)
          )
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
  }, [orders, filter, search]);

  const paidCount = orders.filter(
    (order) =>
      order.status.toLowerCase() === "paid"
  ).length;

  const pendingCount = orders.filter(
    (order) =>
      order.status.toLowerCase() === "pending"
  ).length;

  const filters: {
    value: OrderFilter;
    label: string;
  }[] = [
    {
      value: "all",
      label: t.all,
    },
    {
      value: "pending",
      label: t.pending,
    },
    {
      value: "paid",
      label: t.paid,
    },
    {
      value: "cancelled",
      label: t.cancelled,
    },
  ];

  // ========================================
  // Render
  // ========================================

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.container}>

        {/* =================================
            Header
        ================================= */}

        <header className={styles.hero}>
          <Link
            href={`/${locale}/my-learning`}
            className={styles.backLink}
          >
            <span aria-hidden="true">
              {locale === "ar" ? "→" : "←"}
            </span>

            {t.back}
          </Link>

          <div className={styles.heroContent}>
            <div>
              <p className={styles.eyebrow}>
                {t.eyebrow}
              </p>

              <h1>{t.title}</h1>

              <p className={styles.description}>
                {t.description}
              </p>
            </div>

            <div
              className={styles.heroDecoration}
              aria-hidden="true"
            >
              <span className={styles.receiptIcon}>
                ▤
              </span>
            </div>
          </div>
        </header>

        {/* =================================
            Loading / Authentication
        ================================= */}

        {view === "loading" ? (
          <div
            className={styles.statePanel}
            role="status"
          >
            <span className={styles.spinner} />
            <p>{t.loading}</p>
          </div>
        ) : view === "guest" ||
          view === "error" ? (
          <div className={styles.statePanel}>
            <div className={styles.stateSymbol}>
              {view === "guest" ? "↗" : "!"}
            </div>

            <h2>
              {view === "guest"
                ? t.guestTitle
                : t.errorTitle}
            </h2>

            <p>
              {view === "guest"
                ? t.guestText
                : t.errorText}
            </p>

            {view === "guest" ? (
              <Link
                href={`/${locale}/login`}
                className={styles.primaryLink}
              >
                {t.signIn}
              </Link>
            ) : (
              <button
                type="button"
                className={styles.primaryLink}
                onClick={() =>
                  setReloadIndex((n) => n + 1)
                }
              >
                {t.retry}
              </button>
            )}
          </div>
        ) : orders.length === 0 ? (
          <div className={styles.statePanel}>
            <div className={styles.stateSymbol}>
              ▤
            </div>

            <h2>{t.emptyTitle}</h2>
            <p>{t.emptyText}</p>

            <Link
              href={`/${locale}/courses`}
              className={styles.primaryLink}
            >
              {t.explore}
            </Link>
          </div>
        ) : (
          <>

            {/* =================================
                Overview
            ================================= */}

            <section className={styles.overview}>
              <div className={styles.metric}>
                <span>{t.totalOrders}</span>
                <strong>{orders.length}</strong>
              </div>

              <div className={styles.metric}>
                <span>{t.paidOrders}</span>
                <strong>{paidCount}</strong>
              </div>

              <div className={styles.metric}>
                <span>{t.pendingOrders}</span>
                <strong>{pendingCount}</strong>
              </div>
            </section>

            {/* =================================
                Order History
            ================================= */}

            <section className={styles.history}>
              <div className={styles.sectionHeading}>
                <div>
                  <h2>{t.history}</h2>
                  <p>{t.historyDescription}</p>
                </div>

                <button
                  type="button"
                  className={styles.refreshButton}
                  onClick={() => {
                    setSuccessMessage("");
                    setReloadIndex((n) => n + 1);
                  }}
                >
                  <span aria-hidden="true">↻</span>
                  {t.refresh}
                </button>
              </div>

              {/* Cancellation Feedback */}

              {successMessage && (
                <div
                  className={styles.successNotice}
                  role="status"
                >
                  {successMessage}
                </div>
              )}

              {/* =================================
                  Filters And Search
              ================================= */}

              <div className={styles.toolbar}>
                <div className={styles.filters}>
                  {filters.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={
                        filter === option.value
                          ? `${styles.filterButton} ${styles.filterActive}`
                          : styles.filterButton
                      }
                      aria-pressed={
                        filter === option.value
                      }
                      onClick={() =>
                        setFilter(option.value)
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className={styles.searchWrap}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                    />
                    <path d="m16 16 5 5" />
                  </svg>

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder={t.search}
                    aria-label={t.search}
                  />
                </div>
              </div>

              {/* =================================
                  No Search Results
              ================================= */}

              {visibleOrders.length === 0 ? (
                <div className={styles.noResults}>
                  <h3>{t.noResults}</h3>
                  <p>{t.noResultsText}</p>

                  <button
                    type="button"
                    onClick={() => {
                      setFilter("all");
                      setSearch("");
                    }}
                  >
                    {t.clearFilters}
                  </button>
                </div>
              ) : (

                /* =================================
                   Orders
                ================================= */

                <div className={styles.orderList}>
                  {visibleOrders.map((order) => {
                    const expanded =
                      expandedId === order.id;

                    const paymentLoad =
                      paymentsByOrder[order.id];

                    const isPending =
                      order.status.toLowerCase() ===
                      "pending";

                    const isPaid =
                      order.status.toLowerCase() ===
                      "paid";

                    // Show cancellation only after
                    // successfully loading payments
                    // and confirming there are none.
                    const canOfferCancel =
                      isPending &&
                      paymentLoad?.state === "ready" &&
                      paymentLoad.payments.length === 0;

                    const hasPaymentAttempts =
                      paymentLoad?.state === "ready" &&
                      paymentLoad.payments.length > 0;

                    const hasFailedPayment =
                      hasPaymentAttempts &&
                      paymentLoad.payments.some((payment) =>
                        payment.status.toLowerCase() === "failed"
                      );

                    const hasUnresolvedPayment =
                      hasPaymentAttempts &&
                      paymentLoad.payments.some((payment) =>
                        payment.status.toLowerCase() !== "failed"
                      );

                    const canOfferRetry =
                      isPending &&
                      paymentLoad?.state === "ready" &&
                      eligibleForRetry(order, paymentLoad.payments);

                    const confirming =
                      confirmCancelId === order.id;

                    const cancelling =
                      cancellingId === order.id;

                    return (
                      <article
                        key={order.id}
                        className={styles.order}
                      >

                        {/* =========================
                            Order Header
                        ========================= */}

                        <div className={styles.orderMain}>
                          <div className={styles.orderIdentity}>
                            <span className={styles.orderLabel}>
                              {t.order} #{order.id}
                            </span>

                            <h3
                              className={styles.orderNumber}
                              dir="ltr"
                            >
                              {order.orderNumber}
                            </h3>

                            <span className={styles.orderDate}>
                              {t.created}:{" "}
                              {formatDate(
                                order.createdAt,
                                locale
                              )}
                            </span>
                          </div>

                          <div className={styles.orderMeta}>
                            <span
                              className={`${styles.status} ${statusClass(
                                order.status
                              )}`}
                            >
                              <span
                                className={styles.statusDot}
                                aria-hidden="true"
                              />

                              {translatedStatus(
                                order.status,
                                locale
                              )}
                            </span>

                            <span className={styles.courseCount}>
                              {order.items.length}{" "}
                              {order.items.length === 1
                                ? t.oneCourse
                                : t.manyCourses}
                            </span>
                          </div>

                          <div className={styles.orderAmount}>
                            <span>{t.total}</span>

                            <strong dir="ltr">
                              {formatMoney(
                                order.totalAmount,
                                order.currency,
                                locale
                              )}
                            </strong>
                          </div>

                          <button
                            type="button"
                            className={styles.detailsButton}
                            aria-expanded={expanded}
                            aria-controls={
                              expanded
                                ? `details-${order.id}`
                                : undefined
                            }
                            onClick={() =>
                              toggleDetails(order.id)
                            }
                          >
                            {expanded
                              ? t.hideDetails
                              : t.details}

                            <span
                              className={`${styles.chevron} ${
                                expanded
                                  ? styles.chevronOpen
                                  : ""
                              }`}
                              aria-hidden="true"
                            >
                              ⌄
                            </span>
                          </button>
                        </div>

                        {/* =========================
                            Expanded Details
                        ========================= */}

                        {expanded && (
                          <div
                            id={`details-${order.id}`}
                            className={styles.detailsPanel}
                          >
                            <div className={styles.detailsGrid}>

                              {/* =================
                                  Course Details
                              ================= */}

                              <div className={styles.courseSection}>
                                <h4>{t.courses}</h4>

                                <div className={styles.courseItems}>
                                  {order.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className={styles.courseItem}
                                    >
                                      <span
                                        className={styles.courseIcon}
                                        aria-hidden="true"
                                      >
                                        ▤
                                      </span>

                                      <div className={styles.courseItemInfo}>
                                        <strong>
                                          {item.courseTitle}
                                        </strong>

                                        <small>
                                          {formatMoney(
                                            item.finalPrice,
                                            order.currency,
                                            locale
                                          )}
                                        </small>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {isPaid && (
                                  <Link
                                    href={`/${locale}/my-learning`}
                                    className={styles.learningLink}
                                  >
                                    {t.learning}
                                    <span aria-hidden="true">
                                      {locale === "ar"
                                        ? "←"
                                        : "→"}
                                    </span>
                                  </Link>
                                )}

                                {isPending && (
                                  <p className={styles.pendingNotice}>
                                    {t.pendingInfo}
                                  </p>
                                )}

                                {/* =================
                                    Cancel Order
                                ================= */}

                                {canOfferCancel && (
                                  <div className={styles.cancelArea}>
                                    {!confirming ? (
                                      <button
                                        type="button"
                                        className={styles.cancelTrigger}
                                        disabled={
                                          cancellingId !== null
                                        }
                                        onClick={() => {
                                          setConfirmCancelId(
                                            order.id
                                          );
                                          setCancelError("");
                                          setSuccessMessage("");
                                        }}
                                      >
                                        {t.cancelOrder}
                                      </button>
                                    ) : (
                                      <div className={styles.cancelConfirm}>
                                        <h5>{t.cancelTitle}</h5>

                                        <p>
                                          {t.cancelDescription}
                                        </p>

                                        <div className={styles.cancelButtons}>
                                          <button
                                            type="button"
                                            className={styles.keepButton}
                                            disabled={cancelling}
                                            onClick={() => {
                                              setConfirmCancelId(null);
                                              setCancelError("");
                                            }}
                                          >
                                            {t.keepOrder}
                                          </button>

                                          <button
                                            type="button"
                                            className={styles.dangerButton}
                                            disabled={cancelling}
                                            onClick={() =>
                                              void cancelOrder(
                                                order.id
                                              )
                                            }
                                          >
                                            {cancelling
                                              ? t.cancelling
                                              : t.confirmCancel}
                                          </button>
                                        </div>

                                        {cancelError && (
                                          <p
                                            className={styles.cancelError}
                                            role="alert"
                                          >
                                            {cancelError}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {isPending &&
                                  hasPaymentAttempts && (
                                    <p className={styles.pendingNotice}>
                                      {t.cancelBlocked}
                                    </p>
                                  )}
                              </div>

                              {/* =================
                                  Order Summary
                              ================= */}

                              <aside className={styles.summary}>
                                <h4>{t.orderBreakdown}</h4>

                                <div className={styles.summaryLine}>
                                  <span>{t.subtotal}</span>

                                  <span dir="ltr">
                                    {formatMoney(
                                      order.subtotal,
                                      order.currency,
                                      locale
                                    )}
                                  </span>
                                </div>

                                <div className={styles.summaryLine}>
                                  <span>{t.discount}</span>

                                  <span dir="ltr">
                                    {formatMoney(
                                      order.discountAmount,
                                      order.currency,
                                      locale
                                    )}
                                  </span>
                                </div>

                                <div className={styles.summaryTotal}>
                                  <strong>{t.grandTotal}</strong>

                                  <strong dir="ltr">
                                    {formatMoney(
                                      order.totalAmount,
                                      order.currency,
                                      locale
                                    )}
                                  </strong>
                                </div>

                                <div className={styles.couponRow}>
                                  <span>
                                    {order.couponCode
                                      ? t.coupon
                                      : t.noCoupon}
                                  </span>

                                  {order.couponCode && (
                                    <code>
                                      {order.couponCode}
                                    </code>
                                  )}
                                </div>

                                {/* =================
                                    Payment Activity
                                ================= */}

                                <div className={styles.paymentSection}>
                                  <h4>{t.paymentActivity}</h4>

                                  {!paymentLoad ||
                                  paymentLoad.state === "loading" ? (
                                    <p className={styles.muted}>
                                      {t.paymentLoading}
                                    </p>
                                  ) : paymentLoad.state === "error" ? (
                                    <div className={styles.paymentError}>
                                      <p>{t.paymentError}</p>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          void loadPayments(
                                            order.id
                                          )
                                        }
                                      >
                                        {t.retry}
                                      </button>
                                    </div>
                                  ) : paymentLoad.payments.length === 0 ? (
                                    <p className={styles.muted}>
                                      {t.noPayments}
                                    </p>
                                  ) : (
                                    <div className={styles.paymentList}>
                                      {paymentLoad.payments.map(
                                        (payment) => (
                                          <div
                                            key={payment.id}
                                            className={styles.paymentItem}
                                          >
                                            <div className={styles.paymentHeading}>
                                              <strong>
                                                {payment.paymentProvider}
                                              </strong>

                                              <span
                                                className={`${styles.status} ${statusClass(
                                                  payment.status
                                                )}`}
                                              >
                                                {translatedStatus(
                                                  payment.status,
                                                  locale
                                                )}
                                              </span>
                                            </div>

                                            <p>
                                              {formatMoney(
                                                payment.amount,
                                                payment.currency,
                                                locale
                                              )}
                                            </p>

                                            <small>
                                              {formatDate(
                                                payment.createdAt,
                                                locale
                                              )}
                                            </small>

                                            {payment.transactionId && (
                                              <div
                                                className={
                                                  styles.transactionReference
                                                }
                                              >
                                                <span>
                                                  {t.reference}
                                                </span>

                                                <code dir="ltr">
                                                  {payment.transactionId}
                                                </code>
                                              </div>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Safe retry for confirmed failed PayTabs payments */}
                                {isPending && hasFailedPayment && (
                                  <div className={styles.paymentSection}>
                                    <h4>{t.failedPaymentTitle}</h4>
                                    <p className={styles.muted}>
                                      {hasUnresolvedPayment
                                        ? t.pendingAttempt
                                        : t.failedPaymentInfo}
                                    </p>

                                    {canOfferRetry ? (
                                      <>
                                        <button
                                          type="button"
                                          className={styles.primaryLink}
                                          disabled={!PAYMENTS_ENABLED || retryingId !== null}
                                          onClick={() => void retryPayment(order.id)}
                                          style={!PAYMENTS_ENABLED ? {
                                            opacity: 0.55,
                                            cursor: "not-allowed",
                                          } : undefined}
                                        >
                                          {retryingId === order.id
                                            ? t.retryingPayment
                                            : t.retryPayment}
                                        </button>
                                        {!PAYMENTS_ENABLED && (
                                          <p className={styles.muted}>
                                            {t.retryDisabled}
                                          </p>
                                        )}
                                      </>
                                    ) : !hasUnresolvedPayment ? (
                                      <p className={styles.muted}>
                                        {t.retryUnavailable}
                                      </p>
                                    ) : null}

                                    {retryErrors[order.id] && (
                                      <p className={styles.cancelError} role="alert">
                                        {retryErrors[order.id]}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </aside>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

// ========================================
// Page With Suspense
// ========================================

export default function MyOrdersPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div
            className={styles.statePanel}
            role="status"
          >
            Loading orders...
          </div>
        </main>
      }
    >
      <MyOrdersContent />
    </Suspense>
  );
}
