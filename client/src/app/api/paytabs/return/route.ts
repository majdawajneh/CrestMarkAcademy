
import { NextRequest, NextResponse } from "next/server";

// PayTabs returns the customer using POST.
// This endpoint must never mark a payment as successful.

export function POST(request: NextRequest) {
  const orderId =
    request.nextUrl.searchParams.get("orderId");

  const destination = new URL(
    "/en/payment/result",
    request.nextUrl.origin
  );

  if (
    orderId &&
    /^[1-9]\d*$/.test(orderId) &&
    Number.isSafeInteger(Number(orderId))
  ) {
    destination.searchParams.set("orderId", orderId);
  }

  // 303 converts the browser's POST navigation
  // into a GET request to the result page.
  const response = NextResponse.redirect(destination, 303);

  response.headers.set("Cache-Control", "no-store");

  return response;
}
