
import { NextResponse } from "next/server";
import {
  invalidAdminRoute,
  parsePositiveId,
  proxyAdminApi,
} from "@/lib/adminApiProxy";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: Context
) {
  const { id: rawId } = await params;
  const id = parsePositiveId(rawId);

  if (!id) return invalidAdminRoute();

  return proxyAdminApi(
    "GET",
    `/api/admin/coupons/${id}`
  );
}

export async function PUT(
  request: Request,
  { params }: Context
) {
  const { id: rawId } = await params;
  const id = parsePositiveId(rawId);

  if (!id) return invalidAdminRoute();

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
    "PUT",
    `/api/admin/coupons/${id}`,
    payload
  );
}
