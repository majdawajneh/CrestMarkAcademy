
import { NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/api/categories`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Unable to load categories." },
        {
          status: 502,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { message: "Invalid categories response." },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "Categories service unavailable." },
      { status: 502 }
    );
  }
}
