
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

const privateHeaders = {
  "Cache-Control": "private, no-store",
};

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
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
      `${API_BASE_URL}/api/payments/orders/${orderId}`,
      {
        method: "GET",
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
      response.status === 404
    ) {
      return NextResponse.json(
        { message: "Payment information unavailable." },
        {
          status: response.status,
          headers: privateHeaders,
        }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: "Unable to load payments." },
        { status: 502, headers: privateHeaders }
      );
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { message: "Invalid payments response." },
        { status: 502, headers: privateHeaders }
      );
    }

    return NextResponse.json(data, {
      headers: privateHeaders,
    });
  } catch {
    return NextResponse.json(
      { message: "Payment service is unavailable." },
      { status: 502, headers: privateHeaders }
    );
  }
}
