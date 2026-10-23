
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

const responseHeaders = {
  "Cache-Control": "no-store",
};

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: responseHeaders }
  );
}

function isInstructor(data: unknown): boolean {
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
    user.roles.every(
      (role) => typeof role === "string"
    ) &&
    user.roles.includes("Instructor")
  );
}

// GET /api/instructor/reviews
export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("cm_access")?.value;

  if (!accessToken) {
    return errorResponse("Authentication required.", 401);
  }

  try {
    // Verify the instructor's identity and role.
    const authResponse = await fetch(`${API_URL}/api/Auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (authResponse.status === 401) {
      return errorResponse("Session expired.", 401);
    }

    if (!authResponse.ok) {
      return errorResponse(
        "Unable to verify instructor permissions.",
        502
      );
    }

    const authData: unknown = await authResponse.json();

    if (!isInstructor(authData)) {
      return errorResponse(
        "Instructor access required.",
        403
      );
    }

    // Only return reviews belonging to this instructor's courses.
    const response = await fetch(
      `${API_URL}/api/instructor/reviews`,
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
      return errorResponse("Session expired.", 401);
    }

    if (response.status === 403) {
      return errorResponse(
        "Instructor access denied.",
        403
      );
    }

    if (!response.ok) {
      return errorResponse(
        "Unable to load instructor reviews.",
        502
      );
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return errorResponse(
        "Invalid reviews response.",
        502
      );
    }

    return NextResponse.json(data, {
      status: 200,
      headers: responseHeaders,
    });
  } catch {
    return errorResponse(
      "Instructor reviews service temporarily unavailable.",
      502
    );
  }
}
