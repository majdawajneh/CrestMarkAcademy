
import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: Promise<{
    courseId: string;
  }>;
};

type LastLessonResponse = {
  courseId: number;
  lastAccessedLessonId: number | null;
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

function validLastLessonResponse(
  data: unknown,
  courseId: number
): data is LastLessonResponse {
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
    (
      value.lastAccessedLessonId === null ||
      (
        typeof value.lastAccessedLessonId === "number" &&
        Number.isSafeInteger(value.lastAccessedLessonId) &&
        value.lastAccessedLessonId > 0
      )
    )
  );
}

// =====================================
// GET: Restore Last Accessed Lesson
// =====================================

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
      `${API_URL.replace(/\/$/, "")}/api/my-learning/${courseId}/last-lesson`,
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
        { message: "Course enrollment not found." },
        404
      );
    }

    if (!response.ok) {
      return reply(
        { message: "Unable to load last lesson." },
        502
      );
    }

    const data: unknown = await response.json();

    if (
      !validLastLessonResponse(
        data,
        Number(courseId)
      )
    ) {
      return reply(
        { message: "Invalid last lesson response." },
        502
      );
    }

    return reply(data, 200);
  } catch {
    return reply(
      { message: "Learning service unavailable." },
      502
    );
  }
}

// =====================================
// PUT: Save Last Accessed Lesson
// =====================================

export async function PUT(
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
      { message: "Invalid request body." },
      400
    );
  }

  const input = body as Record<string, unknown>;

  if (
    typeof input.lessonId !== "number" ||
    !Number.isSafeInteger(input.lessonId) ||
    input.lessonId <= 0
  ) {
    return reply(
      { message: "Invalid lesson ID." },
      400
    );
  }

  try {
    const response = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/my-learning/${courseId}/last-lesson`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          lessonId: input.lessonId,
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
        { message: "Lesson not found in course." },
        404
      );
    }

    if (!response.ok) {
      return reply(
        { message: "Unable to save last lesson." },
        502
      );
    }

    const data: unknown = await response.json();

    if (
      !validLastLessonResponse(
        data,
        Number(courseId)
      ) ||
      data.lastAccessedLessonId !== input.lessonId
    ) {
      return reply(
        { message: "Invalid last lesson response." },
        502
      );
    }

    return reply(data, 200);
  } catch {
    return reply(
      { message: "Learning service unavailable." },
      502
    );
  }
}
