
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

const privateHeaders = {
  "Cache-Control": "private, no-store",
};

export async function GET() {
  const token = (await cookies()).get("cm_access")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401, headers: privateHeaders }
    );
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/orders/my`,
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

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { message: "Access denied." },
        {
          status: response.status,
          headers: privateHeaders,
        }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: "Unable to load orders." },
        { status: 502, headers: privateHeaders }
      );
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { message: "Invalid orders response." },
        { status: 502, headers: privateHeaders }
      );
    }

    return NextResponse.json(data, {
      headers: privateHeaders,
    });
  } catch {
    return NextResponse.json(
      { message: "Orders service is unavailable." },
      { status: 502, headers: privateHeaders }
    );
  }
}
