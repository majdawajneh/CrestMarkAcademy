
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

type Context = {
  params: Promise<{ path?: string[] }>;
};

type Method = "GET" | "PATCH";

function reply(data: unknown, status: number) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

function getTarget(method: Method, path: string[]) {
  if (method === "GET") {
    if (path.length === 0) return "";

    if (path.length === 1 && path[0] === "unread-count") {
      return "unread-count";
    }
  }

  if (method === "PATCH") {
    if (path.length === 1 && path[0] === "read-all") {
      return "read-all";
    }

    if (
      path.length === 2 &&
      /^[1-9]\d*$/.test(path[0]) &&
      path[1] === "read"
    ) {
      return `${path[0]}/read`;
    }
  }

  return null;
}

async function handle(
  request: NextRequest,
  context: Context,
  method: Method
) {
  const { path = [] } = await context.params;
  const target = getTarget(method, path);

  if (target === null) {
    return reply({ message: "Invalid notification endpoint." }, 404);
  }

  // Validate origin for cookie-authenticated mutations.
  if (method === "PATCH") {
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return reply({ message: "Invalid request origin." }, 403);
    }
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return reply({ message: "Authentication required." }, 401);
  }

  const endpoint = target
    ? `/api/notifications/${target}`
    : "/api/notifications";

  try {
    const response = await fetch(
      `${API_URL.replace(/\/$/, "")}${endpoint}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }
    );

    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Cache-Control": "private, no-store",
        },
      });
    }

    if (response.status === 401) {
      return reply({ message: "Session expired." }, 401);
    }

    if (response.status === 403) {
      return reply({ message: "Access denied." }, 403);
    }

    if (response.status === 404) {
      return reply({ message: "Notification not found." }, 404);
    }

    if (!response.ok) {
      return reply(
        { message: "Notification service unavailable." },
        502
      );
    }

    const data: unknown = await response.json();

    return reply(data, 200);
  } catch {
    return reply(
      { message: "Notification service unavailable." },
      502
    );
  }
}

export function GET(request: NextRequest, context: Context) {
  return handle(request, context, "GET");
}

export function PATCH(request: NextRequest, context: Context) {
  return handle(request, context, "PATCH");
}
