
import { NextRequest, NextResponse } from "next/server";

type AuthResponse = {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
};

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

function clearCookies(response: NextResponse) {
  response.cookies.set("cm_access", "", {
    ...cookieOptions,
    maxAge: 0,
  });

  response.cookies.set("cm_refresh", "", {
    ...cookieOptions,
    maxAge: 0,
  });
}

function responseError(message: string, status: number) {
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
    return responseError(
      "Invalid request origin.",
      403
    );
  }

  const refreshToken =
    request.cookies.get("cm_refresh")?.value;

  if (!refreshToken) {
    return responseError(
      "No active refresh session.",
      401
    );
  }

  let backend: Response;

  try {
    backend = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/Auth/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );
  } catch {
    return responseError(
      "Authentication service unavailable.",
      502
    );
  }

  if (backend.status === 400 ||
      backend.status === 401) {
    const response = responseError(
      "Session expired. Please log in again.",
      401
    );

    clearCookies(response);
    return response;
  }

  if (!backend.ok) {
    return responseError(
      "Unable to renew session.",
      502
    );
  }

  let data: AuthResponse;

  try {
    data = await backend.json();
  } catch {
    return responseError(
      "Invalid refresh response.",
      502
    );
  }

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
    return responseError(
      "Invalid refresh response.",
      502
    );
  }

  const response = NextResponse.json(
    { success: true },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );

  response.cookies.set(
    "cm_access",
    data.accessToken,
    {
      ...cookieOptions,
      maxAge,
    }
  );

  response.cookies.set(
    "cm_refresh",
    data.refreshToken,
    {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60,
    }
  );

  return response;
}
