
import { NextRequest, NextResponse } from "next/server";

function respond(message: string, status: number) {
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

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin || origin !== new URL(request.url).origin) {
    return respond("Invalid request origin.", 403);
  }

  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return respond("Expected JSON request.", 415);
  }

  let body: unknown;

  try {
    const raw = await request.text();

    if (raw.length > 8192) {
      return respond("Request too large.", 413);
    }

    body = JSON.parse(raw);
  } catch {
    return respond("Invalid request.", 400);
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    !("token" in body) ||
    typeof body.token !== "string"
  ) {
    return respond("Invalid confirmation token.", 400);
  }

  const token = body.token.trim();

  if (!token || token.length > 4096) {
    return respond("Invalid confirmation token.", 400);
  }

  const baseUrl =
    process.env.API_BASE_URL || "http://localhost:5299";

  try {
    const backendResponse = await fetch(
      `${baseUrl.replace(/\/$/, "")}/api/Auth/confirm-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ token }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!backendResponse.ok) {
      if (
        [400, 404, 409, 422].includes(
          backendResponse.status
        )
      ) {
        return respond(
          "The verification link is invalid, expired, or already used.",
          400
        );
      }

      return respond(
        "Email verification is temporarily unavailable.",
        502
      );
    }

    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return respond(
      "Unable to connect to the verification service.",
      502
    );
  }
}
