
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

type ProfileInput = {
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  bio: string | null;
  phoneNumber: string | null;
  country: string | null;
  dateOfBirth: string | null;
};

function reply(data: unknown, status: number) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

function validInput(value: unknown): value is ProfileInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const data = value as Record<string, unknown>;

  const validName = (name: unknown) =>
    typeof name === "string" &&
    name.trim().length >= 2 &&
    name.trim().length <= 100;

  const validOptional = (text: unknown, max: number) =>
    text === null ||
    (typeof text === "string" && text.length <= max);

  if (
    !validName(data.firstName) ||
    !validName(data.lastName) ||
    !validOptional(data.profileImageUrl, 1000) ||
    !validOptional(data.bio, 1000) ||
    !validOptional(data.phoneNumber, 30) ||
    !validOptional(data.country, 100)
  ) {
    return false;
  }

  if (data.profileImageUrl) {
    try {
      const url = new URL(data.profileImageUrl as string);

      if (url.protocol !== "https:") return false;
    } catch {
      return false;
    }
  }

  if (data.dateOfBirth !== null) {
    if (
      typeof data.dateOfBirth !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)
    ) {
      return false;
    }

    const date = new Date(`${data.dateOfBirth}T00:00:00Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== data.dateOfBirth ||
      data.dateOfBirth > new Date().toISOString().slice(0, 10)
    ) {
      return false;
    }
  }

  return true;
}

async function proxy(
  request: NextRequest,
  method: "GET" | "PUT"
) {
  if (method === "PUT") {
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return reply({ message: "Invalid request origin." }, 403);
    }
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return reply({ message: "Authentication required." }, 401);
  }

  let input: ProfileInput | undefined;

  if (method === "PUT") {
    try {
      const body: unknown = await request.json();

      if (!validInput(body)) {
        return reply({ message: "Invalid profile data." }, 400);
      }

      input = body;
    } catch {
      return reply({ message: "Invalid JSON body." }, 400);
    }
  }

  try {
    const response = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/profile`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(input ? { "Content-Type": "application/json" } : {}),
        },
        body: input ? JSON.stringify(input) : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }
    );

    if (response.status === 401) {
      return reply({ message: "Session expired." }, 401);
    }

    if (response.status === 403) {
      return reply({ message: "Access denied." }, 403);
    }

    if (response.status === 400) {
      return reply({ message: "Invalid profile information." }, 400);
    }

    if (!response.ok) {
      return reply({ message: "Profile service unavailable." }, 502);
    }

    const data: unknown = await response.json();

    return reply(data, 200);
  } catch {
    return reply({ message: "Profile service unavailable." }, 502);
  }
}

export function GET(request: NextRequest) {
  return proxy(request, "GET");
}

export function PUT(request: NextRequest) {
  return proxy(request, "PUT");
}
