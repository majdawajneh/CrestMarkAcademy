
import { Suspense } from "react";
import styles from "./CourseCurriculum.module.css";

type Locale = "en" | "ar";

type Lesson = {
  id: number;
  title: string;
  description: string | null;
  lessonType: string;
  durationSeconds: number | null;
  orderIndex: number;
  isPreview: boolean;
  isLocked: boolean;
  videoUrl: string | null;
  audioUrl: string | null;
  content: string | null;
};

type CourseSection = {
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
  sections: CourseSection[];
};

type Props = {
  locale: Locale;
  slug: string;
};

const translations = {
  en: {
    eyebrow: "COURSE CURRICULUM",
    title: "Explore what you'll learn.",
    description:
      "Take a closer look at the sections and lessons included in this course.",
    sections: "sections",
    section: "section",
    lessons: "lessons",
    lesson: "lesson",
    preview: "Free preview",
    locked: "Locked",
    video: "Video",
    audio: "Audio",
    text: "Reading",
    empty: "The course curriculum is being prepared.",
    unavailable:
      "The course curriculum is temporarily unavailable.",
    duration: "Total lesson duration",
    hour: "hr",
    minute: "min",
    seconds: "sec",
    loading: "Loading course curriculum...",
  },
  ar: {
    eyebrow: "المنهج التعليمي",
    title: "اكتشف شو رح تتعلّم.",
    description:
      "تعرّف على أقسام الدورة والدروس التي تتضمنها قبل أن تبدأ رحلتك التعليمية.",
    sections: "أقسام",
    section: "قسم",
    lessons: "دروس",
    lesson: "درس",
    preview: "معاينة مجانية",
    locked: "مقفل",
    video: "فيديو",
    audio: "صوتي",
    text: "قراءة",
    empty: "يتم تجهيز المنهج التعليمي لهذه الدورة.",
    unavailable: "تعذّر تحميل المنهج التعليمي حاليًا.",
    duration: "إجمالي مدة الدروس",
    hour: "ساعة",
    minute: "دقيقة",
    seconds: "ثانية",
    loading: "جارٍ تحميل محتوى الدورة...",
  },
} as const;

function formatDuration(
  seconds: number | null,
  locale: Locale
): string | null {
  if (
    typeof seconds !== "number" ||
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return null;
  }

  const t = translations[locale];
  const totalSeconds = Math.ceil(seconds);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );
  const remainingSeconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${t.hour}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${t.minute}`);
  }

  if (hours === 0 && minutes === 0) {
    parts.push(`${remainingSeconds} ${t.seconds}`);
  }

  return parts.join(" ");
}

function lessonTypeLabel(
  type: string,
  locale: Locale
): string {
  const t = translations[locale];

  switch (type.toLowerCase()) {
    case "video":
      return t.video;
    case "audio":
      return t.audio;
    case "text":
    case "article":
      return t.text;
    default:
      return type;
  }
}

async function getCourseContent(
  slug: string
): Promise<{
  data: CourseContent | null;
  failed: boolean;
}> {
  if (!/^[a-zA-Z0-9-]{1,200}$/.test(slug)) {
    return { data: null, failed: true };
  }

  const baseUrl =
    process.env.API_BASE_URL ||
    "http://localhost:5299";

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/api/courses/${encodeURIComponent(slug)}/content`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(12000),
      }
    );

    if (!response.ok) {
      return { data: null, failed: true };
    }

    const result: unknown = await response.json();

    if (
      !result ||
      typeof result !== "object" ||
      !("sections" in result) ||
      !("slug" in result) ||
      !Array.isArray(result.sections) ||
      result.slug !== slug
    ) {
      return { data: null, failed: true };
    }

    return {
      data: result as CourseContent,
      failed: false,
    };
  } catch {
    return { data: null, failed: true };
  }
}

function CurriculumMessage({
  locale,
  message,
}: {
  locale: Locale;
  message: string;
}) {
  const t = translations[locale];

  return (
    <section
      className={styles.section}
      aria-labelledby="curriculum-heading"
    >
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowLine} />
        {t.eyebrow}
      </div>

      <h2
        id="curriculum-heading"
        className={styles.title}
      >
        {t.title}
      </h2>

      <p className={styles.message} role="status">
        {message}
      </p>
    </section>
  );
}

// Data-fetching content stays inside Suspense.
// It is not cached globally because lesson access
// information may be user-specific.
async function CourseCurriculumContent({
  locale,
  slug,
}: Props) {
  const t = translations[locale];

  const { data, failed } =
    await getCourseContent(slug);

  if (failed || !data) {
    return (
      <CurriculumMessage
        locale={locale}
        message={t.unavailable}
      />
    );
  }

  const sections = [...data.sections]
    .filter(
      (section) =>
        section &&
        typeof section.title === "string" &&
        Array.isArray(section.lessons)
    )
    .sort(
      (a, b) => a.orderIndex - b.orderIndex
    );

  const lessonCount = sections.reduce(
    (count, section) =>
      count + section.lessons.length,
    0
  );

  const totalSeconds = sections.reduce(
    (total, section) =>
      total +
      section.lessons.reduce(
        (sum, lesson) =>
          sum +
          (typeof lesson.durationSeconds === "number" &&
          Number.isFinite(lesson.durationSeconds)
            ? Math.max(0, lesson.durationSeconds)
            : 0),
        0
      ),
    0
  );

  return (
    <section
      className={styles.section}
      aria-labelledby="curriculum-heading"
    >
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowLine} />
        {t.eyebrow}
      </div>

      <h2
        id="curriculum-heading"
        className={styles.title}
      >
        {t.title}
      </h2>

      <p className={styles.description}>
        {t.description}
      </p>

      {sections.length === 0 ? (
        <div className={styles.empty}>
          {t.empty}
        </div>
      ) : (
        <>
          <div className={styles.summary}>
            <span>
              <strong>{sections.length}</strong>{" "}
              {sections.length === 1
                ? t.section
                : t.sections}
            </span>

            <span
              className={styles.summaryDot}
              aria-hidden="true"
            />

            <span>
              <strong>{lessonCount}</strong>{" "}
              {lessonCount === 1
                ? t.lesson
                : t.lessons}
            </span>

            {totalSeconds > 0 && (
              <>
                <span
                  className={styles.summaryDot}
                  aria-hidden="true"
                />

                <span>
                  {t.duration}:{" "}
                  <strong>
                    {formatDuration(
                      totalSeconds,
                      locale
                    )}
                  </strong>
                </span>
              </>
            )}
          </div>

          <div className={styles.sectionList}>
            {sections.map((section, index) => {
              const lessons = [...section.lessons]
                .filter(
                  (lesson) =>
                    lesson &&
                    typeof lesson.title === "string"
                )
                .sort(
                  (a, b) =>
                    a.orderIndex - b.orderIndex
                );

              return (
                <details
                  key={section.id}
                  className={styles.accordion}
                  open={index === 0}
                >
                  <summary
                    className={styles.sectionHeader}
                  >
                    <div
                      className={styles.sectionHeading}
                    >
                      <span
                        className={styles.sectionNumber}
                      >
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </span>

                      <div
                        className={styles.sectionText}
                      >
                        <h3>{section.title}</h3>

                        <span
                          className={styles.sectionCount}
                        >
                          {lessons.length}{" "}
                          {lessons.length === 1
                            ? t.lesson
                            : t.lessons}
                        </span>
                      </div>
                    </div>

                    <svg
                      className={styles.chevron}
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>

                  <div
                    className={styles.sectionBody}
                  >
                    {section.description && (
                      <p
                        className={
                          styles.sectionDescription
                        }
                      >
                        {section.description}
                      </p>
                    )}

                    {lessons.map((lesson) => {
                      const isAvailable =
                        !lesson.isLocked;

                      const duration =
                        formatDuration(
                          lesson.durationSeconds,
                          locale
                        );

                      return (
                        <div
                          key={lesson.id}
                          className={styles.lesson}
                        >
                          <div
                            className={
                              styles.lessonIcon
                            }
                          >
                            {isAvailable ? (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="9"
                                />
                                <path d="m10 8 6 4-6 4V8Z" />
                              </svg>
                            ) : (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                              >
                                <rect
                                  x="5"
                                  y="10"
                                  width="14"
                                  height="11"
                                  rx="2"
                                />
                                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                              </svg>
                            )}
                          </div>

                          <div
                            className={
                              styles.lessonContent
                            }
                          >
                            <h4>
                              {lesson.title}
                            </h4>

                            <div
                              className={
                                styles.lessonMeta
                              }
                            >
                              <span>
                                {lessonTypeLabel(
                                  lesson.lessonType,
                                  locale
                                )}
                              </span>

                              {duration && (
                                <>
                                  <span
                                    className={
                                      styles.metaDot
                                    }
                                    aria-hidden="true"
                                  />
                                  <span>
                                    {duration}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div
                            className={
                              styles.lessonStatus
                            }
                          >
                            {lesson.isPreview &&
                            isAvailable ? (
                              <span
                                className={
                                  styles.previewBadge
                                }
                              >
                                {t.preview}
                              </span>
                            ) : !isAvailable ? (
                              <span
                                className={
                                  styles.lockedLabel
                                }
                              >
                                {t.locked}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

// This wrapper renders immediately while its async
// child streams course data after the initial render.
export default function CourseCurriculum(props: Props) {
  return (
    <Suspense
      fallback={
        <CurriculumMessage
          locale={props.locale}
          message={
            translations[props.locale].loading
          }
        />
      }
    >
      <CourseCurriculumContent {...props} />
    </Suspense>
  );
}
