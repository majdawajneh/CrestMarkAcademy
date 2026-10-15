
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export function parsePositiveId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;

  const number = Number(value);

  return Number.isSafeInteger(number) && number <= 2147483647
    ? number
    : null;
}

export function invalidAdminRoute() {
  return NextResponse.json(
    { message: "Invalid administration endpoint or identifier." },
    { status: 400 }
  );
}

export async function proxyAdminApi(
  method: Method,
  backendPath: string
) {
  const token = (await cookies()).get("cm_access")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${API_URL}${backendPath}`, {
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

    const raw = await response.text();

    let result: unknown;

    try {
      result = raw ? JSON.parse(raw) : { success: response.ok };
    } catch {
      result = {
        message:
          raw.trim().slice(0, 500) ||
          (response.ok
            ? "Operation completed."
            : "The request failed."),
      };
    }

    if (response.status >= 500) {
      return NextResponse.json(
        { message: "The administration service is unavailable." },
        { status: 502 }
      );
    }

    return NextResponse.json(result, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "Could not connect to the administration service." },
      { status: 502 }
    );
  }
}
