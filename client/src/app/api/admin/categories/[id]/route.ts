
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type Context = {
  params: Promise<{ id: string }>;
};

type CategoryPayload = {
  name: string;
  description: string | null;
  imageUrl: string | null;
  parentCategoryId: number | null;
  isActive: boolean;
};

function parseCategoryPayload(value: unknown): CategoryPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const body = value as Record<string, unknown>;

  if (
    typeof body.name !== "string" ||
    !body.name.trim() ||
    body.name.trim().length > 150 ||
    (body.description !== null &&
      typeof body.description !== "string") ||
    (body.imageUrl !== null && typeof body.imageUrl !== "string") ||
    typeof body.isActive !== "boolean" ||
    (body.parentCategoryId !== null &&
      (!Number.isSafeInteger(body.parentCategoryId) ||
        (body.parentCategoryId as number) <= 0))
  ) {
    return null;
  }

  const imageUrl = (body.imageUrl as string | null)?.trim() || null;

  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      if (!["https:", "http:"].includes(url.protocol)) return null;
    } catch {
      return null;
    }
  }

  return {
    name: body.name.trim(),
    description:
      (body.description as string | null)?.trim() || null,
    imageUrl,
    parentCategoryId: body.parentCategoryId as number | null,
    isActive: body.isActive,
  };
}

function checkId(id: string): number | null {
  const value = Number(id);

  return /^\d+$/.test(id) &&
    Number.isSafeInteger(value) &&
    value > 0
    ? value
    : null;
}

async function forward(
  method: "GET" | "PUT" | "PATCH",
  id: number,
  payload?: CategoryPayload,
  active?: boolean
) {
  const token = (await cookies()).get("cm_access")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 }
    );
  }

  const suffix =
    method === "PATCH"
      ? `/${active ? "activate" : "deactivate"}`
      : "";

  try {
    const response = await fetch(
      `${API_URL}/api/admin/categories/${id}${suffix}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(payload ? { "Content-Type": "application/json" } : {}),
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const raw = await response.text();
    let result: unknown;

    try {
      result = raw ? JSON.parse(raw) : {};
    } catch {
      return NextResponse.json(
        { message: "Unexpected backend response." },
        { status: 502 }
      );
    }

    if (response.status >= 500) {
      return NextResponse.json(
        { message: "Category service is temporarily unavailable." },
        { status: 502 }
      );
    }

    return NextResponse.json(result, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "Could not connect to the category service." },
      { status: 502 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: Context
) {
  const { id: rawId } = await params;
  const id = checkId(rawId);

  if (!id) {
    return NextResponse.json(
      { message: "Invalid category ID." },
      { status: 400 }
    );
  }

  return forward("GET", id);
}

export async function PUT(
  request: Request,
  { params }: Context
) {
  const { id: rawId } = await params;
  const id = checkId(rawId);

  if (!id) {
    return NextResponse.json(
      { message: "Invalid category ID." },
      { status: 400 }
    );
  }

  let data: unknown;

  try {
    data = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const payload = parseCategoryPayload(data);

  if (!payload || payload.parentCategoryId === id) {
    return NextResponse.json(
      { message: "Invalid category information." },
      { status: 400 }
    );
  }

  return forward("PUT", id, payload);
}

export async function PATCH(
  request: Request,
  { params }: Context
) {
  const { id: rawId } = await params;
  const id = checkId(rawId);

  if (!id) {
    return NextResponse.json(
      { message: "Invalid category ID." },
      { status: 400 }
    );
  }

  let data: unknown;

  try {
    data = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    typeof (data as Record<string, unknown>).isActive !== "boolean"
  ) {
    return NextResponse.json(
      { message: "isActive must be a boolean." },
      { status: 400 }
    );
  }

  const active = (data as { isActive: boolean }).isActive;

  return forward("PATCH", id, undefined, active);
}
