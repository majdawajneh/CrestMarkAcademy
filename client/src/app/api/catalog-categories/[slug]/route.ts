
import { NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

type Context = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  _request: Request,
  { params }: Context
) {
  const { slug } = await params;

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug) ||
    slug.length > 120
  ) {
    return NextResponse.json(
      { message: "Invalid category slug." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/categories/${encodeURIComponent(slug)}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }
    );

    if (response.status === 404) {
      return NextResponse.json(
        { message: "Category not found." },
        { status: 404 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: "Unable to load category." },
        { status: 502 }
      );
    }

    const data: unknown = await response.json();

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json(
        { message: "Invalid category response." },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "Category service unavailable." },
      { status: 502 }
    );
  }
}
