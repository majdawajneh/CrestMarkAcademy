
import { NextResponse } from "next/server";
import { proxyAdminApi } from "@/lib/adminApiProxy";

export async function GET() {
  return proxyAdminApi("GET", "/api/admin/coupons");
}

export async function POST(request: Request) {
  const payload: unknown = await request.json().catch(() => null);

  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    return NextResponse.json(
      { message: "A valid coupon JSON body is required." },
      { status: 400 }
    );
  }

  return proxyAdminApi(
    "POST",
    "/api/admin/coupons",
    payload
  );
}
