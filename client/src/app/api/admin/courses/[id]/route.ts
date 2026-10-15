
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type RouteContext = {
  params: Promise<{ id: string }>;
};

const noStore = {
  "Cache-Control": "no-store",
};

function fail(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: noStore }
  );
}

function getValidId(value: string): number | null {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

async function authorize(token: string) {
  try {
    const response = await fetch(`${API_URL}/api/Auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401) {
      return 401;
    }

    if (!response.ok) {
      return 502;
    }

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

async function readBackendResponse(response: Response) {
  if (response.status === 204) {
    return new NextResponse(null, {
      status: 204,
      headers: noStore,
    });
  }

  const raw = await response.text();

  let data: unknown = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }

  return NextResponse.json(
    data ?? {
      message: response.ok
        ? "Operation completed."
        : "Backend request failed.",
    },
    {
      status: response.status,
      headers: noStore,
    }
  );
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id: rawId } = await context.params;
  const id = getValidId(rawId);

  if (id === null) {
    return fail("Invalid course ID.", 400);
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return fail("Authentication required.", 401);
  }

  const status = await authorize(token);

  if (status !== 200) {
    return fail("Authorization failed.", status);
  }

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${id}`,
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

    return await readBackendResponse(response);
  } catch {
    return fail("Unable to load course details.", 502);
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const { id: rawId } = await context.params;
  const id = getValidId(rawId);

  if (id === null) {
    return fail("Invalid course ID.", 400);
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return fail("Authentication required.", 401);
  }

  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return fail("Invalid request origin.", 403);
  }

  const status = await authorize(token);

  if (status !== 200) {
    return fail("Authorization failed.", status);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body.", 400);
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return fail("Invalid course information.", 400);
  }

  // Accept the expected update DTO fields only.
  const source = body as Record<string, unknown>;

  const fields = [
    "categoryId",
    "instructorId",
    "title",
    "shortDescription",
    "description",
    "thumbnailUrl",
    "previewVideoUrl",
    "price",
    "discountPrice",
    "language",
    "level",
    "isFeatured",
    "hasCertificate",
    "estimatedDurationHours",
  ] as const;

  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    if (!(field in source)) {
      return fail(`Missing field: ${field}`, 400);
    }

    payload[field] = source[field];
  }

  // Basic request validation.
  if (
    !Number.isSafeInteger(payload.categoryId) ||
    Number(payload.categoryId) <= 0 ||
    (
      payload.instructorId !== null &&
      (
        !Number.isSafeInteger(payload.instructorId) ||
        Number(payload.instructorId) <= 0
      )
    ) ||
    typeof payload.title !== "string" ||
    payload.title.trim().length < 3 ||
    payload.title.length > 200 ||
    typeof payload.description !== "string" ||
    !payload.description.trim() ||
    typeof payload.language !== "string" ||
    !payload.language.trim() ||
    payload.language.length > 50 ||
    typeof payload.level !== "string" ||
    !payload.level.trim() ||
    payload.level.length > 50 ||
    typeof payload.price !== "number" ||
    !Number.isFinite(payload.price) ||
    payload.price < 0 ||
    typeof payload.isFeatured !== "boolean" ||
    typeof payload.hasCertificate !== "boolean"
  ) {
    return fail("Invalid course information.", 400);
  }

  for (const field of [
    "shortDescription",
    "thumbnailUrl",
    "previewVideoUrl",
  ] as const) {
    const value = payload[field];

    if (
      value !== null &&
      (
        typeof value !== "string" ||
        value.length > 500
      )
    ) {
      return fail(`Invalid ${field}.`, 400);
    }
  }

  if (
    payload.discountPrice !== null &&
    (
      typeof payload.discountPrice !== "number" ||
      !Number.isFinite(payload.discountPrice) ||
      payload.discountPrice < 0 ||
      payload.discountPrice > payload.price
    )
  ) {
    return fail("Invalid discounted price.", 400);
  }

  if (
    payload.estimatedDurationHours !== null &&
    (
      !Number.isSafeInteger(payload.estimatedDurationHours) ||
      Number(payload.estimatedDurationHours) < 0 ||
      Number(payload.estimatedDurationHours) > 2147483647
    )
  ) {
    return fail("Invalid duration.", 400);
  }

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    return await readBackendResponse(response);
  } catch {
    return fail("Unable to update the course.", 502);
  }
}
