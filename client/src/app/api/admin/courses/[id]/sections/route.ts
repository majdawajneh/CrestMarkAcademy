
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type Context = {
  params: Promise<{ id: string }>;
};

const noStore = {
  "Cache-Control": "no-store",
};

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: noStore }
  );
}

function validCourseId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;

  const id = Number(value);

  return Number.isSafeInteger(id) && id <= 2147483647
    ? id
    : null;
}

async function verifyAdmin(
  token: string
): Promise<200 | 401 | 403 | 502> {
  try {
    const response = await fetch(`${API_URL}/api/Auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401) return 401;
    if (response.status === 403) return 403;
    if (!response.ok) return 502;

    const user: unknown = await response.json();

    if (
      !user ||
      typeof user !== "object" ||
      Array.isArray(user)
    ) {
      return 502;
    }

    const roles = (user as { roles?: unknown }).roles;

    if (
      !Array.isArray(roles) ||
      !roles.every((role) => typeof role === "string")
    ) {
      return 502;
    }

    return roles.includes("Admin") ? 200 : 403;
  } catch {
    return 502;
  }
}

function validSectionBody(
  value: unknown
): value is {
  title: string;
  description: string;
  orderIndex: number;
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
    typeof data.orderIndex === "number" &&
    Number.isInteger(data.orderIndex) &&
    data.orderIndex >= 0 &&
    data.orderIndex <= 2147483647
  );
}

async function forwardResponse(response: Response) {
  if (response.status === 204) {
    return new NextResponse(null, {
      status: 204,
      headers: noStore,
    });
  }

  const content = await response.text();

  return new NextResponse(content, {
    status: response.status,
    headers: {
      ...noStore,
      "Content-Type":
        response.headers.get("content-type") ??
        "application/json",
    },
  });
}

/* =========================
   GET - All Course Sections
========================= */

export async function GET(
  request: NextRequest,
  context: Context
) {
  const { id: rawId } = await context.params;
  const courseId = validCourseId(rawId);

  if (courseId === null) {
    return errorResponse("Invalid course ID.", 400);
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return errorResponse("Authentication required.", 401);
  }

  const permission = await verifyAdmin(token);

  if (permission !== 200) {
    return errorResponse(
      permission === 401
        ? "Session expired."
        : permission === 403
          ? "Administrator access required."
          : "Unable to verify administrator permissions.",
      permission
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${courseId}/sections`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    return forwardResponse(response);
  } catch {
    return errorResponse(
      "Course sections service unavailable.",
      502
    );
  }
}

/* =========================
   POST - Create Course Section
========================= */

export async function POST(
  request: NextRequest,
  context: Context
) {
  const { id: rawId } = await context.params;
  const courseId = validCourseId(rawId);

  if (courseId === null) {
    return errorResponse("Invalid course ID.", 400);
  }

  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return errorResponse("Invalid request origin.", 403);
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return errorResponse("Authentication required.", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  if (!validSectionBody(body)) {
    return errorResponse(
      "Invalid course section information.",
      400
    );
  }

  const permission = await verifyAdmin(token);

  if (permission !== 200) {
    return errorResponse(
      permission === 401
        ? "Session expired."
        : permission === 403
          ? "Administrator access required."
          : "Unable to verify administrator permissions.",
      permission
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${courseId}/sections`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: body.title.trim(),
          description: body.description.trim(),
          orderIndex: body.orderIndex,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    return forwardResponse(response);
  } catch {
    return errorResponse(
      "Unable to create course section.",
      502
    );
  }
}
