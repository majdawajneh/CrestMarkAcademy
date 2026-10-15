
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type Context = {
  params: Promise<{ lessonId: string }>;
};

const headers = { "Cache-Control": "no-store" };

function fail(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers }
  );
}

function parseId(raw: string) {
  if (!/^[1-9]\d*$/.test(raw)) return null;

  const id = Number(raw);

  return Number.isSafeInteger(id) && id <= 2147483647
    ? id
    : null;
}

async function authorize(request: NextRequest) {
  const token = request.cookies.get("cm_access")?.value;
  if (!token) return { status: 401 as const };

  try {
    const response = await fetch(`${API_URL}/api/Auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401) return { status: 401 as const };
    if (response.status === 403) return { status: 403 as const };
    if (!response.ok) return { status: 502 as const };

    const data: unknown = await response.json();

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { status: 502 as const };
    }

    const roles = (data as { roles?: unknown }).roles;

    if (!Array.isArray(roles)) return { status: 502 as const };

    return roles.includes("Admin")
      ? { status: 200 as const, token }
      : { status: 403 as const };
  } catch {
    return { status: 502 as const };
  }
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
    data.resourceUrl.trim().length > 0 &&
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

function authError(status: 401 | 403 | 502) {
  return fail(
    status === 401
      ? "Authentication required."
      : status === 403
        ? "Administrator access required."
        : "Authentication service unavailable.",
    status
  );
}

export async function GET(
  request: NextRequest,
  context: Context
) {
  const { lessonId: raw } = await context.params;
  const lessonId = parseId(raw);

  if (lessonId === null) return fail("Invalid lesson ID.", 400);

  const auth = await authorize(request);
  if (auth.status !== 200) return authError(auth.status);

  try {
    const response = await fetch(
      `${API_URL}/api/admin/lessons/${lessonId}/resources`,
      {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    return forward(response);
  } catch {
    return fail("Unable to load lesson resources.", 502);
  }
}

export async function POST(
  request: NextRequest,
  context: Context
) {
  const { lessonId: raw } = await context.params;
  const lessonId = parseId(raw);

  if (lessonId === null) return fail("Invalid lesson ID.", 400);

  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return fail("Invalid request origin.", 403);
  }

  const auth = await authorize(request);
  if (auth.status !== 200) return authError(auth.status);

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body.", 400);
  }

  if (!validBody(body)) {
    return fail("Invalid resource information.", 400);
  }

  try {
    const response = await fetch(
      `${API_URL}/api/admin/lessons/${lessonId}/resources`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
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
    return fail("Unable to create lesson resource.", 502);
  }
}
