"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./page.module.css";
import SectionsManager from "./SectionsManager";


type Kind = "requirements" | "learning-outcomes";
type Item = { id: number; courseId: number; text: string; orderIndex: number };
type CourseInfo = { id: number; title: string; status: string };
type LoadState = "loading" | "ready" | "error" | "unauthorized" | "forbidden";
type Editor = { kind: Kind; id: number | null; text: string; order: string };
type Removal = { kind: Kind; item: Item };

const ui = {
  en: {
    back: "Back to courses", eyebrow: "COURSE MANAGEMENT / CONTENT", title: "Course content",
    subtitle: "Build the learning foundation before adding sections and lessons.",
    requirements: "Course requirements", requirementHelp: "What should students know before starting?",
    outcomes: "Learning outcomes", outcomeHelp: "What will students be able to do after completing this course?",
    addRequirement: "Add requirement", addOutcome: "Add learning outcome", emptyRequirement: "No requirements yet.",
    emptyOutcome: "No learning outcomes yet.", edit: "Edit", remove: "Delete", save: "Save changes", add: "Add item",
    cancel: "Cancel", order: "Display order", item: "Description", required: "Please enter a description.",
    orderError: "Enter a whole-number order from 0 to 2147483647.",
    loading: "Loading course content...", loadError: "Couldn't load course content.", retry: "Try again",
    session: "Session expired. Please sign in again.", forbidden: "Administrator access is required.",
    login: "Log in", saving: "Saving...", deleting: "Deleting...", deleteTitle: "Delete this item?",
    deleteMessage: "This action removes the item from the course.", confirmDelete: "Delete item",
    saveFailed: "Couldn't save your changes.", deleteFailed: "Couldn't delete this item.",
    loadFailed: "Couldn't refresh this section.", updated: "Changes saved successfully.", removed: "Item deleted successfully.",
    unpublished: "Course status", next: "Sections and lessons will be connected in a later step.",
  },
  ar: {
    back: "العودة إلى الدورات", eyebrow: "إدارة الدورات / المحتوى", title: "محتوى الدورة",
    subtitle: "جهّز المتطلبات ومخرجات التعلّم قبل إضافة الأقسام والدروس.",
    requirements: "متطلبات الدورة", requirementHelp: "ما الذي يحتاج الطالب معرفته قبل بدء الدورة؟",
    outcomes: "مخرجات التعلّم", outcomeHelp: "ماذا سيتمكن الطالب من تطبيقه بعد إكمال الدورة؟",
    addRequirement: "إضافة متطلب", addOutcome: "إضافة مخرج تعليمي", emptyRequirement: "لا توجد متطلبات بعد.",
    emptyOutcome: "لا توجد مخرجات تعلّم بعد.", edit: "تعديل", remove: "حذف", save: "حفظ التعديل", add: "إضافة",
    cancel: "إلغاء", order: "ترتيب العرض", item: "الوصف", required: "أدخل وصفًا للعنصر.",
    orderError: "أدخل رقم ترتيب صحيحًا بين 0 و2147483647.",
    loading: "جارٍ تحميل محتوى الدورة...", loadError: "تعذّر تحميل محتوى الدورة.", retry: "إعادة المحاولة",
    session: "انتهت الجلسة. يرجى تسجيل الدخول مجددًا.", forbidden: "هذه الصفحة تتطلب صلاحية المسؤول.",
    login: "تسجيل الدخول", saving: "جارٍ الحفظ...", deleting: "جارٍ الحذف...", deleteTitle: "حذف هذا العنصر؟",
    deleteMessage: "سيتم حذف العنصر من محتوى الدورة.", confirmDelete: "تأكيد الحذف",
    saveFailed: "تعذّر حفظ التغييرات.", deleteFailed: "تعذّر حذف العنصر.",
    loadFailed: "تعذّر تحديث هذا القسم.", updated: "تم حفظ التغييرات بنجاح.", removed: "تم حذف العنصر بنجاح.",
    unpublished: "حالة الدورة", next: "سنربط الأقسام والدروس في المرحلة التالية.",
  },
} as const;

function positiveId(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function isCourse(value: unknown): value is CourseInfo {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  return Number.isSafeInteger(data.id) && typeof data.title === "string" && typeof data.status === "string";
}

function parseItems(value: unknown, kind: Kind, courseId: number): Item[] {
  if (!Array.isArray(value)) throw new Error("Invalid list response");
  const key = kind === "requirements" ? "requirement" : "outcome";
  return value.map((entry: unknown) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error("Invalid item");
    const record = entry as Record<string, unknown>;
    if (!Number.isSafeInteger(record.id) || Number(record.id) <= 0 ||
        typeof record[key] !== "string" || !Number.isSafeInteger(record.orderIndex) ||
        (record.courseId !== undefined && record.courseId !== courseId)) {
      throw new Error("Invalid item fields");
    }
    return { id: record.id as number, courseId, text: record[key] as string, orderIndex: record.orderIndex as number };
  }).sort((a, b) => a.orderIndex - b.orderIndex || a.id - b.id);
}

function errorText(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object" || Array.isArray(data)) return fallback;
  const value = data as Record<string, unknown>;
  if (typeof value.message === "string" && value.message) return value.message;
  if (typeof value.detail === "string" && value.detail) return value.detail;
  if (typeof value.title === "string" && value.title) return value.title;
  return fallback;
}

export default function CourseContentPage() {
  const params = useParams<{ locale: string; id: string }>();
  const locale = params.locale === "ar" ? "ar" : "en";
  const t = ui[locale];
  const id = positiveId(params.id);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [requirements, setRequirements] = useState<Item[]>([]);
  const [outcomes, setOutcomes] = useState<Item[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [removal, setRemoval] = useState<Removal | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const authorizedFetch = useCallback(async (url: string, init?: RequestInit): Promise<Response> => {
    const send = () => fetch(url, { ...init, credentials: "same-origin", cache: "no-store" });
    let response = await send();
    if (response.status !== 401) return response;
    const session = await getCurrentSession();
    if (session.status !== "authenticated") return response;
    if (!session.user.roles.includes("Admin")) throw new Error("FORBIDDEN");
    response = await send();
    return response;
  }, []);

  const loadList = useCallback(async (kind: Kind, courseId: number): Promise<Item[]> => {
    const response = await authorizedFetch(`/api/admin/courses/${courseId}/${kind}`);
    if (response.status === 401) throw new Error("UNAUTHORIZED");
    if (response.status === 403) throw new Error("FORBIDDEN");
    if (!response.ok) throw new Error("LOAD_FAILED");
    return parseItems(await response.json(), kind, courseId);
  }, [authorizedFetch]);

  useEffect(() => {
    if (id === null) return;
    let cancelled = false;
    async function load() {
      try {
        const courseResponse = await authorizedFetch(`/api/admin/courses/${id}`);
        if (courseResponse.status === 401) throw new Error("UNAUTHORIZED");
        if (courseResponse.status === 403) throw new Error("FORBIDDEN");
        if (!courseResponse.ok) throw new Error("LOAD_FAILED");
        const courseData: unknown = await courseResponse.json();
        if (!isCourse(courseData) || courseData.id !== id) throw new Error("LOAD_FAILED");
        const [reqs, outs] = await Promise.all([loadList("requirements", id!), loadList("learning-outcomes", id!)]);
        if (cancelled) return;
        setCourse(courseData);
        setRequirements(reqs);
        setOutcomes(outs);
        setState("ready");
      } catch (err) {
        if (cancelled) return;
        const code = err instanceof Error ? err.message : "";
        setState(code === "UNAUTHORIZED" ? "unauthorized" : code === "FORBIDDEN" ? "forbidden" : "error");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [id, authorizedFetch, loadList, refreshIndex]);

  async function refreshSection(kind: Kind) {
    if (id === null) return;
    const items = await loadList(kind, id);
    if (kind === "requirements") setRequirements(items);
    else setOutcomes(items);
  }

  function startCreate(kind: Kind) {
    const items = kind === "requirements" ? requirements : outcomes;
    const nextOrder = items.length ? Math.max(...items.map((item) => item.orderIndex)) + 1 : 1;
    setEditor({ kind, id: null, text: "", order: String(Math.min(nextOrder, 2147483647)) });
    setNotice(null);
  }

  function startEdit(kind: Kind, item: Item) {
    setEditor({ kind, id: item.id, text: item.text, order: String(item.orderIndex) });
    setNotice(null);
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || busy || id === null) return;
    const text = editor.text.trim();
    const order = Number(editor.order);
    if (!text) { setNotice({ type: "error", text: t.required }); return; }
    if (!/^\d+$/.test(editor.order) || !Number.isSafeInteger(order) || order > 2147483647) {
      setNotice({ type: "error", text: t.orderError }); return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const key = editor.kind === "requirements" ? "requirement" : "outcome";
      const base = `/api/admin/courses/${id}/${editor.kind}`;
      const endpoint = editor.id === null ? base : `${base}/${editor.id}`;
      const response = await authorizedFetch(endpoint, {
        method: editor.id === null ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: text, orderIndex: order }),
      });
      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        throw new Error(response.status === 401 ? t.session : response.status === 403 ? t.forbidden : errorText(data, t.saveFailed));
      }
      try {
        await refreshSection(editor.kind);
      } catch {
        setNotice({ type: "error", text: t.loadFailed });
        setEditor(null);
        return;
      }
      setEditor(null);
      setNotice({ type: "success", text: t.updated });
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error && err.message === "FORBIDDEN" ? t.forbidden : err instanceof Error ? err.message : t.saveFailed });
    } finally { setBusy(false); }
  }

  async function deleteItem() {
    if (!removal || busy || id === null) return;
    setBusy(true);
    setNotice(null);
    try {
      const response = await authorizedFetch(`/api/admin/courses/${id}/${removal.kind}/${removal.item.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        throw new Error(response.status === 401 ? t.session : response.status === 403 ? t.forbidden : errorText(data, t.deleteFailed));
      }
      const kind = removal.kind;
      setRemoval(null);
      try { await refreshSection(kind); }
      catch { setNotice({ type: "error", text: t.loadFailed }); return; }
      setNotice({ type: "success", text: t.removed });
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error && err.message === "FORBIDDEN" ? t.forbidden : err instanceof Error ? err.message : t.deleteFailed });
    } finally { setBusy(false); }
  }

  function section(kind: Kind, number: string) {
    const req = kind === "requirements";
    const items = req ? requirements : outcomes;
    return (
      <section className={styles.panel} aria-labelledby={`${kind}-heading`}>
        <div className={styles.panelHeading}>
          <div className={styles.panelIntro}>
            <span className={styles.sectionNumber}>{number}</span>
            <div>
              <h2 id={`${kind}-heading`}>{req ? t.requirements : t.outcomes}</h2>
              <p>{req ? t.requirementHelp : t.outcomeHelp}</p>
            </div>
          </div>
          <button className={styles.primaryButton} type="button" onClick={() => startCreate(kind)} disabled={busy || editor !== null || removal !== null}>
            + {req ? t.addRequirement : t.addOutcome}
          </button>
        </div>
        {items.length === 0 ? (
          <p className={styles.empty}>{req ? t.emptyRequirement : t.emptyOutcome}</p>
        ) : (
          <ol className={styles.itemList}>
            {items.map((item) => (
              <li className={styles.itemRow} key={item.id}>
                <span className={styles.itemOrder}>{item.orderIndex}</span>
                <span className={styles.itemText}>{item.text}</span>
                <div className={styles.itemActions}>
                  <button type="button" onClick={() => startEdit(kind, item)} disabled={busy || editor !== null || removal !== null}>{t.edit}</button>
                  <button className={styles.deleteButton} type="button" onClick={() => { setRemoval({ kind, item }); setNotice(null); }} disabled={busy || editor !== null || removal !== null}>{t.remove}</button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    );
  }

  if (id === null) return <main className={styles.page}><p>{t.loadError}</p></main>;

  return (
    <main className={styles.page} dir={locale === "ar" ? "rtl" : "ltr"}>
      <Link className={styles.backLink} href={`/${locale}/admin/courses`}>{locale === "ar" ? "→" : "←"} {t.back}</Link>
      <header className={styles.heading}>
        <span className={styles.eyebrow}>{t.eyebrow}</span>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        {course && <div className={styles.courseMeta}><strong>{course.title}</strong><span>#{course.id}</span><span>{t.unpublished}: {course.status}</span></div>}
      </header>

      {state !== "ready" ? (
        <div className={styles.loadingPanel} role="status">
          <p>{state === "loading" ? t.loading : state === "unauthorized" ? t.session : state === "forbidden" ? t.forbidden : t.loadError}</p>
          {state === "error" && <button type="button" className={styles.primaryButton} onClick={() => { setState("loading"); setRefreshIndex((n) => n + 1); }}>{t.retry}</button>}
          {state === "unauthorized" && <Link href={`/${locale}/login`} className={styles.primaryButton}>{t.login}</Link>}
        </div>
      ) : (
        <>
          {notice && <div role={notice.type === "error" ? "alert" : "status"} className={notice.type === "error" ? styles.errorNotice : styles.successNotice}>{notice.text}</div>}
          {section("requirements", "01")}
            {section("learning-outcomes", "02")}

            {id !== null && (
            <SectionsManager
                courseId={id}
                locale={locale}
            />
            )}
        </>
        )}

      {editor && (
        <div className={styles.backdrop}>
          <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="course-content-editor-heading">
            <h2 id="course-content-editor-heading">{editor.id === null ? t.add : t.edit} — {editor.kind === "requirements" ? t.requirements : t.outcomes}</h2>
            <form onSubmit={(event) => void saveItem(event)}>
              <label htmlFor="itemText">{t.item}</label>
              <textarea id="itemText" rows={4} required autoFocus value={editor.text} onChange={(event) => setEditor((prev) => prev ? { ...prev, text: event.target.value } : null)} disabled={busy} />
              <label htmlFor="itemOrder">{t.order}</label>
              <input id="itemOrder" type="number" min="0" max="2147483647" step="1" required value={editor.order} onChange={(event) => setEditor((prev) => prev ? { ...prev, order: event.target.value } : null)} disabled={busy} />
              {notice?.type === "error" && <p role="alert" className={styles.inlineError}>{notice.text}</p>}
              <div className={styles.dialogActions}>
                <button type="button" onClick={() => { setEditor(null); setNotice(null); }} disabled={busy}>{t.cancel}</button>
                <button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? t.saving : editor.id === null ? t.add : t.save}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {removal && (
        <div className={styles.backdrop}>
          <section className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby="content-delete-title" aria-describedby="content-delete-description">
            <h2 id="content-delete-title">{t.deleteTitle}</h2>
            <p className={styles.removalText}>{removal.item.text}</p>
            <p id="content-delete-description">{t.deleteMessage}</p>
            {notice?.type === "error" && <p role="alert" className={styles.inlineError}>{notice.text}</p>}
            <div className={styles.dialogActions}>
              <button type="button" onClick={() => { setRemoval(null); setNotice(null); }} disabled={busy}>{t.cancel}</button>
              <button type="button" className={styles.dangerButton} onClick={() => void deleteItem()} disabled={busy}>{busy ? t.deleting : t.confirmDelete}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
