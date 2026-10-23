
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

function error(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  return (
    origin !== null &&
    origin === new URL(request.url).origin
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return error("Invalid request origin.", 403);
  }

  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return error("Expected JSON request.", 415);
  }

  let body: unknown;

  try {
    const raw = await request.text();

    if (raw.length > 8192) {
      return error("Request too large.", 413);
    }

    body = JSON.parse(raw);
  } catch {
    return error("Invalid request.", 400);
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return error("Invalid request.", 400);
  }

  const input = body as Record<string, unknown>;

  const token =
    typeof input.token === "string"
      ? input.token.trim()
      : "";

  const password =
    typeof input.password === "string"
      ? input.password
      : "";

  if (
    !token ||
    token.length > 2048 ||
    password.length < 8 ||
    password.length > 1024
  ) {
    return error("Invalid activation request.", 400);
  }

  try {
    const backend = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/auth/instructor-invitation/accept`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (backend.ok) {
      return NextResponse.json(
        {
          success: true,
          message: "Instructor account activated successfully.",
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    if (
      backend.status === 400 ||
      backend.status === 401 ||
      backend.status === 403 ||
      backend.status === 404 ||
      backend.status === 409
    ) {
      return error(
        "Invalid, expired, or already used invitation.",
        400
      );
    }

    return error("Activation service unavailable.", 502);
  } catch {
    return error("Unable to connect to the server.", 502);
  }
}
