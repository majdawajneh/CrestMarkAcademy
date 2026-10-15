
"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import LessonsManager from "./LessonsManager";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./SectionsManager.module.css";

type Section = {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
};

type Editor = {
  id: number | null;
  title: string;
  description: string;
  order: string;
};

type Props = {
  courseId: number;
  locale: "en" | "ar";
};

const translations = {
  en: {
    title: "Course sections",
    description: "Organize your course into clear learning modules.",
    add: "Add section",
    empty: "No sections yet. Create the first module.",
    edit: "Edit",
    remove: "Delete",
    lessons: "Lessons",
    titleLabel: "Section title",
    descriptionLabel: "Description",
    order: "Display order",
    save: "Save changes",
    create: "Create section",
    cancel: "Cancel",
    loading: "Loading sections...",
    error: "Unable to load sections.",
    retry: "Try again",
    success: "Section saved successfully.",
    deleted: "Section deleted successfully.",
    saveError: "Unable to save section.",
    deleteError: "Unable to delete section.",
    confirmDelete: "Delete this section?",
    deleteWarning:
      "This may also affect lessons belonging to this section. Check the section before deleting it.",
    confirm: "Delete section",
    processing: "Processing...",
    session: "Session expired. Please sign in again.",
    forbidden: "Administrator permission required.",
    validation: "Enter a title and a valid display order.",
    refreshError: "Saved, but couldn't refresh the sections list.",
    count: "sections",
  },
  ar: {
    title: "أقسام الدورة",
    description: "نظّم محتوى الدورة في وحدات تعليمية واضحة.",
    add: "إضافة قسم",
    empty: "لا توجد أقسام بعد. ابدأ بإنشاء أول قسم.",
    edit: "تعديل",
    remove: "حذف",
    lessons: "الدروس",
    titleLabel: "عنوان القسم",
    descriptionLabel: "الوصف",
    order: "ترتيب العرض",
    save: "حفظ التعديلات",
    create: "إنشاء القسم",
    cancel: "إلغاء",
    loading: "جارٍ تحميل الأقسام...",
    error: "تعذّر تحميل الأقسام.",
    retry: "إعادة المحاولة",
    success: "تم حفظ القسم بنجاح.",
    deleted: "تم حذف القسم بنجاح.",
    saveError: "تعذّر حفظ القسم.",
    deleteError: "تعذّر حذف القسم.",
    confirmDelete: "هل تريد حذف هذا القسم؟",
    deleteWarning:
      "قد يؤثر الحذف على الدروس التابعة للقسم. تأكد قبل المتابعة.",
    confirm: "حذف القسم",
    processing: "جارٍ التنفيذ...",
    session: "انتهت الجلسة. سجّل الدخول مجددًا.",
    forbidden: "هذه العملية تتطلب صلاحية المسؤول.",
    validation: "أدخل عنوانًا ورقم ترتيب صحيحًا.",
    refreshError: "تم الحفظ، لكن تعذّر تحديث قائمة الأقسام.",
    count: "أقسام",
  },
} as const;

function isSection(value: unknown): value is Section {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    Number.isSafeInteger(data.id) &&
    Number(data.id) > 0 &&
    typeof data.title === "string" &&
    typeof data.description === "string" &&
    Number.isInteger(data.orderIndex)
  );
}

function extractError(value: unknown, fallback: string) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return fallback;
  }

  const data = value as Record<string, unknown>;

  if (typeof data.message === "string" && data.message) {
    return data.message;
  }

  if (typeof data.detail === "string" && data.detail) {
    return data.detail;
  }

  if (typeof data.title === "string" && data.title) {
    return data.title;
  }

  return fallback;
}

export default function SectionsManager({
  courseId,
  locale,
}: Props) {
  const t = translations[locale];

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<Section | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const baseUrl = `/api/admin/courses/${courseId}/sections`;

  const authorizedFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const send = () =>
        fetch(url, {
          ...init,
          credentials: "same-origin",
          cache: "no-store",
        });

      let response = await send();

      if (response.status === 401) {
        const session = await getCurrentSession();

        if (session.status === "authenticated") {
          if (!session.user.roles.includes("Admin")) {
            throw new Error("FORBIDDEN");
          }

          response = await send();
        }
      }

      return response;
    },
    []
  );

  const loadSections = useCallback(async () => {
    const response = await authorizedFetch(
      `/api/admin/courses/${courseId}/sections`
    );

    if (response.status === 401) throw new Error("UNAUTHORIZED");
    if (response.status === 403) throw new Error("FORBIDDEN");
    if (!response.ok) throw new Error("LOAD_FAILED");

    const data: unknown = await response.json();

    if (!Array.isArray(data) || !data.every(isSection)) {
      throw new Error("INVALID_RESPONSE");
    }

    return [...data].sort(
      (a, b) => a.orderIndex - b.orderIndex || a.id - b.id
    );
  }, [authorizedFetch, courseId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(false);

      try {
        const result = await loadSections();

        if (!cancelled) {
          setSections(result);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [loadSections, reloadKey]);

  function openCreate() {
    const maxOrder = sections.reduce(
      (max, item) => Math.max(max, item.orderIndex),
      0
    );

    setEditor({
      id: null,
      title: "",
      description: "",
      order: String(Math.min(maxOrder + 1, 2147483647)),
    });

    setNotice(null);
  }

  function openEdit(section: Section) {
    setEditor({
      id: section.id,
      title: section.title,
      description: section.description,
      order: String(section.orderIndex),
    });

    setNotice(null);
  }

  async function saveSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editor || busy) return;

    const order = Number(editor.order);

    if (
      !editor.title.trim() ||
      !/^\d+$/.test(editor.order) ||
      !Number.isInteger(order) ||
      order > 2147483647
    ) {
      setNotice({ type: "error", text: t.validation });
      return;
    }

    const current = editor;
    setBusy(true);
    setNotice(null);

    try {
      const response = await authorizedFetch(
        current.id === null
          ? baseUrl
          : `${baseUrl}/${current.id}`,
        {
          method: current.id === null ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: current.title.trim(),
            description: current.description.trim(),
            orderIndex: order,
          }),
        }
      );

      if (!response.ok) {
        const data: unknown = await response
          .json()
          .catch(() => null);

        throw new Error(
          response.status === 401
            ? t.session
            : response.status === 403
              ? t.forbidden
              : extractError(data, t.saveError)
        );
      }

      setEditor(null);

      try {
        setSections(await loadSections());
        setNotice({ type: "success", text: t.success });
      } catch {
        setNotice({ type: "error", text: t.refreshError });
      }
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message === "FORBIDDEN"
              ? t.forbidden
              : error.message
            : t.saveError,
      });
    } finally {
      setBusy(false);
    }
  }

  async function deleteSection() {
    if (!deleting || busy) return;

    setBusy(true);
    setNotice(null);

    try {
      const response = await authorizedFetch(
        `${baseUrl}/${deleting.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data: unknown = await response
          .json()
          .catch(() => null);

        throw new Error(
          response.status === 401
            ? t.session
            : response.status === 403
              ? t.forbidden
              : extractError(data, t.deleteError)
        );
      }

      setDeleting(null);

      try {
        setSections(await loadSections());
        setNotice({ type: "success", text: t.deleted });
      } catch {
        setNotice({ type: "error", text: t.refreshError });
      }
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message === "FORBIDDEN"
              ? t.forbidden
              : error.message
            : t.deleteError,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.panel} dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className={styles.heading}>
        <div className={styles.headingText}>
          <span className={styles.number}>03</span>
          <div>
            <h2>{t.title}</h2>
            <p>{t.description}</p>
          </div>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={openCreate}
          disabled={busy || !!editor || !!deleting}
        >
          + {t.add}
        </button>
      </div>

      {notice && (
        <div
          className={
            notice.type === "error"
              ? styles.errorNotice
              : styles.successNotice
          }
          role={notice.type === "error" ? "alert" : "status"}
        >
          {notice.text}
        </div>
      )}

      {loading ? (
        <div className={styles.empty}>{t.loading}</div>
      ) : loadError ? (
        <div className={styles.empty}>
          <p>{t.error}</p>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setReloadKey((n) => n + 1)}
          >
            {t.retry}
          </button>
        </div>
      ) : sections.length === 0 ? (
        <div className={styles.empty}>{t.empty}</div>
      ) : (
        <div className={styles.list}>
          {sections.map((section) => (
            <article className={styles.sectionRow} key={section.id}>
              <span className={styles.orderBadge}>
                {section.orderIndex}
              </span>

              <div className={styles.sectionBody}>
                <h3>{section.title}</h3>
                {section.description && (
                  <p>{section.description}</p>
                )}
                <span className={styles.sectionId}>
                  ID #{section.id}
                </span>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => openEdit(section)}
                  disabled={busy || !!editor || !!deleting}
                >
                  {t.edit}
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => {
                    setDeleting(section);
                    setNotice(null);
                  }}
                  disabled={busy || !!editor || !!deleting}
                >
                  {t.remove}
                </button>
              </div>
              <div className={styles.lessonsArea}>
                    <LessonsManager
                        sectionId={section.id}
                        locale={locale}
                    />
                </div>
            </article>
          ))}
        </div>
      )}

      {editor && (
        <div className={styles.backdrop}>
          <section
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="section-editor-title"
          >
            <h2 id="section-editor-title">
              {editor.id === null ? t.add : t.edit}
            </h2>

            <form onSubmit={(event) => void saveSection(event)}>
              <label htmlFor="section-title">{t.titleLabel}</label>
              <input
                id="section-title"
                required
                autoFocus
                value={editor.title}
                disabled={busy}
                onChange={(event) =>
                  setEditor((prev) =>
                    prev
                      ? { ...prev, title: event.target.value }
                      : null
                  )
                }
              />

              <label htmlFor="section-description">
                {t.descriptionLabel}
              </label>
              <textarea
                id="section-description"
                rows={4}
                value={editor.description}
                disabled={busy}
                onChange={(event) =>
                  setEditor((prev) =>
                    prev
                      ? { ...prev, description: event.target.value }
                      : null
                  )
                }
              />

              <label htmlFor="section-order">{t.order}</label>
              <input
                id="section-order"
                type="number"
                min="0"
                max="2147483647"
                step="1"
                required
                value={editor.order}
                disabled={busy}
                onChange={(event) =>
                  setEditor((prev) =>
                    prev
                      ? { ...prev, order: event.target.value }
                      : null
                  )
                }
              />

              {notice?.type === "error" && (
                <p className={styles.inlineError} role="alert">
                  {notice.text}
                </p>
              )}

              <div className={styles.dialogActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    setEditor(null);
                    setNotice(null);
                  }}
                  disabled={busy}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={busy}
                >
                  {busy
                    ? t.processing
                    : editor.id === null
                      ? t.create
                      : t.save}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleting && (
        <div className={styles.backdrop}>
          <section
            className={styles.dialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="section-delete-title"
            aria-describedby="section-delete-warning"
          >
            <h2 id="section-delete-title">{t.confirmDelete}</h2>
            <p className={styles.deleteName}>{deleting.title}</p>
            <p id="section-delete-warning">{t.deleteWarning}</p>

            {notice?.type === "error" && (
              <p role="alert" className={styles.inlineError}>
                {notice.text}
              </p>
            )}

            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  setDeleting(null);
                  setNotice(null);
                }}
                disabled={busy}
              >
                {t.cancel}
              </button>

              <button
                type="button"
                className={styles.dangerButton}
                onClick={() => void deleteSection()}
                disabled={busy}
              >
                {busy ? t.processing : t.confirm}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
