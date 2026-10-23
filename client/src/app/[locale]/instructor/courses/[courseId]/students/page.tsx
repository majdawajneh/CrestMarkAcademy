
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

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

type StudentsResponse = {
  courseId: number;
  courseTitle: string;
  totalLessons: number;
  studentsCount: number;
  students: Student[];
};

type Filter = "all" | "inProgress" | "completed";

const copy = {
  en: {
    back: "Back to my courses",
    eyebrow: "LEARNER PROGRESS",
    title: "Course students",
    description: "Follow student activity and learning progress.",
    refresh: "Refresh",
    loading: "Loading students...",
    error: "Unable to load course students.",
    retry: "Try again",
    missing: "Course not found or access denied.",
    all: "All students",
    inProgress: "In progress",
    completed: "Completed",
    search: "Search by student name...",
    students: "Students",
    lessons: "Published lessons",
    average: "Average progress",
    completedLessons: "Completed lessons",
    progress: "Progress",
    enrolled: "Enrolled",
    activity: "Last activity",
    status: "Status",
    name: "Student",
    noActivity: "No activity yet",
    noStudents: "No students enrolled yet.",
    noResults: "No matching students.",
    noLessons: "No published lessons yet",
    noLessonsText:
      "Progress remains at 0% until published lessons are available.",
    updated: "Last updated",
    of: "of",
    unknown: "Unknown",
  },
  ar: {
    back: "العودة إلى دوراتي",
    eyebrow: "متابعة تقدم الطلاب",
    title: "طلاب الدورة",
    description: "تابع نشاط الطلاب ومدى تقدمهم في المحتوى التعليمي.",
    refresh: "تحديث",
    loading: "جارٍ تحميل الطلاب...",
    error: "تعذّر تحميل بيانات طلاب الدورة.",
    retry: "إعادة المحاولة",
    missing: "الدورة غير موجودة أو لا تملك صلاحية الوصول إليها.",
    all: "جميع الطلاب",
    inProgress: "قيد التعلم",
    completed: "مكتمل",
    search: "ابحث باسم الطالب...",
    students: "الطلاب",
    lessons: "الدروس المنشورة",
    average: "متوسط التقدم",
    completedLessons: "الدروس المكتملة",
    progress: "التقدم",
    enrolled: "تاريخ التسجيل",
    activity: "آخر نشاط",
    status: "الحالة",
    name: "الطالب",
    noActivity: "لا يوجد نشاط بعد",
    noStudents: "لا يوجد طلاب مسجلون في هذه الدورة بعد.",
    noResults: "لا توجد نتائج مطابقة.",
    noLessons: "لا توجد دروس منشورة بعد",
    noLessonsText:
      "ستبقى نسبة التقدم 0% حتى تتوفر دروس منشورة.",
    updated: "آخر تحديث",
    of: "من",
    unknown: "غير معروف",
  },
} as const;

function objectValue(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function validStudent(value: unknown): value is Student {
  if (!objectValue(value)) return false;

  return (
    validNonNegativeInteger(value.enrollmentId) &&
    value.enrollmentId > 0 &&
    validNonNegativeInteger(value.studentId) &&
    value.studentId > 0 &&
    typeof value.studentName === "string" &&
    validDate(value.enrolledAt) &&
    (value.completedAt === null || validDate(value.completedAt)) &&
    typeof value.status === "string" &&
    validNonNegativeInteger(value.completedLessons) &&
    validNonNegativeInteger(value.totalLessons) &&
    typeof value.progressPercentage === "number" &&
    Number.isFinite(value.progressPercentage) &&
    value.progressPercentage >= 0 &&
    value.progressPercentage <= 100 &&
    (value.lastActivityAt === null || validDate(value.lastActivityAt))
  );
}

function validResponse(value: unknown): value is StudentsResponse {
  if (!objectValue(value)) return false;

  return (
    validNonNegativeInteger(value.courseId) &&
    value.courseId > 0 &&
    typeof value.courseTitle === "string" &&
    validNonNegativeInteger(value.totalLessons) &&
    validNonNegativeInteger(value.studentsCount) &&
    Array.isArray(value.students) &&
    value.students.every(validStudent)
  );
}

export default function InstructorCourseStudentsPage() {
  const params = useParams<{ locale: string; courseId: string }>();
  const locale = params.locale === "ar" ? "ar" : "en";
  const t = copy[locale];

  const courseId = params.courseId;
  const validCourseId =
    /^[1-9]\d*$/.test(courseId) &&
    Number.isSafeInteger(Number(courseId));

  const [data, setData] = useState<StudentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"general" | "missing" | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      if (!validCourseId) {
        setData(null);
        setError("missing");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/instructor/courses/${encodeURIComponent(courseId)}/students`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (response.status === 403 || response.status === 404) {
          throw new Error("missing");
        }

        if (!response.ok) {
          throw new Error("general");
        }

        const result: unknown = await response.json();

        if (!validResponse(result) || result.courseId !== Number(courseId)) {
          throw new Error("general");
        }

        if (!controller.signal.aborted) {
          setData(result);
          setUpdatedAt(new Date());
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setData(null);
          setError(
            cause instanceof Error && cause.message === "missing"
              ? "missing"
              : "general"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [courseId, validCourseId, refreshIndex]);

  const number = (value: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-JO" : "en-US").format(value);

  const date = (value: string | null) => {
    if (!value) return t.noActivity;

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) return t.unknown;

    return new Intl.DateTimeFormat(
      locale === "ar" ? "ar-JO" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    ).format(parsed);
  };

  const students = data?.students ?? [];

  const averageProgress = students.length
    ? students.reduce(
        (sum, student) => sum + student.progressPercentage,
        0
      ) / students.length
    : 0;

  const completedCount = students.filter(
    (student) => student.status.toLowerCase() === "completed"
  ).length;

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return students
      .filter((student) => {
        const matchesName =
          student.studentName.toLocaleLowerCase().includes(query);

        const completed =
          student.status.toLowerCase() === "completed";

        const matchesFilter =
          filter === "all" ||
          (filter === "completed" && completed) ||
          (filter === "inProgress" && !completed);

        return matchesName && matchesFilter;
      })
      .sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));
  }, [students, search, filter]);

  return (
    <main className={styles.page}>
      <Link
        className={styles.backLink}
        href={`/${locale}/instructor/courses`}
      >
        <span aria-hidden="true">←</span>
        {t.back}
      </Link>

      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>{t.eyebrow}</span>
          <h2>{data?.courseTitle || t.title}</h2>
          <p>{t.description}</p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => setRefreshIndex((value) => value + 1)}
          disabled={loading}
        >
          <span aria-hidden="true">↻</span>
          {loading ? t.loading : t.refresh}
        </button>
      </header>

      {error && (
        <section className={styles.message} role="alert">
          <p>{error === "missing" ? t.missing : t.error}</p>
          {error === "general" && (
            <button
              type="button"
              onClick={() => setRefreshIndex((value) => value + 1)}
            >
              {t.retry}
            </button>
          )}
        </section>
      )}

      {loading && !data && !error && (
        <div className={styles.message} role="status">
          {t.loading}
        </div>
      )}

      {data && (
        <>
          <section className={styles.metrics} aria-label={t.title}>
            <div className={styles.metric}>
              <span>{t.students}</span>
              <strong>{number(data.studentsCount)}</strong>
              <small>{t.all}</small>
            </div>

            <div className={styles.metric}>
              <span>{t.lessons}</span>
              <strong>{number(data.totalLessons)}</strong>
              <small>{t.completedLessons}</small>
            </div>

            <div className={styles.metric}>
              <span>{t.average}</span>
              <strong>{Math.round(averageProgress)}%</strong>
              <small>{t.progress}</small>
            </div>

            <div className={styles.metric}>
              <span>{t.completed}</span>
              <strong>{number(completedCount)}</strong>
              <small>{t.students}</small>
            </div>
          </section>

          {data.totalLessons === 0 && (
            <div className={styles.notice}>
              <strong>{t.noLessons}</strong>
              <p>{t.noLessonsText}</p>
            </div>
          )}

          <section className={styles.studentsPanel}>
            <div className={styles.panelHeading}>
              <div>
                <span className={styles.eyebrow}>01 / STUDENTS</span>
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
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t.search}
                  aria-label={t.search}
                />
              </div>
            </div>

            <div className={styles.filters}>
              {(
                [
                  ["all", t.all, students.length],
                  [
                    "inProgress",
                    t.inProgress,
                    students.length - completedCount,
                  ],
                  ["completed", t.completed, completedCount],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.filterButton} ${
                    filter === value ? styles.filterActive : ""
                  }`}
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {label}
                  <span>{number(count)}</span>
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className={styles.empty}>
                {students.length === 0 ? t.noStudents : t.noResults}
              </div>
            ) : (
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>{t.name}</th>
                      <th>{t.status}</th>
                      <th>{t.completedLessons}</th>
                      <th>{t.progress}</th>
                      <th>{t.enrolled}</th>
                      <th>{t.activity}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((student) => {
                      const completed =
                        student.status.toLowerCase() === "completed";

                      return (
                        <tr key={student.enrollmentId}>
                          <td>
                            <div className={styles.studentCell}>
                              <span className={styles.avatar}>
                                {student.studentName
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase() || "S"}
                              </span>
                              <div>
                                <strong>{student.studentName}</strong>
                                <small>#{student.studentId}</small>
                              </div>
                            </div>
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
                                  ? t.inProgress
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
                                aria-valuenow={student.progressPercentage}
                                aria-valuemin={0}
                                aria-valuemax={100}
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
                          <td>{date(student.enrolledAt)}</td>
                          <td>{date(student.lastActivityAt)}</td>
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
              {t.updated}:{" "}
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
