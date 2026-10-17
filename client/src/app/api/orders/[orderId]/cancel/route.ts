
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type Context = {
  params: Promise<{ orderId: string }>;
};

const privateHeaders = {
  "Cache-Control": "private, no-store",
};

export async function POST(
  request: NextRequest,
  { params }: Context
) {
  // Only accept same-origin browser requests.
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403, headers: privateHeaders }
    );
  }

  const { orderId } = await params;

  if (
    !/^[1-9]\d*$/.test(orderId) ||
    !Number.isSafeInteger(Number(orderId))
  ) {
    return NextResponse.json(
      { message: "Invalid order ID." },
      { status: 400, headers: privateHeaders }
    );
  }

  const token = (await cookies()).get("cm_access")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401, headers: privateHeaders }
    );
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/orders/${orderId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }
    );

    if (
      response.status === 401 ||
      response.status === 403 ||
      response.status === 404 ||
      response.status === 409
    ) {
      return NextResponse.json(
        {
          message:
            response.status === 409
              ? "This order cannot be cancelled. Refresh its status."
              : "Order cancellation unavailable.",
        },
        {
          status: response.status,
          headers: privateHeaders,
        }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: "Unable to cancel order." },
        { status: 502, headers: privateHeaders }
      );
    }

    const data: unknown = await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      !("id" in data) ||
      !("status" in data) ||
      data.id !== Number(orderId) ||
      data.status !== "Cancelled"
    ) {
      return NextResponse.json(
        { message: "Invalid cancellation response." },
        { status: 502, headers: privateHeaders }
      );
    }

    return NextResponse.json(data, {
      headers: privateHeaders,
    });
  } catch {
    return NextResponse.json(
      { message: "Order service is unavailable." },
      { status: 502, headers: privateHeaders }
    );
  }
}
