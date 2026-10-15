
import { NextRequest, NextResponse } from "next/server";

type CurrentUser = {
  userId: string;
  username: string;
  email: string;
  roles: string[];
};

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("cm_access")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { authenticated: false },
      {
        status: 401,
        headers: noStoreHeaders,
      }
    );
  }

  try {
    const response = await fetch(`${API_URL}/api/Auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { authenticated: false },
        {
          status: 401,
          headers: noStoreHeaders,
        }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: "Unable to load user session." },
        {
          status: 502,
          headers: noStoreHeaders,
        }
      );
    }

    const data: unknown = await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return NextResponse.json(
        { message: "Invalid user response." },
        {
          status: 502,
          headers: noStoreHeaders,
        }
      );
    }

    const user = data as Record<string, unknown>;

    if (
      typeof user.userId !== "string" ||
      user.userId.trim().length === 0 ||
      typeof user.username !== "string" ||
      typeof user.email !== "string" ||
      !Array.isArray(user.roles) ||
      !user.roles.every(
        (role) => typeof role === "string"
      )
    ) {
      return NextResponse.json(
        { message: "Invalid user response." },
        {
          status: 502,
          headers: noStoreHeaders,
        }
      );
    }

    const currentUser: CurrentUser = {
      userId: user.userId,
      username: user.username,
      email: user.email,
      roles: user.roles as string[],
    };

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: currentUser.userId,
          username: currentUser.username,
          email: currentUser.email,
          roles: currentUser.roles,
        },
      },
      {
        status: 200,
        headers: noStoreHeaders,
      }
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the server." },
      {
        status: 502,
        headers: noStoreHeaders,
      }
    );
  }
}
