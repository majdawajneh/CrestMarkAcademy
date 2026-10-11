
import { NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (
    !origin ||
    origin !== new URL(request.url).origin
  ) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 }
    );
  }

  const refreshToken =
    request.cookies.get("cm_refresh")?.value;

  if (refreshToken) {
    try {
      const backend = await fetch(
        `${API_URL.replace(/\/$/, "")}/api/Auth/logout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ refreshToken }),
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!backend.ok) {
        return NextResponse.json(
          {
            message:
              "Unable to revoke session. Please try again.",
          },
          {
            status: 502,
            headers: { "Cache-Control": "no-store" },
          }
        );
      }
    } catch {
      return NextResponse.json(
        {
          message:
            "Unable to connect to the authentication service.",
        },
        {
          status: 502,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }
  }

  const response = NextResponse.json(
    { success: true },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );

  clearCookies(response);

  return response;
}
