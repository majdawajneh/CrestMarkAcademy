
import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: Promise<{
    courseId: string;
  }>;
};

type CourseProgress = {
  courseId: number;
  enrollmentId: number;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  isCourseCompleted: boolean;
};

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

function reply(data: unknown, status: number) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

function validId(value: string): boolean {
  return (
    /^[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value))
  );
}

function validProgress(
  data: unknown,
  courseId: number
): data is CourseProgress {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return false;
  }

  const value = data as Record<string, unknown>;

  return (
    value.courseId === courseId &&
    typeof value.enrollmentId === "number" &&
    Number.isSafeInteger(value.enrollmentId) &&
    value.enrollmentId > 0 &&
    typeof value.totalLessons === "number" &&
    Number.isSafeInteger(value.totalLessons) &&
    value.totalLessons >= 0 &&
    typeof value.completedLessons === "number" &&
    Number.isSafeInteger(value.completedLessons) &&
    value.completedLessons >= 0 &&
    value.completedLessons <= value.totalLessons &&
    typeof value.progressPercentage === "number" &&
    Number.isFinite(value.progressPercentage) &&
    value.progressPercentage >= 0 &&
    value.progressPercentage <= 100 &&
    typeof value.isCourseCompleted === "boolean" &&
    value.isCourseCompleted ===
      (value.totalLessons > 0 &&
        value.completedLessons === value.totalLessons)
  );
}

// GET: Load the authenticated student's course progress.
export async function GET(
  request: NextRequest,
  { params }: Context
) {
  const { courseId } = await params;

  if (!validId(courseId)) {
    return reply(
      { message: "Invalid course ID." },
      400
    );
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return reply(
      { message: "Authentication required." },
      401
    );
  }

  try {
    const response = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/courses/${courseId}/progress`,
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
      return reply(
        { message: "Session expired." },
        401
      );
    }

    if (response.status === 403) {
      return reply(
        { message: "Access denied." },
        403
      );
    }

    if (response.status === 404) {
      return reply(
        { message: "Course progress not found." },
        404
      );
    }

    if (!response.ok) {
      return reply(
        { message: "Unable to load course progress." },
        502
      );
    }

    const data: unknown = await response.json();

    if (!validProgress(data, Number(courseId))) {
      return reply(
        { message: "Invalid course progress response." },
        502
      );
    }

    return reply(data, 200);
  } catch {
    return reply(
      { message: "Progress service unavailable." },
      502
    );
  }
}
