
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type Context = {
  params: Promise<{ id: string; itemId: string }>;
};

const noStore = { "Cache-Control": "no-store" };

function fail(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: noStore }
  );
}

function parseId(value: string) {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
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

    if (!roles.includes("Admin")) {
      return { status: 403 as const };
    }

    return { status: 200 as const, token };
  } catch {
    return { status: 502 as const };
  }
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

async function prepare(
  request: NextRequest,
  context: Context,
  mutation: boolean
) {
  const { id, itemId } = await context.params;
  const courseId = parseId(id);
  const sectionId = parseId(itemId);

  if (courseId === null || sectionId === null) {
    return { error: fail("Invalid section or course ID.", 400) };
  }

  if (mutation) {
    const origin = request.headers.get("origin");
    if (!origin || origin !== request.nextUrl.origin) {
      return { error: fail("Invalid request origin.", 403) };
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

  return { courseId, sectionId, token: auth.token };
}

export async function GET(
  request: NextRequest,
  context: Context
) {
  const result = await prepare(request, context, false);
  if (result.error) return result.error;

  const { courseId, sectionId, token } = result;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${courseId}/sections/${sectionId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    return forward(response);
  } catch {
    return fail("Unable to load section.", 502);
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

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return fail("Invalid section data.", 400);
  }

  const data = body as Record<string, unknown>;

  if (
    typeof data.title !== "string" ||
    !data.title.trim() ||
    typeof data.description !== "string" ||
    typeof data.orderIndex !== "number" ||
    !Number.isInteger(data.orderIndex) ||
    data.orderIndex < 0 ||
    data.orderIndex > 2147483647
  ) {
    return fail("Invalid section data.", 400);
  }

  const { courseId, sectionId, token } = result;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${courseId}/sections/${sectionId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title.trim(),
          description: data.description.trim(),
          orderIndex: data.orderIndex,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    return forward(response);
  } catch {
    return fail("Unable to update section.", 502);
  }
}

export async function DELETE(
  request: NextRequest,
  context: Context
) {
  const result = await prepare(request, context, true);
  if (result.error) return result.error;

  const { courseId, sectionId, token } = result;

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${courseId}/sections/${sectionId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    return forward(response);
  } catch {
    return fail("Unable to delete section.", 502);
  }
}
