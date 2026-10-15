
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

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

const noStoreHeaders = {
  "Cache-Control": "no-store",
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
      headers: noStoreHeaders,
    }
  );
}

function isAuthResponse(data: unknown): data is AuthResponse {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return false;
  }

  const value = data as Record<string, unknown>;

  return (
    typeof value.userId === "number" &&
    Number.isSafeInteger(value.userId) &&
    value.userId > 0 &&
    typeof value.username === "string" &&
    typeof value.email === "string" &&
    typeof value.accessToken === "string" &&
    value.accessToken.length > 0 &&
    typeof value.refreshToken === "string" &&
    value.refreshToken.length > 0 &&
    typeof value.accessTokenExpiresAt === "string" &&
    Number.isFinite(
      Date.parse(value.accessTokenExpiresAt)
    ) &&
    Array.isArray(value.roles) &&
    value.roles.every(
      (role) => typeof role === "string"
    ) &&
    typeof value.firstName === "string" &&
    typeof value.lastName === "string"
  );
}

export async function POST(request: NextRequest) {
  // =====================================
  // Validate request origin
  // =====================================

  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;

  if (!origin || origin !== expectedOrigin) {
    return responseError(
      "Invalid request origin.",
      403
    );
  }

  // =====================================
  // Read refresh token from HttpOnly cookie
  // =====================================

  const refreshToken =
    request.cookies.get("cm_refresh")?.value;

  if (!refreshToken) {
    return responseError(
      "No active refresh session.",
      401
    );
  }

  // =====================================
  // Request new tokens from ASP.NET Core
  // =====================================

  let backend: Response;

  try {
    backend = await fetch(
      `${API_URL}/api/Auth/refresh-token`,
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

  // =====================================
  // Expired or invalid refresh token
  // =====================================

  if (
    backend.status === 400 ||
    backend.status === 401
  ) {
    const response = responseError(
      "Session expired. Please log in again.",
      401
    );

    clearCookies(response);

    return response;
  }

  // =====================================
  // Other backend errors
  // =====================================

  if (!backend.ok) {
    return responseError(
      "Unable to renew session.",
      502
    );
  }

  // =====================================
  // Parse backend response
  // =====================================

  let rawData: unknown;

  try {
    rawData = await backend.json();
  } catch {
    return responseError(
      "Invalid refresh response.",
      502
    );
  }

  if (!isAuthResponse(rawData)) {
    return responseError(
      "Invalid refresh response.",
      502
    );
  }

  const data = rawData;

  // =====================================
  // Calculate access token expiration
  // =====================================

  const expiresAt = Date.parse(
    data.accessTokenExpiresAt
  );

  const maxAge = Math.floor(
    (expiresAt - Date.now()) / 1000
  );

  if (!Number.isFinite(maxAge) || maxAge <= 0) {
    return responseError(
      "Invalid access token expiration.",
      502
    );
  }

  // =====================================
  // Return success and rotate cookies
  // =====================================

  const response = NextResponse.json(
    { success: true },
    {
      status: 200,
      headers: noStoreHeaders,
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
