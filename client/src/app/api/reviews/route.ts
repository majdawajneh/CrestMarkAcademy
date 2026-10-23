
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type ReviewMutation = {
  courseId?: number;
  reviewId?: number;
  rating?: number;
  comment?: string | null;
};

function validId(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function sameOrigin(request: NextRequest): boolean {
  if (
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return false;
  }

  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

async function forward(
  request: NextRequest,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  payload?: { rating: number; comment: string | null }
) {
  const token =
    method === "GET"
      ? null
      : (await cookies()).get("cm_access")?.value;

  if (method !== "GET" && !token) {
    return NextResponse.json(
      { message: "Please sign in to manage your review." },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      headers: {
        Accept: "application/json",
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...(payload
          ? { "Content-Type": "application/json" }
          : {}),
      },
      ...(payload
        ? { body: JSON.stringify(payload) }
        : {}),
    });

    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Cache-Control": "no-store",
        },
      });
    }

    const responseBody = await response.text();

    return new NextResponse(responseBody || null, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ||
          "text/plain",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "Reviews service is temporarily unavailable.",
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  const rawId =
    request.nextUrl.searchParams.get("courseId");

  const courseId = rawId ? Number(rawId) : NaN;

  if (!validId(courseId)) {
    return NextResponse.json(
      { message: "Invalid course ID." },
      { status: 400 }
    );
  }

  return forward(
    request,
    "GET",
    `/api/reviews/courses/${courseId}`
  );
}

export async function POST(request: NextRequest) {
  return mutate(request, "POST");
}

export async function PUT(request: NextRequest) {
  return mutate(request, "PUT");
}

export async function DELETE(request: NextRequest) {
  return mutate(request, "DELETE");
}

async function mutate(
  request: NextRequest,
  method: "POST" | "PUT" | "DELETE"
) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { message: "Forbidden." },
      { status: 403 }
    );
  }

  let body: ReviewMutation;

  try {
    const value: unknown = await request.json();

    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      throw new Error("Invalid payload");
    }

    body = value as ReviewMutation;
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON request." },
      { status: 400 }
    );
  }

  const targetId =
    method === "POST"
      ? body.courseId
      : body.reviewId;

  if (!validId(targetId)) {
    return NextResponse.json(
      {
        message: "Invalid review or course ID.",
      },
      { status: 400 }
    );
  }

  if (method === "DELETE") {
    return forward(
      request,
      method,
      `/api/reviews/${targetId}`
    );
  }

  if (
    typeof body.rating !== "number" ||
    !Number.isInteger(body.rating) ||
    body.rating < 1 ||
    body.rating > 5 ||
    (body.comment !== undefined &&
      body.comment !== null &&
      typeof body.comment !== "string") ||
    (typeof body.comment === "string" &&
      body.comment.trim().length > 1000)
  ) {
    return NextResponse.json(
      {
        message:
          "Rating must be 1–5 and comment at most 1000 characters.",
      },
      { status: 400 }
    );
  }

  const payload = {
    rating: body.rating,
    comment:
      typeof body.comment === "string"
        ? body.comment.trim() || null
        : null,
  };

  return forward(
    request,
    method,
    method === "POST"
      ? `/api/reviews/courses/${targetId}`
      : `/api/reviews/${targetId}`,
    payload
  );
}
