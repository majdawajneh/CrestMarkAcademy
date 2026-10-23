
import { NextRequest, NextResponse } from "next/server";

// PayTabs may return the customer using POST.
// This route only redirects the browser.
// It must never confirm or finalize a payment.

export function POST(request: NextRequest) {
  const orderId =
    request.nextUrl.searchParams.get("orderId");

  const localeParam =
    request.nextUrl.searchParams.get("locale");

  const locale =
    localeParam === "ar" ? "ar" : "en";

  const destination = new URL(
    `/${locale}/payment/result`,
    request.nextUrl.origin
  );

  if (
    orderId &&
    /^[1-9]\d*$/.test(orderId) &&
    Number.isSafeInteger(Number(orderId))
  ) {
    destination.searchParams.set("orderId", orderId);
  }

  // Convert PayTabs POST return to GET navigation.
  const response = NextResponse.redirect(
    destination,
    303
  );

  response.headers.set("Cache-Control", "no-store");

  return response;
}
