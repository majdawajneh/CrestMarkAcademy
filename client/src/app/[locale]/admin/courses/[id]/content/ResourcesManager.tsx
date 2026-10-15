
"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./ResourcesManager.module.css";

type Resource = {
  id: number;
  title: string;
  resourceUrl: string;
  resourceType: string;
  orderIndex: number;
  isDownloadable: boolean;
};

type ResourceForm = {
  title: string;
  resourceUrl: string;
  resourceType: string;
  orderIndex: string;
  isDownloadable: boolean;
};

type Props = {
  lessonId: number;
  locale: "en" | "ar";
};

const copy = {
  en: {
    heading: "Lesson resources",
    add: "Add resource",
    empty: "No resources attached to this lesson yet.",
    loading: "Loading resources...",
    loadError: "Unable to load resources.",
    retry: "Retry",
    edit: "Edit",
    delete: "Delete",
    open: "Open resource",
    downloadable: "Downloadable",
    viewOnly: "View only",
    title: "Resource title",
    url: "Resource URL",
    type: "Resource type",
    order: "Display order",
    download: "Allow downloads",
    typeHint: "Enter a resource type accepted by the backend.",
    create: "Create resource",
    update: "Save changes",
    cancel: "Cancel",
    saving: "Saving...",
    deleting: "Deleting...",
    confirmDelete: "Delete this resource?",
    warning: "This action will remove the resource from the lesson.",
    confirm: "Delete resource",
    saved: "Resource saved successfully.",
    removed: "Resource deleted successfully.",
    saveError: "Unable to save resource.",
    deleteError: "Unable to delete resource.",
    refreshError: "Saved, but the resource list could not be refreshed.",
    invalid: "Enter a title, a valid HTTP/HTTPS URL, a resource type, and a valid display order.",
    unauthorized: "Session expired. Please sign in again.",
    forbidden: "Administrator access required.",
  },
  ar: {
    heading: "موارد الدرس",
    add: "إضافة مورد",
    empty: "لا توجد موارد مرفقة بهذا الدرس بعد.",
    loading: "جارٍ تحميل الموارد...",
    loadError: "تعذّر تحميل الموارد.",
    retry: "إعادة المحاولة",
    edit: "تعديل",
    delete: "حذف",
    open: "فتح المورد",
    downloadable: "قابل للتنزيل",
    viewOnly: "عرض فقط",
    title: "عنوان المورد",
    url: "رابط المورد",
    type: "نوع المورد",
    order: "ترتيب العرض",
    download: "السماح بالتنزيل",
    typeHint: "أدخل نوع مورد تقبله قواعد الـ Backend.",
    create: "إنشاء مورد",
    update: "حفظ التعديلات",
    cancel: "إلغاء",
    saving: "جارٍ الحفظ...",
    deleting: "جارٍ الحذف...",
    confirmDelete: "هل تريد حذف هذا المورد؟",
    warning: "سيؤدي هذا الإجراء إلى إزالة المورد من الدرس.",
    confirm: "حذف المورد",
    saved: "تم حفظ المورد بنجاح.",
    removed: "تم حذف المورد بنجاح.",
    saveError: "تعذّر حفظ المورد.",
    deleteError: "تعذّر حذف المورد.",
    refreshError: "نجح الحفظ لكن تعذّر تحديث قائمة الموارد.",
    invalid: "أدخل العنوان ورابط HTTP/HTTPS صحيحًا ونوع المورد ورقم ترتيب صحيحًا.",
    unauthorized: "انتهت الجلسة. سجّل الدخول مجددًا.",
    forbidden: "تحتاج إلى صلاحية المسؤول.",
  },
} as const;

function validUrl(value: string) {
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      Boolean(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function parseResource(value: unknown): Resource | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const data = value as Record<string, unknown>;

  if (
    !Number.isSafeInteger(data.id) ||
    Number(data.id) <= 0 ||
    typeof data.title !== "string" ||
    typeof data.resourceUrl !== "string" ||
    typeof data.resourceType !== "string" ||
    !Number.isInteger(data.orderIndex)
  ) {
    return null;
  }

  return {
    id: data.id as number,
    title: data.title,
    resourceUrl: data.resourceUrl,
    resourceType: data.resourceType,
    orderIndex: data.orderIndex as number,
    isDownloadable: data.isDownloadable === true,
  };
}

function getError(value: unknown, fallback: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const data = value as Record<string, unknown>;

  for (const key of ["message", "detail", "title"]) {
    if (typeof data[key] === "string" && data[key].trim()) {
      return data[key] as string;
    }
  }

  if (data.errors && typeof data.errors === "object") {
    const messages = Object.values(
      data.errors as Record<string, unknown>
    ).flatMap((item) =>
      Array.isArray(item)
        ? item.filter((x): x is string => typeof x === "string")
        : []
    );

    if (messages.length) return messages.slice(0, 3).join(" ");
  }

  return fallback;
}

export default function ResourcesManager({
  lessonId,
  locale,
}: Props) {
  const t = copy[locale];
  const baseUrl = `/api/admin/lessons/${lessonId}/resources`;

  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);

  const [editor, setEditor] = useState<{
    id: number | null;
    form: ResourceForm;
  } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
  const [busy, setBusy] = useState(false);

  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const send = useCallback(async (url: string, init?: RequestInit) => {
    const execute = () =>
      fetch(url, {
        ...init,
        cache: "no-store",
        credentials: "same-origin",
      });

    let response = await execute();

    if (response.status === 401) {
      const session = await getCurrentSession();

      if (session.status === "authenticated") {
        if (!session.user.roles.includes("Admin")) {
          throw new Error("FORBIDDEN");
        }

        response = await execute();
      }
    }

    return response;
  }, []);

  const fetchResources = useCallback(async () => {
    const response = await send(baseUrl);

    if (response.status === 401) throw new Error("UNAUTHORIZED");
    if (response.status === 403) throw new Error("FORBIDDEN");
    if (!response.ok) throw new Error("LOAD_FAILED");

    const data: unknown = await response.json();

    if (!Array.isArray(data)) throw new Error("INVALID_RESPONSE");

    const parsed = data.map(parseResource);

    if (parsed.some((item) => item === null)) {
      throw new Error("INVALID_RESPONSE");
    }

    return (parsed as Resource[]).sort(
      (a, b) => a.orderIndex - b.orderIndex || a.id - b.id
    );
  }, [baseUrl, send]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(false);

      try {
        const result = await fetchResources();
        if (!cancelled) setItems(result);
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
  }, [fetchResources, reload]);

  function openCreate() {
    const maxOrder = items.reduce(
      (max, item) => Math.max(max, item.orderIndex),
      0
    );

    setNotice(null);
    setEditor({
      id: null,
      form: {
        title: "",
        resourceUrl: "",
        resourceType: "",
        orderIndex: String(Math.min(maxOrder + 1, 2147483647)),
        isDownloadable: false,
      },
    });
  }

  function openEdit(item: Resource) {
    setNotice(null);
    setEditor({
      id: item.id,
      form: {
        title: item.title,
        resourceUrl: item.resourceUrl,
        resourceType: item.resourceType,
        orderIndex: String(item.orderIndex),
        isDownloadable: item.isDownloadable,
      },
    });
  }

  function setField<K extends keyof ResourceForm>(
    key: K,
    value: ResourceForm[K]
  ) {
    setEditor((current) =>
      current
        ? {
            ...current,
            form: { ...current.form, [key]: value },
          }
        : null
    );
  }

  function displayError(error: unknown, fallback: string) {
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") return t.forbidden;
      if (error.message === "UNAUTHORIZED") return t.unauthorized;
      if (error.message && error.message !== "Failed to fetch") {
        return error.message;
      }
    }

    return fallback;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || busy) return;

    const { id, form } = editor;
    const orderIndex = Number(form.orderIndex);

    if (
      !form.title.trim() ||
      !validUrl(form.resourceUrl.trim()) ||
      !form.resourceType.trim() ||
      !/^\d+$/.test(form.orderIndex) ||
      !Number.isInteger(orderIndex) ||
      orderIndex > 2147483647
    ) {
      setNotice({ type: "error", message: t.invalid });
      return;
    }

    setBusy(true);
    setNotice(null);

    try {
      const response = await send(
        id === null ? baseUrl : `${baseUrl}/${id}`,
        {
          method: id === null ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            resourceUrl: form.resourceUrl.trim(),
            resourceType: form.resourceType.trim(),
            orderIndex,
            isDownloadable: form.isDownloadable,
          }),
        }
      );

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);

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
        setItems(await fetchResources());
        setNotice({ type: "success", message: t.saved });
      } catch {
        setNotice({ type: "error", message: t.refreshError });
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
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);

        throw new Error(
          response.status === 401
            ? t.unauthorized
            : response.status === 403
              ? t.forbidden
              : getError(data, t.deleteError)
        );
      }

      setDeleteTarget(null);

      try {
        setItems(await fetchResources());
        setNotice({ type: "success", message: t.removed });
      } catch {
        setNotice({ type: "error", message: t.refreshError });
      }
    } catch (error) {
      setNotice({
        type: "error",
        message: displayError(error, t.deleteError),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={styles.manager}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.heading}>
        <div>
          <h5>{t.heading} ({items.length})</h5>
        </div>

        <button
          type="button"
          className={styles.primary}
          disabled={busy || !!editor || !!deleteTarget}
          onClick={openCreate}
        >
          + {t.add}
        </button>
      </div>

      {notice && (
        <div
          className={
            notice.type === "error"
              ? styles.error
              : styles.success
          }
          role={notice.type === "error" ? "alert" : "status"}
        >
          {notice.message}
        </div>
      )}

      {loading ? (
        <p className={styles.empty}>{t.loading}</p>
      ) : loadError ? (
        <div className={styles.empty}>
          <p>{t.loadError}</p>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => setReload((n) => n + 1)}
          >
            {t.retry}
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className={styles.empty}>{t.empty}</p>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <div className={styles.item} key={item.id}>
              <span className={styles.order}>
                {item.orderIndex}
              </span>

              <div className={styles.itemBody}>
                <strong>{item.title}</strong>
                <div className={styles.meta}>
                  <span>{item.resourceType}</span>
                  <span>
                    {item.isDownloadable
                      ? t.downloadable
                      : t.viewOnly}
                  </span>
                </div>
              </div>

              <div className={styles.actions}>
                {validUrl(item.resourceUrl) && (
                  <a
                    href={item.resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.secondary}
                  >
                    {t.open}
                  </a>
                )}

                <button
                  type="button"
                  className={styles.secondary}
                  disabled={busy || !!editor || !!deleteTarget}
                  onClick={() => openEdit(item)}
                >
                  {t.edit}
                </button>

                <button
                  type="button"
                  className={styles.deleteButton}
                  disabled={busy || !!editor || !!deleteTarget}
                  onClick={() => {
                    setNotice(null);
                    setDeleteTarget(item);
                  }}
                >
                  {t.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editor && (
        <div className={styles.backdrop}>
          <section
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`resource-editor-${lessonId}`}
          >
            <h2 id={`resource-editor-${lessonId}`}>
              {editor.id === null ? t.create : t.edit}
            </h2>

            <form onSubmit={(event) => void save(event)}>
              <label>
                {t.title}
                <input
                  required
                  autoFocus
                  disabled={busy}
                  value={editor.form.title}
                  onChange={(event) =>
                    setField("title", event.target.value)
                  }
                />
              </label>

              <label>
                {t.url}
                <input
                  required
                  type="url"
                  placeholder="https://..."
                  disabled={busy}
                  value={editor.form.resourceUrl}
                  onChange={(event) =>
                    setField("resourceUrl", event.target.value)
                  }
                />
              </label>

              <div className={styles.twoColumns}>
                <label>
                  {t.type}
                  <input
                    required
                    placeholder="PDF"
                    disabled={busy}
                    value={editor.form.resourceType}
                    onChange={(event) =>
                      setField("resourceType", event.target.value)
                    }
                  />
                  <small>{t.typeHint}</small>
                </label>

                <label>
                  {t.order}
                  <input
                    required
                    type="number"
                    min="0"
                    max="2147483647"
                    step="1"
                    disabled={busy}
                    value={editor.form.orderIndex}
                    onChange={(event) =>
                      setField("orderIndex", event.target.value)
                    }
                  />
                </label>
              </div>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  disabled={busy}
                  checked={editor.form.isDownloadable}
                  onChange={(event) =>
                    setField("isDownloadable", event.target.checked)
                  }
                />
                {t.download}
              </label>

              {notice?.type === "error" && (
                <p className={styles.inlineError} role="alert">
                  {notice.message}
                </p>
              )}

              <div className={styles.dialogActions}>
                <button
                  type="button"
                  className={styles.secondary}
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
                  className={styles.primary}
                  disabled={busy}
                >
                  {busy
                    ? t.saving
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
            aria-labelledby={`resource-delete-${lessonId}`}
            aria-describedby={`resource-warning-${lessonId}`}
          >
            <h2 id={`resource-delete-${lessonId}`}>
              {t.confirmDelete}
            </h2>

            <p><strong>{deleteTarget.title}</strong></p>
            <p id={`resource-warning-${lessonId}`}>
              {t.warning}
            </p>

            {notice?.type === "error" && (
              <p className={styles.inlineError} role="alert">
                {notice.message}
              </p>
            )}

            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.secondary}
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
                className={styles.danger}
                disabled={busy}
                onClick={() => void remove()}
              >
                {busy ? t.deleting : t.confirm}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
