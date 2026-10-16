
import { cookies } from "next/headers";

const API_BASE = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function jsonError(message: string, status: number) {
  return Response.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function forwardResponse(response: Response) {
  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") ||
        "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// =====================================
// Public course details
// GET /api/checkout?slug=...
// =====================================

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug");

  if (!slug || !/^[a-zA-Z0-9-]{1,200}$/.test(slug)) {
    return jsonError("Invalid course slug.", 400);
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/courses/${encodeURIComponent(slug)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }
    );

    return await forwardResponse(response);
  } catch {
    return jsonError("Course service is unavailable.", 503);
  }
}

// =====================================
// Create pending order
// POST /api/checkout
// Body: { courseId, couponCode }
// =====================================

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .includes("application/json")
  ) {
    return jsonError("JSON body is required.", 415);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  if (!isObject(body)) {
    return jsonError("Invalid checkout request.", 400);
  }

  const courseId = body.courseId;

  if (
    typeof courseId !== "number" ||
    !Number.isSafeInteger(courseId) ||
    courseId <= 0
  ) {
    return jsonError("Invalid course ID.", 400);
  }

  const rawCoupon = body.couponCode;

  if (
    rawCoupon !== undefined &&
    rawCoupon !== null &&
    typeof rawCoupon !== "string"
  ) {
    return jsonError("Invalid coupon code.", 400);
  }

  const couponCode =
    typeof rawCoupon === "string"
      ? rawCoupon.trim()
      : "";

  if (couponCode.length > 80) {
    return jsonError("Coupon code is too long.", 400);
  }

  const token = (await cookies()).get("cm_access")?.value;

  if (!token) {
    return jsonError("Please sign in to continue.", 401);
  }

  try {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        courseIds: [courseId],
        couponCode: couponCode || null,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    return await forwardResponse(response);
  } catch {
    return jsonError("Order service is unavailable.", 503);
  }
}
