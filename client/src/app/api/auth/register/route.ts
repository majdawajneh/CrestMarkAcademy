
import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_BYTES = 16_384;

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (
    !origin ||
    origin !== new URL(request.url).origin
  ) {
    return errorResponse("Invalid request origin.", 403);
  }

  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return errorResponse("Expected JSON request.", 415);
  }

  const contentLength = Number(
    request.headers.get("content-length") || 0
  );

  if (contentLength > MAX_BODY_BYTES) {
    return errorResponse("Request is too large.", 413);
  }

  let body: unknown;

  try {
    const rawBody = await request.text();

    if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
      return errorResponse("Request is too large.", 413);
    }

    body = JSON.parse(rawBody);
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return errorResponse("Invalid request body.", 400);
  }

  const input = body as Record<string, unknown>;

  const fields = [
    "firstName",
    "lastName",
    "username",
    "email",
    "password",
    "phoneNumber",
  ] as const;

  if (
    fields.some(
      (field) => typeof input[field] !== "string"
    )
  ) {
    return errorResponse("Invalid registration information.", 400);
  }

  const data = {
    firstName: (input.firstName as string).trim(),
    lastName: (input.lastName as string).trim(),
    username: (input.username as string).trim(),
    email: (input.email as string).trim(),
    password: input.password as string,
    phoneNumber: (input.phoneNumber as string).trim(),
  };

  if (
    !data.firstName ||
    !data.lastName ||
    !data.username ||
    !data.email ||
    !data.password ||
    !data.phoneNumber
  ) {
    return errorResponse("All fields are required.", 400);
  }

  if (
    data.firstName.length > 100 ||
    data.lastName.length > 100 ||
    data.username.length > 100 ||
    data.email.length > 254 ||
    data.password.length > 256 ||
    data.phoneNumber.length > 40
  ) {
    return errorResponse("One or more fields are too long.", 400);
  }

  const apiUrl =
    process.env.API_BASE_URL || "http://localhost:5299";

  try {
    const backendResponse = await fetch(
      `${apiUrl.replace(/\/$/, "")}/api/Auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!backendResponse.ok) {
      if (
        [400, 409, 422].includes(backendResponse.status)
      ) {
        return errorResponse(
          "Registration was not accepted. Check your details or try another email or username.",
          400
        );
      }

      return errorResponse(
        "Registration is temporarily unavailable.",
        502
      );
    }

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch {
    return errorResponse(
      "Unable to connect to the registration service.",
      502
    );
  }
}
