
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type InstructorProfileInput = {
  professionalTitle: string | null;
  expertise: string | null;
  experience: string | null;
  linkedInUrl: string | null;
  gitHubUrl: string | null;
  websiteUrl: string | null;
  youTubeUrl: string | null;
};

function reply(data: unknown, status: number) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function validText(value: unknown, max: number): boolean {
  return (
    value === null ||
    (typeof value === "string" && value.length <= max)
  );
}

function validUrl(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value !== "string" || value.length > 1000) return false;

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function validInput(value: unknown): value is InstructorProfileInput {
  if (!isRecord(value)) return false;

  return (
    validText(value.professionalTitle, 200) &&
    validText(value.expertise, 2000) &&
    validText(value.experience, 2000) &&
    validUrl(value.linkedInUrl) &&
    validUrl(value.gitHubUrl) &&
    validUrl(value.websiteUrl) &&
    validUrl(value.youTubeUrl)
  );
}

export async function PUT(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return reply({ message: "Invalid request origin." }, 403);
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return reply({ message: "Authentication required." }, 401);
  }

  let payload: InstructorProfileInput;

  try {
    const body: unknown = await request.json();

    if (!validInput(body)) {
      return reply({ message: "Invalid instructor profile data." }, 400);
    }

    payload = body;
  } catch {
    return reply({ message: "Invalid JSON body." }, 400);
  }

  try {
    const authResponse = await fetch(`${API_URL}/api/Auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (authResponse.status === 401) {
      return reply({ message: "Session expired." }, 401);
    }

    if (!authResponse.ok) {
      return reply(
        { message: "Unable to verify instructor permissions." },
        502
      );
    }

    const authData: unknown = await authResponse.json();

    if (
      !isRecord(authData) ||
      !Array.isArray(authData.roles) ||
      !authData.roles.every((role) => typeof role === "string") ||
      !authData.roles.includes("Instructor")
    ) {
      return reply({ message: "Instructor access required." }, 403);
    }

    const response = await fetch(
      `${API_URL}/api/profile/instructor`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }
    );

    if (response.status === 401) {
      return reply({ message: "Session expired." }, 401);
    }

    if (response.status === 403) {
      return reply({ message: "Instructor access denied." }, 403);
    }

    // Preserve ASP.NET Core validation responses.
    const responseText = await response.text();

    let result: unknown = null;

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch {
        result = { message: responseText };
      }
    }

    if (!response.ok) {
      return reply(
        result ?? { message: "Unable to update instructor profile." },
        response.status
      );
    }

    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    return reply(result ?? { success: true }, 200);
  } catch {
    return reply(
      { message: "Instructor profile service unavailable." },
      502
    );
  }
}
