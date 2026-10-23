
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./page.module.css";

type Locale = "en" | "ar";
type Filter = "all" | "unread" | "read";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};

type Status = "loading" | "ready" | "guest" | "error";

const translations = {
  en: {
    back: "Back to home",
    eyebrow: "YOUR ACCOUNT",
    title: "Notifications",
    description:
      "Stay updated with your courses, certificates and account activity.",
    all: "All",
    unread: "Unread",
    read: "Read",
    markAll: "Mark all as read",
    markRead: "Mark as read",
    allRead: "All notifications read",
    loading: "Loading your notifications...",
    error: "We couldn't load your notifications.",
    actionError: "Unable to update the notification.",
    retry: "Try again",
    empty: "No notifications yet",
    emptyUnread: "You're all caught up",
    emptyRead: "No read notifications",
    emptyDescription:
      "Your course and account updates will appear here.",
    emptyUnreadDescription:
      "You don't have any unread notifications.",
    emptyReadDescription:
      "Notifications you have read will appear here.",
    signIn: "Sign in",
    guest: "Sign in to view your notifications.",
    total: "Total notifications",
    unreadCount: "Unread notifications",
    ready: "Your notification center",
    updated: "Notifications updated.",
    browse: "Explore courses",
  },
  ar: {
    back: "العودة للرئيسية",
    eyebrow: "حسابك الشخصي",
    title: "الإشعارات",
    description:
      "تابع آخر مستجدات دوراتك وشهاداتك ونشاط حسابك.",
    all: "الكل",
    unread: "غير المقروءة",
    read: "المقروءة",
    markAll: "تحديد الكل كمقروء",
    markRead: "تحديد كمقروء",
    allRead: "جميع الإشعارات مقروءة",
    loading: "جارٍ تحميل إشعاراتك...",
    error: "تعذّر تحميل الإشعارات.",
    actionError: "تعذّر تحديث الإشعار.",
    retry: "إعادة المحاولة",
    empty: "لا توجد إشعارات بعد",
    emptyUnread: "أنت مطّلع على كل جديد",
    emptyRead: "لا توجد إشعارات مقروءة",
    emptyDescription:
      "ستظهر هنا تحديثات دوراتك وحسابك.",
    emptyUnreadDescription:
      "ليس لديك إشعارات غير مقروءة حاليًا.",
    emptyReadDescription:
      "ستظهر هنا الإشعارات التي قرأتها.",
    signIn: "تسجيل الدخول",
    guest: "سجّل الدخول لعرض إشعاراتك.",
    total: "إجمالي الإشعارات",
    unreadCount: "الإشعارات غير المقروءة",
    ready: "مركز الإشعارات الخاص بك",
    updated: "تم تحديث الإشعارات.",
    browse: "استكشف الدورات",
  },
} as const;

function validateNotifications(
  data: unknown
): data is Notification[] {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        Number.isSafeInteger(item.id) &&
        item.id > 0 &&
        typeof item.title === "string" &&
        typeof item.message === "string" &&
        typeof item.type === "string" &&
        typeof item.isRead === "boolean" &&
        typeof item.createdAt === "string" &&
        (item.readAt === null ||
          typeof item.readAt === "string")
    )
  );
}

function parseUtc(value: string) {
  return new Date(
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
      ? value
      : `${value}Z`
  );
}

function formatDate(value: string, locale: Locale) {
  const date = parseUtc(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date);
}

function NotificationIcon({ type }: { type: string }) {
  const name = type.toLowerCase();

  if (name === "certificate") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="9" r="6" />
        <path d="m8 14-2 8 6-3 6 3-2-8" />
      </svg>
    );
  }

  if (name === "enrollment") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 5h8c1 0 2 1 2 2v13c-1-1-2-2-4-2H3V5Z" />
        <path d="M21 5h-6c-1 0-2 1-2 2v13c1-1 2-2 4-2h4V5Z" />
      </svg>
    );
  }

  if (name === "order" || name === "payment") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M7 15h4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9Z" />
      <path d="M10 21h4" />
    </svg>
  );
}

export default function NotificationsPage() {
  const params = useParams();
  const locale: Locale = params.locale === "ar" ? "ar" : "en";
  const t = translations[locale];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retryIndex, setRetryIndex] = useState(0);
  const [revision, setRevision] = useState(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const session = await getCurrentSession();

      if (signal?.aborted) return;

      if (session.status === "guest") {
        setNotifications([]);
        setStatus("guest");
        return;
      }

      if (session.status !== "authenticated") {
        setStatus("error");
        return;
      }

      const response = await fetch("/api/notifications", {
        credentials: "same-origin",
        cache: "no-store",
        signal,
      });

      if (signal?.aborted) return;

      if (response.status === 401) {
        setStatus("error");
        return;
      }

      if (!response.ok) {
        throw new Error("Request failed.");
      }

      const data: unknown = await response.json();

      if (!validateNotifications(data)) {
        throw new Error("Invalid notification data.");
      }

      if (signal?.aborted) return;

      setNotifications(
        [...data].sort(
          (a, b) =>
            parseUtc(b.createdAt).getTime() -
            parseUtc(a.createdAt).getTime()
        )
      );

      setStatus("ready");
    } catch {
      if (!signal?.aborted) setStatus("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void load(controller.signal);

    return () => controller.abort();
  }, [load, retryIndex, revision]);

  const reload = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  // Re-sync when the bell updates notification state.
  useEffect(() => {
    const handleUpdated = () => reload();

    window.addEventListener(
      "crestmark:notifications-updated",
      handleUpdated
    );

    return () => {
      window.removeEventListener(
        "crestmark:notifications-updated",
        handleUpdated
      );
    };
  }, [reload]);

  const unreadCount = notifications.filter(
    (item) => !item.isRead
  ).length;

  const readCount = notifications.length - unreadCount;

  const filtered = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.isRead);
    }

    if (filter === "read") {
      return notifications.filter((item) => item.isRead);
    }

    return notifications;
  }, [filter, notifications]);

  async function patch(url: string) {
    const send = () =>
      fetch(url, {
        method: "PATCH",
        credentials: "same-origin",
        cache: "no-store",
      });

    let response = await send();

    if (response.status === 401) {
      const session = await getCurrentSession();

      if (session.status !== "authenticated") {
        throw new Error("Session expired.");
      }

      response = await send();
    }

    if (!response.ok) throw new Error("Update failed.");
  }

  async function markOne(id: number) {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      await patch(`/api/notifications/${id}/read`);

      const now = new Date().toISOString();

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                isRead: true,
                readAt: item.readAt || now,
              }
            : item
        )
      );

      window.dispatchEvent(
        new Event("crestmark:notifications-updated")
      );
    } catch {
      setError(t.actionError);
    } finally {
      setBusy(false);
    }
  }

  async function markAll() {
    if (busy || unreadCount === 0) return;

    setBusy(true);
    setError("");

    try {
      await patch("/api/notifications/read-all");

      const now = new Date().toISOString();

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || now,
        }))
      );

      window.dispatchEvent(
        new Event("crestmark:notifications-updated")
      );
    } catch {
      setError(t.actionError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link className={styles.back} href={`/${locale}`}>
          <span aria-hidden="true">
            {locale === "ar" ? "→" : "←"}
          </span>
          {t.back}
        </Link>

        <div className={styles.intro}>
          <div>
            <span className={styles.eyebrow}>
              {t.eyebrow}
            </span>

            <h1>{t.title}</h1>
            <p>{t.description}</p>
          </div>

          <div className={styles.heroIcon} aria-hidden="true">
            <NotificationIcon type="general" />
          </div>
        </div>

        {status === "loading" ? (
          <div className={styles.state} role="status">
            {t.loading}
          </div>
        ) : status === "guest" ? (
          <div className={styles.state}>
            <h2>{t.title}</h2>
            <p>{t.guest}</p>
            <Link
              className={styles.primaryButton}
              href={`/${locale}/login`}
            >
              {t.signIn}
            </Link>
          </div>
        ) : status === "error" ? (
          <div className={styles.state} role="alert">
            <h2>{t.error}</h2>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => {
                setStatus("loading");
                setRetryIndex((value) => value + 1);
              }}
            >
              {t.retry}
            </button>
          </div>
        ) : (
          <>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span>{t.total}</span>
                <strong>{notifications.length}</strong>
              </div>
              <div className={styles.stat}>
                <span>{t.unreadCount}</span>
                <strong>{unreadCount}</strong>
              </div>
            </div>

            <section
              className={styles.notifications}
              aria-label={t.ready}
            >
              <div className={styles.toolbar}>
                <div
                  className={styles.filters}
                  role="group"
                  aria-label={t.title}
                >
                  {([
                    ["all", t.all, notifications.length],
                    ["unread", t.unread, unreadCount],
                    ["read", t.read, readCount],
                  ] as const).map(([key, label, count]) => (
                    <button
                      key={key}
                      type="button"
                      className={`${styles.filter} ${
                        filter === key ? styles.active : ""
                      }`}
                      aria-pressed={filter === key}
                      onClick={() => setFilter(key)}
                    >
                      {label}
                      <span>{count}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className={styles.markAll}
                  onClick={() => void markAll()}
                  disabled={busy || unreadCount === 0}
                >
                  {unreadCount === 0 ? t.allRead : t.markAll}
                </button>
              </div>

              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}

              {filtered.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>
                    <NotificationIcon type="general" />
                  </div>
                  <h2>
                    {filter === "unread"
                      ? t.emptyUnread
                      : filter === "read"
                        ? t.emptyRead
                        : t.empty}
                  </h2>
                  <p>
                    {filter === "unread"
                      ? t.emptyUnreadDescription
                      : filter === "read"
                        ? t.emptyReadDescription
                        : t.emptyDescription}
                  </p>

                  {notifications.length === 0 && (
                    <Link
                      href={`/${locale}/courses`}
                      className={styles.browse}
                    >
                      {t.browse}
                    </Link>
                  )}
                </div>
              ) : (
                <div className={styles.list}>
                  {filtered.map((item) => (
                    <article
                      key={item.id}
                      className={`${styles.item} ${
                        !item.isRead ? styles.unreadItem : ""
                      }`}
                    >
                      <div className={styles.iconBox}>
                        <NotificationIcon type={item.type} />
                      </div>

                      <div className={styles.content}>
                        <div className={styles.titleRow}>
                          <h2>{item.title}</h2>

                          {!item.isRead && (
                            <span
                              className={styles.dot}
                              aria-label={t.unread}
                            />
                          )}
                        </div>

                        <p>{item.message}</p>

                        <div className={styles.itemBottom}>
                          <time dateTime={item.createdAt}>
                            {formatDate(item.createdAt, locale)}
                          </time>

                          {!item.isRead && (
                            <button
                              type="button"
                              className={styles.readButton}
                              disabled={busy}
                              onClick={() => void markOne(item.id)}
                            >
                              {t.markRead}
                            </button>
                          )}
                        </div>
                      </div>

                      {item.isRead && (
                        <span
                          className={styles.readCheck}
                          aria-label={t.read}
                          title={t.read}
                        >
                          ✓
                        </span>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
