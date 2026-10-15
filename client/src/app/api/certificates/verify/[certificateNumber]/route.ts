
import { NextResponse } from "next/server";


type RouteContext = {
  params: Promise<{
    certificateNumber: string;
  }>;
};

type PublicCertificate = {
  certificateNumber: string;
  studentName: string;
  courseTitle: string;
  issuedAt: string;
  courseCompletedAt: string | null;
};

const API_BASE_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

const CERTIFICATE_NUMBER_PATTERN =
  /^CMA-[0-9]{4}-[A-Z0-9]{8}$/;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function errorResponse(
  message: string,
  status: number,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: {
        ...NO_STORE_HEADERS,
        ...extraHeaders,
      },
    }
  );
}

function isValidCertificateNumber(
  value: string
): boolean {
  return CERTIFICATE_NUMBER_PATTERN.test(value);
}

function isValidDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !Number.isNaN(Date.parse(value))
  );
}

function isPublicCertificate(
  value: unknown,
  expectedNumber: string
): value is PublicCertificate {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    item.certificateNumber === expectedNumber &&
    typeof item.studentName === "string" &&
    item.studentName.trim().length > 0 &&
    typeof item.courseTitle === "string" &&
    item.courseTitle.trim().length > 0 &&
    isValidDate(item.issuedAt) &&
    (item.courseCompletedAt === null ||
      isValidDate(item.courseCompletedAt))
  );
}

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  const { certificateNumber } = await params;

  const normalizedNumber =
    certificateNumber.trim().toUpperCase();

  // Reject malformed certificate numbers before
  // forwarding the request to ASP.NET Core.
  if (!isValidCertificateNumber(normalizedNumber)) {
    return errorResponse(
      "Invalid certificate number format.",
      400
    );
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/certificates/verify/${encodeURIComponent(normalizedNumber)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    // The ASP.NET Core rate limiter rejected the request.
    // Preserve the 429 status instead of turning it into 502.
    if (response.status === 429) {
      const retryAfter =
        response.headers.get("retry-after");

      const extraHeaders: Record<string, string> = {};

      if (
        retryAfter &&
        (/^\d+$/.test(retryAfter) ||
          !Number.isNaN(Date.parse(retryAfter)))
      ) {
        extraHeaders["Retry-After"] = retryAfter;
      }

      return errorResponse(
        "Too many verification requests. Please try again later.",
        429,
        extraHeaders
      );
    }

    if (response.status === 404) {
      return errorResponse(
        "Certificate not found.",
        404
      );
    }

    if (!response.ok) {
      return errorResponse(
        "Certificate verification is temporarily unavailable.",
        502
      );
    }

    const contentType =
      response.headers.get("content-type") || "";

    if (
      !contentType
        .toLowerCase()
        .includes("application/json")
    ) {
      return errorResponse(
        "Invalid verification response.",
        502
      );
    }

    const data: unknown = await response.json();

    if (!isPublicCertificate(data, normalizedNumber)) {
      return errorResponse(
        "Invalid verification response.",
        502
      );
    }

    // Whitelist public verification fields only.
    // Never expose internal IDs or account information.
    const publicCertificate: PublicCertificate = {
      certificateNumber: data.certificateNumber,
      studentName: data.studentName,
      courseTitle: data.courseTitle,
      issuedAt: data.issuedAt,
      courseCompletedAt: data.courseCompletedAt,
    };

    return NextResponse.json(publicCertificate, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch {
    return errorResponse(
      "Certificate verification is temporarily unavailable.",
      502
    );
  }
}
