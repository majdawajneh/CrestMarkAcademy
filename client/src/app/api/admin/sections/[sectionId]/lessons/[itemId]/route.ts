
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type Context = {
  params: Promise<{
    sectionId: string;
    itemId: string;
  }>;
};

const noStore = { "Cache-Control": "no-store" };

function fail(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: noStore }
  );
}

function parseId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;

  const id = Number(value);

  return Number.isSafeInteger(id) && id <= 2147483647
    ? id
    : null;
}

async function authorize(request: NextRequest) {
  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return { status: 401 as const };
  }

  try {
    const response = await fetch(`${API_URL}/api/Auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401)
      return { status: 401 as const };

    if (response.status === 403)
      return { status: 403 as const };

    if (!response.ok)
      return { status: 502 as const };

    const user: unknown = await response.json();

    if (
      !user ||
      typeof user !== "object" ||
      Array.isArray(user)
    ) {
      return { status: 502 as const };
    }

    const roles = (user as { roles?: unknown }).roles;

    if (!Array.isArray(roles)) {
      return { status: 502 as const };
    }

    return roles.includes("Admin")
      ? { status: 200 as const, token }
      : { status: 403 as const };
  } catch {
    return { status: 502 as const };
  }
}

async function prepare(
  request: NextRequest,
  context: Context,
  mutation: boolean
) {
  const { sectionId: rawSectionId, itemId: rawItemId } =
    await context.params;

  const sectionId = parseId(rawSectionId);
  const lessonId = parseId(rawItemId);

  if (sectionId === null || lessonId === null) {
    return {
      error: fail("Invalid section or lesson ID.", 400),
    };
  }

  if (mutation) {
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return {
        error: fail("Invalid request origin.", 403),
      };
    }
  }

  const auth = await authorize(request);

  if (auth.status !== 200) {
    return {
      error: fail(
        auth.status === 401
          ? "Authentication required."
          : auth.status === 403
            ? "Administrator access required."
            : "Authentication service unavailable.",
        auth.status
      ),
    };
  }

  return { sectionId, lessonId, token: auth.token };
}

async function forward(response: Response) {
  if (response.status === 204) {
    return new NextResponse(null, {
      status: 204,
      headers: noStore,
    });
  }

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: {
      ...noStore,
      "Content-Type":
        response.headers.get("content-type") ??
        "application/json",
    },
  });
}

function validLessonBody(
  value: unknown
): value is {
  title: string;
  description: string;
  lessonType: string;
  videoUrl: string;
  audioUrl: string;
  content: string;
  durationSeconds: number;
  orderIndex: number;
  isPreview: boolean;
  isPublished: boolean;
} {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.title === "string" &&
    data.title.trim().length > 0 &&
    typeof data.description === "string" &&
    typeof data.lessonType === "string" &&
    data.lessonType.trim().length > 0 &&
    typeof data.videoUrl === "string" &&
    typeof data.audioUrl === "string" &&
    typeof data.content === "string" &&
    typeof data.durationSeconds === "number" &&
    Number.isInteger(data.durationSeconds) &&
    data.durationSeconds >= 0 &&
    data.durationSeconds <= 2147483647 &&
    typeof data.orderIndex === "number" &&
    Number.isInteger(data.orderIndex) &&
    data.orderIndex >= 0 &&
    data.orderIndex <= 2147483647 &&
    typeof data.isPreview === "boolean" &&
    typeof data.isPublished === "boolean"
  );
}

export async function GET(
  request: NextRequest,
  context: Context
) {
  const result = await prepare(request, context, false);

  if (result.error) return result.error;

  const { sectionId, lessonId, token } = result;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/sections/${sectionId}/lessons/${lessonId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    return forward(response);
  } catch {
    return fail("Unable to load lesson.", 502);
  }
}

export async function PUT(
  request: NextRequest,
  context: Context
) {
  const result = await prepare(request, context, true);

  if (result.error) return result.error;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body.", 400);
  }

  if (!validLessonBody(body)) {
    return fail("Invalid lesson information.", 400);
  }

  const { sectionId, lessonId, token } = result;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/sections/${sectionId}/lessons/${lessonId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: body.title.trim(),
          description: body.description.trim(),
          lessonType: body.lessonType.trim(),
          videoUrl: body.videoUrl.trim(),
          audioUrl: body.audioUrl.trim(),
          content: body.content,
          durationSeconds: body.durationSeconds,
          orderIndex: body.orderIndex,
          isPreview: body.isPreview,
          isPublished: body.isPublished,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    return forward(response);
  } catch {
    return fail("Unable to update lesson.", 502);
  }
}

export async function DELETE(
  request: NextRequest,
  context: Context
) {
  const result = await prepare(request, context, true);

  if (result.error) return result.error;

  const { sectionId, lessonId, token } = result;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/sections/${sectionId}/lessons/${lessonId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    return forward(response);
  } catch {
    return fail("Unable to delete lesson.", 502);
  }
}
