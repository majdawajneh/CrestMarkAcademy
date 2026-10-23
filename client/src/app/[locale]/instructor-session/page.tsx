
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";

type RecoveryState = "checking" | "error";

export default function InstructorSessionPage() {
  const params = useParams<{ locale: string }>();
  const router = useRouter();

  const locale = params.locale === "ar" ? "ar" : "en";

  const [state, setState] = useState<RecoveryState>("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function recoverSession() {
      try {
        const result = await getCurrentSession();

        if (!active) return;

        if (result.status === "authenticated") {
          const isInstructor = result.user.roles.some(
            (role) => role.toLowerCase() === "instructor"
          );

          if (isInstructor) {
            router.replace(`/${locale}/instructor`);
          } else {
            router.replace(`/${locale}`);
          }

          return;
        }

        if (result.status === "guest") {
          router.replace(`/${locale}/login`);
          return;
        }

        setState("error");
      } catch {
        if (active) {
          setState("error");
        }
      }
    }

    void recoverSession();

    return () => {
      active = false;
    };
  }, [locale, router, attempt]);

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
      <section
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
              ? "جارٍ استعادة جلسة المحاضر..."
              : "Restoring your instructor session..."
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
              ? "يرجى الانتظار أثناء التحقق من صلاحية حسابك."
              : "Please wait while we verify your account."
            : locale === "ar"
              ? "حدث خطأ مؤقت أثناء التحقق من الجلسة."
              : "A temporary error occurred while verifying your session."}
        </p>

        {state === "error" && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 20,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setState("checking");
                setAttempt((value) => value + 1);
              }}
              style={{
                padding: "11px 18px",
                border: 0,
                borderRadius: 8,
                background: "#153e68",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {locale === "ar" ? "إعادة المحاولة" : "Try again"}
            </button>

            <Link
              href={`/${locale}/login`}
              style={{
                padding: "11px 18px",
                borderRadius: 8,
                color: "#153e68",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              {locale === "ar" ? "تسجيل الدخول" : "Log in"}
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
