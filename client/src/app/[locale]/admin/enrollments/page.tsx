
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
type StatusFilter = "all" | "active" | "completed" | "cancelled";

type Enrollment = {
  id: number;
  userId: number;
  courseId: number;
  enrolledAt: string | null;
  completedAt: string | null;
  status: string;
};

type AcademyUser = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  isActive: boolean;
  roles: string[];
};

type AcademyCourse = {
  id: number;
  title: string;
  slug: string;
  status: string | null;
};

type PendingAction = {
  enrollment: Enrollment;
  action: "cancel" | "reactivate";
};

const PAGE_SIZE = 8;

const translations = {
  en: {
    eyebrow: "ACADEMY / ENROLLMENT MANAGEMENT",
    title: "Enrollments",
    subtitle:
      "Monitor learner access, manage enrollment records, and keep your academy organized.",
    total: "Total enrollments",
    active: "Active",
    completed: "Completed",
    cancelled: "Cancelled",
    newEnrollment: "Enroll a student",
    directory: "Enrollment directory",
    directoryDescription:
      "A complete overview of academy enrollment records.",
    search: "Search by student, course, email or enrollment ID...",
    allStatuses: "All statuses",
    allCourses: "All courses",
    from: "From",
    to: "To",
    clear: "Clear filters",
    refresh: "Refresh",
    student: "Student",
    course: "Course",
    enrollment: "Enrollment",
    enrolledAt: "Enrolled on",
    completedAt: "Completed on",
    status: "Status",
    actions: "Actions",
    view: "View",
    cancelEnrollment: "Cancel",
    reactivate: "Reactivate",
    noResults: "No matching enrollments",
    noResultsDescription:
      "Try adjusting the search, course, status, or date range.",
    noRecords: "No enrollment records yet",
    noRecordsDescription:
      "Enroll a student in a published course to get started.",
    loading: "Loading enrollment records...",
    loadError: "Could not load enrollments.",
    lookupWarning:
      "Some student or course details are unavailable. Records are still shown using their IDs.",
    show: "Showing",
    of: "of",
    previous: "Previous",
    next: "Next",
    page: "Page",
    noDate: "—",
    courseId: "Course ID",
    userId: "User ID",
    recordId: "Enrollment ID",
    detailsTitle: "Enrollment details",
    detailsDescription:
      "Review the recorded enrollment information.",
    close: "Close",
    addTitle: "New enrollment",
    addDescription:
      "Choose an active student and a published course.",
    chooseStudent: "Select a student",
    chooseCourse: "Select a course",
    noStudents: "No eligible students available.",
    noCourses: "No published courses available.",
    alreadyEnrolled:
      "An enrollment record already exists for this student and course. Manage that record instead of creating another.",
    existingRecord: "Existing enrollment",
    submitEnroll: "Add student to course",
    save: "Confirm enrollment",
    saving: "Processing...",
    selectBoth: "Choose a student and a course.",
    successEnroll: "The student was enrolled successfully.",
    successCancel: "Enrollment cancelled successfully.",
    successReactivate: "Enrollment reactivated successfully.",
    confirmCancelTitle: "Cancel this enrollment?",
    confirmReactivateTitle: "Reactivate this enrollment?",
    confirmCancelDescription:
      "The student may lose access to this course. The enrollment record will be retained.",
    confirmReactivateDescription:
      "This cancelled enrollment will become active again.",
    completedWarning:
      "This course has already been completed. Cancelling and later reactivating the enrollment may affect completion history. Review certificates before proceeding.",
    cancel: "Go back",
    confirm: "Confirm",
    unknownUser: "User",
    unknownCourse: "Course",
    requestError: "The request could not be completed.",
    retry: "Try again",
    listUpdated: "Enrollment records are up to date.",
  },
  ar: {
    eyebrow: "الأكاديمية / إدارة الالتحاقات",
    title: "إدارة الالتحاقات",
    subtitle:
      "تابع التحاقات الطلاب وتحكّم في الوصول إلى الدورات وسجلات التسجيل من مكان واحد.",
    total: "إجمالي الالتحاقات",
    active: "نشطة",
    completed: "مكتملة",
    cancelled: "ملغاة",
    newEnrollment: "إضافة طالب لدورة",
    directory: "سجل الالتحاقات",
    directoryDescription:
      "عرض شامل لجميع التحاقات الطلاب داخل الأكاديمية.",
    search: "ابحث بالطالب أو الدورة أو البريد أو رقم الالتحاق...",
    allStatuses: "جميع الحالات",
    allCourses: "جميع الدورات",
    from: "من تاريخ",
    to: "إلى تاريخ",
    clear: "إزالة الفلاتر",
    refresh: "تحديث",
    student: "الطالب",
    course: "الدورة",
    enrollment: "الالتحاق",
    enrolledAt: "تاريخ الالتحاق",
    completedAt: "تاريخ الإكمال",
    status: "الحالة",
    actions: "الإجراءات",
    view: "التفاصيل",
    cancelEnrollment: "إلغاء",
    reactivate: "إعادة تفعيل",
    noResults: "لا توجد التحاقات مطابقة",
    noResultsDescription:
      "جرّب تغيير البحث أو الدورة أو الحالة أو نطاق التاريخ.",
    noRecords: "لا توجد التحاقات بعد",
    noRecordsDescription:
      "ابدأ بإضافة طالب إلى إحدى الدورات المنشورة.",
    loading: "جارٍ تحميل الالتحاقات...",
    loadError: "تعذّر تحميل الالتحاقات.",
    lookupWarning:
      "تعذّر تحميل بعض بيانات الطلاب أو الدورات. ستظهر السجلات بأرقام المعرّفات.",
    show: "عرض",
    of: "من أصل",
    previous: "السابق",
    next: "التالي",
    page: "صفحة",
    noDate: "—",
    courseId: "معرّف الدورة",
    userId: "معرّف المستخدم",
    recordId: "رقم الالتحاق",
    detailsTitle: "تفاصيل الالتحاق",
    detailsDescription:
      "مراجعة المعلومات المسجلة عن التحاق الطالب.",
    close: "إغلاق",
    addTitle: "التحاق جديد",
    addDescription:
      "اختر طالبًا مفعّلًا ودورة منشورة لإضافته إليها.",
    chooseStudent: "اختر الطالب",
    chooseCourse: "اختر الدورة",
    noStudents: "لا يوجد طلاب مؤهلون للإضافة.",
    noCourses: "لا توجد دورات منشورة متاحة.",
    alreadyEnrolled:
      "يوجد سجل التحاق لهذا الطالب بهذه الدورة بالفعل. أدر السجل الموجود بدل إنشاء التحاق مكرر.",
    existingRecord: "الالتحاق الموجود",
    submitEnroll: "إضافة الطالب إلى الدورة",
    save: "تأكيد الإضافة",
    saving: "جارٍ التنفيذ...",
    selectBoth: "يرجى اختيار الطالب والدورة.",
    successEnroll: "تم إضافة الطالب إلى الدورة بنجاح.",
    successCancel: "تم إلغاء الالتحاق بنجاح.",
    successReactivate: "تم إعادة تفعيل الالتحاق بنجاح.",
    confirmCancelTitle: "هل تريد إلغاء هذا الالتحاق؟",
    confirmReactivateTitle: "هل تريد إعادة تفعيل الالتحاق؟",
    confirmCancelDescription:
      "قد يفقد الطالب الوصول إلى محتوى الدورة. سيبقى سجل الالتحاق محفوظًا.",
    confirmReactivateDescription:
      "سيعود سجل الالتحاق الملغى إلى الحالة النشطة.",
    completedWarning:
      "هذا الطالب أكمل الدورة بالفعل. قد يؤثر الإلغاء وإعادة التفعيل لاحقًا على سجل الإكمال. راجع الشهادات قبل المتابعة.",
    cancel: "رجوع",
    confirm: "تأكيد",
    unknownUser: "مستخدم",
    unknownCourse: "دورة",
    requestError: "تعذّر تنفيذ الطلب.",
    retry: "إعادة المحاولة",
    listUpdated: "تم تحديث سجلات الالتحاق.",
  },
} as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function extractItems(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!isObject(value)) return null;

  for (const key of [
    "items",
    "data",
    "results",
    "enrollments",
    "users",
    "courses",
  ]) {
    const candidate = value[key];

    if (Array.isArray(candidate)) return candidate;

    if (isObject(candidate)) {
      for (const nestedKey of ["items", "results", "data"]) {
        if (Array.isArray(candidate[nestedKey])) {
          return candidate[nestedKey] as unknown[];
        }
      }
    }
  }

  return null;
}

function parseEnrollment(value: unknown): Enrollment | null {
  if (
    !isObject(value) ||
    !Number.isSafeInteger(value.id) ||
    (value.id as number) <= 0 ||
    !Number.isSafeInteger(value.userId) ||
    !Number.isSafeInteger(value.courseId) ||
    typeof value.status !== "string"
  ) {
    return null;
  }

  return {
    id: value.id as number,
    userId: value.userId as number,
    courseId: value.courseId as number,
    enrolledAt:
      typeof value.enrolledAt === "string"
        ? value.enrolledAt
        : null,
    completedAt:
      typeof value.completedAt === "string"
        ? value.completedAt
        : null,
    status: value.status,
  };
}

function parseUser(value: unknown): AcademyUser | null {
  if (
    !isObject(value) ||
    !Number.isSafeInteger(value.id) ||
    typeof value.username !== "string"
  ) {
    return null;
  }

  return {
    id: value.id as number,
    firstName:
      typeof value.firstName === "string" ? value.firstName : "",
    lastName:
      typeof value.lastName === "string" ? value.lastName : "",
    username: value.username,
    email: typeof value.email === "string" ? value.email : "",
    isActive: value.isActive === true,
    roles: Array.isArray(value.roles)
      ? value.roles.filter(
          (role): role is string => typeof role === "string"
        )
      : [],
  };
}

function parseCourse(value: unknown): AcademyCourse | null {
  if (
    !isObject(value) ||
    !Number.isSafeInteger(value.id) ||
    typeof value.title !== "string"
  ) {
    return null;
  }

  return {
    id: value.id as number,
    title: value.title,
    slug: typeof value.slug === "string" ? value.slug : "",
    status: typeof value.status === "string" ? value.status : null,
  };
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getError(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 350);
  }

  if (!isObject(value)) return fallback;

  for (const key of ["message", "Message", "title"]) {
    if (typeof value[key] === "string" && value[key]) {
      return value[key] as string;
    }
  }

  if (isObject(value.errors)) {
    const values = Object.values(value.errors).flat();
    const first = values.find((item) => typeof item === "string");

    if (typeof first === "string") return first;
  }

  return fallback;
}

async function fetchList(
  url: string,
  fallback: string,
  signal?: AbortSignal
): Promise<unknown[]> {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });

  const data = await readBody(response);

  if (!response.ok) {
    throw new Error(getError(data, fallback));
  }

  const items = extractItems(data);

  if (!items) {
    throw new Error(`Unexpected response format: ${url}`);
  }

  return items;
}

async function fetchCourseList(
  fallback: string,
  signal?: AbortSignal
): Promise<unknown[]> {
  let response = await fetch("/api/admin/courses", {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });

  // Fallback only if the admin listing route does not exist.
  if (response.status === 404 || response.status === 405) {
    response = await fetch("/api/courses", {
      credentials: "same-origin",
      cache: "no-store",
      signal,
    });
  }

  const data = await readBody(response);

  if (!response.ok) {
    throw new Error(getError(data, fallback));
  }

  const items = extractItems(data);

  if (!items) {
    throw new Error("Unexpected course listing response.");
  }

  return items;
}

function userDisplayName(user: AcademyUser | undefined, id: number) {
  if (!user) return `User #${id}`;

  return (
    `${user.firstName} ${user.lastName}`.trim() ||
    user.username
  );
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    { day: "numeric", month: "short", year: "numeric" }
  ).format(date);
}

function normalizeStatus(value: string) {
  return value.trim().toLowerCase();
}

function statusText(status: string, locale: Locale) {
  const normalized = normalizeStatus(status);
  const t = translations[locale];

  if (normalized === "active") return t.active;
  if (normalized === "completed") return t.completed;
  if (normalized === "cancelled" || normalized === "canceled") {
    return t.cancelled;
  }

  return status;
}

export default function AdminEnrollmentsPage() {
  const params = useParams<{ locale: string }>();
  const locale: Locale = params.locale === "ar" ? "ar" : "en";
  const t = translations[locale];

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [users, setUsers] = useState<AcademyUser[]>([]);
  const [courses, setCourses] = useState<AcademyCourse[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [lookupWarning, setLookupWarning] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [details, setDetails] = useState<Enrollment | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addUserId, setAddUserId] = useState("");
  const [addCourseId, setAddCourseId] = useState("");
  const [addError, setAddError] = useState("");

  const [pending, setPending] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setLoadError("");
      setLookupWarning("");

      const results = await Promise.allSettled([
        fetchList(
          "/api/admin/enrollments",
          t.loadError,
          signal
        ),
        fetchList(
          "/api/admin/users",
          t.requestError,
          signal
        ),
        fetchCourseList(t.requestError, signal),
      ]);

      if (signal?.aborted) return;

      const [enrollmentsResult, usersResult, coursesResult] = results;

      if (enrollmentsResult.status === "fulfilled") {
        const normalized = enrollmentsResult.value
          .map(parseEnrollment)
          .filter((item): item is Enrollment => item !== null)
          .sort((a, b) =>
            (b.enrolledAt ?? "").localeCompare(a.enrolledAt ?? "")
          );

        setEnrollments(normalized);
      } else {
        setEnrollments([]);
        setLoadError(
          enrollmentsResult.reason instanceof Error
            ? enrollmentsResult.reason.message
            : t.loadError
        );
      }

      let lookupFailed = false;

      if (usersResult.status === "fulfilled") {
        setUsers(
          usersResult.value
            .map(parseUser)
            .filter((item): item is AcademyUser => item !== null)
        );
      } else {
        setUsers([]);
        lookupFailed = true;
      }

      if (coursesResult.status === "fulfilled") {
        setCourses(
          coursesResult.value
            .map(parseCourse)
            .filter((item): item is AcademyCourse => item !== null)
        );
      } else {
        setCourses([]);
        lookupFailed = true;
      }

      if (lookupFailed) {
        setLookupWarning(t.lookupWarning);
      }

      setLoading(false);
    },
    [t.loadError, t.lookupWarning, t.requestError]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadData(controller.signal);

    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, courseFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (!details && !addOpen && !pending) return;

    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || saving) return;

      setDetails(null);
      setAddOpen(false);
      setPending(null);
    }

    document.addEventListener("keydown", onEscape);

    return () =>
      document.removeEventListener("keydown", onEscape);
  }, [details, addOpen, pending, saving]);

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users]
  );

  const coursesById = useMemo(
    () => new Map(courses.map((course) => [course.id, course])),
    [courses]
  );

  const stats = useMemo(
    () => ({
      total: enrollments.length,
      active: enrollments.filter(
        (item) => normalizeStatus(item.status) === "active"
      ).length,
      completed: enrollments.filter(
        (item) => normalizeStatus(item.status) === "completed"
      ).length,
      cancelled: enrollments.filter((item) =>
        ["cancelled", "canceled"].includes(
          normalizeStatus(item.status)
        )
      ).length,
    }),
    [enrollments]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return enrollments.filter((item) => {
      const user = usersById.get(item.userId);
      const course = coursesById.get(item.courseId);
      const currentStatus = normalizeStatus(item.status);

      const searchable = [
        String(item.id),
        `#${item.id}`,
        String(item.userId),
        String(item.courseId),
        user?.firstName,
        user?.lastName,
        user?.username,
        user?.email,
        userDisplayName(user, item.userId),
        course?.title,
        course?.slug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchable.includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        currentStatus === statusFilter ||
        (statusFilter === "cancelled" &&
          currentStatus === "canceled");

      const matchesCourse =
        courseFilter === "all" ||
        String(item.courseId) === courseFilter;

      const date = item.enrolledAt?.slice(0, 10) || "";

      const matchesDate =
        (!dateFrom || (date && date >= dateFrom)) &&
        (!dateTo || (date && date <= dateTo));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCourse &&
        matchesDate
      );
    });
  }, [
    enrollments,
    search,
    statusFilter,
    courseFilter,
    dateFrom,
    dateTo,
    usersById,
    coursesById,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const eligibleStudents = useMemo(
    () =>
      users
        .filter(
          (user) =>
            user.isActive &&
            user.roles.some(
              (role) => role.toLowerCase() === "student"
            )
        )
        .sort((a, b) =>
          userDisplayName(a, a.id).localeCompare(
            userDisplayName(b, b.id)
          )
        ),
    [users]
  );

  const eligibleCourses = useMemo(
    () =>
      courses
        .filter(
          (course) =>
            !course.status ||
            normalizeStatus(course.status) === "published"
        )
        .sort((a, b) => a.title.localeCompare(b.title)),
    [courses]
  );

  const existingEnrollment = enrollments.find(
    (item) =>
      String(item.userId) === addUserId &&
      String(item.courseId) === addCourseId
  );

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setCourseFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  function openAdd() {
    setAddUserId("");
    setAddCourseId("");
    setAddError("");
    setNotice("");
    setAddOpen(true);
  }

  function openAction(
    enrollment: Enrollment,
    action: "cancel" | "reactivate"
  ) {
    setActionError("");
    setPending({ enrollment, action });
  }

  async function handleEnroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    const userId = Number(addUserId);
    const courseId = Number(addCourseId);

    if (
      !Number.isSafeInteger(userId) ||
      !Number.isSafeInteger(courseId) ||
      !eligibleStudents.some((user) => user.id === userId) ||
      !eligibleCourses.some((course) => course.id === courseId)
    ) {
      setAddError(t.selectBoth);
      return;
    }

    if (existingEnrollment) {
      setAddError(t.alreadyEnrolled);
      return;
    }

    setSaving(true);
    setAddError("");

    try {
      const response = await fetch(
        `/api/admin/enrollments/users/${userId}/courses/${courseId}`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const data = await readBody(response);

      if (!response.ok) {
        throw new Error(getError(data, t.requestError));
      }

      setAddOpen(false);
      setNotice(t.successEnroll);
      await loadData();
    } catch (error) {
      setAddError(
        error instanceof Error ? error.message : t.requestError
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange() {
    if (!pending || saving) return;

    const action = pending.action;
    const enrollment = pending.enrollment;

    setSaving(true);
    setActionError("");

    try {
      const response = await fetch(
        `/api/admin/enrollments/${enrollment.id}/${action}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const data = await readBody(response);

      if (!response.ok) {
        throw new Error(getError(data, t.requestError));
      }

      setPending(null);
      setDetails(null);
      setNotice(
        action === "cancel"
          ? t.successCancel
          : t.successReactivate
      );

      await loadData();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : t.requestError
      );
    } finally {
      setSaving(false);
    }
  }

  function StatusBadge({ status }: { status: string }) {
    const current = normalizeStatus(status);

    const className =
      current === "active"
        ? styles.activeStatus
        : current === "completed"
          ? styles.completedStatus
          : styles.cancelledStatus;

    return (
      <span className={`${styles.statusBadge} ${className}`}>
        <span aria-hidden="true" />
        {statusText(status, locale)}
      </span>
    );
  }

  function EnrollmentAction({
    enrollment,
  }: {
    enrollment: Enrollment;
  }) {
    const status = normalizeStatus(enrollment.status);

    if (status === "cancelled" || status === "canceled") {
      return (
        <button
          type="button"
          className={styles.reactivateButton}
          onClick={() => openAction(enrollment, "reactivate")}
        >
          {t.reactivate}
        </button>
      );
    }

    if (status === "active" || status === "completed") {
      return (
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => openAction(enrollment, "cancel")}
        >
          {t.cancelEnrollment}
        </button>
      );
    }

    return null;
  }

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <header className={styles.pageHeader}>
        <div className={styles.headingContent}>
          <span className={styles.eyebrow}>{t.eyebrow}</span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>

        <button
          type="button"
          className={styles.addButton}
          onClick={openAdd}
        >
          <span aria-hidden="true">+</span>
          {t.newEnrollment}
        </button>
      </header>

      <section className={styles.stats} aria-label={t.title}>
        {[
          { label: t.total, value: stats.total, number: "01" },
          { label: t.active, value: stats.active, number: "02" },
          {
            label: t.completed,
            value: stats.completed,
            number: "03",
          },
          {
            label: t.cancelled,
            value: stats.cancelled,
            number: "04",
          },
        ].map((stat) => (
          <div className={styles.statCard} key={stat.number}>
            <div className={styles.statTop}>
              <span>{stat.label}</span>
              <small>{stat.number}</small>
            </div>
            <strong>{loading ? "—" : stat.value}</strong>
          </div>
        ))}
      </section>

      <section className={styles.workspace}>
        <div className={styles.workspaceHeader}>
          <div>
            <h3>{t.directory}</h3>
            <p>{t.directoryDescription}</p>
          </div>

          <button
            type="button"
            className={styles.refreshButton}
            disabled={loading || saving}
            onClick={() => void loadData()}
          >
            <span aria-hidden="true">↻</span>
            {t.refresh}
          </button>
        </div>

        {notice && (
          <div className={styles.successNotice} role="status">
            <span aria-hidden="true">✓</span>
            {notice}
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label={t.close}
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
              onClick={() => void loadData()}
            >
              {t.retry}
            </button>
          </div>
        )}

        {lookupWarning && (
          <div className={styles.warningNotice}>
            {lookupWarning}
          </div>
        )}

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>

            <input
              type="search"
              aria-label={t.search}
              placeholder={t.search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            aria-label={t.status}
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as StatusFilter
              )
            }
          >
            <option value="all">{t.allStatuses}</option>
            <option value="active">{t.active}</option>
            <option value="completed">{t.completed}</option>
            <option value="cancelled">{t.cancelled}</option>
          </select>

          <select
            aria-label={t.course}
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
          >
            <option value="all">{t.allCourses}</option>
            {courses.map((course) => (
              <option value={course.id} key={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.dateFilters}>
          <label>
            <span>{t.from}</span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>

          <label>
            <span>{t.to}</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>

          {(search ||
            statusFilter !== "all" ||
            courseFilter !== "all" ||
            dateFrom ||
            dateTo) && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={clearFilters}
            >
              {t.clear}
            </button>
          )}
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t.enrollment}</th>
                <th>{t.student}</th>
                <th>{t.course}</th>
                <th>{t.enrolledAt}</th>
                <th>{t.status}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    <span className={styles.spinner} />
                    {t.loading}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    <strong>
                      {enrollments.length === 0
                        ? t.noRecords
                        : t.noResults}
                    </strong>
                    <p>
                      {enrollments.length === 0
                        ? t.noRecordsDescription
                        : t.noResultsDescription}
                    </p>
                  </td>
                </tr>
              ) : (
                visible.map((enrollment) => {
                  const user = usersById.get(enrollment.userId);
                  const course = coursesById.get(
                    enrollment.courseId
                  );

                  return (
                    <tr key={enrollment.id}>
                      <td>
                        <span className={styles.recordId}>
                          #{enrollment.id}
                        </span>
                      </td>

                      <td>
                        <div className={styles.userCell}>
                          <span className={styles.avatar}>
                            {user?.username.charAt(0).toUpperCase() ||
                              "U"}
                          </span>
                          <div>
                            <strong>
                              {userDisplayName(
                                user,
                                enrollment.userId
                              )}
                            </strong>
                            <small>
                              {user?.email ||
                                `ID: ${enrollment.userId}`}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className={styles.courseCell}>
                          <strong>
                            {course?.title ||
                              `${t.unknownCourse} #${enrollment.courseId}`}
                          </strong>
                          <small>
                            ID: {enrollment.courseId}
                          </small>
                        </div>
                      </td>

                      <td className={styles.dateText}>
                        {formatDate(enrollment.enrolledAt, locale)}
                      </td>

                      <td>
                        <StatusBadge status={enrollment.status} />
                      </td>

                      <td>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.viewButton}
                            onClick={() => setDetails(enrollment)}
                          >
                            {t.view}
                          </button>
                          <EnrollmentAction
                            enrollment={enrollment}
                          />
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
          <span>
            {t.show} {filtered.length} {t.of}{" "}
            {enrollments.length}
          </span>

          <div className={styles.pagination}>
            <button
              type="button"
              disabled={loading || currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              {t.previous}
            </button>

            <span>
              {t.page} {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={loading || currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              {t.next}
            </button>
          </div>
        </div>
      </section>

      {/* Enrollment details */}
      {details && (
        <div className={styles.overlay}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="enrollment-details-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.eyebrow}>
                  CRESTMARK / ENROLLMENT #{details.id}
                </span>
                <h2 id="enrollment-details-title">
                  {t.detailsTitle}
                </h2>
                <p>{t.detailsDescription}</p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setDetails(null)}
                aria-label={t.close}
              >
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.detailStatus}>
                <strong>
                  {coursesById.get(details.courseId)?.title ||
                    `${t.unknownCourse} #${details.courseId}`}
                </strong>
                <StatusBadge status={details.status} />
              </div>

              <dl className={styles.detailsGrid}>
                <div>
                  <dt>{t.student}</dt>
                  <dd>
                    {userDisplayName(
                      usersById.get(details.userId),
                      details.userId
                    )}
                  </dd>
                </div>

                <div>
                  <dt>{t.recordId}</dt>
                  <dd>#{details.id}</dd>
                </div>

                <div>
                  <dt>{t.userId}</dt>
                  <dd>#{details.userId}</dd>
                </div>

                <div>
                  <dt>{t.courseId}</dt>
                  <dd>#{details.courseId}</dd>
                </div>

                <div>
                  <dt>{t.enrolledAt}</dt>
                  <dd>{formatDate(details.enrolledAt, locale)}</dd>
                </div>

                <div>
                  <dt>{t.completedAt}</dt>
                  <dd>{formatDate(details.completedAt, locale)}</dd>
                </div>
              </dl>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setDetails(null)}
                >
                  {t.close}
                </button>
                <EnrollmentAction enrollment={details} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New enrollment */}
      {addOpen && (
        <div className={styles.overlay}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-enrollment-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.eyebrow}>
                  CRESTMARK / ENROLLMENTS
                </span>
                <h2 id="new-enrollment-title">
                  {t.addTitle}
                </h2>
                <p>{t.addDescription}</p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                disabled={saving}
                onClick={() => setAddOpen(false)}
                aria-label={t.close}
              >
                ×
              </button>
            </div>

            <form
              className={styles.modalContent}
              onSubmit={handleEnroll}
            >
              <label className={styles.field}>
                <span>{t.chooseStudent}</span>
                <select
                  required
                  value={addUserId}
                  onChange={(event) => {
                    setAddUserId(event.target.value);
                    setAddError("");
                  }}
                >
                  <option value="">{t.chooseStudent}</option>
                  {eligibleStudents.map((user) => (
                    <option key={user.id} value={user.id}>
                      {userDisplayName(user, user.id)} — @{user.username}
                    </option>
                  ))}
                </select>
              </label>

              {eligibleStudents.length === 0 && (
                <p className={styles.helperText}>
                  {t.noStudents}
                </p>
              )}

              <label className={styles.field}>
                <span>{t.chooseCourse}</span>
                <select
                  required
                  value={addCourseId}
                  onChange={(event) => {
                    setAddCourseId(event.target.value);
                    setAddError("");
                  }}
                >
                  <option value="">{t.chooseCourse}</option>
                  {eligibleCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>

              {eligibleCourses.length === 0 && (
                <p className={styles.helperText}>
                  {t.noCourses}
                </p>
              )}

              {existingEnrollment && (
                <div className={styles.warningNotice}>
                  <strong>{t.alreadyEnrolled}</strong>
                  <p>
                    {t.existingRecord} #{existingEnrollment.id} —{" "}
                    {statusText(existingEnrollment.status, locale)}
                  </p>
                </div>
              )}

              {addError && (
                <div className={styles.errorNotice} role="alert">
                  {addError}
                </div>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={saving}
                  onClick={() => setAddOpen(false)}
                >
                  {t.cancel}
                </button>

                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={
                    saving ||
                    !addUserId ||
                    !addCourseId ||
                    Boolean(existingEnrollment)
                  }
                >
                  {saving ? t.saving : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm status change */}
      {pending && (
        <div className={styles.overlay}>
          <div
            className={styles.confirmModal}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="enrollment-confirm-title"
          >
            <span className={styles.confirmSymbol}>!</span>

            <h2 id="enrollment-confirm-title">
              {pending.action === "cancel"
                ? t.confirmCancelTitle
                : t.confirmReactivateTitle}
            </h2>

            <p className={styles.confirmSubject}>
              {userDisplayName(
                usersById.get(pending.enrollment.userId),
                pending.enrollment.userId
              )}
              {" — "}
              {coursesById.get(pending.enrollment.courseId)?.title ||
                `${t.unknownCourse} #${pending.enrollment.courseId}`}
            </p>

            <p className={styles.confirmDescription}>
              {pending.action === "cancel"
                ? t.confirmCancelDescription
                : t.confirmReactivateDescription}
            </p>

            {pending.action === "cancel" &&
              normalizeStatus(pending.enrollment.status) ===
                "completed" && (
                <p className={styles.completedWarning}>
                  {t.completedWarning}
                </p>
              )}

            {actionError && (
              <div className={styles.errorNotice} role="alert">
                {actionError}
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={saving}
                onClick={() => setPending(null)}
              >
                {t.cancel}
              </button>

              <button
                type="button"
                className={styles.primaryButton}
                disabled={saving}
                onClick={() => void handleStatusChange()}
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
