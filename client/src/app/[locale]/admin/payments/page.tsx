
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./page.module.css";

type Locale = "en" | "ar";

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
    eyebrow: "ACADEMY / FINANCIAL OPERATIONS",
    title: "Payments management",
    description:
      "Track payment records, transaction references, and their associated orders.",
    total: "Total transactions",
    paid: "Paid",
    pending: "Pending",
    failed: "Failed",
    volume: "Recorded paid volume",
    volumeNote:
      "Based on paid payment records. Not a verified settlement or net revenue report.",
    directory: "Payment directory",
    directoryDescription:
      "A complete record of payment attempts in CrestMark Academy.",
    refresh: "Refresh",
    search:
      "Search by order, email, transaction ID or payment ID...",
    allStatuses: "All statuses",
    allProviders: "All providers",
    allCurrencies: "All currencies",
    from: "From date",
    to: "To date",
    clear: "Clear filters",
    payment: "Payment",
    order: "Order",
    customer: "Customer",
    provider: "Provider",
    amount: "Amount",
    status: "Status",
    created: "Created",
    actions: "Actions",
    view: "View details",
    loading: "Loading payment records...",
    empty: "No payment records yet",
    noMatches: "No matching payments",
    emptyDescription: "Try adjusting the search or filters.",
    loadError: "Could not load payments.",
    retry: "Try again",
    showing: "Showing",
    of: "of",
    page: "Page",
    previous: "Previous",
    next: "Next",
    detailsTitle: "Payment details",
    detailsDescription:
      "Transaction information recorded by the academy backend.",
    paymentId: "Payment ID",
    orderId: "Order ID",
    orderNumber: "Order number",
    userId: "User ID",
    email: "Customer email",
    paymentProvider: "Payment provider",
    transactionId: "Transaction ID",
    paymentAmount: "Payment amount",
    paymentStatus: "Payment status",
    createdAt: "Created on",
    paidAt: "Paid on",
    failedAt: "Failed on",
    noValue: "Not available",
    openOrders: "Open Orders Management",
    close: "Close",
    detailsError: "Could not load payment details.",
    readOnly: "Payment status is managed by the backend payment workflow.",
    testNotice:
      "Test gateway transactions are not proof of real money settlement.",
    copyReference: "Copy transaction ID",
    copied: "Transaction ID copied.",
    copyUnavailable: "Could not copy the transaction ID.",
  },
  ar: {
    eyebrow: "الأكاديمية / العمليات المالية",
    title: "إدارة المدفوعات",
    description:
      "تابع عمليات الدفع ومراجع المعاملات والطلبات المرتبطة بها.",
    total: "إجمالي العمليات",
    paid: "المدفوعة",
    pending: "قيد الانتظار",
    failed: "الفاشلة",
    volume: "إجمالي سجلات الدفع الناجحة",
    volumeNote:
      "محسوب من سجلات الدفع المدفوعة، وليس تقرير تسوية أو صافي إيرادات.",
    directory: "سجل المدفوعات",
    directoryDescription:
      "عرض سجلات محاولات الدفع المسجلة في CrestMark Academy.",
    refresh: "تحديث",
    search:
      "ابحث برقم الطلب أو البريد أو رقم العملية أو معرّف الدفع...",
    allStatuses: "جميع الحالات",
    allProviders: "جميع بوابات الدفع",
    allCurrencies: "جميع العملات",
    from: "من تاريخ",
    to: "إلى تاريخ",
    clear: "إزالة الفلاتر",
    payment: "الدفع",
    order: "الطلب",
    customer: "العميل",
    provider: "بوابة الدفع",
    amount: "المبلغ",
    status: "الحالة",
    created: "تاريخ الإنشاء",
    actions: "الإجراءات",
    view: "التفاصيل",
    loading: "جارٍ تحميل سجلات الدفع...",
    empty: "لا توجد سجلات دفع بعد",
    noMatches: "لا توجد مدفوعات مطابقة",
    emptyDescription: "جرّب تغيير البحث أو الفلاتر.",
    loadError: "تعذّر تحميل المدفوعات.",
    retry: "إعادة المحاولة",
    showing: "عرض",
    of: "من أصل",
    page: "صفحة",
    previous: "السابق",
    next: "التالي",
    detailsTitle: "تفاصيل الدفع",
    detailsDescription:
      "بيانات العملية المسجلة في نظام الأكاديمية.",
    paymentId: "معرّف الدفع",
    orderId: "معرّف الطلب",
    orderNumber: "رقم الطلب",
    userId: "معرّف المستخدم",
    email: "البريد الإلكتروني",
    paymentProvider: "مزود الدفع",
    transactionId: "رقم العملية",
    paymentAmount: "قيمة الدفع",
    paymentStatus: "حالة الدفع",
    createdAt: "تاريخ الإنشاء",
    paidAt: "تاريخ الدفع",
    failedAt: "تاريخ الفشل",
    noValue: "غير متوفر",
    openOrders: "فتح إدارة الطلبات",
    close: "إغلاق",
    detailsError: "تعذّر تحميل تفاصيل الدفع.",
    readOnly: "حالة الدفع تُدار من خلال نظام المدفوعات في الـ Backend.",
    testNotice:
      "عمليات بوابة الدفع التجريبية لا تثبت تحصيل أموال حقيقية.",
    copyReference: "نسخ رقم العملية",
    copied: "تم نسخ رقم العملية.",
    copyUnavailable: "تعذّر نسخ رقم العملية.",
  },
} as const;

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function positiveId(value: unknown): number | null {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    return null;
  }

  return value;
}

function parsePayment(value: unknown): Payment | null {
  if (!isObject(value)) return null;

  const id = positiveId(value.id);
  const orderId = positiveId(value.orderId);
  const userId = positiveId(value.userId);

  if (
    id === null ||
    orderId === null ||
    userId === null ||
    typeof value.orderNumber !== "string" ||
    typeof value.userEmail !== "string" ||
    typeof value.paymentProvider !== "string" ||
    typeof value.amount !== "number" ||
    !Number.isFinite(value.amount) ||
    typeof value.currency !== "string" ||
    typeof value.status !== "string"
  ) {
    return null;
  }

  return {
    id,
    orderId,
    userId,
    orderNumber: value.orderNumber,
    userEmail: value.userEmail,
    paymentProvider: value.paymentProvider,
    amount: value.amount,
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

function extractArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;

  if (!isObject(value)) return null;

  for (const key of [
    "items",
    "data",
    "payments",
    "results",
  ]) {
    const candidate = value[key];

    if (Array.isArray(candidate)) return candidate;

    if (isObject(candidate) && Array.isArray(candidate.items)) {
      return candidate.items;
    }
  }

  return null;
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

function errorMessage(value: unknown, fallback: string): string {
  if (!isObject(value)) return fallback;

  for (const key of ["message", "Message", "title"]) {
    if (typeof value[key] === "string" && value[key]) {
      return value[key] as string;
    }
  }

  return fallback;
}

function normalizeStatus(value: string) {
  return value.trim().toLowerCase();
}

function isPaid(value: string) {
  return normalizeStatus(value) === "paid";
}

function isFailed(value: string) {
  return ["failed", "rejected", "declined"].includes(
    normalizeStatus(value)
  );
}

function isPending(value: string) {
  return [
    "pending",
    "processing",
    "created",
    "initiated",
  ].includes(normalizeStatus(value));
}

function formatAmount(
  amount: number,
  currency: string,
  locale: Locale
) {
  const value = new Intl.NumberFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }
  ).format(amount);

  return `${value} ${currency}`;
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) return "—";

  // Backend timestamps do not include an explicit timezone.
  // Preserve the date portion without inventing an offset.
  const day = value.slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return "—";
  }

  const parsed = new Date(`${day}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(parsed);
}

function StatusBadge({
  status,
  locale,
}: {
  status: string;
  locale: Locale;
}) {
  const className = isPaid(status)
    ? styles.statusPaid
    : isFailed(status)
      ? styles.statusFailed
      : isPending(status)
        ? styles.statusPending
        : styles.statusOther;

  const normalized = normalizeStatus(status);

  const label =
    locale === "ar"
      ? normalized === "paid"
        ? "مدفوع"
        : isFailed(status)
          ? "فاشل"
          : isPending(status)
            ? "قيد الانتظار"
            : status
      : status;

  return (
    <span className={`${styles.statusBadge} ${className}`}>
      <span aria-hidden="true" />
      {label}
    </span>
  );
}

export default function AdminPaymentsPage() {
  const params = useParams<{ locale: string }>();

  const locale: Locale =
    params.locale === "ar" ? "ar" : "en";

  const t = translations[locale];

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Payment | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [notice, setNotice] = useState("");

  const loadPayments = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/api/admin/payments", {
          cache: "no-store",
          credentials: "same-origin",
          signal,
        });

        const body = await readResponse(response);
        if (signal?.aborted) return;

        if (!response.ok) {
          throw new Error(errorMessage(body, t.loadError));
        }

        const items = extractArray(body);

        if (!items) {
          throw new Error("Unexpected payments response.");
        }

        const parsed = items.map(parsePayment);

        if (parsed.some((item) => item === null)) {
          throw new Error("Invalid payment data returned by the API.");
        }

        setPayments(
          (parsed as Payment[]).sort(
            (a, b) =>
              (b.createdAt ?? "").localeCompare(a.createdAt ?? "") ||
              b.id - a.id
          )
        );
      } catch (error) {
        if (signal?.aborted) return;

        setPayments([]);
        setLoadError(
          error instanceof Error ? error.message : t.loadError
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [t.loadError]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadPayments(controller.signal);

    return () => controller.abort();
  }, [loadPayments]);

  useEffect(() => {
    if (selectedId === null) {
      setDetails(null);
      setDetailsError("");
      return;
    }

    const controller = new AbortController();

    async function loadDetails() {
      setDetails(null);
      setDetailsError("");
      setDetailsLoading(true);

      try {
        const response = await fetch(
          `/api/admin/payments/${selectedId}`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const body = await readResponse(response);
        if (controller.signal.aborted) return;

        if (!response.ok) {
          throw new Error(
            errorMessage(body, t.detailsError)
          );
        }

        const parsed = parsePayment(body);

        if (!parsed || parsed.id !== selectedId) {
          throw new Error("Unexpected payment details response.");
        }

        setDetails(parsed);
      } catch (error) {
        if (controller.signal.aborted) return;

        setDetailsError(
          error instanceof Error ? error.message : t.detailsError
        );
      } finally {
        if (!controller.signal.aborted) setDetailsLoading(false);
      }
    }

    void loadDetails();

    return () => controller.abort();
  }, [selectedId, t.detailsError]);

  useEffect(() => {
    if (selectedId === null) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedId(null);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () =>
      document.removeEventListener("keydown", handleEscape);
  }, [selectedId]);

  const stats = useMemo(() => {
    const paidPayments = payments.filter(
      (payment) => isPaid(payment.status)
    );

    const grouped = new Map<string, number>();

    paidPayments.forEach((payment) => {
      grouped.set(
        payment.currency,
        (grouped.get(payment.currency) ?? 0) + payment.amount
      );
    });

    return {
      total: payments.length,
      paid: paidPayments.length,
      pending: payments.filter((p) => isPending(p.status)).length,
      failed: payments.filter((p) => isFailed(p.status)).length,
      volumes: [...grouped.entries()].map(([currency, amount]) =>
        formatAmount(amount, currency, locale)
      ),
    };
  }, [payments, locale]);

  const availableStatuses = useMemo(
    () => [...new Set(payments.map((p) => p.status))].sort(),
    [payments]
  );

  const availableProviders = useMemo(
    () => [...new Set(payments.map((p) => p.paymentProvider))].sort(),
    [payments]
  );

  const availableCurrencies = useMemo(
    () => [...new Set(payments.map((p) => p.currency))].sort(),
    [payments]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const searchable = [
        payment.id,
        `#${payment.id}`,
        payment.orderId,
        payment.orderNumber,
        payment.userId,
        payment.userEmail,
        payment.paymentProvider,
        payment.transactionId,
      ]
        .filter(
          (value) => value !== null && value !== undefined
        )
        .join(" ")
        .toLowerCase();

      const date = payment.createdAt?.slice(0, 10) ?? "";

      return (
        (!term || searchable.includes(term)) &&
        (statusFilter === "all" ||
          payment.status === statusFilter) &&
        (providerFilter === "all" ||
          payment.paymentProvider === providerFilter) &&
        (currencyFilter === "all" ||
          payment.currency === currencyFilter) &&
        (!dateFrom || (date !== "" && date >= dateFrom)) &&
        (!dateTo || (date !== "" && date <= dateTo))
      );
    });
  }, [
    payments,
    search,
    statusFilter,
    providerFilter,
    currencyFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    providerFilter,
    currencyFilter,
    dateFrom,
    dateTo,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const visiblePayments = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setProviderFilter("all");
    setCurrencyFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  function closeDetails() {
    setSelectedId(null);
    setNotice("");
  }

  async function copyTransactionId(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(t.copied);
    } catch {
      setNotice(t.copyUnavailable);
    }
  }

  const summaryCards = [
    { key: "01", label: t.total, value: stats.total },
    { key: "02", label: t.paid, value: stats.paid },
    { key: "03", label: t.pending, value: stats.pending },
    { key: "04", label: t.failed, value: stats.failed },
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
          <p>{t.description}</p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          disabled={loading}
          onClick={() => void loadPayments()}
        >
          <span aria-hidden="true">↻</span>
          {t.refresh}
        </button>
      </header>

      <section className={styles.stats} aria-label={t.title}>
        {summaryCards.map((card) => (
          <div className={styles.statCard} key={card.key}>
            <div className={styles.statTop}>
              <span>{card.label}</span>
              <small>{card.key}</small>
            </div>

            <strong>
              {loading || loadError ? "—" : card.value}
            </strong>
          </div>
        ))}
      </section>

      <section className={styles.volumeStrip}>
        <div>
          <span>{t.volume}</span>
          <strong>
            {loading || loadError
              ? "—"
              : stats.volumes.length > 0
                ? stats.volumes.join(" · ")
                : "—"}
          </strong>
        </div>
        <p>{t.volumeNote}</p>
      </section>

      {payments.some((payment) =>
        payment.paymentProvider.toLowerCase().includes("test")
      ) && (
        <p className={styles.testNotice}>{t.testNotice}</p>
      )}

      <section className={styles.workspace}>
        <div className={styles.workspaceHeader}>
          <div>
            <h3>{t.directory}</h3>
            <p>{t.directoryDescription}</p>
          </div>
          <span className={styles.recordCount}>
            {loading || loadError ? "—" : payments.length}
          </span>
        </div>

        {loadError && (
          <div className={styles.errorMessage} role="alert">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => void loadPayments()}
            >
              {t.retry}
            </button>
          </div>
        )}

        <div className={styles.filters}>
          <div className={styles.searchField}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>
            <input
              type="search"
              value={search}
              placeholder={t.search}
              aria-label={t.search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            aria-label={t.status}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">{t.allStatuses}</option>
            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            aria-label={t.provider}
            value={providerFilter}
            onChange={(event) => setProviderFilter(event.target.value)}
          >
            <option value="all">{t.allProviders}</option>
            {availableProviders.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
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
              <option key={currency} value={currency}>
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
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>

          <label>
            <span>{t.to}</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>

          {(search ||
            statusFilter !== "all" ||
            providerFilter !== "all" ||
            currencyFilter !== "all" ||
            dateFrom ||
            dateTo) && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={clearFilters}
            >
              {t.clear}
            </button>
          )}
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t.payment}</th>
                <th>{t.order}</th>
                <th>{t.customer}</th>
                <th>{t.provider}</th>
                <th>{t.amount}</th>
                <th>{t.status}</th>
                <th>{t.created}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className={styles.emptyCell}>
                    {t.loading}
                  </td>
                </tr>
              ) : visiblePayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyCell}>
                    <strong>
                      {payments.length === 0 ? t.empty : t.noMatches}
                    </strong>
                    <p>{t.emptyDescription}</p>
                  </td>
                </tr>
              ) : (
                visiblePayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <div className={styles.paymentCell}>
                        <strong>#{payment.id}</strong>
                        <small>
                          {payment.transactionId || t.noValue}
                        </small>
                      </div>
                    </td>

                    <td>
                      <div className={styles.orderCell}>
                        <strong>{payment.orderNumber}</strong>
                        <small>Order #{payment.orderId}</small>
                      </div>
                    </td>

                    <td className={styles.emailCell}>
                      {payment.userEmail}
                    </td>

                    <td>
                      <span className={styles.providerPill}>
                        {payment.paymentProvider}
                      </span>
                    </td>

                    <td>
                      <strong className={styles.amount}>
                        {formatAmount(
                          payment.amount,
                          payment.currency,
                          locale
                        )}
                      </strong>
                    </td>

                    <td>
                      <StatusBadge
                        status={payment.status}
                        locale={locale}
                      />
                    </td>

                    <td className={styles.dateCell}>
                      {formatDate(payment.createdAt, locale)}
                    </td>

                    <td>
                      <button
                        type="button"
                        className={styles.viewButton}
                        onClick={() => {
                          setNotice("");
                          setSelectedId(payment.id);
                        }}
                      >
                        {t.view}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <span>
            {t.showing} {loadError ? "—" : filtered.length}{" "}
            {t.of} {loadError ? "—" : payments.length}
          </span>

          <div className={styles.pagination}>
            <button
              type="button"
              disabled={loading || currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              {t.previous}
            </button>

            <span>
              {t.page} {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={loading || currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              {t.next}
            </button>
          </div>
        </div>
      </section>

      {selectedId !== null && (
        <div className={styles.panelOverlay}>
          <button
            type="button"
            className={styles.backdrop}
            aria-label={t.close}
            onClick={closeDetails}
          />

          <aside
            className={styles.detailPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-details-title"
          >
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  CRESTMARK / PAYMENT #{selectedId}
                </span>
                <h2 id="payment-details-title">
                  {t.detailsTitle}
                </h2>
                <p>{t.detailsDescription}</p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                aria-label={t.close}
                onClick={closeDetails}
              >
                ×
              </button>
            </div>

            <div className={styles.panelBody}>
              {detailsLoading ? (
                <p className={styles.loadingDetails}>{t.loading}</p>
              ) : detailsError ? (
                <div className={styles.errorMessage} role="alert">
                  <span>{detailsError}</span>
                </div>
              ) : details ? (
                <>
                  <div className={styles.detailSummary}>
                    <div>
                      <span>{t.paymentAmount}</span>
                      <strong>
                        {formatAmount(
                          details.amount,
                          details.currency,
                          locale
                        )}
                      </strong>
                    </div>
                    <StatusBadge
                      status={details.status}
                      locale={locale}
                    />
                  </div>

                  <section className={styles.detailSection}>
                    <h3>{t.detailsTitle}</h3>

                    <dl className={styles.detailGrid}>
                      <div>
                        <dt>{t.paymentId}</dt>
                        <dd>#{details.id}</dd>
                      </div>

                      <div>
                        <dt>{t.orderId}</dt>
                        <dd>#{details.orderId}</dd>
                      </div>

                      <div>
                        <dt>{t.userId}</dt>
                        <dd>#{details.userId}</dd>
                      </div>

                      <div>
                        <dt>{t.paymentProvider}</dt>
                        <dd>{details.paymentProvider}</dd>
                      </div>

                      <div className={styles.wideDetail}>
                        <dt>{t.orderNumber}</dt>
                        <dd>{details.orderNumber}</dd>
                      </div>

                      <div className={styles.wideDetail}>
                        <dt>{t.email}</dt>
                        <dd>{details.userEmail}</dd>
                      </div>

                      <div className={styles.wideDetail}>
                        <dt>{t.transactionId}</dt>
                        <dd className={styles.transactionDetail}>
                          <span>
                            {details.transactionId || t.noValue}
                          </span>

                          {details.transactionId && (
                            <button
                              type="button"
                              className={styles.copyButton}
                              onClick={() =>
                                void copyTransactionId(
                                  details.transactionId!
                                )
                              }
                            >
                              {t.copyReference}
                            </button>
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>{t.createdAt}</dt>
                        <dd>
                          {formatDate(details.createdAt, locale)}
                        </dd>
                      </div>

                      <div>
                        <dt>{t.paidAt}</dt>
                        <dd>
                          {formatDate(details.paidAt, locale)}
                        </dd>
                      </div>

                      <div>
                        <dt>{t.failedAt}</dt>
                        <dd>
                          {formatDate(details.failedAt, locale)}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  {notice && (
                    <p className={styles.copyNotice} role="status">
                      {notice}
                    </p>
                  )}

                  <section className={styles.detailSection}>
                    <h3>{t.order}</h3>
                    <div className={styles.relatedOrder}>
                      <div>
                        <span>{t.orderNumber}</span>
                        <strong>{details.orderNumber}</strong>
                      </div>

                      <Link
                        href={`/${locale}/admin/orders`}
                        className={styles.orderLink}
                      >
                        {t.openOrders} ↗
                      </Link>
                    </div>
                  </section>

                  <div className={styles.readOnlyNote}>
                    <span aria-hidden="true">ⓘ</span>
                    <p>{t.readOnly}</p>
                  </div>
                </>
              ) : null}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
