
import { NextRequest, NextResponse } from "next/server";

const API_URL = (
  process.env.API_BASE_URL || "http://localhost:5299"
).replace(/\/+$/, "");

const noStore = { "Cache-Control": "no-store" };

function fail(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: noStore }
  );
}

type Category = {
  id: number;
  name: string;
  isActive: boolean;
};

type AdminUser = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  isActive: boolean;
  roles: string[];
};

function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "number" &&
    typeof item.name === "string" &&
    typeof item.isActive === "boolean"
  );
}

function isAdminUser(value: unknown): value is AdminUser {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "number" &&
    typeof item.firstName === "string" &&
    typeof item.lastName === "string" &&
    typeof item.username === "string" &&
    typeof item.isActive === "boolean" &&
    Array.isArray(item.roles) &&
    item.roles.every((role) => typeof role === "string")
  );
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("cm_access")?.value;

  if (!token) {
    return fail("Authentication required.", 401);
  }

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    const authResponse = await fetch(`${API_URL}/api/Auth/me`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (authResponse.status === 401) {
      return fail("Session expired.", 401);
    }

    if (!authResponse.ok) {
      return fail("Unable to verify administrator permissions.", 502);
    }

    const identity: unknown = await authResponse.json();

    if (!identity || typeof identity !== "object") {
      return fail("Invalid authentication response.", 502);
    }

    const roles = (identity as { roles?: unknown }).roles;

    if (!Array.isArray(roles) || !roles.includes("Admin")) {
      return fail("Administrator access required.", 403);
    }

    const [categoriesResponse, usersResponse] = await Promise.all([
      fetch(`${API_URL}/api/Categories`, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }),
      fetch(`${API_URL}/api/admin/users`, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }),
    ]);

    if (
      categoriesResponse.status === 401 ||
      usersResponse.status === 401
    ) {
      return fail("Session expired.", 401);
    }

    if (
      categoriesResponse.status === 403 ||
      usersResponse.status === 403
    ) {
      return fail("Access denied.", 403);
    }

    if (!categoriesResponse.ok || !usersResponse.ok) {
      return fail("Unable to load form options.", 502);
    }

    const categoriesData: unknown = await categoriesResponse.json();
    const usersData: unknown = await usersResponse.json();

    if (
      !Array.isArray(categoriesData) ||
      !categoriesData.every(isCategory) ||
      !Array.isArray(usersData) ||
      !usersData.every(isAdminUser)
    ) {
      return fail("Invalid form options response.", 502);
    }

    const categories = (categoriesData as Category[])
      .filter((category) => category.isActive)
      .map(({ id, name }) => ({ id, name }));

    const instructors = (usersData as AdminUser[])
      .filter(
        (user) =>
          user.isActive &&
          user.roles.includes("Instructor")
      )
      .map((user) => ({
        id: user.id,
        name:
          `${user.firstName} ${user.lastName}`.trim() ||
          user.username,
        username: user.username,
      }));

    return NextResponse.json(
      { categories, instructors },
      { headers: noStore }
    );
  } catch {
    return fail("Unable to connect to the backend.", 502);
  }
}
