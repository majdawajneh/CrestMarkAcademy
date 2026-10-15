
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

const allowedActions = [
  "publish",
  "unpublish",
  "archive",
  "restore",
] as const;

type CourseAction = (typeof allowedActions)[number];

type RouteContext = {
  params: Promise<{
    id: string;
    action: string;
  }>;
};

const responseHeaders = {
  "Cache-Control": "no-store",
};

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: responseHeaders,
    }
  );
}

function isCourseAction(
  value: string
): value is CourseAction {
  return allowedActions.some((action) => action === value);
}

function isAdminUser(value: unknown): boolean {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    Array.isArray(user.roles) &&
    user.roles.every(
      (role) => typeof role === "string"
    ) &&
    user.roles.includes("Admin")
  );
}

async function verifyAdmin(
  accessToken: string
): Promise<"allowed" | "unauthorized" | "forbidden" | "error"> {
  try {
    const response = await fetch(
      `${API_URL}/api/Auth/me`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    if (response.status === 401) {
      return "unauthorized";
    }

    if (response.status === 403) {
      return "forbidden";
    }

    if (!response.ok) {
      return "error";
    }

    const data: unknown = await response.json();

    return isAdminUser(data) ? "allowed" : "forbidden";
  } catch {
    return "error";
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id: rawId, action } = await context.params;

  // Validate the course ID.
  if (!/^[1-9]\d*$/.test(rawId)) {
    return errorResponse("Invalid course ID.", 400);
  }

  const courseId = Number(rawId);

  if (!Number.isSafeInteger(courseId)) {
    return errorResponse("Invalid course ID.", 400);
  }

  // Only allow supported status actions.
  if (!isCourseAction(action)) {
    return errorResponse("Unsupported course action.", 400);
  }

  // Require an authenticated admin session.
  const accessToken = request.cookies.get("cm_access")?.value;

  if (!accessToken) {
    return errorResponse("Authentication required.", 401);
  }

  // Prevent cross-origin state-changing requests.
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return errorResponse("Invalid request origin.", 403);
  }

  const authorization = await verifyAdmin(accessToken);

  if (authorization === "unauthorized") {
    return errorResponse("Session expired.", 401);
  }

  if (authorization === "forbidden") {
    return errorResponse(
      "Administrator access required.",
      403
    );
  }

  if (authorization === "error") {
    return errorResponse(
      "Unable to verify administrator permissions.",
      502
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/admin/courses/${courseId}/${action}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (response.status === 401) {
      return errorResponse("Session expired.", 401);
    }

    if (response.status === 403) {
      return errorResponse(
        "Course action is not permitted.",
        403
      );
    }

    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: responseHeaders,
      });
    }

    const rawBody = await response.text();

    let result: unknown = null;

    if (rawBody) {
      try {
        result = JSON.parse(rawBody);
      } catch {
        return errorResponse(
          "Invalid response from course service.",
          502
        );
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        result ?? {
          message: "Unable to update course status.",
        },
        {
          status: response.status,
          headers: responseHeaders,
        }
      );
    }

    return NextResponse.json(
      result,
      {
        status: response.status,
        headers: responseHeaders,
      }
    );
  } catch {
    return errorResponse(
      "Course service temporarily unavailable.",
      502
    );
  }
}
