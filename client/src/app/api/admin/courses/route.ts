
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

const responseHeaders = {
  "Cache-Control": "no-store",
};

// ---------------------------------------
// Shared helpers
// ---------------------------------------

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: responseHeaders,
    }
  );
}

function isAdminUser(data: unknown): boolean {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return false;
  }

  const user = data as Record<string, unknown>;

  return (
    Array.isArray(user.roles) &&
    user.roles.includes("Admin") &&
    user.roles.every(
      (role) => typeof role === "string"
    )
  );
}

async function verifyAdmin(
  accessToken: string
): Promise<"allowed" | "unauthorized" | "forbidden" | "error"> {
  try {
    const response = await fetch(`${API_URL}/api/Auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401) {
      return "unauthorized";
    }

    if (!response.ok) {
      return "error";
    }

    const data: unknown = await response.json();

    if (!isAdminUser(data)) {
      return "forbidden";
    }

    return "allowed";
  } catch {
    return "error";
  }
}

function adminError(
  result: "unauthorized" | "forbidden" | "error"
) {
  if (result === "unauthorized") {
    return errorResponse("Session expired.", 401);
  }

  if (result === "forbidden") {
    return errorResponse(
      "Administrator access required.",
      403
    );
  }

  return errorResponse(
    "Unable to verify administrator permissions.",
    502
  );
}

// ---------------------------------------
// GET /api/admin/courses
// ---------------------------------------

export async function GET(request: NextRequest) {
  const accessToken =
    request.cookies.get("cm_access")?.value;

  if (!accessToken) {
    return errorResponse(
      "Authentication required.",
      401
    );
  }

  const authorization = await verifyAdmin(accessToken);

  if (authorization !== "allowed") {
    return adminError(authorization);
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/courses`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401) {
      return errorResponse("Session expired.", 401);
    }

    if (response.status === 403) {
      return errorResponse(
        "Course access denied.",
        403
      );
    }

    if (!response.ok) {
      return errorResponse(
        "Unable to load courses.",
        502
      );
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return errorResponse(
        "Invalid courses response.",
        502
      );
    }

    return NextResponse.json(data, {
      status: 200,
      headers: responseHeaders,
    });
  } catch {
    return errorResponse(
      "Course service temporarily unavailable.",
      502
    );
  }
}

// ---------------------------------------
// Create Course DTO
// ---------------------------------------

type CreateCoursePayload = {
  categoryId: number;
  instructorId: number | null;
  title: string;
  shortDescription: string | null;
  description: string;
  thumbnailUrl: string | null;
  previewVideoUrl: string | null;
  price: number;
  discountPrice: number | null;
  language: string;
  level: string;
  isFeatured: boolean;
  hasCertificate: boolean;
  estimatedDurationHours: number | null;
};

// ---------------------------------------
// Course validation
// ---------------------------------------

function isCreateCoursePayload(
  value: unknown
): value is CreateCoursePayload {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  const optionalText = (value: unknown, max: number) =>
    value === null ||
    (typeof value === "string" && value.length <= max);

  const optionalId = (value: unknown) =>
    value === null ||
    (
      typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value > 0
    );

  const optionalDuration = (value: unknown) =>
    value === null ||
    (
      typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value >= 0 &&
      value <= 2147483647
    );

  const validPrice =
    typeof data.price === "number" &&
    Number.isFinite(data.price) &&
    data.price >= 0;

  const validDiscount =
    data.discountPrice === null ||
    (
      typeof data.discountPrice === "number" &&
      Number.isFinite(data.discountPrice) &&
      data.discountPrice >= 0 &&
      validPrice &&
      data.discountPrice <= (data.price as number)
    );

  return (
    typeof data.categoryId === "number" &&
    Number.isSafeInteger(data.categoryId) &&
    data.categoryId > 0 &&

    optionalId(data.instructorId) &&

    typeof data.title === "string" &&
    data.title.trim().length >= 3 &&
    data.title.length <= 200 &&

    optionalText(data.shortDescription, 500) &&

    typeof data.description === "string" &&
    data.description.trim().length > 0 &&

    optionalText(data.thumbnailUrl, 500) &&
    optionalText(data.previewVideoUrl, 500) &&

    validPrice &&
    validDiscount &&

    typeof data.language === "string" &&
    data.language.trim().length > 0 &&
    data.language.length <= 50 &&

    typeof data.level === "string" &&
    data.level.trim().length > 0 &&
    data.level.length <= 50 &&

    typeof data.isFeatured === "boolean" &&
    typeof data.hasCertificate === "boolean" &&

    optionalDuration(data.estimatedDurationHours)
  );
}

// ---------------------------------------
// POST /api/admin/courses
// ---------------------------------------

export async function POST(request: NextRequest) {
  const accessToken =
    request.cookies.get("cm_access")?.value;

  if (!accessToken) {
    return errorResponse(
      "Authentication required.",
      401
    );
  }

  // Prevent cross-origin form submissions.
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return errorResponse(
      "Invalid request origin.",
      403
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return errorResponse(
      "Invalid JSON request body.",
      400
    );
  }

  if (!isCreateCoursePayload(payload)) {
    return errorResponse(
      "Invalid course information.",
      400
    );
  }

  const authorization = await verifyAdmin(accessToken);

  if (authorization !== "allowed") {
    return adminError(authorization);
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/courses`, {
    method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (response.status === 401) {
      return errorResponse("Session expired.", 401);
    }

    if (response.status === 403) {
      return errorResponse(
        "Course creation is not permitted.",
        403
      );
    }

    // ASP.NET Core may return JSON or an empty response.
    const rawBody = await response.text();

    let result: unknown = null;

    if (rawBody) {
      try {
        result = JSON.parse(rawBody);
      } catch {
        result = null;
      }
    }

    if (!response.ok) {
      // Preserve validation errors returned by ASP.NET Core.
      return NextResponse.json(
        result ?? {
          message: "Unable to create course.",
        },
        {
          status: response.status,
          headers: responseHeaders,
        }
      );
    }

    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: responseHeaders,
      });
    }

    return NextResponse.json(result, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return errorResponse(
      "Course service temporarily unavailable.",
      502
    );
  }
}
