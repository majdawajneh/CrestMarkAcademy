
import { NextRequest, NextResponse } from "next/server";

type CurrentUser = {
  userId: string;
  username: string;
  email: string;
  roles: string[];
};

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

export async function GET(request: NextRequest) {
  const accessToken =
    request.cookies.get("cm_access")?.value;

  const headers = {
    "Cache-Control": "no-store",
  };

  if (!accessToken) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401, headers }
    );
  }

  try {
    const response = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/Auth/me`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    if (response.status === 401 ||
        response.status === 403) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401, headers }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: "Unable to load user session." },
        { status: 502, headers }
      );
    }

    const data: CurrentUser = await response.json();

    if (
      typeof data.userId !== "string" ||
      typeof data.username !== "string" ||
      !Array.isArray(data.roles)
    ) {
      return NextResponse.json(
        { message: "Invalid user response." },
        { status: 502, headers }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: data.userId,
          username: data.username,
          email: data.email,
          roles: data.roles,
        },
      },
      { headers }
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the server." },
      { status: 502, headers }
    );
  }
}
