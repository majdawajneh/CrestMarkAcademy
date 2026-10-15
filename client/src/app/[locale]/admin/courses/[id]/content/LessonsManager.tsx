
"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { getCurrentSession } from "@/lib/auth-session";
import ResourcesManager from "./ResourcesManager";
import styles from "./LessonsManager.module.css";

type Lesson = {
  id: number;
  title: string;
  description: string;
  lessonType: string;
  videoUrl: string;
  audioUrl: string;
  content: string;
  durationSeconds: number;
  orderIndex: number;
  isPreview: boolean;
  isPublished: boolean;
};

type LessonForm = {
  title: string;
  description: string;
  lessonType: string;
  videoUrl: string;
  audioUrl: string;
  content: string;
  durationSeconds: string;
  orderIndex: string;
  isPreview: boolean;
  isPublished: boolean;
};

type Props = {
  sectionId: number;
  locale: "en" | "ar";
};

type Notice = {
  type: "success" | "error";
  message: string;
};

const copy = {
  en: {
    heading: "Lessons",
    add: "Add lesson",
    empty: "No lessons in this section yet.",
    loading: "Loading lessons...",
    loadError: "Unable to load lessons.",
    retry: "Retry",
    edit: "Edit",
    remove: "Delete",
    create: "Create lesson",
    update: "Save changes",
    cancel: "Cancel",
    processing: "Saving...",
    deleting: "Deleting...",
    confirmDelete: "Delete lesson?",
    deleteWarning:
      "Deleting a lesson may also affect its resources and student progress records.",
    confirm: "Delete lesson",
    success: "Lesson saved successfully.",
    deleted: "Lesson deleted successfully.",
    saveError: "Unable to save lesson.",
    deleteError: "Unable to delete lesson.",
    refreshError:
      "The operation succeeded, but the lesson list could not be refreshed.",
    invalid:
      "Enter a title, lesson type, and valid non-negative numbers.",
    unauthorized: "Your session has expired.",
    forbidden: "Administrator permission required.",
    title: "Lesson title",
    description: "Description",
    type: "Lesson type",
    typeHint:
      "Enter a lesson type accepted by the backend.",
    video: "Video URL",
    audio: "Audio URL",
    content: "Text content",
    duration: "Duration (seconds)",
    order: "Display order",
    preview: "Allow preview",
    published: "Published lesson",
    draft: "Draft",
    live: "Published",
    previewLabel: "Preview",
    seconds: "sec",
    videoRequired:
      "Video URL is required for video lessons.",
    resources: "Resources",
    hideResources: "Hide resources",
  },

  ar: {
    heading: "الدروس",
    add: "إضافة درس",
    empty: "لا توجد دروس في هذا القسم بعد.",
    loading: "جارٍ تحميل الدروس...",
    loadError: "تعذّر تحميل الدروس.",
    retry: "إعادة المحاولة",
    edit: "تعديل",
    remove: "حذف",
    create: "إنشاء درس",
    update: "حفظ التعديلات",
    cancel: "إلغاء",
    processing: "جارٍ الحفظ...",
    deleting: "جارٍ الحذف...",
    confirmDelete: "حذف الدرس؟",
    deleteWarning:
      "قد يؤثر حذف الدرس أيضًا على موارده وسجلات تقدم الطلاب.",
    confirm: "حذف الدرس",
    success: "تم حفظ الدرس بنجاح.",
    deleted: "تم حذف الدرس بنجاح.",
    saveError: "تعذّر حفظ الدرس.",
    deleteError: "تعذّر حذف الدرس.",
    refreshError:
      "نجحت العملية، لكن تعذّر تحديث قائمة الدروس.",
    invalid:
      "أدخل عنوانًا ونوع درس وأرقامًا صحيحة غير سالبة.",
    unauthorized: "انتهت صلاحية الجلسة.",
    forbidden: "هذه العملية تتطلب صلاحية المسؤول.",
    title: "عنوان الدرس",
    description: "الوصف",
    type: "نوع الدرس",
    typeHint:
      "أدخل نوع درس تقبله قواعد الـ Backend.",
    video: "رابط الفيديو",
    audio: "رابط الصوت",
    content: "المحتوى النصي",
    duration: "المدة بالثواني",
    order: "ترتيب العرض",
    preview: "السماح بالمعاينة",
    published: "نشر الدرس",
    draft: "مسودة",
    live: "منشور",
    previewLabel: "معاينة",
    seconds: "ثانية",
    videoRequired:
      "يجب إدخال رابط فيديو للدروس من نوع Video.",
    resources: "الموارد",
    hideResources: "إخفاء الموارد",
  },
} as const;

function getError(
  value: unknown,
  fallback: string
): string {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return fallback;
  }

  const data = value as Record<string, unknown>;

  for (const key of ["message", "detail", "title"]) {
    if (
      typeof data[key] === "string" &&
      data[key].trim()
    ) {
      return data[key];
    }
  }

  if (
    data.errors &&
    typeof data.errors === "object" &&
    !Array.isArray(data.errors)
  ) {
    const messages = Object.values(
      data.errors as Record<string, unknown>
    ).flatMap((item) =>
      Array.isArray(item)
        ? item.filter(
            (value): value is string =>
              typeof value === "string"
          )
        : []
    );

    if (messages.length) {
      return messages.slice(0, 3).join(" ");
    }
  }

  return fallback;
}

function toLesson(value: unknown): Lesson | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const data = value as Record<string, unknown>;

  if (
    !Number.isSafeInteger(data.id) ||
    Number(data.id) <= 0 ||
    typeof data.title !== "string" ||
    typeof data.lessonType !== "string" ||
    !Number.isInteger(data.orderIndex) ||
    !Number.isInteger(data.durationSeconds)
  ) {
    return null;
  }

  return {
    id: data.id as number,
    title: data.title,
    description:
      typeof data.description === "string"
        ? data.description
        : "",
    lessonType: data.lessonType,
    videoUrl:
      typeof data.videoUrl === "string"
        ? data.videoUrl
        : "",
    audioUrl:
      typeof data.audioUrl === "string"
        ? data.audioUrl
        : "",
    content:
      typeof data.content === "string"
        ? data.content
        : "",
    durationSeconds: data.durationSeconds as number,
    orderIndex: data.orderIndex as number,
    isPreview: data.isPreview === true,
    isPublished: data.isPublished === true,
  };
}

function emptyForm(orderIndex: number): LessonForm {
  return {
    title: "",
    description: "",
    lessonType: "",
    videoUrl: "",
    audioUrl: "",
    content: "",
    durationSeconds: "0",
    orderIndex: String(orderIndex),
    isPreview: false,
    isPublished: false,
  };
}

function validNumber(value: string): boolean {
  if (!/^\d+$/.test(value)) return false;

  const number = Number(value);

  return (
    Number.isInteger(number) &&
    number >= 0 &&
    number <= 2147483647
  );
}

export default function LessonsManager({
  sectionId,
  locale,
}: Props) {
  const t = copy[locale];

  const baseUrl =
    `/api/admin/sections/${sectionId}/lessons`;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);

  const [editor, setEditor] = useState<{
    id: number | null;
    form: LessonForm;
  } | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Lesson | null>(null);

  const [busy, setBusy] = useState(false);

  const [notice, setNotice] =
    useState<Notice | null>(null);

  // Tracks which lessons have their resources expanded.
  const [expandedResourceIds, setExpandedResourceIds] =
    useState<number[]>([]);

  function toggleResources(lessonId: number) {
    setExpandedResourceIds((current) =>
      current.includes(lessonId)
        ? current.filter((id) => id !== lessonId)
        : [...current, lessonId]
    );
  }

  const send = useCallback(
    async (url: string, init?: RequestInit) => {
      const request = () =>
        fetch(url, {
          ...init,
          credentials: "same-origin",
          cache: "no-store",
        });

      let response = await request();

      if (response.status === 401) {
        const session = await getCurrentSession();

        if (session.status === "authenticated") {
          if (!session.user.roles.includes("Admin")) {
            throw new Error("FORBIDDEN");
          }

          response = await request();
        }
      }

      return response;
    },
    []
  );

  const fetchLessons = useCallback(async () => {
    const response = await send(baseUrl);

    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    if (response.status === 403) {
      throw new Error("FORBIDDEN");
    }

    if (!response.ok) {
      throw new Error("LOAD_FAILED");
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("INVALID_RESPONSE");
    }

    const parsed = data.map(toLesson);

    if (parsed.some((item) => item === null)) {
      throw new Error("INVALID_RESPONSE");
    }

    return (parsed as Lesson[]).sort(
      (a, b) =>
        a.orderIndex - b.orderIndex ||
        a.id - b.id
    );
  }, [baseUrl, send]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");

      try {
        const result = await fetchLessons();

        if (!cancelled) {
          setLessons(result);
        }
      } catch {
        if (!cancelled) {
          setLoadError(t.loadError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [fetchLessons, reload, t.loadError]);

  function setField<K extends keyof LessonForm>(
    key: K,
    value: LessonForm[K]
  ) {
    setEditor((current) =>
      current
        ? {
            ...current,
            form: {
              ...current.form,
              [key]: value,
            },
          }
        : null
    );
  }

  function openCreate() {
    const maxOrder = lessons.reduce(
      (max, lesson) =>
        Math.max(max, lesson.orderIndex),
      0
    );

    setNotice(null);

    setEditor({
      id: null,
      form: emptyForm(
        Math.min(maxOrder + 1, 2147483647)
      ),
    });
  }

  function openEdit(lesson: Lesson) {
    setNotice(null);

    setEditor({
      id: lesson.id,
      form: {
        title: lesson.title,
        description: lesson.description,
        lessonType: lesson.lessonType,
        videoUrl: lesson.videoUrl,
        audioUrl: lesson.audioUrl,
        content: lesson.content,
        durationSeconds: String(
          lesson.durationSeconds
        ),
        orderIndex: String(lesson.orderIndex),
        isPreview: lesson.isPreview,
        isPublished: lesson.isPublished,
      },
    });
  }

  function displayError(
    error: unknown,
    fallback: string
  ) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return t.forbidden;
      }

      if (error.message === "UNAUTHORIZED") {
        return t.unauthorized;
      }

      if (
        error.message &&
        error.message !== "Failed to fetch"
      ) {
        return error.message;
      }
    }

    return fallback;
  }

  async function save(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editor || busy) return;

    const { id, form } = editor;

    if (
      !form.title.trim() ||
      !form.lessonType.trim() ||
      !validNumber(form.durationSeconds) ||
      !validNumber(form.orderIndex)
    ) {
      setNotice({
        type: "error",
        message: t.invalid,
      });
      return;
    }

    if (
      form.lessonType.trim().toLowerCase() ===
        "video" &&
      !form.videoUrl.trim()
    ) {
      setNotice({
        type: "error",
        message: t.videoRequired,
      });
      return;
    }

    setBusy(true);
    setNotice(null);

    try {
      const response = await send(
        id === null ? baseUrl : `${baseUrl}/${id}`,
        {
          method: id === null ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            lessonType: form.lessonType.trim(),
            videoUrl: form.videoUrl.trim(),
            audioUrl: form.audioUrl.trim(),
            content: form.content,
            durationSeconds: Number(
              form.durationSeconds
            ),
            orderIndex: Number(form.orderIndex),
            isPreview: form.isPreview,
            isPublished: form.isPublished,
          }),
        }
      );

      if (!response.ok) {
        const data: unknown = await response
          .json()
          .catch(() => null);

        throw new Error(
          response.status === 401
            ? t.unauthorized
            : response.status === 403
              ? t.forbidden
              : getError(data, t.saveError)
        );
      }

      setEditor(null);

      try {
        setLessons(await fetchLessons());

        setNotice({
          type: "success",
          message: t.success,
        });
      } catch {
        setNotice({
          type: "error",
          message: t.refreshError,
        });
      }
    } catch (error) {
      setNotice({
        type: "error",
        message: displayError(error, t.saveError),
      });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleteTarget || busy) return;

    setBusy(true);
    setNotice(null);

    try {
      const response = await send(
        `${baseUrl}/${deleteTarget.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data: unknown = await response
          .json()
          .catch(() => null);

        throw new Error(
          response.status === 401
            ? t.unauthorized
            : response.status === 403
              ? t.forbidden
              : getError(data, t.deleteError)
        );
      }

      const deletedId = deleteTarget.id;

      setDeleteTarget(null);

      setExpandedResourceIds((current) =>
        current.filter((id) => id !== deletedId)
      );

      try {
        setLessons(await fetchLessons());

        setNotice({
          type: "success",
          message: t.deleted,
        });
      } catch {
        setNotice({
          type: "error",
          message: t.refreshError,
        });
      }
    } catch (error) {
      setNotice({
        type: "error",
        message: displayError(
          error,
          t.deleteError
        ),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={styles.manager}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.header}>
        <h4>
          {t.heading} <span>({lessons.length})</span>
        </h4>

        <button
          type="button"
          className={styles.addButton}
          onClick={openCreate}
          disabled={
            busy ||
            loading ||
            !!editor ||
            !!deleteTarget
          }
        >
          + {t.add}
        </button>
      </div>

      {notice && !editor && !deleteTarget && (
        <div
          className={
            notice.type === "error"
              ? styles.errorNotice
              : styles.successNotice
          }
          role={
            notice.type === "error"
              ? "alert"
              : "status"
          }
        >
          {notice.message}
        </div>
      )}

      {loading ? (
        <p className={styles.empty}>
          {t.loading}
        </p>
      ) : loadError ? (
        <div className={styles.empty}>
          <p>{loadError}</p>

          <button
            type="button"
            onClick={() =>
              setReload((n) => n + 1)
            }
          >
            {t.retry}
          </button>
        </div>
      ) : lessons.length === 0 ? (
        <p className={styles.empty}>
          {t.empty}
        </p>
      ) : (
        <div className={styles.list}>
          {lessons.map((lesson) => {
            const resourcesOpen =
              expandedResourceIds.includes(lesson.id);

            return (
              <div
                className={styles.lesson}
                key={lesson.id}
              >
                <span className={styles.order}>
                  {lesson.orderIndex}
                </span>

                <div className={styles.lessonInfo}>
                  <strong>{lesson.title}</strong>

                  <div className={styles.meta}>
                    <span>
                      {lesson.lessonType}
                    </span>

                    <span>
                      {lesson.durationSeconds}{" "}
                      {t.seconds}
                    </span>

                    <span>
                      {lesson.isPublished
                        ? t.live
                        : t.draft}
                    </span>

                    {lesson.isPreview && (
                      <span>
                        {t.previewLabel}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.rowActions}>
                  <button
                    type="button"
                    onClick={() =>
                      openEdit(lesson)
                    }
                    disabled={
                      busy ||
                      !!editor ||
                      !!deleteTarget
                    }
                  >
                    {t.edit}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      toggleResources(lesson.id);
                    }}
                    aria-expanded={resourcesOpen}
                    aria-controls={
                      `lesson-resources-${sectionId}-${lesson.id}`
                    }
                    disabled={
                      busy ||
                      !!editor ||
                      !!deleteTarget
                    }
                  >
                    {resourcesOpen
                      ? t.hideResources
                      : t.resources}
                  </button>

                  <button
                    type="button"
                    className={styles.deleteText}
                    onClick={() => {
                      setNotice(null);
                      setDeleteTarget(lesson);
                    }}
                    disabled={
                      busy ||
                      !!editor ||
                      !!deleteTarget
                    }
                  >
                    {t.remove}
                  </button>
                </div>

                {resourcesOpen && (
                  <div
                    id={`lesson-resources-${sectionId}-${lesson.id}`}
                    className={styles.resourcesArea}
                  >
                    <ResourcesManager
                      lessonId={lesson.id}
                      locale={locale}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editor && (
        <div className={styles.backdrop}>
          <section
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={
              `lesson-editor-${sectionId}`
            }
          >
            <h2
              id={`lesson-editor-${sectionId}`}
            >
              {editor.id === null
                ? t.create
                : t.edit}
            </h2>

            <form
              onSubmit={(event) =>
                void save(event)
              }
            >
              <div className={styles.formGrid}>
                <label className={styles.full}>
                  {t.title}

                  <input
                    required
                    autoFocus
                    disabled={busy}
                    value={editor.form.title}
                    onChange={(event) =>
                      setField(
                        "title",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className={styles.full}>
                  {t.description}

                  <textarea
                    rows={2}
                    disabled={busy}
                    value={
                      editor.form.description
                    }
                    onChange={(event) =>
                      setField(
                        "description",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  {t.type}

                  <input
                    required
                    disabled={busy}
                    value={
                      editor.form.lessonType
                    }
                    placeholder="Video"
                    onChange={(event) =>
                      setField(
                        "lessonType",
                        event.target.value
                      )
                    }
                  />

                  <small>
                    {t.typeHint}
                  </small>
                </label>

                <label>
                  {t.order}

                  <input
                    type="number"
                    min="0"
                    max="2147483647"
                    step="1"
                    required
                    disabled={busy}
                    value={
                      editor.form.orderIndex
                    }
                    onChange={(event) =>
                      setField(
                        "orderIndex",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  {t.duration}

                  <input
                    type="number"
                    min="0"
                    max="2147483647"
                    step="1"
                    required
                    disabled={busy}
                    value={
                      editor.form.durationSeconds
                    }
                    onChange={(event) =>
                      setField(
                        "durationSeconds",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  {t.video}

                  <input
                    type="url"
                    disabled={busy}
                    value={editor.form.videoUrl}
                    placeholder="https://..."
                    onChange={(event) =>
                      setField(
                        "videoUrl",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className={styles.full}>
                  {t.audio}

                  <input
                    type="url"
                    disabled={busy}
                    value={editor.form.audioUrl}
                    placeholder="https://..."
                    onChange={(event) =>
                      setField(
                        "audioUrl",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className={styles.full}>
                  {t.content}

                  <textarea
                    rows={5}
                    disabled={busy}
                    value={
                      editor.form.content
                    }
                    onChange={(event) =>
                      setField(
                        "content",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    disabled={busy}
                    checked={
                      editor.form.isPreview
                    }
                    onChange={(event) =>
                      setField(
                        "isPreview",
                        event.target.checked
                      )
                    }
                  />

                  {t.preview}
                </label>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    disabled={busy}
                    checked={
                      editor.form.isPublished
                    }
                    onChange={(event) =>
                      setField(
                        "isPublished",
                        event.target.checked
                      )
                    }
                  />

                  {t.published}
                </label>
              </div>

              {notice?.type === "error" && (
                <p
                  className={
                    styles.inlineError
                  }
                  role="alert"
                >
                  {notice.message}
                </p>
              )}

              <div
                className={
                  styles.dialogActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.cancelButton
                  }
                  disabled={busy}
                  onClick={() => {
                    setEditor(null);
                    setNotice(null);
                  }}
                >
                  {t.cancel}
                </button>

                <button
                  type="submit"
                  className={
                    styles.submitButton
                  }
                  disabled={busy}
                >
                  {busy
                    ? t.processing
                    : editor.id === null
                      ? t.create
                      : t.update}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.backdrop}>
          <section
            className={styles.dialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={
              `lesson-delete-${sectionId}`
            }
          >
            <h2
              id={`lesson-delete-${sectionId}`}
            >
              {t.confirmDelete}
            </h2>

            <p>
              <strong>
                {deleteTarget.title}
              </strong>
            </p>

            <p className={styles.warning}>
              {t.deleteWarning}
            </p>

            {notice?.type === "error" && (
              <p
                className={styles.inlineError}
                role="alert"
              >
                {notice.message}
              </p>
            )}

            <div
              className={
                styles.dialogActions
              }
            >
              <button
                type="button"
                className={
                  styles.cancelButton
                }
                disabled={busy}
                onClick={() => {
                  setDeleteTarget(null);
                  setNotice(null);
                }}
              >
                {t.cancel}
              </button>

              <button
                type="button"
                className={
                  styles.dangerButton
                }
                disabled={busy}
                onClick={() =>
                  void remove()
                }
              >
                {busy
                  ? t.deleting
                  : t.confirm}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
