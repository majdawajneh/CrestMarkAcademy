
import {
  invalidAdminRoute,
  parsePositiveId,
  proxyAdminApi,
} from "@/lib/adminApiProxy";

type Context = {
  params: Promise<{
    id: string;
    action: string;
  }>;
};

export async function PATCH(
  _request: Request,
  { params }: Context
) {
  const { id: rawId, action } = await params;
  const id = parsePositiveId(rawId);

  if (
    !id ||
    (action !== "activate" && action !== "deactivate")
  ) {
    return invalidAdminRoute();
  }

  return proxyAdminApi(
    "PATCH",
    `/api/admin/coupons/${id}/${action}`
  );
}
