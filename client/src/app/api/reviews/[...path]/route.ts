
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

type Context = {
  params: Promise<{ path: string[] }>;
};

type ReviewInput = {
  rating: number;
  comment: string | null;
};

function reply(data: unknown, status: number) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

function getTarget(method: string, path: string[]) {
  if (
    method === "POST" &&
    path.length === 2 &&
    path[0] === "courses" &&
    /^[1-9]\d*$/.test(path[1])
  ) {
    return `courses/${path[1]}`;
  }

  if (
    (method === "PUT" || method === "DELETE") &&
    path.length === 1 &&
    /^[1-9]\d*$/.test(path[0])
  ) {
    return path[0];
  }

  return null;
}

function validInput(value: unknown): value is ReviewInput {
  if (!value || typeof value !== "object") return false;

  const data = value as Record<string, unknown>;

  return (
    typeof data.rating === "number" &&
    Number.isInteger(data.rating) &&
    data.rating >= 1 &&
    data.rating <= 5 &&
    (data.comment === null ||
      (typeof data.comment === "string" &&
        data.comment.length <= 1000))
  );
}

async function handle(
  request: NextRequest,
  context: Context,
  method: "POST" | "PUT" | "DELETE"
) {
  const { path } = await context.params;
  const target = getTarget(method, path);

  if (!target) {
    return reply({ message: "Invalid review endpoint." }, 400);
  }

  // Protect cookie-authenticated mutations against cross-origin requests.
  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return reply({ message: "Invalid request origin." }, 403);
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return reply({ message: "Authentication required." }, 401);
  }

  let input: ReviewInput | undefined;

  if (method !== "DELETE") {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return reply({ message: "Invalid JSON body." }, 400);
    }

    if (!validInput(body)) {
      return reply(
        { message: "Rating or comment is invalid." },
        400
      );
    }

    input = body;
  }

  try {
    const response = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/reviews/${target}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(input ? { "Content-Type": "application/json" } : {}),
        },
        body: input ? JSON.stringify(input) : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }
    );

    if (response.ok) {
      if (response.status === 204) {
        return new NextResponse(null, {
          status: 204,
          headers: { "Cache-Control": "private, no-store" },
        });
      }

      const data: unknown = await response.json();
      return reply(data, response.status);
    }

    if (response.status === 401) {
      return reply({ message: "Session expired." }, 401);
    }

    if (response.status === 403) {
      return reply({ message: "Access denied." }, 403);
    }

    if (response.status === 404) {
      return reply({ message: "Review or course not found." }, 404);
    }

    if ([400, 409].includes(response.status)) {
      return reply(
        { message: "Review request was rejected." },
        response.status
      );
    }

    return reply({ message: "Review service unavailable." }, 502);
  } catch {
    return reply({ message: "Review service unavailable." }, 502);
  }
}

export function POST(request: NextRequest, context: Context) {
  return handle(request, context, "POST");
}

export function PUT(request: NextRequest, context: Context) {
  return handle(request, context, "PUT");
}

export function DELETE(request: NextRequest, context: Context) {
  return handle(request, context, "DELETE");
}
