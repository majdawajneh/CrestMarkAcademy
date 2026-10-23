"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./page.module.css";
type Lesson = {
  id: number;
  title: string;
  description: string | null;
  lessonType: string;
  durationSeconds: number;
  orderIndex: number;
  isPreview: boolean;
  isLocked: boolean;
  videoUrl: string | null;
  audioUrl: string | null;
  content: string | null;
};
type Section = {
  id: number;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: Lesson[];
};
type CourseContent = {
  courseId: number;
  title: string;
  slug: string;
  isEnrolled: boolean;
  sections: Section[];
};
type CourseProgress = {
  courseId: number;
  enrollmentId: number;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  isCourseCompleted: boolean;
};
type CourseCertificate = {
  id: number;
  enrollmentId: number;
  certificateNumber: string;
  certificateUrl: string | null;
  issuedAt: string;
};
type CertificateState =
  | "idle"
  | "loading"
  | "issued"
  | "pending"
  | "error";
type LessonProgress = {
  id?: number;
  enrollmentId?: number;
  lessonId: number;
  isCompleted: boolean;
  completedAt: string | null;
  lastPositionSeconds: number;
  updatedAt?: string;
};
type LastLessonResponse = {
  courseId: number;
  lastAccessedLessonId: number | null;
};
type LoadStatus =
  | "loading"
  | "ready"
  | "error"
  | "unauthorized"
  | "forbidden";
type ProgressState =
  | { status: "loaded"; data: LessonProgress | null }
  | { status: "unavailable"; data: null };
const words = {
  en: {
    back: "My Learning",
    curriculum: "Course content",
    lesson: "Lesson",
    of: "of",
    progress: "Your progress",
    completed: "completed",
    mark: "Mark as completed",
    saving: "Saving...",
    marked: "Lesson completed",
    next: "Next lesson",
    previous: "Previous lesson",
    locked: "This lesson is locked.",
    unavailable: "Learning material isn't available yet.",
    loading: "Preparing your learning space...",
    error: "Couldn't load this course.",
    unauthorized: "Please log in to access your lessons.",
    forbidden: "You don't have access to this course.",
    retry: "Try again",
    login: "Log in",
    saveError: "Couldn't save your progress. Please try again.",
    noLessons: "No lessons have been added to this course yet.",
    description: "About this lesson",
    preview: "Preview",
    progressError: "Lesson progress couldn't be loaded.",
    retryProgress: "Retry progress",
    lessonsCount: "lessons",
    lessonSaveError:
      "Couldn't save your lesson selection. Please try again.",
    lastLessonError:
      "Couldn't restore your last lesson. The first available lesson is shown.",
    completionEyebrow: "ACHIEVEMENT UNLOCKED",
    completionTitle: "Course completed!",
    completionDescription:
      "Congratulations! You've successfully completed every lesson in this course.",
    completionSummary: "Your achievement",
    completionAllLessons: "lessons completed",
    completionBack: "Explore my learning",
    viewCertificate: "View certificate",
    downloadCertificate: "Download PDF",
    downloadingCertificate: "Downloading...",
    certificatePending: "Your certificate has not been issued yet. Please check again shortly.",
    certificateError: "Could not load your certificate right now.",
    certificateRetry: "Check again",
    certificateDownloadError: "Could not download the certificate. Please try again.",
  },
  ar: {
    back: "دوراتي",
    curriculum: "محتوى الدورة",
    lesson: "الدرس",
    of: "من",
    progress: "تقدمك في الدورة",
    completed: "مكتملة",
    mark: "تحديد الدرس كمكتمل",
    saving: "جارٍ الحفظ...",
    marked: "تم إكمال الدرس",
    next: "الدرس التالي",
    previous: "الدرس السابق",
    locked: "هذا الدرس مقفل.",
    unavailable: "المحتوى التعليمي غير متوفر بعد.",
    loading: "جارٍ تجهيز مساحة التعلم...",
    error: "تعذّر تحميل الدورة.",
    unauthorized: "سجّل الدخول للوصول إلى الدروس.",
    forbidden: "ليس لديك صلاحية الوصول لهذه الدورة.",
    retry: "إعادة المحاولة",
    login: "تسجيل الدخول",
    saveError: "تعذّر حفظ تقدمك. حاول مرة أخرى.",
    noLessons: "لم تتم إضافة دروس لهذه الدورة بعد.",
    description: "عن هذا الدرس",
    preview: "معاينة",
    progressError: "تعذّر تحميل تقدم الدرس.",
    retryProgress: "إعادة تحميل التقدم",
    lessonsCount: "دروس",
    lessonSaveError:
      "تعذّر حفظ الدرس الذي اخترته. حاول مرة أخرى.",
    lastLessonError:
      "تعذّر استرجاع آخر درس. تم عرض أول درس متاح مؤقتًا.",
    completionEyebrow: "إنجاز جديد",
    completionTitle: "أتممت الدورة بنجاح!",
    completionDescription:
      "تهانينا! لقد أكملت جميع دروس هذه الدورة بنجاح.",
    completionSummary: "إنجازك",
    completionAllLessons: "دروس مكتملة",
    completionBack: "العودة إلى دوراتي",
    viewCertificate: "عرض الشهادة",
    downloadCertificate: "تنزيل PDF",
    downloadingCertificate: "جارٍ التنزيل...",
    certificatePending: "لم تصدر شهادتك بعد. يُرجى التحقق مرة أخرى بعد قليل.",
    certificateError: "تعذّر تحميل شهادتك حاليًا.",
    certificateRetry: "التحقق مجددًا",
    certificateDownloadError: "تعذّر تنزيل الشهادة. حاول مرة أخرى.",
  },
} as const;
function playableUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.hostname === "example.com" ||
      url.hostname.endsWith(".example.com")
    ) {
      return null;
    }
    if (
      url.protocol === "https:" ||
      (url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname))
    ) {
      return url.href;
    }
  } catch {
    return null;
  }
  return null;
}

function getYouTubeEmbedUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return null;
    }

    const host = url.hostname.toLowerCase();
    let videoId: string | null = null;

    if (host === "youtu.be" || host === "www.youtu.be") {
      videoId = url.pathname.split("/")[1] ?? null;
    } else if (
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com"
    ) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v");
      } else if (
        url.pathname.startsWith("/embed/") ||
        url.pathname.startsWith("/shorts/") ||
        url.pathname.startsWith("/live/")
      ) {
        videoId = url.pathname.split("/")[2] ?? null;
      }
    }

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return null;
    }

    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

function formatDuration(seconds: number) {
  const value = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(value / 60)}:${String(
    value % 60
  ).padStart(2, "0")}`;
}
function restoreMediaPosition(
  media: HTMLMediaElement,
  savedSeconds: number
) {
  if (
    !Number.isFinite(savedSeconds) ||
    savedSeconds <= 0 ||
    media.readyState < 1
  ) {
    return;
  }
  const target =
    Number.isFinite(media.duration) && media.duration > 0
      ? Math.min(
          savedSeconds,
          Math.max(0, media.duration - 1)
        )
      : savedSeconds;
  try {
    media.currentTime = target;
  } catch {
    // Seeking might not be supported.
  }
}
function validProgress(
  data: LessonProgress,
  lessonId: number
) {
  return (
    data !== null &&
    typeof data === "object" &&
    data.lessonId === lessonId &&
    typeof data.isCompleted === "boolean" &&
    Number.isInteger(data.lastPositionSeconds) &&
    data.lastPositionSeconds >= 0 &&
    data.lastPositionSeconds <= 2147483647 &&
    (data.updatedAt === undefined ||
      typeof data.updatedAt === "string")
  );
}
function validLastLesson(
  data: unknown,
  courseId: number
): data is LastLessonResponse {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return false;
  }
  const value = data as Record<string, unknown>;
  const lessonId = value.lastAccessedLessonId;
  return (
    value.courseId === courseId &&
    (lessonId === null ||
      (typeof lessonId === "number" &&
        Number.isSafeInteger(lessonId) &&
        lessonId > 0))
  );
}
// Shared client helper for authenticated requests.
// If the access token expires, refresh the session
// through the existing auth mechanism and retry once.
async function authenticatedRequest(
  request: () => Promise<Response>
): Promise<Response> {
  let response = await request();
  if (response.status === 401) {
    const session = await getCurrentSession();
    if (session.status === "authenticated") {
      response = await request();
    }
  }
  return response;
}
function CourseCompletionBanner({
  locale,
  courseTitle,
  completedLessons,
  totalLessons,
  certificate,
  certificateState,
  onRetryCertificate,
  onDownloadCertificate,
  downloadingCertificate,
  certificateDownloadError,
}: {
  locale: "ar" | "en";
  courseTitle: string;
  completedLessons: number;
  totalLessons: number;
  certificate: CourseCertificate | null;
  certificateState: CertificateState;
  onRetryCertificate: () => void;
  onDownloadCertificate: () => void;
  downloadingCertificate: boolean;
  certificateDownloadError: string;
}) {
  const t = words[locale];
  return (
    <section
      aria-labelledby="course-completion-title"
      style={{
        padding: "clamp(20px, 4vw, 34px)",
        marginBottom: 28,
        borderRadius: 18,
        border: "1px solid #cfdfef",
        backgroundColor: "#f1f7fd",
        color: "#12365b",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 58,
            height: 58,
            borderRadius: 16,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            backgroundColor: "#ffffff",
            color: "#1969b5",
            border: "1px solid #d7e6f5",
          }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 8 9-5 9 5-9 5-9-5Z" />
            <path d="M7 10.2V15c0 2.3 2.5 4 5 4s5-1.7 5-4v-4.8" />
            <path d="M21 8v7" />
          </svg>
        </div>
        <div style={{ flex: "1 1 270px", minWidth: 0 }}>
          <p
            style={{
              margin: "0 0 8px",
              color: "#3475a9",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
            }}
          >
            {t.completionEyebrow}
          </p>
          <h2
            id="course-completion-title"
            style={{
              margin: "0 0 10px",
              fontSize: "clamp(22px, 3vw, 30px)",
              lineHeight: 1.3,
              fontWeight: 800,
              color: "#12365b",
            }}
          >
            {t.completionTitle}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.8,
              color: "#4c647e",
            }}
          >
            {t.completionDescription}
          </p>
        </div>
      </div>
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #dbe7f2",
          borderRadius: 12,
          padding: "18px 20px",
          marginTop: 24,
        }}
      >
        <p
          style={{
            margin: "0 0 6px",
            fontSize: 12,
            color: "#688099",
          }}
        >
          {t.completionSummary}
        </p>
        <strong
          style={{
            display: "block",
            color: "#173e65",
            fontSize: 16,
            lineHeight: 1.5,
          }}
        >
          {courseTitle}
        </strong>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 18,
            marginBottom: 9,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <span>
            {completedLessons}/{totalLessons}{" "}
            {t.completionAllLessons}
          </span>
          <span style={{ color: "#176bb1" }}>100%</span>
        </div>
        <div
          role="progressbar"
          aria-label={t.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={100}
          style={{
            width: "100%",
            height: 7,
            borderRadius: 999,
            backgroundColor: "#e4edf6",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 999,
              backgroundColor: "#2078be",
            }}
          />
        </div>
      </div>
      <div style={{ marginTop: 18, padding: "18px 20px", background: "#fff", border: "1px solid #dbe7f2", borderRadius: 12 }}>
        {certificateState === "issued" && certificate ? (
          <>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#688099" }}>
              {certificate.certificateNumber}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href={`/${locale}/my-certificates/${certificate.id}`}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "11px 18px", borderRadius: 9, background: "#153e68", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
                {t.viewCertificate}
              </Link>
              <button type="button" onClick={onDownloadCertificate} disabled={downloadingCertificate}
                style={{ padding: "11px 18px", borderRadius: 9, border: "1px solid #b7cfe4", background: "#fff", color: "#153e68", fontWeight: 700, fontSize: 13, cursor: downloadingCertificate ? "wait" : "pointer" }}>
                {downloadingCertificate ? t.downloadingCertificate : t.downloadCertificate}
              </button>
            </div>
            {certificateDownloadError && (
              <p role="alert" style={{ color: "#ad3f42", fontSize: 12, margin: "12px 0 0" }}>
                {certificateDownloadError}
              </p>
            )}
          </>
        ) : (
          <div role="status" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ color: "#5a7187", fontSize: 13 }}>
              {certificateState === "loading" || certificateState === "idle"
                ? (locale === "ar" ? "جارٍ التحقق من الشهادة..." : "Checking certificate...")
                : certificateState === "pending" ? t.certificatePending : t.certificateError}
            </span>
            {(certificateState === "pending" || certificateState === "error") && (
              <button type="button" onClick={onRetryCertificate}
                style={{ padding: "8px 12px", border: "1px solid #b7cfe4", borderRadius: 8, color: "#153e68", background: "#fff", cursor: "pointer" }}>
                {t.certificateRetry}
              </button>
            )}
          </div>
        )}
      </div>
      <div style={{ marginTop: 18 }}>
        <Link
          href={`/${locale}/my-learning`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "11px 18px",
            borderRadius: 9,
            backgroundColor: "#153e68",
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {t.completionBack}
        </Link>
      </div>
    </section>
  );
}
function LearnCourseContent() {
  const params = useParams<{
    locale: string;
    slug: string;
  }>();
  const locale = params.locale === "ar" ? "ar" : "en";
  const t = words[locale];
  const [course, setCourse] =
    useState<CourseContent | null>(null);
  const [progress, setProgress] =
    useState<CourseProgress | null>(null);
  const [lessonProgress, setLessonProgress] =
    useState<Record<number, ProgressState>>({});
  const [selectedId, setSelectedId] =
    useState<number | null>(null);
  const [status, setStatus] =
    useState<LoadStatus>("loading");
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [progressAttempt, setProgressAttempt] = useState(0);
  const [certificateResult, setCertificateResult] = useState<{
    enrollmentId: number;
    state: "issued" | "pending" | "error";
    certificate: CourseCertificate | null;
  } | null>(null);
  const [certificateAttempt, setCertificateAttempt] = useState(0);
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);
  const [certificateDownloadError, setCertificateDownloadError] = useState("");
  const certificateDownloadingRef = useRef(false);
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  // Positions saved to the backend.
  const lastSavedRef =
    useRef<Record<number, number>>({});
  // Serialize position updates per lesson.
  const saveQueueRef =
    useRef<Record<number, Promise<void>>>({});
  const periodicRef =
    useRef<Record<number, number>>({});
  // Prevent overlapping manual lesson selections.
  const switchingRef = useRef(false);
  // Prevent stale requests from a previous course load
  // from applying to a newer load.
  const loadVersionRef = useRef(0);
  const loadContent = useCallback(async () => {
    const response = await authenticatedRequest(() =>
      fetch(
        `/api/learning/courses/${encodeURIComponent(params.slug)}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        }
      )
    );
    if (response.status === 401) {
      return { status: "unauthorized" as const };
    }
    if (response.status === 403) {
      return { status: "forbidden" as const };
    }
    if (!response.ok) {
      throw new Error("Course unavailable");
    }
    const data: CourseContent = await response.json();
    if (
      !data ||
      data.isEnrolled !== true ||
      !Array.isArray(data.sections)
    ) {
      throw new Error("Invalid course content");
    }
    const sections = [...data.sections]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((section) => ({
        ...section,
        lessons: [...section.lessons].sort(
          (a, b) => a.orderIndex - b.orderIndex
        ),
      }));
    return {
      status: "ready" as const,
      course: { ...data, sections },
    };
  }, [params.slug]);
  // =====================================
  // GET Last Accessed Lesson
  // =====================================
  const getLastLesson = useCallback(
    async (
      courseId: number
    ): Promise<LastLessonResponse> => {
      const response = await authenticatedRequest(() =>
        fetch(
          `/api/my-learning/${courseId}/last-lesson`,
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          }
        )
      );
      if (!response.ok) {
        throw new Error("Unable to restore last lesson");
      }
      const data: unknown = await response.json();
      if (!validLastLesson(data, courseId)) {
        throw new Error("Invalid last lesson response");
      }
      return data;
    },
    []
  );
  // =====================================
  // PUT Last Accessed Lesson
  // =====================================
  const saveLastLesson = useCallback(
    async (
      courseId: number,
      lessonId: number
    ): Promise<boolean> => {
      try {
        const response = await authenticatedRequest(() =>
          fetch(
            `/api/my-learning/${courseId}/last-lesson`,
            {
              method: "PUT",
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ lessonId }),
            }
          )
        );
        if (!response.ok) {
          return false;
        }
        const data: unknown = await response.json();
        return (
          validLastLesson(data, courseId) &&
          data.lastAccessedLessonId === lessonId
        );
      } catch {
        return false;
      }
    },
    []
  );
  // =====================================
  // Course Progress
  // =====================================
  const reloadProgress = useCallback(
    async (courseId: number) => {
      try {
        const response = await authenticatedRequest(() =>
          fetch(
            `/api/my-learning/${courseId}/progress`,
            {
              credentials: "same-origin",
              cache: "no-store",
            }
          )
        );
        if (!response.ok) return;
        const data: CourseProgress = await response.json();
        if (
          data.courseId === courseId &&
          Number.isFinite(data.progressPercentage) &&
          data.progressPercentage >= 0 &&
          data.progressPercentage <= 100
        ) {
          setProgress(data);
        }
      } catch {
        // Keep previously loaded progress.
      }
    },
    []
  );
  // =====================================
  // Individual Lesson Progress
  // =====================================
  const fetchLessonProgress = useCallback(
    async (lessonId: number): Promise<ProgressState> => {
      try {
        const response = await authenticatedRequest(() =>
          fetch(
            `/api/learning/lessons/${lessonId}/progress`,
            {
              method: "GET",
              credentials: "same-origin",
              cache: "no-store",
            }
          )
        );
        if (response.status === 404) {
          return {
            status: "loaded",
            data: null,
          };
        }
        if (!response.ok) {
          return {
            status: "unavailable",
            data: null,
          };
        }
        const data: LessonProgress =
          await response.json();
        if (!validProgress(data, lessonId)) {
          return {
            status: "unavailable",
            data: null,
          };
        }
        return {
          status: "loaded",
          data,
        };
      } catch {
        return {
          status: "unavailable",
          data: null,
        };
      }
    },
    []
  );
  // =====================================
  // Initialize Course + Restore Last Lesson
  // =====================================
  useEffect(() => {
    let cancelled = false;
    const version = ++loadVersionRef.current;
    async function initialize() {
      try {
        const result = await loadContent();
        if (
          cancelled ||
          version !== loadVersionRef.current
        ) {
          return;
        }
        if (
          result.status !== "ready" ||
          !result.course
        ) {
          setStatus(result.status);
          return;
        }
        const nextCourse = result.course;
        const accessible = nextCourse.sections
          .flatMap((section) => section.lessons)
          .filter((item) => !item.isLocked);
        // Only used when the student has never
        // selected a lesson or its saved lesson
        // is no longer accessible.
        let initialId = accessible[0]?.id ?? null;
        let restoreFailed = false;
        try {
          const restored = await getLastLesson(
            nextCourse.courseId
          );
          if (
            restored.lastAccessedLessonId !== null &&
            accessible.some(
              (item) =>
                item.id ===
                restored.lastAccessedLessonId
            )
          ) {
            initialId =
              restored.lastAccessedLessonId;
          }
        } catch {
          restoreFailed = true;
        }
        if (
          cancelled ||
          version !== loadVersionRef.current
        ) {
          return;
        }
        // Do NOT save the fallback automatically.
        // Only explicit lesson selection changes
        // LastAccessedLessonId in the backend.
        lastSavedRef.current = {};
        periodicRef.current = {};
        saveQueueRef.current = {};
        switchingRef.current = false;
        setCourse(nextCourse);
        setSelectedId(initialId);
        setLessonProgress({});
        setProgress(null);
        setSaving(false);
        setSwitching(false);
        setError(
          restoreFailed ? t.lastLessonError : ""
        );
        setStatus("ready");
      } catch {
        if (
          !cancelled &&
          version === loadVersionRef.current
        ) {
          setStatus("error");
        }
      }
    }
    void initialize();
    return () => {
      cancelled = true;
    };
  }, [loadContent, getLastLesson, attempt, t.lastLessonError]);
  // =====================================
  // Restore progress without selecting lessons
  // =====================================
  
useEffect(() => {
  if (!course || status !== "ready") return;

  const currentCourse = course;
  let cancelled = false;

  async function restore() {

      const accessible = currentCourse.sections
        .flatMap((section) => section.lessons)
        .filter((item) => !item.isLocked);
      const restored: Record<number, ProgressState> = {};
      for (let i = 0; i < accessible.length; i += 5) {
        if (cancelled) return;
        const batch = accessible.slice(i, i + 5);
        const results = await Promise.all(
          batch.map(async (item) => ({
            id: item.id,
            result: await fetchLessonProgress(item.id),
          }))
        );
        if (cancelled) return;
        for (const item of results) {
          restored[item.id] = item.result;
        }
      }
      if (cancelled) return;
      setLessonProgress((previous) => ({
        ...previous,
        ...restored,
      }));
      for (const item of accessible) {
        const saved = restored[item.id];
        if (
          saved?.status === "loaded" &&
          saved.data
        ) {
          lastSavedRef.current[item.id] =
            saved.data.lastPositionSeconds;
        }
      }
      // Deliberately no setSelectedId() here.
      // Video progress must never change
      // the student's selected lesson.
      if (!cancelled) {
        void reloadProgress(currentCourse.courseId);
      }
    }
    void restore();
    
    return () => {
      cancelled = true;
    };
  }, [
    course,
    status,
    progressAttempt,
    fetchLessonProgress,
    reloadProgress,
  ]);
  // Load the certificate for the exact completed enrollment only.
  const completedEnrollmentId =
    course &&
    progress?.courseId === course.courseId &&
    progress.isCourseCompleted &&
    progress.totalLessons > 0 &&
    progress.completedLessons === progress.totalLessons
      ? progress.enrollmentId
      : null;

  // Keep certificate UI scoped to the current enrollment.
  // The previous enrollment's certificate/status must never appear here.
  const currentCertificateResult =
    certificateResult?.enrollmentId === completedEnrollmentId
      ? certificateResult
      : null;
  const courseCertificate = currentCertificateResult?.certificate ?? null;
  const certificateState: CertificateState =
    completedEnrollmentId === null
      ? "idle"
      : currentCertificateResult?.state ?? "loading";

  useEffect(() => {
    if (completedEnrollmentId === null) return;

    let cancelled = false;
    const enrollmentId = completedEnrollmentId;

    async function loadCertificate() {
      try {
        const response = await authenticatedRequest(() =>
          fetch("/api/certificates/my", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          })
        );

        if (cancelled) return;

        if (!response.ok) {
          setCertificateResult({
            enrollmentId,
            state: "error",
            certificate: null,
          });
          return;
        }

        const data: unknown = await response.json();
        if (cancelled) return;

        if (!Array.isArray(data)) {
          setCertificateResult({
            enrollmentId,
            state: "error",
            certificate: null,
          });
          return;
        }

        const matched = data.find((item: unknown) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return false;
          }

          const value = item as Record<string, unknown>;
          return (
            value.enrollmentId === enrollmentId &&
            typeof value.id === "number" &&
            Number.isSafeInteger(value.id) &&
            value.id > 0 &&
            typeof value.certificateNumber === "string" &&
            value.certificateNumber.trim().length > 0
          );
        }) as CourseCertificate | undefined;

        setCertificateResult({
          enrollmentId,
          state: matched ? "issued" : "pending",
          certificate: matched ?? null,
        });
        setCertificateDownloadError("");
      } catch {
        if (!cancelled) {
          setCertificateResult({
            enrollmentId,
            state: "error",
            certificate: null,
          });
        }
      }
    }

    void loadCertificate();
    return () => {
      cancelled = true;
    };
  }, [completedEnrollmentId, certificateAttempt]);

  async function downloadCertificate() {
    if (!courseCertificate || certificateDownloadingRef.current) return;
    certificateDownloadingRef.current = true;
    setDownloadingCertificate(true);
    setCertificateDownloadError("");
    const certificate = courseCertificate;
    try {
      const request = () => fetch(`/api/certificates/my/${certificate.id}/download`, {
        method: "GET", credentials: "same-origin", cache: "no-store",
        headers: { Accept: "application/pdf" },
      });
      const response = await authenticatedRequest(request);
      if (!response.ok || !(response.headers.get("content-type") ?? "").toLowerCase().includes("application/pdf")) {
        throw new Error("Unable to download certificate");
      }
      const blob = await response.blob();
      if ((await blob.slice(0, 5).text()) !== "%PDF-") throw new Error("Invalid PDF");
      const safeNumber = /^[A-Za-z0-9-]+$/.test(certificate.certificateNumber)
        ? certificate.certificateNumber : String(certificate.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CrestMark-Certificate-${safeNumber}.pdf`;
      document.body.appendChild(link);
      try { link.click(); } finally {
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch {
      setCertificateDownloadError(t.certificateDownloadError);
    } finally {
      certificateDownloadingRef.current = false;
      setDownloadingCertificate(false);
    }
  }

  const lessons =
    course?.sections.flatMap(
      (section) => section.lessons
    ) ?? [];
  const selectedIndex = lessons.findIndex(
    (item) => item.id === selectedId
  );
  const lesson =
    selectedIndex >= 0
      ? lessons[selectedIndex]
      : null;
  const currentState = lesson
    ? lessonProgress[lesson.id]
    : undefined;
  const currentProgress =
    currentState?.data ?? null;
  const savedPosition =
    currentProgress?.lastPositionSeconds ?? 0;
  // Restore the media position after progress loads.
  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !currentProgress) return;
    restoreMediaPosition(
      media,
      currentProgress.lastPositionSeconds
    );
  }, [selectedId, currentProgress]);
  const doneNow =
    currentProgress?.isCompleted === true;
  const progressUnavailable =
    currentState?.status === "unavailable";
  const progressLoading = !currentState;
  const next =
    selectedIndex >= 0
      ? lessons
          .slice(selectedIndex + 1)
          .find((item) => !item.isLocked)
      : undefined;
  const previous =
    selectedIndex >= 0
      ? lessons
          .slice(0, selectedIndex)
          .reverse()
          .find((item) => !item.isLocked)
      : undefined;
  const video = lesson
    ? playableUrl(lesson.videoUrl)
    : null;
  const youtubeEmbed = getYouTubeEmbedUrl(video);
  const audio = lesson
    ? playableUrl(lesson.audioUrl)
    : null;
  const kind = lesson?.lessonType.toLowerCase();
  // =====================================
  // PUT Individual Lesson Progress
  // =====================================
  const updateProgress = useCallback(
    async (
      lessonId: number,
      position: number,
      isCompleted: boolean
    ) => {
      const response = await authenticatedRequest(() =>
        fetch(
          `/api/learning/lessons/${lessonId}/progress`,
          {
            method: "PUT",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lastPositionSeconds: position,
              isCompleted,
            }),
          }
        )
      );
      return response.ok;
    },
    []
  );
  // =====================================
  // Auto-Save Playback Position
  // =====================================
  const savePlaybackPosition = useCallback(
    (
      lessonId: number,
      position: number,
      isCompleted: boolean
    ) => {
      if (!Number.isFinite(position)) return;
      const seconds = Math.min(
        2147483647,
        Math.max(0, Math.floor(position))
      );
      if (
        lastSavedRef.current[lessonId] === seconds
      ) {
        return;
      }
      const pending =
        saveQueueRef.current[lessonId] ??
        Promise.resolve();
      const nextSave = pending
        .catch(() => undefined)
        .then(async () => {
          if (
            lastSavedRef.current[lessonId] === seconds
          ) {
            return;
          }
          try {
            const successful = await updateProgress(
              lessonId,
              seconds,
              isCompleted
            );
            if (successful) {
              lastSavedRef.current[lessonId] =
                seconds;
            }
          } catch {
            // Retry at the next checkpoint or pause.
          }
        });
      saveQueueRef.current[lessonId] =
        nextSave;
    },
    [updateProgress]
  );
  function handleMediaPause(
    media: HTMLMediaElement
  ) {
    if (
      !lesson ||
      lesson.isLocked ||
      currentState?.status !== "loaded"
    ) {
      return;
    }
    savePlaybackPosition(
      lesson.id,
      media.currentTime,
      currentProgress?.isCompleted ?? false
    );
  }
  function handleMediaTimeUpdate(
    media: HTMLMediaElement
  ) {
    if (
      !lesson ||
      lesson.isLocked ||
      currentState?.status !== "loaded" ||
      media.paused
    ) {
      return;
    }
    const seconds = Math.floor(
      media.currentTime
    );
    const previousCheckpoint =
      periodicRef.current[lesson.id] ?? 0;
    if (
      seconds < previousCheckpoint ||
      seconds - previousCheckpoint >= 15
    ) {
      periodicRef.current[lesson.id] =
        seconds;
      savePlaybackPosition(
        lesson.id,
        seconds,
        currentProgress?.isCompleted ?? false
      );
    }
  }
  function handleMediaEnded(
    media: HTMLMediaElement
  ) {
    if (
      !lesson ||
      lesson.isLocked ||
      currentState?.status !== "loaded"
    ) {
      return;
    }
    savePlaybackPosition(
      lesson.id,
      media.currentTime,
      currentProgress?.isCompleted ?? false
    );
  }
  // =====================================
  // Explicit Lesson Navigation
  // =====================================
  async function chooseLesson(id: number) {
    if (!course || switchingRef.current || saving) {
      return;
    }
    const target = lessons.find(
      (item) => item.id === id
    );
    if (!target || target.isLocked) {
      return;
    }
    if (selectedId === id) {
      return;
    }
    // Lock immediately, not only after React rerenders.
    switchingRef.current = true;
    setSwitching(true);
    setError("");
    try {
      // Pause the current lesson so its playback
      // position enters the save queue.
      mediaRef.current?.pause();
      // Store the newly selected lesson in the DB.
      const successful = await saveLastLesson(
        course.courseId,
        id
      );
      if (!successful) {
        setError(t.lessonSaveError);
        return;
      }
      // Switch only after the backend confirms.
      setSelectedId(id);
      setError("");
    } catch {
      setError(t.lessonSaveError);
    } finally {
      switchingRef.current = false;
      setSwitching(false);
    }
  }
  // =====================================
  // Mark Lesson as Completed
  // =====================================
  async function completeLesson() {
    if (
      !lesson ||
      lesson.isLocked ||
      saving ||
      switching ||
      doneNow ||
      progressLoading ||
      progressUnavailable
    ) {
      return;
    }
    const lessonId = lesson.id;
    const position =
      mediaRef.current?.currentTime ?? 0;
    const seconds = Number.isFinite(position)
      ? Math.min(
          2147483647,
          Math.max(0, Math.floor(position))
        )
      : 0;
    setSaving(true);
    setError("");
    try {
      await (
        saveQueueRef.current[lessonId] ??
        Promise.resolve()
      );
      const successful = await updateProgress(
        lessonId,
        seconds,
        true
      );
      if (!successful) {
        setError(t.saveError);
        return;
      }
      const saved = await fetchLessonProgress(
        lessonId
      );
      if (
        saved.status === "loaded" &&
        saved.data
      ) {
        setLessonProgress((previous) => ({
          ...previous,
          [lessonId]: saved,
        }));
        lastSavedRef.current[lessonId] =
          saved.data.lastPositionSeconds;
      } else {
        setLessonProgress((previous) => ({
          ...previous,
          [lessonId]: {
            status: "unavailable",
            data: null,
          },
        }));
        setError(t.progressError);
      }
      if (course) {
        await reloadProgress(course.courseId);
      }
    } catch {
      setError(t.saveError);
    } finally {
      setSaving(false);
    }
  }
  function retryProgress() {
    setProgressAttempt((value) => value + 1);
  }
  // =====================================
  // Loading / Error State
  // =====================================
  if (status !== "ready" || !course) {
    return (
      <main className={styles.page}>
        <div className={styles.centerState}>
          <h1>
            {status === "loading"
              ? t.loading
              : status === "unauthorized"
                ? t.unauthorized
                : status === "forbidden"
                  ? t.forbidden
                  : t.error}
          </h1>
          {status === "error" && (
            <button
              type="button"
              className={styles.primary}
              onClick={() => {
                setStatus("loading");
                setAttempt((value) => value + 1);
              }}
            >
              {t.retry}
            </button>
          )}
          {status === "unauthorized" && (
            <Link
              className={styles.primary}
              href={`/${locale}/login`}
            >
              {t.login}
            </Link>
          )}
          <Link href={`/${locale}/my-learning`}>
            {t.back}
          </Link>
        </div>
      </main>
    );
  }
  // =====================================
  // Learning Player UI
  // =====================================
  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <Link
          href={`/${locale}/my-learning`}
          className={styles.back}
        >
          <span aria-hidden="true">
            {locale === "ar" ? "→" : "←"}
          </span>{" "}
          {t.back}
        </Link>
        <span className={styles.courseName}>
          {course.title}
        </span>
      </div>
<div className={styles.workspace}>
  <div className={styles.mainColumn}>
    {progress?.isCourseCompleted === true &&
      progress.totalLessons > 0 && (
        <CourseCompletionBanner
          locale={locale}
          courseTitle={course.title}
          completedLessons={progress.completedLessons}
          totalLessons={progress.totalLessons}
          certificate={courseCertificate}
          certificateState={certificateState}
          onRetryCertificate={() => setCertificateAttempt((value) => value + 1)}
          onDownloadCertificate={() => { void downloadCertificate(); }}
          downloadingCertificate={downloadingCertificate}
          certificateDownloadError={certificateDownloadError}
        />
      )}
    {lesson ? (
            <>
              <div className={styles.lessonHeading}>
                <span className={styles.eyebrow}>
                  {t.lesson} {selectedIndex + 1}{" "}
                  {t.of} {lessons.length}
                </span>
                <h1>{lesson.title}</h1>
              </div>
              <div className={styles.player}>
                {lesson.isLocked ? (
                  <div
                    className={styles.playerPlaceholder}
                  >
                    {t.locked}
                  </div>
                
) : kind === "video" && video ? (
  youtubeEmbed ? (
    <iframe
      key={lesson.id}
      src={youtubeEmbed}
      title={lesson.title}
      className={styles.media}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        border: 0,
        aspectRatio: "16 / 9",
      }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  ) : (
    <video
      key={lesson.id}
      ref={(node) => {
        mediaRef.current = node;
      }}
      className={styles.media}
      src={video}
      controls
      controlsList="nodownload"
      preload="metadata"
      onLoadedMetadata={(event) => {
        restoreMediaPosition(
          event.currentTarget,
          savedPosition
        );
      }}
      onTimeUpdate={(event) => {
        handleMediaTimeUpdate(
          event.currentTarget
        );
      }}
      onPause={(event) => {
        handleMediaPause(
          event.currentTarget
        );
      }}
      onEnded={(event) => {
        handleMediaEnded(
          event.currentTarget
        );
      }}
    />
  )

                  
                ) : kind === "audio" && audio ? (
                  <div className={styles.audioArea}>
                    <span className={styles.audioMark}>
                      ♪
                    </span>
                    <audio
                      key={lesson.id}
                      ref={(node) => {
                        mediaRef.current = node;
                      }}
                      src={audio}
                      controls
                      preload="metadata"
                      onLoadedMetadata={(event) => {
                        restoreMediaPosition(
                          event.currentTarget,
                          savedPosition
                        );
                      }}
                      onTimeUpdate={(event) => {
                        handleMediaTimeUpdate(
                          event.currentTarget
                        );
                      }}
                      onPause={(event) => {
                        handleMediaPause(
                          event.currentTarget
                        );
                      }}
                      onEnded={(event) => {
                        handleMediaEnded(
                          event.currentTarget
                        );
                      }}
                    />
                  </div>
                ) : kind === "text" &&
                  lesson.content ? (
                  <div className={styles.textLesson}>
                    {lesson.content}
                  </div>
                ) : (
                  <div
                    className={styles.playerPlaceholder}
                  >
                    {t.unavailable}
                  </div>
                )}
              </div>
              {lesson.description && (
                <section className={styles.description}>
                  <h2>{t.description}</h2>
                  <p>{lesson.description}</p>
                </section>
              )}
              <div className={styles.lessonActions}>
                <div className={styles.navigation}>
                  <button
                    type="button"
                    disabled={
                      !previous ||
                      saving ||
                      switching
                    }
                    onClick={() => {
                      if (previous) {
                        void chooseLesson(previous.id);
                      }
                    }}
                  >
                    {t.previous}
                  </button>
                  <button
                    type="button"
                    disabled={
                      !next ||
                      saving ||
                      switching
                    }
                    onClick={() => {
                      if (next) {
                        void chooseLesson(next.id);
                      }
                    }}
                  >
                    {t.next}
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={
                    saving ||
                    switching ||
                    doneNow ||
                    lesson.isLocked ||
                    progressLoading ||
                    progressUnavailable
                  }
                  onClick={completeLesson}
                >
                  {saving
                    ? t.saving
                    : doneNow
                      ? t.marked
                      : t.mark}
                </button>
              </div>
              {progressUnavailable && (
                <div
                  className={styles.error}
                  role="status"
                >
                  {t.progressError}{" "}
                  <button
                    type="button"
                    onClick={retryProgress}
                  >
                    {t.retryProgress}
                  </button>
                </div>
              )}
              {error && !progressUnavailable && (
                <p
                  className={styles.error}
                  role="alert"
                >
                  {error}
                </p>
              )}
            </>
          ) : (
            <div className={styles.centerState}>
              <h1>{t.noLessons}</h1>
            </div>
          )}
        </div>
        <aside className={styles.sidebar}>
          <div className={styles.sideHeader}>
            <h2>{t.curriculum}</h2>
            <span>
              {lessons.length} {t.lessonsCount}
            </span>
          </div>
          {progress && (
            <div className={styles.progressBox}>
              <div className={styles.progressLabels}>
                <span>{t.progress}</span>
                <strong>
                  {Math.round(
                    progress.progressPercentage
                  )}
                  %
                </strong>
              </div>
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={
                  progress.progressPercentage
                }
                aria-label={t.progress}
              >
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        progress.progressPercentage
                      )
                    )}%`,
                  }}
                />
              </div>
              <p>
                {progress.completedLessons} /{" "}
                {progress.totalLessons} {t.completed}
              </p>
            </div>
          )}
          <div className={styles.sections}>
            {course.sections.map((section) => (
              <section
                key={section.id}
                className={styles.section}
              >
                <h3>{section.title}</h3>
                {section.lessons.map((item) => {
                  const saved =
                    lessonProgress[item.id];
                  const isDone =
                    saved?.data?.isCompleted === true;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.lessonItem} ${
                        selectedId === item.id
                          ? styles.current
                          : ""
                      }`}
                      onClick={() => {
                        void chooseLesson(item.id);
                      }}
                      disabled={
                        item.isLocked ||
                        saving ||
                        switching
                      }
                      aria-current={
                        selectedId === item.id
                          ? "true"
                          : undefined
                      }
                    >
                      <span
                        className={styles.lessonSymbol}
                      >
                        {item.isLocked
                          ? "🔒"
                          : isDone
                            ? "✓"
                            : "▶"}
                      </span>
                      <span className={styles.lessonText}>
                        <span>{item.title}</span>
                        <small>
                          {formatDuration(
                            item.durationSeconds
                          )}
                          {item.isPreview
                            ? ` · ${t.preview}`
                            : ""}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </section>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
export default function LearnCoursePage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.centerState}>
            <p>Loading your learning space...</p>
          </div>
        </main>
      }
    >
      <LearnCourseContent />
    </Suspense>
  );
}
