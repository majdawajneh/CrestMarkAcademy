
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type Context = {
  params: Promise<{ lessonId: string; itemId: string }>;
};

const headers = { "Cache-Control": "no-store" };

function fail(message: string, status: number) {
  return NextResponse.json({ message }, { status, headers });
}

function parseId(raw: string) {
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id <= 2147483647
    ? id
    : null;
}

async function prepare(
  request: NextRequest,
  context: Context,
  mutation: boolean
) {
  const { lessonId: rawLessonId, itemId: rawItemId } =
    await context.params;

  const lessonId = parseId(rawLessonId);
  const resourceId = parseId(rawItemId);

  if (lessonId === null || resourceId === null) {
    return { error: fail("Invalid lesson or resource ID.", 400) };
  }

  if (mutation) {
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return { error: fail("Invalid request origin.", 403) };
    }
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return { error: fail("Authentication required.", 401) };
  }

  try {
    const response = await fetch(`${API_URL}/api/Auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401) {
      return { error: fail("Session expired.", 401) };
    }

    if (response.status === 403) {
      return { error: fail("Access denied.", 403) };
    }

    if (!response.ok) {
      return { error: fail("Authentication service unavailable.", 502) };
    }

    const user: unknown = await response.json();

    if (!user || typeof user !== "object" || Array.isArray(user)) {
      return { error: fail("Invalid authentication response.", 502) };
    }

    const roles = (user as { roles?: unknown }).roles;

    if (!Array.isArray(roles)) {
      return { error: fail("Invalid authentication response.", 502) };
    }

    if (!roles.includes("Admin")) {
      return { error: fail("Administrator access required.", 403) };
    }
  } catch {
    return { error: fail("Authentication service unavailable.", 502) };
  }

  return { lessonId, resourceId, token };
}

function validBody(value: unknown): value is {
  title: string;
  resourceUrl: string;
  resourceType: string;
  orderIndex: number;
  isDownloadable: boolean;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.title === "string" &&
    data.title.trim().length > 0 &&
    typeof data.resourceUrl === "string" &&
    /^https?:\/\/\S+$/i.test(data.resourceUrl.trim()) &&
    typeof data.resourceType === "string" &&
    data.resourceType.trim().length > 0 &&
    typeof data.orderIndex === "number" &&
    Number.isInteger(data.orderIndex) &&
    data.orderIndex >= 0 &&
    data.orderIndex <= 2147483647 &&
    typeof data.isDownloadable === "boolean"
  );
}

async function forward(response: Response) {
  if (response.status === 204) {
    return new NextResponse(null, { status: 204, headers });
  }

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: {
      ...headers,
      "Content-Type":
        response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function GET(
  request: NextRequest,
  context: Context
) {
  const result = await prepare(request, context, false);
  if (result.error) return result.error;

  const { lessonId, resourceId, token } = result;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/lessons/${lessonId}/resources/${resourceId}`,
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
    return fail("Unable to load resource.", 502);
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

  if (!validBody(body)) {
    return fail("Invalid resource information.", 400);
  }

  const { lessonId, resourceId, token } = result;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/lessons/${lessonId}/resources/${resourceId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: body.title.trim(),
          resourceUrl: body.resourceUrl.trim(),
          resourceType: body.resourceType.trim(),
          orderIndex: body.orderIndex,
          isDownloadable: body.isDownloadable,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    return forward(response);
  } catch {
    return fail("Unable to update resource.", 502);
  }
}

export async function DELETE(
  request: NextRequest,
  context: Context
) {
  const result = await prepare(request, context, true);
  if (result.error) return result.error;

  const { lessonId, resourceId, token } = result;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/lessons/${lessonId}/resources/${resourceId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    return forward(response);
  } catch {
    return fail("Unable to delete resource.", 502);
  }
}
