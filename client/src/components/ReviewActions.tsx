
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getCurrentSession } from "@/lib/auth-session";
import styles from "./ReviewActions.module.css";

type Locale = "en" | "ar";

type Review = {
  id: number;
  userId: number;
  rating: number;
  comment: string | null;
};

type Props = {
  courseId: number;
  locale: Locale;
  reviews: Review[];
};

type Access =
  | "checking"
  | "guest"
  | "eligible"
  | "not-enrolled"
  | "error";

type Enrollment = {
  courseId: number;
  enrollmentStatus: string;
};

const copy = {
  en: {
    title: "Share your experience",
    subtitle: "Help other students make an informed decision.",
    rating: "Your rating",
    comment: "Your review",
    placeholder: "What did you think about this course?",
    optional: "Optional",
    submit: "Publish review",
    save: "Save changes",
    saving: "Saving...",
    delete: "Delete",
    deleting: "Deleting...",
    edit: "Edit review",
    cancel: "Cancel",
    own: "You've already reviewed this course.",
    guest: "Sign in to review this course.",
    signIn: "Sign in",
    notEnrolled: "Only enrolled students can submit a review.",
    checking: "Checking review eligibility...",
    checkError: "Unable to verify review eligibility.",
    retry: "Retry",
    selectRating: "Please select a rating.",
    requestError: "Unable to save your review. Please try again.",
    deleteError: "Unable to delete your review.",
    confirmDelete: "Are you sure you want to delete your review?",
    ratingLabel: "Rate this course",
    maxChars: "characters",
  },
  ar: {
    title: "شارك تجربتك",
    subtitle: "ساعد الطلاب الآخرين في اتخاذ قرار مناسب.",
    rating: "تقييمك",
    comment: "تعليقك",
    placeholder: "ما رأيك بهذه الدورة؟",
    optional: "اختياري",
    submit: "نشر التقييم",
    save: "حفظ التعديلات",
    saving: "جارٍ الحفظ...",
    delete: "حذف",
    deleting: "جارٍ الحذف...",
    edit: "تعديل التقييم",
    cancel: "إلغاء",
    own: "لقد قيّمت هذه الدورة مسبقًا.",
    guest: "سجّل الدخول حتى تتمكن من تقييم الدورة.",
    signIn: "تسجيل الدخول",
    notEnrolled: "يمكن للطلاب المسجلين بالدورة فقط إضافة تقييم.",
    checking: "جارٍ التحقق من أهلية التقييم...",
    checkError: "تعذّر التحقق من إمكانية إضافة تقييم.",
    retry: "إعادة المحاولة",
    selectRating: "يرجى اختيار عدد النجوم.",
    requestError: "تعذّر حفظ التقييم. حاول مجددًا.",
    deleteError: "تعذّر حذف التقييم.",
    confirmDelete: "هل أنت متأكد من حذف تقييمك؟",
    ratingLabel: "قيّم هذه الدورة",
    maxChars: "حرف",
  },
} as const;

export default function ReviewActions({
  courseId,
  locale,
  reviews,
}: Props) {
  const t = copy[locale];
  const router = useRouter();

  const [access, setAccess] = useState<Access>("checking");
  const [userId, setUserId] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ownReview =
    userId === null
      ? undefined
      : reviews.find((review) => review.userId === userId);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function checkAccess() {
      setAccess("checking");
      setUserId(null);

      try {
        const session = await getCurrentSession();

        if (cancelled) return;

        if (session.status === "guest") {
          setAccess("guest");
          return;
        }

        if (session.status !== "authenticated") {
          setAccess("error");
          return;
        }

        const id = Number(session.user.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
          setAccess("error");
          return;
        }

        setUserId(id);

        async function fetchEnrollments() {
          return fetch("/api/my-learning", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          });
        }

        let response = await fetchEnrollments();

        if (response.status === 401) {
          const restored = await getCurrentSession();

          if (cancelled) return;

          if (restored.status !== "authenticated") {
            setAccess(
              restored.status === "guest" ? "guest" : "error"
            );
            return;
          }

          response = await fetchEnrollments();
        }

        if (!response.ok) {
          throw new Error("Enrollment request failed.");
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid enrollment response.");
        }

        const eligible = data.some((item: Enrollment) => {
          if (!item || typeof item !== "object") {
            return false;
          }

          return (
            item.courseId === courseId &&
            typeof item.enrollmentStatus === "string" &&
            ["active", "completed"].includes(
              item.enrollmentStatus.toLowerCase()
            )
          );
        });

        if (!cancelled) {
          setAccess(eligible ? "eligible" : "not-enrolled");
        }
      } catch {
        if (!cancelled) setAccess("error");
      }
    }

    void checkAccess();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [courseId, retry]);

  useEffect(() => {
    if (ownReview && !editing) {
      setRating(ownReview.rating);
      setComment(ownReview.comment || "");
    }
  }, [ownReview?.id, ownReview?.rating, ownReview?.comment, editing]);

  async function sendRequest(
    method: "POST" | "PUT" | "DELETE",
    url: string,
    body?: { rating: number; comment: string | null }
  ) {
    const request = () =>
      fetch(url, {
        method,
        credentials: "same-origin",
        cache: "no-store",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });

    let response = await request();

    if (response.status === 401) {
      const session = await getCurrentSession();

      if (session.status !== "authenticated") {
        setAccess(session.status === "guest" ? "guest" : "error");
        return false;
      }

      response = await request();
    }

    return response.ok;
  }

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    if (rating < 1 || rating > 5) {
      setError(t.selectRating);
      return;
    }

    if (!ownReview && access !== "eligible") return;

    setBusy(true);
    setError("");

    try {
      const success = await sendRequest(
        ownReview ? "PUT" : "POST",
        ownReview
          ? `/api/reviews/${ownReview.id}`
          : `/api/reviews/courses/${courseId}`,
        {
          rating,
          comment: comment.trim() || null,
        }
      );

      if (!success) {
        setError(t.requestError);
        return;
      }

      setEditing(false);
      router.refresh();
    } catch {
      setError(t.requestError);
    } finally {
      setBusy(false);
    }
  }

  async function deleteReview() {
    if (!ownReview || busy) return;
    if (!window.confirm(t.confirmDelete)) return;

    setBusy(true);
    setError("");

    try {
      const success = await sendRequest(
        "DELETE",
        `/api/reviews/${ownReview.id}`
      );

      if (!success) {
        setError(t.deleteError);
        return;
      }

      setEditing(false);
      setRating(0);
      setComment("");
      router.refresh();
    } catch {
      setError(t.deleteError);
    } finally {
      setBusy(false);
    }
  }

  function startEditing() {
    if (!ownReview) return;
    setRating(ownReview.rating);
    setComment(ownReview.comment || "");
    setError("");
    setEditing(true);
  }

  if (access === "checking") {
    return (
      <div className={styles.notice} role="status">
        {t.checking}
      </div>
    );
  }

  if (access === "guest") {
    return (
      <div className={styles.notice}>
        <span>{t.guest}</span>
        <Link href={`/${locale}/login`} className={styles.loginLink}>
          {t.signIn}
        </Link>
      </div>
    );
  }

  if (access === "error" && !ownReview) {
    return (
      <div className={styles.notice}>
        <span>{t.checkError}</span>
        <button
          type="button"
          className={styles.textButton}
          onClick={() => setRetry((value) => value + 1)}
        >
          {t.retry}
        </button>
      </div>
    );
  }

  if (!ownReview && access !== "eligible") {
    return (
      <div className={styles.notice}>
        {t.notEnrolled}
      </div>
    );
  }

  if (ownReview && !editing) {
    return (
      <div className={styles.existing}>
        <p>{t.own}</p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={startEditing}
          >
            {t.edit}
          </button>

          <button
            type="button"
            className={styles.dangerButton}
            onClick={() => void deleteReview()}
            disabled={busy}
          >
            {busy ? t.deleting : t.delete}
          </button>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submitReview}>
      <div className={styles.formHeading}>
        <h3>{t.title}</h3>
        <p>{t.subtitle}</p>
      </div>

      <fieldset className={styles.ratingField} disabled={busy}>
        <legend>{t.rating}</legend>

        <div
          className={styles.ratingOptions}
          role="group"
          aria-label={t.ratingLabel}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={
                value <= rating
                  ? styles.starSelected
                  : styles.starButton
              }
              onClick={() => setRating(value)}
              aria-label={`${value} / 5`}
              aria-pressed={rating === value}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>

      <div className={styles.commentField}>
        <label htmlFor={`review-comment-${courseId}`}>
          {t.comment} <span>({t.optional})</span>
        </label>

        <textarea
          id={`review-comment-${courseId}`}
          value={comment}
          onChange={(event) =>
            setComment(event.target.value.slice(0, 1000))
          }
          placeholder={t.placeholder}
          maxLength={1000}
          rows={4}
          disabled={busy}
        />

        <span className={styles.counter}>
          {comment.length}/1000 {t.maxChars}
        </span>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={busy || rating === 0}
        >
          {busy ? t.saving : ownReview ? t.save : t.submit}
        </button>

        {ownReview && (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => {
              setEditing(false);
              setError("");
            }}
            disabled={busy}
          >
            {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
