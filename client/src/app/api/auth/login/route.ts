
import { NextRequest, NextResponse } from "next/server";

type AuthResponse = {
  userId: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  roles: string[];
};

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

function error(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
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

  const identifier =
    typeof input.identifier === "string"
      ? input.identifier.trim()
      : "";

  const password =
    typeof input.password === "string"
      ? input.password
      : "";

  if (
    !identifier ||
    !password ||
    identifier.length > 254 ||
    password.length > 1024
  ) {
    return error("Invalid credentials.", 400);
  }

  try {
    const backend = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/Auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ identifier, password }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (backend.status === 429) {
        return error(
          "Too many login attempts. Please try again later.",
          429
        );
      }

    if (!backend.ok) {
      return error("Login service unavailable.", 502);
    }

    const data: AuthResponse = await backend.json();

    const expiresAt = Date.parse(
      data.accessTokenExpiresAt
    );

    const maxAge = Math.floor(
      (expiresAt - Date.now()) / 1000
    );

    if (
      typeof data.accessToken !== "string" ||
      !data.accessToken ||
      typeof data.refreshToken !== "string" ||
      !data.refreshToken ||
      !Number.isFinite(maxAge) ||
      maxAge <= 0
    ) {
      return error("Invalid login response.", 502);
    }

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: data.userId,
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          email: data.email,
          roles: data.roles,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

    response.cookies.set("cm_access", data.accessToken, {
      ...cookieOptions,
      maxAge,
    });

    response.cookies.set("cm_refresh", data.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch {
    return error("Unable to connect to the server.", 502);
  }
}
