
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./page.module.css";

type Locale = "en" | "ar";
type Status = "loading" | "ready" | "guest" | "error";

type Profile = {
  userId: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  emailConfirmed: boolean;
  profileImageUrl: string | null;
  bio: string | null;
  phoneNumber: string | null;
  country: string | null;
  dateOfBirth: string | null;
  createdAt: string;
};

type ProfileForm = {
  firstName: string;
  lastName: string;
  bio: string;
  phoneNumber: string;
  country: string;
  dateOfBirth: string;
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const copy = {
  en: {
    home: "Home",
    dashboard: "Dashboard",
    pageName: "My Profile",
    eyebrow: "ACCOUNT & PERSONAL DETAILS",
    title: "Your profile,",
    titleAccent: "your identity.",
    subtitle:
      "Keep your details up to date and make your CrestMark learning experience your own.",

    account: "Account overview",
    memberSince: "Member since",
    username: "Username",
    email: "Email address",
    verified: "Verified",
    unverified: "Not verified",
    readOnly: "Username and email cannot be edited here.",

    photoTitle: "Profile photo",
    choosePhoto: "Choose a photo",
    uploadPhoto: "Upload photo",
    uploadingPhoto: "Uploading...",
    removePhoto: "Remove photo",
    removingPhoto: "Removing...",
    cancelPhoto: "Cancel",
    photoHint: "JPG, PNG or WebP · Maximum 2MB",
    photoTypeError: "Choose a JPG, PNG or WebP image.",
    photoSizeError: "The photo must be no larger than 2MB.",
    photoUploadError: "Couldn't upload your photo. Try again.",
    photoRemoveError: "Couldn't remove your photo. Try again.",
    photoUploadSuccess: "Profile photo updated successfully.",
    photoRemoveSuccess: "Profile photo removed successfully.",
    confirmRemove: "Remove your current profile photo?",

    personal: "Personal information",
    personalText:
      "Update the information associated with your account.",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone number",
    country: "Country",
    dateOfBirth: "Date of birth",
    bio: "About me",
    bioPlaceholder: "Tell us a little about yourself...",
    characters: "characters",
    optional: "Optional",

    save: "Save changes",
    saving: "Saving...",
    reset: "Discard changes",
    success: "Your profile has been updated.",
    error: "We couldn't load your profile.",
    saveError: "We couldn't save your changes. Please try again.",
    namesError:
      "Each name must be between 2 and 100 characters.",
    dateError:
      "Enter a valid date that is not in the future.",

    loading: "Loading your profile...",
    guest: "Sign in to manage your profile.",
    login: "Sign in",
    retry: "Try again",
  },

  ar: {
    home: "الرئيسية",
    dashboard: "لوحة التحكم",
    pageName: "ملفي الشخصي",
    eyebrow: "الحساب والمعلومات الشخصية",
    title: "ملفك الشخصي،",
    titleAccent: "هويتك على CrestMark.",
    subtitle:
      "حافظ على تحديث معلوماتك وخلّي تجربتك التعليمية مناسبة إلك.",

    account: "معلومات الحساب",
    memberSince: "عضو منذ",
    username: "اسم المستخدم",
    email: "البريد الإلكتروني",
    verified: "موثّق",
    unverified: "غير موثّق",
    readOnly:
      "لا يمكن تعديل اسم المستخدم أو البريد الإلكتروني من هنا.",

    photoTitle: "الصورة الشخصية",
    choosePhoto: "اختيار صورة",
    uploadPhoto: "رفع الصورة",
    uploadingPhoto: "جارٍ الرفع...",
    removePhoto: "حذف الصورة",
    removingPhoto: "جارٍ الحذف...",
    cancelPhoto: "إلغاء",
    photoHint: "JPG أو PNG أو WebP · الحد الأقصى 2MB",
    photoTypeError:
      "اختار صورة بصيغة JPG أو PNG أو WebP.",
    photoSizeError:
      "حجم الصورة يجب ألا يتجاوز 2MB.",
    photoUploadError:
      "تعذّر رفع الصورة. حاول مرة أخرى.",
    photoRemoveError:
      "تعذّر حذف الصورة. حاول مرة أخرى.",
    photoUploadSuccess:
      "تم تحديث الصورة الشخصية بنجاح.",
    photoRemoveSuccess:
      "تم حذف الصورة الشخصية بنجاح.",
    confirmRemove:
      "هل أنت متأكد من حذف صورتك الشخصية؟",

    personal: "المعلومات الشخصية",
    personalText:
      "عدّل المعلومات المرتبطة بحسابك بكل سهولة.",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    phone: "رقم الهاتف",
    country: "الدولة",
    dateOfBirth: "تاريخ الميلاد",
    bio: "نبذة عني",
    bioPlaceholder:
      "اكتب نبذة بسيطة عن نفسك...",
    characters: "حرف",
    optional: "اختياري",

    save: "حفظ التغييرات",
    saving: "جارٍ الحفظ...",
    reset: "إلغاء التغييرات",
    success: "تم تحديث ملفك الشخصي بنجاح.",
    error: "تعذّر تحميل الملف الشخصي.",
    saveError:
      "تعذّر حفظ التغييرات. حاول مرة أخرى.",
    namesError:
      "كل اسم يجب أن يتكون من 2 إلى 100 حرف.",
    dateError:
      "أدخل تاريخًا صحيحًا ليس في المستقبل.",

    loading: "جارٍ تحميل ملفك الشخصي...",
    guest: "سجّل الدخول لإدارة ملفك الشخصي.",
    login: "تسجيل الدخول",
    retry: "إعادة المحاولة",
  },
} as const;

// =====================================
// PROFILE VALIDATION
// =====================================

function isProfile(value: unknown): value is Profile {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const p = value as Record<string, unknown>;

  return (
    typeof p.userId === "number" &&
    typeof p.firstName === "string" &&
    typeof p.lastName === "string" &&
    typeof p.username === "string" &&
    typeof p.email === "string" &&
    typeof p.emailConfirmed === "boolean" &&
    typeof p.createdAt === "string" &&
    (p.profileImageUrl === null ||
      typeof p.profileImageUrl === "string") &&
    (p.bio === null ||
      typeof p.bio === "string") &&
    (p.phoneNumber === null ||
      typeof p.phoneNumber === "string") &&
    (p.country === null ||
      typeof p.country === "string") &&
    (p.dateOfBirth === null ||
      typeof p.dateOfBirth === "string")
  );
}

function toForm(profile: Profile): ProfileForm {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    bio: profile.bio ?? "",
    phoneNumber: profile.phoneNumber ?? "",
    country: profile.country ?? "",
    dateOfBirth: profile.dateOfBirth?.slice(0, 10) ?? "",
  };
}

// =====================================
// DATE HELPERS
// =====================================

function parseUtc(value: string): Date {
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
    ? value
    : `${value}Z`;

  return new Date(normalized);
}

function formatDate(
  value: string,
  locale: Locale
): string {
  const date = parseUtc(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
}

function isValidDate(value: string): boolean {
  if (!value) return true;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    value <= new Date().toISOString().slice(0, 10)
  );
}

// =====================================
// AUTHENTICATED REQUEST
// =====================================

async function authorizedRequest(
  request: () => Promise<Response>
): Promise<Response> {
  let response = await request();

  if (response.status === 401) {
    const session = await getCurrentSession();

    if (session.status !== "authenticated") {
      throw new Error("Session expired");
    }

    response = await request();
  }

  if (!response.ok) {
    throw new Error("Request failed");
  }

  return response;
}

// =====================================
// PROFILE PAGE
// =====================================

export default function ProfilePage() {
  const params = useParams<{ locale: string }>();

  const locale: Locale =
    params.locale === "ar" ? "ar" : "en";

  const t = copy[locale];

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [status, setStatus] =
    useState<Status>("loading");

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [form, setForm] =
    useState<ProfileForm | null>(null);

  const [retry, setRetry] = useState(0);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================
  // PROFILE IMAGE STATES
  // =====================================

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [removingImage, setRemovingImage] =
    useState(false);

  const [imageVersion, setImageVersion] =
    useState(0);

  const [imageFailed, setImageFailed] =
    useState(false);

  const [imageError, setImageError] =
    useState("");

  const imageBusy =
    uploadingImage || removingImage;

  // =====================================
  // CLEAN UP PREVIEW URL
  // =====================================

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // =====================================
  // LOAD PROFILE
  // =====================================

  const loadProfile = useCallback(
    async (signal: AbortSignal) => {
      try {
        const session = await getCurrentSession();

        if (signal.aborted) return;

        if (session.status === "guest") {
          setStatus("guest");
          return;
        }

        if (session.status !== "authenticated") {
          setStatus("error");
          return;
        }

        const request = () =>
          fetch("/api/profile", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            signal,
          });

        let response = await request();

        if (response.status === 401) {
          const refreshed =
            await getCurrentSession();

          if (signal.aborted) return;

          if (
            refreshed.status !== "authenticated"
          ) {
            setStatus(
              refreshed.status === "guest"
                ? "guest"
                : "error"
            );
            return;
          }

          response = await request();
        }

        if (!response.ok) {
          throw new Error("Profile unavailable");
        }

        const data: unknown =
          await response.json();

        if (!isProfile(data)) {
          throw new Error("Invalid profile");
        }

        if (signal.aborted) return;

        setProfile(data);
        setForm(toForm(data));
        setImageFailed(false);
        setStatus("ready");
      } catch {
        if (!signal.aborted) {
          setStatus("error");
        }
      }
    },
    []
  );

  // =====================================
  // INITIAL LOAD
  // =====================================

  useEffect(() => {
    const controller = new AbortController();

    async function initialize() {
      await Promise.resolve();

      if (!controller.signal.aborted) {
        await loadProfile(controller.signal);
      }
    }

    void initialize();

    return () => {
      controller.abort();
    };
  }, [loadProfile, retry]);

  // =====================================
  // FORM UPDATES
  // =====================================

  function updateField<K extends keyof ProfileForm>(
    field: K,
    value: ProfileForm[K]
  ) {
    setForm((previous) =>
      previous
        ? { ...previous, [field]: value }
        : previous
    );

    setError("");
    setSuccess("");
  }

  const dirty =
    form !== null &&
    profile !== null &&
    JSON.stringify(form) !==
      JSON.stringify(toForm(profile));

  // =====================================
  // CLEAR SELECTED PHOTO
  // =====================================

  function clearPhotoSelection() {
    setSelectedImage(null);
    setPreviewUrl("");
    setImageError("");
    setImageFailed(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // =====================================
  // SELECT PHOTO
  // =====================================

  function selectPhoto(file: File | null) {
    setImageError("");
    setSuccess("");

    if (!file) {
      clearPhotoSelection();
      return;
    }

    if (!IMAGE_TYPES.includes(file.type)) {
      clearPhotoSelection();
      setImageError(t.photoTypeError);
      return;
    }

    if (
      file.size === 0 ||
      file.size > MAX_IMAGE_SIZE
    ) {
      clearPhotoSelection();
      setImageError(t.photoSizeError);
      return;
    }

    setSelectedImage(file);

    // Create the preview URL only when the
    // student selects a valid new image.
    setPreviewUrl(URL.createObjectURL(file));

    setImageFailed(false);
  }

  // =====================================
  // REFRESH PROFILE IMAGE
  // =====================================

  async function refreshProfileImage() {
    const response = await authorizedRequest(
      () =>
        fetch("/api/profile", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        })
    );

    const data: unknown = await response.json();

    if (!isProfile(data)) {
      throw new Error(
        "Invalid profile response"
      );
    }

    // Keep unsaved changes in the form.
    setProfile(data);

    // Force the browser to request the newest image.
    setImageVersion((value) => value + 1);
    setImageFailed(false);
  }

  // =====================================
  // SAVE PROFILE INFORMATION
  // =====================================

  async function saveProfile(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !form ||
      !profile ||
      saving ||
      imageBusy
    ) {
      return;
    }

    const firstName =
      form.firstName.trim();

    const lastName =
      form.lastName.trim();

    if (
      firstName.length < 2 ||
      firstName.length > 100 ||
      lastName.length < 2 ||
      lastName.length > 100
    ) {
      setError(t.namesError);
      return;
    }

    if (
      form.bio.length > 1000 ||
      form.phoneNumber.length > 30 ||
      form.country.length > 100
    ) {
      setError(t.saveError);
      return;
    }

    if (!isValidDate(form.dateOfBirth)) {
      setError(t.dateError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      firstName,
      lastName,

      // Preserve the original API contract.
      // The backend must not erase the image
      // when this field is null.
      profileImageUrl: null,

      bio: form.bio.trim() || null,
      phoneNumber:
        form.phoneNumber.trim() || null,
      country:
        form.country.trim() || null,
      dateOfBirth:
        form.dateOfBirth || null,
    };

    try {
      const response =
        await authorizedRequest(() =>
          fetch("/api/profile", {
            method: "PUT",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })
        );

      const data: unknown =
        await response.json();

      if (!isProfile(data)) {
        throw new Error(
          "Invalid profile response"
        );
      }

      setProfile(data);
      setForm(toForm(data));

      setSuccess(t.success);

      window.dispatchEvent(
        new Event("crestmark:profile-updated")
      );
    } catch {
      setError(t.saveError);
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // UPLOAD PROFILE PHOTO
  // =====================================

  async function uploadPhoto() {
    if (
      !selectedImage ||
      imageBusy ||
      saving
    ) {
      return;
    }

    setUploadingImage(true);
    setImageError("");
    setSuccess("");

    try {
      const data = new FormData();

      data.append(
        "file",
        selectedImage,
        selectedImage.name
      );

      await authorizedRequest(() =>
        fetch("/api/profile/image", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          body: data,
        })
      );

      await refreshProfileImage();

      clearPhotoSelection();

      setSuccess(t.photoUploadSuccess);

      window.dispatchEvent(
        new Event("crestmark:profile-updated")
      );
    } catch {
      setImageError(t.photoUploadError);
    } finally {
      setUploadingImage(false);
    }
  }

  // =====================================
  // REMOVE PROFILE PHOTO
  // =====================================

  async function removePhoto() {
    if (
      !profile?.profileImageUrl ||
      imageBusy ||
      saving
    ) {
      return;
    }

    if (!window.confirm(t.confirmRemove)) {
      return;
    }

    setRemovingImage(true);
    setImageError("");
    setSuccess("");

    try {
      await authorizedRequest(() =>
        fetch("/api/profile/image", {
          method: "DELETE",
          credentials: "same-origin",
          cache: "no-store",
        })
      );

      await refreshProfileImage();

      clearPhotoSelection();

      setSuccess(t.photoRemoveSuccess);

      window.dispatchEvent(
        new Event("crestmark:profile-updated")
      );
    } catch {
      setImageError(t.photoRemoveError);
    } finally {
      setRemovingImage(false);
    }
  }

  // =====================================
  // DERIVED IMAGE DATA
  // =====================================

  const storedImageUrl =
    profile?.profileImageUrl
      ? `/api/profile/image?v=${imageVersion}`
      : "";

  const imageUrl =
    previewUrl || storedImageUrl;

  const showImage =
    Boolean(imageUrl) && !imageFailed;

  const initials = profile
    ? (
        profile.firstName.charAt(0) +
        profile.lastName.charAt(0)
      ).toUpperCase()
    : "";

  // =====================================
  // RENDER
  // =====================================

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.container}>

        {/* Breadcrumb */}

        <nav
          className={styles.breadcrumb}
          aria-label="Breadcrumb"
        >
          <Link href={`/${locale}`}>
            {t.home}
          </Link>

          <span aria-hidden="true">/</span>

          <Link href={`/${locale}/dashboard`}>
            {t.dashboard}
          </Link>

          <span aria-hidden="true">/</span>

          <span aria-current="page">
            {t.pageName}
          </span>
        </nav>

        {/* Page Header */}

        <header className={styles.heading}>
          <span className={styles.eyebrow}>
            {t.eyebrow}
          </span>

          <h1>
            {t.title}
            <br />
            <span>{t.titleAccent}</span>
          </h1>

          <p>{t.subtitle}</p>
        </header>

        {/* Loading */}

        {status === "loading" ? (
          <div
            className={styles.state}
            role="status"
          >
            <div
              className={styles.spinner}
              aria-hidden="true"
            />

            <p>{t.loading}</p>
          </div>
        ) : status !== "ready" ||
          !profile ||
          !form ? (

          /* Guest / Error */

          <div className={styles.state}>
            <div
              className={styles.stateIcon}
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                />
                <path d="M12 7v6m0 4h.01" />
              </svg>
            </div>

            <h2>
              {status === "guest"
                ? t.guest
                : t.error}
            </h2>

            {status === "guest" ? (
              <Link
                href={`/${locale}/login`}
                className={styles.primaryButton}
              >
                {t.login}
              </Link>
            ) : (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  setStatus("loading");
                  setRetry(
                    (value) => value + 1
                  );
                }}
              >
                {t.retry}
              </button>
            )}
          </div>
        ) : (

          /* Profile Layout */

          <div className={styles.layout}>

            {/* =====================================
                PROFILE SIDEBAR
            ===================================== */}

            <aside className={styles.sidebar}>

              {/* Identity */}

              <div className={styles.identity}>

                <div className={styles.avatar}>
                  {showImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={imageUrl}
                      src={imageUrl}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      onError={() =>
                        setImageFailed(true)
                      }
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <h2>
                  {profile.firstName}{" "}
                  {profile.lastName}
                </h2>

                <p className={styles.username}>
                  @{profile.username}
                </p>

                <span className={styles.memberSince}>
                  {t.memberSince}{" "}
                  {formatDate(
                    profile.createdAt,
                    locale
                  )}
                </span>

                {/* Photo Management */}

                <div className={styles.photoControls}>
                  <h3>{t.photoTitle}</h3>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className={styles.fileInput}
                    disabled={imageBusy || saving}
                    aria-label={t.choosePhoto}
                    onChange={(event) =>
                      selectPhoto(
                        event.target.files?.[0] ??
                          null
                      )
                    }
                  />

                  {selectedImage ? (
                    <div className={styles.photoActions}>
                      <button
                        type="button"
                        className={
                          styles.uploadButton
                        }
                        disabled={
                          imageBusy || saving
                        }
                        onClick={() => {
                          void uploadPhoto();
                        }}
                      >
                        {uploadingImage
                          ? t.uploadingPhoto
                          : t.uploadPhoto}
                      </button>

                      <button
                        type="button"
                        className={
                          styles.cancelPhotoButton
                        }
                        disabled={imageBusy}
                        onClick={
                          clearPhotoSelection
                        }
                      >
                        {t.cancelPhoto}
                      </button>
                    </div>
                  ) : profile.profileImageUrl ? (
                    <button
                      type="button"
                      className={
                        styles.removePhotoButton
                      }
                      disabled={
                        imageBusy || saving
                      }
                      onClick={() => {
                        void removePhoto();
                      }}
                    >
                      {removingImage
                        ? t.removingPhoto
                        : t.removePhoto}
                    </button>
                  ) : null}

                  <p className={styles.photoHint}>
                    {t.photoHint}
                  </p>

                  {imageError && (
                    <p
                      className={styles.photoError}
                      role="alert"
                    >
                      {imageError}
                    </p>
                  )}
                </div>
              </div>

              {/* Account Details */}

              <div className={styles.accountDetails}>
                <span
                  className={
                    styles.accountEyebrow
                  }
                >
                  {t.account}
                </span>

                <div className={styles.accountItem}>
                  <span>{t.username}</span>
                  <strong>
                    {profile.username}
                  </strong>
                </div>

                <div className={styles.accountItem}>
                  <span>{t.email}</span>

                  <strong className={styles.email}>
                    {profile.email}
                  </strong>

                  <span
                    className={
                      profile.emailConfirmed
                        ? styles.verified
                        : styles.unverified
                    }
                  >
                    {profile.emailConfirmed
                      ? t.verified
                      : t.unverified}
                  </span>
                </div>

                <p className={styles.readOnly}>
                  {t.readOnly}
                </p>
              </div>
            </aside>

            {/* =====================================
                PROFILE EDITOR
            ===================================== */}

            <section className={styles.editor}>

              <div className={styles.editorHeading}>
                <span
                  className={
                    styles.editorEyebrow
                  }
                >
                  {t.eyebrow}
                </span>

                <h2>{t.personal}</h2>
                <p>{t.personalText}</p>
              </div>

              <form onSubmit={saveProfile}>
                <div className={styles.fieldsGrid}>

                  {/* First Name */}

                  <div className={styles.field}>
                    <label htmlFor="cm-firstname">
                      {t.firstName}
                    </label>

                    <input
                      id="cm-firstname"
                      type="text"
                      autoComplete="given-name"
                      value={form.firstName}
                      onChange={(event) =>
                        updateField(
                          "firstName",
                          event.target.value
                        )
                      }
                      minLength={2}
                      maxLength={100}
                      required
                      disabled={
                        saving || imageBusy
                      }
                    />
                  </div>

                  {/* Last Name */}

                  <div className={styles.field}>
                    <label htmlFor="cm-lastname">
                      {t.lastName}
                    </label>

                    <input
                      id="cm-lastname"
                      type="text"
                      autoComplete="family-name"
                      value={form.lastName}
                      onChange={(event) =>
                        updateField(
                          "lastName",
                          event.target.value
                        )
                      }
                      minLength={2}
                      maxLength={100}
                      required
                      disabled={
                        saving || imageBusy
                      }
                    />
                  </div>

                  {/* Phone */}

                  <div className={styles.field}>
                    <label htmlFor="cm-phone">
                      {t.phone}
                      <small>{t.optional}</small>
                    </label>

                    <input
                      id="cm-phone"
                      type="tel"
                      dir="ltr"
                      autoComplete="tel"
                      value={form.phoneNumber}
                      onChange={(event) =>
                        updateField(
                          "phoneNumber",
                          event.target.value
                        )
                      }
                      maxLength={30}
                      disabled={
                        saving || imageBusy
                      }
                    />
                  </div>

                  {/* Country */}

                  <div className={styles.field}>
                    <label htmlFor="cm-country">
                      {t.country}
                      <small>{t.optional}</small>
                    </label>

                    <input
                      id="cm-country"
                      type="text"
                      autoComplete="country-name"
                      value={form.country}
                      onChange={(event) =>
                        updateField(
                          "country",
                          event.target.value
                        )
                      }
                      maxLength={100}
                      disabled={
                        saving || imageBusy
                      }
                    />
                  </div>

                  {/* Date Of Birth */}

                  <div className={styles.field}>
                    <label htmlFor="cm-dob">
                      {t.dateOfBirth}
                      <small>{t.optional}</small>
                    </label>

                    <input
                      id="cm-dob"
                      type="date"
                      value={form.dateOfBirth}
                      max={new Date()
                        .toISOString()
                        .slice(0, 10)}
                      onChange={(event) =>
                        updateField(
                          "dateOfBirth",
                          event.target.value
                        )
                      }
                      disabled={
                        saving || imageBusy
                      }
                    />
                  </div>

                  {/* Bio */}

                  <div
                    className={`${styles.field} ${styles.fullWidth}`}
                  >
                    <label htmlFor="cm-bio">
                      {t.bio}
                      <small>{t.optional}</small>
                    </label>

                    <textarea
                      id="cm-bio"
                      rows={5}
                      value={form.bio}
                      placeholder={
                        t.bioPlaceholder
                      }
                      maxLength={1000}
                      disabled={
                        saving || imageBusy
                      }
                      onChange={(event) =>
                        updateField(
                          "bio",
                          event.target.value
                        )
                      }
                    />

                    <span
                      className={styles.counter}
                    >
                      {form.bio.length}/1000{" "}
                      {t.characters}
                    </span>
                  </div>
                </div>

                {/* Error */}

                {error && (
                  <p
                    className={styles.error}
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                {/* Success */}

                {success && (
                  <p
                    className={styles.success}
                    role="status"
                  >
                    {success}
                  </p>
                )}

                {/* Form Actions */}

                <div className={styles.formActions}>
                  <span
                    className={styles.actionHint}
                  >
                    {t.personalText}
                  </span>

                  <div
                    className={
                      styles.actionButtons
                    }
                  >
                    <button
                      type="button"
                      className={
                        styles.secondaryButton
                      }
                      disabled={
                        saving ||
                        imageBusy ||
                        !dirty
                      }
                      onClick={() => {
                        setForm(
                          toForm(profile)
                        );
                        setError("");
                        setSuccess("");
                      }}
                    >
                      {t.reset}
                    </button>

                    <button
                      type="submit"
                      className={
                        styles.primaryButton
                      }
                      disabled={
                        saving ||
                        imageBusy ||
                        !dirty
                      }
                    >
                      {saving
                        ? t.saving
                        : t.save}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
