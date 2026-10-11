
import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: Promise<{ slug: string }>;
};

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

function reply(data: unknown, status: number) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  const { slug } = await params;

  if (!/^[a-zA-Z0-9-]{1,200}$/.test(slug)) {
    return reply({ message: "Invalid course slug." }, 400);
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return reply({ message: "Authentication required." }, 401);
  }

  try {
    const response = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/courses/${encodeURIComponent(slug)}/content`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }
    );

    if (response.status === 401) {
      return reply({ message: "Session expired." }, 401);
    }

    if (response.status === 403) {
      return reply({ message: "Access denied." }, 403);
    }

    if (response.status === 404) {
      return reply({ message: "Course not found." }, 404);
    }

    if (!response.ok) {
      return reply(
        { message: "Unable to load course content." },
        502
      );
    }

    const data: unknown = await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      !("isEnrolled" in data) ||
      data.isEnrolled !== true
    ) {
      return reply(
        { message: "Course enrollment required." },
        403
      );
    }

    const content = data as Record<string, unknown>;

    if (
      typeof content.courseId !== "number" ||
      typeof content.title !== "string" ||
      !Array.isArray(content.sections)
    ) {
      return reply(
        { message: "Invalid course content." },
        502
      );
    }

    // The ASP.NET Core API remains responsible for
    // lesson access checks and protected media access.
    return reply(content, 200);
  } catch {
    return reply(
      { message: "Learning service unavailable." },
      502
    );
  }
}
