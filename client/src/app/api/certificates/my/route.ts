
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

type Certificate = {
  id: number;
  enrollmentId: number;
  certificateNumber: string;
  certificateUrl: string | null;
  issuedAt: string;
};

function reply(data: unknown, status: number) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

function validPositiveId(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function validCertificate(
  data: unknown
): data is Certificate {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return false;
  }

  const value = data as Record<string, unknown>;

  return (
    validPositiveId(value.id) &&
    validPositiveId(value.enrollmentId) &&
    typeof value.certificateNumber === "string" &&
    value.certificateNumber.trim().length > 0 &&
    (value.certificateUrl === null ||
      typeof value.certificateUrl === "string") &&
    typeof value.issuedAt === "string" &&
    !Number.isNaN(Date.parse(value.issuedAt))
  );
}

// =====================================
// GET: Current Student Certificates
// =====================================

export async function GET(request: NextRequest) {
  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return reply(
      { message: "Authentication required." },
      401
    );
  }

  try {
    const response = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/certificates/my`,
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

    if (response.status === 401) {
      return reply(
        { message: "Session expired." },
        401
      );
    }

    if (response.status === 403) {
      return reply(
        { message: "Access denied." },
        403
      );
    }

    if (!response.ok) {
      return reply(
        { message: "Unable to load your certificates." },
        502
      );
    }

    const data: unknown = await response.json();

    if (
      !Array.isArray(data) ||
      !data.every(validCertificate)
    ) {
      return reply(
        { message: "Invalid certificate data." },
        502
      );
    }

    // Return only the fields needed by the
    // student certificate listing.
    const certificates: Certificate[] = data.map(
      (certificate: Certificate) => ({
        id: certificate.id,
        enrollmentId: certificate.enrollmentId,
        certificateNumber: certificate.certificateNumber,
        certificateUrl: certificate.certificateUrl,
        issuedAt: certificate.issuedAt,
      })
    );

    return reply(certificates, 200);
  } catch {
    return reply(
      { message: "Certificate service unavailable." },
      502
    );
  }
}
