
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";

type RecoveryState = "checking" | "error";

export default function AdminSessionPage() {
  const params = useParams<{ locale: string }>();
  const router = useRouter();

  const locale = params.locale === "ar" ? "ar" : "en";

  const [state, setState] = useState<RecoveryState>(
    "checking"
  );

  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;

    started.current = true;

    let cancelled = false;

    async function recoverSession() {
      try {
        const session = await getCurrentSession();

        if (cancelled) return;

        if (session.status === "authenticated") {
          if (session.user.roles.includes("Admin")) {
            router.replace(`/${locale}/admin`);
          } else {
            router.replace(`/${locale}`);
          }

          return;
        }

        if (session.status === "guest") {
          router.replace(`/${locale}/login`);
          return;
        }

        setState("error");
      } catch {
        if (!cancelled) {
          setState("error");
        }
      }
    }

    void recoverSession();

    return () => {
      cancelled = true;
    };
  }, [locale, router]);

  return (
    <main
      style={{
        minHeight: "65vh",
        display: "grid",
        placeItems: "center",
        padding: "40px 20px",
        background: "#f7faff",
      }}
    >
      <div
        role="status"
        style={{
          width: "100%",
          maxWidth: 440,
          padding: "38px 30px",
          border: "1px solid #dce7f2",
          borderRadius: 16,
          background: "#fff",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: "0 0 14px",
            color: "#12365b",
            fontSize: 23,
          }}
        >
          {state === "checking"
            ? locale === "ar"
              ? "جارٍ استعادة الجلسة..."
              : "Restoring your session..."
            : locale === "ar"
              ? "تعذّر استعادة الجلسة"
              : "Unable to restore session"}
        </h1>

        <p
          style={{
            color: "#627891",
            fontSize: 14,
            lineHeight: 1.8,
          }}
        >
          {state === "checking"
            ? locale === "ar"
              ? "يرجى الانتظار أثناء التحقق من صلاحية الدخول."
              : "Please wait while we verify your access."
            : locale === "ar"
              ? "حدث خطأ مؤقت أثناء التحقق. حاول مرة أخرى."
              : "A temporary error occurred. Please try again."}
        </p>

        {state === "error" && (
          <Link
            href={`/${locale}/login`}
            style={{
              display: "inline-block",
              marginTop: 16,
              padding: "12px 22px",
              borderRadius: 9,
              background: "#153e68",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            {locale === "ar"
              ? "تسجيل الدخول"
              : "Log in"}
          </Link>
        )}
      </div>
    </main>
  );
}
