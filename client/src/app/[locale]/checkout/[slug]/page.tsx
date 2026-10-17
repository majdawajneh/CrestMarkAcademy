
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useEffect,
  useState,
  Suspense,
  type FormEvent,
} from "react";

import { getCurrentSession } from "@/lib/auth-session";
import styles from "./page.module.css";

type Locale = "en" | "ar";

type Course = {
  id: number;
  title: string;
  slug: string;
  shortDescription: string | null;
  price: number;
  discountPrice: number | null;
  status: string;
  thumbnailUrl: string | null;
};

type Order = {
  id: number;
  orderNumber: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  status: string;
};

type SessionStatus =
  | "checking"
  | "authenticated"
  | "guest"
  | "unavailable";

const CURRENCY = "USD";
const PAYMENTS_ENABLED = false;
const words = {
  en: {
    breadcrumb: "Courses",
    checkout: "Checkout",
    eyebrow: "CRESTMARK / SECURE CHECKOUT",
    title: "Complete your enrollment",
    subtitle:
      "Review your course, apply an eligible coupon and confirm your order before payment.",
    selected: "Your selected course",
    coursePrice: "Course price",
    original: "Original price",
    current: "Current price",
    discount: "Course discount",
    couponSection: "Have a coupon?",
    couponHint:
      "The coupon is validated when your order is created.",
    couponDisabled:
      "An existing course discount cannot be combined with a coupon.",
    couponPlaceholder: "Enter coupon code",
    summary: "Order summary",
    summaryHint:
      "The final total is calculated by CrestMark's checkout service.",
    subtotal: "Subtotal",
    couponDiscount: "Coupon discount",
    total: "Total to pay",
    pending: "Pending payment",
    create: "Create & review order",
    creating: "Creating order...",
    pay: "Continue to secure payment",
    paying: "Opening PayTabs...",
    created: "Order created",
    orderNumber: "Order number",
    locked:
      "Your coupon and price selection are locked to this order.",
    signInTitle: "Sign in to continue",
    signInText:
      "You need a CrestMark account to place an order.",
    signIn: "Sign in",
    checkingSession: "Checking your account...",
    sessionError:
      "We couldn't verify your session. Refresh and try again.",
    invalid: "This course is unavailable for checkout.",
    loading: "Loading current course information...",
    courseError:
      "We couldn't load the course. Please try again.",
    orderError:
      "Unable to create your order. Check the details and try again.",
    payError:
      "Unable to open the secure payment gateway.",
    free:
      "Free enrollment requires a separate flow and is not available here.",
    security:
      "Payments are handled through PayTabs. Course access is granted only after payment is confirmed by the backend.",
    disclaimer:
      "Creating an order records a pending purchase. It does not charge your card.",
    back: "Back to course",
    myLearning: "My Learning",
    paymentsNotice:
      "Live payments remain disabled until the payment configuration and currency are verified.",
    currencyMismatch:
      "The order currency differs from the configured course currency. Payment has been blocked.",
    noCouponDiscount:
      "No additional coupon discount was applied.",
    notReady:
      "Payment cannot proceed until the course price and currency are verified.",
    payDisabled: "Secure payment coming soon",
    existingOrder: "Your existing pending order",
  existingOrderInfo:
    "We found your pending order. Its price and coupon are already saved.",
  checkingOrders: "Checking your existing orders...",
  ordersCheckError: "Couldn't check your existing orders. Please retry.",
  retryOrders: "Try again",
  viewOrders: "View order details",
  },
  ar: {
    breadcrumb: "الدورات",
    checkout: "إتمام الشراء",
    eyebrow: "CRESTMARK / الدفع الآمن",
    title: "أكمل تسجيلك بالدورة",
    subtitle:
      "راجع الدورة وأدخل كوبونًا مؤهلًا ثم أكد الطلب قبل الانتقال للدفع.",
    selected: "الدورة المختارة",
    coursePrice: "سعر الدورة",
    original: "السعر الأصلي",
    current: "السعر الحالي",
    discount: "خصم الدورة",
    couponSection: "هل لديك كوبون؟",
    couponHint:
      "يتم التحقق من الكوبون عند إنشاء الطلب.",
    couponDisabled:
      "لا يمكن جمع الكوبون مع الخصم الموجود أصلًا على الدورة.",
    couponPlaceholder: "أدخل رمز الكوبون",
    summary: "ملخص الطلب",
    summaryHint:
      "يتم حساب المبلغ النهائي من خدمة الطلبات في الأكاديمية.",
    subtotal: "المجموع الفرعي",
    couponDiscount: "خصم الكوبون",
    total: "المبلغ المطلوب",
    pending: "بانتظار الدفع",
    create: "إنشاء الطلب ومراجعة السعر",
    creating: "جارٍ إنشاء الطلب...",
    pay: "المتابعة إلى الدفع الآمن",
    paying: "جارٍ فتح PayTabs...",
    created: "تم إنشاء الطلب",
    orderNumber: "رقم الطلب",
    locked:
      "تم تثبيت الكوبون والسعر المستخدمين في هذا الطلب.",
    signInTitle: "سجّل الدخول للمتابعة",
    signInText:
      "تحتاج إلى حساب CrestMark لإنشاء طلب شراء.",
    signIn: "تسجيل الدخول",
    checkingSession: "جارٍ التحقق من حسابك...",
    sessionError:
      "تعذّر التحقق من الجلسة. حدّث الصفحة وحاول مجددًا.",
    invalid: "هذه الدورة غير متاحة للشراء.",
    loading: "جارٍ تحميل معلومات الدورة الحالية...",
    courseError:
      "تعذّر تحميل الدورة. يرجى المحاولة مجددًا.",
    orderError:
      "تعذّر إنشاء الطلب. راجع المعلومات وحاول مجددًا.",
    payError: "تعذّر فتح بوابة الدفع الآمنة.",
    free:
      "الدورات المجانية تحتاج مسار تسجيل منفصلًا وهو غير متاح هنا بعد.",
    security:
      "يتم الدفع عبر PayTabs، ولا يحصل الطالب على صلاحية الوصول إلا بعد تأكيد الدفع من الـ Backend.",
    disclaimer:
      "إنشاء الطلب يسجل عملية شراء معلقة ولا يخصم من بطاقتك.",
    back: "العودة إلى الدورة",
    myLearning: "دوراتي",
    paymentsNotice:
      "الدفع الحقيقي غير مفعّل إلى أن نتحقق من إعدادات البوابة والعملة.",
    currencyMismatch:
      "عملة الطلب مختلفة عن عملة الدورة المعتمدة. تم منع الدفع.",
    noCouponDiscount: "لم يتم تطبيق خصم كوبون إضافي.",
    notReady:
      "لا يمكن متابعة الدفع قبل التحقق من السعر والعملة.",
    payDisabled: "الدفع الإلكتروني غير متاح حاليًا",
    existingOrder: "طلبك المعلّق الحالي",
  existingOrderInfo:
    "وجدنا طلبك المعلّق. السعر والكوبون محفوظان مسبقًا.",
  checkingOrders: "جاري التحقق من طلباتك السابقة...",
  ordersCheckError: "تعذر التحقق من طلباتك. حاول مجددًا.",
  retryOrders: "إعادة المحاولة",
  viewOrders: "عرض تفاصيل الطلب",
  },
} as const;

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

function validMoney(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
}

function parseCourse(value: unknown): Course | null {
  if (
    !isObject(value) ||
    !validId(value.id) ||
    typeof value.title !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.status !== "string" ||
    !validMoney(value.price)
  ) {
    return null;
  }

  if (
    value.discountPrice !== null &&
    value.discountPrice !== undefined &&
    !validMoney(value.discountPrice)
  ) {
    return null;
  }

  return {
    id: value.id,
    title: value.title,
    slug: value.slug,
    status: value.status,
    price: value.price,
    discountPrice:
      typeof value.discountPrice === "number"
        ? value.discountPrice
        : null,
    shortDescription:
      typeof value.shortDescription === "string"
        ? value.shortDescription
        : null,
    thumbnailUrl:
      typeof value.thumbnailUrl === "string"
        ? value.thumbnailUrl
        : null,
  };
}

function parseOrder(value: unknown): Order | null {
  if (
    !isObject(value) ||
    !validId(value.id) ||
    typeof value.orderNumber !== "string" ||
    typeof value.status !== "string" ||
    typeof value.currency !== "string" ||
    !validMoney(value.subtotal) ||
    !validMoney(value.discountAmount) ||
    !validMoney(value.totalAmount)
  ) {
    return null;
  }

  return {
    id: value.id,
    orderNumber: value.orderNumber,
    status: value.status,
    currency: value.currency,
    subtotal: value.subtotal,
    discountAmount: value.discountAmount,
    totalAmount: value.totalAmount,
  };
}

async function responseData(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function apiError(value: unknown, fallback: string): string {
  if (!isObject(value)) return fallback;

  for (const key of ["detail", "message", "title"]) {
    const text = value[key];

    if (typeof text === "string" && text.trim()) {
      return text;
    }
  }

  return fallback;
}

function formatAmount(
  value: number,
  currency: string,
  locale: Locale
): string {
  return new Intl.NumberFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      style: "currency",
      currency,
      currencyDisplay: "code",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(value);
}


function CheckoutContent() {
  const params = useParams<{
    locale: string;
    slug: string;
  }>();


  const locale: Locale = params.locale === "ar" ? "ar" : "en";
  const slug = params.slug;
  const t = words[locale];

  const [course, setCourse] = useState<Course | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [courseError, setCourseError] = useState("");

  const [session, setSession] =
    useState<SessionStatus>("checking");

  const [couponCode, setCouponCode] = useState("");
  const [order, setOrder] = useState<Order | null>(null);

  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  
const [pendingCheck, setPendingCheck] = useState<
  "checking" | "ready" | "error"
>("checking");

const [checkedCourseId, setCheckedCourseId] =
  useState<number | null>(null);

const [existingPending, setExistingPending] = useState(false);

const [pendingRetry, setPendingRetry] = useState(0);

  const returnPath =
    `/${locale}/courses/${encodeURIComponent(slug)}`;

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const result = await getCurrentSession();

        if (cancelled) return;

        if (result.status === "authenticated") {
          setSession("authenticated");
        } else if (result.status === "unavailable") {
          setSession("unavailable");
        } else {
          setSession("guest");
        }
      } catch {
        if (!cancelled) setSession("unavailable");
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourse() {
      setLoadingCourse(true);
      setCourseError("");

      try {
        const response = await fetch(
          `/api/checkout?slug=${encodeURIComponent(slug)}`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = await responseData(response);

        if (!response.ok) {
          throw new Error(t.courseError);
        }

        const parsed = parseCourse(data);

        if (
          !parsed ||
          parsed.slug !== slug ||
          parsed.status.toLowerCase() !== "published"
        ) {
          throw new Error(t.invalid);
        }

        if (!controller.signal.aborted) {
          setCourse(parsed);
        }
      } catch {
        if (!controller.signal.aborted) {
          setCourse(null);
          setCourseError(t.courseError);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCourse(false);
        }
      }
    }

    void loadCourse();

    return () => controller.abort();
  }, [slug, t.courseError, t.invalid]);

  
// ========================================
// Detect Existing Pending USD Order
// ========================================

useEffect(() => {
  if (
    session !== "authenticated" ||
    !course ||
    loadingCourse ||
    course.slug !== slug
  ) {
    return;
  }

  const controller = new AbortController();

  async function checkExistingOrders() {
    setPendingCheck("checking");
    setCheckedCourseId(null);

    try {
      const requestOrders = () =>
        fetch("/api/orders/my", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

      let response = await requestOrders();

      if (response.status === 401) {
        const currentSession =
          await getCurrentSession();

        if (controller.signal.aborted) return;

        if (currentSession.status === "guest") {
          setSession("guest");
          return;
        }

        if (currentSession.status !== "authenticated") {
          throw new Error("Session unavailable.");
        }

        response = await requestOrders();
      }

      if (!response.ok) {
        throw new Error("Unable to load orders.");
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid orders response.");
      }

      // Find a pending USD order containing this course.
      const existing = data.find((entry: unknown) => {
        if (
          !isObject(entry) ||
          typeof entry.status !== "string" ||
          typeof entry.currency !== "string" ||
          !Array.isArray(entry.items)
        ) {
          return false;
        }

        return (
          entry.status.toLowerCase() === "pending" &&
          entry.currency.toUpperCase() === CURRENCY &&
          entry.items.some(
            (item: unknown) =>
              isObject(item) &&
              item.courseId === course.id
          )
        );
      });

      const savedOrder = existing
        ? parseOrder(existing)
        : null;

      if (existing && !savedOrder) {
        throw new Error("Invalid saved order.");
      }

      if (controller.signal.aborted) return;

      if (savedOrder) {
        // Display the original saved amount.
        // Do not recalculate an existing order.
        setOrder(savedOrder);

        setCouponCode(
          typeof existing.couponCode === "string"
            ? existing.couponCode
            : ""
        );

        setExistingPending(true);
      } else {
        setExistingPending(false);
      }

      setCheckedCourseId(course.id);
      setPendingCheck("ready");
    } catch {
      if (!controller.signal.aborted) {
        setPendingCheck("error");
      }
    }
  }

  void checkExistingOrders();

  return () => controller.abort();
}, [
  session,
  course,
  loadingCourse,
  slug,
  pendingRetry,
]);


  const hasDiscount =
    course !== null &&
    course.discountPrice !== null &&
    course.price > 0 &&
    course.discountPrice >= 0 &&
    course.discountPrice < course.price;

  const currentPrice = course
    ? hasDiscount && course.discountPrice !== null
      ? course.discountPrice
      : course.price
    : 0;

  const payable =
    currentPrice > 0 &&
    Number.isFinite(currentPrice);

  const orderCurrencyMatches =
    order === null ||
    order.currency.toUpperCase() === CURRENCY;

  // =====================================
  // Create a pending order
  // =====================================

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !course ||
      !payable ||
      creating ||
      order ||
      session !== "authenticated"||
      pendingCheck !== "ready" ||
      checkedCourseId !== course.id
    ) {
      return;
    }

    setError("");
    setCreating(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: course.id,
          couponCode: hasDiscount ? null : couponCode.trim() || null,
        }),
      });

      const data = await responseData(response);

      if (!response.ok) {
        throw new Error(apiError(data, t.orderError));
      }

      const created = parseOrder(data);

      if (!created) {
        throw new Error(t.orderError);
      }

      setOrder(created);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t.orderError
      );
    } finally {
      setCreating(false);
    }
  }

  // =====================================
  // Start hosted payment
  // =====================================

  async function startPayment() {
    if (
      !PAYMENTS_ENABLED ||
      !order ||
      paying ||
      !orderCurrencyMatches ||
      order.totalAmount <= 0 ||
      order.status.toLowerCase() !== "pending"
    ) {
      return;
    }

    setError("");
    setPaying(true);

    try {
      const response = await fetch("/api/checkout/paytabs", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
        }),
      });

      const data = await responseData(response);

      if (!response.ok) {
        throw new Error(apiError(data, t.payError));
      }

      if (
        !isObject(data) ||
        typeof data.redirectUrl !== "string"
      ) {
        throw new Error(t.payError);
      }

      // URL was validated by the Next.js server route.
      window.location.assign(data.redirectUrl);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t.payError
      );
      setPaying(false);
    }
  }

  return (
    <main className={styles.page} dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className={styles.container}>
        <nav className={styles.breadcrumbs}>
          <Link href={`/${locale}/courses`}>{t.breadcrumb}</Link>
          <span>/</span>
          <span>{t.checkout}</span>
        </nav>

        <header className={styles.header}>
          <span className={styles.eyebrow}>{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </header>

        {courseError && (
          <div className={styles.alert} role="alert">
            {courseError}
            <Link href={returnPath}>{t.back}</Link>
          </div>
        )}

        {loadingCourse && (
          <div className={styles.loading}>{t.loading}</div>
        )}

        {course && !loadingCourse && (
          <div className={styles.layout}>
            <section className={styles.mainColumn}>
              <div className={styles.panel}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionNumber}>01</span>
                  <h2>{t.selected}</h2>
                </div>

                <div className={styles.courseInfo}>
                  <div className={styles.courseMark}>
                    <svg
                      viewBox="0 0 48 48"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M7 12c6-3 12-3 17 1 5-4 11-4 17-1v25c-6-3-12-3-17 1-5-4-11-4-17-1V12Z" />
                      <path d="M24 13v25" />
                    </svg>
                  </div>

                  <div>
                    <h3>{course.title}</h3>
                    {course.shortDescription && (
                      <p>{course.shortDescription}</p>
                    )}
                    <Link href={returnPath}>{t.back} ↗</Link>
                  </div>
                </div>

                <div className={styles.coursePriceLine}>
                  <span>{t.coursePrice}</span>
                  <strong>
                    {formatAmount(currentPrice, CURRENCY, locale)}
                  </strong>
                </div>

                {hasDiscount && (
                  <div className={styles.originalLine}>
                    <span>{t.original}</span>
                    <del>
                      {formatAmount(course.price, CURRENCY, locale)}
                    </del>
                  </div>
                )}
              </div>

              <form className={styles.panel} onSubmit={createOrder}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionNumber}>02</span>
                  <h2>{t.couponSection}</h2>
                </div>

                <p className={styles.sectionHint}>
                  {hasDiscount ? t.couponDisabled : t.couponHint}
                </p>

                <label
                  className={styles.fieldLabel}
                  htmlFor="checkout-coupon"
                >
                  {t.couponSection}
                </label>

                <input
                  id="checkout-coupon"
                  className={styles.couponInput}
                  type="text"
                  value={couponCode}
                  maxLength={80}
                  autoComplete="off"
                  placeholder={t.couponPlaceholder}
                  onChange={(event) =>
                    setCouponCode(event.target.value)
                  }
                  disabled={hasDiscount || !!order || creating}
                />

                {order && (
                  <p className={styles.lockedNote}>{t.locked}</p>
                )}
                

                
                {session === "authenticated" &&
                  !order &&
                  pendingCheck === "checking" && (
                    <p className={styles.sessionNote}>
                      {t.checkingOrders}
                    </p>
                  )}

                {session === "authenticated" &&
                  !order &&
                  pendingCheck === "error" && (
                    <div className={styles.alert} role="alert">
                      <p>{t.ordersCheckError}</p>

                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() =>
                          setPendingRetry((value) => value + 1)
                        }
                      >
                        {t.retryOrders}
                      </button>
                    </div>
                  )}


                {session === "checking" && (
                  <p className={styles.sessionNote}>
                    {t.checkingSession}
                  </p>
                )}

                {session === "unavailable" && (
                  <div className={styles.alert} role="alert">
                    {t.sessionError}
                  </div>
                )}

                {session === "guest" && (
                  <div className={styles.loginNotice}>
                    <strong>{t.signInTitle}</strong>
                    <p>{t.signInText}</p>
                    <Link href={`/${locale}/login`}>
                      {t.signIn} ↗
                    </Link>
                  </div>
                )}

                {!payable && (
                  <div className={styles.alert}>{t.free}</div>
                )}

                {!order && session === "authenticated" && (
                  <>
                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={!payable || creating || loadingCourse || pendingCheck !== "ready" || checkedCourseId !== course.id}
                    >
                      {creating ? t.creating : t.create}
                      <span aria-hidden="true">→</span>
                    </button>

                    <p className={styles.actionHint}>
                      {t.disclaimer}
                    </p>
                  </>
                )}
              </form>

              <div className={styles.securityNote}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="5" y="10" width="14" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <p>{t.security}</p>
              </div>
            </section>

            <aside className={styles.summaryPanel}>
              <div className={styles.summaryTop}>
                <span className={styles.sectionNumber}>03</span>
                <h2>{t.summary}</h2>
              </div>

              <p className={styles.summaryIntro}>{t.summaryHint}</p>

              {!order ? (
                <>
                  <div className={styles.summaryRow}>
                    <span>{t.current}</span>
                    <strong>
                      {formatAmount(currentPrice, CURRENCY, locale)}
                    </strong>
                  </div>

                  {hasDiscount && (
                    <div className={styles.summaryRow}>
                      <span>{t.discount}</span>
                      <span className={styles.discountText}>
                        −{formatAmount(
                          course.price - currentPrice,
                          CURRENCY,
                          locale
                        )}
                      </span>
                    </div>
                  )}

                  <div className={styles.summaryDivider} />

                  <div className={styles.finalTotal}>
                    <span>{t.total}</span>
                    <strong>
                      {formatAmount(currentPrice, CURRENCY, locale)}
                    </strong>
                  </div>

                  <p className={styles.summaryNote}>
                    {t.couponHint}
                  </p>
                </>
              ) : (
                <>
                  
                  <div className={styles.orderCreated}>
                    <span className={styles.createdDot} />
                    {existingPending ? t.existingOrder : t.created}
                  </div>

                  {existingPending && (
                    <div className={styles.pendingNotice}>
                      <p>{t.existingOrderInfo}</p>

                      <Link
                        href={`/${locale}/my-orders`}
                        className={styles.learningLink}
                      >
                        {t.viewOrders} ↗
                      </Link>
                    </div>
                  )}


                  <div className={styles.orderIdentifier}>
                    <span>{t.orderNumber}</span>
                    <strong>{order.orderNumber}</strong>
                  </div>

                  <div className={styles.summaryRow}>
                    <span>{t.subtotal}</span>
                    <strong>
                      {formatAmount(
                        order.subtotal,
                        order.currency,
                        locale
                      )}
                    </strong>
                  </div>

                  <div className={styles.summaryRow}>
                    <span>{t.couponDiscount}</span>
                    <span className={styles.discountText}>
                      −{formatAmount(
                        order.discountAmount,
                        order.currency,
                        locale
                      )}
                    </span>
                  </div>

                  <div className={styles.summaryDivider} />

                  <div className={styles.finalTotal}>
                    <span>{t.total}</span>
                    <strong>
                      {formatAmount(
                        order.totalAmount,
                        order.currency,
                        locale
                      )}
                    </strong>
                  </div>

                  {!orderCurrencyMatches && (
                    <div className={styles.alert} role="alert">
                      {t.currencyMismatch}
                    </div>
                  )}

                  {order.totalAmount === 0 && (
                    <div className={styles.alert}>
                      {t.notReady}
                    </div>
                  )}

                  
                  {order.status.toLowerCase() === "pending" &&
                    orderCurrencyMatches &&
                    order.totalAmount > 0 && (
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => void startPayment()}
                        disabled={!PAYMENTS_ENABLED || paying}
                      >
                        {!PAYMENTS_ENABLED
                          ? t.payDisabled
                          : paying
                            ? t.paying
                            : t.pay}

                        <span aria-hidden="true">
                          {!PAYMENTS_ENABLED ? "🔒" : "→"}
                        </span>
                      </button>
                    )}


                  <p className={styles.actionHint}>
                    {t.paymentsNotice}
                  </p>
                </>
              )}

              
              {error && (
                <div className={styles.alert} role="alert">
                  <p>{error}</p>

                  <Link
                    href={`/${locale}/my-orders`}
                    className={styles.learningLink}
                  >
                    {locale === "ar"
                      ? "عرض طلباتي الحالية"
                      : "View my existing orders"}
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              )}


              <Link
                href={`/${locale}/my-learning`}
                className={styles.learningLink}
              >
                {t.myLearning} ↗
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

// ========================================
// Checkout Page - Suspense Boundary
// ========================================

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            background: "#f7f9fc",
          }}
          role="status"
        >
          Loading checkout...
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
