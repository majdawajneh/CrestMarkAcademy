
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "./page.module.css";

type FormValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
};

const initialValues: FormValues = {
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

const translations = {
  en: {
    home: "Home",
    contact: "Contact",
    eyebrow: "CONTACT CRESTMARK ACADEMY",
    title: "A conversation can",
    titleAccent: "start something great.",
    intro:
      "Have a question about learning with CrestMark Academy? We're here to hear from you.",
    sideEyebrow: "LET'S CONNECT",
    sideTitle: "We're listening.",
    sideText:
      "Whether you're exploring your next course or have a question about your learning experience, send us a message.",
    emailLabel: "DIRECT CONTACT",
    emailTitle: "Email our team",
    emailText:
      "Use the form and your message will be forwarded to the academy's inbox.",
    responseLabel: "WHAT HAPPENS NEXT",
    responseTitle: "A simple way to get in touch.",
    steps: [
      "Share your question or request.",
      "Your message is sent to our team.",
      "We'll respond by email when available.",
    ],
    formEyebrow: "SEND A MESSAGE",
    formTitle: "Tell us what's on your mind.",
    formText:
      "Complete the form below and we'll take it from there.",
    name: "Full name",
    email: "Email address",
    subject: "What's your message about?",
    message: "Your message",
    namePlaceholder: "Your full name",
    emailPlaceholder: "you@example.com",
    subjectPlaceholder: "Choose a subject",
    messagePlaceholder: "Tell us how we can help...",
    subjects: [
      { value: "Course inquiry", label: "Course inquiry" },
      { value: "Enrollment support", label: "Enrollment support" },
      { value: "Certificate inquiry", label: "Certificate inquiry" },
      { value: "Technical issue", label: "Technical issue" },
      { value: "General inquiry", label: "General inquiry" },
      { value: "Other", label: "Other" },
    ],
    required: "All fields are required.",
    send: "Send message",
    sending: "Sending message...",
    successTitle: "Your message has been sent.",
    successText:
      "Thank you for reaching out. Your message was submitted to CrestMark Academy successfully.",
    again: "Send another message",
    error:
      "We couldn't send your message right now. Please try again.",
    invalid: "Please check your details and try again.",
    privacy:
      "Your information is used to respond to your inquiry.",
    bottomTitle: "Your learning journey matters.",
    bottomText:
      "Looking for something new to learn? Explore the courses available at CrestMark Academy.",
    browse: "Explore our courses",
  },
  ar: {
    home: "الرئيسية",
    contact: "تواصل معنا",
    eyebrow: "تواصل مع CRESTMARK ACADEMY",
    title: "كل بداية مميزة",
    titleAccent: "ممكن تبدأ بمحادثة.",
    intro:
      "عندك سؤال عن CrestMark Academy أو عن تجربتك التعليمية؟ يسعدنا نسمع منك.",
    sideEyebrow: "خلينا نتواصل",
    sideTitle: "نحن هنا لنسمعك.",
    sideText:
      "سواء كنت تستكشف دورة جديدة أو عندك استفسار عن تجربة التعلّم، تقدر ترسل رسالتك بكل سهولة.",
    emailLabel: "التواصل المباشر",
    emailTitle: "راسل فريق الأكاديمية",
    emailText:
      "استخدم النموذج وستصل رسالتك إلى البريد الإلكتروني الخاص بالأكاديمية.",
    responseLabel: "ماذا يحدث بعد الإرسال؟",
    responseTitle: "طريقة بسيطة للتواصل.",
    steps: [
      "اكتب استفسارك أو طلبك.",
      "تصل رسالتك إلى فريق الأكاديمية.",
      "نرد عليك عبر البريد الإلكتروني عندما يتاح ذلك.",
    ],
    formEyebrow: "أرسل رسالة",
    formTitle: "احكيلنا كيف بنقدر نساعدك.",
    formText:
      "عبّئ النموذج التالي وأرسل استفسارك مباشرة.",
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    subject: "موضوع الرسالة",
    message: "رسالتك",
    namePlaceholder: "أدخل اسمك الكامل",
    emailPlaceholder: "you@example.com",
    subjectPlaceholder: "اختر موضوع الرسالة",
    messagePlaceholder: "اكتب تفاصيل استفسارك هنا...",
    subjects: [
      { value: "Course inquiry", label: "استفسار عن دورة" },
      { value: "Enrollment support", label: "مساعدة في التسجيل" },
      { value: "Certificate inquiry", label: "استفسار عن شهادة" },
      { value: "Technical issue", label: "مشكلة تقنية" },
      { value: "General inquiry", label: "استفسار عام" },
      { value: "Other", label: "موضوع آخر" },
    ],
    required: "جميع الحقول مطلوبة.",
    send: "إرسال الرسالة",
    sending: "جارٍ إرسال الرسالة...",
    successTitle: "تم إرسال رسالتك بنجاح.",
    successText:
      "شكرًا لتواصلك معنا. تم إرسال رسالتك إلى CrestMark Academy بنجاح.",
    again: "إرسال رسالة أخرى",
    error:
      "تعذّر إرسال الرسالة حاليًا. حاول مرة أخرى.",
    invalid: "يرجى التأكد من البيانات والمحاولة مجددًا.",
    privacy:
      "نستخدم بياناتك للرد على استفسارك فقط.",
    bottomTitle: "رحلتك التعليمية بتهمنا.",
    bottomText:
      "بتدور على مهارة جديدة؟ استكشف الدورات المتاحة في CrestMark Academy.",
    browse: "استكشف الدورات",
  },
} as const;

export default function ContactPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale === "ar" ? "ar" : "en";
  const t = translations[locale];

  const [form, setForm] = useState<FormValues>(initialValues);
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function update(field: keyof FormValues, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));

    if (status === "error") {
      setStatus("idle");
      setErrorMessage("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status === "sending") return;

    const values = {
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
      website: form.website,
    };

    if (
      values.name.length < 2 ||
      values.name.length > 100 ||
      values.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) ||
      values.subject.length < 3 ||
      values.subject.length > 150 ||
      values.message.length < 10 ||
      values.message.length > 5000
    ) {
      setErrorMessage(t.invalid);
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Email could not be sent.");
      }

      setStatus("success");
      setForm(initialValues);
    } catch {
      setStatus("error");
      setErrorMessage(t.error);
    }
  }

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href={`/${locale}`}>{t.home}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{t.contact}</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowLine} />
              {t.eyebrow}
            </span>

            <h1>
              {t.title}
              <span>{t.titleAccent}</span>
            </h1>

            <p>{t.intro}</p>
          </div>

          <div className={styles.heroAside} aria-hidden="true">
            <span className={styles.heroMark}>C</span>
            <div className={styles.heroAsideFooter}>
              <span>CRESTMARK</span>
              <span>LET'S CONNECT / 01</span>
            </div>
          </div>
        </header>

        <section className={styles.contactLayout}>
          <aside className={styles.information}>
            <span className={styles.sectionEyebrow}>
              {t.sideEyebrow}
            </span>

            <h2>{t.sideTitle}</h2>
            <p className={styles.sideIntro}>{t.sideText}</p>

            <div className={styles.infoBlock}>
              <div className={styles.infoIcon}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </div>
              <div>
                <span>{t.emailLabel}</span>
                <h3>{t.emailTitle}</h3>
                <p>{t.emailText}</p>
              </div>
            </div>

            <div className={styles.process}>
              <span className={styles.sectionEyebrow}>
                {t.responseLabel}
              </span>

              <h3>{t.responseTitle}</h3>

              <ol>
                {t.steps.map((step, index) => (
                  <li key={step}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          <div className={styles.formPanel}>
            {status === "success" ? (
              <div className={styles.successState} role="status">
                <div className={styles.successIcon}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m7 12 3.5 3.5L17 9" />
                  </svg>
                </div>

                <h2>{t.successTitle}</h2>
                <p>{t.successText}</p>

                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={() => {
                    setForm(initialValues);
                    setStatus("idle");
                  }}
                >
                  {t.again}
                </button>
              </div>
            ) : (
              <>
                <span className={styles.sectionEyebrow}>
                  {t.formEyebrow}
                </span>

                <h2>{t.formTitle}</h2>
                <p className={styles.formIntro}>{t.formText}</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                  <div
                    className={styles.honeypot}
                    aria-hidden="true"
                  >
                    <label htmlFor="contact-website">
                      Website
                    </label>
                    <input
                      id="contact-website"
                      type="text"
                      autoComplete="off"
                      tabIndex={-1}
                      value={form.website}
                      onChange={(event) =>
                        update("website", event.target.value)
                      }
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label htmlFor="contact-name">{t.name}</label>
                      <input
                        id="contact-name"
                        type="text"
                        autoComplete="name"
                        required
                        minLength={2}
                        maxLength={100}
                        placeholder={t.namePlaceholder}
                        value={form.name}
                        disabled={status === "sending"}
                        onChange={(event) =>
                          update("name", event.target.value)
                        }
                      />
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="contact-email">{t.email}</label>
                      <input
                        id="contact-email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={254}
                        placeholder={t.emailPlaceholder}
                        value={form.email}
                        disabled={status === "sending"}
                        onChange={(event) =>
                          update("email", event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="contact-subject">{t.subject}</label>
                    <select
                      id="contact-subject"
                      value={form.subject}
                      required
                      disabled={status === "sending"}
                      onChange={(event) =>
                        update("subject", event.target.value)
                      }
                    >
                      <option value="">{t.subjectPlaceholder}</option>
                      {t.subjects.map((subject) => (
                        <option
                          key={subject.value}
                          value={subject.value}
                        >
                          {subject.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="contact-message">{t.message}</label>
                    <textarea
                      id="contact-message"
                      value={form.message}
                      required
                      minLength={10}
                      maxLength={5000}
                      rows={7}
                      disabled={status === "sending"}
                      placeholder={t.messagePlaceholder}
                      onChange={(event) =>
                        update("message", event.target.value)
                      }
                    />
                    <span className={styles.characterCount}>
                      {form.message.length} / 5000
                    </span>
                  </div>

                  {status === "error" && (
                    <p className={styles.formError} role="alert">
                      {errorMessage}
                    </p>
                  )}

                  <div className={styles.formFooter}>
                    <p>{t.privacy}</p>

                    <button
                      className={styles.submitButton}
                      type="submit"
                      disabled={status === "sending"}
                    >
                      {status === "sending" ? t.sending : t.send}
                      {status !== "sending" && (
                        <span aria-hidden="true">↗</span>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </section>

        <section className={styles.bottomSection}>
          <div>
            <span className={styles.sectionEyebrow}>
              CRESTMARK ACADEMY
            </span>
            <h2>{t.bottomTitle}</h2>
            <p>{t.bottomText}</p>
          </div>

          <Link href={`/${locale}/courses`} className={styles.browseButton}>
            {t.browse}
            <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
