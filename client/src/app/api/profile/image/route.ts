
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_BASE_URL || "http://localhost:5299";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const endpoint =
  `${API_URL.replace(/\/$/, "")}/api/profile/image`;

function error(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "private, no-store" },
    }
  );
}

function getToken(request: NextRequest) {
  return request.cookies.get("cm_access")?.value;
}

function validOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  return origin !== null && origin === request.nextUrl.origin;
}

// =====================================
// GET - Read Profile Image
// =====================================

export async function GET(request: NextRequest) {
  const token = getToken(request);

  if (!token) {
    return error("Authentication required.", 401);
  }

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "image/jpeg, image/png, image/webp",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });

    if (response.status === 401) {
      return error("Session expired.", 401);
    }

    if (response.status === 404) {
      return error("Image not found.", 404);
    }

    if (!response.ok) {
      return error("Unable to load image.", 502);
    }

    const contentType =
      response.headers.get("content-type");

    if (
      !contentType ||
      !["image/jpeg", "image/png", "image/webp"].includes(
        contentType.toLowerCase()
      )
    ) {
      return error("Invalid image response.", 502);
    }

    const bytes = await response.arrayBuffer();

    if (bytes.byteLength > MAX_IMAGE_SIZE) {
      return error("Image exceeds size limit.", 502);
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return error("Image service unavailable.", 502);
  }
}

// =====================================
// POST - Upload Profile Image
// =====================================

export async function POST(request: NextRequest) {
  if (!validOrigin(request)) {
    return error("Invalid request origin.", 403);
  }

  const token = getToken(request);

  if (!token) {
    return error("Authentication required.", 401);
  }

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return error("Please select an image.", 400);
    }

    if (
      file.size === 0 ||
      file.size > MAX_IMAGE_SIZE ||
      !["image/jpeg", "image/png", "image/webp"].includes(
        file.type
      )
    ) {
      return error("Invalid image or size exceeds 2MB.", 400);
    }

    const payload = new FormData();
    payload.append("file", file, file.name);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: payload,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    if (response.status === 401) {
      return error("Session expired.", 401);
    }

    if (response.status === 400) {
      return error("Image was rejected by the server.", 400);
    }

    if (!response.ok) {
      return error("Unable to upload image.", 502);
    }

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch {
    return error("Image upload failed.", 502);
  }
}

// =====================================
// DELETE - Remove Profile Image
// =====================================

export async function DELETE(request: NextRequest) {
  if (!validOrigin(request)) {
    return error("Invalid request origin.", 403);
  }

  const token = getToken(request);

  if (!token) {
    return error("Authentication required.", 401);
  }

  try {
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });

    if (response.status === 401) {
      return error("Session expired.", 401);
    }

    if (!response.ok) {
      return error("Unable to delete image.", 502);
    }

    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return error("Image deletion failed.", 502);
  }
}
