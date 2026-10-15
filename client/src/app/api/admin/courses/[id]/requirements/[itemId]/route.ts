
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

function validId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;

  const id = Number(value);

  return Number.isSafeInteger(id) ? id : null;
}

async function verifyAdmin(
  token: string
): Promise<200 | 401 | 403 | 502> {
  try {
    const response = await fetch(
      `${API_URL}/api/Auth/me`,
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

async function getRequestContext(
  request: NextRequest,
  context: Context,
  requireOrigin: boolean
) {
  const { id, itemId } = await context.params;

  const courseId = validId(id);
  const requirementId = validId(itemId);

  if (courseId === null || requirementId === null) {
    return {
      error: errorResponse("Invalid ID.", 400),
    };
  }

  if (requireOrigin) {
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

  return { courseId, requirementId, token };
}

async function forwardResponse(response: Response) {
  if (response.status === 204) {
    return new NextResponse(null, {
      status: 204,
      headers: noStore,
    });
  }

  const text = await response.text();

  return new NextResponse(text, {
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
   GET Requirement By ID
========================= */

export async function GET(
  request: NextRequest,
  context: Context
) {
  const result = await getRequestContext(
    request,
    context,
    false
  );

  if ("error" in result) return result.error;

  const { courseId, requirementId, token } = result;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${courseId}/requirements/${requirementId}`,
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
      "Unable to load requirement.",
      502
    );
  }
}

/* =========================
   PUT Update Requirement
========================= */

export async function PUT(
  request: NextRequest,
  context: Context
) {
  const result = await getRequestContext(
    request,
    context,
    true
  );

  if ("error" in result) return result.error;

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
      "Invalid requirement information.",
      400
    );
  }

  const payload = body as Record<string, unknown>;

  if (
    typeof payload.requirement !== "string" ||
    !payload.requirement.trim() ||
    !Number.isSafeInteger(payload.orderIndex) ||
    Number(payload.orderIndex) < 0 ||
    Number(payload.orderIndex) > 2147483647
  ) {
    return errorResponse(
      "Invalid requirement information.",
      400
    );
  }

  const { courseId, requirementId, token } = result;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${courseId}/requirements/${requirementId}`,
      {
        method: "PUT",
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

    return forwardResponse(response);
  } catch {
    return errorResponse(
      "Unable to update requirement.",
      502
    );
  }
}

/* =========================
   DELETE Requirement
========================= */

export async function DELETE(
  request: NextRequest,
  context: Context
) {
  const result = await getRequestContext(
    request,
    context,
    true
  );

  if ("error" in result) return result.error;

  const { courseId, requirementId, token } = result;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${courseId}/requirements/${requirementId}`,
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
      "Unable to delete requirement.",
      502
    );
  }
}
