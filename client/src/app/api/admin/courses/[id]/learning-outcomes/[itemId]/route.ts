
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

const noStore = {
  "Cache-Control": "no-store",
};

type Context = {
  params: Promise<{
    id: string;
    itemId: string;
  }>;
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

async function getAuthorizedContext(
  request: NextRequest,
  context: Context,
  checkOrigin: boolean
) {
  const { id, itemId } = await context.params;

  const courseId = validId(id);
  const outcomeId = validId(itemId);

  if (courseId === null || outcomeId === null) {
    return {
      error: errorResponse("Invalid ID.", 400),
    };
  }

  if (checkOrigin) {
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return {
        error: errorResponse("Invalid request origin.", 403),
      };
    }
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return {
      error: errorResponse("Authentication required.", 401),
    };
  }

  const permission = await verifyAdmin(token);

  if (permission !== 200) {
    return {
      error: errorResponse(
        permission === 401
          ? "Session expired."
          : permission === 403
            ? "Administrator access required."
            : "Unable to verify administrator permissions.",
        permission
      ),
    };
  }

  return { courseId, outcomeId, token };
}

/* =========================
   GET Learning Outcome By ID
========================= */

export async function GET(
  request: NextRequest,
  context: Context
) {
  const result = await getAuthorizedContext(
    request,
    context,
    false
  );

  if ("error" in result) {
    return result.error;
  }

  const { courseId, outcomeId, token } = result;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${courseId}/learning-outcomes/${outcomeId}`,
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
      "Unable to load learning outcome.",
      502
    );
  }
}

/* =========================
   PUT Update Learning Outcome
========================= */

export async function PUT(
  request: NextRequest,
  context: Context
) {
  const result = await getAuthorizedContext(
    request,
    context,
    true
  );

  if ("error" in result) {
    return result.error;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return errorResponse(
      "Invalid learning outcome information.",
      400
    );
  }

  const data = body as Record<string, unknown>;

  if (
    typeof data.outcome !== "string" ||
    !data.outcome.trim() ||
    typeof data.orderIndex !== "number" ||
    !Number.isSafeInteger(data.orderIndex) ||
    data.orderIndex < 0 ||
    data.orderIndex > 2147483647
  ) {
    return errorResponse(
      "Invalid learning outcome information.",
      400
    );
  }

  const { courseId, outcomeId, token } = result;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${courseId}/learning-outcomes/${outcomeId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outcome: data.outcome.trim(),
          orderIndex: data.orderIndex,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    return forwardResponse(response);
  } catch {
    return errorResponse(
      "Unable to update learning outcome.",
      502
    );
  }
}

/* =========================
   DELETE Learning Outcome
========================= */

export async function DELETE(
  request: NextRequest,
  context: Context
) {
  const result = await getAuthorizedContext(
    request,
    context,
    true
  );

  if ("error" in result) {
    return result.error;
  }

  const { courseId, outcomeId, token } = result;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${courseId}/learning-outcomes/${outcomeId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    return forwardResponse(response);
  } catch {
    return errorResponse(
      "Unable to delete learning outcome.",
      502
    );
  }
}
