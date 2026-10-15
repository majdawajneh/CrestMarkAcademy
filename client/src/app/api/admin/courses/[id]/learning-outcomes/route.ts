
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

const noStore = {
  "Cache-Control": "no-store",
};

type Context = {
  params: Promise<{ id: string }>;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: noStore }
  );
}

function validId(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null;

  const id = Number(raw);

  return Number.isSafeInteger(id) ? id : null;
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

    const data: unknown = await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return 502;
    }

    const roles = (data as { roles?: unknown }).roles;

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

function validOutcomeBody(value: unknown): value is {
  outcome: string;
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
    typeof data.outcome === "string" &&
    data.outcome.trim().length > 0 &&
    Number.isSafeInteger(data.orderIndex) &&
    typeof data.orderIndex === "number" &&
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
   GET All Learning Outcomes
========================= */

export async function GET(
  request: NextRequest,
  context: Context
) {
  const { id: rawId } = await context.params;
  const courseId = validId(rawId);

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
      `${API_URL}/api/admin/courses/${courseId}/learning-outcomes`,
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
      "Learning outcomes service unavailable.",
      502
    );
  }
}

/* =========================
   POST Create Learning Outcome
========================= */

export async function POST(
  request: NextRequest,
  context: Context
) {
  const { id: rawId } = await context.params;
  const courseId = validId(rawId);

  if (courseId === null) {
    return errorResponse("Invalid course ID.", 400);
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return errorResponse("Authentication required.", 401);
  }

  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return errorResponse("Invalid request origin.", 403);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  if (!validOutcomeBody(body)) {
    return errorResponse(
      "Invalid learning outcome information.",
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
      `${API_URL}/api/admin/courses/${courseId}/learning-outcomes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outcome: body.outcome.trim(),
          orderIndex: body.orderIndex,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    return forwardResponse(response);
  } catch {
    return errorResponse(
      "Unable to create learning outcome.",
      502
    );
  }
}
