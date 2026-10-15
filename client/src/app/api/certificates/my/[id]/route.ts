
import { NextRequest, NextResponse } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

type CertificateDetails = {
  id: number;
  enrollmentId: number;
  certificateNumber: string;
  certificateUrl: string | null;
  issuedAt: string;
  courseId: number;
  courseTitle: string;
  userId: number;
  studentName: string;
  courseCompletedAt: string | null;
};

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

function reply(data: unknown, status: number) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

function validId(value: string): boolean {
  return (
    /^[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value))
  );
}

function validPositiveNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function validDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value))
  );
}

function validCertificate(
  data: unknown,
  certificateId: number
): data is CertificateDetails {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return false;
  }

  const value = data as Record<string, unknown>;

  return (
    value.id === certificateId &&
    validPositiveNumber(value.enrollmentId) &&
    typeof value.certificateNumber === "string" &&
    value.certificateNumber.trim().length > 0 &&
    (value.certificateUrl === null ||
      typeof value.certificateUrl === "string") &&
    validDate(value.issuedAt) &&
    validPositiveNumber(value.courseId) &&
    typeof value.courseTitle === "string" &&
    value.courseTitle.trim().length > 0 &&
    validPositiveNumber(value.userId) &&
    typeof value.studentName === "string" &&
    value.studentName.trim().length > 0 &&
    (value.courseCompletedAt === null ||
      validDate(value.courseCompletedAt))
  );
}

// GET: Details of a certificate owned by the current user.
export async function GET(
  request: NextRequest,
  { params }: Context
) {
  const { id } = await params;

  if (!validId(id)) {
    return reply(
      { message: "Invalid certificate ID." },
      400
    );
  }

  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return reply(
      { message: "Authentication required." },
      401
    );
  }

  try {
    const response = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/certificates/my/${id}`,
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

    if (response.status === 404) {
      return reply(
        { message: "Certificate not found." },
        404
      );
    }

    if (!response.ok) {
      return reply(
        { message: "Unable to load certificate." },
        502
      );
    }

    const data: unknown = await response.json();

    if (!validCertificate(data, Number(id))) {
      return reply(
        { message: "Invalid certificate data." },
        502
      );
    }

    // Return only the information required for the viewer.
    return reply(
      {
        id: data.id,
        certificateNumber: data.certificateNumber,
        certificateUrl: data.certificateUrl,
        issuedAt: data.issuedAt,
        courseId: data.courseId,
        courseTitle: data.courseTitle,
        studentName: data.studentName,
        courseCompletedAt: data.courseCompletedAt,
      },
      200
    );
  } catch {
    return reply(
      { message: "Certificate service unavailable." },
      502
    );
  }
}
