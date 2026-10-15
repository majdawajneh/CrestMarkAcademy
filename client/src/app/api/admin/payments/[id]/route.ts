
import {
  invalidAdminRoute,
  parsePositiveId,
  proxyAdminApi,
} from "@/lib/adminApiProxy";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: Context
) {
  const { id: rawId } = await params;
  const id = parsePositiveId(rawId);

  if (!id) {
    return invalidAdminRoute();
  }

  return proxyAdminApi(
    "GET",
    `/api/admin/payments/${id}`
  );
}
