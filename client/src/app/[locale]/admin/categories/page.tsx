
"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import styles from "./page.module.css";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  isActive: boolean;
};

type CategoryForm = {
  name: string;
  description: string;
  imageUrl: string;
  parentCategoryId: string;
  isActive: boolean;
};

type StatusFilter = "all" | "active" | "inactive";
type HierarchyFilter = "all" | "main" | "sub";

const emptyForm: CategoryForm = {
  name: "",
  description: "",
  imageUrl: "",
  parentCategoryId: "",
  isActive: true,
};

const dictionary = {
  en: {
    eyebrow: "ACADEMY / CONTENT MANAGEMENT",
    title: "Categories",
    subtitle:
      "Organize your course catalog, manage learning areas, and control their visibility.",
    add: "New category",
    total: "Total categories",
    active: "Active",
    inactive: "Inactive",
    main: "Main categories",
    search: "Search categories...",
    status: "Status",
    hierarchy: "Hierarchy",
    all: "All statuses",
    allLevels: "All levels",
    mainOnly: "Main categories",
    subOnly: "Subcategories",
    category: "Category",
    parent: "Parent category",
    children: "Subcategories",
    actions: "Actions",
    edit: "Edit",
    activate: "Activate",
    deactivate: "Deactivate",
    enabled: "Active",
    disabled: "Inactive",
    root: "Main category",
    reload: "Refresh",
    noDescription: "No description provided",
    noResults: "No matching categories",
    noResultsText:
      "Adjust your filters or search to see other categories.",
    emptyTitle: "Your category library is empty",
    emptyText:
      "Create your first category to organize your courses.",
    loadError: "We couldn't load the categories.",
    requestError: "The request could not be completed.",
    formNew: "Create a category",
    formEdit: "Edit category",
    formIntro:
      "Category details are used to organize courses across the academy.",
    name: "Category name",
    namePlaceholder: "e.g. Backend Development",
    description: "Description",
    descriptionPlaceholder: "Describe this learning area...",
    image: "Category image URL",
    imagePlaceholder: "https://example.org/category.jpg",
    optional: "Optional",
    parentField: "Parent category",
    noParent: "None — main category",
    activeField: "Visible and active",
    activeHelp:
      "Inactive categories won't appear in the public active-category listing.",
    cancel: "Cancel",
    create: "Create category",
    save: "Save changes",
    saving: "Saving...",
    nameRequired: "Please enter a category name.",
    invalidUrl: "Please enter a valid HTTP or HTTPS image URL.",
    confirmTitleActive: "Activate this category?",
    confirmTitleInactive: "Deactivate this category?",
    confirmActive:
      "This category will become active again.",
    confirmInactive:
      "This category will be marked inactive. Check any related courses or subcategories.",
    confirm: "Confirm change",
    updating: "Updating...",
    createSuccess: "Category created successfully.",
    editSuccess: "Category updated successfully.",
    statusSuccess: "Category status updated successfully.",
    note: "Categories are connected to the academy's ASP.NET Core API.",
    clear: "Clear filters",
  },
  ar: {
    eyebrow: "الأكاديمية / إدارة المحتوى",
    title: "إدارة التصنيفات",
    subtitle:
      "نظّم مجالات الأكاديمية، وأدر تصنيفات الدورات والتصنيفات الفرعية وحالة ظهورها.",
    add: "إضافة تصنيف",
    total: "إجمالي التصنيفات",
    active: "المفعّلة",
    inactive: "غير المفعّلة",
    main: "التصنيفات الرئيسية",
    search: "ابحث عن تصنيف...",
    status: "الحالة",
    hierarchy: "النوع",
    all: "جميع الحالات",
    allLevels: "جميع الأنواع",
    mainOnly: "الرئيسية فقط",
    subOnly: "الفرعية فقط",
    category: "التصنيف",
    parent: "التصنيف الأب",
    children: "تصنيفات فرعية",
    actions: "الإجراءات",
    edit: "تعديل",
    activate: "تفعيل",
    deactivate: "تعطيل",
    enabled: "مفعّل",
    disabled: "معطّل",
    root: "تصنيف رئيسي",
    reload: "تحديث",
    noDescription: "لا يوجد وصف لهذا التصنيف",
    noResults: "لا توجد نتائج مطابقة",
    noResultsText:
      "غيّر البحث أو الفلاتر لعرض تصنيفات أخرى.",
    emptyTitle: "لم تتم إضافة تصنيفات بعد",
    emptyText:
      "ابدأ بإضافة أول تصنيف لتنظيم الدورات داخل الأكاديمية.",
    loadError: "تعذّر تحميل التصنيفات.",
    requestError: "تعذّر تنفيذ العملية.",
    formNew: "إنشاء تصنيف جديد",
    formEdit: "تعديل التصنيف",
    formIntro:
      "تُستخدم بيانات التصنيف لتنظيم الدورات والمجالات التعليمية.",
    name: "اسم التصنيف",
    namePlaceholder: "مثال: Backend Development",
    description: "الوصف",
    descriptionPlaceholder: "اكتب وصفًا للمجال التعليمي...",
    image: "رابط صورة التصنيف",
    imagePlaceholder: "https://example.org/category.jpg",
    optional: "اختياري",
    parentField: "التصنيف الأب",
    noParent: "بدون — تصنيف رئيسي",
    activeField: "التصنيف مفعّل",
    activeHelp:
      "التصنيفات المعطّلة لا تظهر في القائمة العامة للتصنيفات المفعّلة.",
    cancel: "إلغاء",
    create: "إنشاء التصنيف",
    save: "حفظ التعديلات",
    saving: "جارٍ الحفظ...",
    nameRequired: "يرجى إدخال اسم التصنيف.",
    invalidUrl: "يرجى إدخال رابط صورة HTTP أو HTTPS صحيح.",
    confirmTitleActive: "هل تريد تفعيل التصنيف؟",
    confirmTitleInactive: "هل تريد تعطيل التصنيف؟",
    confirmActive: "سيعود التصنيف إلى الحالة المفعّلة.",
    confirmInactive:
      "سيصبح التصنيف غير مفعّل. تأكد من تأثير ذلك على الدورات والتصنيفات الفرعية المرتبطة به.",
    confirm: "تأكيد التغيير",
    updating: "جارٍ التحديث...",
    createSuccess: "تم إنشاء التصنيف بنجاح.",
    editSuccess: "تم تعديل التصنيف بنجاح.",
    statusSuccess: "تم تحديث حالة التصنيف بنجاح.",
    note: "هذه البيانات مرتبطة مباشرة بواجهة ASP.NET Core API.",
    clear: "إزالة الفلاتر",
  },
} as const;

function extractArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;

  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;

  for (const key of ["items", "categories", "results", "data"]) {
    const candidate = record[key];

    if (Array.isArray(candidate)) return candidate;

    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate)
    ) {
      const nested = candidate as Record<string, unknown>;

      if (Array.isArray(nested.items)) return nested.items;
      if (Array.isArray(nested.categories)) return nested.categories;
    }
  }

  return null;
}

function toCategory(value: unknown): Category | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const item = value as Record<string, unknown>;

  if (
    !Number.isSafeInteger(item.id) ||
    (item.id as number) <= 0 ||
    typeof item.name !== "string" ||
    typeof item.isActive !== "boolean"
  ) {
    return null;
  }

  return {
    id: item.id as number,
    name: item.name,
    slug: typeof item.slug === "string" ? item.slug : "",
    description:
      typeof item.description === "string"
        ? item.description
        : null,
    imageUrl:
      typeof item.imageUrl === "string" &&
      item.imageUrl.trim() &&
      item.imageUrl.trim().toLowerCase() !== "null"
        ? item.imageUrl.trim()
        : null,
    parentCategoryId:
      typeof item.parentCategoryId === "number" &&
      item.parentCategoryId > 0
        ? item.parentCategoryId
        : null,
    parentCategoryName:
      typeof item.parentCategoryName === "string"
        ? item.parentCategoryName
        : null,
    isActive: item.isActive,
  };
}

function validImageUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function getApiError(value: unknown, fallback: string): string {
  if (!value || typeof value !== "object") return fallback;

  const data = value as Record<string, unknown>;

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (data.errors && typeof data.errors === "object") {
    const errors = Object.values(data.errors).flat();
    const first = errors.find((item) => typeof item === "string");
    if (typeof first === "string") return first;
  }

  if (typeof data.title === "string" && data.title.trim()) {
    return data.title;
  }

  return fallback;
}

async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export default function AdminCategoriesPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale === "ar" ? "ar" : "en";
  const t = dictionary[locale];

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");
  const [hierarchyFilter, setHierarchyFilter] =
    useState<HierarchyFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirmCategory, setConfirmCategory] =
    useState<Category | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);

  const loadCategories = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch("/api/admin/categories", {
        cache: "no-store",
        credentials: "same-origin",
        signal,
      });

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          getApiError(data, "Could not load categories.")
        );
      }

      const array = extractArray(data);

      if (!array) {
        throw new Error("Unexpected categories response.");
      }

      const normalized = array
        .map(toCategory)
        .filter((item): item is Category => item !== null);

      setCategories(normalized);
    } catch (error) {
      if (signal?.aborted) return;

      setLoadError(
        error instanceof Error ? error.message : "Request failed."
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadCategories(controller.signal);

    return () => controller.abort();
  }, [loadCategories]);

  useEffect(() => {
    if (!formOpen && !confirmCategory) return;

    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (saving || changingStatus) return;

      setFormOpen(false);
      setConfirmCategory(null);
    }

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [formOpen, confirmCategory, saving, changingStatus]);

  const lookup = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const counts = useMemo(
    () => ({
      total: categories.length,
      active: categories.filter((c) => c.isActive).length,
      inactive: categories.filter((c) => !c.isActive).length,
      main: categories.filter((c) => c.parentCategoryId === null)
        .length,
    }),
    [categories]
  );

  const visibleCategories = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();

    return categories
      .filter((category) => {
        const parentName =
          category.parentCategoryName ||
          lookup.get(category.parentCategoryId ?? -1)?.name ||
          "";

        const matchesSearch =
          !term ||
          [category.name, category.slug, category.description, parentName]
            .some((value) => value?.toLocaleLowerCase().includes(term));

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && category.isActive) ||
          (statusFilter === "inactive" && !category.isActive);

        const matchesHierarchy =
          hierarchyFilter === "all" ||
          (hierarchyFilter === "main" &&
            category.parentCategoryId === null) ||
          (hierarchyFilter === "sub" &&
            category.parentCategoryId !== null);

        return matchesSearch && matchesStatus && matchesHierarchy;
      })
      .sort((a, b) => {
        if (a.parentCategoryId === null && b.parentCategoryId !== null)
          return -1;

        if (a.parentCategoryId !== null && b.parentCategoryId === null)
          return 1;

        return a.name.localeCompare(b.name);
      });
  }, [categories, hierarchyFilter, lookup, query, statusFilter]);

  function isDescendant(candidateId: number, ancestorId: number) {
    let current = lookup.get(candidateId)?.parentCategoryId ?? null;
    const visited = new Set<number>();

    while (current !== null && !visited.has(current)) {
      if (current === ancestorId) return true;
      visited.add(current);
      current = lookup.get(current)?.parentCategoryId ?? null;
    }

    return false;
  }

  const parentOptions = categories.filter(
    (category) =>
      editingId === null ||
      (category.id !== editingId &&
        !isDescendant(category.id, editingId))
  );

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setFormError("");
    setNotice("");
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description ?? "",
      imageUrl: category.imageUrl ?? "",
      parentCategoryId:
        category.parentCategoryId?.toString() ?? "",
      isActive: category.isActive,
    });
    setFormError("");
    setNotice("");
    setFormOpen(true);
  }

  function updateForm<Key extends keyof CategoryForm>(
    key: Key,
    value: CategoryForm[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    if (formError) setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const name = form.name.trim();

    if (!name) {
      setFormError(t.nameRequired);
      return;
    }

    if (form.imageUrl.trim() && !validImageUrl(form.imageUrl.trim())) {
      setFormError(t.invalidUrl);
      return;
    }

    const parentCategoryId = form.parentCategoryId
      ? Number(form.parentCategoryId)
      : null;

    const payload = {
      name,
      description: form.description.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      parentCategoryId,
      isActive: form.isActive,
    };

    setSaving(true);
    setFormError("");

    try {
      const editing = editingId !== null;

      const response = await fetch(
        editing
          ? `/api/admin/categories/${editingId}`
          : "/api/admin/categories",
        {
          method: editing ? "PUT" : "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(getApiError(data, t.requestError));
      }

      setFormOpen(false);
      setNotice(editing ? t.editSuccess : t.createSuccess);
      await loadCategories();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : t.requestError
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange() {
    if (!confirmCategory || changingStatus) return;

    const category = confirmCategory;
    const newStatus = !category.isActive;

    setChangingStatus(true);
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/categories/${category.id}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: newStatus }),
        }
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(getApiError(data, t.requestError));
      }

      setConfirmCategory(null);
      setNotice(t.statusSuccess);
      await loadCategories();
    } catch (error) {
      setConfirmCategory(null);
      setLoadError(
        error instanceof Error ? error.message : t.requestError
      );
    } finally {
      setChangingStatus(false);
    }
  }

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setHierarchyFilter("all");
  }

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headingGroup}>
          <span className={styles.eyebrow}>{t.eyebrow}</span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>

        <button
          type="button"
          className={styles.addButton}
          onClick={openCreate}
        >
          <span aria-hidden="true">+</span>
          {t.add}
        </button>
      </header>

      <section className={styles.stats} aria-label={t.title}>
        {[
          { label: t.total, value: counts.total, code: "01" },
          { label: t.active, value: counts.active, code: "02" },
          { label: t.inactive, value: counts.inactive, code: "03" },
          { label: t.main, value: counts.main, code: "04" },
        ].map((item) => (
          <div className={styles.statCard} key={item.code}>
            <div className={styles.statTop}>
              <span>{item.label}</span>
              <small>{item.code}</small>
            </div>
            <strong>{loading ? "—" : item.value}</strong>
          </div>
        ))}
      </section>

      <section className={styles.workspace}>
        <div className={styles.workspaceHeader}>
          <div>
            <h3>{t.title}</h3>
            <p>{t.note}</p>
          </div>

          <button
            type="button"
            className={styles.refreshButton}
            onClick={() => void loadCategories()}
            disabled={loading}
          >
            <span aria-hidden="true">↻</span>
            {t.reload}
          </button>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>
            <input
              aria-label={t.search}
              type="search"
              value={query}
              placeholder={t.search}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <label className={styles.filter}>
            <span>{t.status}</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="all">{t.all}</option>
              <option value="active">{t.enabled}</option>
              <option value="inactive">{t.disabled}</option>
            </select>
          </label>

          <label className={styles.filter}>
            <span>{t.hierarchy}</span>
            <select
              value={hierarchyFilter}
              onChange={(event) =>
                setHierarchyFilter(event.target.value as HierarchyFilter)
              }
            >
              <option value="all">{t.allLevels}</option>
              <option value="main">{t.mainOnly}</option>
              <option value="sub">{t.subOnly}</option>
            </select>
          </label>
        </div>

        {notice && (
          <div className={styles.successNotice} role="status">
            <span aria-hidden="true">✓</span> {notice}
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {loadError && (
          <div className={styles.errorNotice} role="alert">
            {loadError}
            <button
              type="button"
              onClick={() => void loadCategories()}
            >
              {t.reload}
            </button>
          </div>
        )}

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t.category}</th>
                <th>{t.parent}</th>
                <th>{t.children}</th>
                <th>{t.status}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <div className={styles.loadingState}>
                      <span className={styles.spinner} />
                      {t.reload}...
                    </div>
                  </td>
                </tr>
              ) : visibleCategories.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className={styles.emptyState}>
                      <span className={styles.emptyIcon}>▦</span>
                      <h4>
                        {categories.length === 0
                          ? t.emptyTitle
                          : t.noResults}
                      </h4>
                      <p>
                        {categories.length === 0
                          ? t.emptyText
                          : t.noResultsText}
                      </p>
                      {categories.length === 0 ? (
                        <button type="button" onClick={openCreate}>
                          {t.add}
                        </button>
                      ) : (
                        <button type="button" onClick={clearFilters}>
                          {t.clear}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                visibleCategories.map((category) => {
                  const imageUrl = validImageUrl(
                    category.imageUrl
                  );

                  const parentName =
                    category.parentCategoryName ||
                    lookup.get(category.parentCategoryId ?? -1)?.name ||
                    t.root;

                  const childrenCount = categories.filter(
                    (item) => item.parentCategoryId === category.id
                  ).length;

                  return (
                    <tr key={category.id}>
                      <td>
                        <div className={styles.categoryCell}>
                          <div className={styles.categoryImage}>
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt=""
                                fill
                                unoptimized
                                sizes="52px"
                                className={styles.thumbnail}
                              />
                            ) : (
                              <span>
                                {category.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className={styles.categoryText}>
                            <strong>{category.name}</strong>
                            <span>
                              {category.slug || `ID: ${category.id}`}
                            </span>
                            <small>
                              {category.description ||
                                t.noDescription}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={styles.parentText}>
                          {category.parentCategoryId === null
                            ? t.root
                            : parentName}
                        </span>
                      </td>

                      <td>
                        <span className={styles.childrenCount}>
                          {childrenCount}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            category.isActive
                              ? styles.activeStatus
                              : styles.inactiveStatus
                          }`}
                        >
                          <span aria-hidden="true" />
                          {category.isActive
                            ? t.enabled
                            : t.disabled}
                        </span>
                      </td>

                      <td>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.editButton}
                            onClick={() => openEdit(category)}
                          >
                            {t.edit}
                          </button>

                          <button
                            type="button"
                            className={
                              category.isActive
                                ? styles.deactivateButton
                                : styles.activateButton
                            }
                            onClick={() => {
                              setLoadError("");
                              setConfirmCategory(category);
                            }}
                          >
                            {category.isActive
                              ? t.deactivate
                              : t.activate}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <span>CRESTMARK ACADEMY / CATEGORIES</span>
          <span>
            {visibleCategories.length} / {categories.length}
          </span>
        </div>
      </section>

      {/* CREATE / EDIT MODAL */}
      {formOpen && (
        <div className={styles.modalOverlay}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-form-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.eyebrow}>
                  CRESTMARK / CATEGORIES
                </span>
                <h2 id="category-form-title">
                  {editingId === null ? t.formNew : t.formEdit}
                </h2>
                <p>{t.formIntro}</p>
              </div>

              <button
                className={styles.closeButton}
                type="button"
                aria-label={t.cancel}
                disabled={saving}
                onClick={() => setFormOpen(false)}
              >
                ×
              </button>
            </div>

            <form className={styles.modalForm} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span>{t.name} *</span>
                <input
                  autoFocus
                  required
                  maxLength={150}
                  value={form.name}
                  placeholder={t.namePlaceholder}
                  onChange={(event) =>
                    updateForm("name", event.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span>{t.description}</span>
                <textarea
                  rows={4}
                  value={form.description}
                  placeholder={t.descriptionPlaceholder}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span>
                  {t.image}
                  <small>{t.optional}</small>
                </span>
                <input
                  type="url"
                  value={form.imageUrl}
                  placeholder={t.imagePlaceholder}
                  onChange={(event) =>
                    updateForm("imageUrl", event.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span>{t.parentField}</span>
                <select
                  value={form.parentCategoryId}
                  onChange={(event) =>
                    updateForm("parentCategoryId", event.target.value)
                  }
                >
                  <option value="">{t.noParent}</option>
                  {parentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.switchRow}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    updateForm("isActive", event.target.checked)
                  }
                />
                <span>
                  <strong>{t.activeField}</strong>
                  <small>{t.activeHelp}</small>
                </span>
              </label>

              {formError && (
                <div className={styles.formError} role="alert">
                  {formError}
                </div>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  disabled={saving}
                  onClick={() => setFormOpen(false)}
                >
                  {t.cancel}
                </button>

                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={saving}
                >
                  {saving
                    ? t.saving
                    : editingId === null
                      ? t.create
                      : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTIVATION CONFIRMATION */}
      {confirmCategory && (
        <div className={styles.modalOverlay}>
          <div
            className={styles.confirmDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-confirm-title"
          >
            <div className={styles.confirmSymbol}>!</div>

            <h2 id="status-confirm-title">
              {confirmCategory.isActive
                ? t.confirmTitleInactive
                : t.confirmTitleActive}
            </h2>

            <strong className={styles.confirmName}>
              {confirmCategory.name}
            </strong>

            <p>
              {confirmCategory.isActive
                ? t.confirmInactive
                : t.confirmActive}
            </p>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                type="button"
                disabled={changingStatus}
                onClick={() => setConfirmCategory(null)}
              >
                {t.cancel}
              </button>

              <button
                className={styles.saveButton}
                type="button"
                disabled={changingStatus}
                onClick={() => void handleStatusChange()}
              >
                {changingStatus ? t.updating : t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
