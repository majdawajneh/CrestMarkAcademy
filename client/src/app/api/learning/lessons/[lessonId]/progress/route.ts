
import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: Promise<{ lessonId: string }>;
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

function validLessonId(lessonId: string) {
  return (
    /^[1-9]\d*$/.test(lessonId) &&
    Number.isSafeInteger(Number(lessonId))
  );
}

// GET: Restore the saved lesson progress.
export async function GET(
  request: NextRequest,
  { params }: Context
) {
  const { lessonId } = await params;

  if (!validLessonId(lessonId)) {
    return reply(
      { message: "Invalid lesson ID." },
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
      `${API_URL.replace(/\/$/, "")}/api/lessons/${lessonId}/progress`,
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
        { message: "Progress not found." },
        404
      );
    }

    if (!response.ok) {
      return reply(
        { message: "Unable to load lesson progress." },
        502
      );
    }

    const data: unknown = await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return reply(
        { message: "Invalid progress response." },
        502
      );
    }

    const progress = data as Record<string, unknown>;

    // New lessons may not have a persisted progress
    // record yet. The backend can therefore omit
    // id, enrollmentId and updatedAt.
    if (
      progress.lessonId !== Number(lessonId) ||
      typeof progress.isCompleted !== "boolean" ||
      !Number.isInteger(progress.lastPositionSeconds) ||
      (progress.lastPositionSeconds as number) < 0 ||
      (progress.lastPositionSeconds as number) > 2147483647 ||
      (progress.completedAt !== null &&
        progress.completedAt !== undefined &&
        typeof progress.completedAt !== "string") ||
      (progress.id !== undefined &&
        (!Number.isSafeInteger(progress.id) ||
          (progress.id as number) <= 0)) ||
      (progress.enrollmentId !== undefined &&
        (!Number.isSafeInteger(progress.enrollmentId) ||
          (progress.enrollmentId as number) <= 0)) ||
      (progress.updatedAt !== undefined &&
        typeof progress.updatedAt !== "string")
    ) {
      return reply(
        { message: "Invalid progress response." },
        502
      );
    }

    return reply(
      {
        id: progress.id,
        enrollmentId: progress.enrollmentId,
        lessonId: progress.lessonId,
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt ?? null,
        lastPositionSeconds: progress.lastPositionSeconds,
        updatedAt: progress.updatedAt,
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

// PUT: Save the lesson position and completion state.
export async function PUT(
  request: NextRequest,
  { params }: Context
) {
  const { lessonId } = await params;

  if (!validLessonId(lessonId)) {
    return reply(
      { message: "Invalid lesson ID." },
      400
    );
  }

  const origin = request.headers.get("origin");

  if (
    !origin ||
    origin !== new URL(request.url).origin
  ) {
    return reply(
      { message: "Invalid origin." },
      403
    );
  }

  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return reply(
      { message: "Expected JSON." },
      415
    );
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return reply(
      { message: "Authentication required." },
      401
    );
  }

  let body: unknown;

  try {
    const raw = await request.text();

    if (raw.length > 1024) {
      return reply(
        { message: "Request too large." },
        413
      );
    }

    body = JSON.parse(raw);
  } catch {
    return reply(
      { message: "Invalid JSON." },
      400
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return reply(
      { message: "Invalid progress data." },
      400
    );
  }

  const input = body as Record<string, unknown>;

  if (
    !Number.isSafeInteger(input.lastPositionSeconds) ||
    (input.lastPositionSeconds as number) < 0 ||
    (input.lastPositionSeconds as number) > 2147483647 ||
    typeof input.isCompleted !== "boolean"
  ) {
    return reply(
      { message: "Invalid progress data." },
      400
    );
  }

  try {
    const response = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/lessons/${lessonId}/progress`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          lastPositionSeconds: input.lastPositionSeconds,
          isCompleted: input.isCompleted,
        }),
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
        { message: "Lesson not found." },
        404
      );
    }

    if (!response.ok) {
      return reply(
        { message: "Unable to update lesson progress." },
        502
      );
    }

    return reply(
      { success: true },
      200
    );
  } catch {
    return reply(
      { message: "Progress service unavailable." },
      502
    );
  }
}
