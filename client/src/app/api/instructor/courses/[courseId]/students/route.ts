
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type Context = {
  params: Promise<{ courseId: string }>;
};

const headers = {
  "Cache-Control": "no-store",
};

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers }
  );
}

export async function GET(
  request: NextRequest,
  context: Context
) {
  const { courseId } = await context.params;

  if (!/^[1-9]\d*$/.test(courseId) ||
      !Number.isSafeInteger(Number(courseId))) {
    return errorResponse("Invalid course ID.", 400);
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return errorResponse("Authentication required.", 401);
  }

  try {
    const authResponse = await fetch(`${API_URL}/api/Auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (authResponse.status === 401) {
      return errorResponse("Session expired.", 401);
    }

    if (!authResponse.ok) {
      return errorResponse("Authentication unavailable.", 502);
    }

    const user: unknown = await authResponse.json();

    if (
      !user ||
      typeof user !== "object" ||
      Array.isArray(user) ||
      !Array.isArray((user as { roles?: unknown }).roles) ||
      !(user as { roles: unknown[] }).roles.includes("Instructor")
    ) {
      return errorResponse("Instructor access required.", 403);
    }

    const response = await fetch(
      `${API_URL}/api/instructor/courses/${courseId}/students`,
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

    if (response.status === 401) {
      return errorResponse("Session expired.", 401);
    }

    if (response.status === 403) {
      return errorResponse("Access denied.", 403);
    }

    if (response.status === 404) {
      return errorResponse("Course not found.", 404);
    }

    if (!response.ok) {
      return errorResponse("Unable to load students.", 502);
    }

    const data: unknown = await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      !Array.isArray((data as { students?: unknown }).students)
    ) {
      return errorResponse("Invalid students response.", 502);
    }

    return NextResponse.json(data, {
      status: 200,
      headers,
    });
  } catch {
    return errorResponse("Student service unavailable.", 502);
  }
}
