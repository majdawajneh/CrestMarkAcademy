
import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: Promise<{ courseId: string }>;
};

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

function reply(data: unknown, status: number) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  const { courseId } = await params;

  if (!/^[1-9]\d*$/.test(courseId)) {
    return reply({ message: "Invalid course ID." }, 400);
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return reply({ message: "Authentication required." }, 401);
  }

  try {
    const response = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/courses/${courseId}/progress`,
      {
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
        { message: "Unable to load course progress." },
        502
      );
    }

    const data: unknown = await response.json();

    if (!data || typeof data !== "object") {
      return reply({ message: "Invalid progress data." }, 502);
    }

    const progress = data as Record<string, unknown>;

    if (
      typeof progress.courseId !== "number" ||
      progress.courseId !== Number(courseId) ||
      typeof progress.enrollmentId !== "number" ||
      typeof progress.totalLessons !== "number" ||
      typeof progress.completedLessons !== "number" ||
      typeof progress.progressPercentage !== "number" ||
      typeof progress.isCourseCompleted !== "boolean" ||
      !Number.isFinite(progress.progressPercentage) ||
      progress.progressPercentage < 0 ||
      progress.progressPercentage > 100 ||
      progress.totalLessons < 0 ||
      progress.completedLessons < 0 ||
      progress.completedLessons > progress.totalLessons
    ) {
      return reply({ message: "Invalid progress data." }, 502);
    }

    return reply(
      {
        courseId: progress.courseId,
        enrollmentId: progress.enrollmentId,
        totalLessons: progress.totalLessons,
        completedLessons: progress.completedLessons,
        progressPercentage: progress.progressPercentage,
        isCourseCompleted: progress.isCourseCompleted,
      },
      200
    );
  } catch {
    return reply(
      { message: "Progress service unavailable." },
      502
    );
  }
}
