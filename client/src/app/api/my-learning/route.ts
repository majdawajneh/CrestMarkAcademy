
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

type Enrollment = {
  enrollmentId: number;
  courseId: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  enrollmentStatus: string;
  enrolledAt: string;
  completedAt: string | null;
};

function reply(data: unknown, status: number) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return reply(
      { message: "Authentication required." },
      401
    );
  }

  try {
    const response = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/my-learning`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }
    );

    if (response.status === 401) {
      return reply({ message: "Session expired." }, 401);
    }

    if (response.status === 403) {
      return reply({ message: "Access denied." }, 403);
    }

    if (!response.ok) {
      return reply(
        { message: "Unable to load your courses." },
        502
      );
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return reply(
        { message: "Invalid course data." },
        502
      );
    }

    const valid = data.every((item: unknown) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const value = item as Record<string, unknown>;

      return (
        typeof value.enrollmentId === "number" &&
        typeof value.courseId === "number" &&
        typeof value.title === "string" &&
        typeof value.slug === "string" &&
        (value.thumbnailUrl === null ||
          typeof value.thumbnailUrl === "string") &&
        typeof value.enrollmentStatus === "string" &&
        typeof value.enrolledAt === "string" &&
        (value.completedAt === null ||
          typeof value.completedAt === "string")
      );
    });

    if (!valid) {
      return reply(
        { message: "Invalid course data." },
        502
      );
    }

    const enrollments: Enrollment[] = data.map(
      (item: Enrollment) => ({
        enrollmentId: item.enrollmentId,
        courseId: item.courseId,
        title: item.title,
        slug: item.slug,
        thumbnailUrl: item.thumbnailUrl,
        enrollmentStatus: item.enrollmentStatus,
        enrolledAt: item.enrolledAt,
        completedAt: item.completedAt,
      })
    );

    return reply(enrollments, 200);
  } catch {
    return reply(
      { message: "Learning service unavailable." },
      502
    );
  }
}
