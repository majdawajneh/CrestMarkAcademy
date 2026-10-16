
"use client";

import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import styles from "./page.module.css";

type Locale = "en" | "ar";

type Coupon = {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  isGlobal: boolean;
  courseIds: number[];
};

type Course = {
  id: number;
  title: string;
};

type CouponForm = {
  code: string;
  discountType: string;
  discountValue: string;
  startDate: string;
  endDate: string;
  usageLimit: string;
  isActive: boolean;
  courseIds: number[];
};

type Mode = "create" | number | null;
type ToggleAction = { coupon: Coupon; activate: boolean };

const translations = {
  en: {
    eyebrow: "ACADEMY / COMMERCE",
    title: "Coupons management",
    subtitle: "Create, organize and control course discount codes.",
    newCoupon: "Create coupon",
    total: "Total coupons",
    enabled: "Enabled coupons",
    expired: "Expired coupons",
    redemptions: "Recorded uses",
    directory: "Coupon directory",
    directoryHint: "Promotion rules retrieved from the academy API.",
    refresh: "Refresh",
    search: "Search by coupon code or course...",
    allStatuses: "All statuses",
    allScopes: "All scopes",
    global: "Global",
    specific: "Course-specific",
    code: "Coupon code",
    discount: "Discount",
    scope: "Applies to",
    validity: "Valid period",
    usage: "Usage",
    status: "Status",
    actions: "Actions",
    manage: "Manage",
    activate: "Activate",
    deactivate: "Deactivate",
    active: "Active",
    inactive: "Inactive",
    scheduled: "Scheduled",
    exhausted: "Limit reached",
    noResults: "No matching coupons",
    noCoupons: "No coupons have been created yet.",
    emptyHint: "Try another search or adjust the filters.",
    loadError: "Could not load coupons.",
    coursesError: "Could not load the course catalog.",
    tryAgain: "Try again",
    showing: "Showing",
    of: "of",
    createTitle: "Create a coupon",
    editTitle: "Manage coupon",
    createHint: "Define the promotion and select its eligible courses.",
    editHint: "Review and update this coupon's settings.",
    codeHint: "The code students enter during checkout.",
    type: "Discount type",
    typeHint:
      "Percentage is confirmed by the API. Other types must match a value supported by the backend.",
    value: "Discount value",
    starts: "Start date",
    ends: "End date",
    limit: "Usage limit",
    used: "Times used",
    limitHint: "Maximum allowed uses, subject to backend rules.",
    enabledField: "Coupon is enabled",
    courses: "Eligible courses",
    coursesHint:
      "Select the courses where this coupon can be applied.",
    searchCourses: "Search courses...",
    noCourses: "No courses are available.",
    globalNote:
      "This coupon is global according to the API. Its course scope is preserved during editing.",
    globalCreateNote:
      "Creating new global coupons is disabled until the backend's empty courseIds behavior is verified.",
    selectCourse: "Select at least one course.",
    save: "Save changes",
    create: "Create coupon",
    saving: "Saving...",
    close: "Close",
    cancel: "Cancel",
    validation: "Please check the form fields.",
    dateError: "The end date must be after the start date.",
    percentageError: "A percentage discount must be between 0 and 100.",
    amountError: "Discount value must be greater than zero.",
    usageError: "Usage limit must be a valid non-negative integer.",
    usedError: "The usage limit cannot be less than recorded uses.",
    requestError: "The request could not be completed.",
    saved: "Coupon changes saved successfully.",
    created: "Coupon created successfully.",
    updatedStatus: "Coupon status updated successfully.",
    confirmActivate: "Activate this coupon?",
    confirmDeactivate: "Deactivate this coupon?",
    confirmActivateHint:
      "This enables the coupon. Date and usage restrictions still apply.",
    confirmDeactivateHint:
      "This disables the coupon for future use, according to backend rules.",
    confirm: "Confirm",
    detailsError: "Could not load coupon details.",
    unknownCourse: "Course",
    loading: "Loading coupons...",
    loadingDetail: "Loading coupon details...",
    none: "None",
  },
  ar: {
    eyebrow: "الأكاديمية / المبيعات",
    title: "إدارة الكوبونات",
    subtitle: "أنشئ كوبونات الخصم ونظّمها وتحكّم في صلاحيتها والدورات المرتبطة بها.",
    newCoupon: "إنشاء كوبون",
    total: "إجمالي الكوبونات",
    enabled: "الكوبونات المفعّلة",
    expired: "الكوبونات المنتهية",
    redemptions: "مرات الاستخدام",
    directory: "سجل الكوبونات",
    directoryHint: "قواعد الخصم المسجلة في الأكاديمية.",
    refresh: "تحديث",
    search: "ابحث برمز الكوبون أو اسم الدورة...",
    allStatuses: "جميع الحالات",
    allScopes: "جميع النطاقات",
    global: "عام لجميع الدورات",
    specific: "دورات محددة",
    code: "رمز الكوبون",
    discount: "الخصم",
    scope: "الدورات المشمولة",
    validity: "فترة الصلاحية",
    usage: "الاستخدام",
    status: "الحالة",
    actions: "الإجراءات",
    manage: "إدارة",
    activate: "تفعيل",
    deactivate: "تعطيل",
    active: "نشط",
    inactive: "معطّل",
    scheduled: "لم يبدأ بعد",
    exhausted: "بلغ الحد",
    noResults: "لا توجد كوبونات مطابقة",
    noCoupons: "لم يتم إنشاء أي كوبون بعد.",
    emptyHint: "جرّب تعديل البحث أو الفلاتر.",
    loadError: "تعذّر تحميل الكوبونات.",
    coursesError: "تعذّر تحميل قائمة الدورات.",
    tryAgain: "إعادة المحاولة",
    showing: "عرض",
    of: "من أصل",
    createTitle: "إنشاء كوبون",
    editTitle: "إدارة الكوبون",
    createHint: "حدد الخصم وفترة صلاحيته والدورات المشمولة.",
    editHint: "راجع إعدادات الكوبون وقم بتعديلها.",
    codeHint: "الرمز الذي يدخله الطالب عند الشراء.",
    type: "نوع الخصم",
    typeHint:
      "القيمة Percentage مؤكدة. الأنواع الأخرى يجب أن تطابق القيم التي يدعمها الـ Backend.",
    value: "قيمة الخصم",
    starts: "تاريخ البداية",
    ends: "تاريخ الانتهاء",
    limit: "الحد الأقصى للاستخدام",
    used: "مرات الاستخدام السابقة",
    limitHint: "الحد الأعلى للاستخدام وفق قواعد الـ Backend.",
    enabledField: "الكوبون مفعّل",
    courses: "الدورات المشمولة",
    coursesHint: "اختر الدورات التي يمكن تطبيق الكوبون عليها.",
    searchCourses: "ابحث عن دورة...",
    noCourses: "لا توجد دورات متاحة.",
    globalNote:
      "هذا الكوبون عام بحسب الـ API. سنحافظ على نطاقه الحالي أثناء التعديل.",
    globalCreateNote:
      "إنشاء الكوبونات العامة مؤجل حتى نتأكد من معنى courseIds الفارغة في الـ Backend.",
    selectCourse: "اختر دورة واحدة على الأقل.",
    save: "حفظ التعديلات",
    create: "إنشاء الكوبون",
    saving: "جارٍ الحفظ...",
    close: "إغلاق",
    cancel: "إلغاء",
    validation: "يرجى مراجعة حقول النموذج.",
    dateError: "يجب أن يكون تاريخ الانتهاء بعد تاريخ البداية.",
    percentageError: "يجب أن تكون نسبة الخصم أكبر من صفر ولا تتجاوز 100.",
    amountError: "يجب أن تكون قيمة الخصم أكبر من صفر.",
    usageError: "حد الاستخدام يجب أن يكون عددًا صحيحًا غير سالب.",
    usedError: "لا يمكن جعل حد الاستخدام أقل من مرات الاستخدام المسجلة.",
    requestError: "تعذّر تنفيذ الطلب.",
    saved: "تم حفظ التعديلات بنجاح.",
    created: "تم إنشاء الكوبون بنجاح.",
    updatedStatus: "تم تحديث حالة الكوبون بنجاح.",
    confirmActivate: "هل تريد تفعيل الكوبون؟",
    confirmDeactivate: "هل تريد تعطيل الكوبون؟",
    confirmActivateHint:
      "سيصبح الكوبون مفعّلًا، مع استمرار تطبيق شروط التاريخ وحدود الاستخدام.",
    confirmDeactivateHint:
      "سيتم تعطيل الكوبون عن الاستخدام المستقبلي حسب قواعد الـ Backend.",
    confirm: "تأكيد",
    detailsError: "تعذّر تحميل تفاصيل الكوبون.",
    unknownCourse: "دورة",
    loading: "جارٍ تحميل الكوبونات...",
    loadingDetail: "جارٍ تحميل تفاصيل الكوبون...",
    none: "لا يوجد",
  },
} as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function positiveId(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
    ? value
    : null;
}

function getArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!isObject(value)) return null;

  for (const key of ["items", "data", "results", "coupons", "courses"]) {
    if (Array.isArray(value[key])) return value[key] as unknown[];

    if (
      isObject(value[key]) &&
      Array.isArray((value[key] as Record<string, unknown>).items)
    ) {
      return (value[key] as { items: unknown[] }).items;
    }
  }

  return null;
}

function parseCoupon(value: unknown): Coupon | null {
  if (!isObject(value)) return null;

  const id = positiveId(value.id);

  if (
    !id ||
    typeof value.code !== "string" ||
    typeof value.discountType !== "string" ||
    typeof value.discountValue !== "number" ||
    !Number.isFinite(value.discountValue) ||
    typeof value.startDate !== "string" ||
    typeof value.endDate !== "string" ||
    typeof value.usageLimit !== "number" ||
    typeof value.usedCount !== "number" ||
    typeof value.isActive !== "boolean" ||
    typeof value.isGlobal !== "boolean" ||
    !Array.isArray(value.courseIds)
  ) {
    return null;
  }

  const courseIds = value.courseIds.map(positiveId);

  if (courseIds.some((courseId) => courseId === null)) {
    return null;
  }

  return {
    id,
    code: value.code,
    discountType: value.discountType,
    discountValue: value.discountValue,
    startDate: value.startDate,
    endDate: value.endDate,
    usageLimit: value.usageLimit,
    usedCount: value.usedCount,
    isActive: value.isActive,
    isGlobal: value.isGlobal,
    courseIds: courseIds as number[],
  };
}

function parseCourse(value: unknown): Course | null {
  if (!isObject(value)) return null;

  const id = positiveId(value.id);

  if (!id || typeof value.title !== "string") return null;

  return { id, title: value.title };
}

async function readResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 300) };
  }
}

function errorText(value: unknown, fallback: string): string {
  if (!isObject(value)) return fallback;

  for (const key of ["message", "Message", "title"]) {
    if (typeof value[key] === "string" && value[key]) {
      return value[key] as string;
    }
  }

  if (isObject(value.errors)) {
    for (const entry of Object.values(value.errors)) {
      if (Array.isArray(entry)) {
        const message = entry.find(
          (item) => typeof item === "string"
        );
        if (typeof message === "string") return message;
      }
    }
  }

  return fallback;
}

async function getList(
  url: string,
  fallback: string,
  signal?: AbortSignal
): Promise<unknown[]> {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });

  const body = await readResponse(response);

  if (!response.ok) {
    throw new Error(errorText(body, fallback));
  }

  const items = getArray(body);

  if (!items) throw new Error(`Unexpected response: ${url}`);

  return items;
}

async function getCourses(
  fallback: string,
  signal?: AbortSignal
): Promise<unknown[]> {
  let response = await fetch("/api/admin/courses", {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });

  if (response.status === 404 || response.status === 405) {
    response = await fetch("/api/courses", {
      credentials: "same-origin",
      cache: "no-store",
      signal,
    });
  }

  const body = await readResponse(response);

  if (!response.ok) {
    throw new Error(errorText(body, fallback));
  }

  const items = getArray(body);

  if (!items) throw new Error("Unexpected courses response.");

  return items;
}

function emptyForm(): CouponForm {
  return {
    code: "",
    discountType: "Percentage",
    discountValue: "",
    startDate: "",
    endDate: "",
    usageLimit: "100",
    isActive: true,
    courseIds: [],
  };
}

function formFromCoupon(coupon: Coupon): CouponForm {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: String(coupon.discountValue),
    startDate: coupon.startDate.slice(0, 19),
    endDate: coupon.endDate.slice(0, 19),
    usageLimit: String(coupon.usageLimit),
    isActive: coupon.isActive,
    courseIds: [...coupon.courseIds],
  };
}

function asBackendDate(value: string): string {
  const normalized = value.slice(0, 19);

  return normalized.length === 16
    ? `${normalized}:00`
    : normalized;
}

function displayDate(value: string, locale: Locale): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

function displayDiscount(coupon: Coupon): string {
  const value = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(coupon.discountValue);

  return coupon.discountType.toLowerCase() === "percentage"
    ? `${value}%`
    : value;
}

function couponState(coupon: Coupon): string {
  if (!coupon.isActive) return "inactive";

  const now = Date.now();
  const start = new Date(coupon.startDate).getTime();
  const end = new Date(coupon.endDate).getTime();

  if (Number.isFinite(end) && now > end) return "expired";
  if (Number.isFinite(start) && now < start) return "scheduled";

  if (
    coupon.usageLimit > 0 &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return "exhausted";
  }

  return "active";
}

export default function AdminCouponsPage() {
  const params = useParams<{ locale: string }>();
  const locale: Locale = params.locale === "ar" ? "ar" : "en";
  const t = translations[locale];

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [coursesError, setCoursesError] = useState("");
  const [coursesReady, setCoursesReady] = useState(false);
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");

  const [mode, setMode] = useState<Mode>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [originalCoupon, setOriginalCoupon] = useState<Coupon | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");

  const [toggleTarget, setToggleTarget] =
    useState<ToggleAction | null>(null);
  const [toggleError, setToggleError] = useState("");

  const loadCoupons = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError("");

    try {
      const items = await getList(
        "/api/admin/coupons",
        t.loadError,
        signal
      );

      if (signal?.aborted) return;

      const parsed = items.map(parseCoupon);

      if (parsed.some((item) => item === null)) {
        throw new Error("Unexpected coupon data returned by the API.");
      }

      setCoupons(
        (parsed as Coupon[]).sort((a, b) => b.id - a.id)
      );
    } catch (error) {
      if (signal?.aborted) return;

      setCoupons([]);
      setLoadError(
        error instanceof Error ? error.message : t.loadError
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [t.loadError]);

  const loadCourses = useCallback(async (signal?: AbortSignal) => {
    setCoursesError("");
    setCoursesReady(false);

    try {
      const items = await getCourses(t.coursesError, signal);

      if (signal?.aborted) return;

      const parsed = items.map(parseCourse);

      if (parsed.some((course) => course === null)) {
        throw new Error("Unexpected course data returned by the API.");
      }

      setCourses(
        (parsed as Course[]).sort((a, b) =>
          a.title.localeCompare(b.title)
        )
      );
      setCoursesReady(true);
    } catch (error) {
      if (signal?.aborted) return;

      setCourses([]);
      setCoursesError(
        error instanceof Error ? error.message : t.coursesError
      );
    }
  }, [t.coursesError]);

  useEffect(() => {
    const controller = new AbortController();

    void loadCoupons(controller.signal);
    void loadCourses(controller.signal);

    return () => controller.abort();
  }, [loadCoupons, loadCourses]);

  // Load a fresh coupon when opening Edit.
  useEffect(() => {
    if (typeof mode !== "number") return;

    const id = mode;
    const controller = new AbortController();

    async function loadDetail() {
      setDetailLoading(true);
      setOriginalCoupon(null);
      setFormError("");

      try {
        const response = await fetch(
          `/api/admin/coupons/${id}`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const body = await readResponse(response);
        if (controller.signal.aborted) return;

        if (!response.ok) {
          throw new Error(errorText(body, t.detailsError));
        }

        const coupon = parseCoupon(body);

        if (!coupon || coupon.id !== id) {
          throw new Error(t.detailsError);
        }

        setOriginalCoupon(coupon);
        setForm(formFromCoupon(coupon));
      } catch (error) {
        if (controller.signal.aborted) return;

        setFormError(
          error instanceof Error ? error.message : t.detailsError
        );
      } finally {
        if (!controller.signal.aborted) setDetailLoading(false);
      }
    }

    void loadDetail();
    return () => controller.abort();
  }, [mode, t.detailsError]);

  useEffect(() => {
    if (mode === null && !toggleTarget) return;

    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || saving) return;

      if (toggleTarget) {
        setToggleTarget(null);
      } else {
        setMode(null);
      }
    }

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [mode, toggleTarget, saving]);

  const coursesById = useMemo(
    () => new Map(courses.map((course) => [course.id, course])),
    [courses]
  );

  const stats = useMemo(() => ({
    total: coupons.length,
    enabled: coupons.filter((coupon) => coupon.isActive).length,
    expired: coupons.filter(
      (coupon) => couponState(coupon) === "expired"
    ).length,
    redemptions: coupons.reduce(
      (sum, coupon) => sum + coupon.usedCount,
      0
    ),
  }), [coupons]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return coupons.filter((coupon) => {
      const courseNames = coupon.courseIds
        .map((id) => coursesById.get(id)?.title ?? `#${id}`)
        .join(" ");

      const matchesSearch =
        !term ||
        `${coupon.code} ${coupon.discountType} ${courseNames}`
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        couponState(coupon) === statusFilter;

      const matchesScope =
        scopeFilter === "all" ||
        (scopeFilter === "global" && coupon.isGlobal) ||
        (scopeFilter === "specific" && !coupon.isGlobal);

      return matchesSearch && matchesStatus && matchesScope;
    });
  }, [coupons, search, statusFilter, scopeFilter, coursesById]);

  const searchedCourses = useMemo(() => {
    const term = courseSearch.trim().toLowerCase();
    return courses.filter(
      (course) =>
        !term ||
        course.title.toLowerCase().includes(term) ||
        String(course.id).includes(term)
    );
  }, [courses, courseSearch]);

  function openCreate() {
    setForm(emptyForm());
    setOriginalCoupon(null);
    setFormError("");
    setCourseSearch("");
    setMode("create");
    setNotice("");
  }

  function openEdit(id: number) {
    setFormError("");
    setCourseSearch("");
    setOriginalCoupon(null);
    setMode(id);
    setNotice("");
  }

  function toggleCourse(id: number, checked: boolean) {
    setForm((current) => ({
      ...current,
      courseIds: checked
        ? [...new Set([...current.courseIds, id])]
        : current.courseIds.filter((courseId) => courseId !== id),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || detailLoading || !coursesReady) return;
    if (typeof mode === "number" && !originalCoupon) return;

    setFormError("");

    const discountValue = Number(form.discountValue);
    const usageLimit = Number(form.usageLimit);
    const code = form.code.trim().toUpperCase();
    const discountType = form.discountType.trim();

    if (
      !code ||
      !discountType ||
      !form.startDate ||
      !form.endDate
    ) {
      setFormError(t.validation);
      return;
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setFormError(t.amountError);
      return;
    }

    if (
      discountType.toLowerCase() === "percentage" &&
      discountValue > 100
    ) {
      setFormError(t.percentageError);
      return;
    }

    if (
      !Number.isSafeInteger(usageLimit) ||
      usageLimit < 0 ||
      usageLimit > 2147483647
    ) {
      setFormError(t.usageError);
      return;
    }

    if (
      originalCoupon &&
      usageLimit > 0 &&
      usageLimit < originalCoupon.usedCount
    ) {
      setFormError(t.usedError);
      return;
    }

    const start = new Date(form.startDate).getTime();
    const end = new Date(form.endDate).getTime();

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= start
    ) {
      setFormError(t.dateError);
      return;
    }

    // Preserve an existing global coupon's empty courseIds.
    // New global coupon creation requires backend confirmation.
    const editingExistingGlobal =
      typeof mode === "number" &&
      originalCoupon?.isGlobal === true;

    if (
      form.courseIds.length === 0 &&
      !editingExistingGlobal
    ) {
      setFormError(t.selectCourse);
      return;
    }

    const payload = {
      code,
      discountType,
      discountValue,
      startDate: asBackendDate(form.startDate),
      endDate: asBackendDate(form.endDate),
      usageLimit,
      isActive: form.isActive,
      courseIds: editingExistingGlobal
        ? originalCoupon!.courseIds
        : form.courseIds,
    };

    const creating = mode === "create";

    const url = creating
      ? "/api/admin/coupons"
      : `/api/admin/coupons/${mode}`;

    setSaving(true);

    try {
      const response = await fetch(url, {
        method: creating ? "POST" : "PUT",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(errorText(data, t.requestError));
      }

      setMode(null);
      setNotice(creating ? t.created : t.saved);
      await loadCoupons();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : t.requestError
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    if (!toggleTarget || saving) return;

    const { coupon, activate } = toggleTarget;

    setSaving(true);
    setToggleError("");

    try {
      const response = await fetch(
        `/api/admin/coupons/${coupon.id}/${
          activate ? "activate" : "deactivate"
        }`,
        {
          method: "PATCH",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const body = await readResponse(response);

      if (!response.ok) {
        throw new Error(errorText(body, t.requestError));
      }

      setToggleTarget(null);
      setMode(null);
      setNotice(t.updatedStatus);
      await loadCoupons();
    } catch (error) {
      setToggleError(
        error instanceof Error ? error.message : t.requestError
      );
    } finally {
      setSaving(false);
    }
  }

  const statusLabels: Record<string, string> = {
    active: t.active,
    inactive: t.inactive,
    scheduled: t.scheduled,
    expired: t.expired,
    exhausted: t.exhausted,
  };

  return (
    <main className={styles.page} dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>{t.eyebrow}</span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshButton}
            disabled={loading || saving}
            onClick={() => {
              void loadCoupons();
              void loadCourses();
            }}
          >
            ↻ {t.refresh}
          </button>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={openCreate}
          >
            + {t.newCoupon}
          </button>
        </div>
      </header>

      <section className={styles.stats} aria-label={t.title}>
        {[
          { label: t.total, value: stats.total },
          { label: t.enabled, value: stats.enabled },
          { label: t.expired, value: stats.expired },
          { label: t.redemptions, value: stats.redemptions },
        ].map((item, index) => (
          <div className={styles.statCard} key={item.label}>
            <div className={styles.statTop}>
              <span>{item.label}</span>
              <small>{String(index + 1).padStart(2, "0")}</small>
            </div>
            <strong>{loading || loadError ? "—" : item.value}</strong>
          </div>
        ))}
      </section>

      <section className={styles.workspace}>
        <div className={styles.workspaceHeader}>
          <div>
            <h3>{t.directory}</h3>
            <p>{t.directoryHint}</p>
          </div>
          <span className={styles.recordCount}>
            {loading || loadError ? "—" : coupons.length}
          </span>
        </div>

        {notice && (
          <div className={styles.successMessage} role="status">
            {notice}
            <button
              type="button"
              aria-label={t.close}
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </div>
        )}

        {loadError && (
          <div className={styles.errorMessage} role="alert">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => void loadCoupons()}
            >
              {t.tryAgain}
            </button>
          </div>
        )}

        {coursesError && (
          <div className={styles.warningMessage}>
            {coursesError}
          </div>
        )}

        <div className={styles.filters}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            aria-label={t.search}
          />

          <select
            value={statusFilter}
            aria-label={t.status}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t.allStatuses}</option>
            <option value="active">{t.active}</option>
            <option value="inactive">{t.inactive}</option>
            <option value="scheduled">{t.scheduled}</option>
            <option value="expired">{t.expired}</option>
            <option value="exhausted">{t.exhausted}</option>
          </select>

          <select
            value={scopeFilter}
            aria-label={t.scope}
            onChange={(e) => setScopeFilter(e.target.value)}
          >
            <option value="all">{t.allScopes}</option>
            <option value="global">{t.global}</option>
            <option value="specific">{t.specific}</option>
          </select>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t.code}</th>
                <th>{t.discount}</th>
                <th>{t.scope}</th>
                <th>{t.validity}</th>
                <th>{t.usage}</th>
                <th>{t.status}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    {t.loading}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    <strong>
                      {coupons.length === 0 ? t.noCoupons : t.noResults}
                    </strong>
                    <p>{t.emptyHint}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((coupon) => {
                  const state = couponState(coupon);
                  const usagePercent = coupon.usageLimit > 0
                    ? Math.min(
                        100,
                        coupon.usedCount / coupon.usageLimit * 100
                      )
                    : 0;

                  return (
                    <tr key={coupon.id}>
                      <td>
                        <div className={styles.codeCell}>
                          <strong>{coupon.code}</strong>
                          <small>#{coupon.id}</small>
                        </div>
                      </td>

                      <td>
                        <div className={styles.discountCell}>
                          <strong>{displayDiscount(coupon)}</strong>
                          <small>{coupon.discountType}</small>
                        </div>
                      </td>

                      <td>
                        <div className={styles.scopeCell}>
                          {coupon.isGlobal ? (
                            <strong>{t.global}</strong>
                          ) : (
                            <>
                              <strong>
                                {coupon.courseIds
                                  .slice(0, 2)
                                  .map((id) =>
                                    coursesById.get(id)?.title ||
                                    `${t.unknownCourse} #${id}`
                                  )
                                  .join(", ") || t.none}
                              </strong>
                              {coupon.courseIds.length > 2 && (
                                <small>
                                  +{coupon.courseIds.length - 2}
                                </small>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className={styles.dateCell}>
                          <strong>
                            {displayDate(coupon.startDate, locale)}
                          </strong>
                          <small>
                            → {displayDate(coupon.endDate, locale)}
                          </small>
                        </div>
                      </td>

                      <td>
                        <div className={styles.usageCell}>
                          <strong>
                            {coupon.usedCount} / {coupon.usageLimit}
                          </strong>
                          {coupon.usageLimit > 0 && (
                            <div className={styles.usageTrack}>
                              <span style={{ width: `${usagePercent}%` }} />
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            styles[state as keyof typeof styles] || ""
                          }`}
                        >
                          <span aria-hidden="true" />
                          {statusLabels[state]}
                        </span>
                      </td>

                      <td>
                        <div className={styles.tableActions}>
                          <button
                            type="button"
                            className={styles.manageButton}
                            onClick={() => openEdit(coupon.id)}
                          >
                            {t.manage}
                          </button>

                          <button
                            type="button"
                            className={styles.toggleButton}
                            onClick={() => {
                              setToggleError("");
                              setToggleTarget({
                                coupon,
                                activate: !coupon.isActive,
                              });
                            }}
                          >
                            {coupon.isActive
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
          {t.showing} {loadError ? "—" : filtered.length}{" "}
          {t.of} {loadError ? "—" : coupons.length}
        </div>
      </section>

      {/* Create / Edit */}
      {mode !== null && (
        <div className={styles.panelOverlay}>
          <button
            type="button"
            className={styles.backdrop}
            aria-label={t.close}
            onClick={() => {
              if (!saving) setMode(null);
            }}
          />

          <aside
            className={styles.detailPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-form-title"
          >
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  CRESTMARK / COUPONS
                </span>
                <h2 id="coupon-form-title">
                  {mode === "create"
                    ? t.createTitle
                    : t.editTitle}
                </h2>
                <p>
                  {mode === "create"
                    ? t.createHint
                    : t.editHint}
                </p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                aria-label={t.close}
                disabled={saving}
                onClick={() => setMode(null)}
              >
                ×
              </button>
            </div>

            {detailLoading ? (
              <p className={styles.loadingPanel}>
                {t.loadingDetail}
              </p>
            ) : (
              <form
                className={styles.panelForm}
                onSubmit={handleSubmit}
              >
                <section className={styles.formSection}>
                  <h3>{t.code}</h3>

                  <label className={styles.field}>
                    <span>{t.code}</span>
                    <input
                      required
                      type="text"
                      maxLength={100}
                      value={form.code}
                      placeholder="BACKEND20"
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          code: e.target.value.toUpperCase(),
                        }))
                      }
                    />
                    <small>{t.codeHint}</small>
                  </label>

                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span>{t.type}</span>
                      <input
                        required
                        type="text"
                        list="coupon-discount-types"
                        value={form.discountType}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            discountType: e.target.value,
                          }))
                        }
                      />
                      <datalist id="coupon-discount-types">
                        <option value="Percentage" />
                      </datalist>
                    </label>

                    <label className={styles.field}>
                      <span>{t.value}</span>
                      <input
                        required
                        type="number"
                        min="0.01"
                        step="any"
                        value={form.discountValue}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            discountValue: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <p className={styles.fieldHint}>{t.typeHint}</p>
                </section>

                <section className={styles.formSection}>
                  <h3>{t.validity}</h3>

                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span>{t.starts}</span>
                      <input
                        required
                        type="datetime-local"
                        step="1"
                        value={form.startDate}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            startDate: e.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className={styles.field}>
                      <span>{t.ends}</span>
                      <input
                        required
                        type="datetime-local"
                        step="1"
                        value={form.endDate}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            endDate: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <label className={styles.field}>
                    <span>{t.limit}</span>
                    <input
                      required
                      type="number"
                      min="0"
                      max="2147483647"
                      step="1"
                      value={form.usageLimit}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          usageLimit: e.target.value,
                        }))
                      }
                    />
                    <small>{t.limitHint}</small>
                  </label>

                  {originalCoupon && (
                    <div className={styles.readonlyFact}>
                      <span>{t.used}</span>
                      <strong>{originalCoupon.usedCount}</strong>
                    </div>
                  )}

                  <label className={styles.toggleField}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          isActive: e.target.checked,
                        }))
                      }
                    />
                    <span>{t.enabledField}</span>
                  </label>
                </section>

                <section className={styles.formSection}>
                  <h3>{t.courses}</h3>
                  <p className={styles.fieldHint}>{t.coursesHint}</p>

                  {originalCoupon?.isGlobal ? (
                    <p className={styles.infoMessage}>
                      {t.globalNote}
                    </p>
                  ) : (
                    <>
                      <p className={styles.infoMessage}>
                        {t.globalCreateNote}
                      </p>

                      {coursesError && (
                        <p className={styles.formError}>
                          {coursesError}
                        </p>
                      )}

                      <input
                        className={styles.courseSearch}
                        type="search"
                        value={courseSearch}
                        placeholder={t.searchCourses}
                        aria-label={t.searchCourses}
                        onChange={(e) =>
                          setCourseSearch(e.target.value)
                        }
                      />

                      <div className={styles.coursePicker}>
                        {searchedCourses.length === 0 ? (
                          <p className={styles.noCourses}>
                            {t.noCourses}
                          </p>
                        ) : (
                          searchedCourses.map((course) => (
                            <label
                              key={course.id}
                              className={styles.courseOption}
                            >
                              <input
                                type="checkbox"
                                checked={form.courseIds.includes(
                                  course.id
                                )}
                                onChange={(e) =>
                                  toggleCourse(
                                    course.id,
                                    e.target.checked
                                  )
                                }
                              />
                              <span>{course.title}</span>
                              <small>#{course.id}</small>
                            </label>
                          ))
                        )}

                        {form.courseIds
                          .filter((id) => !coursesById.has(id))
                          .map((id) => (
                            <label
                              key={id}
                              className={styles.courseOption}
                            >
                              <input
                                type="checkbox"
                                checked
                                onChange={() => toggleCourse(id, false)}
                              />
                              <span>{t.unknownCourse} #{id}</span>
                            </label>
                          ))}
                      </div>
                    </>
                  )}
                </section>

                {formError && (
                  <p className={styles.formError} role="alert">
                    {formError}
                  </p>
                )}

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={saving}
                    onClick={() => setMode(null)}
                  >
                    {t.cancel}
                  </button>

                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={
                      saving ||
                      !coursesReady ||
                      (typeof mode === "number" && !originalCoupon)
                    }
                  >
                    {saving
                      ? t.saving
                      : mode === "create"
                        ? t.create
                        : t.save}
                  </button>
                </div>
              </form>
            )}
          </aside>
        </div>
      )}

      {/* Activation / Deactivation confirmation */}
      {toggleTarget && (
        <div className={styles.confirmOverlay}>
          <div
            className={styles.confirmDialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="coupon-confirm-title"
          >
            <span className={styles.warningIcon}>!</span>

            <h2 id="coupon-confirm-title">
              {toggleTarget.activate
                ? t.confirmActivate
                : t.confirmDeactivate}
            </h2>

            <strong className={styles.confirmCode}>
              {toggleTarget.coupon.code}
            </strong>

            <p>
              {toggleTarget.activate
                ? t.confirmActivateHint
                : t.confirmDeactivateHint}
            </p>

            {toggleError && (
              <p className={styles.formError} role="alert">
                {toggleError}
              </p>
            )}

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={saving}
                onClick={() => setToggleTarget(null)}
              >
                {t.cancel}
              </button>

              <button
                type="button"
                className={styles.primaryButton}
                disabled={saving}
                onClick={() => void handleToggle()}
              >
                {saving ? t.saving : t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
