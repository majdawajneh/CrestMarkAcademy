
"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  useParams,
  useSearchParams,
} from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./PaymentResult.module.css";

type Locale = "en" | "ar";

type OrderItem = {
  id: number;
  courseId: number;
  courseTitle: string;
  finalPrice: number;
};

type Order = {
  id: number;
  orderNumber: string;
  status: string;
  currency: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  paidAt: string | null;
  items: OrderItem[];
};

type View =
  | "loading"
  | "paid"
  | "pending"
  | "closed"
  | "guest"
  | "missing"
  | "error";

const translations = {
  en: {
    eyebrow: "CRESTMARK / PAYMENT STATUS",
    title: "Your payment status",
    description:
      "Track the latest status of your course order.",
    loading: "Checking your order...",
    paidTitle: "Your order is confirmed",
    paidDescription:
      "Your order is marked as paid. Your purchased courses are now available in My Learning.",
    pendingTitle: "Your order is still pending",
    pendingDescription:
      "We have not received a confirmed payment for this order yet. If you just completed checkout, confirmation may take a little time. Your courses will unlock only after confirmation.",
    closedTitle: "Your order is not active",
    closedDescription:
      "This order is not currently marked as paid. Review its status in My Orders or contact support if you believe this is incorrect.",
    guestTitle: "Sign in to check your payment",
    guestDescription:
      "Please sign in with the account used to place your order.",
    missingTitle: "Order not found",
    missingDescription:
      "We couldn't identify an order for this page. You can review your purchase history in My Orders.",
    errorTitle: "We couldn't verify your order",
    errorDescription:
      "The order service is temporarily unavailable. This does not mean your payment failed. Please try again.",
    orderLabel: "Order reference",
    courseLabel: "Courses",
    totalLabel: "Order total",
    statusLabel: "Current status",
    paidAt: "Confirmed on",
    refresh: "Check again",
    orders: "View My Orders",
    learning: "Go to My Learning",
    courses: "Explore courses",
    signIn: "Sign in",
    pendingHint:
      "Please don't create another payment while an earlier attempt may still be processing.",
  },
  ar: {
    eyebrow: "CRESTMARK / حالة الدفع",
    title: "حالة عملية الدفع",
    description:
      "تابع آخر تحديث لحالة طلب دورتك التعليمية.",
    loading: "جاري التحقق من طلبك...",
    paidTitle: "تم تأكيد طلبك",
    paidDescription:
      "تم تسجيل الطلب كمدفوع. أصبحت الدورات التي اشتريتها متاحة في صفحة دوراتي.",
    pendingTitle: "طلبك ما زال قيد الانتظار",
    pendingDescription:
      "لم يصلنا تأكيد نهائي للدفع حتى الآن. إذا أنهيت الدفع للتو، فقد يحتاج التأكيد إلى بعض الوقت. لن يتم فتح الدورات إلا بعد تأكيد الدفع.",
    closedTitle: "طلبك غير نشط حاليًا",
    closedDescription:
      "هذا الطلب غير مسجل كمدفوع حاليًا. راجع حالته في طلباتي أو تواصل مع الدعم إذا كنت تعتقد أن هناك خطأ.",
    guestTitle: "سجّل دخولك للتحقق من الدفع",
    guestDescription:
      "سجّل الدخول بالحساب الذي استخدمته لإنشاء الطلب.",
    missingTitle: "لم يتم العثور على الطلب",
    missingDescription:
      "تعذر تحديد الطلب المطلوب. يمكنك مراجعة سجل مشترياتك من صفحة طلباتي.",
    errorTitle: "تعذر التحقق من طلبك",
    errorDescription:
      "خدمة الطلبات غير متاحة مؤقتًا. هذا لا يعني فشل الدفع. حاول مرة ثانية.",
    orderLabel: "رقم الطلب",
    courseLabel: "الدورات",
    totalLabel: "إجمالي الطلب",
    statusLabel: "الحالة الحالية",
    paidAt: "تاريخ التأكيد",
    refresh: "التحقق مجددًا",
    orders: "عرض طلباتي",
    learning: "الانتقال إلى دوراتي",
    courses: "استكشاف الدورات",
    signIn: "تسجيل الدخول",
    pendingHint:
      "يرجى عدم إنشاء محاولة دفع جديدة إذا كانت هناك عملية سابقة لا تزال قيد المعالجة.",
  },
} as const;

function formatMoney(
  amount: number,
  currency: string
) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      currencyDisplay: "code",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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
      month: "long",
      year: "numeric",
    }
  );
}

function PaymentResultContent() {
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();

  const locale: Locale =
    params.locale === "ar" ? "ar" : "en";

  const t = translations[locale];
  const orderId = searchParams.get("orderId");

  const [view, setView] = useState<View>("loading");
  const [order, setOrder] = useState<Order | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (
      !orderId ||
      !/^[1-9]\d*$/.test(orderId) ||
      !Number.isSafeInteger(Number(orderId))
    ) {
      setView("missing");
      setOrder(null);
      return;
    }

    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pendingChecks = 0;

    const controller = new AbortController();

    setView("loading");
    setOrder(null);

    async function checkOrder() {
      try {
        const requestOrder = () =>
          fetch(`/api/orders/${orderId}`, {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          });

        let response = await requestOrder();

        // Try restoring an expired access session.
        if (response.status === 401) {
          const session = await getCurrentSession();

          if (disposed) return;

          if (session.status === "guest") {
            setView("guest");
            return;
          }

          if (session.status !== "authenticated") {
            throw new Error("Session unavailable");
          }

          response = await requestOrder();
        }

        if (disposed) return;

        if (response.status === 401) {
          setView("guest");
          return;
        }

        if (response.status === 404) {
          setView("missing");
          return;
        }

        if (!response.ok) {
          throw new Error("Order request failed");
        }

        const data: unknown = await response.json();

        if (
          !data ||
          typeof data !== "object" ||
          !("id" in data) ||
          !("status" in data) ||
          !("items" in data) ||
          typeof data.id !== "number" ||
          typeof data.status !== "string" ||
          !Array.isArray(data.items) ||
          data.id !== Number(orderId)
        ) {
          throw new Error("Invalid order data");
        }

        if (disposed) return;

        const verifiedOrder = data as Order;
        const status = verifiedOrder.status.toLowerCase();

        setOrder(verifiedOrder);

        if (status === "paid") {
          setView("paid");
          return;
        }

        if (status === "pending") {
          setView("pending");

          // Allow the backend callback time to finish.
          // This only reads the order; it never confirms payment.
          if (pendingChecks < 8) {
            pendingChecks++;

            timer = setTimeout(() => {
              void checkOrder();
            }, 4000);
          }

          return;
        }

        setView("closed");
      } catch {
        if (!disposed) {
          setView("error");
        }
      }
    }

    void checkOrder();

    return () => {
      disposed = true;
      controller.abort();

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [orderId, refreshIndex]);

  const isLoading = view === "loading";
  const isPaid = view === "paid";
  const isPending = view === "pending";
  const isClosed = view === "closed";

  let heading: string = t.loading;
  let description: string = t.description;

  if (isPaid) {
    heading = t.paidTitle;
    description = t.paidDescription;
  } else if (isPending) {
    heading = t.pendingTitle;
    description = t.pendingDescription;
  } else if (isClosed) {
    heading = t.closedTitle;
    description = t.closedDescription;
  } else if (view === "guest") {
    heading = t.guestTitle;
    description = t.guestDescription;
  } else if (view === "missing") {
    heading = t.missingTitle;
    description = t.missingDescription;
  } else if (view === "error") {
    heading = t.errorTitle;
    description = t.errorDescription;
  }

  const statusText = isPaid
    ? locale === "ar" ? "مدفوع" : "Paid"
    : isPending
      ? locale === "ar" ? "قيد الانتظار" : "Pending"
      : order?.status ?? "";

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.container}>
        <Link
          href={`/${locale}/my-orders`}
          className={styles.backLink}
        >
          <span aria-hidden="true">
            {locale === "ar" ? "→" : "←"}
          </span>
          {t.orders}
        </Link>

        <header className={styles.pageHeading}>
          <p className={styles.eyebrow}>{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </header>

        <section
          className={styles.resultCard}
          aria-live="polite"
          aria-busy={isLoading}
        >
          <div
            className={`${styles.symbol} ${
              isPaid
                ? styles.symbolPaid
                : isPending
                  ? styles.symbolPending
                  : styles.symbolNeutral
            }`}
            aria-hidden="true"
          >
            {isLoading ? (
              <span className={styles.spinner} />
            ) : isPaid ? (
              "✓"
            ) : isPending ? (
              "⌛"
            ) : (
              "!"
            )}
          </div>

          <div className={styles.resultCopy}>
            <h2>{heading}</h2>
            <p>{description}</p>
          </div>

          {order && (
            <div className={styles.orderDetails}>
              <div className={styles.referenceRow}>
                <span>{t.orderLabel}</span>
                <strong dir="ltr">
                  {order.orderNumber}
                </strong>
              </div>

              <div className={styles.detailRow}>
                <span>{t.statusLabel}</span>
                <span
                  className={`${styles.statusLabel} ${
                    isPaid
                      ? styles.statusPaid
                      : isPending
                        ? styles.statusPending
                        : styles.statusNeutral
                  }`}
                >
                  {statusText}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span>{t.totalLabel}</span>
                <strong dir="ltr">
                  {formatMoney(
                    order.totalAmount,
                    order.currency
                  )}
                </strong>
              </div>

              <div className={styles.courseBlock}>
                <h3>{t.courseLabel}</h3>

                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className={styles.courseRow}
                  >
                    <span>{item.courseTitle}</span>
                    <span dir="ltr">
                      {formatMoney(
                        item.finalPrice,
                        order.currency
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {isPaid && order.paidAt && (
                <p className={styles.paidDate}>
                  {t.paidAt}:{" "}
                  {formatDate(order.paidAt, locale)}
                </p>
              )}
            </div>
          )}

          {isPending && (
            <div className={styles.pendingNotice}>
              {t.pendingHint}
            </div>
          )}

          <div className={styles.actions}>
            {isPaid && (
              <Link
                href={`/${locale}/my-learning`}
                className={styles.primaryButton}
              >
                {t.learning}
                <span aria-hidden="true">↗</span>
              </Link>
            )}

            {view === "guest" && (
              <Link
                href={`/${locale}/login`}
                className={styles.primaryButton}
              >
                {t.signIn}
              </Link>
            )}

            {(isPending || view === "error") && (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() =>
                  setRefreshIndex((value) => value + 1)
                }
              >
                {t.refresh}
              </button>
            )}

            <Link
              href={`/${locale}/my-orders`}
              className={styles.secondaryButton}
            >
              {t.orders}
            </Link>

            {(view === "missing" || isClosed) && (
              <Link
                href={`/${locale}/courses`}
                className={styles.secondaryButton}
              >
                {t.courses}
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.loadingFallback}>
            Checking payment status...
          </div>
        </main>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
