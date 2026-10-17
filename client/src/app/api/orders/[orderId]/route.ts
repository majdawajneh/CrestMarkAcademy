
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type Context = {
  params: Promise<{ orderId: string }>;
};

const privateHeaders = {
  "Cache-Control": "private, no-store",
};

export async function GET(
  _request: Request,
  { params }: Context
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
      `${API_BASE_URL}/api/orders/${orderId}`,
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
        { message: "Order unavailable." },
        {
          status: response.status,
          headers: privateHeaders,
        }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: "Unable to load order." },
        { status: 502, headers: privateHeaders }
      );
    }

    const data: unknown = await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return NextResponse.json(
        { message: "Invalid order response." },
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
