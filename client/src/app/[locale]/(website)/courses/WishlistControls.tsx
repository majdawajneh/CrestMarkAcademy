
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getCurrentSession } from "@/lib/auth-session";
import styles from "./page.module.css";

type Locale = "en" | "ar";
type Mode = "loading" | "ready" | "guest" | "error";

export type SavedCourse = {
  id: number;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  categoryName: string | null;
  level: string | null;
  language: string | null;
};

type WishlistContextValue = {
  locale: Locale;
  mode: Mode;
  saved: Set<number>;
  busyId: number | null;
  error: string;
  toggle: (courseId: number) => Promise<void>;
  retry: () => void;
};

const WishlistContext =
  createContext<WishlistContextValue | null>(null);

const text = {
  en: {
    save: "Save course",
    remove: "Remove saved course",
    saved: "Saved courses",
    signIn: "Sign in to save courses",
    loadError: "We couldn't load your saved courses.",
    actionError:
      "Couldn't update your saved courses. Please try again.",
    retry: "Try again",
    loading: "Loading your saved courses...",
    emptyTitle: "No saved courses yet",
    emptyDescription:
      "Save courses you are interested in and they will appear here.",
    explore: "Explore courses",
    view: "Explore course",
    unavailable:
      "Some previously saved courses may no longer be listed in the catalog.",
  },
  ar: {
    save: "حفظ الدورة",
    remove: "إزالة الدورة من المحفوظات",
    saved: "الدورات المحفوظة",
    signIn: "سجّل الدخول لحفظ الدورات",
    loadError: "تعذر تحميل الدورات المحفوظة.",
    actionError:
      "تعذر تحديث المحفوظات. حاول مرة أخرى.",
    retry: "إعادة المحاولة",
    loading: "جاري تحميل دوراتك المحفوظة...",
    emptyTitle: "ما عندك دورات محفوظة بعد",
    emptyDescription:
      "احفظ الدورات اللي بتهمك وبتلاقيها هون وقت ما تحتاجها.",
    explore: "استكشف الدورات",
    view: "استكشف الدورة",
    unavailable:
      "قد لا تظهر بعض الدورات المحفوظة إذا لم تعد موجودة في كتالوج الدورات.",
  },
} as const;

function record(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function extractCourseIds(payload: unknown): number[] {
  const entries = Array.isArray(payload)
    ? payload
    : record(payload) && Array.isArray(payload.items)
      ? payload.items
      : record(payload) && Array.isArray(payload.data)
        ? payload.data
        : null;

  if (!entries) {
    throw new Error("Unexpected wishlist response.");
  }

  const ids: number[] = [];

  for (const entry of entries) {
    let id: unknown = null;

    if (typeof entry === "number") {
      id = entry;
    } else if (record(entry)) {
      // Wishlist item ID is not necessarily course ID.
      id = entry.courseId;

      if (!id && record(entry.course)) {
        id = entry.course.id;
      }
    }

    if (
      typeof id !== "number" ||
      !Number.isSafeInteger(id) ||
      id <= 0
    ) {
      throw new Error("Unexpected wishlist item shape.");
    }

    ids.push(id);
  }

  return ids;
}

export function WishlistProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();

  const [mode, setMode] =
    useState<Mode>("loading");

  const [saved, setSaved] =
    useState<Set<number>>(() => new Set());

  const [busyId, setBusyId] =
    useState<number | null>(null);

  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] =
    useState(0);

  const inFlight = useRef(new Set<number>());

  useEffect(() => {
    const abort = new AbortController();

    async function load() {
      setMode("loading");
      setError("");

      try {
        const session = await getCurrentSession();

        if (abort.signal.aborted) return;

        if (session.status === "guest") {
          setMode("guest");
          setSaved(new Set());
          return;
        }

        if (session.status !== "authenticated") {
          throw new Error("Session unavailable.");
        }

        const requestWishlist = () =>
          fetch("/api/wishlist", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            signal: abort.signal,
          });

        let response = await requestWishlist();

        if (response.status === 401) {
          const again = await getCurrentSession();

          if (abort.signal.aborted) return;

          if (again.status === "guest") {
            setMode("guest");
            return;
          }

          if (again.status !== "authenticated") {
            throw new Error("Session unavailable.");
          }

          response = await requestWishlist();
        }

        if (!response.ok) {
          throw new Error("Wishlist request failed.");
        }

        const data: unknown = await response.json();
        const ids = extractCourseIds(data);

        if (abort.signal.aborted) return;

        setSaved(new Set(ids));
        setMode("ready");
      } catch {
        if (!abort.signal.aborted) {
          setMode("error");
          setError(text[locale].loadError);
        }
      }
    }

    void load();

    return () => abort.abort();
  }, [locale, refreshKey]);

  const retry = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const toggle = useCallback(
    async (courseId: number) => {
      if (mode === "guest") {
        router.push(`/${locale}/login`);
        return;
      }

      if (
        mode !== "ready" ||
        inFlight.current.has(courseId)
      ) {
        return;
      }

      inFlight.current.add(courseId);
      setBusyId(courseId);
      setError("");

      const alreadySaved = saved.has(courseId);

      try {
        const request = () =>
          fetch("/api/wishlist", {
            method: alreadySaved ? "DELETE" : "POST",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ courseId }),
          });

        let response = await request();

        if (response.status === 401) {
          const session = await getCurrentSession();

          if (session.status === "guest") {
            setMode("guest");
            router.push(`/${locale}/login`);
            return;
          }

          if (session.status !== "authenticated") {
            throw new Error("Session unavailable.");
          }

          response = await request();
        }

        if (!response.ok) {
          throw new Error("Wishlist update failed.");
        }

        setSaved((previous) => {
          const next = new Set(previous);

          if (alreadySaved) {
            next.delete(courseId);
          } else {
            next.add(courseId);
          }

          return next;
        });
      } catch {
        setError(text[locale].actionError);
      } finally {
        inFlight.current.delete(courseId);
        setBusyId(null);
      }
    },
    [locale, mode, router, saved]
  );

  const value = useMemo(
    () => ({
      locale,
      mode,
      saved,
      busyId,
      error,
      toggle,
      retry,
    }),
    [locale, mode, saved, busyId, error, toggle, retry]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

function useWishlist() {
  const ctx = useContext(WishlistContext);

  if (!ctx) {
    throw new Error(
      "Wishlist components need WishlistProvider."
    );
  }

  return ctx;
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

export function SaveCourseButton({
  courseId,
}: {
  courseId: number;
}) {
  const {
    locale,
    saved,
    busyId,
    mode,
    toggle,
  } = useWishlist();

  const active = saved.has(courseId);
  const t = text[locale];

  return (
    <button
      type="button"
      className={`${styles.wishlistButton} ${
        active ? styles.wishlistButtonSaved : ""
      }`}
      aria-label={active ? t.remove : t.save}
      aria-pressed={active}
      title={
        mode === "guest"
          ? t.signIn
          : active
            ? t.remove
            : t.save
      }
      disabled={
        mode === "loading" ||
        mode === "error" ||
        busyId === courseId
      }
      onClick={() => void toggle(courseId)}
    >
      <Heart filled={active} />
    </button>
  );
}

export function SavedCoursesLink() {
  const {
    locale,
    saved,
    mode,
    error,
    retry,
  } = useWishlist();

  const t = text[locale];

  return (
    <div className={styles.savedTools}>
      {mode === "error" && (
        <button
          type="button"
          className={styles.wishlistRetry}
          onClick={retry}
        >
          {t.retry}
        </button>
      )}

      <Link
        href={`/${locale}/saved-courses`}
        className={styles.savedLink}
      >
        <Heart filled={false} />
        {t.saved}

        {mode === "ready" && (
          <span>{saved.size}</span>
        )}
      </Link>

      {error && (
        <span
          className={styles.wishlistInlineError}
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
}

function validImageUrl(
  value: string | null
): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);

    return (
      (url.protocol === "https:" ||
        url.protocol === "http:") &&
      ![
        "example.com",
        "www.example.com",
      ].includes(url.hostname.toLowerCase())
    )
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function SavedCoursesList({
  courses,
  failed,
}: {
  courses: SavedCourse[];
  failed: boolean;
}) {
  const {
    locale,
    mode,
    saved,
    retry,
    error,
  } = useWishlist();

  const t = text[locale];

  const selected = courses.filter(
    (course) => saved.has(course.id)
  );

  if (mode === "loading") {
    return (
      <div className={styles.message} role="status">
        {t.loading}
      </div>
    );
  }

  if (mode === "guest") {
    return (
      <div className={styles.message}>
        <h2>{t.signIn}</h2>
        <Link
          href={`/${locale}/login`}
          className={styles.clearLink}
        >
          {t.signIn} →
        </Link>
      </div>
    );
  }

  if (mode === "error") {
    return (
      <div className={styles.message} role="alert">
        <h2>{t.loadError}</h2>

        <button
          className={styles.clearLink}
          type="button"
          onClick={retry}
        >
          {t.retry}
        </button>
      </div>
    );
  }

  if (failed) {
    return (
      <div className={styles.message} role="alert">
        <h2>
          {locale === "ar"
            ? "تعذر تحميل كتالوج الدورات."
            : "Couldn't load the course catalog."}
        </h2>

        <p>
          {locale === "ar"
            ? "حاول تحديث الصفحة."
            : "Please refresh the page."}
        </p>
      </div>
    );
  }

  if (selected.length === 0) {
    return (
      <div className={styles.message}>
        <h2>{t.emptyTitle}</h2>
        <p>{t.emptyDescription}</p>

        {saved.size > 0 && (
          <p>{t.unavailable}</p>
        )}

        <Link
          href={`/${locale}/courses`}
          className={styles.clearLink}
        >
          {t.explore} →
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <p
          role="alert"
          className={styles.wishlistInlineError}
        >
          {error}
        </p>
      )}

      {selected.length < saved.size && (
        <p className={styles.resultsCount}>
          {t.unavailable}
        </p>
      )}

      <div className={styles.courseGrid}>
        {selected.map((course) => {
          const href =
            `/${locale}/courses/` +
            encodeURIComponent(course.slug);

          const image = validImageUrl(
            course.thumbnailUrl
          );

          return (
            <article
              key={course.id}
              className={styles.courseCard}
            >
              <div className={styles.imageWrapper}>
                <Link
                  href={href}
                  className={styles.imageLink}
                  aria-label={`${t.view}: ${course.title}`}
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={course.title}
                      width={600}
                      height={360}
                      unoptimized
                      className={styles.courseImage}
                    />
                  ) : (
                    <div
                      className={styles.imageFallback}
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 64 64"
                        fill="none"
                      >
                        <path d="M12 18c8-4 15-4 20 0 5-4 12-4 20 0v30c-8-4-15-4-20 0-5-4-12-4-20 0V18Z" />
                        <path d="M32 18v30" />
                      </svg>

                      <span>CRESTMARK</span>
                    </div>
                  )}
                </Link>

                <SaveCourseButton
                  courseId={course.id}
                />
              </div>

              <div className={styles.cardBody}>
                {course.categoryName && (
                  <span className={styles.category}>
                    {course.categoryName}
                  </span>
                )}

                <h2 className={styles.courseTitle}>
                  <Link href={href}>
                    {course.title}
                  </Link>
                </h2>

                {course.shortDescription && (
                  <p className={styles.courseDescription}>
                    {course.shortDescription}
                  </p>
                )}

                {(course.level || course.language) && (
                  <div className={styles.meta}>
                    {course.level && (
                      <span>{course.level}</span>
                    )}

                    {course.level &&
                      course.language && (
                        <span
                          className={styles.metaDot}
                        />
                      )}

                    {course.language && (
                      <span>{course.language}</span>
                    )}
                  </div>
                )}

                <Link
                  href={href}
                  className={styles.courseLink}
                >
                  {t.view}
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
