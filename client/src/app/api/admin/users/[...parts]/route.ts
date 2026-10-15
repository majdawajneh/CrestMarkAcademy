
import {
  invalidAdminRoute,
  parsePositiveId,
  proxyAdminApi,
} from "@/lib/adminApiProxy";

type Context = {
  params: Promise<{ parts: string[] }>;
};

export async function GET(
  _request: Request,
  { params }: Context
) {
  const { parts } = await params;

  if (parts.length !== 1) return invalidAdminRoute();

  const id = parsePositiveId(parts[0]);
  if (!id) return invalidAdminRoute();

  return proxyAdminApi("GET", `/api/admin/users/${id}`);
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
    !["activate", "deactivate", "instructor"].includes(action)
  ) {
    return invalidAdminRoute();
  }

  return proxyAdminApi(
    "PATCH",
    `/api/admin/users/${id}/${action}`
  );
}

export async function DELETE(
  _request: Request,
  { params }: Context
) {
  const { parts } = await params;

  if (parts.length !== 2) return invalidAdminRoute();

  const id = parsePositiveId(parts[0]);

  if (!id || parts[1] !== "instructor") {
    return invalidAdminRoute();
  }

  // Deletes the Instructor role, NOT the user's account.
  return proxyAdminApi(
    "DELETE",
    `/api/admin/users/${id}/instructor`
  );
}
