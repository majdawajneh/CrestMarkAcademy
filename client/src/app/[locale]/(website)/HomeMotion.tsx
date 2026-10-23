"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./page.module.css";

export default function HomeMotion({
  locale,
  children,
}: {
  locale: "en" | "ar";
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const elements = root.querySelectorAll<HTMLElement>("[data-cm-reveal]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.cmVisible = "true";
          observer.unobserve(entry.target);
        }
      }
    }, { rootMargin: "0px 0px -30px 0px", threshold: 0.06 });

    elements.forEach((item) => observer.observe(item));
    root.dataset.motionReady = "true";
    return () => {
      observer.disconnect();
      delete root.dataset.motionReady;
    };
  }, []);

  return <main ref={ref} className={styles.page} dir={locale === "ar" ? "rtl" : "ltr"}>{children}</main>;
}
