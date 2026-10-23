
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { authenticatedFetch } from "@/lib/auth-session";
import styles from "./page.module.css";

type Locale = "en" | "ar";
type StatusFilter = "all" | "active" | "completed";

type Course = {
  id: number;
  title: string;
};

type Student = {
  enrollmentId: number;
  studentId: number;
  studentName: string;
  enrolledAt: string;
  completedAt: string | null;
  status: string;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  lastActivityAt: string | null;
};

type CourseStudents = {
  courseId: number;
  courseTitle: string;
  totalLessons: number;
  studentsCount: number;
  students: Student[];
};

type StudentRow = Student & {
  courseId: number;
  courseTitle: string;
};

const translations = {
  en: {
    eyebrow: "LEARNER DIRECTORY",
    title: "My students",
    description:
      "Follow student enrollments and learning progress across your assigned courses.",
    refresh: "Refresh",
    refreshing: "Updating...",
    students: "Unique students",
    enrollments: "Total enrollments",
    courses: "Courses with students",
    avgProgress: "Average progress",
    allCourses: "All courses",
    all: "All enrollments",
    active: "Active",
    completed: "Completed",
    search: "Search students or courses...",
    student: "Student",
    course: "Course",
    status: "Status",
    lessons: "Lessons",
    progress: "Progress",
    enrolled: "Enrolled",
    action: "Details",
    view: "View progress",
    noStudents: "No students enrolled yet",
    noStudentsDescription:
      "Students will appear here when they enroll in your courses.",
    noMatches: "No matching students",
    noMatchesDescription: "Try changing your search or filters.",
    error: "Unable to load student data.",
    partial:
      "Some course data could not be loaded. Results are incomplete.",
    retry: "Try again",
    unavailable: "Unavailable",
    lastUpdated: "Last updated",
    of: "of",
    showing: "Showing",
    records: "enrollments",
  },
  ar: {
    eyebrow: "دليل الطلاب",
    title: "طلابي",
    description:
      "تابع تسجيلات الطلاب وتقدمهم عبر جميع الدورات المسندة إليك.",
    refresh: "تحديث",
    refreshing: "جارٍ التحديث...",
    students: "الطلاب الفريدون",
    enrollments: "إجمالي التسجيلات",
    courses: "دورات تضم طلابًا",
    avgProgress: "متوسط التقدم",
    allCourses: "جميع الدورات",
    all: "جميع التسجيلات",
    active: "نشط",
    completed: "مكتمل",
    search: "ابحث عن طالب أو دورة...",
    student: "الطالب",
    course: "الدورة",
    status: "الحالة",
    lessons: "الدروس",
    progress: "التقدم",
    enrolled: "تاريخ التسجيل",
    action: "التفاصيل",
    view: "عرض التقدم",
    noStudents: "لا يوجد طلاب مسجلون بعد",
    noStudentsDescription:
      "سيظهر الطلاب هنا عند تسجيلهم في الدورات المسندة إليك.",
    noMatches: "لا توجد نتائج مطابقة",
    noMatchesDescription: "جرّب تعديل البحث أو عوامل التصفية.",
    error: "تعذّر تحميل بيانات الطلاب.",
    partial:
      "تعذّر تحميل بعض الدورات. النتائج المعروضة غير مكتملة.",
    retry: "إعادة المحاولة",
    unavailable: "غير متاح",
    lastUpdated: "آخر تحديث",
    of: "من",
    showing: "عرض",
    records: "تسجيلات",
  },
} as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonnegativeInteger(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0;
}

function isCourse(value: unknown): value is Course {
  return isObject(value) &&
    nonnegativeInteger(value.id) &&
    value.id > 0 &&
    typeof value.title === "string";
}

function isStudent(value: unknown): value is Student {
  if (!isObject(value)) return false;

  return (
    nonnegativeInteger(value.enrollmentId) &&
    value.enrollmentId > 0 &&
    nonnegativeInteger(value.studentId) &&
    value.studentId > 0 &&
    typeof value.studentName === "string" &&
    typeof value.enrolledAt === "string" &&
    (value.completedAt === null || typeof value.completedAt === "string") &&
    typeof value.status === "string" &&
    nonnegativeInteger(value.completedLessons) &&
    nonnegativeInteger(value.totalLessons) &&
    typeof value.progressPercentage === "number" &&
    Number.isFinite(value.progressPercentage) &&
    value.progressPercentage >= 0 &&
    value.progressPercentage <= 100 &&
    (value.lastActivityAt === null ||
      typeof value.lastActivityAt === "string")
  );
}

function isCourseStudents(value: unknown): value is CourseStudents {
  return isObject(value) &&
    nonnegativeInteger(value.courseId) &&
    value.courseId > 0 &&
    typeof value.courseTitle === "string" &&
    nonnegativeInteger(value.totalLessons) &&
    nonnegativeInteger(value.studentsCount) &&
    Array.isArray(value.students) &&
    value.students.every(isStudent);
}

function formatDate(value: string, locale: Locale) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    { day: "numeric", month: "short", year: "numeric" }
  ).format(date);
}

export default function InstructorStudentsPage() {
  const params = useParams<{ locale: string }>();
  const locale: Locale = params.locale === "ar" ? "ar" : "en";
  const t = translations[locale];

  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [partial, setPartial] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");




  function refreshStudents() {
  setLoading(true);
  setError(false);
  setPartial(false);
  setRefreshIndex((previous) => previous + 1);
}
  useEffect(() => {
    const controller = new AbortController();

    async function load() {

      try {
        const courseResponse = await authenticatedFetch("/api/instructor/courses", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!courseResponse.ok) {
          throw new Error("Unable to load courses.");
        }

        const courseData: unknown = await courseResponse.json();

        if (!Array.isArray(courseData) || !courseData.every(isCourse)) {
          throw new Error("Invalid course data.");
        }

        const assignedCourses: Course[] = courseData;

        const results = await Promise.allSettled(
          assignedCourses.map(async (course) => {
            const response = await authenticatedFetch(
              `/api/instructor/courses/${course.id}/students`,
              {
                credentials: "same-origin",
                cache: "no-store",
                signal: controller.signal,
              }
            );

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const data: unknown = await response.json();

            if (!isCourseStudents(data) || data.courseId !== course.id) {
              throw new Error("Invalid students response.");
            }

            return data;
          })
        );

        if (controller.signal.aborted) return;

        const rows: StudentRow[] = [];
        let failed = false;

        results.forEach((result) => {
          if (result.status === "rejected") {
            failed = true;
            return;
          }

          const response = result.value;

          response.students.forEach((student) => {
            rows.push({
              ...student,
              courseId: response.courseId,
              courseTitle: response.courseTitle,
            });
          });
        });

        rows.sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));

        setCourses(assignedCourses);
        setStudents(rows);
        setPartial(failed);
        setLoaded(true);
        setUpdatedAt(new Date());
      } catch {
        if (!controller.signal.aborted) {
          setError(true);
          setLoaded(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [refreshIndex]);

  const number = (value: number) =>
    new Intl.NumberFormat(
      locale === "ar" ? "ar-JO" : "en-US"
    ).format(value);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        student.studentName.toLowerCase().includes(query) ||
        student.courseTitle.toLowerCase().includes(query);

      const matchesCourse =
        selectedCourse === "all" ||
        String(student.courseId) === selectedCourse;

      const state = student.status.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && state === "active") ||
        (statusFilter === "completed" && state === "completed");

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [students, search, selectedCourse, statusFilter]);

  const uniqueStudents = new Set(
    students.map((student) => student.studentId)
  ).size;

  const coursesWithStudents = new Set(
    students.map((student) => student.courseId)
  ).size;

  const averageProgress = students.length
    ? students.reduce(
        (total, student) => total + student.progressPercentage,
        0
      ) / students.length
    : 0;

  const metrics = [
    { label: t.students, value: number(uniqueStudents) },
    { label: t.enrollments, value: number(students.length) },
    { label: t.courses, value: number(coursesWithStudents) },
    { label: t.avgProgress, value: `${Math.round(averageProgress)}%` },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>{t.eyebrow}</span>
          <h2>{t.title}</h2>
          <p>{t.description}</p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          disabled={loading}
          onClick={refreshStudents}
        >
          <span aria-hidden="true">↻</span>
          {loading ? t.refreshing : t.refresh}
        </button>
      </header>

      {error && (
        <section className={styles.message} role="alert">
          <p>{t.error}</p>
          <button
            type="button"
            onClick={refreshStudents}
          >
            {t.retry}
          </button>
        </section>
      )}

      {partial && loaded && (
        <div className={styles.warning} role="alert">
          {t.partial}
          <button
            type="button"
            onClick={refreshStudents}
            disabled={loading}
          >
            {t.retry}
          </button>
        </div>
      )}

      {!loaded && loading && (
        <div className={styles.message} role="status">
          {t.refreshing}
        </div>
      )}

      {loaded && (
        <>
          <section className={styles.metrics} aria-label={t.title}>
            {metrics.map((metric, index) => (
              <div className={styles.metric} key={metric.label}>
                <div className={styles.metricTop}>
                  <span>{metric.label}</span>
                  <small>0{index + 1}</small>
                </div>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  {locale === "ar" ? "01 / قائمة الطلاب" : "01 / STUDENT RECORDS"}
                </span>
                <h3>{t.students}</h3>
              </div>

              <div className={styles.searchBox}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16 16 5 5" />
                </svg>
                <input
                  type="search"
                  placeholder={t.search}
                  aria-label={t.search}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className={styles.filters}>
              <select
                aria-label={t.allCourses}
                value={selectedCourse}
                onChange={(event) => setSelectedCourse(event.target.value)}
              >
                <option value="all">{t.allCourses}</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>

              <div className={styles.statusFilters}>
                {(
                  [
                    ["all", t.all],
                    ["active", t.active],
                    ["completed", t.completed],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={statusFilter === value}
                    className={`${styles.filterButton} ${
                      statusFilter === value ? styles.filterActive : ""
                    }`}
                    onClick={() => setStatusFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <p className={styles.resultCount}>
              {t.showing} {number(filtered.length)} {t.of}{" "}
              {number(students.length)} {t.records}
            </p>

            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptySymbol} aria-hidden="true">
                  ♧
                </div>
                <h4>{students.length === 0 ? t.noStudents : t.noMatches}</h4>
                <p>
                  {students.length === 0
                    ? t.noStudentsDescription
                    : t.noMatchesDescription}
                </p>
              </div>
            ) : (
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>{t.student}</th>
                      <th>{t.course}</th>
                      <th>{t.status}</th>
                      <th>{t.lessons}</th>
                      <th>{t.progress}</th>
                      <th>{t.enrolled}</th>
                      <th>{t.action}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((student) => {
                      const completed =
                        student.status.toLowerCase() === "completed";

                      return (
                        <tr key={`${student.courseId}-${student.enrollmentId}`}>
                          <td>
                            <div className={styles.studentIdentity}>
                              <span className={styles.avatar}>
                                {student.studentName.trim().charAt(0).toUpperCase() || "S"}
                              </span>
                              <div>
                                <strong>{student.studentName}</strong>
                                <small>#{student.studentId}</small>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className={styles.courseName}>
                              {student.courseTitle}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`${styles.status} ${
                                completed
                                  ? styles.statusCompleted
                                  : styles.statusActive
                              }`}
                            >
                              {completed
                                ? t.completed
                                : student.status.toLowerCase() === "active"
                                  ? t.active
                                  : student.status}
                            </span>
                          </td>

                          <td>
                            <span className={styles.lessonCount}>
                              {number(student.completedLessons)} {t.of}{" "}
                              {number(student.totalLessons)}
                            </span>
                          </td>

                          <td>
                            <div className={styles.progressCell}>
                              <strong>
                                {Math.round(student.progressPercentage)}%
                              </strong>
                              <div
                                className={styles.progressTrack}
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={student.progressPercentage}
                                aria-label={`${student.studentName}: ${t.progress}`}
                              >
                                <span
                                  style={{
                                    width: `${student.progressPercentage}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          <td>{formatDate(student.enrolledAt, locale)}</td>

                          <td>
                            <Link
                              href={`/${locale}/instructor/courses/${student.courseId}/students`}
                              className={styles.viewLink}
                            >
                              {t.view}
                              <span aria-hidden="true">↗</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {updatedAt && (
            <p className={styles.updated}>
              {t.lastUpdated}:{" "}
              {new Intl.DateTimeFormat(
                locale === "ar" ? "ar-JO" : "en-US",
                {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              ).format(updatedAt)}
            </p>
          )}
        </>
      )}
    </main>
  );
}
