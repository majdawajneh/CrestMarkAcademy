
import { cookies } from "next/headers";

const API_BASE = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

function errorResponse(message: string, status: number) {
  return Response.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function extractUrl(value: unknown): string | null {
  if (typeof value === "string") return value;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  for (const key of ["redirectUrl", "redirect_url", "url"]) {
    if (typeof record[key] === "string") {
      return record[key];
    }
  }

  return null;
}

function validPayTabsUrl(value: string | null): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname.toLowerCase() ===
        "secure-jordan.paytabs.com" &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

// =====================================
// Start PayTabs checkout
// POST /api/checkout/paytabs
// =====================================

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return errorResponse("Invalid request origin.", 403);
  }

  // Explicit deployment switch.
  // Keep disabled until prices, currency,
  // payment credentials and callback are verified.
  if (process.env.CHECKOUT_PAYMENTS_ENABLED !== "true") {
    return errorResponse(
      "Online payments are not enabled yet.",
      503
    );
  }

  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .includes("application/json")
  ) {
    return errorResponse("JSON body is required.", 415);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return errorResponse("Invalid payment request.", 400);
  }

  const orderId = (body as Record<string, unknown>).orderId;

  if (
    typeof orderId !== "number" ||
    !Number.isSafeInteger(orderId) ||
    orderId <= 0
  ) {
    return errorResponse("Invalid order ID.", 400);
  }

  const token = (await cookies()).get("cm_access")?.value;

  if (!token) {
    return errorResponse("Please sign in to continue.", 401);
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/paytabs/orders/${orderId}/checkout`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      }
    );

    const text = await response.text();

    if (!response.ok) {
      let message = "Unable to start the payment session.";

      try {
        const error: unknown = JSON.parse(text);

        if (
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
        ) {
          message = error.message;
        }
      } catch {
        // Do not expose internal HTML errors.
      }

      return errorResponse(message, response.status);
    }

    let payload: unknown;

    try {
      payload = JSON.parse(text);
    } catch {
      payload = text.trim();
    }

    const redirectUrl = extractUrl(payload);

    if (!validPayTabsUrl(redirectUrl)) {
      return errorResponse(
        "The payment gateway returned an invalid URL.",
        502
      );
    }

    return Response.json(
      { redirectUrl },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return errorResponse("Payment service is unavailable.", 503);
  }
}
