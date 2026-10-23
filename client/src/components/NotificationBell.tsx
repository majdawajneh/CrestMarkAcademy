
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./NotificationBell.module.css";

type Locale = "en" | "ar";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};

type Props = {
  locale: Locale;
  userId: string;
};

const copy = {
  en: {
    title: "Notifications",
    unread: "unread",
    empty: "You're all caught up",
    emptyText: "Your notifications will appear here.",
    readAll: "Mark all as read",
    markRead: "Mark as read",
    viewAll: "View all notifications",
    loading: "Loading notifications...",
    error: "Couldn't load notifications.",
    actionError: "Couldn't update your notification.",
    retry: "Try again",
    close: "Close notifications",
  },
  ar: {
    title: "الإشعارات",
    unread: "غير مقروء",
    empty: "كل شيء محدّث",
    emptyText: "ستظهر إشعاراتك هنا.",
    readAll: "تحديد الكل كمقروء",
    markRead: "تحديد كمقروء",
    viewAll: "عرض جميع الإشعارات",
    loading: "جارٍ تحميل الإشعارات...",
    error: "تعذّر تحميل الإشعارات.",
    actionError: "تعذّر تحديث الإشعار.",
    retry: "حاول مرة أخرى",
    close: "إغلاق الإشعارات",
  },
} as const;

// =====================================
// Validate API Response
// =====================================

function isNotificationList(
  value: unknown
): value is Notification[] {
  return (
    Array.isArray(value) &&
    value.every(
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

// =====================================
// Date Formatting
// =====================================

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
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(date);
}

// =====================================
// Notification Type Icon
// =====================================

function NotificationIcon({ type }: { type: string }) {
  const normalized = type.toLowerCase();

  if (normalized === "certificate") {
    return <span aria-hidden="true">★</span>;
  }

  if (normalized === "enrollment") {
    return <span aria-hidden="true">▤</span>;
  }

  if (normalized === "order" || normalized === "payment") {
    return <span aria-hidden="true">◈</span>;
  }

  return <span aria-hidden="true">●</span>;
}

// =====================================
// Notification Bell
// =====================================

export default function NotificationBell({
  locale,
  userId,
}: Props) {
  const t = copy[locale];

  const wrapperRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  const [open, setOpen] = useState(false);

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [status, setStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const unreadCount = notifications.filter(
    (item) => !item.isRead
  ).length;

  const recentNotifications = notifications.slice(0, 5);

  // =====================================
  // API Requests + Session Refresh
  // =====================================

  const request = useCallback(
    async (
      url: string,
      method: "GET" | "PATCH" = "GET"
    ) => {
      const send = () =>
        fetch(url, {
          method,
          credentials: "same-origin",
          cache: "no-store",
        });

      let response = await send();

      if (response.status === 401) {
        const session = await getCurrentSession();

        if (
          session.status !== "authenticated" ||
          session.user.id !== userId
        ) {
          throw new Error("Authentication required.");
        }

        response = await send();
      }

      return response;
    },
    [userId]
  );

  // =====================================
  // Load Notifications
  // =====================================

  const loadNotifications = useCallback(
  async () => {
    try {
        const response = await request("/api/notifications");

        if (!response.ok) {
          throw new Error("Notifications request failed.");
        }

        const data: unknown = await response.json();

        if (!isNotificationList(data)) {
          throw new Error("Invalid notification response.");
        }

        setNotifications(
          [...data].sort(
            (a, b) =>
              parseUtc(b.createdAt).getTime() -
              parseUtc(a.createdAt).getTime()
          )
        );

        setStatus("ready");
      } catch {
        setStatus("error");
      }
    },
    [request]
  );

  // =====================================
  // Initial Load + Periodic Refresh
  // =====================================

  
  useEffect(() => {
    const controller = new AbortController();

    async function initialize() {
      // Start the request asynchronously.
      // Avoid a synchronous state update in the effect body.
      await Promise.resolve();

      if (!controller.signal.aborted) {
        await loadNotifications();
      }
    }

    void initialize();

    const interval = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        !busyRef.current
      ) {
        void loadNotifications();
      }
    }, 60000);

    function onVisible() {
      if (
        document.visibilityState === "visible" &&
        !busyRef.current
      ) {
        void loadNotifications();
      }
    }

    document.addEventListener(
      "visibilitychange",
      onVisible
    );

    return () => {
      controller.abort();
      window.clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        onVisible
      );
    };
  }, [loadNotifications]);

  // =====================================
  // Sync Notifications Between Components
  // =====================================

  useEffect(() => {
    function handleNotificationUpdate() {
      if (!busyRef.current) {
        void loadNotifications();
      }
    }

    window.addEventListener(
      "crestmark:notifications-updated",
      handleNotificationUpdate
    );

    return () => {
      window.removeEventListener(
        "crestmark:notifications-updated",
        handleNotificationUpdate
      );
    };
  }, [loadNotifications]);

  // =====================================
  // Close Dropdown
  // =====================================

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      onPointerDown
    );

    document.addEventListener(
      "keydown",
      onEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        onPointerDown
      );

      document.removeEventListener(
        "keydown",
        onEscape
      );
    };
  }, [open]);

  // =====================================
  // Mark One Notification As Read
  // =====================================

  async function markAsRead(id: number) {
    if (busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setActionError("");

    try {
      const response = await request(
        `/api/notifications/${id}/read`,
        "PATCH"
      );

      if (!response.ok) {
        throw new Error("Update failed.");
      }

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

      // Notify the full Notifications page.
      window.dispatchEvent(
        new Event("crestmark:notifications-updated")
      );
    } catch {
      setActionError(t.actionError);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  // =====================================
  // Mark All Notifications As Read
  // =====================================

  async function markAllAsRead() {
    if (busyRef.current || unreadCount === 0) return;

    busyRef.current = true;
    setBusy(true);
    setActionError("");

    try {
      const response = await request(
        "/api/notifications/read-all",
        "PATCH"
      );

      if (!response.ok) {
        throw new Error("Update failed.");
      }

      const now = new Date().toISOString();

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || now,
        }))
      );

      // Notify the full Notifications page.
      window.dispatchEvent(
        new Event("crestmark:notifications-updated")
      );
    } catch {
      setActionError(t.actionError);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  // =====================================
  // Render
  // =====================================

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {/* Notification Bell */}

      <button
        type="button"
        className={styles.bellButton}
        aria-label={`${t.title}: ${unreadCount} ${t.unread}`}
        aria-expanded={open}
        aria-controls={
          open ? "cm-notification-panel" : undefined
        }
        onClick={() => {
          setOpen((previous) => !previous);

          if (!open) {
            void loadNotifications();
          }
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9Z" />
          <path d="M10 21h4" />
        </svg>

        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}

      {open && (
        <div
          id="cm-notification-panel"
          className={styles.panel}
          dir={locale === "ar" ? "rtl" : "ltr"}
        >
          {/* Header */}

          <div className={styles.panelHeader}>
            <div>
              <h2>{t.title}</h2>

              {unreadCount > 0 && (
                <span>
                  {unreadCount} {t.unread}
                </span>
              )}
            </div>

            <button
              type="button"
              className={styles.closeButton}
              aria-label={t.close}
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          {/* Loading / Error / Content */}

          {status === "loading" ? (
            <p className={styles.message} role="status">
              {t.loading}
            </p>
          ) : status === "error" ? (
            <div className={styles.message}>
              <p>{t.error}</p>

              <button
                type="button"
                className={styles.textButton}
                onClick={() =>
                  void loadNotifications()
                }
              >
                {t.retry}
              </button>
            </div>
          ) : (
            <>
              {/* Mark All As Read */}

              {unreadCount > 0 && (
                <div className={styles.toolbar}>
                  <button
                    type="button"
                    className={styles.textButton}
                    disabled={busy}
                    onClick={() =>
                      void markAllAsRead()
                    }
                  >
                    {t.readAll}
                  </button>
                </div>
              )}

              {/* Notification List */}

              {notifications.length === 0 ? (
                <div className={styles.empty}>
                  <span aria-hidden="true">✓</span>
                  <strong>{t.empty}</strong>
                  <p>{t.emptyText}</p>
                </div>
              ) : (
                <div className={styles.list}>
                  {recentNotifications.map((item) => (
                    <article
                      key={item.id}
                      className={`${styles.item} ${
                        !item.isRead
                          ? styles.unreadItem
                          : ""
                      }`}
                    >
                      <div className={styles.itemIcon}>
                        <NotificationIcon
                          type={item.type}
                        />
                      </div>

                      <div className={styles.itemContent}>
                        <div className={styles.itemTitleRow}>
                          <h3>{item.title}</h3>

                          {!item.isRead && (
                            <span
                              className={styles.unreadDot}
                              aria-label={t.unread}
                            />
                          )}
                        </div>

                        <p>{item.message}</p>

                        <div className={styles.itemFooter}>
                          <time dateTime={item.createdAt}>
                            {formatDate(
                              item.createdAt,
                              locale
                            )}
                          </time>

                          {!item.isRead && (
                            <button
                              type="button"
                              className={styles.readButton}
                              disabled={busy}
                              onClick={() =>
                                void markAsRead(item.id)
                              }
                            >
                              {t.markRead}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Action Error */}

              {actionError && (
                <p
                  className={styles.error}
                  role="alert"
                >
                  {actionError}
                </p>
              )}

              {/* View All Notifications */}

              <Link
                href={`/${locale}/notifications`}
                className={styles.viewAll}
                onClick={() => setOpen(false)}
              >
                {t.viewAll}

                <span aria-hidden="true">→</span>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
