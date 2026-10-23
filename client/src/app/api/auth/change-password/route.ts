
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

type ChangePasswordInput = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function reply(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}

function validInput(
  value: unknown
): value is ChangePasswordInput {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.oldPassword === "string" &&
    data.oldPassword.length > 0 &&
    typeof data.newPassword === "string" &&
    data.newPassword.length >= 8 &&
    data.newPassword.length <= 100 &&
    typeof data.confirmPassword === "string" &&
    data.confirmPassword === data.newPassword
  );
}

export async function POST(request: NextRequest) {
  // Reject cross-origin password-change requests.
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return reply("Invalid request origin.", 403);
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return reply("Authentication required.", 401);
  }

  let input: ChangePasswordInput;

  try {
    const body: unknown = await request.json();

    if (!validInput(body)) {
      return reply("Invalid password information.", 400);
    }

    input = body;
  } catch {
    return reply("Invalid JSON body.", 400);
  }

  try {
    const response = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/Auth/change-password`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(input),
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }
    );

    if (response.status === 401) {
      return reply("Session expired.", 401);
    }

    if (response.status === 403) {
      return reply("Access denied.", 403);
    }

    if (response.status === 400) {
      return reply(
        "Current password is incorrect or the new password was rejected.",
        400
      );
    }

    if (!response.ok) {
      return reply("Unable to change password.", 502);
    }

    return reply(
      "Password changed successfully. Please log in again.",
      200
    );
  } catch {
    return reply("Authentication service unavailable.", 502);
  }
}
