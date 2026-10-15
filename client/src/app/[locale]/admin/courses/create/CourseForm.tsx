
"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./page.module.css";

type Category = {
  id: number;
  name: string;
};

type Instructor = {
  id: number;
  name: string;
  username: string;
};

type CourseOptions = {
  categories: Category[];
  instructors: Instructor[];
};

type CourseDetails = {
  id: number;
  categoryId: number;
  categoryName?: string;
  instructorId: number | null;
  instructorName?: string | null;
  title: string;
  shortDescription: string | null;
  description: string;
  thumbnailUrl: string | null;
  previewVideoUrl: string | null;
  price: number;
  discountPrice: number | null;
  language: string;
  level: string;
  status: string;
  isFeatured: boolean;
  hasCertificate: boolean;
  estimatedDurationHours: number | null;
};

type FormState = {
  categoryId: string;
  instructorId: string;
  title: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  previewVideoUrl: string;
  price: string;
  discountPrice: string;
  language: string;
  level: string;
  estimatedDurationHours: string;
  isFeatured: boolean;
  hasCertificate: boolean;
};

type CourseFormProps = {
  courseId?: number;
};

type LoadState =
  | "loading"
  | "ready"
  | "error"
  | "unauthorized"
  | "forbidden"
  | "not-found";

const initialForm: FormState = {
  categoryId: "",
  instructorId: "",
  title: "",
  shortDescription: "",
  description: "",
  thumbnailUrl: "",
  previewVideoUrl: "",
  price: "0",
  discountPrice: "",
  language: "English",
  level: "Beginner",
  estimatedDurationHours: "",
  isFeatured: false,
  hasCertificate: true,
};

const translations = {
  en: {
    back: "Back to courses",
    createEyebrow: "COURSE MANAGEMENT / NEW COURSE",
    editEyebrow: "COURSE MANAGEMENT / EDIT COURSE",
    createTitle: "Create a course",
    editTitle: "Edit course",
    createSubtitle:
      "Set up the foundation of a new learning experience.",
    editSubtitle:
      "Update course details and keep your catalog accurate.",
    basic: "Basic information",
    basicDesc: "The primary details students will see.",
    courseTitle: "Course title",
    titlePlaceholder: "e.g. Complete ASP.NET Core Development",
    shortDescription: "Short description",
    shortPlaceholder: "Describe the course in one or two sentences",
    description: "Full description",
    descriptionPlaceholder: "What will students learn in this course?",
    classification: "Classification & instructor",
    classificationDesc:
      "Organize the course and assign an instructor.",
    category: "Category",
    selectCategory: "Select a category",
    instructor: "Instructor",
    noInstructor: "No instructor assigned",
    instructorHint: "Optional. You can assign an instructor later.",
    unavailableInstructor: "Current instructor (not available)",
    unavailableCategory: "Current category (inactive)",
    language: "Language",
    level: "Difficulty level",
    media: "Course media",
    mediaDesc: "Add the cover image and introductory video.",
    thumbnail: "Thumbnail URL",
    preview: "Preview video URL",
    mediaHint: "Use publicly accessible HTTPS links.",
    pricing: "Pricing & duration",
    pricingDesc: "Configure course pricing and estimated length.",
    price: "Regular price (USD)",
    discountPrice: "Discounted price (USD)",
    duration: "Estimated duration (hours)",
    optional: "Optional",
    settings: "Course settings",
    settingsDesc:
      "Configure featured placement and certification.",
    featured: "Featured course",
    featuredDesc: "Mark this course for featured placement.",
    certificate: "Certificate of completion",
    certificateDesc: "Allow students to earn a completion certificate.",
    create: "Create course",
    creating: "Creating course...",
    save: "Save changes",
    saving: "Saving changes...",
    cancel: "Cancel",
    loading: "Loading course information...",
    noCategories: "No active categories are available.",
    loadError: "Unable to load the course information.",
    retry: "Try again",
    session: "Your session has expired. Please log in.",
    forbidden: "Administrator access is required.",
    notFound: "This course could not be found.",
    login: "Log in",
    titleError:
      "The course title must be between 3 and 200 characters.",
    descriptionError: "Please enter a course description.",
    categoryError: "Please select a valid category.",
    instructorError: "Please select a valid instructor.",
    priceError: "Enter a valid, non-negative price.",
    discountError:
      "The discounted price cannot exceed the regular price.",
    durationError: "Enter a valid whole number of hours.",
    urlError: "Enter a valid HTTPS URL or leave it empty.",
    saveError: "Unable to save the course.",
    unknownError: "An unexpected error occurred. Please try again.",
    validationError: "Please review the entered information.",
    english: "English",
    arabic: "Arabic",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    courseStatus: "Current status",
  },
  ar: {
    back: "العودة إلى الدورات",
    createEyebrow: "إدارة الدورات / دورة جديدة",
    editEyebrow: "إدارة الدورات / تعديل دورة",
    createTitle: "إنشاء دورة جديدة",
    editTitle: "تعديل الدورة",
    createSubtitle: "جهّز المعلومات الأساسية لدورة تعليمية جديدة.",
    editSubtitle: "حدّث معلومات الدورة واحفظ التعديلات.",
    basic: "المعلومات الأساسية",
    basicDesc: "المعلومات الرئيسية التي سيشاهدها الطلاب.",
    courseTitle: "عنوان الدورة",
    titlePlaceholder: "مثال: احتراف تطوير ASP.NET Core",
    shortDescription: "الوصف المختصر",
    shortPlaceholder: "صف الدورة بجملة أو جملتين",
    description: "الوصف الكامل",
    descriptionPlaceholder: "ما الذي سيتعلمه الطلاب في هذه الدورة؟",
    classification: "التصنيف والمدرّس",
    classificationDesc: "حدّد تصنيف الدورة والمدرّس المسؤول عنها.",
    category: "التصنيف",
    selectCategory: "اختر التصنيف",
    instructor: "المدرّس",
    noInstructor: "بدون مدرّس",
    instructorHint: "اختياري. يمكنك تعيين مدرّس لاحقًا.",
    unavailableInstructor: "المدرّس الحالي (غير متاح)",
    unavailableCategory: "التصنيف الحالي (غير مفعّل)",
    language: "لغة الدورة",
    level: "مستوى الدورة",
    media: "وسائط الدورة",
    mediaDesc: "أضف رابط الصورة والفيديو التعريفي.",
    thumbnail: "رابط صورة الدورة",
    preview: "رابط الفيديو التعريفي",
    mediaHint: "استخدم روابط HTTPS يمكن الوصول إليها.",
    pricing: "السعر والمدة",
    pricingDesc: "حدّد سعر الدورة ومدتها التقديرية.",
    price: "السعر الأساسي (دولار)",
    discountPrice: "السعر بعد الخصم (دولار)",
    duration: "المدة التقديرية (بالساعات)",
    optional: "اختياري",
    settings: "إعدادات الدورة",
    settingsDesc: "إعدادات التمييز ومنح الشهادات.",
    featured: "دورة مميزة",
    featuredDesc: "تمييز هذه الدورة ضمن الدورات المختارة.",
    certificate: "شهادة إتمام",
    certificateDesc: "السماح بمنح شهادة عند إتمام الدورة.",
    create: "إنشاء الدورة",
    creating: "جارٍ إنشاء الدورة...",
    save: "حفظ التعديلات",
    saving: "جارٍ حفظ التعديلات...",
    cancel: "إلغاء",
    loading: "جارٍ تحميل معلومات الدورة...",
    noCategories: "لا توجد تصنيفات مفعّلة حاليًا.",
    loadError: "تعذّر تحميل معلومات الدورة.",
    retry: "إعادة المحاولة",
    session: "انتهت صلاحية الجلسة. سجّل الدخول من جديد.",
    forbidden: "هذه العملية تتطلب صلاحية المسؤول.",
    notFound: "الدورة المطلوبة غير موجودة.",
    login: "تسجيل الدخول",
    titleError: "يجب أن يكون عنوان الدورة بين 3 و200 حرف.",
    descriptionError: "يرجى إدخال الوصف الكامل للدورة.",
    categoryError: "يرجى اختيار تصنيف صحيح.",
    instructorError: "يرجى اختيار مدرّس صحيح.",
    priceError: "يرجى إدخال سعر صحيح غير سالب.",
    discountError: "لا يجوز أن يتجاوز سعر الخصم السعر الأساسي.",
    durationError: "أدخل عدد ساعات صحيحًا.",
    urlError: "استخدم رابط HTTPS صالحًا أو اتركه فارغًا.",
    saveError: "تعذّر حفظ بيانات الدورة.",
    unknownError: "حدث خطأ غير متوقع. حاول مرة أخرى.",
    validationError: "يرجى مراجعة المعلومات المدخلة.",
    english: "الإنجليزية",
    arabic: "العربية",
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
    courseStatus: "حالة الدورة الحالية",
  },
} as const;

function optionalText(value: string): string | null {
  return value.trim() || null;
}

function isHttpsUrl(value: string): boolean {
  if (!value.trim()) return true;

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function parseError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;

  const result = data as {
    message?: unknown;
    detail?: unknown;
    title?: unknown;
    errors?: Record<string, unknown>;
  };

  if (result.errors && typeof result.errors === "object") {
    const messages = Object.values(result.errors)
      .flatMap((value) => (Array.isArray(value) ? value : []))
      .filter((value): value is string => typeof value === "string");

    if (messages.length) {
      return messages.slice(0, 4).join(" ");
    }
  }

  if (typeof result.detail === "string" && result.detail) {
    return result.detail;
  }

  if (typeof result.message === "string" && result.message) {
    return result.message;
  }

  if (typeof result.title === "string" && result.title) {
    return result.title;
  }

  return fallback;
}

function isOptions(value: unknown): value is CourseOptions {
  if (!value || typeof value !== "object") return false;

  const data = value as Record<string, unknown>;

  return (
    Array.isArray(data.categories) &&
    data.categories.every(
      (item: unknown) =>
        item !== null &&
        typeof item === "object" &&
        Number.isSafeInteger((item as Category).id) &&
        typeof (item as Category).name === "string"
    ) &&
    Array.isArray(data.instructors) &&
    data.instructors.every(
      (item: unknown) =>
        item !== null &&
        typeof item === "object" &&
        Number.isSafeInteger((item as Instructor).id) &&
        typeof (item as Instructor).name === "string" &&
        typeof (item as Instructor).username === "string"
    )
  );
}

function isCourseDetails(value: unknown): value is CourseDetails {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    Number.isSafeInteger(item.id) &&
    Number.isSafeInteger(item.categoryId) &&
    (
      item.instructorId === null ||
      Number.isSafeInteger(item.instructorId)
    ) &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    (
      item.shortDescription === null ||
      typeof item.shortDescription === "string"
    ) &&
    (
      item.thumbnailUrl === null ||
      typeof item.thumbnailUrl === "string"
    ) &&
    (
      item.previewVideoUrl === null ||
      typeof item.previewVideoUrl === "string"
    ) &&
    typeof item.language === "string" &&
    typeof item.level === "string" &&
    typeof item.status === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    (
      item.discountPrice === null ||
      (
        typeof item.discountPrice === "number" &&
        Number.isFinite(item.discountPrice)
      )
    ) &&
    typeof item.isFeatured === "boolean" &&
    typeof item.hasCertificate === "boolean" &&
    (
      item.estimatedDurationHours === null ||
      Number.isSafeInteger(item.estimatedDurationHours)
    )
  );
}

function mapCourseToForm(course: CourseDetails): FormState {
  return {
    categoryId: String(course.categoryId),
    instructorId:
      course.instructorId === null
        ? ""
        : String(course.instructorId),
    title: course.title,
    shortDescription: course.shortDescription ?? "",
    description: course.description,
    thumbnailUrl: course.thumbnailUrl ?? "",
    previewVideoUrl: course.previewVideoUrl ?? "",
    price: String(course.price),
    discountPrice:
      course.discountPrice === null
        ? ""
        : String(course.discountPrice),
    language: course.language,
    level: course.level,
    estimatedDurationHours:
      course.estimatedDurationHours === null
        ? ""
        : String(course.estimatedDurationHours),
    isFeatured: course.isFeatured,
    hasCertificate: course.hasCertificate,
  };
}

export default function CourseForm({
  courseId,
}: CourseFormProps) {
  const isEdit = courseId !== undefined;

  const params = useParams<{ locale: string }>();
  const locale = params.locale === "ar" ? "ar" : "en";
  const t = translations[locale];
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialForm);
  const [options, setOptions] = useState<CourseOptions>({
    categories: [],
    instructors: [],
  });

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const coursesUrl = `/${locale}/admin/courses`;

  const change = (
    field: keyof FormState,
    value: string | boolean
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
  };

  const authorizedFetch = useCallback(
    async (
      url: string,
      init?: RequestInit
    ): Promise<Response> => {
      const send = () =>
        fetch(url, {
          ...init,
          credentials: "same-origin",
          cache: "no-store",
        });

      let response = await send();

      if (response.status !== 401) {
        return response;
      }

      const session = await getCurrentSession();

      if (session.status !== "authenticated") {
        return response;
      }

      if (!session.user.roles.includes("Admin")) {
        throw new Error("FORBIDDEN");
      }

      response = await send();

      return response;
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const optionsResponse = await authorizedFetch(
          "/api/admin/course-options"
        );

        if (cancelled) return;

        if (optionsResponse.status === 401) {
          setLoadState("unauthorized");
          return;
        }

        if (optionsResponse.status === 403) {
          setLoadState("forbidden");
          return;
        }

        if (!optionsResponse.ok) {
          throw new Error("OPTIONS");
        }

        const optionsData: unknown =
          await optionsResponse.json();

        if (!isOptions(optionsData)) {
          throw new Error("INVALID_OPTIONS");
        }

        let courseData: CourseDetails | null = null;

        if (isEdit) {
          const courseResponse = await authorizedFetch(
            `/api/admin/courses/${courseId}`
          );

          if (cancelled) return;

          if (courseResponse.status === 401) {
            setLoadState("unauthorized");
            return;
          }

          if (courseResponse.status === 403) {
            setLoadState("forbidden");
            return;
          }

          if (courseResponse.status === 404) {
            setLoadState("not-found");
            return;
          }

          if (!courseResponse.ok) {
            throw new Error("COURSE");
          }

          const raw: unknown = await courseResponse.json();

          if (!isCourseDetails(raw)) {
            throw new Error("INVALID_COURSE");
          }

          if (raw.id !== courseId) {
            throw new Error("COURSE_ID_MISMATCH");
          }

          courseData = raw;
        }

        if (cancelled) return;

        setOptions(optionsData);
        setCourse(courseData);

        if (courseData) {
          setForm(mapCourseToForm(courseData));
        } else {
          setForm({ ...initialForm });
        }

        setLoadState("ready");
      } catch (err) {
        if (cancelled) return;

        setLoadState(
          err instanceof Error && err.message === "FORBIDDEN"
            ? "forbidden"
            : "error"
        );
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [authorizedFetch, reload, isEdit, courseId]);

  const hasCurrentCategory =
    !!course &&
    options.categories.some(
      (item) => item.id === course.categoryId
    );

  const hasCurrentInstructor =
    !!course?.instructorId &&
    options.instructors.some(
      (item) => item.id === course.instructorId
    );

  function validate(): string | null {
    if (
      form.title.trim().length < 3 ||
      form.title.length > 200
    ) {
      return t.titleError;
    }

    if (!form.description.trim()) {
      return t.descriptionError;
    }

    const categoryId = Number(form.categoryId);

    const categoryIsActive = options.categories.some(
      (item) => item.id === categoryId
    );

    const isOriginalCategory =
      isEdit &&
      course !== null &&
      categoryId === course.categoryId;

    if (
      !Number.isSafeInteger(categoryId) ||
      categoryId <= 0 ||
      (!categoryIsActive && !isOriginalCategory)
    ) {
      return t.categoryError;
    }

    if (form.instructorId) {
      const instructorId = Number(form.instructorId);

      const isActiveInstructor = options.instructors.some(
        (item) => item.id === instructorId
      );

      const isOriginalInstructor =
        isEdit &&
        course !== null &&
        instructorId === course.instructorId;

      if (
        !Number.isSafeInteger(instructorId) ||
        instructorId <= 0 ||
        (!isActiveInstructor && !isOriginalInstructor)
      ) {
        return t.instructorError;
      }
    }

    const price = Number(form.price);

    if (
      !form.price.trim() ||
      !Number.isFinite(price) ||
      price < 0 ||
      Math.round(price * 100) !== price * 100
    ) {
      return t.priceError;
    }

    if (form.discountPrice.trim()) {
      const discount = Number(form.discountPrice);

      if (
        !Number.isFinite(discount) ||
        discount < 0 ||
        discount > price ||
        Math.round(discount * 100) !== discount * 100
      ) {
        return t.discountError;
      }
    }

    if (form.estimatedDurationHours.trim()) {
      const hours = Number(form.estimatedDurationHours);

      if (
        !Number.isSafeInteger(hours) ||
        hours < 0 ||
        hours > 2147483647
      ) {
        return t.durationError;
      }
    }

    if (
      !isHttpsUrl(form.thumbnailUrl) ||
      !isHttpsUrl(form.previewVideoUrl)
    ) {
      return t.urlError;
    }

    if (
      form.shortDescription.length > 500 ||
      form.thumbnailUrl.length > 500 ||
      form.previewVideoUrl.length > 500 ||
      form.language.trim().length === 0 ||
      form.language.length > 50 ||
      form.level.trim().length === 0 ||
      form.level.length > 50
    ) {
      return t.validationError;
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving || loadState !== "ready") return;

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      categoryId: Number(form.categoryId),
      instructorId: form.instructorId
        ? Number(form.instructorId)
        : null,
      title: form.title.trim(),
      shortDescription: optionalText(form.shortDescription),
      description: form.description.trim(),
      thumbnailUrl: optionalText(form.thumbnailUrl),
      previewVideoUrl: optionalText(form.previewVideoUrl),
      price: Number(form.price),
      discountPrice: form.discountPrice.trim()
        ? Number(form.discountPrice)
        : null,
      language: form.language.trim(),
      level: form.level.trim(),
      isFeatured: form.isFeatured,
      hasCertificate: form.hasCertificate,
      estimatedDurationHours:
        form.estimatedDurationHours.trim()
          ? Number(form.estimatedDurationHours)
          : null,
    };

    setSaving(true);
    setError("");

    try {
      const url = isEdit
        ? `/api/admin/courses/${courseId}`
        : "/api/admin/courses";

      const response = await authorizedFetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        setError(t.session);
        return;
      }

      if (response.status === 403) {
        setError(t.forbidden);
        return;
      }

      if (!response.ok) {
        const responseData: unknown = await response
          .json()
          .catch(() => null);

        setError(parseError(responseData, t.saveError));
        return;
      }

      router.push(coursesUrl);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error && err.message === "FORBIDDEN"
          ? t.forbidden
          : t.unknownError
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadState !== "ready") {
    return (
      <main
        className={styles.page}
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        <Link
          href={coursesUrl}
          className={styles.backLink}
        >
          {locale === "ar" ? "→" : "←"} {t.back}
        </Link>

        <div className={styles.statePanel} role="status">
          {loadState === "loading" ? (
            <p>{t.loading}</p>
          ) : (
            <>
              <p>
                {loadState === "unauthorized"
                  ? t.session
                  : loadState === "forbidden"
                    ? t.forbidden
                    : loadState === "not-found"
                      ? t.notFound
                      : t.loadError}
              </p>

              {loadState === "unauthorized" ? (
                <Link
                  href={`/${locale}/login`}
                  className={styles.primaryButton}
                >
                  {t.login}
                </Link>
              ) : loadState === "error" ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    setLoadState("loading");
                    setReload((value) => value + 1);
                  }}
                >
                  {t.retry}
                </button>
              ) : null}
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <Link
        href={coursesUrl}
        className={styles.backLink}
      >
        <span aria-hidden="true">
          {locale === "ar" ? "→" : "←"}
        </span>
        {t.back}
      </Link>

      <div className={styles.heading}>
        <span className={styles.eyebrow}>
          {isEdit ? t.editEyebrow : t.createEyebrow}
        </span>

        <h1>
          {isEdit ? t.editTitle : t.createTitle}
        </h1>

        <p>
          {isEdit ? t.editSubtitle : t.createSubtitle}
        </p>

        {isEdit && course && (
          <p>
            #{course.id} · {t.courseStatus}:{" "}
            <strong>{course.status}</strong>
          </p>
        )}
      </div>

      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        {/* 01 - Basic Information */}

        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div className={styles.sectionNumber}>01</div>
            <div>
              <h2>{t.basic}</h2>
              <p>{t.basicDesc}</p>
            </div>
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor="courseTitle">
                {t.courseTitle}{" "}
                <span className={styles.required}>*</span>
              </label>

              <input
                id="courseTitle"
                value={form.title}
                onChange={(event) =>
                  change("title", event.target.value)
                }
                placeholder={t.titlePlaceholder}
                minLength={3}
                maxLength={200}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="shortDescription">
                {t.shortDescription}
              </label>

              <textarea
                id="shortDescription"
                rows={2}
                maxLength={500}
                value={form.shortDescription}
                onChange={(event) =>
                  change(
                    "shortDescription",
                    event.target.value
                  )
                }
                placeholder={t.shortPlaceholder}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="description">
                {t.description}{" "}
                <span className={styles.required}>*</span>
              </label>

              <textarea
                id="description"
                rows={6}
                required
                value={form.description}
                onChange={(event) =>
                  change("description", event.target.value)
                }
                placeholder={t.descriptionPlaceholder}
              />
            </div>
          </div>
        </section>

        {/* 02 - Classification */}

        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div className={styles.sectionNumber}>02</div>
            <div>
              <h2>{t.classification}</h2>
              <p>{t.classificationDesc}</p>
            </div>
          </div>

          <div className={styles.twoColumns}>
            <div className={styles.field}>
              <label htmlFor="category">
                {t.category}{" "}
                <span className={styles.required}>*</span>
              </label>

              <select
                id="category"
                value={form.categoryId}
                onChange={(event) =>
                  change("categoryId", event.target.value)
                }
                required
              >
                <option value="">
                  {t.selectCategory}
                </option>

                {isEdit &&
                  course &&
                  !hasCurrentCategory && (
                    <option value={course.categoryId}>
                      {course.categoryName ||
                        `#${course.categoryId}`}{" "}
                      — {t.unavailableCategory}
                    </option>
                  )}

                {options.categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              {options.categories.length === 0 && (
                <small>{t.noCategories}</small>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="instructor">
                {t.instructor}
              </label>

              <select
                id="instructor"
                value={form.instructorId}
                onChange={(event) =>
                  change("instructorId", event.target.value)
                }
              >
                <option value="">
                  {t.noInstructor}
                </option>

                {isEdit &&
                  course?.instructorId != null &&
                  !hasCurrentInstructor && (
                    <option value={course.instructorId}>
                      {course.instructorName ||
                        `#${course.instructorId}`}{" "}
                      — {t.unavailableInstructor}
                    </option>
                  )}

                {options.instructors.map((instructor) => (
                  <option
                    key={instructor.id}
                    value={instructor.id}
                  >
                    {instructor.name} (@{instructor.username})
                  </option>
                ))}
              </select>

              <small>{t.instructorHint}</small>
            </div>

            <div className={styles.field}>
              <label htmlFor="language">
                {t.language}
              </label>

              <select
                id="language"
                value={form.language}
                onChange={(event) =>
                  change("language", event.target.value)
                }
              >
                {form.language !== "English" &&
                  form.language !== "Arabic" && (
                    <option value={form.language}>
                      {form.language}
                    </option>
                  )}

                <option value="English">
                  {t.english}
                </option>

                <option value="Arabic">
                  {t.arabic}
                </option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="level">
                {t.level}
              </label>

              <select
                id="level"
                value={form.level}
                onChange={(event) =>
                  change("level", event.target.value)
                }
              >
                {!["Beginner", "Intermediate", "Advanced"].includes(
                  form.level
                ) && (
                  <option value={form.level}>
                    {form.level}
                  </option>
                )}

                <option value="Beginner">
                  {t.beginner}
                </option>

                <option value="Intermediate">
                  {t.intermediate}
                </option>

                <option value="Advanced">
                  {t.advanced}
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* 03 - Course Media */}

        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div className={styles.sectionNumber}>03</div>
            <div>
              <h2>{t.media}</h2>
              <p>{t.mediaDesc}</p>
            </div>
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor="thumbnail">
                {t.thumbnail}{" "}
                <span className={styles.optional}>
                  ({t.optional})
                </span>
              </label>

              <input
                id="thumbnail"
                type="url"
                placeholder="https://example.com/course-image.jpg"
                value={form.thumbnailUrl}
                maxLength={500}
                onChange={(event) =>
                  change("thumbnailUrl", event.target.value)
                }
                dir="ltr"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="preview">
                {t.preview}{" "}
                <span className={styles.optional}>
                  ({t.optional})
                </span>
              </label>

              <input
                id="preview"
                type="url"
                placeholder="https://example.com/preview-video"
                value={form.previewVideoUrl}
                maxLength={500}
                onChange={(event) =>
                  change(
                    "previewVideoUrl",
                    event.target.value
                  )
                }
                dir="ltr"
              />
            </div>

            <p className={styles.hint}>
              {t.mediaHint}
            </p>
          </div>
        </section>

        {/* 04 - Pricing */}

        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div className={styles.sectionNumber}>04</div>
            <div>
              <h2>{t.pricing}</h2>
              <p>{t.pricingDesc}</p>
            </div>
          </div>

          <div className={styles.threeColumns}>
            <div className={styles.field}>
              <label htmlFor="price">
                {t.price}
              </label>

              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={(event) =>
                  change("price", event.target.value)
                }
                dir="ltr"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="discount">
                {t.discountPrice}
              </label>

              <input
                id="discount"
                type="number"
                min="0"
                step="0.01"
                value={form.discountPrice}
                onChange={(event) =>
                  change(
                    "discountPrice",
                    event.target.value
                  )
                }
                placeholder={t.optional}
                dir="ltr"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="duration">
                {t.duration}
              </label>

              <input
                id="duration"
                type="number"
                min="0"
                max="2147483647"
                step="1"
                value={form.estimatedDurationHours}
                onChange={(event) =>
                  change(
                    "estimatedDurationHours",
                    event.target.value
                  )
                }
                placeholder={t.optional}
                dir="ltr"
              />
            </div>
          </div>
        </section>

        {/* 05 - Settings */}

        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div className={styles.sectionNumber}>05</div>
            <div>
              <h2>{t.settings}</h2>
              <p>{t.settingsDesc}</p>
            </div>
          </div>

          <div className={styles.settingsList}>
            <label className={styles.setting}>
              <span>
                <strong>{t.featured}</strong>
                <small>{t.featuredDesc}</small>
              </span>

              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) =>
                  change(
                    "isFeatured",
                    event.target.checked
                  )
                }
              />
            </label>

            <label className={styles.setting}>
              <span>
                <strong>{t.certificate}</strong>
                <small>{t.certificateDesc}</small>
              </span>

              <input
                type="checkbox"
                checked={form.hasCertificate}
                onChange={(event) =>
                  change(
                    "hasCertificate",
                    event.target.checked
                  )
                }
              />
            </label>
          </div>
        </section>

        {error && (
          <div
            className={styles.errorBox}
            role="alert"
          >
            {error}
          </div>
        )}

        <div className={styles.actions}>
          <Link
            href={coursesUrl}
            className={styles.cancelButton}
          >
            {t.cancel}
          </Link>

          <button
            type="submit"
            className={styles.primaryButton}
            disabled={
              saving ||
              (
                options.categories.length === 0 &&
                !hasCurrentCategory
              )
            }
          >
            {saving
              ? isEdit
                ? t.saving
                : t.creating
              : isEdit
                ? t.save
                : t.create}
          </button>
        </div>
      </form>
    </main>
  );
}
