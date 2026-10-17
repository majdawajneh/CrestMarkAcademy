
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { Suspense } from "react";

type Locale = "en" | "ar";

const documentKeys = [
  "privacy",
  "terms",
  "cookies",
  "refunds",
  "accessibility",
] as const;

type DocumentKey = (typeof documentKeys)[number];

type Section = {
  title: string;
  paragraphs: string[];
};

type DocumentContent = {
  title: string;
  description: string;
  sections: Section[];
};

type Props = {
  params: Promise<{
    locale: string;
    document: string;
  }>;
};

function isDocumentKey(value: string): value is DocumentKey {
  return documentKeys.some((key) => key === value);
}

const content: Record<
  Locale,
  Record<DocumentKey, DocumentContent>
> = {
  en: {
    privacy: {
      title: "Privacy Policy",
      description:
        "How personal information is collected, used, and handled when you use CrestMark Academy.",
      sections: [
        {
          title: "Information we process",
          paragraphs: [
            "When you create an account or use CrestMark Academy, the platform may process information such as your username, email address, account details, course enrollments, lesson progress, and certificate records.",
            "If you contact us, we receive the name, email address, subject, and message you submit. When purchasing features are available, relevant order and payment-related information may also be processed.",
          ],
        },
        {
          title: "How we use information",
          paragraphs: [
            "We use information to provide accounts, enable course access, maintain learning progress, support certificate features, respond to inquiries, and operate the platform.",
            "We may also use necessary operational information to troubleshoot problems, protect the platform, and improve the reliability of our services.",
          ],
        },
        {
          title: "Service providers",
          paragraphs: [
            "Operating an online learning platform may involve hosting, email-delivery, content-delivery, and payment service providers. The providers involved depend on the features enabled at the time you use the service.",
            "Where third-party services are used, their own privacy notices may also apply to their handling of information.",
          ],
        },
        {
          title: "Retention and protection",
          paragraphs: [
            "Information is retained according to its operational purpose and any applicable legal obligations. Account information, learning records, and transaction records may require different retention periods.",
            "We aim to apply appropriate safeguards to information processed by the platform. No internet-based service can promise absolute security.",
          ],
        },
        {
          title: "Your privacy choices",
          paragraphs: [
            "You can contact CrestMark Academy to ask about personal information associated with your account, request corrections, or raise a privacy concern. Requests will be handled according to applicable law and relevant operational requirements.",
          ],
        },
      ],
    },

    terms: {
      title: "Terms of Use",
      description:
        "The conditions governing access to CrestMark Academy and its learning services.",
      sections: [
        {
          title: "Using CrestMark Academy",
          paragraphs: [
            "CrestMark Academy provides an online environment for discovering courses, accessing learning materials, following lessons, and tracking educational progress.",
            "By using the platform, you agree to use its services lawfully and in a manner that does not interfere with other users or the operation of the website.",
          ],
        },
        {
          title: "Accounts and access",
          paragraphs: [
            "You are responsible for providing accurate registration details and maintaining the confidentiality of your account credentials.",
            "Access to particular courses or features may depend on enrollment, availability, permissions, or applicable purchase conditions.",
          ],
        },
        {
          title: "Learning materials",
          paragraphs: [
            "Course materials, platform content, branding, and related resources are subject to applicable intellectual property rights.",
            "Access to a course does not automatically grant permission to reproduce, redistribute, resell, or publicly publish its protected materials.",
          ],
        },
        {
          title: "Payments and cancellations",
          paragraphs: [
            "Where paid courses are offered, relevant prices, payment conditions, and any course-specific restrictions should be reviewed before completing a purchase.",
            "Questions about refunds or cancellations can be submitted through the academy's contact page. Applicable purchase terms and consumer-protection requirements must also be considered.",
          ],
        },
        {
          title: "Certificates",
          paragraphs: [
            "Certificates may be available for eligible course completions. A CrestMark Academy course certificate represents the platform's recorded learning achievement and does not, by itself, establish a professional license, university degree, or external accreditation.",
          ],
        },
        {
          title: "Changes and support",
          paragraphs: [
            "Course availability and platform features may evolve over time. Material updates to these terms should be reflected on this page.",
            "If you experience an issue with the service or have a question about these terms, you can contact our team.",
          ],
        },
      ],
    },

    cookies: {
      title: "Cookie Policy",
      description:
        "An overview of cookies and similar technologies that may be used by CrestMark Academy.",
      sections: [
        {
          title: "What cookies are",
          paragraphs: [
            "Cookies are small pieces of information stored by a browser. They can help a website maintain sessions, remember preferences, and support particular features.",
          ],
        },
        {
          title: "Essential website functions",
          paragraphs: [
            "CrestMark Academy uses account authentication and session-related functionality. Technologies needed to maintain secure sessions and operate requested services may be essential to the platform.",
          ],
        },
        {
          title: "External content and additional tools",
          paragraphs: [
            "Some learning materials may be delivered through external media or service providers. Depending on how these integrations are configured, those providers may use their own cookies or similar technologies.",
            "If optional analytics, advertising, or other non-essential tracking technologies are introduced, their use and any applicable consent choices must be disclosed appropriately.",
          ],
        },
        {
          title: "Managing cookies",
          paragraphs: [
            "Most browsers provide controls for blocking or deleting cookies. Disabling essential storage may prevent account login or other website functionality from working correctly.",
            "You may contact us with questions about the technologies used on CrestMark Academy.",
          ],
        },
      ],
    },

    refunds: {
      title: "Refunds & Cancellations",
      description:
        "Information about requesting assistance with course purchases, refunds, and cancellations.",
      sections: [
        {
          title: "Course purchases",
          paragraphs: [
            "Where paid enrollment is available, please review the displayed course details, price, access conditions, and purchase terms before paying.",
            "Any specific refund period, eligibility requirement, or exclusion must be clearly established in the applicable purchase conditions.",
          ],
        },
        {
          title: "Requesting assistance",
          paragraphs: [
            "If you experience a duplicate charge, an incorrect transaction, an access problem following payment, or another purchase-related issue, please contact CrestMark Academy.",
            "Include the email associated with your account, the course title, and a description of the issue. Do not send card numbers, passwords, or other sensitive payment credentials.",
          ],
        },
        {
          title: "Review of requests",
          paragraphs: [
            "Refund or cancellation requests should be reviewed in accordance with the purchase conditions that applied to the transaction and applicable consumer-protection law.",
            "Any approved refund is subject to the payment provider's processing arrangements and the circumstances of the transaction.",
          ],
        },
        {
          title: "Before paid courses launch",
          paragraphs: [
            "The academy must establish and publish its definitive refund eligibility rules, time limits, and payment procedures before accepting live paid enrollments.",
          ],
        },
      ],
    },

    accessibility: {
      title: "Accessibility",
      description:
        "Our approach to making CrestMark Academy usable for a wider range of learners.",
      sections: [
        {
          title: "Our approach",
          paragraphs: [
            "We want learners to be able to navigate CrestMark Academy clearly and use its educational features across different devices.",
            "Accessibility is an ongoing part of developing and improving the platform.",
          ],
        },
        {
          title: "Areas of focus",
          paragraphs: [
            "Our accessibility work includes readable content, clear navigation, keyboard interaction, meaningful labels, responsive layouts, and accessible learning experiences.",
            "Some media or external learning resources may have different accessibility characteristics depending on their source.",
          ],
        },
        {
          title: "Report an accessibility barrier",
          paragraphs: [
            "If you encounter a problem accessing a page, lesson, form, or certificate, please contact us. Include the page or feature involved, the difficulty you experienced, and any assistive technology information you choose to share.",
          ],
        },
      ],
    },
  },

  ar: {
    privacy: {
      title: "سياسة الخصوصية",
      description:
        "كيفية جمع البيانات الشخصية واستخدامها والتعامل معها عند استخدام CrestMark Academy.",
      sections: [
        {
          title: "البيانات التي نعالجها",
          paragraphs: [
            "عند إنشاء حساب أو استخدام CrestMark Academy، قد تعالج المنصة بيانات مثل اسم المستخدم والبريد الإلكتروني ومعلومات الحساب والالتحاق بالدورات والتقدم في الدروس وسجلات الشهادات.",
            "عند التواصل معنا، نستقبل الاسم والبريد الإلكتروني والموضوع ومحتوى الرسالة. وعند تفعيل خدمات الشراء، قد تتم معالجة بيانات مرتبطة بالطلبات والمعاملات المالية.",
          ],
        },
        {
          title: "كيفية استخدام البيانات",
          paragraphs: [
            "نستخدم البيانات لتشغيل الحسابات وإتاحة الدورات وحفظ التقدم التعليمي ودعم خدمات الشهادات والرد على الاستفسارات وتشغيل المنصة.",
            "وقد تُستخدم المعلومات التشغيلية اللازمة لمعالجة المشكلات وحماية الخدمات وتحسين استقرارها.",
          ],
        },
        {
          title: "مقدمو الخدمات",
          paragraphs: [
            "قد يتطلب تشغيل المنصة الاستعانة بمزودي استضافة أو بريد إلكتروني أو خدمات عرض المحتوى أو معالجة المدفوعات، بحسب الخدمات المفعلة.",
            "عند استخدام خدمات خارجية، قد تنطبق إشعارات الخصوصية الخاصة بمقدميها على معالجة البيانات لديهم.",
          ],
        },
        {
          title: "الاحتفاظ بالبيانات وحمايتها",
          paragraphs: [
            "يتم تحديد الاحتفاظ بالبيانات وفق الغرض التشغيلي والالتزامات القانونية السارية، وقد تختلف الفترات المتعلقة بالحسابات والسجلات التعليمية والمعاملات.",
            "نسعى إلى تطبيق إجراءات حماية مناسبة للبيانات، مع الإقرار بأن أي خدمة تعمل عبر الإنترنت لا تستطيع ضمان الأمان المطلق.",
          ],
        },
        {
          title: "خياراتك المتعلقة بالخصوصية",
          paragraphs: [
            "يمكنك التواصل مع CrestMark Academy للاستفسار عن البيانات المرتبطة بحسابك أو طلب تصحيحها أو تقديم استفسار يتعلق بالخصوصية، وفق القوانين المعمول بها والمتطلبات التشغيلية ذات الصلة.",
          ],
        },
      ],
    },

    terms: {
      title: "شروط الاستخدام",
      description:
        "الشروط التي تنظم الوصول إلى CrestMark Academy واستخدام خدماتها التعليمية.",
      sections: [
        {
          title: "استخدام المنصة",
          paragraphs: [
            "توفر CrestMark Academy بيئة إلكترونية لاستكشاف الدورات والوصول إلى المواد التعليمية ومتابعة الدروس والتقدم الدراسي.",
            "يلتزم المستخدم باستعمال المنصة بصورة قانونية لا تضر بالمستخدمين الآخرين أو تتسبب في تعطيل الخدمات.",
          ],
        },
        {
          title: "الحسابات والصلاحيات",
          paragraphs: [
            "يتحمل المستخدم مسؤولية تقديم بيانات تسجيل صحيحة والمحافظة على سرية معلومات الدخول الخاصة به.",
            "قد يتطلب الوصول إلى بعض الدورات أو الخدمات التسجيل أو الالتحاق أو استيفاء شروط شراء أو صلاحيات محددة.",
          ],
        },
        {
          title: "المحتوى التعليمي",
          paragraphs: [
            "تخضع المواد التعليمية ومحتويات المنصة وهويتها التجارية ومواردها لحقوق الملكية الفكرية المعمول بها.",
            "ولا يمنح الوصول إلى الدورة حق نسخ المواد المحمية أو إعادة نشرها أو بيعها أو توزيعها دون تصريح.",
          ],
        },
        {
          title: "المدفوعات والإلغاء",
          paragraphs: [
            "عند توفير دورات مدفوعة، ينبغي مراجعة السعر وشروط الوصول والدفع وأي قيود خاصة قبل إتمام عملية الشراء.",
            "يمكن إرسال استفسارات الاسترجاع والإلغاء عبر صفحة التواصل، مع مراعاة الشروط السارية على عملية الشراء والقوانين ذات العلاقة.",
          ],
        },
        {
          title: "الشهادات",
          paragraphs: [
            "قد تتوفر شهادات عند إكمال الدورات المؤهلة وفق الشروط المطلوبة. وتعبّر شهادة CrestMark Academy عن الإنجاز التعليمي المسجل في المنصة، ولا تمثل بحد ذاتها ترخيصًا مهنيًا أو شهادة جامعية أو اعتمادًا خارجيًا.",
          ],
        },
        {
          title: "التحديثات والدعم",
          paragraphs: [
            "قد تتطور الدورات والخدمات بمرور الوقت، وينبغي إظهار التعديلات الجوهرية على هذه الشروط في هذه الصفحة.",
            "يمكنك التواصل معنا إذا واجهت مشكلة أو رغبت بالاستفسار عن شروط الاستخدام.",
          ],
        },
      ],
    },

    cookies: {
      title: "سياسة ملفات الارتباط",
      description:
        "معلومات حول ملفات الارتباط والتقنيات المشابهة التي قد تستخدمها CrestMark Academy.",
      sections: [
        {
          title: "ما هي ملفات الارتباط؟",
          paragraphs: [
            "ملفات الارتباط بيانات صغيرة يحتفظ بها المتصفح، وقد تساعد المواقع على إدارة الجلسات وتذكّر التفضيلات وتشغيل بعض الميزات.",
          ],
        },
        {
          title: "وظائف الموقع الأساسية",
          paragraphs: [
            "تستخدم CrestMark Academy وظائف تسجيل الدخول وإدارة جلسات المستخدمين. وقد تكون التقنيات اللازمة لحفظ الجلسات وتشغيل الخدمات المطلوبة أساسية لعمل المنصة.",
          ],
        },
        {
          title: "المحتوى الخارجي والخدمات الإضافية",
          paragraphs: [
            "قد يتم عرض بعض المواد التعليمية من خلال خدمات أو مزودين خارجيين، وقد تستخدم هذه الخدمات ملفات ارتباط أو تقنيات مشابهة بحسب طريقة دمجها.",
            "في حال إضافة أدوات تحليل اختيارية أو إعلانات أو تتبع غير ضروري، يجب الإفصاح عنها وتوفير خيارات الموافقة المطلوبة وفق القوانين المعمول بها.",
          ],
        },
        {
          title: "إدارة ملفات الارتباط",
          paragraphs: [
            "تتيح معظم المتصفحات خيارات حظر ملفات الارتباط أو حذفها. وقد يؤدي تعطيل التخزين الأساسي إلى التأثير في تسجيل الدخول أو بعض خدمات الموقع.",
            "يمكنك التواصل معنا للاستفسار عن التقنيات المستخدمة في الأكاديمية.",
          ],
        },
      ],
    },

    refunds: {
      title: "سياسة الاسترجاع والإلغاء",
      description:
        "معلومات عن طلب المساعدة المتعلقة بمشتريات الدورات والاسترجاع والإلغاء.",
      sections: [
        {
          title: "شراء الدورات",
          paragraphs: [
            "عند إتاحة الالتحاق المدفوع، يرجى مراجعة تفاصيل الدورة والسعر وشروط الوصول والشراء قبل إتمام الدفع.",
            "يجب تحديد أي مدة للاسترجاع أو متطلبات أهلية أو استثناءات بصورة واضحة ضمن شروط الشراء المعتمدة.",
          ],
        },
        {
          title: "طلب المساعدة",
          paragraphs: [
            "إذا واجهت خصمًا مكررًا أو عملية دفع غير صحيحة أو مشكلة في الوصول إلى دورة بعد الدفع، يمكنك التواصل مع CrestMark Academy.",
            "يرجى ذكر البريد المرتبط بالحساب واسم الدورة وتفاصيل المشكلة، دون إرسال أرقام البطاقات أو كلمات المرور أو بيانات الدفع الحساسة.",
          ],
        },
        {
          title: "مراجعة الطلبات",
          paragraphs: [
            "تُراجع طلبات الاسترجاع أو الإلغاء وفق الشروط المطبقة على المعاملة ومتطلبات حماية المستهلك المعمول بها.",
            "وتعتمد معالجة المبلغ المسترد، عند الموافقة عليه، على ترتيبات مزود الدفع وظروف المعاملة.",
          ],
        },
        {
          title: "قبل إطلاق الدورات المدفوعة",
          paragraphs: [
            "يجب اعتماد ونشر القواعد النهائية لأهلية الاسترجاع ومدده وإجراءات الدفع قبل بدء استقبال عمليات شراء مدفوعة فعلية.",
          ],
        },
      ],
    },

    accessibility: {
      title: "إمكانية الوصول",
      description:
        "نهجنا في تطوير تجربة تعليمية يمكن لمجموعة أوسع من المتعلمين استخدامها.",
      sections: [
        {
          title: "نهجنا",
          paragraphs: [
            "نسعى إلى أن يتمكن المتعلمون من التنقل بوضوح داخل CrestMark Academy واستخدام خدماتها التعليمية عبر الأجهزة المختلفة.",
            "ونتعامل مع إمكانية الوصول باعتبارها جانبًا مستمرًا من تطوير المنصة وتحسينها.",
          ],
        },
        {
          title: "مجالات التطوير",
          paragraphs: [
            "تشمل الجوانب التي نهتم بها وضوح النصوص والتنقل السهل واستخدام لوحة المفاتيح والتسميات المفهومة والتصميم المتجاوب وإمكانية الوصول إلى المحتوى التعليمي.",
            "وقد تختلف إمكانية الوصول إلى بعض المواد المرئية أو الموارد الخارجية بحسب المصدر الذي يقدمها.",
          ],
        },
        {
          title: "الإبلاغ عن مشكلة",
          paragraphs: [
            "إذا واجهت صعوبة في الوصول إلى صفحة أو درس أو نموذج أو شهادة، يرجى التواصل معنا وذكر الصفحة أو الميزة وطبيعة المشكلة وأي معلومات ترغب بمشاركتها عن التقنيات المساعدة المستخدمة.",
          ],
        },
      ],
    },
  },
};

const ui = {
  en: {
    home: "Home",
    legal: "Legal information",
    allDocuments: "POLICIES & INFORMATION",
    contents: "On this page",
    contactTitle: "Need further assistance?",
    contactText:
      "Our team can help with questions about your account, learning experience, or these policies.",
    contactAction: "Contact CrestMark Academy",
    documents: {
      privacy: "Privacy",
      terms: "Terms",
      cookies: "Cookies",
      refunds: "Refunds",
      accessibility: "Accessibility",
    },
  },
  ar: {
    home: "الرئيسية",
    legal: "المعلومات القانونية",
    allDocuments: "السياسات والمعلومات",
    contents: "محتويات الصفحة",
    contactTitle: "هل تحتاج إلى مساعدة؟",
    contactText:
      "يمكنك التواصل مع الأكاديمية للاستفسار عن حسابك أو تجربتك التعليمية أو أي من هذه السياسات.",
    contactAction: "تواصل مع CrestMark Academy",
    documents: {
      privacy: "الخصوصية",
      terms: "الشروط",
      cookies: "ملفات الارتباط",
      refunds: "الاسترجاع",
      accessibility: "إمكانية الوصول",
    },
  },
} as const;

export function generateStaticParams() {
  return (["en", "ar"] as const).flatMap((locale) =>
    documentKeys.map((document) => ({
      locale,
      document,
    }))
  );
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale, document } = await params;

  if (
    (locale !== "en" && locale !== "ar") ||
    !isDocumentKey(document)
  ) {
    return {};
  }

  const page = content[locale][document];

  return {
    title: `${page.title} | CrestMark Academy`,
    description: page.description,
    alternates: {
      canonical: `/${locale}/legal/${document}`,
      languages: {
        en: `/en/legal/${document}`,
        ar: `/ar/legal/${document}`,
      },
    },
  };
}

  async function LegalDocumentContent({
  params,
}: Props) {
  const { locale: rawLocale, document } = await params;

  if (
    (rawLocale !== "en" && rawLocale !== "ar") ||
    !isDocumentKey(document)
  ) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const page = content[locale][document];
  const t = ui[locale];

  return (
    <main
      className={styles.page}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.container}>
        <nav
          className={styles.breadcrumb}
          aria-label="Breadcrumb"
        >
          <Link href={`/${locale}`}>{t.home}</Link>
          <span aria-hidden="true">/</span>
          <span>{t.legal}</span>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{page.title}</span>
        </nav>

        <header className={styles.hero}>
          <span className={styles.eyebrow}>
            CRESTMARK ACADEMY / {t.allDocuments}
          </span>

          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </header>

        <div className={styles.documentLayout}>
          <aside className={styles.sidebar}>
            <nav aria-label={t.legal}>
              <span className={styles.sidebarTitle}>
                {t.legal}
              </span>

              {documentKeys.map((key) => (
                <Link
                  key={key}
                  href={`/${locale}/legal/${key}`}
                  className={`${styles.sidebarLink} ${
                    key === document ? styles.selected : ""
                  }`}
                  aria-current={
                    key === document ? "page" : undefined
                  }
                >
                  {t.documents[key]}
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </nav>
          </aside>

          <article className={styles.article}>
            <div className={styles.articleIntro}>
              <span>CRESTMARK / {document.toUpperCase()}</span>
              <span>{String(page.sections.length).padStart(2, "0")} SECTIONS</span>
            </div>

            {page.sections.map((section, index) => (
              <section
                className={styles.documentSection}
                key={section.title}
                id={`section-${index + 1}`}
              >
                <span className={styles.sectionNumber}>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <div className={styles.contactBlock}>
              <span>{t.contents}</span>
              <h2>{t.contactTitle}</h2>
              <p>{t.contactText}</p>
              <Link href={`/${locale}/contact`}>
                {t.contactAction}
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
export default function LegalDocumentPage({
  params,
}: Props) {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div
            className={styles.container}
            role="status"
            aria-live="polite"
          >
            <p>Loading document...</p>
          </div>
        </main>
      }
    >
      <LegalDocumentContent params={params} />
    </Suspense>
  );
}