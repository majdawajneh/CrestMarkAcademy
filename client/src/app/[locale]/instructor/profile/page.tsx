"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "next/navigation";
import { authenticatedFetch, getCurrentSession } from "@/lib/auth-session";
import styles from "./page.module.css";

type Profile = {
  userId: number;
  firstName: string;
  lastName: string;
  username: string;
  profileImageUrl: string | null;
  bio: string | null;
  professionalTitle: string | null;
  expertise: string | null;
  experience: string | null;
  linkedInUrl: string | null;
  gitHubUrl: string | null;
  websiteUrl: string | null;
  youTubeUrl: string | null;
};

type FormData = {
  professionalTitle: string;
  expertise: string;
  experience: string;
  linkedInUrl: string;
  gitHubUrl: string;
  websiteUrl: string;
  youTubeUrl: string;
};

type Field = keyof FormData;
type ErrorKind = "" | "load" | "save" | "url" | "verify" | "session";

const emptyForm: FormData = {
  professionalTitle: "",
  expertise: "",
  experience: "",
  linkedInUrl: "",
  gitHubUrl: "",
  websiteUrl: "",
  youTubeUrl: "",
};

const dictionary = {
  en: {
    eyebrow: "ACCOUNT / PROFESSIONAL IDENTITY",
    title: "Professional profile",
    subtitle: "Manage the professional information displayed on your instructor profile.",
    identity: "INSTRUCTOR IDENTITY",
    instructor: "Instructor",
    about: "Professional information",
    aboutDesc: "Introduce your expertise and professional background.",
    titleField: "Professional title",
    titlePlaceholder: "e.g. Senior Software Engineer",
    expertise: "Area of expertise",
    expertisePlaceholder: "e.g. Full-stack development",
    experience: "Professional experience",
    experiencePlaceholder: "e.g. 3+ years",
    links: "Professional links",
    linksDesc: "Connect your public profile to your professional platforms.",
    linkedin: "LinkedIn URL",
    github: "GitHub URL",
    website: "Personal website",
    youtube: "YouTube URL",
    save: "Save changes",
    saving: "Saving...",
    reset: "Discard changes",
    unsaved: "You have unsaved changes",
    saved: "Your professional profile has been updated.",
    error: "Unable to load your profile.",
    saveError: "Unable to save your changes. Please try again.",
    verifyError: "The update was accepted, but we couldn't verify the saved profile. Your edits are preserved. Please check your public profile before saving again.",
    sessionError: "Your session needed renewal. Your edits are preserved. Please select Save changes again to submit them.",
    invalidUrl: "Enter a valid HTTPS URL.",
    retry: "Try again",
    loading: "Loading your profile...",
    publicProfile: "View public profile",
    noBio: "Your public bio has not been added yet.",
    accountNote: "Your name, profile image and personal biography are managed separately in your account profile.",
  },
  ar: {
    eyebrow: "الحساب / الهوية المهنية",
    title: "الملف المهني",
    subtitle: "عدّل المعلومات المهنية التي تظهر للطلاب في صفحتك كمحاضر.",
    identity: "هوية المحاضر",
    instructor: "محاضر",
    about: "المعلومات المهنية",
    aboutDesc: "عرّف الطلاب بتخصصك وخبراتك العملية.",
    titleField: "المسمى المهني",
    titlePlaceholder: "مثال: مهندس برمجيات أول",
    expertise: "مجال التخصص",
    expertisePlaceholder: "مثال: تطوير الويب المتكامل",
    experience: "الخبرة المهنية",
    experiencePlaceholder: "مثال: أكثر من 3 سنوات",
    links: "الروابط المهنية",
    linksDesc: "اربط ملفك العام بمنصاتك وحساباتك المهنية.",
    linkedin: "رابط LinkedIn",
    github: "رابط GitHub",
    website: "الموقع الشخصي",
    youtube: "رابط YouTube",
    save: "حفظ التغييرات",
    saving: "جارٍ الحفظ...",
    reset: "تجاهل التغييرات",
    unsaved: "لديك تغييرات غير محفوظة",
    saved: "تم تحديث ملفك المهني بنجاح.",
    error: "تعذّر تحميل بيانات ملفك الشخصي.",
    saveError: "تعذّر حفظ التغييرات. حاول مرة أخرى.",
    verifyError: "تم قبول التحديث، لكن تعذّر التحقق من البيانات المحفوظة. احتفظنا بتعديلاتك. تحقق من الملف العام قبل إعادة الحفظ.",
    sessionError: "احتاجت الجلسة إلى تجديد. احتفظنا بتعديلاتك؛ اضغط حفظ التغييرات مرة ثانية لإرسالها.",
    invalidUrl: "أدخل رابط HTTPS صالحًا.",
    retry: "إعادة المحاولة",
    loading: "جارٍ تحميل ملفك الشخصي...",
    publicProfile: "عرض الملف العام",
    noBio: "لم تتم إضافة نبذة شخصية بعد.",
    accountNote: "الاسم والصورة الشخصية والنبذة العامة تُدار بشكل منفصل من إعدادات حسابك.",
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function optionalString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isProfile(value: unknown): value is Profile {
  if (!isRecord(value)) return false;

  return (
    typeof value.userId === "number" &&
    Number.isSafeInteger(value.userId) &&
    value.userId > 0 &&
    typeof value.firstName === "string" &&
    typeof value.lastName === "string" &&
    typeof value.username === "string" &&
    optionalString(value.profileImageUrl) &&
    optionalString(value.bio) &&
    optionalString(value.professionalTitle) &&
    optionalString(value.expertise) &&
    optionalString(value.experience) &&
    optionalString(value.linkedInUrl) &&
    optionalString(value.gitHubUrl) &&
    optionalString(value.websiteUrl) &&
    optionalString(value.youTubeUrl)
  );
}

function formFromProfile(profile: Profile): FormData {
  return {
    professionalTitle: profile.professionalTitle ?? "",
    expertise: profile.expertise ?? "",
    experience: profile.experience ?? "",
    linkedInUrl: profile.linkedInUrl ?? "",
    gitHubUrl: profile.gitHubUrl ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    youTubeUrl: profile.youTubeUrl ?? "",
  };
}

function validHttpsUrl(value: string): boolean {
  if (!value.trim()) return true;

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function toPayload(form: FormData) {
  const nullable = (value: string) => value.trim() || null;
  return {
    professionalTitle: nullable(form.professionalTitle),
    expertise: nullable(form.expertise),
    experience: nullable(form.experience),
    linkedInUrl: nullable(form.linkedInUrl),
    gitHubUrl: nullable(form.gitHubUrl),
    websiteUrl: nullable(form.websiteUrl),
    youTubeUrl: nullable(form.youTubeUrl),
  };
}

export default function InstructorProfilePage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale === "ar" ? "ar" : "en";
  const t = dictionary[locale];

  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [original, setOriginal] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ErrorKind>("");
  const [success, setSuccess] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  function retryLoad() {
    setLoading(true);
    setError("");
    setRefreshIndex((value) => value + 1);
  }

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await authenticatedFetch("/api/profile", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result: unknown = await response.json();
        if (!isProfile(result)) throw new Error("Invalid profile data");

        if (!controller.signal.aborted) {
          const values = formFromProfile(result);
          setProfile(result);
          setForm(values);
          setOriginal(values);
          setSuccess(false);
        }
      } catch {
        if (!controller.signal.aborted) setError("load");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [refreshIndex]);

  const hasChanges =
    JSON.stringify(toPayload(form)) !== JSON.stringify(toPayload(original));

  function update(field: Field, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setSuccess(false);
    if (error === "url" || error === "save" || error === "session") setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || saving || !hasChanges) return;

    const urlFields: Field[] = ["linkedInUrl", "gitHubUrl", "websiteUrl", "youTubeUrl"];
    if (urlFields.some((field) => !validHttpsUrl(form[field]))) {
      setError("url");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    const payload = toPayload(form);

    try {
      // Deliberately do not auto-retry this PUT: the server might have applied it.
      const response = await fetch("/api/profile/instructor", {
        method: "PUT",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        // Restore the session for the NEXT manual attempt, without resubmitting the PUT.
        await getCurrentSession();
        setError("session");
        return;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // PUT succeeded; verify persisted values with a safe, retryable GET.
      let updated: unknown;
      try {
        const updatedResponse = await authenticatedFetch("/api/profile", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!updatedResponse.ok) throw new Error("Verification failed");
        updated = await updatedResponse.json();
        if (!isProfile(updated)) throw new Error("Invalid saved profile");
      } catch {
        // Do not falsely say the PUT failed, and do not erase unsaved input.
        setError("verify");
        return;
      }

      const savedProfile = updated as Profile;
      const values = formFromProfile(savedProfile);
      setProfile(savedProfile);
      setForm(values);
      setOriginal(values);
      setSuccess(true);
    } catch {
      setError("save");
    } finally {
      setSaving(false);
    }
  }

  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    profile?.username ||
    "Instructor";
  const initial = fullName.trim().charAt(0).toUpperCase() || "I";

  const imageUrl = (() => {
    if (!profile?.profileImageUrl) return null;
    try {
      const url = new URL(profile.profileImageUrl);
      return url.protocol === "https:" ? url.href : null;
    } catch {
      return null;
    }
  })();

  const fields: { id: Field; label: string; placeholder: string; maxLength: number }[] = [
    { id: "professionalTitle", label: t.titleField, placeholder: t.titlePlaceholder, maxLength: 200 },
    { id: "expertise", label: t.expertise, placeholder: t.expertisePlaceholder, maxLength: 2000 },
    { id: "experience", label: t.experience, placeholder: t.experiencePlaceholder, maxLength: 2000 },
  ];

  const links: { id: Field; label: string }[] = [
    { id: "linkedInUrl", label: t.linkedin },
    { id: "gitHubUrl", label: t.github },
    { id: "websiteUrl", label: t.website },
    { id: "youTubeUrl", label: t.youtube },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <span className={styles.eyebrow}>{t.eyebrow}</span>
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
      </header>

      {loading && !profile && (
        <div className={styles.message} role="status">{t.loading}</div>
      )}

      {error === "load" && (
        <div className={styles.message} role="alert">
          <p>{t.error}</p>
          <button type="button" onClick={retryLoad}>{t.retry}</button>
        </div>
      )}

      {profile && (
        <div className={styles.layout}>
          <aside className={styles.identityCard}>
            <span className={styles.cardEyebrow}>{t.identity}</span>
            <div className={styles.identityAvatar}>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={fullName} />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <h3>{fullName}</h3>
            <p className={styles.username}>@{profile.username}</p>
            <span className={styles.role}>{t.instructor}</span>
            <p className={styles.bio}>{profile.bio || t.noBio}</p>
            <a
              href={`/${locale}/instructors/${profile.userId}`}
              className={styles.publicLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.publicProfile} <span aria-hidden="true">↗</span>
            </a>
            <p className={styles.accountNote}>{t.accountNote}</p>
          </aside>

          <form className={styles.form} onSubmit={handleSubmit}>
            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>01</span>
                <div>
                  <h3>{t.about}</h3>
                  <p>{t.aboutDesc}</p>
                </div>
              </div>
              <div className={styles.fields}>
                {fields.map((field) => (
                  <label className={styles.field} key={field.id}>
                    <span>{field.label}</span>
                    <input
                      type="text"
                      value={form[field.id]}
                      onChange={(event) => update(field.id, event.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      disabled={saving}
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>02</span>
                <div>
                  <h3>{t.links}</h3>
                  <p>{t.linksDesc}</p>
                </div>
              </div>
              <div className={styles.fields}>
                {links.map((field) => (
                  <label className={styles.field} key={field.id}>
                    <span>{field.label}</span>
                    <input
                      type="url"
                      inputMode="url"
                      value={form[field.id]}
                      onChange={(event) => update(field.id, event.target.value)}
                      placeholder="https://"
                      maxLength={1000}
                      disabled={saving}
                    />
                  </label>
                ))}
              </div>
            </section>

            <div className={styles.formFooter}>
              <div className={styles.feedback}>
                {success && <p className={styles.success} role="status">{t.saved}</p>}
                {error === "save" && <p className={styles.error} role="alert">{t.saveError}</p>}
                {error === "verify" && <p className={styles.error} role="alert">{t.verifyError}</p>}
                {error === "session" && <p className={styles.error} role="alert">{t.sessionError}</p>}
                {error === "url" && <p className={styles.error} role="alert">{t.invalidUrl}</p>}
                {!success && !error && hasChanges && <p className={styles.unsaved}>{t.unsaved}</p>}
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.resetButton}
                  onClick={() => {
                    setForm(original);
                    setError("");
                    setSuccess(false);
                  }}
                  disabled={!hasChanges || saving}
                >
                  {t.reset}
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={!hasChanges || saving}
                >
                  {saving ? t.saving : t.save}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
