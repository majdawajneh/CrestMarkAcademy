
"use client";

import { useState } from "react";
import styles from "./CoursePreview.module.css";

type Props = {
  videoUrl: string;
  posterUrl?: string | null;
  locale: "en" | "ar";
};

type VideoSource =
  | { type: "file"; url: string }
  | { type: "youtube"; url: string }
  | { type: "unsupported" };

function resolveVideoSource(value: string): VideoSource {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return { type: "unsupported" };
    }

    if (url.username || url.password) {
      return { type: "unsupported" };
    }

    const host = url.hostname.toLowerCase();
    const path = url.pathname;

    // Direct video files
    if (/\.(mp4|webm|ogg)$/i.test(path)) {
      return {
        type: "file",
        url: url.toString(),
      };
    }

    // YouTube
    let videoId: string | null = null;

    if (host === "youtu.be" || host === "www.youtu.be") {
      videoId = path.split("/")[1] ?? null;
    } else if (
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com"
    ) {
      if (path === "/watch") {
        videoId = url.searchParams.get("v");
      } else if (
        path.startsWith("/shorts/") ||
        path.startsWith("/embed/")
      ) {
        videoId = path.split("/")[2] ?? null;
      }
    }

    if (videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      return {
        type: "youtube",
        url: `https://www.youtube-nocookie.com/embed/${videoId}`,
      };
    }

    return { type: "unsupported" };
  } catch {
    return { type: "unsupported" };
  }
}

export default function CoursePreview({
  videoUrl,
  posterUrl,
  locale,
}: Props) {
  const [failed, setFailed] = useState(false);
  const source = resolveVideoSource(videoUrl);

  const isArabic = locale === "ar";

  if (source.type === "unsupported" || failed) {
    return (
      <div className={styles.unavailable} role="status">
        <span className={styles.icon} aria-hidden="true">
          ▶
        </span>

        <h3>
          {isArabic
            ? "معاينة الفيديو غير متاحة حاليًا"
            : "Video preview unavailable"}
        </h3>

        <p>
          {isArabic
            ? "رابط الفيديو الحالي غير مدعوم أو تعذّر تحميله. يرجى المحاولة لاحقًا."
            : "This video link is unsupported or couldn't be loaded. Please try again later."}
        </p>
      </div>
    );
  }

  if (source.type === "youtube") {
    return (
      <div className={styles.player}>
        <iframe
          src={source.url}
          title={
            isArabic ? "معاينة فيديو الدورة" : "Course video preview"
          }
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className={styles.player}>
      <video
        controls
        playsInline
        preload="metadata"
        poster={posterUrl ?? undefined}
        onError={() => setFailed(true)}
        aria-label={
          isArabic ? "معاينة فيديو الدورة" : "Course video preview"
        }
      >
        <source
          src={source.url}
          type={
            /\.webm$/i.test(new URL(source.url).pathname)
              ? "video/webm"
              : /\.ogg$/i.test(new URL(source.url).pathname)
                ? "video/ogg"
                : "video/mp4"
          }
        />
      </video>
    </div>
  );
}
