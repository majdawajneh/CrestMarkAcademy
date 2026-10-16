
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useParams } from "next/navigation";
import styles from "./page.module.css";

type Locale = "en" | "ar";

type Certificate = {
  id: number;
  enrollmentId: number;
  certificateNumber: string;
  certificateUrl: string | null;
  issuedAt: string;
  courseId: number;
  courseTitle: string;
  userId: number;
  studentName: string;
  courseCompletedAt: string | null;
};

type Enrollment = {
  id: number;
  userId: number;
  courseId: number;
  status: string;
  completedAt: string | null;
};

type Student = {
  id: number;
  name: string;
  email: string;
};

type Course = {
  id: number;
  title: string;
  hasCertificate: boolean | null;
};

type Verification = {
  certificateNumber: string;
  studentName: string;
  courseTitle: string;
  issuedAt: string;
  courseCompletedAt: string | null;
};

type Drawer =
  | { kind: "details"; certificate: Certificate }
  | { kind: "issue" }
  | null;

type VerifyState = "idle" | "loading" | "valid" | "invalid" | "error";

const PAGE_SIZE = 10;

const translations = {
  en: {
    eyebrow: "ACADEMY / ACHIEVEMENTS",
    title: "Certificates management",
    subtitle:
      "Track issued certificates, verify credentials and manage manual issuance.",
    issue: "Issue certificate",
    refresh: "Refresh",
    total: "Total certificates",
    students: "Certified students",
    courses: "Certified courses",
    thisYear: "Issued this year",
    directory: "Certificate directory",
    directoryHint:
      "Official completion certificates issued by CrestMark Academy.",
    search: "Search certificate, student or course...",
    allYears: "All years",
    allCourses: "All courses",
    certificate: "Certificate",
    student: "Student",
    course: "Course",
    completed: "Course completed",
    issued: "Date issued",
    status: "Status",
    actions: "Actions",
    issuedStatus: "Issued",
    details: "View details",
    loading: "Loading certificates...",
    empty: "No certificates issued yet",
    noResults: "No certificates match your filters",
    emptyHint: "Try changing the search or filters.",
    loadError: "Could not load the certificate directory.",
    retry: "Try again",
    showing: "Showing",
    of: "of",
    page: "Page",
    previous: "Previous",
    next: "Next",
    detailsTitle: "Certificate details",
    detailsHint:
      "Official record of completion and certificate issuance.",
    certificateId: "Certificate ID",
    certificateNumber: "Certificate number",
    enrollmentId: "Enrollment ID",
    studentId: "Student ID",
    courseId: "Course ID",
    issuedOn: "Issued on",
    completedOn: "Completed on",
    certificateUrl: "Certificate URL",
    none: "Not available",
    close: "Close",
    verifyTitle: "Certificate verification",
    verifySubtitle:
      "Look up an issued credential using its unique certificate number.",
    verifyPlaceholder: "CMA-2026-XXXXXXXX",
    verifyButton: "Verify certificate",
    verifying: "Verifying...",
    valid: "Certificate verified",
    validHint: "A matching certificate record was found.",
    invalid: "Certificate not found",
    invalidHint:
      "No certificate matched that number. Check the number and try again.",
    verifyError: "Certificate verification is unavailable.",
    verifyRequired: "Enter a certificate number to continue.",
    verifySelected: "Verify this certificate",
    issueTitle: "Issue a certificate",
    issueSubtitle:
      "Select a completed enrollment that has not already received a certificate.",
    issueNote:
      "Certificates are normally issued automatically when eligible courses are completed. Manual issuance is for exceptional cases.",
    candidates: "Eligible completed enrollments",
    findCandidates: "Search students, courses or enrollment IDs...",
    loadingCandidates: "Loading completed enrollments...",
    noCandidates: "No completed enrollments awaiting a certificate",
    noCandidatesHint:
      "The remaining enrollments may be incomplete, already certified, or ineligible.",
    select: "Select",
    selected: "Selected",
    enrollment: "Enrollment",
    confirmIssue: "Confirm certificate issuance",
    confirmationTitle: "Issue a certificate?",
    confirmationHint:
      "The backend will verify completion and course eligibility before issuing. An existing certificate will be returned instead of creating another.",
    confirm: "Confirm issuance",
    cancel: "Cancel",
    processing: "Processing...",
    issuingSuccess: "Certificate issued or retrieved successfully.",
    actionError: "Certificate issuance could not be completed.",
    enrollmentError: "Could not load completed enrollments.",
    lookupNote:
      "Some student or course names are unavailable. IDs are shown instead.",
    noSelection: "Select a completed enrollment first.",
    courseNotEligible: "This course does not offer certificates.",
    noCertificateLink:
      "The certificate record is valid. A separate file URL is not stored.",
    recordNote:
      "This is the administrative record. Student PDF downloads remain available through the existing student certificate flow.",
  },
  ar: {
    eyebrow: "الأكاديمية / الإنجازات",
    title: "إدارة الشهادات",
    subtitle:
      "تابع الشهادات الصادرة وتحقق من صحتها وأصدر شهادات للحالات المؤهلة.",
    issue: "إصدار شهادة",
    refresh: "تحديث",
    total: "إجمالي الشهادات",
    students: "طلاب حصلوا على شهادات",
    courses: "دورات لها شهادات",
    thisYear: "شهادات هذه السنة",
    directory: "سجل الشهادات",
    directoryHint:
      "الشهادات الرسمية الصادرة عن CrestMark Academy.",
    search: "ابحث برقم الشهادة أو الطالب أو الدورة...",
    allYears: "جميع السنوات",
    allCourses: "جميع الدورات",
    certificate: "الشهادة",
    student: "الطالب",
    course: "الدورة",
    completed: "إكمال الدورة",
    issued: "تاريخ الإصدار",
    status: "الحالة",
    actions: "الإجراءات",
    issuedStatus: "صادرة",
    details: "التفاصيل",
    loading: "جارٍ تحميل الشهادات...",
    empty: "لم تُصدر أي شهادات بعد",
    noResults: "لا توجد شهادات مطابقة",
    emptyHint: "جرّب تعديل البحث أو الفلاتر.",
    loadError: "تعذّر تحميل سجل الشهادات.",
    retry: "إعادة المحاولة",
    showing: "عرض",
    of: "من أصل",
    page: "صفحة",
    previous: "السابق",
    next: "التالي",
    detailsTitle: "تفاصيل الشهادة",
    detailsHint:
      "السجل الرسمي لإكمال الدورة وإصدار الشهادة.",
    certificateId: "معرّف الشهادة",
    certificateNumber: "رقم الشهادة",
    enrollmentId: "معرّف الالتحاق",
    studentId: "معرّف الطالب",
    courseId: "معرّف الدورة",
    issuedOn: "تاريخ الإصدار",
    completedOn: "تاريخ الإكمال",
    certificateUrl: "رابط الشهادة",
    none: "غير متوفر",
    close: "إغلاق",
    verifyTitle: "التحقق من الشهادات",
    verifySubtitle:
      "تحقق من شهادة صادرة باستخدام رقمها الفريد.",
    verifyPlaceholder: "CMA-2026-XXXXXXXX",
    verifyButton: "التحقق من الشهادة",
    verifying: "جارٍ التحقق...",
    valid: "تم التحقق من الشهادة",
    validHint: "تم العثور على شهادة مطابقة في النظام.",
    invalid: "لم يتم العثور على الشهادة",
    invalidHint:
      "لا توجد شهادة مطابقة لهذا الرقم. راجع الرقم وحاول مجددًا.",
    verifyError: "تعذّر التحقق من الشهادة حاليًا.",
    verifyRequired: "أدخل رقم الشهادة أولًا.",
    verifySelected: "التحقق من هذه الشهادة",
    issueTitle: "إصدار شهادة",
    issueSubtitle:
      "اختر التحاقًا مكتملًا لم تصدر له شهادة مسبقًا.",
    issueNote:
      "تصدر الشهادات تلقائيًا عند إكمال الدورات المؤهلة. الإصدار اليدوي مخصص للحالات الاستثنائية.",
    candidates: "الالتحاقات المكتملة المؤهلة",
    findCandidates: "ابحث بالطالب أو الدورة أو رقم الالتحاق...",
    loadingCandidates: "جارٍ تحميل الالتحاقات المكتملة...",
    noCandidates: "لا توجد التحاقات مكتملة تنتظر شهادة",
    noCandidatesHint:
      "قد تكون الالتحاقات الأخرى غير مكتملة، أو لديها شهادات مسبقًا، أو غير مؤهلة.",
    select: "اختيار",
    selected: "محدد",
    enrollment: "الالتحاق",
    confirmIssue: "تأكيد إصدار الشهادة",
    confirmationTitle: "هل تريد إصدار الشهادة؟",
    confirmationHint:
      "سيتحقق الـ Backend من إكمال الدورة وأهليتها. وإذا كانت الشهادة موجودة فسيعيدها بدل إصدار نسخة ثانية.",
    confirm: "تأكيد الإصدار",
    cancel: "إلغاء",
    processing: "جارٍ التنفيذ...",
    issuingSuccess: "تم إصدار الشهادة أو استرجاع الشهادة الموجودة بنجاح.",
    actionError: "تعذّر إصدار الشهادة.",
    enrollmentError: "تعذّر تحميل الالتحاقات المكتملة.",
    lookupNote:
      "بعض أسماء الطلاب أو الدورات غير متاحة، لذلك نعرض المعرّفات.",
    noSelection: "اختر التحاقًا مكتملًا أولًا.",
    courseNotEligible: "هذه الدورة لا توفر شهادات.",
    noCertificateLink:
      "سجل الشهادة موجود، لكن لا يوجد رابط ملف محفوظ.",
    recordNote:
      "هذا السجل الإداري للشهادة. تنزيل ملف PDF الخاص بالطالب متاح من خلال مسار شهادات الطالب الحالي.",
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

function extractArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!isObject(value)) return null;

  for (const key of [
    "items",
    "data",
    "results",
    "certificates",
    "enrollments",
    "users",
    "courses",
  ]) {
    const current = value[key];

    if (Array.isArray(current)) return current;

    if (isObject(current) && Array.isArray(current.items)) {
      return current.items;
    }
  }

  return null;
}

function parseCertificate(value: unknown): Certificate | null {
  if (!isObject(value)) return null;

  const id = positiveId(value.id);
  const enrollmentId = positiveId(value.enrollmentId);
  const courseId = positiveId(value.courseId);
  const userId = positiveId(value.userId);

  if (
    !id ||
    !enrollmentId ||
    !courseId ||
    !userId ||
    typeof value.certificateNumber !== "string" ||
    typeof value.courseTitle !== "string" ||
    typeof value.studentName !== "string" ||
    typeof value.issuedAt !== "string"
  ) {
    return null;
  }

  return {
    id,
    enrollmentId,
    courseId,
    userId,
    certificateNumber: value.certificateNumber,
    courseTitle: value.courseTitle,
    studentName: value.studentName,
    issuedAt: value.issuedAt,
    certificateUrl:
      typeof value.certificateUrl === "string"
        ? value.certificateUrl
        : null,
    courseCompletedAt:
      typeof value.courseCompletedAt === "string"
        ? value.courseCompletedAt
        : null,
  };
}

function parseEnrollment(value: unknown): Enrollment | null {
  if (!isObject(value)) return null;

  const id = positiveId(value.id);
  const userId = positiveId(value.userId);
  const courseId = positiveId(value.courseId);

  if (
    !id ||
    !userId ||
    !courseId ||
    typeof value.status !== "string"
  ) {
    return null;
  }

  return {
    id,
    userId,
    courseId,
    status: value.status,
    completedAt:
      typeof value.completedAt === "string"
        ? value.completedAt
        : null,
  };
}

function parseStudent(value: unknown): Student | null {
  if (!isObject(value)) return null;

  const id = positiveId(value.id);
  if (!id) return null;

  const firstName =
    typeof value.firstName === "string" ? value.firstName : "";

  const lastName =
    typeof value.lastName === "string" ? value.lastName : "";

  const username =
    typeof value.username === "string" ? value.username : "";

  const email =
    typeof value.email === "string" ? value.email : "";

  return {
    id,
    name:
      `${firstName} ${lastName}`.trim() ||
      username ||
      `User #${id}`,
    email,
  };
}

function parseCourse(value: unknown): Course | null {
  if (!isObject(value)) return null;

  const id = positiveId(value.id);

  if (!id || typeof value.title !== "string") {
    return null;
  }

  return {
    id,
    title: value.title,
    hasCertificate:
      typeof value.hasCertificate === "boolean"
        ? value.hasCertificate
        : null,
  };
}

function parseVerification(value: unknown): Verification | null {
  if (!isObject(value)) return null;

  if (
    typeof value.certificateNumber !== "string" ||
    typeof value.studentName !== "string" ||
    typeof value.courseTitle !== "string" ||
    typeof value.issuedAt !== "string"
  ) {
    return null;
  }

  return {
    certificateNumber: value.certificateNumber,
    studentName: value.studentName,
    courseTitle: value.courseTitle,
    issuedAt: value.issuedAt,
    courseCompletedAt:
      typeof value.courseCompletedAt === "string"
        ? value.courseCompletedAt
        : null,
  };
}

async function readResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 400) };
  }
}

function getError(value: unknown, fallback: string): string {
  if (!isObject(value)) return fallback;

  for (const key of ["message", "Message", "title"]) {
    const message = value[key];
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

async function loadCollection(
  url: string,
  errorText: string,
  signal?: AbortSignal
): Promise<unknown[]> {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getError(data, errorText));
  }

  const array = extractArray(data);

  if (!array) {
    throw new Error(`Unexpected response from ${url}`);
  }

  return array;
}

function formatDate(
  value: string | null,
  locale: Locale
): string {
  if (!value) return "—";

  const day = value.slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "—";

  const date = new Date(`${day}T12:00:00`);

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

export default function AdminCertificatesPage() {
  const params = useParams<{ locale: string }>();

  const locale: Locale = params.locale === "ar" ? "ar" : "en";
  const t = translations[locale];

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [verificationCode, setVerificationCode] = useState("");
  const [verifyState, setVerifyState] =
    useState<VerifyState>("idle");
  const [verified, setVerified] = useState<Verification | null>(null);
  const [verifyError, setVerifyError] = useState("");

  const [drawer, setDrawer] = useState<Drawer>(null);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupWarning, setLookupWarning] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [selectedEnrollmentId, setSelectedEnrollmentId] =
    useState<number | null>(null);

  const [issueConfirmOpen, setIssueConfirmOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState("");

  // ======================================
  // Load issued certificates
  // ======================================

  const loadCertificates = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setLoadError("");

      try {
        const data = await loadCollection(
          "/api/admin/certificates",
          t.loadError,
          signal
        );

        if (signal?.aborted) return;

        const parsed = data.map(parseCertificate);

        if (parsed.some((item) => item === null)) {
          throw new Error(
            "Unexpected certificate data returned by the API."
          );
        }

        setCertificates(
          (parsed as Certificate[]).sort(
            (a, b) =>
              b.issuedAt.localeCompare(a.issuedAt) ||
              b.id - a.id
          )
        );
      } catch (error) {
        if (signal?.aborted) return;

        setCertificates([]);
        setLoadError(
          error instanceof Error ? error.message : t.loadError
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [t.loadError]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadCertificates(controller.signal);

    return () => controller.abort();
  }, [loadCertificates]);

  // ======================================
  // Statistics and filters
  // ======================================

  const stats = useMemo(() => {
    const currentYear = String(new Date().getFullYear());

    return {
      total: certificates.length,
      students: new Set(certificates.map((c) => c.userId)).size,
      courses: new Set(certificates.map((c) => c.courseId)).size,
      thisYear: certificates.filter(
        (c) => c.issuedAt.startsWith(currentYear)
      ).length,
    };
  }, [certificates]);

  const years = useMemo(
    () =>
      [...new Set(
        certificates.map((c) => c.issuedAt.slice(0, 4))
      )].sort((a, b) => b.localeCompare(a)),
    [certificates]
  );

  const courseOptions = useMemo(() => {
    const map = new Map<number, string>();

    certificates.forEach((certificate) => {
      map.set(
        certificate.courseId,
        certificate.courseTitle
      );
    });

    return [...map.entries()].sort(
      (a, b) => a[1].localeCompare(b[1])
    );
  }, [certificates]);

  const filteredCertificates = useMemo(() => {
    const term = search.trim().toLowerCase();

    return certificates.filter((certificate) => {
      const text = [
        certificate.id,
        certificate.certificateNumber,
        certificate.studentName,
        certificate.courseTitle,
        certificate.enrollmentId,
        certificate.userId,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!term || text.includes(term)) &&
        (yearFilter === "all" ||
          certificate.issuedAt.startsWith(yearFilter)) &&
        (courseFilter === "all" ||
          certificate.courseId === Number(courseFilter))
      );
    });
  }, [certificates, search, yearFilter, courseFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, yearFilter, courseFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCertificates.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleCertificates = filteredCertificates.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ======================================
  // Verify certificate
  // ======================================

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const code = verificationCode.trim().toUpperCase();

    setVerified(null);
    setVerifyError("");

    if (!code) {
      setVerifyState("error");
      setVerifyError(t.verifyRequired);
      return;
    }

    if (!/^[A-Z0-9-]{4,100}$/.test(code)) {
      setVerifyState("invalid");
      return;
    }

    setVerifyState("loading");

    try {
      const response = await fetch(
        `/api/admin/certificates/verify/${encodeURIComponent(code)}`,
        {
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const data = await readResponse(response);

      if (response.status === 404) {
        setVerifyState("invalid");
        return;
      }

      if (!response.ok) {
        throw new Error(getError(data, t.verifyError));
      }

      const result = parseVerification(data);

      if (
        !result ||
        result.certificateNumber.toUpperCase() !== code
      ) {
        throw new Error(t.verifyError);
      }

      setVerified(result);
      setVerifyState("valid");
    } catch (error) {
      setVerifyState("error");
      setVerifyError(
        error instanceof Error ? error.message : t.verifyError
      );
    }
  }

  function verifyFromDetails(certificate: Certificate) {
    setVerificationCode(certificate.certificateNumber);
    setVerifyState("idle");
    setVerified(null);
    setVerifyError("");
    setDrawer(null);

    document
      .getElementById("certificate-verification")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  // ======================================
  // Load eligible enrollment candidates
  // ======================================

  const loadCandidates = useCallback(async () => {
    setLookupLoading(true);
    setLookupError("");
    setLookupWarning(false);

    const results = await Promise.allSettled([
      loadCollection(
        "/api/admin/enrollments",
        t.enrollmentError
      ),
      loadCollection(
        "/api/admin/users",
        t.lookupNote
      ),
      loadCollection(
        "/api/admin/courses",
        t.lookupNote
      ),
    ]);

    const [enrollmentResult, studentResult, courseResult] =
      results;

    if (enrollmentResult.status === "fulfilled") {
      const parsed = enrollmentResult.value.map(parseEnrollment);

      if (parsed.some((item) => item === null)) {
        setLookupError(t.enrollmentError);
        setEnrollments([]);
      } else {
        setEnrollments(parsed as Enrollment[]);
      }
    } else {
      setEnrollments([]);
      setLookupError(
        enrollmentResult.reason instanceof Error
          ? enrollmentResult.reason.message
          : t.enrollmentError
      );
    }

    if (studentResult.status === "fulfilled") {
      const parsed = studentResult.value
        .map(parseStudent)
        .filter((item): item is Student => item !== null);

      setStudents(parsed);
    } else {
      setStudents([]);
      setLookupWarning(true);
    }

    if (courseResult.status === "fulfilled") {
      const parsed = courseResult.value
        .map(parseCourse)
        .filter((item): item is Course => item !== null);

      setCourses(parsed);
    } else {
      setCourses([]);
      setLookupWarning(true);
    }

    setLookupLoading(false);
  }, [t.enrollmentError, t.lookupNote]);

  function openIssue() {
    setDrawer({ kind: "issue" });
    setCandidateSearch("");
    setSelectedEnrollmentId(null);
    setIssueError("");
    setIssueConfirmOpen(false);

    void loadCandidates();
  }

  const studentsById = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students]
  );

  const coursesById = useMemo(
    () => new Map(courses.map((course) => [course.id, course])),
    [courses]
  );

  const issuedEnrollmentIds = useMemo(
    () =>
      new Set(
        certificates.map((certificate) => certificate.enrollmentId)
      ),
    [certificates]
  );

  const candidates = useMemo(() => {
    const term = candidateSearch.trim().toLowerCase();

    return enrollments
      .filter((enrollment) => {
        if (enrollment.status.toLowerCase() !== "completed") {
          return false;
        }

        if (!enrollment.completedAt) return false;

        if (issuedEnrollmentIds.has(enrollment.id)) {
          return false;
        }

        const course = coursesById.get(enrollment.courseId);

        if (course?.hasCertificate === false) {
          return false;
        }

        const student = studentsById.get(enrollment.userId);

        const searchable = [
          enrollment.id,
          enrollment.userId,
          enrollment.courseId,
          student?.name,
          student?.email,
          course?.title,
        ]
          .filter((value) => value !== undefined)
          .join(" ")
          .toLowerCase();

        return !term || searchable.includes(term);
      })
      .sort(
        (a, b) =>
          (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
      );
  }, [
    enrollments,
    issuedEnrollmentIds,
    studentsById,
    coursesById,
    candidateSearch,
  ]);

  const selectedEnrollment = enrollments.find(
    (enrollment) => enrollment.id === selectedEnrollmentId
  );

  // ======================================
  // Issue certificate
  // ======================================

  async function handleIssue() {
    if (
      issuing ||
      !selectedEnrollment ||
      !issueConfirmOpen ||
      lookupError
    ) {
      return;
    }

    if (
      selectedEnrollment.status.toLowerCase() !== "completed" ||
      !selectedEnrollment.completedAt ||
      issuedEnrollmentIds.has(selectedEnrollment.id) ||
      coursesById.get(selectedEnrollment.courseId)
        ?.hasCertificate === false
    ) {
      setIssueError(t.noSelection);
      setIssueConfirmOpen(false);
      return;
    }

    setIssuing(true);
    setIssueError("");

    try {
      const response = await fetch(
        `/api/admin/certificates/enrollments/${selectedEnrollment.id}/issue`,
        {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(getError(data, t.actionError));
      }

      const certificate = parseCertificate(data);

      if (!certificate) {
        throw new Error(
          "Unexpected certificate issuance response."
        );
      }

      setIssueConfirmOpen(false);
      setDrawer({ kind: "details", certificate });
      setNotice(t.issuingSuccess);

      await loadCertificates();
    } catch (error) {
      setIssueError(
        error instanceof Error ? error.message : t.actionError
      );
      setIssueConfirmOpen(false);
    } finally {
      setIssuing(false);
    }
  }

  useEffect(() => {
    if (!drawer && !issueConfirmOpen) return;

    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || issuing) return;

      if (issueConfirmOpen) {
        setIssueConfirmOpen(false);
      } else {
        setDrawer(null);
      }
    }

    document.addEventListener("keydown", onEscape);

    return () =>
      document.removeEventListener("keydown", onEscape);
  }, [drawer, issueConfirmOpen, issuing]);

  const statCards = [
    { number: "01", label: t.total, value: stats.total },
    { number: "02", label: t.students, value: stats.students },
    { number: "03", label: t.courses, value: stats.courses },
    { number: "04", label: t.thisYear, value: stats.thisYear },
  ];

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
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
            onClick={() => void loadCertificates()}
            disabled={loading || issuing}
          >
            <span aria-hidden="true">↻</span>
            {t.refresh}
          </button>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={openIssue}
          >
            <span aria-hidden="true">+</span>
            {t.issue}
          </button>
        </div>
      </header>

      <section className={styles.stats} aria-label={t.title}>
        {statCards.map((card) => (
          <div className={styles.statCard} key={card.number}>
            <div className={styles.statTop}>
              <span>{card.label}</span>
              <small>{card.number}</small>
            </div>
            <strong>
              {loading || loadError ? "—" : card.value}
            </strong>
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
            {loading || loadError
              ? "—"
              : certificates.length}
          </span>
        </div>

        {notice && (
          <div className={styles.successMessage} role="status">
            <span>{notice}</span>
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
              onClick={() => void loadCertificates()}
            >
              {t.retry}
            </button>
          </div>
        )}

        <div className={styles.filters}>
          <div className={styles.searchField}>
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
              value={search}
              placeholder={t.search}
              aria-label={t.search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={yearFilter}
            aria-label={t.allYears}
            onChange={(event) =>
              setYearFilter(event.target.value)
            }
          >
            <option value="all">{t.allYears}</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={courseFilter}
            aria-label={t.allCourses}
            onChange={(event) =>
              setCourseFilter(event.target.value)
            }
          >
            <option value="all">{t.allCourses}</option>
            {courseOptions.map(([id, title]) => (
              <option value={id} key={id}>
                {title}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t.certificate}</th>
                <th>{t.student}</th>
                <th>{t.course}</th>
                <th>{t.completed}</th>
                <th>{t.issued}</th>
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
              ) : filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    <strong>
                      {certificates.length === 0
                        ? t.empty
                        : t.noResults}
                    </strong>
                    <p>{t.emptyHint}</p>
                  </td>
                </tr>
              ) : (
                visibleCertificates.map((certificate) => (
                  <tr key={certificate.id}>
                    <td>
                      <div className={styles.certificateCell}>
                        <span className={styles.certificateIcon}>
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <rect
                              x="4"
                              y="3"
                              width="16"
                              height="18"
                              rx="2"
                            />
                            <path d="M8 8h8M8 12h8M9 16l3-1 3 1" />
                          </svg>
                        </span>
                        <div>
                          <strong>
                            {certificate.certificateNumber}
                          </strong>
                          <small>#{certificate.id}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className={styles.studentCell}>
                        <span className={styles.avatar}>
                          {certificate.studentName
                            .charAt(0)
                            .toUpperCase() || "S"}
                        </span>
                        <div>
                          <strong>
                            {certificate.studentName}
                          </strong>
                          <small>
                            {t.studentId} #{certificate.userId}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className={styles.courseCell}>
                        <strong>{certificate.courseTitle}</strong>
                        <small>
                          {t.courseId} #{certificate.courseId}
                        </small>
                      </div>
                    </td>

                    <td className={styles.dateCell}>
                      {formatDate(
                        certificate.courseCompletedAt,
                        locale
                      )}
                    </td>

                    <td className={styles.dateCell}>
                      {formatDate(certificate.issuedAt, locale)}
                    </td>

                    <td>
                      <span className={styles.statusBadge}>
                        <span aria-hidden="true" />
                        {t.issuedStatus}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className={styles.viewButton}
                        onClick={() =>
                          setDrawer({
                            kind: "details",
                            certificate,
                          })
                        }
                      >
                        {t.details}
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
            {t.showing}{" "}
            {loadError ? "—" : filteredCertificates.length}{" "}
            {t.of}{" "}
            {loadError ? "—" : certificates.length}
          </span>

          <div className={styles.pagination}>
            <button
              type="button"
              disabled={loading || currentPage === 1}
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

      {/* =================================
          Certificate verification
         ================================= */}

      <section
        className={styles.verificationSection}
        id="certificate-verification"
      >
        <div className={styles.verificationIntro}>
          <span className={styles.sectionNumber}>02 / VERIFY</span>
          <h3>{t.verifyTitle}</h3>
          <p>{t.verifySubtitle}</p>
        </div>

        <div className={styles.verificationContent}>
          <form
            className={styles.verificationForm}
            onSubmit={(event) => void handleVerify(event)}
          >
            <label htmlFor="verification-number">
              {t.certificateNumber}
            </label>

            <div className={styles.verificationInputRow}>
              <input
                id="verification-number"
                type="text"
                value={verificationCode}
                maxLength={100}
                placeholder={t.verifyPlaceholder}
                onChange={(event) => {
                  setVerificationCode(
                    event.target.value.toUpperCase()
                  );
                  setVerifyState("idle");
                  setVerified(null);
                  setVerifyError("");
                }}
              />

              <button
                type="submit"
                className={styles.primaryButton}
                disabled={verifyState === "loading"}
              >
                {verifyState === "loading"
                  ? t.verifying
                  : t.verifyButton}
              </button>
            </div>
          </form>

          {verifyState === "valid" && verified && (
            <div
              className={styles.verificationResult}
              role="status"
            >
              <div className={styles.verificationResultHeader}>
                <span className={styles.successSymbol}>✓</span>
                <div>
                  <strong>{t.valid}</strong>
                  <p>{t.validHint}</p>
                </div>
              </div>

              <dl className={styles.verificationDetails}>
                <div>
                  <dt>{t.certificateNumber}</dt>
                  <dd>{verified.certificateNumber}</dd>
                </div>
                <div>
                  <dt>{t.student}</dt>
                  <dd>{verified.studentName}</dd>
                </div>
                <div>
                  <dt>{t.course}</dt>
                  <dd>{verified.courseTitle}</dd>
                </div>
                <div>
                  <dt>{t.issuedOn}</dt>
                  <dd>
                    {formatDate(verified.issuedAt, locale)}
                  </dd>
                </div>
                <div>
                  <dt>{t.completedOn}</dt>
                  <dd>
                    {formatDate(
                      verified.courseCompletedAt,
                      locale
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {verifyState === "invalid" && (
            <div
              className={styles.verificationInvalid}
              role="status"
            >
              <strong>{t.invalid}</strong>
              <p>{t.invalidHint}</p>
            </div>
          )}

          {verifyState === "error" && (
            <div className={styles.errorMessage} role="alert">
              {verifyError || t.verifyError}
            </div>
          )}
        </div>
      </section>

      {/* =================================
          Side drawer: details / issue
         ================================= */}

      {drawer && (
        <div className={styles.panelOverlay}>
          <button
            className={styles.backdrop}
            type="button"
            aria-label={t.close}
            onClick={() => {
              if (!issuing) setDrawer(null);
            }}
          />

          <aside
            className={styles.detailPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="certificate-drawer-title"
          >
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  CRESTMARK / CERTIFICATES
                </span>
                <h2 id="certificate-drawer-title">
                  {drawer.kind === "details"
                    ? t.detailsTitle
                    : t.issueTitle}
                </h2>
                <p>
                  {drawer.kind === "details"
                    ? t.detailsHint
                    : t.issueSubtitle}
                </p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                disabled={issuing}
                aria-label={t.close}
                onClick={() => setDrawer(null)}
              >
                ×
              </button>
            </div>

            <div className={styles.panelBody}>
              {drawer.kind === "details" ? (
                <>
                  <div className={styles.detailHero}>
                    <div className={styles.detailHeroIcon}>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="8" r="5" />
                        <path d="m8 12-2 9 6-3 6 3-2-9" />
                      </svg>
                    </div>

                    <span className={styles.statusBadge}>
                      <span aria-hidden="true" />
                      {t.issuedStatus}
                    </span>

                    <strong>
                      {drawer.certificate.certificateNumber}
                    </strong>

                    <small>
                      {t.certificateId} #{drawer.certificate.id}
                    </small>
                  </div>

                  <div className={styles.detailGrid}>
                    <div className={styles.wideDetail}>
                      <span>{t.student}</span>
                      <strong>
                        {drawer.certificate.studentName}
                      </strong>
                    </div>

                    <div className={styles.wideDetail}>
                      <span>{t.course}</span>
                      <strong>
                        {drawer.certificate.courseTitle}
                      </strong>
                    </div>

                    <div>
                      <span>{t.studentId}</span>
                      <strong>
                        #{drawer.certificate.userId}
                      </strong>
                    </div>

                    <div>
                      <span>{t.courseId}</span>
                      <strong>
                        #{drawer.certificate.courseId}
                      </strong>
                    </div>

                    <div>
                      <span>{t.enrollmentId}</span>
                      <strong>
                        #{drawer.certificate.enrollmentId}
                      </strong>
                    </div>

                    <div>
                      <span>{t.certificateId}</span>
                      <strong>
                        #{drawer.certificate.id}
                      </strong>
                    </div>

                    <div>
                      <span>{t.completedOn}</span>
                      <strong>
                        {formatDate(
                          drawer.certificate.courseCompletedAt,
                          locale
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>{t.issuedOn}</span>
                      <strong>
                        {formatDate(
                          drawer.certificate.issuedAt,
                          locale
                        )}
                      </strong>
                    </div>
                  </div>

                  {!drawer.certificate.certificateUrl && (
                    <p className={styles.infoNote}>
                      {t.noCertificateLink}
                    </p>
                  )}

                  <p className={styles.infoNote}>
                    {t.recordNote}
                  </p>

                  <div className={styles.detailActions}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() =>
                        verifyFromDetails(drawer.certificate)
                      }
                    >
                      {t.verifySelected}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className={styles.issueNote}>
                    {t.issueNote}
                  </p>

                  {lookupWarning && (
                    <div className={styles.warningMessage}>
                      {t.lookupNote}
                    </div>
                  )}

                  {lookupError && (
                    <div
                      className={styles.errorMessage}
                      role="alert"
                    >
                      <span>{lookupError}</span>
                      <button
                        type="button"
                        onClick={() => void loadCandidates()}
                      >
                        {t.retry}
                      </button>
                    </div>
                  )}

                  <div className={styles.candidateHeader}>
                    <h3>{t.candidates}</h3>
                    <span>{candidates.length}</span>
                  </div>

                  <input
                    type="search"
                    className={styles.candidateSearch}
                    value={candidateSearch}
                    placeholder={t.findCandidates}
                    aria-label={t.findCandidates}
                    onChange={(event) =>
                      setCandidateSearch(event.target.value)
                    }
                  />

                  {lookupLoading ? (
                    <p className={styles.loadingCandidates}>
                      {t.loadingCandidates}
                    </p>
                  ) : lookupError ? null : candidates.length === 0 ? (
                    <div className={styles.emptyCandidates}>
                      <strong>{t.noCandidates}</strong>
                      <p>{t.noCandidatesHint}</p>
                    </div>
                  ) : (
                    <div className={styles.candidateList}>
                      {candidates.map((enrollment) => {
                        const student = studentsById.get(
                          enrollment.userId
                        );
                        const course = coursesById.get(
                          enrollment.courseId
                        );

                        const checked =
                          selectedEnrollmentId === enrollment.id;

                        return (
                          <label
                            key={enrollment.id}
                            className={`${styles.candidateItem} ${
                              checked
                                ? styles.candidateSelected
                                : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="certificate-enrollment"
                              value={enrollment.id}
                              checked={checked}
                              onChange={() =>
                                setSelectedEnrollmentId(
                                  enrollment.id
                                )
                              }
                            />

                            <div>
                              <strong>
                                {student?.name ||
                                  `User #${enrollment.userId}`}
                              </strong>
                              <span>
                                {course?.title ||
                                  `Course #${enrollment.courseId}`}
                              </span>
                              <small>
                                {t.enrollment} #{enrollment.id}
                                {" · "}
                                {formatDate(
                                  enrollment.completedAt,
                                  locale
                                )}
                              </small>
                            </div>

                            <span className={styles.candidateMark}>
                              {checked ? "✓" : ""}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {issueError && (
                    <div
                      className={styles.errorMessage}
                      role="alert"
                    >
                      {issueError}
                    </div>
                  )}

                  <div className={styles.issueActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={issuing}
                      onClick={() => setDrawer(null)}
                    >
                      {t.cancel}
                    </button>

                    <button
                      type="button"
                      className={styles.primaryButton}
                      disabled={
                        lookupLoading ||
                        !!lookupError ||
                        selectedEnrollmentId === null ||
                        issuing
                      }
                      onClick={() => {
                        setIssueError("");
                        setIssueConfirmOpen(true);
                      }}
                    >
                      {t.confirmIssue}
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* =================================
          Issue confirmation dialog
         ================================= */}

      {issueConfirmOpen && (
        <div className={styles.confirmOverlay}>
          <div
            className={styles.confirmDialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="issue-confirm-title"
            aria-describedby="issue-confirm-description"
          >
            <span className={styles.confirmIcon}>!</span>

            <h2 id="issue-confirm-title">
              {t.confirmationTitle}
            </h2>

            <p id="issue-confirm-description">
              {t.confirmationHint}
            </p>

            {selectedEnrollment && (
              <div className={styles.confirmEnrollment}>
                <span>{t.enrollment}</span>
                <strong>#{selectedEnrollment.id}</strong>
                <small>
                  {studentsById.get(
                    selectedEnrollment.userId
                  )?.name ||
                    `User #${selectedEnrollment.userId}`}
                </small>
                <small>
                  {coursesById.get(
                    selectedEnrollment.courseId
                  )?.title ||
                    `Course #${selectedEnrollment.courseId}`}
                </small>
              </div>
            )}

            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={issuing}
                onClick={() => setIssueConfirmOpen(false)}
              >
                {t.cancel}
              </button>

              <button
                type="button"
                className={styles.primaryButton}
                disabled={issuing || !selectedEnrollment}
                onClick={() => void handleIssue()}
              >
                {issuing ? t.processing : t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
