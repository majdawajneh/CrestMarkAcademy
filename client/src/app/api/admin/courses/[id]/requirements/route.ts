
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type Context = {
  params: Promise<{ id: string }>;
};

function error(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

async function verifyAdmin(token: string) {
  try {
    const response = await fetch(`${API_URL}/api/Auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401) return 401;
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

    if (!Array.isArray(roles)) return 502;

    return roles.includes("Admin") ? 200 : 403;
  } catch {
    return 502;
  }
}

function validCourseId(rawId: string) {
  const id = Number(rawId);

  if (
    !/^[1-9]\d*$/.test(rawId) ||
    !Number.isSafeInteger(id)
  ) {
    return null;
  }

  return id;
}

export async function GET(
  request: NextRequest,
  context: Context
) {
  const { id: rawId } = await context.params;
  const id = validCourseId(rawId);

  if (id === null) return error("Invalid course ID.", 400);

  const token = request.cookies.get("cm_access")?.value;

  if (!token) return error("Authentication required.", 401);

  const permission = await verifyAdmin(token);

  if (permission !== 200) {
    return error("Authorization failed.", permission);
  }

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${id}/requirements`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ??
          "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return error("Requirements service unavailable.", 502);
  }
}

export async function POST(
  request: NextRequest,
  context: Context
) {
  const { id: rawId } = await context.params;
  const id = validCourseId(rawId);

  if (id === null) return error("Invalid course ID.", 400);

  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return error("Invalid request origin.", 403);
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) return error("Authentication required.", 401);

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return error("Invalid JSON body.", 400);
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return error("Invalid requirement.", 400);
  }

  const payload = body as Record<string, unknown>;

  if (
    typeof payload.requirement !== "string" ||
    !payload.requirement.trim() ||
    !Number.isSafeInteger(payload.orderIndex) ||
    Number(payload.orderIndex) < 0 ||
    Number(payload.orderIndex) > 2147483647
  ) {
    return error("Invalid requirement information.", 400);
  }

  const permission = await verifyAdmin(token);

  if (permission !== 200) {
    return error("Authorization failed.", permission);
  }

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${id}/requirements`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requirement: payload.requirement.trim(),
          orderIndex: payload.orderIndex,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ??
          "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return error("Unable to create requirement.", 502);
  }
}
