
import {
  invalidAdminRoute,
  parsePositiveId,
  proxyAdminApi,
} from "@/lib/adminApiProxy";

type Context = {
  params: Promise<{ parts: string[] }>;
};

function parseUserCourse(parts: string[]) {
  if (
    parts.length !== 4 ||
    parts[0] !== "users" ||
    parts[2] !== "courses"
  ) {
    return null;
  }

  const userId = parsePositiveId(parts[1]);
  const courseId = parsePositiveId(parts[3]);

  if (!userId || !courseId) return null;

  return { userId, courseId };
}


export async function GET(
  _request: Request,
  { params }: Context
) {
  const { parts } = await params;

  // Get one enrollment by ID
  if (parts.length === 1) {
    const id = parsePositiveId(parts[0]);

    if (!id) return invalidAdminRoute();

    return proxyAdminApi(
      "GET",
      `/api/admin/enrollments/${id}`
    );
  }

  // Get all enrollments of one user
  if (parts.length === 2 && parts[0] === "users") {
    const userId = parsePositiveId(parts[1]);

    if (!userId) return invalidAdminRoute();

    return proxyAdminApi(
      "GET",
      `/api/admin/enrollments/users/${userId}`
    );
  }

  // Get enrollment by user and course
  const pair = parseUserCourse(parts);

  if (!pair) return invalidAdminRoute();

  return proxyAdminApi(
    "GET",
    `/api/admin/enrollments/users/${pair.userId}/courses/${pair.courseId}`
  );
}


export async function POST(
  _request: Request,
  { params }: Context
) {
  const { parts } = await params;
  const pair = parseUserCourse(parts);

  if (!pair) return invalidAdminRoute();

  // The ASP.NET Core endpoint takes path parameters only.
  return proxyAdminApi(
    "POST",
    `/api/admin/enrollments/users/${pair.userId}/courses/${pair.courseId}`
  );
}

export async function PATCH(
  _request: Request,
  { params }: Context
) {
  const { parts } = await params;

  if (parts.length !== 2) return invalidAdminRoute();

  const id = parsePositiveId(parts[0]);
  const action = parts[1];

  if (
    !id ||
    (action !== "cancel" && action !== "reactivate")
  ) {
    return invalidAdminRoute();
  }

  return proxyAdminApi(
    "PATCH",
    `/api/admin/enrollments/${id}/${action}`
  );
}
