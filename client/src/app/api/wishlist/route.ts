
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = (
  process.env.API_BASE_URL ||
  "http://localhost:5299"
).replace(/\/+$/, "");


function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");

  if (site === "cross-site") return false;
  if (!origin) return true;

  return origin === request.nextUrl.origin;
}

async function proxy(
  method: "GET" | "POST" | "DELETE",
  courseId?: number
) {
  const token = (await cookies()).get("cm_access")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 }
    );
  }

  const endpoint =
    method === "GET"
      ? `${API_URL}/api/wishlist`
      : `${API_URL}/api/wishlist/courses/${courseId}`;

  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const body = await response.text();

    return new NextResponse(body || null, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ||
          "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Wishlist service is unavailable." },
      { status: 502 }
    );
  }
}

async function mutate(
  request: NextRequest,
  method: "POST" | "DELETE"
) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { message: "Forbidden." },
      { status: 403 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request." },
      { status: 400 }
    );
  }

  const courseId =
    body &&
    typeof body === "object" &&
    "courseId" in body
      ? (body as { courseId: unknown }).courseId
      : null;

  if (
    typeof courseId !== "number" ||
    !Number.isSafeInteger(courseId) ||
    courseId <= 0
  ) {
    return NextResponse.json(
      { message: "Invalid course ID." },
      { status: 400 }
    );
  }

  return proxy(method, courseId);
}

export async function GET() {
  return proxy("GET");
}

export async function POST(request: NextRequest) {
  return mutate(request, "POST");
}

export async function DELETE(request: NextRequest) {
  return mutate(request, "DELETE");
}
