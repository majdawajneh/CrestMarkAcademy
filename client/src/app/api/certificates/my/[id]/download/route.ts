
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

type Context = {
  params: Promise<{ id: string }>;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  const { id } = await params;

  // Validate certificate ID.
  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id))
  ) {
    return errorResponse("Invalid certificate ID.", 400);
  }

  // Read the access token from the HttpOnly cookie.
  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return errorResponse("Authentication required.", 401);
  }

  try {
    // The ASP.NET Core endpoint checks certificate ownership.
    const response = await fetch(
      `${API_URL.replace(/\/$/, "")}/api/certificates/my/${id}/download`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/pdf",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      }
    );

    if (response.status === 401) {
      return errorResponse("Session expired.", 401);
    }

    if (response.status === 403) {
      return errorResponse("Access denied.", 403);
    }

    if (response.status === 404) {
      return errorResponse("Certificate not found.", 404);
    }

    if (!response.ok) {
      return errorResponse(
        "Unable to generate certificate PDF.",
        502
      );
    }

    const contentType =
      response.headers.get("content-type") || "";

    if (
      !contentType.toLowerCase().includes("application/pdf")
    ) {
      return errorResponse(
        "Invalid certificate file response.",
        502
      );
    }

    const pdfBytes = await response.arrayBuffer();

    if (
      pdfBytes.byteLength < 5 ||
      new TextDecoder("ascii").decode(
        pdfBytes.slice(0, 5)
      ) !== "%PDF-"
    ) {
      return errorResponse(
        "Invalid PDF file.",
        502
      );
    }

    const fileName =
      `CrestMark-Certificate-${id}.pdf`;

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return errorResponse(
      "Certificate download service unavailable.",
      502
    );
  }
}
