
"use client";

import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./page.module.css";

type Locale = "en" | "ar";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  isActive: boolean;
  emailConfirmed: boolean;
  roles: string[];
  createdAt: string | null;
};

type Course = {
  id: number;
  title: string;
  slug: string;
  status: string | null;
};

type Enrollment = {
  id: number;
  userId: number;
  courseId: number;
  enrolledAt: string | null;
  completedAt: string | null;
  status: string;
};

type EnrollmentState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "none" }
  | { kind: "found"; data: Enrollment }
  | { kind: "error"; message: string };

type ActionKind =
  | "activateUser"
  | "deactivateUser"
  | "assignInstructor"
  | "removeInstructor"
  | "enroll"
  | "cancel"
  | "reactivate";

type PendingAction = {
  kind: ActionKind;
  user: User;
  course?: Course;
  enrollment?: Enrollment;
};

const dictionary = {
  en: {
    eyebrow: "ACADEMY / USER MANAGEMENT",
    title: "Users & students",
    description:
      "Manage academy accounts, instructor roles, and student course access.",
    total: "Total users",
    students: "Students",
    instructors: "Instructors",
    active: "Active accounts",
    directory: "User directory",
    directoryDescription:
      "Manage accounts registered across CrestMark Academy.",
    search: "Search by name, username or email...",
    allRoles: "All roles",
    student: "Student",
    instructor: "Instructor",
    administrator: "Admin",
    allStatuses: "All statuses",
    activeStatus: "Active",
    inactiveStatus: "Inactive",
    user: "User",
    roles: "Roles",
    verified: "Email",
    joined: "Joined",
    status: "Status",
    actions: "Actions",
    confirmed: "Verified",
    unconfirmed: "Unverified",
    manage: "Manage",
    refresh: "Refresh",
    loading: "Loading users...",
    empty: "No users match your search.",
    noUsers: "No users were returned by the API.",
    details: "Account details",
    detailsHint:
      "Manage account status, instructor access, and course enrollment.",
    close: "Close",
    accountStatus: "Account status",
    emailStatus: "Email verification",
    created: "Account created",
    activate: "Activate account",
    deactivate: "Deactivate account",
    assignInstructor: "Assign instructor",
    removeInstructor: "Remove instructor",
    adminProtected:
      "Administrative accounts cannot be modified from this panel.",
    learningTitle: "Course access",
    learningDescription:
      "Review the student's enrolled courses or select another course to manage access.",
    studentOnly:
      "Course enrollment controls are available for accounts with the Student role.",
    enrolledCourses: "Student enrollments",
    loadingEnrollments: "Loading student enrollments...",
    noEnrollments: "No enrollment records for this student.",
    enrollmentsError: "Could not load student enrollments.",
    enrollmentCount: "Enrollment records",
    selectCourse: "Select a course",
    noCourseSelected: "Choose a course to inspect its enrollment.",
    noCourses: "No courses available.",
    checking: "Checking enrollment...",
    notEnrolled: "Not enrolled",
    notEnrolledText:
      "This student has no enrollment record for the selected course.",
    enrollmentFound: "Enrollment record",
    enrollmentId: "Enrollment ID",
    enrolledAt: "Enrolled on",
    completedAt: "Completed on",
    addToCourse: "Add to course",
    cancelEnrollment: "Cancel enrollment",
    reactivateEnrollment: "Reactivate enrollment",
    refreshEnrollment: "Check again",
    confirm: "Confirm action",
    cancel: "Go back",
    processing: "Processing...",
    success: "The change was saved successfully.",
    requestError: "Something went wrong. Please try again.",
    confirmAccount:
      "This change will affect the user's access to the academy.",
    confirmInstructor:
      "This action will change the user's instructor permissions.",
    confirmEnroll:
      "The student will be enrolled in the selected course.",
    confirmCancel:
      "The enrollment will be cancelled, not deleted permanently. The student may lose access to the course.",
    confirmReactivate:
      "The cancelled enrollment will be reactivated.",
    completedWarning:
      "This enrollment is completed. Cancelling it and reactivating it later may affect the completion date and course history.",
    unpublishedWarning:
      "Only published courses can accept new enrollments.",
    inactiveWarning:
      "This account is inactive. Activate it before enrolling the student.",
    filterResult: "Showing",
    of: "of",
    clear: "Clear filters",
    id: "ID",
  },
  ar: {
    eyebrow: "الأكاديمية / إدارة المستخدمين",
    title: "المستخدمون والطلاب",
    description:
      "أدر حسابات الأكاديمية وصلاحيات المدربين والتحاق الطلاب بالدورات.",
    total: "إجمالي المستخدمين",
    students: "الطلاب",
    instructors: "المدربون",
    active: "الحسابات المفعّلة",
    directory: "سجل المستخدمين",
    directoryDescription:
      "إدارة الحسابات المسجلة في CrestMark Academy.",
    search: "ابحث بالاسم أو اسم المستخدم أو البريد...",
    allRoles: "جميع الأدوار",
    student: "طالب",
    instructor: "مدرب",
    administrator: "مدير",
    allStatuses: "جميع الحالات",
    activeStatus: "مفعّل",
    inactiveStatus: "معطّل",
    user: "المستخدم",
    roles: "الأدوار",
    verified: "البريد الإلكتروني",
    joined: "تاريخ التسجيل",
    status: "الحالة",
    actions: "الإجراءات",
    confirmed: "مؤكّد",
    unconfirmed: "غير مؤكّد",
    manage: "إدارة",
    refresh: "تحديث",
    loading: "جارٍ تحميل المستخدمين...",
    empty: "لا توجد حسابات مطابقة للبحث.",
    noUsers: "لم يرجع API أي مستخدمين.",
    details: "تفاصيل الحساب",
    detailsHint:
      "أدر حالة الحساب وصلاحية المدرّس والالتحاق بالدورات.",
    close: "إغلاق",
    accountStatus: "حالة الحساب",
    emailStatus: "تأكيد البريد",
    created: "تاريخ إنشاء الحساب",
    activate: "تفعيل الحساب",
    deactivate: "تعطيل الحساب",
    assignInstructor: "تعيين كمدرب",
    removeInstructor: "إزالة دور المدرب",
    adminProtected:
      "لا يمكن تعديل حسابات الإدارة من هذه الواجهة.",
    learningTitle: "إدارة الدورات",
    learningDescription:
      "راجع دورات الطالب المسجلة أو اختر دورة أخرى لإدارة الوصول إليها.",
    studentOnly:
      "إدارة الالتحاقات متاحة للحسابات التي تمتلك دور Student.",
    enrolledCourses: "دورات الطالب المسجلة",
    loadingEnrollments: "جارٍ تحميل التحاقات الطالب...",
    noEnrollments: "لا توجد التحاقات مسجلة لهذا الطالب.",
    enrollmentsError: "تعذّر تحميل التحاقات الطالب.",
    enrollmentCount: "سجلات الالتحاق",
    selectCourse: "اختر الدورة",
    noCourseSelected: "اختر دورة لعرض حالة التحاق الطالب بها.",
    noCourses: "لا توجد دورات متاحة.",
    checking: "جارٍ التحقق من الالتحاق...",
    notEnrolled: "غير مسجّل بالدورة",
    notEnrolledText:
      "لا يوجد سجل التحاق لهذا الطالب بالدورة المختارة.",
    enrollmentFound: "سجل الالتحاق",
    enrollmentId: "رقم الالتحاق",
    enrolledAt: "تاريخ الالتحاق",
    completedAt: "تاريخ الإكمال",
    addToCourse: "إضافة إلى الدورة",
    cancelEnrollment: "إلغاء الالتحاق",
    reactivateEnrollment: "إعادة تفعيل الالتحاق",
    refreshEnrollment: "إعادة التحقق",
    confirm: "تأكيد العملية",
    cancel: "رجوع",
    processing: "جارٍ التنفيذ...",
    success: "تم حفظ التغيير بنجاح.",
    requestError: "تعذّر إتمام العملية. حاول مرة أخرى.",
    confirmAccount:
      "سيؤثر هذا التغيير على إمكانية وصول المستخدم إلى الأكاديمية.",
    confirmInstructor:
      "سيؤدي هذا التغيير إلى تعديل صلاحيات المستخدم كمدرب.",
    confirmEnroll:
      "سيتم إلحاق الطالب بالدورة المختارة.",
    confirmCancel:
      "سيتم إلغاء الالتحاق دون حذف السجل نهائيًا، وقد يفقد الطالب الوصول إلى محتوى الدورة.",
    confirmReactivate:
      "سيتم إعادة تفعيل سجل الالتحاق الملغى.",
    completedWarning:
      "هذا الالتحاق مكتمل. قد يؤثر إلغاؤه وإعادة تفعيله لاحقًا على تاريخ الإكمال وسجل الدورة.",
    unpublishedWarning:
      "يمكن إضافة الطلاب إلى الدورات المنشورة فقط.",
    inactiveWarning:
      "هذا الحساب معطّل. يجب تفعيله قبل إضافة الطالب إلى دورة.",
    filterResult: "عرض",
    of: "من أصل",
    clear: "إزالة الفلاتر",
    id: "المعرّف",
  },
} as const;

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function extractItems(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return null;

  for (const key of [
    "items",
    "data",
    "users",
    "courses",
    "enrollments",
    "results",
  ]) {
    const candidate = value[key];

    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (isRecord(candidate)) {
      for (const nestedKey of [
        "items",
        "data",
        "results",
        "enrollments",
      ]) {
        if (Array.isArray(candidate[nestedKey])) {
          return candidate[nestedKey];
        }
      }
    }
  }

  return null;
}

function parseUser(value: unknown): User | null {
  if (
    !isRecord(value) ||
    !Number.isSafeInteger(value.id) ||
    (value.id as number) <= 0 ||
    typeof value.username !== "string" ||
    typeof value.email !== "string" ||
    typeof value.isActive !== "boolean" ||
    !Array.isArray(value.roles)
  ) {
    return null;
  }

  return {
    id: value.id as number,
    firstName:
      typeof value.firstName === "string"
        ? value.firstName
        : "",
    lastName:
      typeof value.lastName === "string"
        ? value.lastName
        : "",
    username: value.username,
    email: value.email,
    isActive: value.isActive,
    emailConfirmed: value.emailConfirmed === true,
    roles: value.roles.filter(
      (role): role is string => typeof role === "string"
    ),
    createdAt:
      typeof value.createdAt === "string"
        ? value.createdAt
        : null,
  };
}

function parseCourse(value: unknown): Course | null {
  if (
    !isRecord(value) ||
    !Number.isSafeInteger(value.id) ||
    (value.id as number) <= 0 ||
    typeof value.title !== "string"
  ) {
    return null;
  }

  return {
    id: value.id as number,
    title: value.title,
    slug:
      typeof value.slug === "string"
        ? value.slug
        : "",
    status:
      typeof value.status === "string"
        ? value.status
        : null,
  };
}

function parseEnrollment(value: unknown): Enrollment | null {
  if (
    !isRecord(value) ||
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

async function getResponseData(
  response: Response
): Promise<unknown> {
  if (response.status === 204) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function apiError(
  data: unknown,
  fallback: string
): string {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (!isRecord(data)) return fallback;

  if (
    typeof data.message === "string" &&
    data.message.trim()
  ) {
    return data.message;
  }

  if (
    typeof data.Message === "string" &&
    data.Message.trim()
  ) {
    return data.Message;
  }

  if (isRecord(data.errors)) {
    const values = Object.values(data.errors).flat();
    const first = values.find(
      (value) => typeof value === "string"
    );

    if (typeof first === "string") return first;
  }

  return typeof data.title === "string"
    ? data.title
    : fallback;
}

function hasRole(user: User, role: string): boolean {
  return user.roles.some(
    (item) =>
      item.toLowerCase() === role.toLowerCase()
  );
}

function fullName(user: User): string {
  const name =
    `${user.firstName} ${user.lastName}`.trim();

  return name || user.username;
}

function formatDate(
  value: string | null,
  locale: Locale
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase();
}

function enrollmentStatusClass(
  status: string
): string {
  const normalized = normalizeStatus(status);

  if (normalized === "completed") {
    return styles.enrollmentCompleted;
  }

  if (
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    return styles.enrollmentCancelled;
  }

  return styles.enrollmentActive;
}

function enrollmentStatusText(
  status: string,
  locale: Locale
): string {
  const normalized = normalizeStatus(status);

  if (locale === "ar") {
    if (normalized === "active") return "نشط";
    if (normalized === "completed") return "مكتمل";
    if (
      normalized === "cancelled" ||
      normalized === "canceled"
    ) {
      return "ملغى";
    }
  }

  return status;
}

export default function AdminStudentsPage() {
  const params = useParams<{ locale: string }>();

  const locale: Locale =
    params.locale === "ar" ? "ar" : "en";

  const t = dictionary[locale];

  // ======================================
  // Users and courses
  // ======================================

  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [courseError, setCourseError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] =
    useState("all");

  // ======================================
  // Selected user and course
  // ======================================

  const [selectedUserId, setSelectedUserId] =
    useState<number | null>(null);

  const [selectedCourseId, setSelectedCourseId] =
    useState("");

  const [enrollmentState, setEnrollmentState] =
    useState<EnrollmentState>({ kind: "idle" });

  const [enrollmentVersion, setEnrollmentVersion] =
    useState(0);

  // ======================================
  // All enrollments for selected user
  // ======================================

  const [
    studentEnrollments,
    setStudentEnrollments,
  ] = useState<Enrollment[]>([]);

  const [
    studentEnrollmentsLoading,
    setStudentEnrollmentsLoading,
  ] = useState(false);

  const [
    studentEnrollmentsError,
    setStudentEnrollmentsError,
  ] = useState("");

  // ======================================
  // Administrative actions
  // ======================================

  const [pendingAction, setPendingAction] =
    useState<PendingAction | null>(null);

  const [actionBusy, setActionBusy] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  // ======================================
  // Load users
  // ======================================

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/users",
        {
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(
          apiError(data, t.requestError)
        );
      }

      const items = extractItems(data);

      if (!items) {
        throw new Error(
          "Unexpected users response."
        );
      }

      setUsers(
        items
          .map(parseUser)
          .filter(
            (item): item is User => item !== null
          )
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t.requestError
      );
    } finally {
      setLoading(false);
    }
  }, [t.requestError]);

  // ======================================
  // Load courses
  // ======================================

  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    setCourseError("");

    try {
      let response = await fetch(
        "/api/admin/courses",
        {
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      if (
        response.status === 404 ||
        response.status === 405
      ) {
        response = await fetch("/api/courses", {
          credentials: "same-origin",
          cache: "no-store",
        });
      }

      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(
          apiError(data, t.requestError)
        );
      }

      const items = extractItems(data);

      if (!items) {
        throw new Error(
          "Unexpected courses response."
        );
      }

      const normalized = items
        .map(parseCourse)
        .filter(
          (item): item is Course => item !== null
        )
        .sort((a, b) =>
          a.title.localeCompare(b.title)
        );

      setCourses(normalized);
    } catch (cause) {
      setCourseError(
        cause instanceof Error
          ? cause.message
          : t.requestError
      );
    } finally {
      setCoursesLoading(false);
    }
  }, [t.requestError]);

  useEffect(() => {
    void loadUsers();
    void loadCourses();
  }, [loadUsers, loadCourses]);

  // ======================================
  // Selected objects
  // ======================================

  const selectedUser = useMemo(
    () =>
      users.find(
        (user) => user.id === selectedUserId
      ) ?? null,
    [users, selectedUserId]
  );

  const selectedCourse = useMemo(
    () =>
      courses.find(
        (course) =>
          String(course.id) === selectedCourseId
      ) ?? null,
    [courses, selectedCourseId]
  );

  const courseLookup = useMemo(
    () =>
      new Map(
        courses.map((course) => [
          course.id,
          course,
        ])
      ),
    [courses]
  );

  // ======================================
  // Load all user enrollments
  // ======================================

  useEffect(() => {
    if (!selectedUserId) {
      setStudentEnrollments([]);
      setStudentEnrollmentsError("");
      setStudentEnrollmentsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadStudentEnrollments() {
      setStudentEnrollmentsLoading(true);
      setStudentEnrollmentsError("");

      try {
        const response = await fetch(
          `/api/admin/enrollments/users/${selectedUserId}`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data =
          await getResponseData(response);

        if (controller.signal.aborted) return;

        if (!response.ok) {
          throw new Error(
            apiError(
              data,
              t.enrollmentsError
            )
          );
        }

        const items = extractItems(data);

        if (!items) {
          throw new Error(
            "Unexpected enrollments response."
          );
        }

        const records = items
          .map(parseEnrollment)
          .filter(
            (item): item is Enrollment =>
              item !== null &&
              item.userId === selectedUserId
          )
          .sort((a, b) =>
            (b.enrolledAt ?? "").localeCompare(
              a.enrolledAt ?? ""
            )
          );

        setStudentEnrollments(records);
      } catch (cause) {
        if (controller.signal.aborted) return;

        setStudentEnrollmentsError(
          cause instanceof Error
            ? cause.message
            : t.enrollmentsError
        );
      } finally {
        if (!controller.signal.aborted) {
          setStudentEnrollmentsLoading(false);
        }
      }
    }

    void loadStudentEnrollments();

    return () => controller.abort();
  }, [
    selectedUserId,
    enrollmentVersion,
    t.enrollmentsError,
  ]);

  // ======================================
  // Check selected course enrollment
  // ======================================

  useEffect(() => {
    if (!selectedUserId || !selectedCourseId) {
      setEnrollmentState({ kind: "idle" });
      return;
    }

    const controller = new AbortController();

    async function checkEnrollment() {
      setEnrollmentState({ kind: "checking" });

      try {
        const response = await fetch(
          `/api/admin/enrollments/users/${selectedUserId}/courses/${selectedCourseId}`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;

        if (response.status === 404) {
          setEnrollmentState({ kind: "none" });
          return;
        }

        const data =
          await getResponseData(response);

        if (controller.signal.aborted) return;

        if (!response.ok) {
          throw new Error(
            apiError(data, t.requestError)
          );
        }

        const enrollment =
          parseEnrollment(data);

        if (!enrollment) {
          throw new Error(
            "Unexpected enrollment response."
          );
        }

        if (
          enrollment.userId !== selectedUserId ||
          enrollment.courseId !==
            Number(selectedCourseId)
        ) {
          throw new Error(
            "Enrollment does not match the selected student and course."
          );
        }

        setEnrollmentState({
          kind: "found",
          data: enrollment,
        });
      } catch (cause) {
        if (controller.signal.aborted) return;

        setEnrollmentState({
          kind: "error",
          message:
            cause instanceof Error
              ? cause.message
              : t.requestError,
        });
      }
    }

    void checkEnrollment();

    return () => controller.abort();
  }, [
    selectedUserId,
    selectedCourseId,
    enrollmentVersion,
    t.requestError,
  ]);

  // ======================================
  // Escape handling
  // ======================================

  useEffect(() => {
    if (
      selectedUserId === null &&
      pendingAction === null
    ) {
      return;
    }

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key !== "Escape" ||
        actionBusy
      ) {
        return;
      }

      if (pendingAction) {
        setPendingAction(null);
      } else {
        setSelectedUserId(null);
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () =>
      document.removeEventListener(
        "keydown",
        handleEscape
      );
  }, [
    selectedUserId,
    pendingAction,
    actionBusy,
  ]);

  // ======================================
  // Filters and statistics
  // ======================================

  const filtered = useMemo(() => {
    const term =
      search.trim().toLowerCase();

    return users.filter((user) => {
      const text = [
        user.firstName,
        user.lastName,
        user.username,
        user.email,
        fullName(user),
      ]
        .join(" ")
        .toLowerCase();

      const roleMatch =
        roleFilter === "all" ||
        hasRole(user, roleFilter);

      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          user.isActive) ||
        (statusFilter === "inactive" &&
          !user.isActive);

      return (
        (!term || text.includes(term)) &&
        roleMatch &&
        statusMatch
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  const stats = useMemo(
    () => ({
      total: users.length,
      students: users.filter((user) =>
        hasRole(user, "Student")
      ).length,
      instructors: users.filter((user) =>
        hasRole(user, "Instructor")
      ).length,
      active: users.filter(
        (user) => user.isActive
      ).length,
    }),
    [users]
  );

  // ======================================
  // Open user and confirmation
  // ======================================

  function openUser(user: User) {
    setSelectedUserId(user.id);
    setSelectedCourseId("");
    setEnrollmentState({ kind: "idle" });
    setStudentEnrollments([]);
    setStudentEnrollmentsError("");
    setNotice("");
  }

  function closeUser() {
    if (actionBusy) return;
    setSelectedUserId(null);
    setSelectedCourseId("");
  }

  function openConfirmation(
    action: PendingAction
  ) {
    setPendingAction(action);
    setActionError("");
  }

  // ======================================
  // Administrative action
  // ======================================

  async function performAction() {
    if (!pendingAction || actionBusy) return;

    const action = pendingAction;
    let url = "";

    let method:
      | "POST"
      | "PATCH"
      | "DELETE" = "PATCH";

    switch (action.kind) {
      case "activateUser":
        url = `/api/admin/users/${action.user.id}/activate`;
        break;

      case "deactivateUser":
        url = `/api/admin/users/${action.user.id}/deactivate`;
        break;

      case "assignInstructor":
        url = `/api/admin/users/${action.user.id}/instructor`;
        break;

      case "removeInstructor":
        url = `/api/admin/users/${action.user.id}/instructor`;
        method = "DELETE";
        break;

      case "enroll":
        if (!action.course) return;
        url = `/api/admin/enrollments/users/${action.user.id}/courses/${action.course.id}`;
        method = "POST";
        break;

      case "cancel":
      case "reactivate":
        if (!action.enrollment) return;

        url = `/api/admin/enrollments/${action.enrollment.id}/${
          action.kind === "cancel"
            ? "cancel"
            : "reactivate"
        }`;
        break;
    }

    setActionBusy(true);
    setActionError("");

    try {
      const response = await fetch(url, {
        method,
        credentials: "same-origin",
        cache: "no-store",
      });

      const data =
        await getResponseData(response);

      if (!response.ok) {
        throw new Error(
          apiError(data, t.requestError)
        );
      }

      setPendingAction(null);
      setNotice(t.success);

      if (
        action.kind === "enroll" ||
        action.kind === "cancel" ||
        action.kind === "reactivate"
      ) {
        // Refresh both the selected course
        // and the complete enrollment list.
        setEnrollmentVersion(
          (value) => value + 1
        );
      } else {
        await loadUsers();
      }
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : t.requestError
      );
    } finally {
      setActionBusy(false);
    }
  }

  const actionNames: Record<
    ActionKind,
    string
  > = {
    activateUser: t.activate,
    deactivateUser: t.deactivate,
    assignInstructor: t.assignInstructor,
    removeInstructor: t.removeInstructor,
    enroll: t.addToCourse,
    cancel: t.cancelEnrollment,
    reactivate: t.reactivateEnrollment,
  };

  const actionDescriptions: Record<
    ActionKind,
    string
  > = {
    activateUser: t.confirmAccount,
    deactivateUser: t.confirmAccount,
    assignInstructor: t.confirmInstructor,
    removeInstructor: t.confirmInstructor,
    enroll: t.confirmEnroll,
    cancel: t.confirmCancel,
    reactivate: t.confirmReactivate,
  };

  const currentEnrollment =
    enrollmentState.kind === "found"
      ? enrollmentState.data
      : null;

  const currentEnrollmentStatus =
    currentEnrollment
      ? normalizeStatus(currentEnrollment.status)
      : "";

  const isCancelled =
    currentEnrollmentStatus === "cancelled" ||
    currentEnrollmentStatus === "canceled";

  const isCompleted =
    currentEnrollmentStatus === "completed";

  const courseIsUnpublished =
    selectedCourse?.status !== null &&
    selectedCourse?.status !== undefined &&
    normalizeStatus(selectedCourse.status) !==
      "published";

  const pendingIsCompletedCancel =
    pendingAction?.kind === "cancel" &&
    pendingAction.enrollment !== undefined &&
    normalizeStatus(
      pendingAction.enrollment.status
    ) === "completed";

  // ======================================
  // Render
  // ======================================

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* PAGE HEADER */}
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>
            {t.eyebrow}
          </span>

          <h2>{t.title}</h2>
          <p>{t.description}</p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          disabled={loading || coursesLoading}
          onClick={() => {
            void loadUsers();
            void loadCourses();

            if (selectedUserId) {
              setEnrollmentVersion(
                (value) => value + 1
              );
            }
          }}
        >
          <span aria-hidden="true">↻</span>
          {t.refresh}
        </button>
      </header>

      {/* STATISTICS */}
      <section
        className={styles.stats}
        aria-label={t.title}
      >
        {[
          {
            label: t.total,
            count: stats.total,
          },
          {
            label: t.students,
            count: stats.students,
          },
          {
            label: t.instructors,
            count: stats.instructors,
          },
          {
            label: t.active,
            count: stats.active,
          },
        ].map((stat, index) => (
          <div
            className={styles.stat}
            key={stat.label}
          >
            <div className={styles.statTop}>
              <span>{stat.label}</span>
              <small>
                {String(index + 1).padStart(
                  2,
                  "0"
                )}
              </small>
            </div>

            <strong>
              {loading ? "—" : stat.count}
            </strong>
          </div>
        ))}
      </section>

      {/* USER DIRECTORY */}
      <section className={styles.workspace}>
        <div className={styles.workspaceHeader}>
          <h3>{t.directory}</h3>
          <p>{t.directoryDescription}</p>
        </div>

        <div className={styles.filters}>
          <input
            type="search"
            className={styles.search}
            placeholder={t.search}
            aria-label={t.search}
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            aria-label={t.roles}
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value)
            }
          >
            <option value="all">
              {t.allRoles}
            </option>
            <option value="Student">
              {t.student}
            </option>
            <option value="Instructor">
              {t.instructor}
            </option>
            <option value="Admin">
              {t.administrator}
            </option>
          </select>

          <select
            aria-label={t.status}
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">
              {t.allStatuses}
            </option>
            <option value="active">
              {t.activeStatus}
            </option>
            <option value="inactive">
              {t.inactiveStatus}
            </option>
          </select>
        </div>

        {notice && (
          <div
            className={styles.successNotice}
            role="status"
          >
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

        {error && (
          <div
            className={styles.errorNotice}
            role="alert"
          >
            {error}

            <button
              type="button"
              onClick={() => void loadUsers()}
            >
              {t.refresh}
            </button>
          </div>
        )}

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t.user}</th>
                <th>{t.roles}</th>
                <th>{t.verified}</th>
                <th>{t.joined}</th>
                <th>{t.status}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className={styles.emptyCell}
                  >
                    {t.loading}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className={styles.emptyCell}
                  >
                    <strong>
                      {users.length === 0
                        ? t.noUsers
                        : t.empty}
                    </strong>

                    {users.length > 0 && (
                      <button
                        type="button"
                        className={styles.clearButton}
                        onClick={() => {
                          setSearch("");
                          setRoleFilter("all");
                          setStatusFilter("all");
                        }}
                      >
                        {t.clear}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div
                        className={
                          styles.userCell
                        }
                      >
                        <span
                          className={
                            styles.avatar
                          }
                        >
                          {user.username
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <div>
                          <strong>
                            {fullName(user)}
                          </strong>

                          <span>
                            @{user.username}
                          </span>

                          <small>
                            {user.email}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className={styles.roles}>
                        {user.roles.map((role) => (
                          <span key={role}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <span
                        className={
                          styles.secondaryText
                        }
                      >
                        {user.emailConfirmed
                          ? t.confirmed
                          : t.unconfirmed}
                      </span>
                    </td>

                    <td
                      className={
                        styles.secondaryText
                      }
                    >
                      {formatDate(
                        user.createdAt,
                        locale
                      )}
                    </td>

                    <td>
                      <span
                        className={`${
                          styles.status
                        } ${
                          user.isActive
                            ? styles.statusActive
                            : styles.statusInactive
                        }`}
                      >
                        <span
                          aria-hidden="true"
                        />

                        {user.isActive
                          ? t.activeStatus
                          : t.inactiveStatus}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className={
                          styles.manageButton
                        }
                        onClick={() =>
                          openUser(user)
                        }
                      >
                        {t.manage}
                        <span
                          aria-hidden="true"
                        >
                          ↗
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <span>
            CRESTMARK ACADEMY / USERS
          </span>

          <span>
            {t.filterResult}{" "}
            {filtered.length}{" "}
            {t.of}{" "}
            {users.length}
          </span>
        </div>
      </section>

      {/* USER DETAILS PANEL */}
      {selectedUser && (
        <div className={styles.panelOverlay}>
          <button
            type="button"
            className={styles.panelBackdrop}
            aria-label={t.close}
            onClick={closeUser}
          />

          <aside
            className={styles.detailPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
          >
            <div className={styles.panelHeader}>
              <div>
                <span
                  className={styles.eyebrow}
                >
                  CRESTMARK / USER #
                  {selectedUser.id}
                </span>

                <h2 id="user-details-title">
                  {t.details}
                </h2>

                <p>{t.detailsHint}</p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                aria-label={t.close}
                onClick={closeUser}
              >
                ×
              </button>
            </div>

            <div className={styles.panelBody}>
              {/* PROFILE */}
              <div
                className={
                  styles.profileHeader
                }
              >
                <span
                  className={
                    styles.largeAvatar
                  }
                >
                  {selectedUser.username
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <div>
                  <h3>
                    {fullName(selectedUser)}
                  </h3>

                  <span>
                    @{selectedUser.username}
                  </span>

                  <p>{selectedUser.email}</p>
                </div>
              </div>

              {/* ACCOUNT DETAILS */}
              <div
                className={
                  styles.detailsGrid
                }
              >
                <div>
                  <span>
                    {t.accountStatus}
                  </span>
                  <strong>
                    {selectedUser.isActive
                      ? t.activeStatus
                      : t.inactiveStatus}
                  </strong>
                </div>

                <div>
                  <span>
                    {t.emailStatus}
                  </span>
                  <strong>
                    {selectedUser.emailConfirmed
                      ? t.confirmed
                      : t.unconfirmed}
                  </strong>
                </div>

                <div>
                  <span>{t.created}</span>
                  <strong>
                    {formatDate(
                      selectedUser.createdAt,
                      locale
                    )}
                  </strong>
                </div>
              </div>

              {/* ROLES AND ACCOUNT ACTIONS */}
              <section
                className={
                  styles.panelSection
                }
              >
                <h3>{t.roles}</h3>

                <div className={styles.roles}>
                  {selectedUser.roles.map(
                    (role) => (
                      <span key={role}>
                        {role}
                      </span>
                    )
                  )}
                </div>

                {!hasRole(
                  selectedUser,
                  "Admin"
                ) ? (
                  <div
                    className={
                      styles.accountActions
                    }
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openConfirmation({
                          kind:
                            selectedUser.isActive
                              ? "deactivateUser"
                              : "activateUser",
                          user: selectedUser,
                        })
                      }
                    >
                      {selectedUser.isActive
                        ? t.deactivate
                        : t.activate}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openConfirmation({
                          kind: hasRole(
                            selectedUser,
                            "Instructor"
                          )
                            ? "removeInstructor"
                            : "assignInstructor",
                          user: selectedUser,
                        })
                      }
                    >
                      {hasRole(
                        selectedUser,
                        "Instructor"
                      )
                        ? t.removeInstructor
                        : t.assignInstructor}
                    </button>
                  </div>
                ) : (
                  <p
                    className={
                      styles.helperText
                    }
                  >
                    {t.adminProtected}
                  </p>
                )}
              </section>

              {/* COURSE ACCESS */}
              <section
                className={
                  styles.panelSection
                }
              >
                <h3>{t.learningTitle}</h3>

                <p
                  className={
                    styles.helperText
                  }
                >
                  {t.learningDescription}
                </p>

                {!hasRole(
                  selectedUser,
                  "Student"
                ) ? (
                  <p className={styles.infoBox}>
                    {t.studentOnly}
                  </p>
                ) : (
                  <>
                    {/* ALL ENROLLED COURSES */}
                    <div
                      className={
                        styles.studentEnrollments
                      }
                    >
                      <div
                        className={
                          styles.studentEnrollmentsHeader
                        }
                      >
                        <strong>
                          {t.enrolledCourses}
                        </strong>

                        <span>
                          {studentEnrollmentsLoading
                            ? "..."
                            : studentEnrollments.length}
                        </span>
                      </div>

                      {studentEnrollmentsLoading ? (
                        <p
                          className={
                            styles.studentEnrollmentsMessage
                          }
                        >
                          {t.loadingEnrollments}
                        </p>
                      ) : studentEnrollmentsError ? (
                        <p
                          className={
                            styles.studentEnrollmentsError
                          }
                          role="alert"
                        >
                          {studentEnrollmentsError}
                        </p>
                      ) : studentEnrollments.length ===
                        0 ? (
                        <p
                          className={
                            styles.studentEnrollmentsMessage
                          }
                        >
                          {t.noEnrollments}
                        </p>
                      ) : (
                        <div
                          className={
                            styles.studentEnrollmentList
                          }
                        >
                          {studentEnrollments.map(
                            (enrollment) => {
                              const course =
                                courseLookup.get(
                                  enrollment.courseId
                                );

                              const selected =
                                selectedCourseId ===
                                String(
                                  enrollment.courseId
                                );

                              return (
                                <button
                                  key={
                                    enrollment.id
                                  }
                                  type="button"
                                  className={`${
                                    styles.studentEnrollmentItem
                                  } ${
                                    selected
                                      ? styles.studentEnrollmentSelected
                                      : ""
                                  }`}
                                  aria-pressed={
                                    selected
                                  }
                                  onClick={() =>
                                    setSelectedCourseId(
                                      String(
                                        enrollment.courseId
                                      )
                                    )
                                  }
                                >
                                  <span
                                    className={
                                      styles.studentEnrollmentInfo
                                    }
                                  >
                                    <strong>
                                      {course?.title ||
                                        `Course #${enrollment.courseId}`}
                                    </strong>

                                    <small>
                                      {t.enrollmentId} #
                                      {enrollment.id}
                                    </small>
                                  </span>

                                  <span
                                    className={`${
                                      styles.studentEnrollmentStatus
                                    } ${enrollmentStatusClass(
                                      enrollment.status
                                    )}`}
                                  >
                                    {enrollmentStatusText(
                                      enrollment.status,
                                      locale
                                    )}
                                  </span>
                                </button>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>

                    {/* SELECT ANY COURSE */}
                    <label
                      className={
                        styles.courseLabel
                      }
                    >
                      <span>
                        {t.selectCourse}
                      </span>

                      <select
                        value={
                          selectedCourseId
                        }
                        disabled={
                          coursesLoading
                        }
                        onChange={(event) =>
                          setSelectedCourseId(
                            event.target.value
                          )
                        }
                      >
                        <option value="">
                          {coursesLoading
                            ? t.checking
                            : t.selectCourse}
                        </option>

                        {courses.map(
                          (course) => (
                            <option
                              key={course.id}
                              value={String(
                                course.id
                              )}
                            >
                              {course.title}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    {courseError && (
                      <p
                        className={
                          styles.inlineError
                        }
                        role="alert"
                      >
                        {courseError}
                      </p>
                    )}

                    {!coursesLoading &&
                      courses.length === 0 && (
                        <p
                          className={
                            styles.infoBox
                          }
                        >
                          {t.noCourses}
                        </p>
                      )}

                    {enrollmentState.kind ===
                      "idle" &&
                      courses.length > 0 && (
                        <p
                          className={
                            styles.infoBox
                          }
                        >
                          {t.noCourseSelected}
                        </p>
                      )}

                    {enrollmentState.kind ===
                      "checking" && (
                        <p
                          className={
                            styles.infoBox
                          }
                        >
                          {t.checking}
                        </p>
                      )}

                    {enrollmentState.kind ===
                      "error" && (
                        <div
                          className={
                            styles.inlineError
                          }
                          role="alert"
                        >
                          {enrollmentState.message}

                          <button
                            type="button"
                            onClick={() =>
                              setEnrollmentVersion(
                                (value) =>
                                  value + 1
                              )
                            }
                          >
                            {t.refreshEnrollment}
                          </button>
                        </div>
                      )}

                    {/* NOT ENROLLED */}
                    {enrollmentState.kind ===
                      "none" &&
                      selectedCourse && (
                        <div
                          className={
                            styles.enrollmentBox
                          }
                        >
                          <strong>
                            {t.notEnrolled}
                          </strong>

                          <p>
                            {t.notEnrolledText}
                          </p>

                          {!selectedUser.isActive ? (
                            <p
                              className={
                                styles.infoBox
                              }
                            >
                              {t.inactiveWarning}
                            </p>
                          ) : courseIsUnpublished ? (
                            <p
                              className={
                                styles.infoBox
                              }
                            >
                              {t.unpublishedWarning}
                            </p>
                          ) : (
                            <button
                              type="button"
                              className={
                                styles.primaryAction
                              }
                              onClick={() =>
                                openConfirmation({
                                  kind: "enroll",
                                  user:
                                    selectedUser,
                                  course:
                                    selectedCourse,
                                })
                              }
                            >
                              + {t.addToCourse}
                            </button>
                          )}
                        </div>
                      )}

                    {/* EXISTING ENROLLMENT */}
                    {enrollmentState.kind ===
                      "found" &&
                      selectedCourse && (
                        <div
                          className={
                            styles.enrollmentBox
                          }
                        >
                          <div
                            className={
                              styles.enrollmentHeading
                            }
                          >
                            <strong>
                              {t.enrollmentFound}
                            </strong>

                            <span>
                              {enrollmentStatusText(
                                enrollmentState
                                  .data.status,
                                locale
                              )}
                            </span>
                          </div>

                          <dl
                            className={
                              styles.enrollmentDetails
                            }
                          >
                            <div>
                              <dt>
                                {t.enrollmentId}
                              </dt>
                              <dd>
                                #
                                {
                                  enrollmentState
                                    .data.id
                                }
                              </dd>
                            </div>

                            <div>
                              <dt>
                                {t.enrolledAt}
                              </dt>
                              <dd>
                                {formatDate(
                                  enrollmentState
                                    .data.enrolledAt,
                                  locale
                                )}
                              </dd>
                            </div>

                            {enrollmentState
                              .data.completedAt && (
                              <div>
                                <dt>
                                  {t.completedAt}
                                </dt>
                                <dd>
                                  {formatDate(
                                    enrollmentState
                                      .data.completedAt,
                                    locale
                                  )}
                                </dd>
                              </div>
                            )}
                          </dl>

                          {isCompleted && (
                            <p
                              className={
                                styles.infoBox
                              }
                            >
                              {t.completedWarning}
                            </p>
                          )}

                          {isCancelled &&
                          (!selectedUser.isActive ||
                            courseIsUnpublished) ? (
                            <p
                              className={
                                styles.infoBox
                              }
                            >
                              {!selectedUser.isActive
                                ? t.inactiveWarning
                                : t.unpublishedWarning}
                            </p>
                          ) : (
                            <button
                              type="button"
                              className={
                                isCancelled
                                  ? styles.primaryAction
                                  : styles.dangerAction
                              }
                              onClick={() =>
                                openConfirmation({
                                  kind:
                                    isCancelled
                                      ? "reactivate"
                                      : "cancel",
                                  user:
                                    selectedUser,
                                  course:
                                    selectedCourse,
                                  enrollment:
                                    enrollmentState.data,
                                })
                              }
                            >
                              {isCancelled
                                ? t.reactivateEnrollment
                                : t.cancelEnrollment}
                            </button>
                          )}
                        </div>
                      )}
                  </>
                )}
              </section>
            </div>
          </aside>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {pendingAction && (
        <div
          className={
            styles.confirmOverlay
          }
        >
          <div
            className={
              styles.confirmDialog
            }
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-action-title"
            aria-describedby="confirm-action-description"
          >
            <span
              className={
                styles.confirmIcon
              }
              aria-hidden="true"
            >
              !
            </span>

            <h2 id="confirm-action-title">
              {actionNames[
                pendingAction.kind
              ]}
            </h2>

            <p
              className={
                styles.actionSubject
              }
            >
              {fullName(
                pendingAction.user
              )}

              {pendingAction.course &&
                ` — ${pendingAction.course.title}`}
            </p>

            <p id="confirm-action-description">
              {actionDescriptions[
                pendingAction.kind
              ]}
            </p>

            {pendingIsCompletedCancel && (
              <p
                className={
                  styles.infoBox
                }
              >
                {t.completedWarning}
              </p>
            )}

            {actionError && (
              <p
                className={
                  styles.inlineError
                }
                role="alert"
              >
                {actionError}
              </p>
            )}

            <div
              className={
                styles.confirmActions
              }
            >
              <button
                type="button"
                disabled={actionBusy}
                onClick={() =>
                  setPendingAction(null)
                }
              >
                {t.cancel}
              </button>

              <button
                type="button"
                className={
                  styles.confirmButton
                }
                disabled={actionBusy}
                onClick={() =>
                  void performAction()
                }
              >
                {actionBusy
                  ? t.processing
                  : t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
